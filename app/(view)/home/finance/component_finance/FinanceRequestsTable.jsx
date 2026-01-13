'use client';

import React, { useMemo } from 'react';

import AppTable from '@/app/(view)/component_shared/AppTable';
import AppAvatar from '@/app/(view)/component_shared/AppAvatar';
import AppTypography from '@/app/(view)/component_shared/AppTypography';

import FinanceStatusTag from './FinanceStatusTag';

function formatIDR(num) {
  const n = Number(num || 0);
  return new Intl.NumberFormat('id-ID').format(Number.isFinite(n) ? n : 0);
}

function EmployeeCell({ name, department, avatarUrl }) {
  return (
    <div className='flex items-center gap-3 min-w-[240px]'>
      <AppAvatar
        src={avatarUrl}
        name={name}
        size={36}
      />

      <div className='min-w-0'>
        <AppTypography.Text
          weight={800}
          className='block text-slate-900 truncate'
        >
          {name}
        </AppTypography.Text>
        <AppTypography.Text
          size={12}
          tone='muted'
          className='block text-slate-500 truncate'
        >
          {department}
        </AppTypography.Text>
      </div>
    </div>
  );
}

export default function FinanceRequestsTable({ rows = [], onRowClick }) {
  const columns = useMemo(
    () => [
      {
        title: 'KARYAWAN',
        key: 'employee',
        width: 280,
        render: (_, r) => (
          <EmployeeCell
            name={r.employeeName}
            department={r.department}
            avatarUrl={r.avatarUrl}
          />
        ),
      },
      {
        title: 'DETAIL PENGAJUAN',
        key: 'detail',
        render: (_, r) => (
          <AppTypography.Text className='text-slate-700'>
            {r.itemsCount} items • Rp {formatIDR(r.totalAmount)}
          </AppTypography.Text>
        ),
      },
      {
        title: 'KATEGORI',
        dataIndex: 'category',
        key: 'category',
        width: 200,
        render: (v) => (
          <AppTypography.Text className='text-slate-700'>{v || '—'}</AppTypography.Text>
        ),
      },
      {
        title: 'STATUS',
        dataIndex: 'status',
        key: 'status',
        width: 140,
        render: (v) => <FinanceStatusTag status={v} />,
      },
      {
        title: 'TANGGAL',
        dataIndex: 'dateLabel',
        key: 'date',
        width: 160,
        render: (v) => (
          <AppTypography.Text className='text-slate-700'>{v || '—'}</AppTypography.Text>
        ),
      },
    ],
    []
  );

  const dataSource = useMemo(
    () =>
      (rows || []).map((r) => ({
        key: r.id,
        ...r,
      })),
    [rows]
  );

  return (
    <AppTable
      card={false}
      columns={columns}
      dataSource={dataSource}
      pagination={false}
      totalLabel='pengajuan'
      onRow={(record) => ({
        onClick: () => onRowClick?.(record),
        style: { cursor: onRowClick ? 'pointer' : 'default' },
      })}
    />
  );
}
