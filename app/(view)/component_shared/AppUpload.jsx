'use client';

import React, { useCallback, useMemo, useState } from 'react';
import { Upload, Modal } from 'antd';
import { InboxOutlined, UploadOutlined } from '@ant-design/icons';
import clsx from 'classnames';
import AppButton from './AppButton';
import AppTypography from './AppTypography';
import AppMessage from './AppMessage';
import { fontFamily } from './Font';

function cx(...parts) {
  return parts.filter(Boolean).join(' ');
}

function isPlainObject(v) {
  return v != null && typeof v === 'object' && !Array.isArray(v);
}

function getNameFromUrl(url) {
  try {
    const u = new URL(url);
    const pathname = u.pathname || '';
    const last = pathname.split('/').filter(Boolean).pop();
    return last || 'file';
  } catch {
    const last = String(url || '')
      .split('/')
      .filter(Boolean)
      .pop();
    return last || 'file';
  }
}

async function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = (e) => reject(e);
    reader.readAsDataURL(file);
  });
}

function extractUrlFromResponse(response, getUrlFromResponse) {
  if (!response) return undefined;

  if (typeof getUrlFromResponse === 'function') {
    try {
      return getUrlFromResponse(response);
    } catch {
      return undefined;
    }
  }

  if (typeof response === 'string') return response;
  if (!isPlainObject(response)) return undefined;

  return response.url || response.location || response.path || response.fileUrl || response?.data?.url || response?.data?.fileUrl || response?.result?.url;
}

export function uploadValueFromEvent(e) {
  if (Array.isArray(e)) return e;
  return e?.fileList;
}

/**
 * AppUpload - wrapper AntD Upload yang lebih reusable:
 * - trigger default pakai AppButton (bisa diganti via children)
 * - validasi ukuran file (maxSizeMB / maxSizeBytes)
 * - mendukung custom upload function (uploadFn) via customRequest
 * - preview gambar via Modal
 * - bisa dipakai controlled via fileList (AntD style) atau via value + valueType ('url'/'urls'/'fileList')
 *
 * Catatan:
 * - Jika dipakai di AntD Form, biasanya gunakan valuePropName='fileList' dan getValueFromEvent={uploadValueFromEvent}
 */
export default function AppUpload({
  className,
  wrapperClassName,

  label,
  required,
  hint,
  error,
  extra,
  labelClassName,
  messageClassName,

  dragger = false,
  draggerTitle = 'Klik atau tarik file ke area ini',
  draggerSubtitle = 'Mendukung upload sekali / banyak sesuai pengaturan',
  draggerIcon,

  buttonText = 'Upload',
  buttonVariant = 'outline',
  buttonIcon,
  buttonProps,

  children,

  // AntD Upload props (sebagian umum)
  accept,
  multiple,
  maxCount,
  disabled,
  listType = 'text',
  showUploadList = true,

  action,
  headers,
  data,
  withCredentials,
  method,
  name,
  openFileDialogOnClick,
  capture,

  // value handling (opsional)
  fileList,
  value,
  valueType = 'fileList', // fileList | url | urls
  onValueChange,
  getUrlFromResponse,

  // validation
  maxSizeMB,
  maxSizeBytes,

  // hooks
  beforeUpload,
  onChange,
  onRemove,
  onPreview,

  // upload function (opsional)
  uploadFn,

  // misc
  ...rest
}) {
  const effectiveMaxSizeBytes = useMemo(() => {
    if (typeof maxSizeBytes === 'number') return maxSizeBytes;
    if (typeof maxSizeMB === 'number') return Math.round(maxSizeMB * 1024 * 1024);
    return undefined;
  }, [maxSizeBytes, maxSizeMB]);

  const normalizedFileList = useMemo(() => {
    if (Array.isArray(fileList)) return fileList;

    if (valueType === 'fileList') {
      return Array.isArray(value) ? value : undefined;
    }

    if (valueType === 'url') {
      if (!value) return [];
      const url = String(value);
      return [
        {
          uid: url,
          name: getNameFromUrl(url),
          status: 'done',
          url,
        },
      ];
    }

    if (valueType === 'urls') {
      if (!Array.isArray(value)) return [];
      return value.filter(Boolean).map((u) => {
        const url = String(u);
        return {
          uid: url,
          name: getNameFromUrl(url),
          status: 'done',
          url,
        };
      });
    }

    return undefined;
  }, [fileList, value, valueType]);

  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewSrc, setPreviewSrc] = useState('');
  const [previewTitle, setPreviewTitle] = useState('');

  const validateBeforeUpload = useCallback(
    async (file, fileListFromEvent) => {
      if (disabled) return Upload.LIST_IGNORE;

      if (effectiveMaxSizeBytes && file?.size != null && file.size > effectiveMaxSizeBytes) {
        const mb = Math.max(0.1, Math.round((effectiveMaxSizeBytes / (1024 * 1024)) * 10) / 10);
        AppMessage.error(`Ukuran file melebihi ${mb} MB`);
        return Upload.LIST_IGNORE;
      }

      if (typeof beforeUpload === 'function') {
        return beforeUpload(file, fileListFromEvent);
      }

      return true;
    },
    [beforeUpload, disabled, effectiveMaxSizeBytes]
  );

  const handleCustomRequest = useCallback(
    async (options) => {
      const { file, onError, onProgress, onSuccess } = options;

      if (typeof uploadFn !== 'function') {
        onError?.(new Error('uploadFn is not provided'));
        return;
      }

      try {
        const result = await uploadFn(file, {
          onProgress: (percent) => {
            if (typeof percent === 'number') {
              onProgress?.({ percent }, file);
            }
          },
        });

        onSuccess?.(result, file);
      } catch (err) {
        onError?.(err);
      }
    },
    [uploadFn]
  );

  const emitValueChange = useCallback(
    (info) => {
      if (typeof onValueChange !== 'function') return;
      const nextFileList = info?.fileList || [];

      if (valueType === 'fileList') {
        onValueChange(nextFileList, info);
        return;
      }

      const urls = nextFileList.map((f) => f?.url || extractUrlFromResponse(f?.response, getUrlFromResponse)).filter(Boolean);

      if (valueType === 'url') {
        onValueChange(urls[0] ?? null, info);
        return;
      }

      if (valueType === 'urls') {
        onValueChange(urls, info);
      }
    },
    [getUrlFromResponse, onValueChange, valueType]
  );

  const handleChange = useCallback(
    (info) => {
      onChange?.(info);
      emitValueChange(info);
    },
    [emitValueChange, onChange]
  );

  const handlePreview = useCallback(
    async (file) => {
      if (typeof onPreview === 'function') {
        onPreview(file);
        return;
      }

      const isImage = file?.type?.startsWith?.('image/') || file?.thumbUrl || String(file?.url || '').match(/\.(png|jpe?g|gif|webp|bmp|svg)(\?|$)/i);

      if (!isImage) {
        const url = file?.url || extractUrlFromResponse(file?.response, getUrlFromResponse);
        if (url) {
          window.open(url, '_blank', 'noopener,noreferrer');
          return;
        }
        AppMessage.info('File tidak memiliki URL preview');
        return;
      }

      let src = file?.url || file?.thumbUrl || extractUrlFromResponse(file?.response, getUrlFromResponse);

      if (!src && file?.originFileObj) {
        try {
          src = await fileToBase64(file.originFileObj);
        } catch {
          src = '';
        }
      }

      if (!src) {
        AppMessage.info('Gagal menampilkan preview gambar');
        return;
      }

      setPreviewSrc(src);
      setPreviewOpen(true);
      setPreviewTitle(file?.name || 'Preview');
    },
    [getUrlFromResponse, onPreview]
  );

  const Uploader = dragger ? Upload.Dragger : Upload;

  const uploadProps = {
    accept,
    multiple,
    maxCount,
    disabled,
    listType,
    showUploadList,

    action,
    headers,
    data,
    withCredentials,
    method,
    name,
    openFileDialogOnClick,
    capture,

    fileList: normalizedFileList,

    beforeUpload: validateBeforeUpload,
    onChange: handleChange,
    onRemove,
    onPreview: handlePreview,

    customRequest: typeof uploadFn === 'function' ? handleCustomRequest : undefined,

    ...rest,
  };

  const triggerNode = useMemo(() => {
    if (children) return children;

    if (dragger) {
      const iconNode = draggerIcon ?? <InboxOutlined className='text-3xl text-slate-600' />;

      return (
        <div className='py-3'>
          <div className='mb-2 flex items-center justify-center'>{iconNode}</div>
          <AppTypography.Text
            size={14}
            weight={700}
            className='text-slate-800 text-center'
          >
            {draggerTitle}
          </AppTypography.Text>
          <div className='mt-1'>
            <AppTypography.Text
              size={12}
              tone='muted'
              className='text-slate-500 text-center'
            >
              {draggerSubtitle}
            </AppTypography.Text>
          </div>
        </div>
      );
    }

    return (
      <AppButton
        variant={buttonVariant}
        icon={buttonIcon ?? <UploadOutlined />}
        disabled={disabled}
        {...buttonProps}
      >
        {buttonText}
      </AppButton>
    );
  }, [buttonIcon, buttonProps, buttonText, buttonVariant, children, disabled, dragger, draggerIcon, draggerSubtitle, draggerTitle]);

  const hasTop = Boolean(label) || Boolean(extra);
  const hasMsg = Boolean(error) || Boolean(hint);

  return (
    <div className={cx('w-full', wrapperClassName)}>
      {hasTop && (
        <div className='mb-1.5 flex items-start justify-between gap-3'>
          {label ? (
            <div className='min-w-0'>
              <AppTypography.Text
                size={12}
                weight={600}
                className={clsx('text-gray-700', labelClassName)}
              >
                {label}
                {required ? <span className='ml-1 text-rose-600'>*</span> : null}
              </AppTypography.Text>
            </div>
          ) : (
            <span />
          )}

          {extra ? <div className='shrink-0'>{extra}</div> : null}
        </div>
      )}

      <div className={className}>
        <Uploader {...uploadProps}>{triggerNode}</Uploader>
      </div>

      {hasMsg && (
        <div className='mt-1.5'>
          {error ? (
            <AppTypography.Text
              size={12}
              weight={500}
              className={clsx('text-rose-600', messageClassName)}
            >
              {error}
            </AppTypography.Text>
          ) : (
            <AppTypography.Text
              size={12}
              tone='muted'
              className={clsx('text-gray-500', messageClassName)}
            >
              {hint}
            </AppTypography.Text>
          )}
        </div>
      )}

      <Modal
        open={previewOpen}
        title={previewTitle}
        footer={null}
        onCancel={() => setPreviewOpen(false)}
        width={720}
        styles={{ body: { padding: 0 } }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          alt={previewTitle}
          src={previewSrc}
          className='w-full h-auto block'
        />
      </Modal>

      <style
        jsx
        global
      >{`
        .ant-upload,
        .ant-upload *,
        .ant-upload-list,
        .ant-upload-list *,
        .ant-modal,
        .ant-modal * {
          font-family: ${fontFamily};
        }
        .ant-upload-wrapper .ant-upload-drag {
          border-radius: 16px;
        }
        .ant-upload-wrapper .ant-upload-list-item {
          border-radius: 12px;
        }
      `}</style>
    </div>
  );
}
