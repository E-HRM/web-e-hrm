'use client';

import React, { useMemo } from 'react';
import { Select } from 'antd';
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

function defaultFilterOption(input, option) {
  const label = option?.label ?? option?.children ?? '';
  const value = option?.value ?? '';
  const text = `${label} ${value}`.toLowerCase();
  return text.includes((input ?? '').toLowerCase());
}

export default function AppSelect({
  label,
  required = false,
  hint,
  error,
  extra,

  options,
  mode,
  placeholder,
  allowClear = false,
  showSearch = true,

  size = 'middle',
  disabled = false,
  loading = false,

  className,
  selectClassName,
  labelClassName,
  messageClassName,

  popupClassName,
  dropdownStyle,

  filterOption,
  optionFilterProp,

  style,
  ...rest
}) {
  const status = rest.status ?? (error ? 'error' : undefined);

  const mergedStyle = useMemo(() => ({ fontFamily, ...(style || {}) }), [style]);

  const mergedPopupClassName = clsx('rounded-xl', popupClassName);

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
      <Select
        {...rest}
        mode={mode}
        options={options}
        size={size}
        disabled={disabled}
        loading={loading}
        allowClear={allowClear}
        showSearch={showSearch}
        placeholder={placeholder}
        status={status}
        className={clsx('w-full', selectClassName)}
        popupClassName={mergedPopupClassName}
        dropdownStyle={dropdownStyle}
        style={mergedStyle}
        optionFilterProp={optionFilterProp ?? 'label'}
        filterOption={filterOption ?? defaultFilterOption}
      />
    </FieldShell>
  );
}
