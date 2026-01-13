'use client';

import React, { useMemo } from 'react';
import { Tag } from 'antd';
import clsx from 'classnames';
import { fontFamily } from './Font';

const TONES = {
  primary: {
    bg: '#003A6F',
    fg: '#ffffff',
    softBg: '#E6F0FA',
    softBd: '#003A6F22',
    softFg: '#003A6F',
  },
  success: {
    bg: '#10B981',
    fg: '#ffffff',
    softBg: '#ECFDF5',
    softBd: '#A7F3D0',
    softFg: '#065F46',
  },
  warning: {
    bg: '#F59E0B',
    fg: '#111827',
    softBg: '#FFFBEB',
    softBd: '#FDE68A',
    softFg: '#92400E',
  },
  danger: {
    bg: '#EF4444',
    fg: '#ffffff',
    softBg: '#FEF2F2',
    softBd: '#FECACA',
    softFg: '#991B1B',
  },
  info: {
    bg: '#3B82F6',
    fg: '#ffffff',
    softBg: '#EFF6FF',
    softBd: '#BFDBFE',
    softFg: '#1E40AF',
  },
  indigo: {
    bg: '#4F46E5',
    fg: '#ffffff',
    softBg: '#EEF2FF',
    softBd: '#C7D2FE',
    softFg: '#3730A3',
  },
  purple: {
    bg: '#8B5CF6',
    fg: '#ffffff',
    softBg: '#F5F3FF',
    softBd: '#DDD6FE',
    softFg: '#5B21B6',
  },
  neutral: {
    bg: '#E5E7EB',
    fg: '#374151',
    softBg: '#F1F5F9',
    softBd: '#E2E8F0',
    softFg: '#334155',
  },
};

const COLOR_TO_TONE = {
  green: 'success',
  success: 'success',
  orange: 'warning',
  warning: 'warning',
  red: 'danger',
  danger: 'danger',
  blue: 'info',
  info: 'info',
  geekblue: 'indigo',
  indigo: 'indigo',
  purple: 'purple',
  primary: 'primary',
  neutral: 'neutral',
};

const SIZES = {
  sm: { fontSize: 12, padX: 8, height: 22, gap: 6 },
  md: { fontSize: 13, padX: 10, height: 26, gap: 8 },
  lg: { fontSize: 14, padX: 12, height: 30, gap: 8 },
};

function isHexColor(v) {
  return typeof v === 'string' && /^#([0-9a-f]{3}|[0-9a-f]{6}|[0-9a-f]{8})$/i.test(v.trim());
}

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

  if (![r, g, b].every((n) => Number.isFinite(n))) return hex;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function normalizeCustomTone(obj) {
  if (!obj || typeof obj !== 'object') return null;
  if (!obj.bg) return null;
  return {
    bg: String(obj.bg),
    fg: obj.fg ? String(obj.fg) : '#ffffff',
    softBg: obj.softBg ? String(obj.softBg) : hexToRgba(String(obj.bg), 0.12),
    softBd: obj.softBd ? String(obj.softBd) : hexToRgba(String(obj.bg), 0.22),
    softFg: obj.softFg ? String(obj.softFg) : String(obj.bg),
  };
}

function resolveToneTokens({ tone, color }) {
  if (tone && typeof tone === 'string' && TONES[tone]) return TONES[tone];
  if (tone && typeof tone === 'object') {
    const t = normalizeCustomTone(tone);
    if (t) return t;
  }

  if (typeof color === 'string') {
    const key = color.trim();
    if (TONES[key]) return TONES[key];
    if (COLOR_TO_TONE[key] && TONES[COLOR_TO_TONE[key]]) return TONES[COLOR_TO_TONE[key]];
    if (isHexColor(key)) return normalizeCustomTone({ bg: key, fg: '#ffffff' }) || TONES.neutral;
  }

  if (typeof tone === 'string' && isHexColor(tone)) {
    return normalizeCustomTone({ bg: tone, fg: '#ffffff' }) || TONES.neutral;
  }

  return TONES.neutral;
}

function resolveVariantColors(tokens, variant) {
  const v = variant || 'soft';

  if (v === 'outline') {
    return {
      background: 'transparent',
      borderColor: tokens.softBd || hexToRgba(tokens.bg, 0.35),
      color: tokens.softFg || tokens.bg,
    };
  }

  if (v === 'solid') {
    return {
      background: tokens.bg,
      borderColor: tokens.bg,
      color: tokens.fg,
    };
  }

  return {
    background: tokens.softBg || hexToRgba(tokens.bg, 0.12),
    borderColor: tokens.softBd || hexToRgba(tokens.bg, 0.22),
    color: tokens.softFg || tokens.bg,
  };
}

/**
 * AppTag
 *
 * Props:
 * - tone: 'primary'|'success'|'warning'|'danger'|'info'|'indigo'|'purple'|'neutral' | {bg, fg, softBg, softBd, softFg}
 * - color: alias ant (green/orange/blue/red/geekblue/purple) atau hex (#RRGGBB)
 * - variant: 'soft'|'solid'|'outline'
 * - size: 'sm'|'md'|'lg'
 * - pill: boolean (default true)
 * - icon: ReactNode (di kiri)
 * - dot: boolean (render dot kiri)
 * - dotSize: number
 */
function AppTagBase({
  tone,
  color,
  variant = 'soft',
  size = 'md',
  pill = true,
  radius,

  icon,
  dot = false,
  dotSize = 8,

  className,
  style,
  children,
  ...rest
}) {
  const sz = SIZES[size] || SIZES.md;

  const tokens = useMemo(() => resolveToneTokens({ tone, color }), [tone, color]);
  const colors = useMemo(() => resolveVariantColors(tokens, variant), [tokens, variant]);

  const mergedStyle = useMemo(() => {
    const br = radius != null ? (radius === 'full' ? 9999 : typeof radius === 'number' ? radius : 12) : pill ? 9999 : 12;

    return {
      fontFamily,
      display: 'inline-flex',
      alignItems: 'center',
      gap: sz.gap,
      borderRadius: br,
      fontSize: sz.fontSize,
      height: sz.height,
      lineHeight: `${sz.height - 2}px`,
      padding: `0 ${sz.padX}px`,
      marginInlineEnd: 0,

      background: colors.background,
      borderColor: colors.borderColor,
      borderStyle: 'solid',
      borderWidth: 1,
      color: colors.color,

      ...style,
    };
  }, [colors.background, colors.borderColor, colors.color, pill, radius, style, sz.fontSize, sz.height, sz.padX, sz.gap]);

  return (
    <>
      <Tag
        {...rest}
        className={clsx('sp-tag select-none', 'inline-flex items-center', className)}
        style={mergedStyle}
      >
        {dot ? (
          <span
            aria-hidden
            style={{
              width: dotSize,
              height: dotSize,
              borderRadius: 999,
              background: tokens.bg,
              boxShadow: `0 0 0 3px ${hexToRgba(tokens.bg, 0.18)}`,
              flex: '0 0 auto',
            }}
          />
        ) : null}

        {icon ? <span className='inline-flex items-center'>{icon}</span> : null}

        {children}
      </Tag>

      <style
        jsx
        global
      >{`
        .sp-tag,
        .sp-tag * {
          font-family: ${fontFamily} !important;
        }
      `}</style>
    </>
  );
}

/**
 * AppTag.Status
 * - convenience untuk status badge (dot + text)
 */
function AppTagStatus({ text, tone = 'primary', color, dot = true, ...props }) {
  return (
    <AppTagBase
      {...props}
      tone={tone}
      color={color}
      dot={dot}
    >
      <span className='min-w-0 truncate'>{text}</span>
    </AppTagBase>
  );
}

const AppTag = Object.assign(AppTagBase, { Status: AppTagStatus });

export default AppTag;
