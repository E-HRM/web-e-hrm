'use client';

import React, { useMemo } from 'react';
import { Tooltip } from 'antd';
import clsx from 'classnames';
import { fontFamily } from './Font';

const TONES = {
  dark: '#0f172a',
  primary: '#003A6F',
  success: '#10B981',
  warning: '#F59E0B',
  danger: '#EF4444',
  info: '#3B82F6',
};

function resolveColor(tone) {
  if (!tone) return TONES.dark;
  if (typeof tone === 'string' && TONES[tone]) return TONES[tone];
  return tone;
}

function isElementDisabled(el) {
  return Boolean(el?.props?.disabled || el?.props?.['aria-disabled']);
}

/**
 * AppTooltip (antd Tooltip wrapper)
 *
 * Props tambahan:
 * - content: alias untuk title
 * - tone: 'dark'|'primary'|'success'|'warning'|'danger'|'info' | hex color
 * - maxWidth: number (px)
 * - size: 'sm'|'md'
 * - wrapDisabled: otomatis bungkus child agar tooltip bisa muncul meski child disabled (default true)
 */
export default function AppTooltip({
  title,
  content,
  children,

  tone = 'dark',
  maxWidth = 320,
  size = 'md',
  wrapDisabled = true,

  mouseEnterDelay = 0.1,
  mouseLeaveDelay = 0,

  overlayClassName,
  overlayInnerStyle,

  className,
  ...props
}) {
  const resolvedTitle = content ?? title;
  const color = useMemo(() => resolveColor(tone), [tone]);

  const inner = useMemo(() => {
    const isSm = size === 'sm';
    return {
      fontFamily,
      borderRadius: 12,
      padding: isSm ? '8px 10px' : '10px 12px',
      maxWidth,
      fontSize: isSm ? 12 : 13,
      lineHeight: isSm ? '16px' : '18px',
      boxShadow: '0 18px 40px rgba(2, 6, 23, 0.22)',
      ...overlayInnerStyle,
    };
  }, [maxWidth, overlayInnerStyle, size]);

  // kalau tidak ada konten tooltip, jangan render Tooltip (biar gak bikin wrapper DOM tambahan)
  if (!resolvedTitle) return <>{children}</>;

  const onlyChild = React.isValidElement(children) ? children : <span>{children}</span>;
  const needWrap = wrapDisabled && isElementDisabled(onlyChild);

  const triggerNode = needWrap ? (
    <span className={clsx('inline-flex', className)}>{onlyChild}</span>
  ) : (
    React.cloneElement(onlyChild, {
      className: clsx(onlyChild.props?.className, className),
    })
  );

  return (
    <>
      <Tooltip
        {...props}
        title={resolvedTitle}
        color={color}
        mouseEnterDelay={mouseEnterDelay}
        mouseLeaveDelay={mouseLeaveDelay}
        overlayClassName={clsx('sp-tooltip', overlayClassName)}
        overlayInnerStyle={inner}
      >
        {triggerNode}
      </Tooltip>

      <style
        jsx
        global
      >{`
        .sp-tooltip .ant-tooltip-inner {
          font-family: ${fontFamily};
        }
      `}</style>
    </>
  );
}
