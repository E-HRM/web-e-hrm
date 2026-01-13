'use client';

import React, { useCallback, useMemo } from 'react';
import { Avatar, Tooltip } from 'antd';
import { UserOutlined } from '@ant-design/icons';
import { useRouter } from 'next/navigation';
import { fontFamily } from './Font';

const SIZE_MAP = {
  xs: 24,
  sm: 28,
  md: 36,
  lg: 44,
  xl: 56,
};

function cx(...parts) {
  return parts.filter(Boolean).join(' ');
}

function resolveSize(size) {
  if (typeof size === 'number') return size;
  if (typeof size === 'string') return SIZE_MAP[size] ?? SIZE_MAP.md;
  return SIZE_MAP.md;
}

function getInitials(name, max = 2) {
  const v = String(name || '').trim();
  if (!v) return '';
  const parts = v
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, max)
    .map((p) => p[0]?.toUpperCase())
    .filter(Boolean);

  if (!parts.length) return '';
  return parts.join('');
}

function hashString(str) {
  let h = 0;
  for (let i = 0; i < str.length; i += 1) h = (h * 31 + str.charCodeAt(i)) >>> 0;
  return h;
}

function pickBg(name) {
  const palette = [
    ['#E6F4FF', '#1677FF'],
    ['#F6FFED', '#52C41A'],
    ['#FFF7E6', '#FA8C16'],
    ['#FFF1F0', '#FF4D4F'],
    ['#F9F0FF', '#722ED1'],
    ['#E6FFFB', '#13C2C2'],
    ['#F0F5FF', '#2F54EB'],
  ];
  const idx = hashString(String(name || '')) % palette.length;
  return palette[idx];
}

export default function AppAvatar({
  name,
  src,
  alt,
  size = 'md',
  shape = 'circle',
  bordered = true,

  status,
  showStatus = false,

  tooltip,

  href,
  replace = false,
  onClick,

  className,
  style,

  avatarClassName,
  avatarStyle,

  icon,
  children,
  ...rest
}) {
  const router = useRouter();
  const px = useMemo(() => resolveSize(size), [size]);

  const initials = useMemo(() => getInitials(name), [name]);
  const [bg, fg] = useMemo(() => pickBg(name), [name]);

  const clickable = !!href || typeof onClick === 'function';

  const wrapperRadius = shape === 'circle' ? 999 : 12;

  const handleClick = useCallback(
    async (e) => {
      if (typeof onClick === 'function') await onClick(e);
      if (href) {
        if (replace) router.replace(href);
        else router.push(href);
      }
    },
    [href, replace, router, onClick]
  );

  const avatarNode = (
    <span
      className={cx('sp-avatar-wrap', bordered && 'sp-avatar-bordered', clickable && 'sp-avatar-clickable', className)}
      style={{ borderRadius: wrapperRadius, ...(style || {}) }}
      onClick={clickable ? handleClick : undefined}
      role={clickable ? 'button' : undefined}
      tabIndex={clickable ? 0 : undefined}
      onKeyDown={
        clickable
          ? (e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                handleClick(e);
              }
            }
          : undefined
      }
    >
      <Avatar
        {...rest}
        src={src}
        size={px}
        shape={shape}
        alt={alt || name || 'avatar'}
        icon={!src && !children && !initials ? icon || <UserOutlined /> : undefined}
        className={cx('sp-avatar', avatarClassName)}
        style={{
          fontFamily,
          fontWeight: 800,
          background: src ? undefined : bg,
          color: src ? undefined : fg,
          ...(avatarStyle || {}),
        }}
      >
        {children || (!src && initials ? initials : null)}
      </Avatar>

      {showStatus && status ? (
        <span
          className={cx('sp-avatar-status', `sp-avatar-status-${status}`)}
          aria-hidden='true'
        />
      ) : null}
    </span>
  );

  return (
    <>
      {tooltip ? <Tooltip title={tooltip}>{avatarNode}</Tooltip> : avatarNode}

      <style
        jsx
        global
      >{`
        .sp-avatar-wrap {
          position: relative;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          font-family: ${fontFamily} !important;
          line-height: 1;
        }

        .sp-avatar-bordered .sp-avatar.ant-avatar {
          box-shadow: 0 0 0 2px rgba(255, 255, 255, 0.95);
        }

        .sp-avatar-clickable {
          cursor: pointer;
        }
        .sp-avatar-clickable:focus-visible {
          outline: none;
          box-shadow: 0 0 0 3px rgba(152, 213, 255, 0.45);
        }

        .sp-avatar-status {
          position: absolute;
          right: 0px;
          bottom: 0px;
          width: 10px;
          height: 10px;
          border-radius: 999px;
          border: 2px solid rgba(255, 255, 255, 0.95);
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.12);
        }

        .sp-avatar-status-online {
          background: #52c41a;
        }
        .sp-avatar-status-offline {
          background: rgba(0, 0, 0, 0.25);
        }
        .sp-avatar-status-away {
          background: #faad14;
        }
        .sp-avatar-status-busy {
          background: #ff4d4f;
        }
      `}</style>
    </>
  );
}

export function AppAvatarGroup({ className, style, children, ...rest }) {
  return (
    <>
      <Avatar.Group
        {...rest}
        className={cx('sp-avatar-group', className)}
        style={{ fontFamily, ...(style || {}) }}
      >
        {children}
      </Avatar.Group>

      <style
        jsx
        global
      >{`
        .sp-avatar-group,
        .sp-avatar-group .ant-avatar {
          font-family: ${fontFamily} !important;
        }
      `}</style>
    </>
  );
}
