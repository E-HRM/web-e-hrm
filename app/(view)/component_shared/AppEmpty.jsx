'use client';

import React from 'react';
import { Empty } from 'antd';
import clsx from 'classnames';
import AppTypography from './AppTypography';
import { fontFamily } from './Font';

function asText(node, { size = 13, weight = 600, tone = 'muted', className } = {}) {
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

function AppEmptyBase({
  title,
  description = 'Tidak ada data.',
  image = Empty.PRESENTED_IMAGE_SIMPLE,
  imageStyle,

  action,

  centered = true,
  compact = false,

  className,
  style,

  emptyProps,
}) {
  const titleNode = asText(title, {
    size: 14,
    weight: 700,
    tone: 'primary',
    className: 'text-slate-800',
  });

  const descNode = asText(description, {
    size: 12,
    weight: 500,
    tone: 'muted',
    className: 'text-slate-500',
  });

  return (
    <div
      className={clsx('w-full', centered ? 'flex justify-center' : null, className)}
      style={{ fontFamily, ...(style || {}) }}
    >
      <div className={clsx(centered ? 'text-center' : null, compact ? 'py-2' : 'py-4')}>
        {titleNode ? <div className='mb-1'>{titleNode}</div> : null}

        <Empty
          {...(emptyProps || {})}
          image={image}
          imageStyle={imageStyle}
          description={descNode}
        >
          {action ? <div className='mt-2 flex justify-center'>{action}</div> : null}
        </Empty>
      </div>
    </div>
  );
}

function AppEmptyCard(props) {
  const { className, style, ...rest } = props;
  return (
    <AppEmptyBase
      {...rest}
      className={clsx('rounded-2xl bg-white ring-1 ring-slate-100 px-4', className)}
      style={style}
    />
  );
}

const AppEmpty = Object.assign(AppEmptyBase, {
  Card: AppEmptyCard,
  Simple: Empty.PRESENTED_IMAGE_SIMPLE,
  Default: Empty.PRESENTED_IMAGE_DEFAULT,
});

export default AppEmpty;
