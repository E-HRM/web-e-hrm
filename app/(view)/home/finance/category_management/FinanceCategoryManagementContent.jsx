'use client';

import React, { useMemo } from 'react';
import { PlusOutlined, EditOutlined, DeleteOutlined, SearchOutlined } from '@ant-design/icons';

import AppTabs from '@/app/(view)/component_shared/AppTabs';
import AppButton from '@/app/(view)/component_shared/AppButton';
import AppTable from '@/app/(view)/component_shared/AppTable';
import AppCard from '@/app/(view)/component_shared/AppCard';
import AppSpace from '@/app/(view)/component_shared/AppSpace';
import AppTooltip from '@/app/(view)/component_shared/AppTooltip';
import AppInput from '@/app/(view)/component_shared/AppInput';
import AppTypography from '@/app/(view)/component_shared/AppTypography';

import useFinanceCategoryManagementViewModel from './useFinanceCategoryManagementViewModel';
import FinanceCategoryModal from './FinanceCategoryModal';

const DEFAULT_SCROLL_Y = 600;

function TabLabel({ text, count }) {
  const badgeClass = 'bg-slate-100 text-slate-600';

  return (
    <span className='inline-flex items-center gap-3 whitespace-nowrap'>
      <span className='font-semibold'>{text}</span>
      <span className={`inline-flex items-center justify-center min-w-7 h-7 px-2 rounded-full text-xs font-semibold ${badgeClass}`}>
        {count}
      </span>
    </span>
  );
}

export default function FinanceCategoryManagementContent() {
  const vm = useFinanceCategoryManagementViewModel();

  const columns = (kind) => {
    const pag = kind === 'payment' ? vm.pagPayment : kind === 'pocket_money' ? vm.pagPocketMoney : vm.pagReimburses;

    const current = pag?.page ?? 1;
    const pageSize = pag?.pageSize ?? 10;
    const offset = (current - 1) * pageSize;

    return [
      {
        title: 'NO',
        key: 'no',
        width: 70,
        align: 'center',
        render: (_r, __, index) => (
          <AppTypography.Text size={12} weight={700} tone='muted'>
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
          <AppTypography.Text size={13} weight={700} className='text-slate-900 block truncate' title={text}>
            {text}
          </AppTypography.Text>
        ),
      },
      {
        title: 'DESKRIPSI',
        dataIndex: 'deskripsi',
        key: 'deskripsi',
        ellipsis: true,
        render: (text) => (
          <AppTypography.Text size={12} tone='muted' className='text-slate-600 block truncate' title={text}>
            {text || '-'}
          </AppTypography.Text>
        ),
      },
      {
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
                confirm={{
                  title: 'Hapus kategori?',
                  content: 'Kategori yang dihapus tidak bisa dikembalikan.',
                  okText: 'Hapus',
                  cancelText: 'Batal',
                  okType: 'danger',
                  onOk: async () => vm.deleteItem(kind, record),
                }}
              />
            </AppTooltip>
          </AppSpace>
        ),
      },
    ];
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

            <AppButton variant='primary' icon={<PlusOutlined />} onClick={() => vm.openCreate(kind)}>
              Tambah Kategori
            </AppButton>
          </div>
        }
        rowKey='id'
        dataSource={items}
        columns={columns(kind)}
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
    const paymentTotal = vm.totals?.payment ?? 0;
    const pocketMoneyTotal = vm.totals?.pocket_money ?? 0;
    const reimbursesTotal = vm.totals?.reimburses ?? 0;

    return [
      {
        key: 'payment',
        label: <TabLabel text='Kategori Payment' count={paymentTotal} />,
        children: (
          <div className='mt-6'>
            <TabContent kind='payment' title='Kategori Payment' items={vm.itemsPaymentView} pag={vm.pagPayment} />
          </div>
        ),
      },
      {
        key: 'pocket_money',
        label: <TabLabel text='Kategori Pocket Money' count={pocketMoneyTotal} />,
        children: (
          <div className='mt-6'>
            <TabContent kind='pocket_money' title='Kategori Pocket Money' items={vm.itemsPocketMoneyView} pag={vm.pagPocketMoney} />
          </div>
        ),
      },
      {
        key: 'reimburses',
        label: <TabLabel text='Kategori Reimburse' count={reimbursesTotal} />,
        children: (
          <div className='mt-6'>
            <TabContent kind='reimburses' title='Kategori Reimburse' items={vm.itemsReimbursesView} pag={vm.pagReimburses} />
          </div>
        ),
      },
    ];
  }, [
    vm.totals?.payment,
    vm.totals?.pocket_money,
    vm.totals?.reimburses,
    vm.itemsPaymentView,
    vm.itemsPocketMoneyView,
    vm.itemsReimbursesView,
    vm.pagPayment,
    vm.pagPocketMoney,
    vm.pagReimburses,
    vm.search,
  ]);

  return (
    <AppCard className='shadow-sm border-0'>
      <AppTabs
        className='finance-cat-tabs'
        activeKey={vm.activeTab}
        onChange={vm.setActiveTab}
        variant='line'
        size='large'
        tabBarGutter={40}
        items={tabs}
      />

      <style jsx global>{`
        .finance-cat-tabs .ant-tabs-nav {
          margin: 0 !important;
        }
        .finance-cat-tabs .ant-tabs-tab {
          margin: 0 !important;
          padding: 12px 22px !important;
        }
        .finance-cat-tabs .ant-tabs-tab-btn {
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

      <FinanceCategoryModal
        open={vm.modalOpen}
        mode={vm.modalMode}
        kind={vm.modalKind}
        initialName={vm.editingItem?.nama}
        initialDesc={vm.editingItem?.deskripsi}
        onCancel={() => vm.setModalOpen(false)}
        onSubmit={async (values) => {
          await vm.submitForm(values);
          vm.setModalOpen(false);
        }}
      />
    </AppCard>
  );
}
