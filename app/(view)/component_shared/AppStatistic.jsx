'use client';

import React, { useMemo } from 'react';
import { Statistic } from 'antd';
import clsx from 'classnames';
import AppTypography from './AppTypography';
import AppSpin from './AppSpin';
import { fontFamily } from './Font';

const TONES = {
  primary: '#003A6F',
  success: '#10B981',
  warning: '#F59E0B',
  danger: '#EF4444',
  neutral: '#0f172a',
  muted: '#64748b',
};

const SIZES = {
  sm: { title: 12, value: 20 },
  md: { title: 12, value: 24 },
  lg: { title: 13, value: 30 },
};

function resolveTone(tone) {
  if (!tone) return TONES.neutral;
  if (typeof tone === 'string' && TONES[tone]) return TONES[tone];
  return tone;
}

/**
 * AppStatistic (antd Statistic wrapper)
 *
 * Props tambahan:
 * - label: title atas
 * - subtitle: text kecil bawah
 * - extra: sisi kanan header
 * - tone: 'primary'|'success'|'warning'|'danger'|'neutral'|'muted' | hex color
 * - size: 'sm'|'md'|'lg'
 * - card: boolean (default true)
 * - loading: boolean (tampilkan spinner)
 * - valueSuffix / valuePrefix: alias prefix/suffix
 */
export default function AppStatistic({
  label,
  subtitle,
  extra,

  tone = 'neutral',
  size = 'md',
  card = true,
  loading = false,

  valuePrefix,
  valueSuffix,

  className,
  containerClassName,
  headerClassName,
  bodyClassName,

  style,
  valueStyle,

  prefix,
  suffix,
  ...props
}) {
  const sz = SIZES[size] || SIZES.md;
  const toneColor = useMemo(() => resolveTone(tone), [tone]);

  const mergedValueStyle = useMemo(() => {
    return {
      fontFamily,
      fontWeight: 800,
      fontSize: sz.value,
      lineHeight: 1.15,
      color: toneColor,
      ...valueStyle,
    };
  }, [sz.value, toneColor, valueStyle]);

  const Wrapper = ({ children }) => {
    if (!card) return <div className={clsx('w-full', className)}>{children}</div>;

    return (
      <div
        className={clsx('w-full rounded-2xl bg-white ring-1 ring-slate-100 shadow-sm', containerClassName, className)}
        style={style}
      >
        {children}
      </div>
    );
  };

  const hasHeader = Boolean(label) || Boolean(subtitle) || Boolean(extra);

  return (
    <Wrapper>
      {hasHeader ? (
        <div className={clsx('px-4 pt-4', headerClassName)}>
          <div className='flex items-start justify-between gap-3'>
            <div className='min-w-0'>
              {label ? (
                <AppTypography.Text
                  size={sz.title}
                  weight={700}
                  className='text-slate-700 block'
                >
                  {label}
                </AppTypography.Text>
              ) : null}

              {subtitle ? (
                <AppTypography.Text
                  size={12}
                  tone='muted'
                  className='text-slate-500 block mt-0.5'
                >
                  {subtitle}
                </AppTypography.Text>
              ) : null}
            </div>

            {extra ? <div className='shrink-0'>{extra}</div> : null}
          </div>
        </div>
      ) : null}

      <div className={clsx('px-4 pb-4', hasHeader ? 'pt-2' : 'pt-4', bodyClassName)}>
        {loading ? (
          <div className='min-h-[44px] flex items-center'>
            <AppSpin />
          </div>
        ) : (
          <Statistic
            {...props}
            prefix={prefix ?? valuePrefix}
            suffix={suffix ?? valueSuffix}
            valueStyle={mergedValueStyle}
            className='sp-stat'
          />
        )}
      </div>

      <style
        jsx
        global
      >{`
        .sp-stat,
        .sp-stat .ant-statistic-title,
        .sp-stat .ant-statistic-content {
          font-family: ${fontFamily};
        }
        .sp-stat .ant-statistic-title {
          margin-bottom: 2px;
          color: rgba(100, 116, 139, 1);
          font-weight: 600;
          font-size: 12px;
        }
      `}</style>
    </Wrapper>
  );
}
