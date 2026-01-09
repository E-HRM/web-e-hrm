'use client';

import React, { useMemo } from 'react';
import { Alert } from 'antd';
import clsx from 'classnames';
import AppTypography from './AppTypography';
import { fontFamily } from './Font';

function asText(node, { size = 13, weight = 700, tone = 'primary', className } = {}) {
  if (node == null) return null;

  if (typeof node === 'string' || typeof node === 'number') {
    return (
      <AppTypography.Text
        size={size}
        weight={weight}
        tone={tone}
        className={className}
      >
        {String(node)}
      </AppTypography.Text>
    );
  }

  return node;
}

function AppAlertBase({
  tone, // alias untuk type
  type = 'info',

  title, // alias message
  message,
  description,

  showIcon = true,
  closable = false,
  banner = false,

  icon,
  action,
  closeText,

  card = false,

  className,
  style,
  alertClassName,
  alertStyle,

  ...rest
}) {
  const resolvedType = tone ?? type;

  const msgNode = useMemo(
    () =>
      asText(title ?? message, {
        size: 13,
        weight: 800,
        tone: 'primary',
        className: 'text-slate-800',
      }),
    [title, message]
  );

  const descNode = useMemo(
    () =>
      asText(description, {
        size: 12,
        weight: 500,
        tone: 'muted',
        className: 'text-slate-600',
      }),
    [description]
  );

  const wrapperStyle = useMemo(() => ({ fontFamily, ...(style || {}) }), [style]);
  const mergedAlertStyle = useMemo(() => ({ fontFamily, ...(alertStyle || {}) }), [alertStyle]);

  const Wrapper = ({ children }) =>
    card ? (
      <div
        className={clsx('rounded-2xl bg-white ring-1 ring-slate-100 p-3', className)}
        style={wrapperStyle}
      >
        {children}
      </div>
    ) : (
      <div
        className={clsx(className)}
        style={wrapperStyle}
      >
        {children}
      </div>
    );

  return (
    <Wrapper>
      <Alert
        {...rest}
        type={resolvedType}
        message={msgNode}
        description={descNode}
        showIcon={showIcon}
        closable={closable}
        banner={banner}
        icon={icon}
        action={action}
        closeText={closeText}
        className={clsx('rounded-xl', alertClassName)}
        style={mergedAlertStyle}
      />
    </Wrapper>
  );
}

const AppAlert = Object.assign(AppAlertBase, {
  Success: (props) => (
    <AppAlertBase
      {...props}
      type='success'
    />
  ),
  Info: (props) => (
    <AppAlertBase
      {...props}
      type='info'
    />
  ),
  Warning: (props) => (
    <AppAlertBase
      {...props}
      type='warning'
    />
  ),
  Error: (props) => (
    <AppAlertBase
      {...props}
      type='error'
    />
  ),
});

export default AppAlert;
