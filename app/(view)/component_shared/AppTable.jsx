'use client';

import React, { useMemo } from 'react';
import { Table } from 'antd';
import clsx from 'classnames';
import AppTypography from './AppTypography';
import AppEmpty from './AppEmpty';
import { fontFamily } from './Font';

function resolveRowKey(rowKey) {
  if (rowKey) return rowKey;
  return (record, index) => record?.key ?? record?.id ?? record?._id ?? record?.uuid ?? record?.userId ?? index;
}

function mergeLocale(base, extra) {
  return { ...(base || {}), ...(extra || {}) };
}

function buildEmptyNode({ emptyTitle, emptyDescription, emptyImage }) {
  return (
    <AppEmpty
      image={emptyImage ?? AppEmpty.Simple}
      title={emptyTitle ?? 'Tidak ada data'}
      description={emptyDescription}
      centered
      className='py-6'
    />
  );
}

function resolvePagination(pagination, { totalLabel = 'data' } = {}) {
  if (pagination === false) return false;
  if (pagination == null) {
    return {
      pageSize: 10,
      showSizeChanger: true,
      showQuickJumper: true,
      showTotal: (total) => `Total ${total} ${totalLabel}`,
    };
  }
  return {
    showSizeChanger: true,
    showQuickJumper: true,
    ...pagination,
    showTotal: pagination.showTotal || ((total) => `Total ${total} ${totalLabel}`),
  };
}

/**
 * AppTable (antd Table wrapper)
 *
 * Props tambahan:
 * - title, subtitle, extra: header di atas table
 * - card: bungkus dengan card style (default true)
 * - emptyTitle, emptyDescription, emptyImage: untuk empty state
 * - containerClassName, headerClassName, tableClassName
 * - totalLabel: label pagination (default "data")
 */
export default function AppTable({
  title,
  subtitle,
  extra,

  card = true,
  containerClassName,
  headerClassName,
  tableClassName,

  emptyTitle,
  emptyDescription,
  emptyImage,

  totalLabel = 'data',

  rowKey,
  locale,
  pagination,
  scroll,

  className, // alias untuk containerClassName
  ...props
}) {
  const resolvedRowKey = useMemo(() => resolveRowKey(rowKey), [rowKey]);

  const resolvedLocale = useMemo(() => {
    const base = locale || {};
    const emptyText = base.emptyText ?? buildEmptyNode({ emptyTitle, emptyDescription, emptyImage });
    return mergeLocale(base, { emptyText });
  }, [locale, emptyTitle, emptyDescription, emptyImage]);

  const resolvedPagination = useMemo(() => resolvePagination(pagination, { totalLabel }), [pagination, totalLabel]);

  const resolvedScroll = useMemo(() => {
    if (scroll != null) return scroll;
    return { x: 'max-content' };
  }, [scroll]);

  const Wrapper = ({ children }) => {
    if (!card) return <div className={clsx('w-full', className)}>{children}</div>;
    return <div className={clsx('w-full rounded-2xl bg-white ring-1 ring-slate-100 shadow-sm', containerClassName, className)}>{children}</div>;
  };

  const hasHeader = Boolean(title) || Boolean(subtitle) || Boolean(extra);

  return (
    <Wrapper>
      {hasHeader ? (
        <div className={clsx('px-4 pt-4', headerClassName)}>
          <div className='flex items-start justify-between gap-3'>
            <div className='min-w-0'>
              {title ? (
                <AppTypography.Text
                  size={14}
                  weight={800}
                  className='text-slate-900 block'
                >
                  {title}
                </AppTypography.Text>
              ) : null}

              {subtitle ? (
                <AppTypography.Text
                  size={12}
                  tone='muted'
                  className='text-slate-500 block mt-0.5'
                >
                  {subtitle}
                </AppTypography.Text>
              ) : null}
            </div>

            {extra ? <div className='shrink-0'>{extra}</div> : null}
          </div>
        </div>
      ) : null}

      <div className={clsx(card ? 'p-4 pt-3' : null)}>
        <Table
          {...props}
          rowKey={resolvedRowKey}
          locale={resolvedLocale}
          pagination={resolvedPagination}
          scroll={resolvedScroll}
          className={clsx('sp-table', tableClassName)}
        />
      </div>

      <style
        jsx
        global
      >{`
        .sp-table .ant-table,
        .sp-table .ant-table-thead > tr > th,
        .sp-table .ant-table-tbody > tr > td,
        .sp-table .ant-pagination,
        .sp-table .ant-select,
        .sp-table .ant-select-selector {
          font-family: ${fontFamily};
        }

        .sp-table .ant-table {
          border-radius: 14px;
        }

        .sp-table .ant-table-container {
          border-radius: 14px;
        }

        .sp-table .ant-table-thead > tr > th {
          background: #f8fafc;
          color: rgba(15, 23, 42, 0.9);
          font-weight: 700;
        }
      `}</style>
    </Wrapper>
  );
}
