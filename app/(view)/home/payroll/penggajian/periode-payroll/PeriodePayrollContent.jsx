'use client';

import {
  CalendarOutlined,
  CheckCircleOutlined,
  DeleteOutlined,
  EditOutlined,
  EyeOutlined,
  FileTextOutlined,
  PlusOutlined,
  ReloadOutlined,
  WalletOutlined,
} from '@ant-design/icons';

import AppButton from '@/app/(view)/component_shared/AppButton';
import AppCard from '@/app/(view)/component_shared/AppCard';
import AppEmpty from '@/app/(view)/component_shared/AppEmpty';
import AppInput from '@/app/(view)/component_shared/AppInput';
import AppModal from '@/app/(view)/component_shared/AppModal';
import AppSelect from '@/app/(view)/component_shared/AppSelect';
import AppTable from '@/app/(view)/component_shared/AppTable';
import AppTag from '@/app/(view)/component_shared/AppTag';
import AppTypography from '@/app/(view)/component_shared/AppTypography';

import { getPeriodePayrollStatusMeta } from './utils/periodePayrollUtils';
import usePeriodePayrollViewModel from './usePeriodePayrollViewModel';

function SummaryCard({ title, subtitle, value, icon, iconClassName }) {
  return (
    <AppCard
      rounded='lg'
      ring={false}
      shadow='none'
      className='border border-gray-200'
      bodyStyle={{ padding: 24 }}
    >
      <div className='mb-2 flex items-center justify-between'>
        <AppTypography.Text
          size={14}
          weight={600}
          className='text-gray-600'
        >
          {title}
        </AppTypography.Text>

        <span className={iconClassName}>{icon}</span>
      </div>

      <AppTypography.Text
        size={28}
        weight={800}
        className='block text-gray-900'
      >
        {value}
      </AppTypography.Text>

      <AppTypography.Text
        size={12}
        className='mt-1 text-gray-500'
      >
        {subtitle}
      </AppTypography.Text>
    </AppCard>
  );
}

function DetailField({ label, value, valueClassName = 'text-gray-900', weight = 600 }) {
  return (
    <div>
      <AppTypography.Text
        size={12}
        className='mb-1 block text-gray-500'
      >
        {label}
      </AppTypography.Text>

      <AppTypography.Text
        size={14}
        weight={weight}
        className={`block ${valueClassName}`}
      >
        {value || '-'}
      </AppTypography.Text>
    </div>
  );
}

function StatusTag({ status }) {
  const meta = getPeriodePayrollStatusMeta(status);

  return (
    <AppTag
      tone={meta.tone}
      variant='soft'
      size='sm'
      className='!font-medium'
    >
      {meta.label}
    </AppTag>
  );
}

function buildDetailProsesHref(periode, vm) {
  const query = new URLSearchParams({
    id_periode_payroll: periode?.id_periode_payroll || '',
    periode_label: vm.formatPeriodeLabel(periode),
  });

  return `/home/payroll/penggajian/payroll-karyawan?${query.toString()}`;
}

function openTemplateFile(template) {
  const url = String(template?.file_template_url || '').trim();
  if (!url || typeof window === 'undefined') return;
  window.open(url, '_blank', 'noopener,noreferrer');
}

function PeriodeFormFields({ vm }) {
  return (
    <div className='space-y-4'>
      <div className='rounded-2xl border border-blue-100 bg-blue-50 p-4'>
        <AppTypography.Text
          size={13}
          weight={700}
          className='block text-blue-900'
        >
          Periode payroll mengikuti schema `PeriodePayroll`
        </AppTypography.Text>

        <AppTypography.Text
          size={12}
          className='mt-1 block leading-5 text-blue-700'
        >
          Sistem membentuk periode dari bulan, tahun, rentang tanggal aktif, status proses, catatan operasional, dan pilihan template payslip sesuai schema terbaru.
        </AppTypography.Text>
      </div>

      <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
        <AppSelect
          label='Bulan Periode'
          required
          value={vm.formData.bulan}
          onChange={(value) => vm.setFormValue('bulan', value)}
          options={vm.bulanOptions}
          showSearch={false}
          selectClassName='!rounded-lg'
        />

        <AppInput.Number
          label='Tahun'
          required
          min={2000}
          max={9999}
          precision={0}
          value={vm.formData.tahun}
          onChange={(value) => vm.setFormValue('tahun', Number(value || 0))}
          inputClassName='!rounded-lg'
        />
      </div>

      <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
        <AppInput
          label='Tanggal Mulai'
          required
          type='date'
          value={vm.formData.tanggal_mulai}
          onChange={(event) => vm.setFormValue('tanggal_mulai', event.target.value)}
          inputClassName='!rounded-lg'
        />

        <AppInput
          label='Tanggal Selesai'
          required
          type='date'
          value={vm.formData.tanggal_selesai}
          onChange={(event) => vm.setFormValue('tanggal_selesai', event.target.value)}
          inputClassName='!rounded-lg'
        />
      </div>

      <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
        <AppSelect
          label='Status Periode'
          required
          value={vm.formData.status_periode}
          onChange={(value) => vm.setFormValue('status_periode', value)}
          options={vm.statusOptions.filter((item) => item.value)}
          showSearch={false}
          selectClassName='!rounded-lg'
        />

        <AppSelect
          label='Template Payslip'
          value={vm.formData.id_master_template}
          onChange={(value) => vm.setFormValue('id_master_template', value || '')}
          options={vm.templateOptions}
          loading={vm.templateLoading}
          allowClear
          placeholder='Pilih template payslip bila diperlukan'
          selectClassName='!rounded-lg'
        />
      </div>

      <AppInput.TextArea
        label='Catatan'
        value={vm.formData.catatan}
        onChange={(event) => vm.setFormValue('catatan', event.target.value)}
        placeholder='Tambahkan catatan operasional periode payroll bila diperlukan.'
        autoSize={{ minRows: 4, maxRows: 6 }}
        inputClassName='!rounded-lg'
      />
    </div>
  );
}

function CreatePeriodeModal({ vm }) {
  return (
    <AppModal
      open={vm.isCreateModalOpen}
      onClose={vm.closeCreateModal}
      title='Buat Periode Payroll'
      footer={null}
      width={840}
    >
      <PeriodeFormFields vm={vm} />

      <div className='flex justify-end gap-3 pt-6'>
        <AppButton
          variant='text'
          onClick={vm.closeCreateModal}
          className='!text-gray-700 hover:!text-gray-900'
        >
          Batal
        </AppButton>

        <AppButton
          onClick={vm.handleCreate}
          loading={vm.isSubmitting}
          className='!rounded-lg !px-4 !h-10 !bg-blue-600 hover:!bg-blue-700 !border-blue-600 hover:!border-blue-700 !text-white'
        >
          Simpan
        </AppButton>
      </div>
    </AppModal>
  );
}

function EditPeriodeModal({ vm }) {
  return (
    <AppModal
      open={vm.isEditModalOpen}
      onClose={vm.closeEditModal}
      title='Edit Periode Payroll'
      footer={null}
      width={840}
    >
      <PeriodeFormFields vm={vm} />

      <div className='flex justify-end gap-3 pt-6'>
        <AppButton
          variant='text'
          onClick={vm.closeEditModal}
          className='!text-gray-700 hover:!text-gray-900'
        >
          Batal
        </AppButton>

        <AppButton
          onClick={vm.handleUpdate}
          loading={vm.isSubmitting}
          className='!rounded-lg !px-4 !h-10 !bg-blue-600 hover:!bg-blue-700 !border-blue-600 hover:!border-blue-700 !text-white'
        >
          Update
        </AppButton>
      </div>
    </AppModal>
  );
}

function DetailPeriodeModal({ vm }) {
  const periode = vm.selectedPeriode;
  const statusMeta = getPeriodePayrollStatusMeta(periode?.status_periode);

  return (
    <AppModal
      open={vm.isDetailModalOpen}
      onClose={vm.closeDetailModal}
      title={periode ? `Detail ${vm.formatPeriodeLabel(periode)}` : 'Detail Periode Payroll'}
      footer={null}
      width={920}
    >
      {periode ? (
        <div className='space-y-6'>
          <div className='grid grid-cols-1 gap-4 md:grid-cols-3'>
            <AppCard
              rounded='xl'
              ring={false}
              shadow='none'
              className='border border-gray-200'
              bodyStyle={{ padding: 20 }}
            >
              <AppTypography.Text
                size={12}
                className='mb-2 block text-gray-500'
              >
                Status Periode
              </AppTypography.Text>

              <StatusTag status={periode.status_periode} />

              <AppTypography.Text
                size={12}
                className='mt-3 block leading-5 text-gray-500'
              >
                {statusMeta.helper}
              </AppTypography.Text>
            </AppCard>

            <AppCard
              rounded='xl'
              ring={false}
              shadow='none'
              className='border border-gray-200'
              bodyStyle={{ padding: 20 }}
            >
              <AppTypography.Text
                size={12}
                className='mb-2 block text-gray-500'
              >
                Payroll Karyawan
              </AppTypography.Text>

              <AppTypography.Text
                size={22}
                weight={800}
                className='block text-gray-900'
              >
                {periode?._count?.payroll_karyawan || 0}
              </AppTypography.Text>

              <AppTypography.Text
                size={12}
                className='mt-3 block leading-5 text-gray-500'
              >
                Total payroll karyawan yang terhubung ke periode ini.
              </AppTypography.Text>
            </AppCard>

            <AppCard
              rounded='xl'
              ring={false}
              shadow='none'
              className='border border-gray-200'
              bodyStyle={{ padding: 20 }}
            >
              <AppTypography.Text
                size={12}
                className='mb-2 block text-gray-500'
              >
                Payout Konsultan
              </AppTypography.Text>

              <AppTypography.Text
                size={22}
                weight={800}
                className='block text-gray-900'
              >
                {periode?._count?.payout_konsultan ?? periode?._count?.payoutKonsultans ?? 0}
              </AppTypography.Text>

              <AppTypography.Text
                size={12}
                className='mt-3 block leading-5 text-gray-500'
              >
                Total payout konsultan yang saat ini terhubung ke periode payroll.
              </AppTypography.Text>
            </AppCard>
          </div>

          <div className='rounded-2xl border border-gray-200 p-5'>
            <AppTypography.Text
              size={14}
              weight={700}
              className='mb-4 block text-gray-900'
            >
              Ringkasan Periode
            </AppTypography.Text>

            <div className='grid grid-cols-1 gap-6 md:grid-cols-2'>
              <DetailField
                label='Periode'
                value={vm.formatPeriodeLabel(periode)}
              />
              <DetailField
                label='Status'
                value={statusMeta.label}
              />
              <DetailField
                label='Tanggal Mulai'
                value={vm.formatDate(periode.tanggal_mulai)}
              />
              <DetailField
                label='Tanggal Selesai'
                value={vm.formatDate(periode.tanggal_selesai)}
              />
              <DetailField
                label='Template Payslip'
                value={vm.resolveTemplateLabel(periode)}
              />
            </div>

            {periode?.master_template?.file_template_url ? (
              <div className='mt-4'>
                <AppButton
                  variant='outline'
                  icon={<FileTextOutlined />}
                  onClick={() => openTemplateFile(periode.master_template)}
                  className='!rounded-lg !h-10'
                >
                  Buka File Template
                </AppButton>
              </div>
            ) : null}
          </div>

          <div className='rounded-2xl border border-gray-200 p-5'>
            <AppTypography.Text
              size={14}
              weight={700}
              className='mb-4 block text-gray-900'
            >
              Catatan Operasional
            </AppTypography.Text>

            <AppTypography.Text
              size={13}
              className='block whitespace-pre-line leading-6 text-gray-600'
            >
              {periode.catatan || 'Belum ada catatan operasional untuk periode ini.'}
            </AppTypography.Text>
          </div>

          <div className='flex justify-end gap-3 pt-2'>
            <AppButton
              variant='outline'
              href={buildDetailProsesHref(periode, vm)}
              className='!rounded-lg !h-10'
            >
              Buka Payroll Karyawan
            </AppButton>

            <AppButton
              variant='secondary'
              onClick={vm.closeDetailModal}
              className='!rounded-lg !h-10'
            >
              Tutup
            </AppButton>

            <AppButton
              onClick={() => {
                vm.closeDetailModal();
                vm.openEditModal(periode);
              }}
              className='!rounded-lg !h-10 !bg-blue-600 hover:!bg-blue-700 !border-blue-600 hover:!border-blue-700 !text-white'
            >
              Edit Periode
            </AppButton>
          </div>
        </div>
      ) : null}
    </AppModal>
  );
}

export default function PeriodePayrollContent() {
  const vm = usePeriodePayrollViewModel();

  const columns = [
    {
      title: 'Periode',
      key: 'periode',
      width: 220,
      render: (_, record) => (
        <div>
          <AppTypography.Text
            size={14}
            weight={700}
            className='block text-gray-900'
          >
            {vm.formatPeriodeLabel(record)}
          </AppTypography.Text>

          <AppTypography.Text
            size={12}
            className='mt-0.5 block text-gray-500'
          >
            Tahun buku {record.tahun}
          </AppTypography.Text>
        </div>
      ),
    },
    {
      title: 'Rentang Tanggal',
      key: 'tanggal',
      width: 240,
      render: (_, record) => (
        <div>
          <AppTypography.Text
            size={14}
            weight={700}
            className='block text-gray-900'
          >
            {vm.formatDate(record.tanggal_mulai)}
          </AppTypography.Text>

          <AppTypography.Text
            size={12}
            className='mt-0.5 block text-gray-500'
          >
            s/d {vm.formatDate(record.tanggal_selesai)}
          </AppTypography.Text>
        </div>
      ),
    },
    {
      title: 'Aktivitas',
      key: 'aktivitas',
      width: 240,
      render: (_, record) => (
        <div>
          <AppTypography.Text
            size={14}
            weight={700}
            className='block text-gray-900'
          >
            {record?._count?.payroll_karyawan || 0} payroll
          </AppTypography.Text>

          <AppTypography.Text
            size={12}
            className='mt-0.5 block text-gray-500'
          >
            {record?._count?.payout_konsultan ?? record?._count?.payoutKonsultans ?? 0} payout tertaut
          </AppTypography.Text>
        </div>
      ),
    },
    {
      title: 'Status',
      key: 'status',
      width: 240,
      render: (_, record) => {
        const meta = getPeriodePayrollStatusMeta(record.status_periode);

        return (
          <div className='min-w-[180px]'>
            <StatusTag status={record.status_periode} />

            <AppTypography.Text
              size={12}
              className='mt-2 block leading-5 text-gray-500'
            >
              {meta.helper}
            </AppTypography.Text>
          </div>
        );
      },
    },
    {
      title: 'Template Payslip',
      key: 'template',
      width: 240,
      render: (_, record) => (
        <div>
          <AppTypography.Text
            size={13}
            weight={700}
            className='block text-gray-900'
          >
            {vm.resolveTemplateLabel(record)}
          </AppTypography.Text>

          <AppTypography.Text
            size={12}
            className='mt-0.5 block text-gray-500'
          >
            {record?.master_template?.file_template_url ? 'Template aktif dari master template' : 'Belum memilih template'}
          </AppTypography.Text>
        </div>
      ),
    },
    {
      title: 'Catatan',
      dataIndex: 'catatan',
      key: 'catatan',
      width: 260,
      render: (value) => (
        <AppTypography.Text
          size={13}
          className='block leading-6 text-gray-600 line-clamp-3'
        >
          {value || 'Belum ada catatan operasional.'}
        </AppTypography.Text>
      ),
    },
    {
      title: 'Aksi',
      key: 'aksi',
      align: 'right',
      width: 200,
      render: (_, record) => (
        <div className='flex items-center justify-end gap-2'>
          <AppButton
            variant='text'
            shape='circle'
            icon={<EyeOutlined />}
            aria-label='Lihat detail periode payroll'
            className='!text-blue-600 hover:!text-blue-700'
            onClick={() => vm.openDetailModal(record)}
          />

          <AppButton
            variant='text'
            shape='circle'
            icon={<EditOutlined />}
            aria-label='Edit periode payroll'
            className='!text-gray-600 hover:!text-gray-700'
            onClick={() => vm.openEditModal(record)}
          />

          <AppButton
            variant='text'
            shape='circle'
            danger
            icon={<DeleteOutlined />}
            aria-label='Hapus periode payroll'
            className='!text-red-600 hover:!text-red-700'
            loading={vm.actionLoadingId === record.id_periode_payroll}
            confirm={{
              title: 'Hapus periode payroll',
              content: `Periode ${vm.formatPeriodeLabel(record)} akan dihapus permanen. ${record?._count?.payroll_karyawan || 0} payroll karyawan akan ikut terhapus dan ${(record?._count?.payout_konsultan ?? record?._count?.payoutKonsultans ?? 0)} payout akan dilepas dari periode. Lanjutkan?`,
              okText: 'Hapus',
              cancelText: 'Batal',
              okType: 'danger',
            }}
            onClick={() => vm.handleDelete(record)}
          />
        </div>
      ),
    },
  ];

  if (vm.error && vm.periodeList.length === 0) {
    return (
      <AppEmpty.Card
        title='Data periode payroll gagal dimuat'
        description={vm.error?.message || 'Terjadi kesalahan saat mengambil data periode payroll.'}
        action={
          <AppButton
            variant='outline'
            onClick={vm.reloadData}
            className='!rounded-lg'
          >
            Muat Ulang
          </AppButton>
        }
      />
    );
  }

  return (
    <div className='p-6 md:p-8'>
      <div className='mb-8 flex flex-col gap-4 md:flex-row md:items-start md:justify-between'>
        <div>
          <AppTypography.Title
            level={2}
            className='!mb-1 !text-gray-900'
          >
            Periode Payroll
          </AppTypography.Title>

          <AppTypography.Text className='text-gray-600'>Kelola periode payroll sebagai acuan payroll karyawan, keterhubungan payout konsultan, dan pemilihan template payslip per periode.</AppTypography.Text>
        </div>

        <div className='flex items-center gap-3'>
          <AppButton
            variant='outline'
            icon={<ReloadOutlined />}
            loading={vm.validating}
            onClick={vm.reloadData}
            className='!rounded-lg'
          >
            Muat Ulang
          </AppButton>

          <AppButton
            icon={<PlusOutlined />}
            onClick={vm.openCreateModal}
            className='!rounded-lg'
          >
            Buat Periode Baru
          </AppButton>
        </div>
      </div>

      <div className='mb-8 grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4'>
        <SummaryCard
          title='Total Periode'
          subtitle='Periode payroll tercatat'
          value={vm.summary.totalPeriode}
          icon={<CalendarOutlined />}
          iconClassName='text-blue-500 text-xl'
        />
        <SummaryCard
          title='Status Draft'
          subtitle='Masih tahap persiapan'
          value={vm.summary.totalDraft}
          icon={<FileTextOutlined />}
          iconClassName='text-amber-500 text-xl'
        />
        <SummaryCard
          title='Sudah Final'
          subtitle='Final dan terkunci'
          value={vm.summary.totalFinal}
          icon={<CheckCircleOutlined />}
          iconClassName='text-green-500 text-xl'
        />
        <SummaryCard
          title='Payout Tertaut'
          subtitle={`${vm.summary.totalPayrollKaryawan} payroll tertaut`}
          value={vm.summary.totalPayoutKonsultan}
          icon={<WalletOutlined />}
          iconClassName='text-indigo-500 text-xl'
        />
      </div>

      <AppCard
        rounded='xl'
        ring={false}
        shadow='none'
        className='mb-6 border border-gray-200'
        bodyStyle={{ padding: 24 }}
      >
        <div className='grid grid-cols-1 gap-4 xl:grid-cols-4'>
          <div className='xl:col-span-2'>
            <AppInput
              label='Cari Periode'
              value={vm.searchText}
              onChange={(event) => vm.setSearchText(event.target.value)}
              placeholder='Cari bulan, tahun, status, template, catatan, atau aktivitas periode'
              allowClear
              inputClassName='!rounded-lg'
            />
          </div>

          <div>
            <AppSelect
              label='Filter Status'
              value={vm.filterStatus}
              onChange={(value) => vm.setFilterStatus(value)}
              options={vm.statusOptions}
              showSearch={false}
              selectClassName='!rounded-lg'
            />
          </div>

          <div>
            <AppSelect
              label='Filter Tahun'
              value={vm.filterTahun}
              onChange={(value) => vm.setFilterTahun(value)}
              options={vm.tahunOptions}
              showSearch={false}
              selectClassName='!rounded-lg'
            />
          </div>
        </div>

        <div className='mt-4 flex flex-wrap items-center justify-between gap-4'>
          <AppTypography.Text
            size={13}
            className='text-gray-500'
          >
            Menampilkan {vm.filteredList.length} dari {vm.periodeList.length} periode payroll.
          </AppTypography.Text>

          <AppTypography.Text
            size={13}
            className='text-gray-500'
          >
            Total payroll karyawan tertaut: {vm.summary.totalPayrollKaryawan}
          </AppTypography.Text>
        </div>
      </AppCard>

      <AppTable
        title='Daftar Periode Payroll'
        subtitle='Pantau rentang periode, status proses, template payslip aktif, keterkaitan payroll karyawan, dan payout konsultan dalam satu tampilan.'
        columns={columns}
        dataSource={vm.dataSource}
        loading={vm.loading}
        rowKey='id_periode_payroll'
        totalLabel='periode'
        emptyTitle='Belum ada periode payroll'
        emptyDescription='Buat periode baru untuk mulai mengelompokkan proses payroll.'
        pagination={{
          pageSize: 10,
          showSizeChanger: true,
          showQuickJumper: true,
        }}
      />

      <CreatePeriodeModal vm={vm} />
      <EditPeriodeModal vm={vm} />
      <DetailPeriodeModal vm={vm} />
    </div>
  );
}
