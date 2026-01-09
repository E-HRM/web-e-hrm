'use client';

import React, { useCallback, useMemo } from 'react';
import { Button, Modal } from 'antd';
import { useRouter } from 'next/navigation';
import clsx from 'classnames';
import { fontFamily } from './Font';

const DEFAULT_COLORS = {
  primary: '#003A6F',
  primaryHover: '#003E86',
  primaryActive: '#00366F',
  accent: '#98D5FF',
  accentHover: '#6FC0FF',
  accentActive: '#4AAEFF',
};

function getTypeByVariant(variant) {
  if (variant === 'primary') return 'primary';
  if (variant === 'link') return 'link';
  if (variant === 'text') return 'text';
  return 'default';
}

/**
 * AppButton - Reusable button wrapper (AntD) with:
 * - variants
 * - optional confirm
 * - optional href navigation (router.push / router.replace)
 */
export default function AppButton({
  variant = 'primary', // primary | secondary | outline | ghost | link | text | danger
  colors,
  href,
  replace = false,
  confirm, // { title, content, okText, cancelText, okType, onOk, onCancel }
  onClick,
  className,
  style,
  htmlType,
  disabled,
  loading,
  children,
  ...rest
}) {
  const router = useRouter();

  const c = useMemo(() => ({ ...DEFAULT_COLORS, ...(colors || {}) }), [colors]);

  const antType = useMemo(() => getTypeByVariant(variant), [variant]);
  const isDanger = variant === 'danger';

  const navigate = useCallback(() => {
    if (!href) return;
    if (replace) router.replace(href);
    else router.push(href);
  }, [href, replace, router]);

  const handleClick = useCallback(
    async (e) => {
      if (disabled || loading) return;

      const run = async () => {
        if (typeof onClick === 'function') await onClick(e);
        if (href && htmlType !== 'submit') navigate();
      };

      if (confirm) {
        Modal.confirm({
          title: confirm.title || 'Konfirmasi',
          content: confirm.content || 'Yakin ingin melanjutkan?',
          okText: confirm.okText || 'Ya',
          cancelText: confirm.cancelText || 'Batal',
          okType: confirm.okType || (isDanger ? 'danger' : 'primary'),
          onOk: async () => {
            if (typeof confirm.onOk === 'function') await confirm.onOk();
            await run();
          },
          onCancel: async () => {
            if (typeof confirm.onCancel === 'function') await confirm.onCancel();
          },
        });
        return;
      }

      await run();
    },
    [confirm, disabled, href, htmlType, isDanger, loading, navigate, onClick]
  );

  return (
    <>
      <Button
        {...rest}
        type={antType}
        danger={isDanger}
        htmlType={htmlType}
        disabled={disabled}
        loading={loading}
        onClick={handleClick}
        className={clsx('sp-btn', `sp-btn-${variant}`, className)}
        style={style}
      >
        {children}
      </Button>

      <style
        jsx
        global
      >{`
        .sp-btn.ant-btn {
          font-family: ${fontFamily} !important;
        }

        /* SECONDARY */
        .sp-btn-secondary.ant-btn {
          background: ${c.accent};
          border-color: ${c.accent};
          color: ${c.primary};
        }
        .sp-btn-secondary.ant-btn:not([disabled]):hover {
          background: ${c.accentHover};
          border-color: ${c.accentHover};
          color: ${c.primary};
        }
        .sp-btn-secondary.ant-btn:not([disabled]):active {
          background: ${c.accentActive};
          border-color: ${c.accentActive};
          color: ${c.primary};
        }

        /* OUTLINE */
        .sp-btn-outline.ant-btn {
          background: transparent;
          border-color: ${c.primary};
          color: ${c.primary};
        }
        .sp-btn-outline.ant-btn:not([disabled]):hover {
          border-color: ${c.primaryHover};
          color: ${c.primaryHover};
        }
        .sp-btn-outline.ant-btn:not([disabled]):active {
          border-color: ${c.primaryActive};
          color: ${c.primaryActive};
        }

        /* GHOST */
        .sp-btn-ghost.ant-btn {
          background: transparent;
          border-color: transparent;
          color: ${c.primary};
        }
        .sp-btn-ghost.ant-btn:not([disabled]):hover {
          background: rgba(0, 58, 111, 0.06);
          border-color: transparent;
          color: ${c.primaryHover};
        }
        .sp-btn-ghost.ant-btn:not([disabled]):active {
          background: rgba(0, 58, 111, 0.1);
          border-color: transparent;
          color: ${c.primaryActive};
        }

        /* LINK: biar konsisten dengan accent */
        .sp-btn-link.ant-btn {
          color: ${c.accent};
        }
        .sp-btn-link.ant-btn:not([disabled]):hover {
          color: ${c.accentHover};
        }
        .sp-btn-link.ant-btn:not([disabled]):active {
          color: ${c.accentActive};
        }
      `}</style>
    </>
  );
}
