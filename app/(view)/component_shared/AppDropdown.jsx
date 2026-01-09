'use client';

import React, { useCallback, useMemo } from 'react';
import { Dropdown, Modal } from 'antd';
import { DownOutlined } from '@ant-design/icons';
import { useRouter } from 'next/navigation';
import AppButton from './AppButton';
import { fontFamily } from './Font';

function cx(...parts) {
  return parts.filter(Boolean).join(' ');
}

function flattenItems(items, acc = []) {
  for (const it of items || []) {
    if (!it) continue;
    if (it.type === 'divider') {
      acc.push(it);
      continue;
    }
    acc.push(it);
    if (Array.isArray(it.children) && it.children.length) flattenItems(it.children, acc);
  }
  return acc;
}

function toAntdMenuItems(items) {
  return (items || [])
    .map((it) => {
      if (!it) return null;
      if (it.type === 'divider') return { type: 'divider' };
      return {
        key: String(it.key),
        label: it.label,
        icon: it.icon,
        disabled: !!it.disabled,
        danger: !!it.danger,
        children: it.children ? toAntdMenuItems(it.children) : undefined,
      };
    })
    .filter(Boolean);
}

/**
 * AppDropdown
 *
 * Props:
 * - items: [{ key, label, icon?, disabled?, danger?, href?, replace?, onClick?, confirm?, children?, type:'divider'? }]
 * - label/icon/variant/buttonProps: trigger default (kalau children tidak diisi)
 * - children: custom trigger
 * - menuProps: pass-through menu props (AntD)
 *
 * Tambahan:
 * - dropdownContent: ReactNode | () => ReactNode  (untuk konten custom)
 * - dropdownRender: (originNode) => ReactNode    (advanced)
 * - overlayStyle: style overlay dropdown
 */
export default function AppDropdown({
  items = [],
  label = 'Menu',
  icon,
  variant = 'outline',
  buttonProps,
  colors,

  children,

  placement = 'bottomRight',
  trigger = ['click'],
  arrow = false,
  disabled = false,
  open,
  onOpenChange,

  className,
  overlayClassName,
  overlayStyle,
  menuProps,

  dropdownContent,
  dropdownRender,
}) {
  const router = useRouter();

  const hasCustomContent = dropdownContent != null || typeof dropdownRender === 'function';

  const flat = useMemo(() => flattenItems(items), [items]);
  const itemsByKey = useMemo(() => {
    const map = new Map();
    for (const it of flat) {
      if (it && it.type !== 'divider' && it.key != null) map.set(String(it.key), it);
    }
    return map;
  }, [flat]);

  const menuItems = useMemo(() => toAntdMenuItems(items), [items]);

  const runAction = useCallback(
    async (item) => {
      if (!item) return;

      const doRun = async () => {
        if (typeof item.onClick === 'function') await item.onClick();
        if (item.href) {
          if (item.replace) router.replace(item.href);
          else router.push(item.href);
        }
      };

      if (item.confirm) {
        const c = typeof item.confirm === 'object' ? item.confirm : {};
        Modal.confirm({
          title: c.title || 'Konfirmasi',
          content: c.content || 'Yakin ingin melanjutkan?',
          okText: c.okText || 'Ya',
          cancelText: c.cancelText || 'Batal',
          okType: c.okType || (item.danger ? 'danger' : 'primary'),
          onOk: async () => {
            if (typeof c.onOk === 'function') await c.onOk();
            await doRun();
          },
          onCancel: async () => {
            if (typeof c.onCancel === 'function') await c.onCancel();
          },
        });
        return;
      }

      await doRun();
    },
    [router]
  );

  const handleMenuClick = useCallback(
    async (info) => {
      const key = String(info?.key ?? '');
      const item = itemsByKey.get(key);
      await runAction(item);
    },
    [itemsByKey, runAction]
  );

  const mergedOverlayClass = cx('sp-dropdown-overlay', overlayClassName);

  const resolvedDropdownRender = useMemo(() => {
    if (typeof dropdownRender === 'function') return dropdownRender;
    if (dropdownContent == null) return undefined;

    return () => (typeof dropdownContent === 'function' ? dropdownContent() : dropdownContent);
  }, [dropdownRender, dropdownContent]);

  return (
    <>
      <Dropdown
        placement={placement}
        trigger={trigger}
        arrow={arrow}
        disabled={disabled}
        open={open}
        onOpenChange={onOpenChange}
        overlayClassName={mergedOverlayClass}
        overlayStyle={overlayStyle}
        className={cx('sp-dropdown', className)}
        dropdownRender={resolvedDropdownRender}
        menu={
          hasCustomContent
            ? { items: [] }
            : {
                items: menuItems,
                onClick: handleMenuClick,
                ...(menuProps || {}),
              }
        }
      >
        {children ? (
          children
        ) : (
          <AppButton
            variant={variant}
            colors={colors}
            disabled={disabled}
            {...(buttonProps || {})}
          >
            <span className='inline-flex items-center gap-2'>
              {icon ? <span className='inline-flex'>{icon}</span> : null}
              <span className='font-semibold'>{label}</span>
              <DownOutlined />
            </span>
          </AppButton>
        )}
      </Dropdown>

      <style
        jsx
        global
      >{`
        .sp-dropdown,
        .sp-dropdown-overlay .ant-dropdown-menu,
        .sp-dropdown-overlay .ant-dropdown-menu-item,
        .sp-dropdown-overlay .ant-dropdown-menu-submenu-title {
          font-family: ${fontFamily} !important;
        }

        .sp-dropdown-overlay .ant-dropdown-menu {
          border-radius: 14px;
          padding: 8px;
        }

        .sp-dropdown-overlay .ant-dropdown-menu-item,
        .sp-dropdown-overlay .ant-dropdown-menu-submenu-title {
          border-radius: 10px;
          font-weight: 600;
        }

        .sp-dropdown-overlay .ant-dropdown-menu-item-danger {
          font-weight: 700;
        }
      `}</style>
    </>
  );
}
