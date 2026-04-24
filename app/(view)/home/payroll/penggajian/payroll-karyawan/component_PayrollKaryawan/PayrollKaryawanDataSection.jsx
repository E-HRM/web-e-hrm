// app/(view)/home/payroll/payroll-karyawan/component_PayrollKaryawan/PayrollKaryawanDataSection.jsx
'use client';

import { DeleteOutlined, EditOutlined, EyeOutlined, FileDoneOutlined, FilePdfOutlined } from '@ant-design/icons';

import AppButton from '@/app/(view)/component_shared/AppButton';
import AppEmpty from '@/app/(view)/component_shared/AppEmpty';
import AppTable from '@/app/(view)/component_shared/AppTable';
import AppTag from '@/app/(view)/component_shared/AppTag';
import AppTypography from '@/app/(view)/component_shared/AppTypography';

export default function PayrollKaryawanDataSection({ vm, buildPayslipHref }) {
  const columns = [
    {
      title: 'Karyawan',
      key: 'karyawan',
      render: (_, payroll) => (
        <div>
          <AppTypography.Text
            size={14}
            weight={700}
            className='block text-gray-900'
          >
            {payroll.nama_karyawan_snapshot}
          </AppTypography.Text>

          <AppTypography.Text
            size={12}
            className='text-gray-500'
          >
            {payroll.nama_departement_snapshot || '-'} - {payroll.nama_jabatan_snapshot || '-'}
          </AppTypography.Text>
        </div>
      ),
    },
    {
      title: 'Periode',
      dataIndex: 'id_periode_payroll',
      key: 'id_periode_payroll',
      render: (value) => (
        <AppTypography.Text
          size={14}
          className='text-gray-900'
        >
          {vm.getPeriodeInfo(value)}
        </AppTypography.Text>
      ),
    },
    {
      title: 'Jenis Hubungan',
      key: 'jenis_hubungan_snapshot',
      render: (_, payroll) => (
        <div>
          <AppTypography.Text
            size={14}
            className='block text-gray-900'
          >
            {vm.formatJenisHubungan(payroll.jenis_hubungan_snapshot)}
          </AppTypography.Text>

          <AppTypography.Text
            size={12}
            className='text-gray-500'
          >
            {vm.formatTarifPajakSnapshot(payroll.kode_kategori_pajak_snapshot, payroll.persen_tarif_snapshot)}
          </AppTypography.Text>
        </div>
      ),
    },
    {
      title: 'Total Gaji Kotor',
      key: 'total_bruto_kena_pajak',
      render: (_, payroll) => (
        <div>
          <AppTypography.Text
            size={14}
            weight={700}
            className='block text-gray-900'
          >
            {vm.formatCurrency(payroll.total_bruto_kena_pajak)}
          </AppTypography.Text>

          <AppTypography.Text
            size={12}
            className='block text-gray-500'
          >
            Tetap: {vm.formatCurrency(payroll.total_pendapatan_tetap)}
          </AppTypography.Text>

          <AppTypography.Text
            size={12}
            className='text-gray-500'
          >
            Tambahan: {vm.formatCurrency(payroll.total_pendapatan_variabel)}
          </AppTypography.Text>
        </div>
      ),
    },
    {
      title: 'Pajak',
      key: 'total_pajak',
      render: (_, payroll) => (
        <div>
          <AppTypography.Text
            size={14}
            className='block text-gray-900'
          >
            {vm.formatCurrency(payroll.total_pajak)}
          </AppTypography.Text>

          <AppTypography.Text
            size={12}
            className='text-gray-500'
          >
            {payroll.persen_pajak}%
          </AppTypography.Text>
        </div>
      ),
    },
    {
      title: 'Persetujuan',
      key: 'approval',
      render: (_, payroll) => {
        const approvalStatus = vm.formatStatusApproval(payroll.status_approval);

        return (
          <div className='min-w-[180px]'>
            <AppTag
              tone={approvalStatus.tone}
              variant='soft'
              size='sm'
              className='!font-medium'
            >
              {approvalStatus.label}
            </AppTag>

            <AppTypography.Text
              size={12}
              className='block text-gray-500 mt-2'
            >
              {payroll.approval_progress_label}
            </AppTypography.Text>

            <AppTypography.Text
              size={12}
              className='block text-gray-500 mt-1'
            >
              {payroll.current_approval_label}
            </AppTypography.Text>
          </div>
        );
      },
    },
    {
      title: 'Gaji Diterima',
      dataIndex: 'total_dibayarkan',
      key: 'total_dibayarkan',
      render: (value) => (
        <AppTypography.Text
          size={14}
          weight={800}
          className='text-green-600'
        >
          {vm.formatCurrency(value)}
        </AppTypography.Text>
      ),
    },
    {
      title: 'Status Penggajian',
      key: 'status_payroll',
      render: (_, payroll) => {
        const statusFormat = vm.formatStatusPayroll(payroll.status_payroll);

        return (
          <div>
            <AppTag
              tone={statusFormat.tone}
              variant='soft'
              size='sm'
              className='!font-medium'
            >
              {statusFormat.label}
            </AppTag>

            {payroll.finalized_at ? (
              <AppTypography.Text
                size={12}
                className='block text-gray-500 mt-1'
              >
                {vm.formatDate(payroll.finalized_at)}
              </AppTypography.Text>
            ) : payroll.bukti_bayar_url ? (
              <AppTypography.Text
                size={12}
                className='block text-gray-500 mt-1'
              >
                Bukti tersedia
              </AppTypography.Text>
            ) : (
              <AppTypography.Text
                size={12}
                className='block text-gray-500 mt-1'
              >
                Belum dibayar
              </AppTypography.Text>
            )}
          </div>
        );
      },
    },
    {
      title: 'Aksi',
      key: 'action',
      width: 220,
      render: (_, payroll) => {
        const approvalStep = vm.getActionableApprovalStep(payroll);

        return (
          <div className='flex items-center gap-2'>
            <AppButton
              variant='text'
              shape='circle'
              size='middle'
              aria-label='Setujui penggajian'
              className='!text-cyan-700 hover:!bg-cyan-50'
              icon={<FileDoneOutlined />}
              disabled={!approvalStep || vm.isSubmitting}
              onClick={() => vm.openApproveModal(payroll)}
            />

            <AppButton
              variant='text'
              shape='circle'
              size='middle'
              aria-label='Detail'
              className='!text-blue-600 hover:!bg-blue-50'
              icon={<EyeOutlined />}
              onClick={() => vm.openDetailModal(payroll)}
            />

            <AppButton
              variant='text'
              shape='circle'
              size='middle'
              aria-label='Buka slip gaji'
              className='!text-emerald-600 hover:!bg-emerald-50'
              icon={<FilePdfOutlined />}
              href={buildPayslipHref(payroll)}
            />

            <AppButton
              variant='text'
              shape='circle'
              size='middle'
              aria-label='Ubah'
              className='!text-yellow-600 hover:!bg-yellow-50'
              icon={<EditOutlined />}
              disabled={payroll.business_state && !payroll.business_state.bisa_diubah}
              onClick={() => vm.openEditModal(payroll)}
            />

            <AppButton
              variant='text'
              shape='circle'
              size='middle'
              aria-label='Hapus'
              className='!text-red-600 hover:!bg-red-50'
              icon={<DeleteOutlined />}
              disabled={payroll.business_state && !payroll.business_state.bisa_dihapus}
              onClick={() => vm.openDeleteDialog(payroll)}
            />
          </div>
        );
      },
    },
  ];

  if (vm.sortedData.length === 0 && !vm.loading) {
    return (
      <AppEmpty.Card
        title='Tidak ada data penggajian karyawan'
        description='Ubah filter atau tambahkan data penggajian baru untuk mulai mengelola data.'
      />
    );
  }

  return (
    <AppTable
      card
      rowKey='id_payroll_karyawan'
      columns={columns}
      dataSource={vm.sortedData}
      loading={vm.loading}
      pagination={{
        pageSize: 10,
        showSizeChanger: true,
        showQuickJumper: true,
      }}
      totalLabel='data penggajian'
      emptyTitle='Tidak ada data penggajian karyawan'
      emptyDescription='Belum ada data yang sesuai dengan filter.'
    />
  );
}
