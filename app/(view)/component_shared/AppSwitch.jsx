// app/(view)/component_shared/AppSwitch.jsx
'use client';

import React, { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';
import { Switch } from 'antd';
import clsx from 'classnames';
import AppTypography from './AppTypography';
import { fontFamily } from './Font';
import { AppConfirm } from './AppModal';

const TONE_COLORS = {
  primary: '#003A6F',
  info: '#3B82F6',
  success: '#10B981',
  warning: '#F59E0B',
  danger: '#EF4444',
  neutral: '#64748B',
};

function FieldShell({ label, required, hint, error, extra, description, className, labelClassName, messageClassName, children }) {
  const hasTop = Boolean(label) || Boolean(extra);
  const hasMsg = Boolean(error) || Boolean(hint);

  return (
    <div className={clsx('w-full', className)}>
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
              {description ? (
                <AppTypography.Text
                  size={12}
                  tone='muted'
                  className='mt-0.5 block'
                >
                  {description}
                </AppTypography.Text>
              ) : null}
            </div>
          ) : (
            <span />
          )}

          {extra ? <div className='shrink-0'>{extra}</div> : null}
        </div>
      )}

      {children}

      {hasMsg && (
        <div className='mt-1.5'>
          {error ? (
            <AppTypography.Text
              size={12}
              className={clsx('text-rose-600', messageClassName)}
            >
              {error}
            </AppTypography.Text>
          ) : hint ? (
            <AppTypography.Text
              size={12}
              tone='muted'
              className={clsx(messageClassName)}
            >
              {hint}
            </AppTypography.Text>
          ) : null}
        </div>
      )}
    </div>
  );
}

function isPromiseLike(v) {
  return v && typeof v === 'object' && typeof v.then === 'function';
}

async function runConfirm({ title, content, okText, cancelText, danger, maskClosable }) {
  return await new Promise((resolve) => {
    AppConfirm({
      title: title ?? 'Konfirmasi',
      content: content ?? 'Apakah Anda yakin?',
      okText: okText ?? 'Ya',
      cancelText: cancelText ?? 'Batal',
      danger: Boolean(danger),
      maskClosable: maskClosable ?? true,
      onOk: () => resolve(true),
      onCancel: () => resolve(false),
    });
  });
}

export default function AppSwitch(props) {
  const {
    label,
    required,
    hint,
    error,
    extra,
    description,
    className,
    labelClassName,
    messageClassName,

    tone = 'primary',
    labelPlacement = 'top',

    checkedLabel,
    uncheckedLabel,
    showStateLabel = true,

    confirm,
    beforeChange,

    onChange,
    loading,
    disabled,

    checked,
    defaultChecked,

    classNames,
    ...rest
  } = props;

  const uid = useId();
  const toneKey = tone && TONE_COLORS[tone] ? tone : null;

  const isControlled = typeof checked === 'boolean';
  const [innerChecked, setInnerChecked] = useState(Boolean(defaultChecked));
  const currentChecked = isControlled ? checked : innerChecked;

  const mountedRef = useRef(true);
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const [pending, setPending] = useState(false);
  const resolvedLoading = Boolean(loading) || pending;
  const resolvedDisabled = Boolean(disabled) || resolvedLoading;

  const toneClass = toneKey ? `sp-switch-tone-${toneKey}` : 'sp-switch-tone-none';

  const shouldConfirm = useMemo(() => {
    if (!confirm) return () => false;
    if (confirm === true) return () => true;

    const when = confirm.when ?? 'always';
    if (typeof when === 'function') return when;

    if (when === 'enable') return (next) => next === true;
    if (when === 'disable') return (next) => next === false;
    return () => true;
  }, [confirm]);

  const resolvedConfirm = useMemo(() => {
    if (!confirm || confirm === true) return {};
    return confirm;
  }, [confirm]);

  const stateNode = useMemo(() => {
    if (!showStateLabel) return null;
    const node = currentChecked ? checkedLabel : uncheckedLabel;
    if (node == null) return null;
    return (
      <AppTypography.Text
        size={12}
        tone='muted'
        className='select-none'
      >
        {node}
      </AppTypography.Text>
    );
  }, [showStateLabel, currentChecked, checkedLabel, uncheckedLabel]);

  const handleChange = useCallback(
    async (nextChecked) => {
      if (resolvedDisabled) return;

      const allowByBefore = typeof beforeChange === 'function' ? await beforeChange(nextChecked, currentChecked) : true;

      if (!allowByBefore) {
        if (!isControlled) setInnerChecked(currentChecked);
        return;
      }

      if (shouldConfirm(nextChecked)) {
        const ok = await runConfirm({
          title: typeof resolvedConfirm.title === 'function' ? resolvedConfirm.title(nextChecked) : resolvedConfirm.title,
          content: typeof resolvedConfirm.content === 'function' ? resolvedConfirm.content(nextChecked) : resolvedConfirm.content,
          okText: resolvedConfirm.okText,
          cancelText: resolvedConfirm.cancelText,
          danger: resolvedConfirm.danger,
          maskClosable: resolvedConfirm.maskClosable,
        });

        if (!ok) {
          if (!isControlled) setInnerChecked(currentChecked);
          return;
        }
      }

      try {
        const res = onChange?.(nextChecked);
        if (isPromiseLike(res)) {
          setPending(true);
          await res;
        }
        if (!mountedRef.current) return;
        if (!isControlled) setInnerChecked(nextChecked);
      } catch (e) {
        if (!mountedRef.current) return;
        if (!isControlled) setInnerChecked(currentChecked);
        throw e;
      } finally {
        if (mountedRef.current) setPending(false);
      }
    },
    [beforeChange, currentChecked, isControlled, onChange, resolvedConfirm, resolvedDisabled, shouldConfirm]
  );

  const switchNode = (
    <div className={clsx('flex items-center gap-2', labelPlacement === 'left' ? 'justify-between' : 'justify-start', classNames?.container)}>
      <Switch
        {...rest}
        checked={isControlled ? checked : innerChecked}
        defaultChecked={undefined}
        onChange={handleChange}
        disabled={resolvedDisabled}
        loading={resolvedLoading}
        className={clsx('sp-switch', toneClass, classNames?.switch, rest?.className)}
        style={{
          fontFamily,
          ...(rest?.style || {}),
        }}
        aria-labelledby={`${uid}-label`}
        aria-describedby={`${uid}-desc`}
      />
      {stateNode ? <div className={clsx('shrink-0', classNames?.state)}>{stateNode}</div> : null}
    </div>
  );

  const labelNode = label ? (
    <span
      id={`${uid}-label`}
      className='sr-only'
    >
      {String(label)}
    </span>
  ) : null;

  const descNode = description ? (
    <span
      id={`${uid}-desc`}
      className='sr-only'
    >
      {String(description)}
    </span>
  ) : null;

  const content = (
    <>
      {labelNode}
      {descNode}
      {switchNode}
      <style
        jsx
        global
      >{`
        .sp-switch.ant-switch {
          font-family: ${fontFamily};
        }
        .sp-switch-tone-primary.ant-switch-checked {
          background: ${TONE_COLORS.primary} !important;
        }
        .sp-switch-tone-info.ant-switch-checked {
          background: ${TONE_COLORS.info} !important;
        }
        .sp-switch-tone-success.ant-switch-checked {
          background: ${TONE_COLORS.success} !important;
        }
        .sp-switch-tone-warning.ant-switch-checked {
          background: ${TONE_COLORS.warning} !important;
        }
        .sp-switch-tone-danger.ant-switch-checked {
          background: ${TONE_COLORS.danger} !important;
        }
        .sp-switch-tone-neutral.ant-switch-checked {
          background: ${TONE_COLORS.neutral} !important;
        }
      `}</style>
    </>
  );

  if (labelPlacement === 'left') {
    return (
      <div className={clsx('w-full', className)}>
        <div className='flex items-start justify-between gap-4'>
          <div className='min-w-0'>
            {label ? (
              <AppTypography.Text
                size={12}
                weight={600}
                className={clsx('text-gray-700', labelClassName)}
              >
                {label}
                {required ? <span className='ml-1 text-rose-600'>*</span> : null}
              </AppTypography.Text>
            ) : null}
            {description ? (
              <AppTypography.Text
                size={12}
                tone='muted'
                className='mt-0.5 block'
              >
                {description}
              </AppTypography.Text>
            ) : null}
          </div>

          {extra ? <div className='shrink-0'>{extra}</div> : null}
        </div>

        <div className='mt-2'>{content}</div>

        {error || hint ? (
          <div className='mt-1.5'>
            {error ? (
              <AppTypography.Text
                size={12}
                className={clsx('text-rose-600', messageClassName)}
              >
                {error}
              </AppTypography.Text>
            ) : hint ? (
              <AppTypography.Text
                size={12}
                tone='muted'
                className={clsx(messageClassName)}
              >
                {hint}
              </AppTypography.Text>
            ) : null}
          </div>
        ) : null}
      </div>
    );
  }

  return (
    <FieldShell
      label={label}
      required={required}
      hint={hint}
      error={error}
      extra={extra}
      description={description}
      className={className}
      labelClassName={labelClassName}
      messageClassName={messageClassName}
    >
      {content}
    </FieldShell>
  );
}
