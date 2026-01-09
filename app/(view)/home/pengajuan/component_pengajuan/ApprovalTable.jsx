'use client';

import React, { useMemo } from 'react';
import AppTable from '@/app/(view)/component_shared/AppTable';

export default function ApprovalTable({ columns, dataSource, page, pageSize, total, onChangePage, loading, pageSizeOptions = [10, 20, 50], scrollX = 1200, scrollY = 600 }) {
  const safeTotal = useMemo(() => {
    if (typeof total === 'number') return total;
    if (Array.isArray(dataSource)) return dataSource.length;
    return 0;
  }, [total, dataSource]);

  return (
    <>
      <AppTable
        card={false}
        columns={columns}
        dataSource={dataSource}
        size='middle'
        tableLayout='fixed'
        sticky
        pagination={{
          current: page,
          pageSize,
          total: safeTotal,
          pageSizeOptions,
          showSizeChanger: true,
          showQuickJumper: false,
          showTotal: (t, range) => `${range[0]}-${range[1]} dari ${t} data`,
          onChange: onChangePage,
        }}
        scroll={{ x: scrollX, y: scrollY }}
        loading={loading}
        rowClassName={() => 'approval-table-row'}
        tableClassName='approval-table'
      />

      <style
        jsx
        global
      >{`
        /* pastikan semua sel putih & rata atas */
        .approval-table .approval-table-row > td {
          background-color: #ffffff !important;
          vertical-align: top !important;
        }

        /* hilangkan efek hover abu-abu TANPA tembus pandang */
        .approval-table .ant-table-tbody > tr.approval-table-row:hover > td {
          background-color: #ffffff !important;
        }

        /* sticky kiri/kanan juga putih */
        .approval-table .ant-table-tbody > tr.approval-table-row > td.ant-table-cell-fix-left,
        .approval-table .ant-table-tbody > tr.approval-table-row > td.ant-table-cell-fix-right {
          background-color: #ffffff !important;
        }

        /* matikan shadow garis vertikal sticky kolom */
        .approval-table .ant-table-cell-fix-right-first::after,
        .approval-table .ant-table-cell-fix-left-last::after {
          box-shadow: none !important;
        }
      `}</style>
    </>
  );
}
