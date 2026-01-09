'use client';

import React, { useMemo } from 'react';
import { Card } from 'antd';
import clsx from 'classnames';
import { fontFamily } from './Font';

function AppCardBase({
  className,
  style,
  bodyStyle,
  headStyle,

  tone = 'white', // 'white' | 'soft' | 'transparent'
  ring = true,
  shadow = 'sm', // 'none' | 'sm' | 'md'
  rounded = '2xl', // tailwind radius

  padding, // override body padding (number | string)
  noPadding = false,

  ...props
}) {
  const toneClass = useMemo(() => {
    if (tone === 'transparent') return 'bg-transparent';
    if (tone === 'soft') return 'bg-[#FAFAFB]';
    return 'bg-white';
  }, [tone]);

  const shadowClass = useMemo(() => {
    if (shadow === 'none') return '';
    if (shadow === 'md') return 'shadow-md';
    return 'shadow-sm';
  }, [shadow]);

  const roundedClass = useMemo(() => {
    // default: rounded-2xl
    return rounded ? `rounded-${rounded}` : 'rounded-2xl';
  }, [rounded]);

  const mergedStyle = useMemo(() => ({ fontFamily, ...(style || {}) }), [style]);

  const mergedBodyStyle = useMemo(() => {
    const base = { ...(bodyStyle || {}) };
    if (noPadding) {
      if (base.padding == null) base.padding = 0;
      return base;
    }
    if (padding != null && base.padding == null) {
      base.padding = padding;
    }
    return base;
  }, [bodyStyle, padding, noPadding]);

  const mergedHeadStyle = useMemo(() => ({ ...(headStyle || {}), fontFamily }), [headStyle]);

  return (
    <>
      <Card
        {...props}
        className={clsx('sp-card', toneClass, shadowClass, roundedClass, ring ? 'ring-1 ring-slate-100' : '', className)}
        style={mergedStyle}
        bodyStyle={mergedBodyStyle}
        headStyle={mergedHeadStyle}
      />
      <style
        jsx
        global
      >{`
        .sp-card.ant-card,
        .sp-card.ant-card * {
          font-family: ${fontFamily} !important;
        }
        .sp-card.ant-card {
          overflow: hidden;
        }
        .sp-card.ant-card .ant-card-head {
          border-bottom-color: rgba(226, 232, 240, 0.9);
        }
      `}</style>
    </>
  );
}

const AppCard = Object.assign(AppCardBase, {
  Meta: Card.Meta,
});

export default AppCard;
