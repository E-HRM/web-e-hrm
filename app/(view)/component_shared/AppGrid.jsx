'use client';

import React, { useMemo } from 'react';
import { Row, Col, Grid } from 'antd';
import clsx from 'classnames';

function normalizeGutter(gutter) {
  if (gutter == null) return undefined;
  if (Array.isArray(gutter)) return gutter;
  if (typeof gutter === 'number') return [gutter, gutter];
  return gutter;
}

function AppRow({ children, className, gutter, gap, dense = false, roomy = false, wrap = true, align, justify, style, ...rest }) {
  const resolvedGutter = useMemo(() => {
    if (gap != null) return normalizeGutter(gap);
    if (gutter != null) return normalizeGutter(gutter);
    if (dense) return [8, 8];
    if (roomy) return [24, 24];
    return [16, 16];
  }, [gap, gutter, dense, roomy]);

  return (
    <Row
      {...rest}
      wrap={wrap}
      align={align}
      justify={justify}
      gutter={resolvedGutter}
      className={clsx(className)}
      style={style}
    >
      {children}
    </Row>
  );
}

function AppCol({ children, className, style, ...rest }) {
  return (
    <Col
      {...rest}
      className={clsx(className)}
      style={style}
    >
      {children}
    </Col>
  );
}

const AppGrid = Object.assign(
  function AppGridRoot() {
    return null;
  },
  {
    Row: AppRow,
    Col: AppCol,
    useBreakpoint: Grid.useBreakpoint,
  }
);

export default AppGrid;
