'use client';

import React, { useCallback, useMemo, useState } from 'react';
import { Modal } from 'antd';
import { CloseOutlined } from '@ant-design/icons';
import { fontFamily } from './Font';
import AppButton from './AppButton';
import AppSpace from './AppSpace';
import AppTypography from './AppTypography';

function cx(...parts) {
  return parts.filter(Boolean).join(' ');
}

export default function AppModal({
  open,
  onClose,
  onCancel,

  title,
  subtitle,
  headerExtra,

  variant = 'default',
  okText = 'Simpan',
  cancelText = 'Batal',

  onOk,
  closeOnOk = true,

  okLoading,
  okDisabled,
  cancelDisabled,

  okButtonProps,
  cancelButtonProps,

  footer,

  width = 560,
  centered = true,
  destroyOnClose = true,
  maskClosable = false,
  closable = true,

  className,
  wrapClassName,
  bodyStyle,
  styles,
  children,

  ...rest
}) {
  const [internalOkLoading, setInternalOkLoading] = useState(false);
  const effectiveOkLoading = typeof okLoading === 'boolean' ? okLoading : internalOkLoading;

  const close = useCallback(() => {
    if (typeof onCancel === 'function') onCancel();
    if (typeof onClose === 'function') onClose();
  }, [onCancel, onClose]);

  const handleCancel = useCallback(() => {
    if (cancelDisabled || effectiveOkLoading) return;
    close();
  }, [cancelDisabled, effectiveOkLoading, close]);

  const handleOk = useCallback(async () => {
    if (okDisabled || effectiveOkLoading) return;

    if (typeof onOk !== 'function') {
      if (closeOnOk) close();
      return;
    }

    let shouldClose = closeOnOk;

    const run = async () => {
      const res = await onOk();
      if (res === false) shouldClose = false;
    };

    if (typeof okLoading === 'boolean') {
      await run();
    } else {
      setInternalOkLoading(true);
      try {
        await run();
      } finally {
        setInternalOkLoading(false);
      }
    }

    if (shouldClose) close();
  }, [okDisabled, effectiveOkLoading, onOk, closeOnOk, close, okLoading]);

  const headerNode = useMemo(() => {
    if (!title && !subtitle && !headerExtra) return null;

    return (
      <div className='sp-modal-title-wrap'>
        <div className='sp-modal-title-left'>
          {title ? (
            <AppTypography.Title
              level={5}
              className='sp-modal-title'
            >
              {title}
            </AppTypography.Title>
          ) : null}

          {subtitle ? <AppTypography.Text className='sp-modal-subtitle'>{subtitle}</AppTypography.Text> : null}
        </div>

        {headerExtra ? <div className='sp-modal-title-extra'>{headerExtra}</div> : null}
      </div>
    );
  }, [title, subtitle, headerExtra]);

  const footerNode = useMemo(() => {
    if (footer === false || footer === null) return null;
    if (typeof footer === 'function') return footer({ close, handleOk, handleCancel, okLoading: effectiveOkLoading });
    if (footer) return footer;

    return (
      <AppSpace justify='end'>
        <AppButton
          variant='secondary'
          onClick={handleCancel}
          disabled={cancelDisabled || effectiveOkLoading}
          {...cancelButtonProps}
        >
          {cancelText}
        </AppButton>

        <AppButton
          variant={variant === 'danger' ? 'danger' : 'primary'}
          onClick={handleOk}
          loading={effectiveOkLoading}
          disabled={okDisabled}
          {...okButtonProps}
        >
          {okText}
        </AppButton>
      </AppSpace>
    );
  }, [footer, close, handleOk, handleCancel, effectiveOkLoading, cancelText, okText, variant, okDisabled, cancelDisabled, okButtonProps, cancelButtonProps]);

  const mergedStyles = useMemo(() => {
    return {
      body: {
        paddingTop: 16,
        ...(styles?.body || {}),
      },
      ...styles,
    };
  }, [styles]);

  const mergedBodyStyle = useMemo(() => {
    return {
      ...(bodyStyle || {}),
    };
  }, [bodyStyle]);

  const closeIconNode = useMemo(() => {
    if (!closable) return null;
    return (
      <span
        className='sp-modal-close-icon'
        aria-label='Close'
      >
        <CloseOutlined />
      </span>
    );
  }, [closable]);

  return (
    <>
      <Modal
        open={open}
        onCancel={handleCancel}
        footer={footerNode}
        title={headerNode}
        width={width}
        centered={centered}
        destroyOnClose={destroyOnClose}
        maskClosable={maskClosable}
        closeIcon={closeIconNode}
        closable={closable}
        className={cx('sp-modal', className, variant === 'danger' ? 'sp-modal--danger' : '')}
        wrapClassName={cx('sp-modal-wrap', wrapClassName)}
        styles={mergedStyles}
        bodyStyle={mergedBodyStyle}
        {...rest}
      >
        {children}
      </Modal>

      <style
        jsx
        global
      >{`
        .sp-modal .ant-modal-content {
          border-radius: 18px;
          overflow: hidden;
        }

        .sp-modal .ant-modal-header {
          margin-bottom: 0;
          padding: 18px 20px 0 20px;
          border-bottom: 0;
          background: transparent;
        }

        .sp-modal .ant-modal-title {
          font-family: ${fontFamily};
        }

        .sp-modal .ant-modal-body {
          padding: 16px 20px 18px 20px;
          font-family: ${fontFamily};
        }

        .sp-modal .ant-modal-footer {
          padding: 0 20px 18px 20px;
          border-top: 0;
          background: transparent;
          font-family: ${fontFamily};
        }

        .sp-modal-title-wrap {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 12px;
        }

        .sp-modal-title-left {
          min-width: 0;
        }

        .sp-modal-title {
          margin: 0;
          line-height: 1.2;
        }

        .sp-modal-subtitle {
          display: block;
          margin-top: 6px;
          opacity: 0.72;
        }

        .sp-modal-title-extra {
          flex: 0 0 auto;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .sp-modal-close-icon {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 30px;
          height: 30px;
          border-radius: 10px;
          transition: background 0.15s ease;
        }

        .sp-modal-close-icon:hover {
          background: rgba(0, 0, 0, 0.06);
        }

        .sp-modal--danger .ant-modal-title .sp-modal-title {
          color: #b42318;
        }

        .sp-modal-confirm .ant-modal-content {
          border-radius: 18px;
          overflow: hidden;
          font-family: ${fontFamily};
        }

        .sp-modal-confirm .ant-modal-confirm-btns {
          display: flex;
          gap: 10px;
          justify-content: flex-end;
        }

        .sp-modal-confirm .ant-modal-confirm-btns .ant-btn {
          border-radius: 12px;
          font-family: ${fontFamily};
        }
      `}</style>
    </>
  );
}

export function AppConfirm(options = {}) {
  const {
    title = 'Konfirmasi',
    content = 'Apakah Anda yakin?',
    danger = false,
    okText = 'Ya',
    cancelText = 'Batal',
    okButtonProps,
    cancelButtonProps,
    maskClosable = true,
    centered = true,
    width = 420,
    zIndex,
    keyboard = true,
    icon,
    className,
    onOk,
    onCancel,
    ...rest
  } = options;

  const mergedOkButtonProps = {
    ...(okButtonProps || {}),
    danger: Boolean(danger || okButtonProps?.danger),
  };

  const mergedCancelButtonProps = {
    ...(cancelButtonProps || {}),
  };

  return Modal.confirm({
    title,
    content,
    icon,
    okText,
    cancelText,
    okType: danger ? 'danger' : 'primary',
    okButtonProps: mergedOkButtonProps,
    cancelButtonProps: mergedCancelButtonProps,
    maskClosable,
    centered,
    width,
    zIndex,
    keyboard,
    className: cx('sp-modal-confirm', className),
    onOk,
    onCancel,
    ...rest,
  });
}
