'use client';

import React, { useMemo } from 'react';
import { Divider } from 'antd';
import clsx from 'classnames';
import { fontFamily } from './Font';

const TONES = {
  primary: '#003A6F',
  success: '#10B981',
  warning: '#F59E0B',
  danger: '#EF4444',
  neutral: '#0f172a',
  muted: '#e2e8f0',
  soft: '#f1f5f9',
};

const SPACING = {
  xs: 8,
  sm: 12,
  md: 16,
  lg: 24,
  xl: 32,
};

function resolveColor(tone) {
  if (!tone) return TONES.muted;
  if (typeof tone === 'string' && TONES[tone]) return TONES[tone];
  return tone;
}

/**
 * AppDivider (antd Divider wrapper)
 *
 * Props tambahan:
 * - label: teks divider (alternatif children)
 * - tone: 'primary'|'success'|'warning'|'danger'|'neutral'|'muted'|'soft' | hex color
 * - thickness: number (px)
 * - spacing: 'xs'|'sm'|'md'|'lg'|'xl' | number (px) => margin block (vertical spacing)
 * - align: 'left'|'center'|'right' (alias orientation)
 */
export default function AppDivider({
  label,
  children,

  tone = 'muted',
  thickness = 1,
  spacing = 'md',

  align,
  orientation = 'center',
  plain = true,
  dashed = false,
  type = 'horizontal',

  className,
  style,
  textClassName,

  ...props
}) {
  const color = useMemo(() => resolveColor(tone), [tone]);

  const margin = useMemo(() => {
    if (typeof spacing === 'number' && Number.isFinite(spacing)) return spacing;
    if (typeof spacing === 'string' && SPACING[spacing]) return SPACING[spacing];
    return SPACING.md;
  }, [spacing]);

  const resolvedOrientation = align || orientation;

  const mergedStyle = useMemo(() => {
    const base = {
      marginBlock: margin,
      ...(type === 'vertical' ? { borderInlineStartColor: color, borderInlineStartWidth: thickness } : { borderTopColor: color, borderTopWidth: thickness }),
    };

    return { ...base, ...(style || {}) };
  }, [color, margin, style, thickness, type]);

  const content = label ?? children;

  return (
    <>
      <Divider
        {...props}
        type={type}
        dashed={dashed}
        plain={plain}
        orientation={resolvedOrientation}
        className={clsx('sp-divider', textClassName ? 'sp-divider-has-text-class' : null, className)}
        style={mergedStyle}
      >
        {content}
      </Divider>

      <style
        jsx
        global
      >{`
        .sp-divider,
        .sp-divider .ant-divider-inner-text {
          font-family: ${fontFamily};
        }

        .sp-divider.ant-divider-horizontal.ant-divider-with-text {
          border-top-color: ${color};
        }

        .sp-divider.ant-divider-vertical {
          border-inline-start-color: ${color};
        }

        .sp-divider .ant-divider-inner-text {
          font-weight: 700;
          color: rgba(15, 23, 42, 0.75);
        }

        .sp-divider.sp-divider-has-text-class .ant-divider-inner-text {
          /* kalau user mau override lewat textClassName, kita tetap kasih hook class */
        }
      `}</style>
    </>
  );
}
