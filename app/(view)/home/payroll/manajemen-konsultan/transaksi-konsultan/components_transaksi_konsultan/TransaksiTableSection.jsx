import { DeleteOutlined, EditOutlined, ReloadOutlined } from '@ant-design/icons';
import { Table } from 'antd';

import AppAvatar from '@/app/(view)/component_shared/AppAvatar';
import AppButton from '@/app/(view)/component_shared/AppButton';
import AppCard from '@/app/(view)/component_shared/AppCard';
import AppEmpty from '@/app/(view)/component_shared/AppEmpty';
import AppTable from '@/app/(view)/component_shared/AppTable';
import AppTypography from '@/app/(view)/component_shared/AppTypography';

import { PeriodeStatusTag, ShareTag, StatusTag } from './SectionShared';

export default function TransaksiTableSection({ vm }) {
  const hasFetchError = Boolean(vm.error) && vm.transaksiList.length === 0 && !vm.loading;

  const columns = [
    {
      title: 'KONSULTAN',
      key: 'konsultan',
      width: 260,
      render: (_, transaksi) => (
        <div className='flex items-center gap-3 min-w-0'>
          <AppAvatar
            src={transaksi.konsultan_photo || undefined}
            name={transaksi.konsultan_display_name}
            size='md'
          />

          <div className='min-w-0'>
            <AppTypography.Text
              size={14}
              weight={600}
              className='block text-gray-900 truncate'
            >
              {transaksi.konsultan_display_name}
            </AppTypography.Text>

            <AppTypography.Text
              size={12}
              className='block text-gray-500 truncate'
            >
              {transaksi.konsultan_identity}
            </AppTypography.Text>

            <AppTypography.Text
              size={12}
              className='block text-gray-400 truncate'
            >
              {transaksi.konsultan_secondary_text}
            </AppTypography.Text>
          </div>
        </div>
      ),
    },
    {
      title: 'PRODUK',
      key: 'produk',
      width: 220,
      render: (_, transaksi) => (
        <AppTypography.Text
          size={14}
          weight={600}
          className='text-gray-900'
        >
          {transaksi.produk_display_name || transaksi.jenis_produk?.nama_produk || '-'}
        </AppTypography.Text>
      ),
    },
    {
      title: 'TANGGAL',
      dataIndex: 'tanggal_transaksi',
      key: 'tanggal_transaksi',
      width: 160,
      render: (value) => (
        <AppTypography.Text
          size={14}
          className='text-gray-900'
        >
          {vm.formatDate(value)}
        </AppTypography.Text>
      ),
    },
    {
      title: 'KLIEN / DESKRIPSI',
      key: 'klien_deskripsi',
      width: 280,
      render: (_, transaksi) => (
        <div>
          <AppTypography.Text
            size={14}
            weight={600}
            className='block text-gray-900'
          >
            {transaksi.nama_klien || '-'}
          </AppTypography.Text>

          <AppTypography.Text
            size={13}
            className='text-gray-500'
          >
            {transaksi.deskripsi || '-'}
          </AppTypography.Text>
        </div>
      ),
    },
    {
      title: 'DEBIT',
      dataIndex: 'nominal_debit',
      key: 'nominal_debit',
      width: 160,
      align: 'right',
      render: (value) => (
        <AppTypography.Text
          size={14}
          weight={600}
          className='text-green-600'
        >
          {Number(value) > 0 ? vm.formatCurrency(value) : '-'}
        </AppTypography.Text>
      ),
    },
    {
      title: 'KREDIT',
      dataIndex: 'nominal_kredit',
      key: 'nominal_kredit',
      width: 160,
      align: 'right',
      render: (value) => (
        <AppTypography.Text
          size={14}
          weight={600}
          className='text-red-600'
        >
          {Number(value) > 0 ? vm.formatCurrency(value) : '-'}
        </AppTypography.Text>
      ),
    },
    {
      title: 'TOTAL INCOME',
      dataIndex: 'total_income',
      key: 'total_income',
      width: 180,
      align: 'right',
      render: (value) => (
        <AppTypography.Text
          size={14}
          weight={700}
          className='text-gray-900'
        >
          {vm.formatCurrency(value)}
        </AppTypography.Text>
      ),
    },
    {
      title: '% SHARE',
      key: 'persen_share',
      width: 150,
      align: 'center',
      render: (_, transaksi) => (
        <ShareTag
          persenShare={vm.getPersenShare(transaksi)}
          overrideManual={transaksi.override_manual}
          vm={vm}
        />
      ),
    },
    {
      title: 'NOMINAL SHARE',
      dataIndex: 'nominal_share',
      key: 'nominal_share',
      width: 180,
      align: 'right',
      render: (value) => (
        <AppTypography.Text
          size={14}
          weight={600}
          className='text-blue-600'
        >
          {vm.formatCurrency(value)}
        </AppTypography.Text>
      ),
    },
    {
      title: 'NOMINAL OSS',
      dataIndex: 'nominal_oss',
      key: 'nominal_oss',
      width: 180,
      align: 'right',
      render: (value) => (
        <AppTypography.Text
          size={14}
          weight={600}
          className='text-purple-600'
        >
          {vm.formatCurrency(value)}
        </AppTypography.Text>
      ),
    },
    {
      title: 'STATUS',
      key: 'status',
      width: 140,
      align: 'center',
      render: (_, transaksi) => <StatusTag posted={transaksi.sudah_posting_payroll} />,
    },
    {
      title: 'AKSI',
      key: 'aksi',
      width: 120,
      align: 'center',
      render: (_, transaksi) => (
        <div className='flex items-center justify-center gap-1'>
          <AppButton
            onClick={() => vm.openEditModal(transaksi)}
            variant='text'
            title={transaksi?.business_state?.bisa_diubah ? 'Edit' : vm.getDisabledActionReason(transaksi)}
            className='!text-blue-600 hover:!bg-blue-50 !rounded'
            icon={<EditOutlined />}
            disabled={!transaksi?.business_state?.bisa_diubah}
          />

          <AppButton
            onClick={() => vm.openDeleteDialog(transaksi)}
            variant='text'
            title={transaksi?.business_state?.bisa_dihapus ? 'Hapus' : vm.getDisabledActionReason(transaksi)}
            className='!text-red-600 hover:!bg-red-50 !rounded'
            icon={<DeleteOutlined />}
            disabled={!transaksi?.business_state?.bisa_dihapus}
          />
        </div>
      ),
    },
  ];

  if (hasFetchError) {
    return (
      <AppEmpty.Card
        title='Gagal memuat transaksi konsultan'
        description={vm.error?.message || 'Terjadi kesalahan saat mengambil data dari server.'}
        action={
          <AppButton
            onClick={vm.reloadData}
            icon={<ReloadOutlined />}
            className='!rounded-lg !px-4 !h-10'
          >
            Coba Lagi
          </AppButton>
        }
      />
    );
  }

  return (
    <AppCard
      rounded='xl'
      ring={false}
      shadow='none'
      noPadding
      className='border border-gray-200 overflow-hidden mb-8'
    >
      <div className='px-6 py-4 border-b border-gray-200 bg-gray-50 flex items-center justify-between gap-3 flex-wrap'>
        <AppTypography.Text
          size={16}
          weight={600}
          className='text-gray-900'
        >
          Daftar Transaksi - {vm.activePeriodeLabel}
        </AppTypography.Text>

        {vm.activePeriodeStatus ? (
          <PeriodeStatusTag
            status={vm.activePeriodeStatus}
            vm={vm}
          />
        ) : null}
      </div>

      <AppTable
        card={false}
        rowKey='id_transaksi_konsultan'
        columns={columns}
        dataSource={vm.transaksiList}
        loading={vm.loading || vm.validating}
        pagination={false}
        scroll={{ x: 'max-content' }}
        tableClassName='transaksi-konsultan-table'
        emptyTitle='Belum ada transaksi konsultan'
        emptyDescription='Silakan tambah transaksi baru untuk periode ini.'
        summary={() =>
          vm.transaksiList.length > 0 ? (
            <Table.Summary fixed>
              <Table.Summary.Row className='bg-gray-50'>
                <Table.Summary.Cell
                  index={0}
                  colSpan={6}
                  align='right'
                >
                  <AppTypography.Text
                    size={14}
                    weight={700}
                    className='text-gray-900'
                  >
                    TOTAL:
                  </AppTypography.Text>
                </Table.Summary.Cell>

                <Table.Summary.Cell
                  index={1}
                  align='right'
                >
                  <AppTypography.Text
                    size={14}
                    weight={700}
                    className='text-gray-900'
                  >
                    {vm.formatCurrency(vm.totalIncome)}
                  </AppTypography.Text>
                </Table.Summary.Cell>

                <Table.Summary.Cell index={2} />

                <Table.Summary.Cell
                  index={3}
                  align='right'
                >
                  <AppTypography.Text
                    size={14}
                    weight={700}
                    className='text-blue-600'
                  >
                    {vm.formatCurrency(vm.totalShare)}
                  </AppTypography.Text>
                </Table.Summary.Cell>

                <Table.Summary.Cell
                  index={4}
                  align='right'
                >
                  <AppTypography.Text
                    size={14}
                    weight={700}
                    className='text-purple-600'
                  >
                    {vm.formatCurrency(vm.totalOSS)}
                  </AppTypography.Text>
                </Table.Summary.Cell>

                <Table.Summary.Cell index={5} />
                <Table.Summary.Cell index={6} />
              </Table.Summary.Row>
            </Table.Summary>
          ) : null
        }
      />

      <style
        jsx
        global
      >{`
        .transaksi-konsultan-table .ant-table-summary {
          background: #f9fafb;
        }

        .transaksi-konsultan-table .ant-table-summary > tr > th,
        .transaksi-konsultan-table .ant-table-summary > tr > td {
          border-top: 2px solid #d1d5db;
        }
      `}</style>
    </AppCard>
  );
}
