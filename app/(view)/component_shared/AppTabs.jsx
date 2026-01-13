'use client';

import React, { useMemo } from 'react';
import { Tabs } from 'antd';
import AppTypography from './AppTypography';
import AppBadge from './AppBadge';
import { fontFamily } from './Font';

function joinClassName(...xs) {
  return xs.filter(Boolean).join(' ');
}

function renderTabLabel(item) {
  const labelNode =
    typeof item.label === 'string' ? (
      <AppTypography.Text
        size={13}
        weight={700}
        className='text-slate-700'
      >
        {item.label}
      </AppTypography.Text>
    ) : (
      item.label
    );

  const hasBadge = item.badge !== undefined && item.badge !== null;
  const badgeProps = typeof item.badge === 'object' && item.badge !== null ? item.badge : { count: item.badge };

  return (
    <span className='inline-flex items-center gap-2'>
      {item.icon ? <span className='inline-flex items-center'>{item.icon}</span> : null}

      {hasBadge ? (
        <AppBadge
          {...badgeProps}
          size={badgeProps.size ?? 'small'}
          tone={badgeProps.tone ?? 'danger'}
        >
          <span className='inline-flex items-center'>{labelNode}</span>
        </AppBadge>
      ) : (
        <span className='inline-flex items-center'>{labelNode}</span>
      )}
    </span>
  );
}

/**
 * AppTabs (AntD Tabs wrapper)
 *
 * props tambahan:
 * - items: [{ key, label, children, disabled?, icon?, badge? }]
 *   badge bisa number atau object props untuk AppBadge (ex: { count: 12, tone: 'danger' })
 * - variant: 'line' | 'card'  (default: 'line')
 * - pills: boolean (opsional, style tab jadi pill)
 */
export default function AppTabs({
  items = [],
  activeKey,
  defaultActiveKey,
  onChange,

  variant = 'line',
  pills = false,

  size = 'middle',
  centered = false,
  tabPosition = 'top',

  destroyInactiveTabPane = false,
  animated = true,

  tabBarExtraContent,
  tabBarGutter = 8,

  className,
  style,
  tabBarStyle,

  ...rest
}) {
  const normalizedItems = useMemo(() => {
    const safe = Array.isArray(items) ? items : [];
    return safe.map((it) => ({
      key: it.key,
      disabled: it.disabled,
      forceRender: it.forceRender,
      closable: it.closable,
      children: it.children,
      label: renderTabLabel(it),
    }));
  }, [items]);

  const type = variant === 'card' ? 'card' : undefined;

  return (
    <div
      className={joinClassName('w-full', pills ? 'app-tabs--pills' : null, className)}
      style={{ fontFamily, ...(style || {}) }}
    >
      <Tabs
        {...rest}
        items={normalizedItems}
        activeKey={activeKey}
        defaultActiveKey={defaultActiveKey}
        onChange={onChange}
        size={size}
        type={type}
        centered={centered}
        tabPosition={tabPosition}
        destroyInactiveTabPane={destroyInactiveTabPane}
        animated={animated}
        tabBarExtraContent={tabBarExtraContent}
        tabBarGutter={tabBarGutter}
        tabBarStyle={{ fontFamily, ...(tabBarStyle || {}) }}
      />

      {pills ? (
        <style
          jsx
          global
        >{`
          .app-tabs--pills .ant-tabs-nav::before {
            border-bottom: 0 !important;
          }
          .app-tabs--pills .ant-tabs-ink-bar {
            display: none !important;
          }
          .app-tabs--pills .ant-tabs-tab {
            border: 0 !important;
            background: transparent !important;
            padding: 0 !important;
            margin: 0 6px 0 0 !important;
          }
          .app-tabs--pills .ant-tabs-tab-btn {
            border-radius: 14px !important;
            padding: 8px 14px !important;
            background: rgba(148, 163, 184, 0.2) !important;
            transition: background 160ms ease, color 160ms ease;
          }
          .app-tabs--pills .ant-tabs-tab-active .ant-tabs-tab-btn {
            background: #003a6f !important;
            color: #ffffff !important;
          }
          .app-tabs--pills .ant-tabs-tab-active .ant-tabs-tab-btn * {
            color: #ffffff !important;
          }
        `}</style>
      ) : null}
    </div>
  );
}
