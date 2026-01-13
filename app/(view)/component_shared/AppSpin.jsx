'use client';

import React, { useMemo } from 'react';
import { Spin } from 'antd';
import clsx from 'classnames';
import AppTypography from './AppTypography';
import { fontFamily } from './Font';

function renderTip(tip) {
  if (!tip) return null;
  if (typeof tip === 'string' || typeof tip === 'number') {
    return (
      <AppTypography.Text
        size={12}
        weight={600}
        className='text-gray-600'
      >
        {String(tip)}
      </AppTypography.Text>
    );
  }
  return tip;
}

function AppSpinBase({
  spinning = false,
  tip,
  size = 'default',
  delay = 150,
  indicator,

  className,
  style,

  children,
  ...rest
}) {
  const mergedStyle = useMemo(() => ({ fontFamily, ...(style || {}) }), [style]);

  return (
    <Spin
      {...rest}
      spinning={Boolean(spinning)}
      size={size}
      delay={delay}
      indicator={indicator}
      tip={renderTip(tip)}
      className={className}
      style={mergedStyle}
    >
      {children}
    </Spin>
  );
}

function AppSpinOverlay({
  spinning = false,
  tip,
  size = 'default',
  delay = 150,
  indicator,

  backdrop = 'rgba(255,255,255,0.75)',
  blur = 0,
  zIndex = 30,

  wrapperClassName,
  overlayClassName,
  contentClassName,

  children,
}) {
  const show = Boolean(spinning);

  return (
    <div
      className={clsx('relative w-full', wrapperClassName)}
      style={{ fontFamily }}
    >
      <div
        className={clsx(contentClassName, show && blur ? 'transition' : null)}
        style={show && blur ? { filter: `blur(${blur}px)` } : undefined}
      >
        {children}
      </div>

      {show ? (
        <div
          className={clsx('absolute inset-0 grid place-items-center rounded-2xl', overlayClassName)}
          style={{ background: backdrop, zIndex }}
          aria-busy='true'
          aria-live='polite'
        >
          <Spin
            spinning
            tip={renderTip(tip)}
            size={size}
            delay={delay}
            indicator={indicator}
          />
        </div>
      ) : null}
    </div>
  );
}

function AppSpinFullscreen({
  spinning = false,
  tip,
  size = 'default',
  delay = 150,
  indicator,

  backdrop = 'rgba(255,255,255,0.85)',
  zIndex = 999,

  className,
}) {
  if (!spinning) return null;

  return (
    <div
      className={clsx('fixed inset-0 grid place-items-center', className)}
      style={{ background: backdrop, zIndex, fontFamily }}
      aria-busy='true'
      aria-live='polite'
    >
      <Spin
        spinning
        tip={renderTip(tip)}
        size={size}
        delay={delay}
        indicator={indicator}
      />
    </div>
  );
}

const AppSpin = Object.assign(AppSpinBase, {
  Overlay: AppSpinOverlay,
  Fullscreen: AppSpinFullscreen,
});

export default AppSpin;
