'use client';

import React, { useMemo } from 'react';
import { Input, InputNumber } from 'antd';
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

      {children}

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
    </div>
  );
}

function BaseInput({
  label,
  required = false,
  hint,
  error,
  extra,

  prefixIcon,
  suffixIcon,

  size = 'middle',
  allowClear = false,

  className,
  inputClassName,
  labelClassName,
  messageClassName,

  style,
  ...rest
}) {
  const status = rest.status ?? (error ? 'error' : undefined);

  const mergedStyle = useMemo(() => ({ fontFamily, ...(style || {}) }), [style]);

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
      <Input
        {...rest}
        size={size}
        allowClear={allowClear}
        status={status}
        prefix={rest.prefix ?? prefixIcon}
        suffix={rest.suffix ?? suffixIcon}
        className={clsx('rounded-xl', inputClassName)}
        style={mergedStyle}
      />
    </FieldShell>
  );
}

function PasswordInput(props) {
  const { label, required = false, hint, error, extra, prefixIcon, suffixIcon, size = 'middle', allowClear = false, className, inputClassName, labelClassName, messageClassName, style, ...rest } = props;

  const status = rest.status ?? (error ? 'error' : undefined);
  const mergedStyle = useMemo(() => ({ fontFamily, ...(style || {}) }), [style]);

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
      <Input.Password
        {...rest}
        size={size}
        allowClear={allowClear}
        status={status}
        prefix={rest.prefix ?? prefixIcon}
        suffix={rest.suffix ?? suffixIcon}
        className={clsx('rounded-xl', inputClassName)}
        style={mergedStyle}
      />
    </FieldShell>
  );
}

function TextAreaInput(props) {
  const { label, required = false, hint, error, extra, size = 'middle', allowClear = false, className, inputClassName, labelClassName, messageClassName, style, autoSize, ...rest } = props;

  const status = rest.status ?? (error ? 'error' : undefined);
  const mergedStyle = useMemo(() => ({ fontFamily, ...(style || {}) }), [style]);

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
      <Input.TextArea
        {...rest}
        autoSize={autoSize}
        allowClear={allowClear}
        status={status}
        className={clsx('rounded-xl', inputClassName)}
        style={mergedStyle}
      />
    </FieldShell>
  );
}

function NumberInput(props) {
  const { label, required = false, hint, error, extra, size = 'middle', className, inputClassName, labelClassName, messageClassName, style, ...rest } = props;

  const status = rest.status ?? (error ? 'error' : undefined);
  const mergedStyle = useMemo(() => ({ fontFamily, ...(style || {}) }), [style]);

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
      <InputNumber
        {...rest}
        size={size}
        status={status}
        className={clsx('w-full rounded-xl', inputClassName)}
        style={mergedStyle}
      />
    </FieldShell>
  );
}

const AppInput = Object.assign(BaseInput, {
  Password: PasswordInput,
  TextArea: TextAreaInput,
  Number: NumberInput,
});

export default AppInput;
