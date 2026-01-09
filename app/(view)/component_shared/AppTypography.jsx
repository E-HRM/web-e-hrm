'use client';

import React, { useMemo } from 'react';
import { Typography } from 'antd';
import { fontFamily } from './Font';

const DEFAULT_TONES = {
  primary: 'rgba(0, 0, 0, 0.88)',
  secondary: 'rgba(0, 0, 0, 0.65)',
  muted: 'rgba(0, 0, 0, 0.45)',
  danger: '#ff4d4f',
  success: '#52c41a',
  warning: '#faad14',
  info: '#1677ff',
};

function cx(...parts) {
  return parts.filter(Boolean).join(' ');
}

function mergeStyle(base, extra) {
  return { ...(base || {}), ...(extra || {}) };
}

function resolveToneColor(tone, tones) {
  if (!tone) return undefined;
  if (tone.startsWith('#') || tone.startsWith('rgb') || tone.startsWith('hsl')) return tone;
  return (tones && tones[tone]) || DEFAULT_TONES[tone];
}

function Base({
  as, // 'text' | 'title' | 'paragraph' | 'link'
  tone = 'primary',
  tones,
  weight,
  size,
  lineHeight,
  italic,
  underline,
  strong,
  code,
  keyboard,
  mark,
  delete: del,
  className,
  style,
  children,
  ...rest
}) {
  const color = useMemo(() => resolveToneColor(tone, tones), [tone, tones]);

  const mergedStyle = useMemo(() => {
    const base = { fontFamily };
    if (color) base.color = color;
    if (weight != null) base.fontWeight = weight;
    if (size != null) base.fontSize = size;
    if (lineHeight != null) base.lineHeight = lineHeight;
    return mergeStyle(base, style);
  }, [color, weight, size, lineHeight, style]);

  const commonProps = {
    ...rest,
    className: cx('sp-typo', className),
    style: mergedStyle,
    italic,
    underline,
    strong,
    code,
    keyboard,
    mark,
    delete: del,
  };

  if (as === 'title') return <Typography.Title {...commonProps}>{children}</Typography.Title>;
  if (as === 'paragraph') return <Typography.Paragraph {...commonProps}>{children}</Typography.Paragraph>;
  if (as === 'link') return <Typography.Link {...commonProps}>{children}</Typography.Link>;
  return <Typography.Text {...commonProps}>{children}</Typography.Text>;
}

export function AppText(props) {
  return (
    <Base
      as='text'
      {...props}
    />
  );
}

export function AppParagraph(props) {
  return (
    <Base
      as='paragraph'
      {...props}
    />
  );
}

export function AppLink(props) {
  return (
    <Base
      as='link'
      {...props}
    />
  );
}

export function AppTitle({ level = 4, ...props }) {
  return (
    <Base
      as='title'
      level={level}
      {...props}
    />
  );
}

/**
 * Namespace-style export: <AppTypography.Text />, <AppTypography.Title />, dll
 */
const AppTypography = {
  Text: AppText,
  Paragraph: AppParagraph,
  Link: AppLink,
  Title: AppTitle,
};

export default AppTypography;
