'use client';

import React, { useMemo, useState } from 'react';

import AppModal from '@/app/(view)/component_shared/AppModal';
import AppTable from '@/app/(view)/component_shared/AppTable';
import AppButton from '@/app/(view)/component_shared/AppButton';
import AppSpace from '@/app/(view)/component_shared/AppSpace';
import AppTypography from '@/app/(view)/component_shared/AppTypography';
import AppTooltip from '@/app/(view)/component_shared/AppTooltip';

import { PlusOutlined, EditOutlined } from '@ant-design/icons';

import SOPCategoryFormModal from './SOPCategoryFormModal';

export default function SOPCategoryModal({
  open,
  categories,
  onClose,
  onSave,
  toSnakeCaseKey,
  nowISO,
}) {
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);

  const existingKeys = useMemo(() => (categories || []).map((c) => c.key), [categories]);

  const columns = useMemo(
    () => [
      {
        title: 'NAMA KATEGORI',
        dataIndex: 'name',
        key: 'name',
        render: (text, record) => (
          <div className="min-w-0">
            <AppTypography.Text
              size={13}
              weight={800}
              className="text-slate-900 block truncate"
              title={text}
            >
              {text}
            </AppTypography.Text>
            <AppTypography.Text size={12} tone="muted" className="text-slate-500 block">
              Key: {record.key}
            </AppTypography.Text>
          </div>
        ),
      },
      {
        title: 'DESKRIPSI',
        dataIndex: 'description',
        key: 'description',
        ellipsis: true,
        render: (t) => (
          <AppTypography.Text className="text-slate-700 block truncate" title={t}>
            {t}
          </AppTypography.Text>
        ),
      },
      {
        title: 'AKSI',
        key: 'action',
        width: 120,
        align: 'center',
        render: (_, record) => (
          <AppSpace size="sm">
            <AppTooltip title="Edit">
              <AppButton
                aria-label="Edit"
                variant="ghost"
                shape="circle"
                className="!w-8 !h-8 !p-0"
                icon={<EditOutlined />}
                onClick={() => {
                  setEditing(record);
                  setFormOpen(true);
                }}
              />
            </AppTooltip>
          </AppSpace>
        ),
      },
    ],
    []
  );

  return (
    <>
      <AppModal
        open={open}
        onClose={onClose}
        onCancel={onClose}
        title="Manajemen Kategori SOP"
        subtitle={`Total ${categories?.length || 0} kategori`}
        footer={false}
        width={980}
        destroyOnClose
      >
        <div className="flex items-center justify-end mb-4">
          <AppButton
            variant="primary"
            icon={<PlusOutlined />}
            onClick={() => {
              setEditing(null);
              setFormOpen(true);
            }}
          >
            Tambah Kategori Baru
          </AppButton>
        </div>

        <AppTable
          rowKey="id"
          dataSource={categories || []}
          columns={columns}
          pagination={false}
          sticky
          tableLayout="fixed"
          emptyTitle="Belum ada kategori"
          emptyDescription="Tambahkan kategori untuk mulai mengelola SOP."
          emptyImage={<div className="text-3xl">📚</div>}
          rowClassName={() => 'no-hover-row'}
        />

        <style jsx global>{`
          .no-hover-row:hover > td {
            background: transparent !important;
          }
          .ant-table-tbody > tr.ant-table-row:hover > td {
            background: transparent !important;
          }
        `}</style>
      </AppModal>

      <SOPCategoryFormModal
        open={formOpen}
        category={editing}
        existingKeys={existingKeys}
        onClose={() => {
          setFormOpen(false);
          setEditing(null);
        }}
        onSave={(payload) => {
          onSave?.(payload);
          setFormOpen(false);
          setEditing(null);
        }}
        toSnakeCaseKey={toSnakeCaseKey}
        nowISO={nowISO}
      />
    </>
  );
}
