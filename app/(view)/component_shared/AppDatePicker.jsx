'use client';

import React, { useMemo } from 'react';
import { DatePicker } from 'antd';
import clsx from 'classnames';
import AppTypography from './AppTypography';
import { fontFamily } from './Font';

function FieldShell({ label, required, hint, error, extra, className, labelClassName, messageClassName, children }) {
  const hasTop = Boolean(label) || Boolean(extra);
  const hasMsg = Boolean(error) || Boolean(hint);

  return (
    <div className={clsx('w-full', className)}>
      {hasTop && (
        <div className='mb-1.5 flex items-start justify-between gap-3'>
          <div className='min-w-0'>
            {label && (
              <AppTypography.Text
                size={13}
                weight={700}
                className={clsx('text-slate-700', labelClassName)}
              >
                {label}
                {required ? <span className='ml-1 text-rose-600'>*</span> : null}
              </AppTypography.Text>
            )}
          </div>

          {extra ? <div className='shrink-0'>{extra}</div> : null}
        </div>
      )}

      {children}

      {hasMsg && (
        <div className={clsx('mt-1', messageClassName)}>
          {error ? (
            <AppTypography.Text
              size={12}
              className='text-rose-600'
            >
              {error}
            </AppTypography.Text>
          ) : (
            <AppTypography.Text
              size={12}
              tone='muted'
              className='text-slate-500'
            >
              {hint}
            </AppTypography.Text>
          )}
        </div>
      )}
    </div>
  );
}

function BaseDatePicker({
  label,
  required,
  hint,
  error,
  extra,
  className,
  labelClassName,
  messageClassName,

  pickerClassName,
  popupClassName,
  style,

  brand = '#003A6F',
  allowClear = true,
  ...props
}) {
  const status = error ? 'error' : props.status;

  const mergedStyle = useMemo(() => {
    const s = style || {};
    return { width: '100%', ...s };
  }, [style]);

  return (
    <FieldShell
      label={label}
      required={required}
      hint={hint}
      error={error}
      extra={extra}
      className={className}
      labelClassName={labelClassName}
      messageClassName={messageClassName}
    >
      <DatePicker
        {...props}
        allowClear={allowClear}
        status={status}
        className={clsx('sp-date-picker w-full rounded-xl', pickerClassName)}
        popupClassName={popupClassName}
        style={mergedStyle}
      />

      <style
        jsx
        global
      >{`
        .sp-date-picker.ant-picker {
          border-radius: 12px;
          font-family: ${fontFamily};
        }
        .sp-date-picker.ant-picker:hover {
          border-color: ${brand};
        }
        .sp-date-picker.ant-picker-focused,
        .sp-date-picker.ant-picker:focus-within {
          border-color: ${brand};
          box-shadow: 0 0 0 2px ${brand}22;
        }
      `}</style>
    </FieldShell>
  );
}

function RangePicker({
  label,
  required,
  hint,
  error,
  extra,
  className,
  labelClassName,
  messageClassName,

  pickerClassName,
  popupClassName,
  style,

  brand = '#003A6F',
  allowClear = true,
  ...props
}) {
  const status = error ? 'error' : props.status;

  const mergedStyle = useMemo(() => {
    const s = style || {};
    return { width: '100%', ...s };
  }, [style]);

  return (
    <FieldShell
      label={label}
      required={required}
      hint={hint}
      error={error}
      extra={extra}
      className={className}
      labelClassName={labelClassName}
      messageClassName={messageClassName}
    >
      <DatePicker.RangePicker
        {...props}
        allowClear={allowClear}
        status={status}
        className={clsx('sp-date-picker w-full rounded-xl', pickerClassName)}
        popupClassName={popupClassName}
        style={mergedStyle}
      />

      <style
        jsx
        global
      >{`
        .sp-date-picker.ant-picker {
          border-radius: 12px;
          font-family: ${fontFamily};
        }
        .sp-date-picker.ant-picker:hover {
          border-color: ${brand};
        }
        .sp-date-picker.ant-picker-focused,
        .sp-date-picker.ant-picker:focus-within {
          border-color: ${brand};
          box-shadow: 0 0 0 2px ${brand}22;
        }
      `}</style>
    </FieldShell>
  );
}

const AppDatePicker = Object.assign(BaseDatePicker, { RangePicker });

export default AppDatePicker;
