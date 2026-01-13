'use client';

import React, { useMemo } from 'react';
import { Segmented } from 'antd';
import clsx from 'classnames';
import AppTypography from './AppTypography';
import { fontFamily } from './Font';

const TONES = {
  primary: '#003A6F',
  success: '#10B981',
  warning: '#F59E0B',
  danger: '#EF4444',
  info: '#3B82F6',
  neutral: '#0f172a',
};

function hexToRgba(hex, alpha) {
  if (typeof hex !== 'string') return hex;
  const raw = hex.replace('#', '').trim();
  if (![3, 6].includes(raw.length)) return hex;

  const full =
    raw.length === 3
      ? raw
          .split('')
          .map((c) => c + c)
          .join('')
      : raw;
  const r = parseInt(full.slice(0, 2), 16);
  const g = parseInt(full.slice(2, 4), 16);
  const b = parseInt(full.slice(4, 6), 16);

  if (![r, g, b].every((v) => Number.isFinite(v))) return hex;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function resolveTone(tone) {
  if (!tone) return TONES.primary;
  if (typeof tone === 'string' && TONES[tone]) return TONES[tone];
  return tone;
}

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

/**
 * AppSegmented (antd Segmented wrapper)
 *
 * Props tambahan:
 * - label, required, hint, error, extra: shell form biar konsisten
 * - tone: 'primary'|'success'|'warning'|'danger'|'info'|'neutral' | hex color
 * - variant: 'solid'|'soft'|'outline'
 * - radius: number (px)
 * - fullWidth: boolean (set block + w-full)
 * - size: 'sm'|'md'|'lg' -> antd: 'small'|'middle'|'large'
 * - items: alias untuk options
 */
export default function AppSegmented({
  label,
  required,
  hint,
  error,
  extra,

  tone = 'primary',
  variant = 'soft',
  radius = 12,

  fullWidth = false,
  size = 'md',

  items,
  options,

  className,
  labelClassName,
  messageClassName,
  segmentedClassName,
  style,
  ...props
}) {
  const brand = useMemo(() => resolveTone(tone), [tone]);

  const antdSize = useMemo(() => {
    if (size === 'sm') return 'small';
    if (size === 'lg') return 'large';
    return 'middle';
  }, [size]);

  const segOptions = options ?? items;

  const vars = useMemo(() => {
    const border = error ? '#EF4444' : hexToRgba(brand, 0.22);

    if (variant === 'solid') {
      return {
        '--sp-seg-bg': hexToRgba(brand, 0.08),
        '--sp-seg-border': border,
        '--sp-seg-item-color': '#0f172a',
        '--sp-seg-hover-bg': hexToRgba(brand, 0.12),
        '--sp-seg-selected-bg': brand,
        '--sp-seg-selected-color': '#ffffff',
      };
    }

    if (variant === 'outline') {
      return {
        '--sp-seg-bg': 'transparent',
        '--sp-seg-border': border,
        '--sp-seg-item-color': '#0f172a',
        '--sp-seg-hover-bg': hexToRgba(brand, 0.08),
        '--sp-seg-selected-bg': hexToRgba(brand, 0.14),
        '--sp-seg-selected-color': brand,
      };
    }

    // soft (default)
    return {
      '--sp-seg-bg': '#f8fafc',
      '--sp-seg-border': border,
      '--sp-seg-item-color': '#0f172a',
      '--sp-seg-hover-bg': hexToRgba(brand, 0.08),
      '--sp-seg-selected-bg': hexToRgba(brand, 0.14),
      '--sp-seg-selected-color': brand,
    };
  }, [brand, error, variant]);

  const mergedStyle = useMemo(() => {
    return {
      fontFamily,
      ...vars,
      ...(style || {}),
      width: fullWidth ? '100%' : style?.width,
    };
  }, [fullWidth, style, vars]);

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
      <Segmented
        {...props}
        options={segOptions}
        size={antdSize}
        block={fullWidth || props.block}
        className={clsx('sp-segmented', fullWidth ? 'w-full' : null, segmentedClassName)}
        style={mergedStyle}
      />

      <style
        jsx
        global
      >{`
        .sp-segmented.ant-segmented {
          font-family: ${fontFamily};
          border-radius: ${radius}px;
          background: var(--sp-seg-bg);
          border: 1px solid var(--sp-seg-border);
          padding: 4px;
        }

        .sp-segmented .ant-segmented-group {
          gap: 4px;
        }

        .sp-segmented .ant-segmented-item {
          border-radius: ${Math.max(8, radius - 4)}px;
          color: var(--sp-seg-item-color);
          transition: background 160ms ease, color 160ms ease;
          user-select: none;
        }

        .sp-segmented .ant-segmented-item:not(.ant-segmented-item-selected):not(.ant-segmented-item-disabled):hover {
          background: var(--sp-seg-hover-bg);
        }

        .sp-segmented .ant-segmented-item-selected {
          background: var(--sp-seg-selected-bg) !important;
          color: var(--sp-seg-selected-color) !important;
        }

        .sp-segmented .ant-segmented-thumb {
          display: none; /* biar ga “geser” overlay thumb; kita pakai selected bg */
        }

        .sp-segmented .ant-segmented-item-disabled {
          opacity: 0.55;
        }
      `}</style>
    </FieldShell>
  );
}
