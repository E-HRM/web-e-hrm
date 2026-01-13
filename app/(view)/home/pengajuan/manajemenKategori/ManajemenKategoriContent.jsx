'use client';

import React, { useMemo } from 'react';
import { PlusOutlined, EditOutlined, DeleteOutlined, SearchOutlined } from '@ant-design/icons';

import AppTabs from '../../../component_shared/AppTabs';
import AppButton from '../../../component_shared/AppButton';
import AppTable from '../../../component_shared/AppTable';
import AppCard from '../../../component_shared/AppCard';
import AppSpace from '../../../component_shared/AppSpace';
import AppTooltip from '../../../component_shared/AppTooltip';
import AppModal from '../../../component_shared/AppModal';
import AppForm from '../../../component_shared/AppForm';
import AppInput from '../../../component_shared/AppInput';
import AppTag from '../../../component_shared/AppTag';
import AppTypography from '../../../component_shared/AppTypography';

import useManajemenKategoriviewModel from './useManajemenKategoriviewModel';

const DEFAULT_SCROLL_Y = 600;

function TabLabel({ text, count }) {
  const badgeClass = 'bg-slate-100 text-slate-600';

  return (
    <span className='inline-flex items-center gap-3 whitespace-nowrap'>
      <span className='font-semibold'>{text}</span>
      <span className={`inline-flex items-center justify-center min-w-7 h-7 px-2 rounded-full text-xs font-semibold ${badgeClass}`}>{count}</span>
    </span>
  );
}

function FormKategoriModal({ open, mode, kind, initialName, initialReduce = true, onCancel, onSubmit }) {
  const kindLabel = kind === 'cuti' ? 'Cuti' : kind === 'sakit' ? 'Izin Sakit' : 'Izin Jam';

  const submitText = mode === 'create' ? 'Simpan' : 'Simpan Perubahan';

  const fields = useMemo(() => {
    const base = [
      {
        type: 'text',
        name: 'nama_kategori',
        label: 'Nama Kategori',
        placeholder: 'Contoh: Cuti Tahunan',
        rules: [{ required: true, message: 'Nama kategori wajib diisi' }],
      },
    ];

    if (kind === 'cuti') {
      base.push({
        type: 'select',
        name: 'pengurangan_kouta',
        label: 'Pengurangan Kuota',
        tooltip: 'Apakah kategori ini mengurangi kuota cuti?',
        placeholder: 'Pilih status',
        options: [
          { value: true, label: 'Berkurang' },
          { value: false, label: 'Tidak berkurang' },
        ],
        rules: [{ required: true, message: 'Pilih status pengurangan kuota' }],
      });
    }

    return base;
  }, [kind]);

  return (
    <AppModal
      open={open}
      onClose={() => onCancel?.()}
      title={mode === 'create' ? `Tambah Kategori ${kindLabel}` : `Edit Kategori ${kindLabel}`}
      footer={false}
      destroyOnClose
    >
      <AppForm
        key={`${mode}-${kind}-${initialName ?? ''}-${String(initialReduce)}-${String(open)}`}
        initialValues={{
          nama_kategori: initialName || '',
          ...(kind === 'cuti' ? { pengurangan_kouta: initialReduce } : {}),
        }}
        showSubmit={false}
        fields={fields}
        footer={({ submit }) => (
          <div className='flex items-center justify-end gap-2 pt-2'>
            <AppButton
              variant='secondary'
              onClick={() => onCancel?.()}
            >
              Batal
            </AppButton>
            <AppButton
              variant='primary'
              onClick={submit}
            >
              {submitText}
            </AppButton>
          </div>
        )}
        onFinish={async (values) => {
          await onSubmit?.(values);
        }}
      />
    </AppModal>
  );
}

export default function ManajemenKategoriContent() {
  const vm = useManajemenKategoriviewModel();

  const colReduce = useMemo(
    () => ({
      title: 'Pengurangan Kuota',
      key: 'reduce',
      width: 180,
      render: (_, record) => {
        const isReduce = !!record?.reduce;
        return (
          <AppTag
            tone={isReduce ? 'success' : 'warning'}
            variant='soft'
          >
            {isReduce ? 'Berkurang' : 'Tidak berkurang'}
          </AppTag>
        );
      },
    }),
    []
  );

  const columns = (kind) => {
    const pag = kind === 'cuti' ? vm.pagCuti : kind === 'sakit' ? vm.pagSakit : vm.pagIzinJam;

    const current = pag?.page ?? 1;
    const pageSize = pag?.pageSize ?? 10;
    const offset = (current - 1) * pageSize;

    const base = [
      {
        title: 'NO',
        key: 'no',
        width: 70,
        align: 'center',
        render: (_r, __, index) => (
          <AppTypography.Text
            size={12}
            weight={700}
            tone='muted'
          >
            {offset + index + 1}
          </AppTypography.Text>
        ),
      },
      {
        title: 'NAMA KATEGORI',
        dataIndex: 'nama',
        key: 'nama',
        ellipsis: true,
        render: (text) => (
          <AppTypography.Text
            size={13}
            weight={700}
            className='text-slate-900 block truncate'
            title={text}
          >
            {text}
          </AppTypography.Text>
        ),
      },
    ];

    if (kind === 'cuti') base.push(colReduce);

    base.push({
      title: 'AKSI',
      key: 'aksi',
      width: 120,
      render: (_, record) => (
        <AppSpace size='sm'>
          <AppTooltip title='Edit'>
            <AppButton
              aria-label='Edit'
              variant='ghost'
              shape='circle'
              className='!w-8 !h-8 !p-0'
              icon={<EditOutlined />}
              onClick={() => vm.openEdit(kind, record)}
            />
          </AppTooltip>

          <AppTooltip title='Hapus'>
            <AppButton
              aria-label='Hapus'
              variant='ghost'
              shape='circle'
              className='!w-8 !h-8 !p-0'
              style={{ color: '#ff4d4f' }}
              icon={<DeleteOutlined />}
              onClick={() => vm.confirmDelete(kind, record)}
            />
          </AppTooltip>
        </AppSpace>
      ),
    });

    return base;
  };

  const TabContent = ({ kind, title, items, pag }) => {
    return (
      <AppTable
        card
        title={title}
        subtitle={`Menampilkan ${items.length} dari ${pag?.total ?? 0} kategori`}
        extra={
          <div className='flex items-center gap-2 flex-wrap justify-end'>
            <div className='w-72'>
              <AppInput
                allowClear
                placeholder='Cari kategori…'
                prefixIcon={<SearchOutlined className='text-gray-400' />}
                value={vm.search}
                onChange={(e) => vm.setSearch(e.target.value)}
              />
            </div>
            <AppButton
              variant='primary'
              icon={<PlusOutlined />}
              onClick={() => vm.openCreate(kind)}
            >
              Tambah Kategori
            </AppButton>
          </div>
        }
        rowKey='id'
        dataSource={items}
        columns={columns(kind)}
        loading={vm.loading}
        sticky
        tableLayout='fixed'
        scroll={{ y: DEFAULT_SCROLL_Y }}
        pagination={{
          current: pag?.page ?? 1,
          pageSize: pag?.pageSize ?? 10,
          total: pag?.total ?? 0,
          showSizeChanger: true,
          pageSizeOptions: [5, 10, 20, 50, 100],
          showTotal: (t, range) => `${range[0]}-${range[1]} dari ${t} data`,
          onChange: (p, ps) => vm.onPageChange(kind, p, ps),
        }}
        emptyTitle='Belum ada kategori'
        emptyDescription='Tambahkan kategori untuk mulai mengelola data.'
        emptyImage={<div className='text-3xl'>🗂️</div>}
        rowClassName={() => 'no-hover-row'}
      />
    );
  };

  const tabs = useMemo(() => {
    const cutiTotal = vm.pagCuti?.total ?? 0;
    const sakitTotal = vm.pagSakit?.total ?? 0;
    const izinJamTotal = vm.pagIzinJam?.total ?? 0;

    return [
      {
        key: 'cuti',
        label: (
          <TabLabel
            text='Kategori Cuti'
            count={cutiTotal}
            tone='warning'
          />
        ),
        children: (
          <div className='mt-6'>
            <TabContent
              kind='cuti'
              title='Kategori Cuti'
              items={vm.itemsCuti}
              pag={vm.pagCuti}
            />
          </div>
        ),
      },
      {
        key: 'sakit',
        label: (
          <TabLabel
            text='Izin Sakit'
            count={sakitTotal}
            tone='success'
          />
        ),
        children: (
          <div className='mt-6'>
            <TabContent
              kind='sakit'
              title='Kategori Izin Sakit'
              items={vm.itemsSakit}
              pag={vm.pagSakit}
            />
          </div>
        ),
      },
      {
        key: 'izinjam',
        label: (
          <TabLabel
            text='Izin Jam'
            count={izinJamTotal}
            tone='danger'
          />
        ),
        children: (
          <div className='mt-6'>
            <TabContent
              kind='izinjam'
              title='Kategori Izin Jam'
              items={vm.itemsIzinJam}
              pag={vm.pagIzinJam}
            />
          </div>
        ),
      },
    ];
  }, [vm.pagCuti?.total, vm.pagSakit?.total, vm.pagIzinJam?.total, vm.itemsCuti, vm.itemsSakit, vm.itemsIzinJam, vm.pagCuti, vm.pagSakit, vm.pagIzinJam, vm.search, vm.loading]);

  return (
    <div className='min-h-screen bg-gray-50 p-6'>
      <div className='mb-6'>
        <AppTypography.Title
          level={3}
          className='!mb-1'
        >
          Manajemen Kategori
        </AppTypography.Title>
        <AppTypography.Text tone='secondary'>Kelola kategori cuti, izin sakit, dan izin jam dalam satu tempat</AppTypography.Text>
      </div>

      <AppCard className='shadow-sm border-0'>
        <AppTabs
          className='mk-tabs'
          activeKey={vm.activeTab}
          onChange={vm.setActiveTab}
          variant='line'
          size='large'
          tabBarGutter={40}
          items={tabs}
        />
      </AppCard>

      <style
        jsx
        global
      >{`
        .mk-tabs .ant-tabs-nav {
          margin: 0 !important;
        }

        .mk-tabs .ant-tabs-tab {
          margin: 0 !important;
          padding: 12px 22px !important;
        }

        .mk-tabs .ant-tabs-tab-btn {
          display: inline-flex !important;
          align-items: center !important;
        }

        .no-hover-row:hover > td {
          background: transparent !important;
        }

        .ant-table-tbody > tr.ant-table-row:hover > td {
          background: transparent !important;
        }
      `}</style>

      <FormKategoriModal
        open={vm.modalOpen}
        mode={vm.modalMode}
        kind={vm.modalKind}
        initialName={vm.editingItem?.nama}
        initialReduce={vm.editingItem?.reduce ?? true}
        onCancel={() => vm.setModalOpen(false)}
        onSubmit={async (values) => {
          await vm.submitForm(values);
          vm.setModalOpen(false);
        }}
      />
    </div>
  );
}
