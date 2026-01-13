'use client';

import React, { useMemo } from 'react';
import { Badge } from 'antd';
import { fontFamily } from './Font';

function joinClassName(...xs) {
  return xs.filter(Boolean).join(' ');
}

const TONES = {
  primary: { bg: '#003A6F', fg: '#ffffff' },
  success: { bg: '#10B981', fg: '#ffffff' },
  warning: { bg: '#F59E0B', fg: '#111827' },
  danger: { bg: '#EF4444', fg: '#ffffff' },
  info: { bg: '#3B82F6', fg: '#ffffff' },
  neutral: { bg: '#E5E7EB', fg: '#374151' },
};

function resolveToneStyle(tone, color) {
  if (color) return { backgroundColor: color };
  const t = TONES[tone] || TONES.danger;
  return { backgroundColor: t.bg, color: t.fg };
}

function sizeStyle(size) {
  if (size === 'small') {
    return {
      minWidth: 16,
      height: 16,
      lineHeight: '16px',
      fontSize: 10,
      paddingInline: 6,
      borderRadius: 999,
    };
  }
  return {
    minWidth: 20,
    height: 20,
    lineHeight: '20px',
    fontSize: 11,
    paddingInline: 7,
    borderRadius: 999,
  };
}

function AppBadgeBase({
  children,

  count,
  overflowCount = 99,
  showZero = false,
  dot = false,

  tone = 'danger',
  color,

  size = 'default',
  offset,

  title,
  className,

  indicatorStyle,
  style,

  ...rest
}) {
  const mergedIndicatorStyle = useMemo(() => {
    const toneStyle = resolveToneStyle(tone, color);
    const s = sizeStyle(size);

    return {
      fontFamily,
      fontWeight: 700,
      ...s,
      ...toneStyle,
      ...indicatorStyle,
      ...(style || {}),
    };
  }, [tone, color, size, indicatorStyle, style]);

  return (
    <Badge
      {...rest}
      count={count}
      overflowCount={overflowCount}
      showZero={showZero}
      dot={dot}
      offset={offset}
      title={title}
      className={className}
      style={mergedIndicatorStyle}
      styles={{ indicator: mergedIndicatorStyle }}
    >
      {children}
    </Badge>
  );
}

function AppBadgeStatus({ status, text, className, style, ...rest }) {
  const mergedTextStyle = useMemo(() => ({ fontFamily, ...(style || {}) }), [style]);

  return (
    <Badge
      {...rest}
      status={status}
      text={text}
      className={className}
      style={mergedTextStyle}
    />
  );
}

function AppBadgeRibbon({ text, color, placement = 'end', children, className, style, ...rest }) {
  const mergedTextStyle = useMemo(() => ({ fontFamily, ...(style || {}) }), [style]);

  return (
    <Badge.Ribbon
      {...rest}
      text={text}
      color={color}
      placement={placement}
      className={className}
      style={mergedTextStyle}
    >
      {children}
    </Badge.Ribbon>
  );
}

const AppBadge = Object.assign(AppBadgeBase, {
  Status: AppBadgeStatus,
  Ribbon: AppBadgeRibbon,
});

export default AppBadge;
