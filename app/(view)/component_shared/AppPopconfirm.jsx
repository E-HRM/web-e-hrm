'use client';

import React, { useCallback, useMemo, useState } from 'react';
import { Popconfirm } from 'antd';
import { ExclamationCircleOutlined } from '@ant-design/icons';
import clsx from 'classnames';
import AppTypography from './AppTypography';
import { fontFamily } from './Font';

const TONES = {
  dark: '#0f172a',
  primary: '#003A6F',
  success: '#10B981',
  warning: '#F59E0B',
  danger: '#EF4444',
  info: '#3B82F6',
};

function resolveOkText(variant, okText) {
  if (okText) return okText;
  if (variant === 'danger') return 'Hapus';
  return 'Ya';
}

function resolveCancelText(cancelText) {
  return cancelText || 'Batal';
}

function resolveIcon(variant, icon) {
  if (icon === null) return null;
  if (icon) return icon;

  return (
    <ExclamationCircleOutlined
      style={{
        color: TONES[variant] || TONES.primary,
      }}
    />
  );
}

function mergeButtonProps(base, extra) {
  return { ...(base || {}), ...(extra || {}) };
}

function BasePopconfirm({
  children,

  variant = 'primary', // primary | danger | warning | success | info | dark
  title,
  description,

  okText,
  cancelText,

  icon,
  placement = 'top',
  trigger = 'click',

  disabled = false,
  stopPropagation = true,

  // async aware
  onConfirm,
  onCancel,

  // controlled/uncontrolled open
  open,
  defaultOpen,
  onOpenChange,

  // antd passthrough
  okButtonProps,
  cancelButtonProps,
  overlayClassName,
  overlayStyle,

  // extras
  okAutoFocus = true,

  ...props
}) {
  const [internalLoading, setInternalLoading] = useState(false);
  const resolvedOkText = resolveOkText(variant, okText);
  const resolvedCancelText = resolveCancelText(cancelText);
  const resolvedIcon = resolveIcon(variant, icon);

  const mergedOverlayClassName = useMemo(() => {
    return clsx('sp-popconfirm', overlayClassName);
  }, [overlayClassName]);

  const handleConfirm = useCallback(
    async (e) => {
      if (stopPropagation) {
        e?.stopPropagation?.();
        e?.preventDefault?.();
      }
      if (!onConfirm) return;

      try {
        const ret = onConfirm(e);
        if (ret && typeof ret.then === 'function') {
          setInternalLoading(true);
          await ret;
        }
      } finally {
        setInternalLoading(false);
      }
    },
    [onConfirm, stopPropagation]
  );

  const handleCancel = useCallback(
    (e) => {
      if (stopPropagation) {
        e?.stopPropagation?.();
        e?.preventDefault?.();
      }
      if (onCancel) onCancel(e);
    },
    [onCancel, stopPropagation]
  );

  const themedOkButtonProps = useMemo(() => {
    const tone = TONES[variant] || TONES.primary;

    const base =
      variant === 'danger'
        ? { danger: true }
        : {
            style: { backgroundColor: tone, borderColor: tone, color: '#fff' },
          };

    const loading = { loading: internalLoading, disabled: internalLoading };

    return mergeButtonProps(mergeButtonProps(base, loading), okButtonProps);
  }, [variant, okButtonProps, internalLoading]);

  const themedCancelButtonProps = useMemo(() => {
    const loading = { disabled: internalLoading };
    return mergeButtonProps(loading, cancelButtonProps);
  }, [cancelButtonProps, internalLoading]);

  const contentNode = useMemo(() => {
    const hasTitle = Boolean(title);
    const hasDesc = Boolean(description);

    if (!hasTitle && !hasDesc) return null;

    return (
      <div className='min-w-[220px] max-w-[360px]'>
        {hasTitle ? (
          <AppTypography.Text
            weight={700}
            className='text-slate-900'
          >
            {title}
          </AppTypography.Text>
        ) : null}

        {hasDesc ? (
          <div className={clsx(hasTitle ? 'mt-1' : '')}>
            <AppTypography.Text
              size={12}
              tone='muted'
              className='text-slate-600'
            >
              {description}
            </AppTypography.Text>
          </div>
        ) : null}
      </div>
    );
  }, [title, description]);

  if (disabled) return <>{children}</>;

  return (
    <>
      <Popconfirm
        {...props}
        placement={placement}
        trigger={trigger}
        title={contentNode}
        icon={resolvedIcon}
        okText={resolvedOkText}
        cancelText={resolvedCancelText}
        okAutoFocus={okAutoFocus}
        onConfirm={handleConfirm}
        onCancel={handleCancel}
        open={open}
        defaultOpen={defaultOpen}
        onOpenChange={onOpenChange}
        okButtonProps={themedOkButtonProps}
        cancelButtonProps={themedCancelButtonProps}
        overlayClassName={mergedOverlayClassName}
        overlayStyle={overlayStyle}
      >
        {children}
      </Popconfirm>

      <style
        jsx
        global
      >{`
        .sp-popconfirm,
        .sp-popconfirm * {
          font-family: ${fontFamily};
        }

        .sp-popconfirm .ant-popover-inner {
          border-radius: 14px;
        }

        .sp-popconfirm .ant-popconfirm-message {
          gap: 10px;
        }

        .sp-popconfirm .ant-popconfirm-title {
          margin-bottom: 0;
        }

        .sp-popconfirm .ant-popconfirm-buttons .ant-btn {
          border-radius: 10px;
        }
      `}</style>
    </>
  );
}

function DeletePopconfirm({ title = 'Hapus data?', description = 'Aksi ini tidak bisa dibatalkan.', okText = 'Hapus', cancelText = 'Batal', ...props }) {
  return (
    <BasePopconfirm
      {...props}
      variant='danger'
      title={title}
      description={description}
      okText={okText}
      cancelText={cancelText}
    />
  );
}

const AppPopconfirm = Object.assign(BasePopconfirm, { Delete: DeletePopconfirm });

export default AppPopconfirm;
