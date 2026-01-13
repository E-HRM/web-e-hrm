'use client';

import React, { useMemo } from 'react';
import { Skeleton } from 'antd';
import clsx from 'classnames';
import AppCard from './AppCard';
import AppSpace from './AppSpace';
import AppTypography from './AppTypography';
import { fontFamily } from './Font';

function cx(...parts) {
  return parts.filter(Boolean).join(' ');
}

function normalizeWidths(widths, count) {
  if (!widths) return undefined;
  if (Array.isArray(widths)) return widths;
  return Array.from({ length: count }).map(() => widths);
}

function resolveParagraph(paragraph, { rows = 3, widths } = {}) {
  if (paragraph === false) return false;
  if (paragraph && typeof paragraph === 'object') return paragraph;

  const w = normalizeWidths(widths, rows);
  return {
    rows,
    width: w,
  };
}

function resolveTitle(title, { width } = {}) {
  if (title === false) return false;
  if (title && typeof title === 'object') return title;
  if (title === true) return { width: width ?? '38%' };
  return title; // null/undefined -> AntD default
}

function SkeletonFieldShell({ label, required, hint, error, extra, labelClassName, messageClassName, children }) {
  const hasTop = Boolean(label) || Boolean(extra);
  const hasMsg = Boolean(error) || Boolean(hint);

  return (
    <div
      className='w-full'
      style={{ fontFamily }}
    >
      {hasTop && (
        <div className='mb-1.5 flex items-start justify-between gap-3'>
          {label ? (
            <div className='min-w-0'>
              <AppTypography.Text
                size={12}
                weight={600}
                className={clsx('text-gray-700', labelClassName)}
              >
                {label}
                {required ? <span className='ml-1 text-rose-600'>*</span> : null}
              </AppTypography.Text>
            </div>
          ) : (
            <span />
          )}

          {extra ? <div className='shrink-0'>{extra}</div> : null}
        </div>
      )}

      {children}

      {hasMsg && (
        <div className='mt-1.5'>
          {error ? (
            <AppTypography.Text
              size={12}
              weight={500}
              className={clsx('text-rose-600', messageClassName)}
            >
              {error}
            </AppTypography.Text>
          ) : (
            <AppTypography.Text
              size={12}
              tone='muted'
              className={clsx('text-gray-500', messageClassName)}
            >
              {hint}
            </AppTypography.Text>
          )}
        </div>
      )}
    </div>
  );
}

function SkeletonTable({
  rows = 6,
  columns,
  header = true,
  dense = false,
  bordered = true,

  cellHeight = dense ? 18 : 22,
  rowGap = dense ? 10 : 12,
  colGap = dense ? 10 : 12,

  className,
  style,
}) {
  const cols = useMemo(() => {
    if (Array.isArray(columns) && columns.length > 0) return columns;

    // default 5 columns table
    return ['22%', '18%', '18%', '18%', '14%'];
  }, [columns]);

  const normalizedCols = useMemo(() => {
    return cols.map((c, i) => {
      if (typeof c === 'string' || typeof c === 'number') {
        return { key: String(i), width: c, align: 'left', type: 'input' };
      }
      return {
        key: c?.key ?? String(i),
        width: c?.width ?? 'auto',
        align: c?.align ?? 'left',
        type: c?.type ?? 'input', // input | button
      };
    });
  }, [cols]);

  return (
    <div
      className={clsx('w-full', bordered ? 'rounded-2xl border border-gray-200 bg-white' : null, className)}
      style={{ ...(style || {}), fontFamily }}
      role='status'
      aria-live='polite'
      aria-busy='true'
    >
      <div className='w-full overflow-hidden rounded-2xl'>
        <div
          className='w-full'
          style={{
            display: 'grid',
            gridTemplateColumns: normalizedCols.map((c) => (typeof c.width === 'number' ? `${c.width}px` : String(c.width))).join(' '),
            gap: colGap,
            padding: dense ? 12 : 14,
          }}
        >
          {header
            ? normalizedCols.map((c) => (
                <div
                  key={`h-${c.key}`}
                  className={cx(c.align === 'right' ? 'text-right' : c.align === 'center' ? 'text-center' : '')}
                >
                  <Skeleton.Input
                    active
                    size='small'
                    style={{ width: '70%', height: cellHeight, borderRadius: 10 }}
                  />
                </div>
              ))
            : null}
        </div>

        <div className='border-t border-gray-200' />

        <div
          className='w-full'
          style={{
            padding: dense ? 12 : 14,
            display: 'grid',
            gap: rowGap,
          }}
        >
          {Array.from({ length: rows }).map((_, r) => (
            <div
              key={`r-${r}`}
              style={{
                display: 'grid',
                gridTemplateColumns: normalizedCols.map((c) => (typeof c.width === 'number' ? `${c.width}px` : String(c.width))).join(' '),
                gap: colGap,
                alignItems: 'center',
              }}
            >
              {normalizedCols.map((c) => {
                const alignCls = c.align === 'right' ? 'text-right' : c.align === 'center' ? 'text-center' : '';
                const node =
                  c.type === 'button' ? (
                    <Skeleton.Button
                      active
                      size='small'
                      style={{ height: cellHeight + 4, borderRadius: 12, width: '80%' }}
                    />
                  ) : (
                    <Skeleton.Input
                      active
                      size='small'
                      style={{ height: cellHeight, borderRadius: 10, width: '100%' }}
                    />
                  );

                return (
                  <div
                    key={`${r}-${c.key}`}
                    className={alignCls}
                  >
                    {node}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function SkeletonList({ rows = 5, avatar = true, twoLine = true, dense = false, className, style }) {
  return (
    <div
      className={clsx('w-full', className)}
      style={{ ...(style || {}), fontFamily }}
      aria-busy='true'
      aria-live='polite'
    >
      <div className={clsx('rounded-2xl border border-gray-200 bg-white', dense ? 'p-3' : 'p-4')}>
        <div
          className='w-full'
          style={{ display: 'grid', gap: dense ? 12 : 14 }}
        >
          {Array.from({ length: rows }).map((_, i) => (
            <div
              key={i}
              className='flex items-center gap-3'
            >
              {avatar ? (
                <Skeleton.Avatar
                  active
                  size={dense ? 'default' : 'large'}
                  shape='circle'
                />
              ) : null}
              <div className='min-w-0 flex-1'>
                <Skeleton
                  active
                  title={{ width: '45%' }}
                  paragraph={twoLine ? { rows: 1, width: ['85%'] } : false}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function SkeletonCard({ title = true, paragraphRows = 3, paragraphWidths, avatar = false, actions = 0, className, bodyClassName, style }) {
  const actionNodes = useMemo(() => {
    if (!actions || actions <= 0) return undefined;
    return Array.from({ length: actions }).map((_, i) => (
      <Skeleton.Button
        key={i}
        active
        size='small'
        style={{ borderRadius: 12, width: 88 }}
      />
    ));
  }, [actions]);

  return (
    <AppCard
      className={clsx('w-full', className)}
      style={{ ...(style || {}), fontFamily }}
    >
      <div className={clsx('w-full', bodyClassName)}>
        <Skeleton
          active
          avatar={avatar ? { shape: 'circle' } : false}
          title={resolveTitle(title, { width: '42%' })}
          paragraph={resolveParagraph(true, { rows: paragraphRows, widths: paragraphWidths })}
        />
        {actionNodes ? (
          <div className='mt-3'>
            <AppSpace
              size='sm'
              wrap
            >
              {actionNodes}
            </AppSpace>
          </div>
        ) : null}
      </div>
    </AppCard>
  );
}

/**
 * AppSkeleton
 *
 * Wrapper Skeleton AntD agar konsisten dengan design system project ini.
 *
 * Presets:
 * - <AppSkeleton.Table loading rows={8} />
 * - <AppSkeleton.List loading rows={6} />
 * - <AppSkeleton.Card loading paragraphRows={4} actions={2} />
 *
 * Field:
 * - <AppSkeleton label="Nama" variant="input" />
 * - <AppSkeleton.Field label="Email"><Skeleton.Input active block /></AppSkeleton.Field>
 */
export default function AppSkeleton({
  loading = true,
  children,

  className,
  style,

  active = true,
  round = true,
  avatar,
  title,
  paragraph,

  variant = 'default', // default | text | input | button | avatar | image | card | table | list
  rows = 3,
  widths,

  tableColumns,
  tableHeader = true,
  tableDense = false,
  tableBordered = true,

  listAvatar = true,
  listTwoLine = true,
  listDense = false,

  cardTitle = true,
  cardAvatar = false,
  cardActions = 0,
  cardParagraphRows = 3,
  cardParagraphWidths,

  label,
  required,
  hint,
  error,
  extra,
  labelClassName,
  messageClassName,

  ...rest
}) {
  const show = Boolean(loading);

  const node = useMemo(() => {
    if (!show) return null;

    if (variant === 'table') {
      return (
        <SkeletonTable
          rows={typeof rows === 'number' ? rows : 6}
          columns={tableColumns}
          header={tableHeader}
          dense={tableDense}
          bordered={tableBordered}
          className={className}
          style={style}
        />
      );
    }

    if (variant === 'list') {
      return (
        <SkeletonList
          rows={typeof rows === 'number' ? rows : 5}
          avatar={listAvatar}
          twoLine={listTwoLine}
          dense={listDense}
          className={className}
          style={style}
        />
      );
    }

    if (variant === 'card') {
      return (
        <SkeletonCard
          title={cardTitle}
          avatar={cardAvatar}
          actions={cardActions}
          paragraphRows={cardParagraphRows}
          paragraphWidths={cardParagraphWidths}
          className={className}
          style={style}
        />
      );
    }

    if (variant === 'avatar') {
      return (
        <div
          className={clsx('inline-flex', className)}
          style={{ ...(style || {}), fontFamily }}
        >
          <Skeleton.Avatar
            active={active}
            shape='circle'
            {...rest}
          />
        </div>
      );
    }

    if (variant === 'button') {
      return (
        <div
          className={clsx('inline-flex', className)}
          style={{ ...(style || {}), fontFamily }}
        >
          <Skeleton.Button
            active={active}
            {...rest}
          />
        </div>
      );
    }

    if (variant === 'input') {
      return (
        <div
          className={clsx('w-full', className)}
          style={{ ...(style || {}), fontFamily }}
        >
          <Skeleton.Input
            active={active}
            block
            {...rest}
          />
        </div>
      );
    }

    if (variant === 'image') {
      return (
        <div
          className={clsx('w-full', className)}
          style={{ ...(style || {}), fontFamily }}
        >
          <Skeleton.Image
            active={active}
            {...rest}
          />
        </div>
      );
    }

    if (variant === 'text') {
      return (
        <div
          className={clsx('w-full', className)}
          style={{ ...(style || {}), fontFamily }}
        >
          <Skeleton
            active={active}
            round={round}
            avatar={false}
            title={false}
            paragraph={resolveParagraph(paragraph, { rows, widths })}
            {...rest}
          />
        </div>
      );
    }

    return (
      <div
        className={clsx('w-full', className)}
        style={{ ...(style || {}), fontFamily }}
      >
        <Skeleton
          active={active}
          round={round}
          avatar={avatar}
          title={resolveTitle(title, { width: '42%' })}
          paragraph={resolveParagraph(paragraph, { rows, widths })}
          {...rest}
        />
      </div>
    );
  }, [
    active,
    avatar,
    className,
    paragraph,
    rest,
    round,
    rows,
    show,
    style,
    tableBordered,
    tableColumns,
    tableDense,
    tableHeader,
    title,
    variant,
    widths,
    listAvatar,
    listTwoLine,
    listDense,
    cardTitle,
    cardAvatar,
    cardActions,
    cardParagraphRows,
    cardParagraphWidths,
  ]);

  if (!show) return children ?? null;

  if (label || hint || error || extra) {
    return (
      <SkeletonFieldShell
        label={label}
        required={required}
        hint={hint}
        error={error}
        extra={extra}
        labelClassName={labelClassName}
        messageClassName={messageClassName}
      >
        {node}
      </SkeletonFieldShell>
    );
  }

  return node;
}

AppSkeleton.Table = function AppSkeletonTable({ loading = true, ...props }) {
  return (
    <AppSkeleton
      loading={loading}
      variant='table'
      {...props}
    />
  );
};

AppSkeleton.List = function AppSkeletonListPreset({ loading = true, ...props }) {
  return (
    <AppSkeleton
      loading={loading}
      variant='list'
      {...props}
    />
  );
};

AppSkeleton.Card = function AppSkeletonCardPreset({ loading = true, ...props }) {
  return (
    <AppSkeleton
      loading={loading}
      variant='card'
      {...props}
    />
  );
};

AppSkeleton.Field = function AppSkeletonField({ children, label, required, hint, error, extra, labelClassName, messageClassName, className, style }) {
  return (
    <SkeletonFieldShell
      label={label}
      required={required}
      hint={hint}
      error={error}
      extra={extra}
      labelClassName={labelClassName}
      messageClassName={messageClassName}
    >
      <div
        className={clsx('w-full', className)}
        style={{ ...(style || {}), fontFamily }}
      >
        {children}
      </div>
    </SkeletonFieldShell>
  );
};
