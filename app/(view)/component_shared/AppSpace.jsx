'use client';

import React, { useMemo } from 'react';
import { Space } from 'antd';
import { fontFamily } from './Font';

const SIZE_MAP = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
};

function resolveSize(size) {
  if (Array.isArray(size)) {
    return size.map((s) => (typeof s === 'string' ? SIZE_MAP[s] ?? s : s));
  }
  if (typeof size === 'string') return SIZE_MAP[size] ?? size;
  return size;
}

function cx(...parts) {
  return parts.filter(Boolean).join(' ');
}

function AppSpace({ direction = 'horizontal', size = 'md', wrap = false, align, split, block = false, stretch = false, className, style, children, ...rest }) {
  const resolvedSize = useMemo(() => resolveSize(size), [size]);

  const mergedStyle = useMemo(() => {
    const next = { fontFamily, ...(style || {}) };
    if (block) next.width = '100%';
    return next;
  }, [block, style]);

  const classes = cx('sp-space', block && 'sp-space-block', stretch && 'sp-space-stretch', className);

  return (
    <>
      <Space
        {...rest}
        direction={direction}
        size={resolvedSize}
        wrap={wrap}
        align={align}
        split={split}
        className={classes}
        style={mergedStyle}
      >
        {children}
      </Space>

      <style
        jsx
        global
      >{`
        .sp-space.ant-space {
          font-family: ${fontFamily} !important;
        }
        .sp-space-block.ant-space {
          width: 100%;
        }
        .sp-space-stretch.ant-space > .ant-space-item {
          width: 100%;
        }
      `}</style>
    </>
  );
}

export default AppSpace;

export function AppVStack(props) {
  return (
    <AppSpace
      direction='vertical'
      block
      stretch
      {...props}
    />
  );
}

export function AppHStack(props) {
  return (
    <AppSpace
      direction='horizontal'
      {...props}
    />
  );
}
