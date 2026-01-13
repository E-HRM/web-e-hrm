'use client';

import React, { useMemo, useCallback } from 'react';
import { TimePicker } from 'antd';
import clsx from 'classnames';
import dayjs from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat';

import AppTypography from './AppTypography';
import { fontFamily } from './Font';

dayjs.extend(customParseFormat);

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
            <div />
          )}

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

function uniqSorted(arr) {
  return Array.from(new Set(arr)).sort((a, b) => a - b);
}

function rangeInt(from, toExclusive) {
  const out = [];
  for (let i = from; i < toExclusive; i += 1) out.push(i);
  return out;
}

function coerceDayjsTime(value, format) {
  if (!value) return null;
  if (dayjs.isDayjs(value)) return value;
  if (typeof value === 'string') {
    const parsed = dayjs(value, format, true);
    return parsed.isValid() ? parsed : null;
  }
  return null;
}

function mergeDisabledTime(base, extra) {
  if (!base && !extra) return undefined;

  const b = base || {};
  const e = extra || {};

  return {
    disabledHours: () => uniqSorted([...(b.disabledHours ? b.disabledHours() : []), ...(e.disabledHours ? e.disabledHours() : [])]),
    disabledMinutes: (selectedHour) => uniqSorted([...(b.disabledMinutes ? b.disabledMinutes(selectedHour) : []), ...(e.disabledMinutes ? e.disabledMinutes(selectedHour) : [])]),
    disabledSeconds: (selectedHour, selectedMinute) => uniqSorted([...(b.disabledSeconds ? b.disabledSeconds(selectedHour, selectedMinute) : []), ...(e.disabledSeconds ? e.disabledSeconds(selectedHour, selectedMinute) : [])]),
  };
}

function buildDisablePast(referenceTime) {
  const ref = referenceTime || dayjs();

  return {
    disabledHours: () => rangeInt(0, ref.hour()),
    disabledMinutes: (h) => (h === ref.hour() ? rangeInt(0, ref.minute()) : []),
    disabledSeconds: (h, m) => (h === ref.hour() && m === ref.minute() ? rangeInt(0, ref.second()) : []),
  };
}

function buildDisableFuture(referenceTime) {
  const ref = referenceTime || dayjs();

  return {
    disabledHours: () => rangeInt(ref.hour() + 1, 24),
    disabledMinutes: (h) => (h === ref.hour() ? rangeInt(ref.minute() + 1, 60) : []),
    disabledSeconds: (h, m) => (h === ref.hour() && m === ref.minute() ? rangeInt(ref.second() + 1, 60) : []),
  };
}

function BaseTimePicker({
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

  valueType = 'dayjs', // 'dayjs' | 'string'
  valueFormat,
  onValueChange,
  disablePast = false,
  disableFuture = false,
  referenceTime,

  value,
  defaultValue,
  onChange,
  format = 'HH:mm',
  allowClear = true,
  disabledTime,
  style,
  status: statusProp,
  ...props
}) {
  const status = statusProp || (error ? 'error' : undefined);
  const fmt = valueFormat || (typeof format === 'string' ? format : 'HH:mm');

  const normalizedValue = useMemo(() => coerceDayjsTime(value, fmt), [value, fmt]);
  const normalizedDefaultValue = useMemo(() => coerceDayjsTime(defaultValue, fmt), [defaultValue, fmt]);

  const computedDisabledTime = useCallback(
    (current) => {
      const base = disabledTime ? disabledTime(current) : undefined;
      const past = disablePast ? buildDisablePast(referenceTime) : undefined;
      const future = disableFuture ? buildDisableFuture(referenceTime) : undefined;
      return mergeDisabledTime(mergeDisabledTime(base, past), future);
    },
    [disabledTime, disablePast, disableFuture, referenceTime]
  );

  const handleChange = useCallback(
    (next, nextStr) => {
      if (onChange) onChange(next, nextStr);

      if (onValueChange) {
        if (valueType === 'string') {
          onValueChange(next ? next.format(fmt) : null);
        } else {
          onValueChange(next || null);
        }
      }
    },
    [onChange, onValueChange, valueType, fmt]
  );

  const mergedStyle = useMemo(() => ({ width: '100%', fontFamily, ...(style || {}) }), [style]);

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
      <TimePicker
        {...props}
        value={normalizedValue}
        defaultValue={normalizedDefaultValue}
        onChange={handleChange}
        format={format}
        allowClear={allowClear}
        status={status}
        disabledTime={computedDisabledTime}
        className={clsx('sp-time-picker w-full rounded-xl', pickerClassName)}
        popupClassName={popupClassName}
        style={mergedStyle}
      />

      <style
        jsx
        global
      >{`
        .sp-time-picker.ant-picker,
        .sp-time-picker .ant-picker-input > input {
          font-family: ${fontFamily};
        }

        .sp-time-picker.ant-picker {
          border-radius: 12px;
          min-height: 40px;
          padding: 8px 12px;
        }

        .sp-time-picker.ant-picker:hover {
          border-color: #94a3b8;
        }

        .sp-time-picker.ant-picker-status-error {
          border-color: #f43f5e !important;
          box-shadow: 0 0 0 2px #f43f5e22 !important;
        }

        .sp-time-picker.ant-picker-focused,
        .sp-time-picker.ant-picker:focus-within {
          border-color: #2563eb;
          box-shadow: 0 0 0 2px #2563eb22;
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

  valueType = 'dayjs', // 'dayjs' | 'string'
  valueFormat,
  onValueChange,
  disablePast = false,
  disableFuture = false,
  referenceTime,

  value,
  defaultValue,
  onChange,
  format = 'HH:mm',
  allowClear = true,
  disabledTime,
  style,
  status: statusProp,
  ...props
}) {
  const status = statusProp || (error ? 'error' : undefined);
  const fmt = valueFormat || (typeof format === 'string' ? format : 'HH:mm');

  const normalizedValue = useMemo(() => {
    if (!value || !Array.isArray(value)) return null;
    const a = coerceDayjsTime(value[0], fmt);
    const b = coerceDayjsTime(value[1], fmt);
    return a && b ? [a, b] : null;
  }, [value, fmt]);

  const normalizedDefaultValue = useMemo(() => {
    if (!defaultValue || !Array.isArray(defaultValue)) return null;
    const a = coerceDayjsTime(defaultValue[0], fmt);
    const b = coerceDayjsTime(defaultValue[1], fmt);
    return a && b ? [a, b] : null;
  }, [defaultValue, fmt]);

  const computedDisabledTime = useCallback(
    (current, type) => {
      const base = disabledTime ? disabledTime(current, type) : undefined;
      const past = disablePast ? buildDisablePast(referenceTime) : undefined;
      const future = disableFuture ? buildDisableFuture(referenceTime) : undefined;
      return mergeDisabledTime(mergeDisabledTime(base, past), future);
    },
    [disabledTime, disablePast, disableFuture, referenceTime]
  );

  const handleChange = useCallback(
    (next, nextStr) => {
      if (onChange) onChange(next, nextStr);

      if (onValueChange) {
        if (!next || !Array.isArray(next) || !next[0] || !next[1]) {
          onValueChange(null);
          return;
        }
        if (valueType === 'string') {
          onValueChange([next[0].format(fmt), next[1].format(fmt)]);
        } else {
          onValueChange([next[0], next[1]]);
        }
      }
    },
    [onChange, onValueChange, valueType, fmt]
  );

  const mergedStyle = useMemo(() => ({ width: '100%', fontFamily, ...(style || {}) }), [style]);

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
      <TimePicker.RangePicker
        {...props}
        value={normalizedValue}
        defaultValue={normalizedDefaultValue}
        onChange={handleChange}
        format={format}
        allowClear={allowClear}
        status={status}
        disabledTime={computedDisabledTime}
        className={clsx('sp-time-picker w-full rounded-xl', pickerClassName)}
        popupClassName={popupClassName}
        style={mergedStyle}
      />
    </FieldShell>
  );
}

const AppTimePicker = Object.assign(BaseTimePicker, { RangePicker });

export default AppTimePicker;
