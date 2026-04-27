'use client';

import { CheckCircleOutlined, DeleteOutlined, FallOutlined, LoadingOutlined, PlusOutlined, ReloadOutlined, RiseOutlined, SettingOutlined, TagsOutlined } from '@ant-design/icons';

import AppButton from '@/app/(view)/component_shared/AppButton';
import AppCard from '@/app/(view)/component_shared/AppCard';
import AppEmpty from '@/app/(view)/component_shared/AppEmpty';
import AppInput from '@/app/(view)/component_shared/AppInput';
import AppModal from '@/app/(view)/component_shared/AppModal';
import Breadcrumbs from './components_definisi/Breadcrumbs_definisi';
import AppTypography from '@/app/(view)/component_shared/AppTypography';
import KomponenCard from './components_definisi/KomponenCard';
import KomponenForm from './components_definisi/KomponenForm';
import SectionHeader from './components_definisi/SectionHeader';
import SummaryCard from './components_definisi/SummaryCard';
import useDefinisiKomponenPayrollViewModel from './useDefinisiKomponenPayrollViewModel';

const SECONDARY_BUTTON_CLASS_NAME = '!h-10 !rounded-lg !border-gray-300 !px-4 !text-gray-700 hover:!border-gray-300 hover:!bg-gray-50 hover:!text-gray-700';
const PRIMARY_BUTTON_CLASS_NAME = '!h-10 !rounded-lg !border-blue-600 !bg-blue-600 !px-4 !text-white hover:!border-blue-700 hover:!bg-blue-700';

const BREADCRUMB_ITEMS = [
  {
    key: 'payroll',
    label: 'Payroll',
    href: '/home/payroll',
  },
  {
    key: 'master-data-payroll',
    label: 'Master Data Payroll',
    href: '/home/payroll/master-data',
  },
  {
    key: 'definisi-komponen-payroll',
    label: 'Definisi Komponen Payroll',
  },
];

function LoadingStateCard() {
  return (
    <AppCard
      rounded='xl'
      ring={false}
      shadow='none'
      className='border border-dashed border-blue-200 bg-blue-50'
      bodyStyle={{ padding: 32 }}
    >
      <div className='flex flex-col items-center justify-center text-center'>
        <div className='mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-white shadow-sm'>
          <LoadingOutlined className='text-2xl text-blue-600' />
        </div>

        <AppTypography.Text
          size={16}
          weight={700}
          className='mb-1 block text-gray-900'
        >
          Memuat definisi komponen payroll
        </AppTypography.Text>

        <AppTypography.Text
          size={14}
          className='text-gray-600'
        >
          Data master komponen sedang disiapkan.
        </AppTypography.Text>
      </div>
    </AppCard>
  );
}

function QuickAddTipeKomponenModal({ vm }) {
  return (
    <AppModal
      open={vm.isQuickAddModalOpen}
      onClose={vm.closeQuickAddModal}
      title='Tambah Tipe Komponen'
      footer={null}
      width={560}
    >
      <div className='space-y-4'>
        <AppInput
          label='Nama Tipe Komponen'
          required
          value={vm.quickAddFormData.nama_tipe_komponen}
          onChange={(event) => vm.setQuickAddFormValue('nama_tipe_komponen', event.target.value)}
          placeholder='Contoh: Tunjangan Tetap'
          maxLength={100}
          disabled={vm.isSubmittingQuickAdd}
          hint='Tipe baru akan langsung tersedia dan otomatis terpilih pada form definisi komponen payroll.'
          inputClassName='!rounded-lg'
        />
      </div>

      <div className='flex items-center justify-end gap-3 pt-4'>
        <AppButton
          variant='outline'
          onClick={vm.closeQuickAddModal}
          disabled={vm.isSubmittingQuickAdd}
          className={SECONDARY_BUTTON_CLASS_NAME}
        >
          Batal
        </AppButton>

        <AppButton
          onClick={vm.handleQuickAddTipeKomponen}
          loading={vm.isSubmittingQuickAdd}
          className={PRIMARY_BUTTON_CLASS_NAME}
        >
          Simpan Tipe
        </AppButton>
      </div>
    </AppModal>
  );
}

export default function DefinisiKomponenPayrollContent() {
  const vm = useDefinisiKomponenPayrollViewModel();

  return (
    <div className='p-8'>
      <div className='mb-8 flex flex-wrap items-center justify-between gap-4'>
        <div>
          <Breadcrumbs items={BREADCRUMB_ITEMS} />

          <AppTypography.Title
            level={3}
            className='!mb-1 !text-gray-900'
          >
            Definisi Komponen Payroll
          </AppTypography.Title>

          <AppTypography.Text className='text-gray-600'>Kelola master komponen payroll yang digunakan pada item payroll dan batch komponen secara terintegrasi dengan master tipe komponen payroll.</AppTypography.Text>
        </div>

        <div className='flex flex-wrap items-center gap-3'>
          <AppButton
            variant='outline'
            href='/home/payroll/master-data/tipe-komponen-payroll'
            icon={<TagsOutlined />}
            disabled={vm.isSubmitting}
            className={SECONDARY_BUTTON_CLASS_NAME}
          >
            Tipe Komponen Payroll
          </AppButton>

          <AppButton
            onClick={vm.openCreateModal}
            icon={<PlusOutlined />}
            disabled={vm.isSubmitting || vm.isPreparingEdit}
            className={PRIMARY_BUTTON_CLASS_NAME}
          >
            Tambah Komponen
          </AppButton>
        </div>
      </div>

      <div className='mb-8 grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4'>
        <SummaryCard
          value={vm.komponenData.length}
          label='Total Komponen'
          icon={<SettingOutlined />}
          iconWrapClassName='bg-blue-500'
          cardClassName='border border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50'
        />

        <SummaryCard
          value={vm.kompPendapatan.length}
          label='Komponen Pendapatan'
          icon={<RiseOutlined />}
          iconWrapClassName='bg-green-500'
          cardClassName='border border-green-200 bg-gradient-to-br from-green-50 to-emerald-50'
        />

        <SummaryCard
          value={vm.kompPotongan.length}
          label='Komponen Potongan'
          icon={<FallOutlined />}
          iconWrapClassName='bg-red-500'
          cardClassName='border border-red-200 bg-gradient-to-br from-red-50 to-pink-50'
        />

        <SummaryCard
          value={vm.kompAktif}
          label='Komponen Aktif'
          icon={<CheckCircleOutlined />}
          iconWrapClassName='bg-purple-500'
          cardClassName='border border-purple-200 bg-gradient-to-br from-purple-50 to-fuchsia-50'
        />
      </div>

      {vm.loading && vm.komponenData.length === 0 ? (
        <LoadingStateCard />
      ) : vm.error && vm.komponenData.length === 0 ? (
        <AppEmpty.Card
          title='Gagal memuat definisi komponen payroll'
          description={vm.error?.message || 'Terjadi kendala saat mengambil data dari server.'}
          action={
            <AppButton
              variant='outline'
              onClick={vm.reloadData}
              icon={<ReloadOutlined />}
              className={SECONDARY_BUTTON_CLASS_NAME}
            >
              Coba Lagi
            </AppButton>
          }
        />
      ) : vm.komponenData.length === 0 ? (
        <AppEmpty.Card
          title='Belum ada definisi komponen payroll'
          description='Tambahkan komponen pertama untuk mulai membangun master payroll.'
          action={
            <AppButton
              onClick={vm.openCreateModal}
              icon={<PlusOutlined />}
              className={PRIMARY_BUTTON_CLASS_NAME}
            >
              Tambah Komponen
            </AppButton>
          }
        />
      ) : (
        <>
          <div className='mb-8'>
            <SectionHeader
              icon={<RiseOutlined />}
              iconWrapClassName='bg-green-100'
              iconClassName='text-lg text-green-600'
              title='Komponen Pendapatan'
              count={vm.kompPendapatan.length}
              tagTone='success'
            />

            {vm.kompPendapatan.length === 0 ? (
              <AppEmpty.Card
                compact
                title='Belum ada komponen pendapatan'
                description='Tambahkan komponen dengan arah pemasukan untuk melengkapi master payroll.'
              />
            ) : (
              <div className='grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3'>
                {vm.kompPendapatan.map((komponen) => (
                  <KomponenCard
                    key={komponen.id_definisi_komponen_payroll}
                    komponen={komponen}
                    onDetail={vm.openDetailModal}
                    onEdit={vm.openEditModal}
                    onDelete={vm.openDeleteDialog}
                    formatKomponenLabel={vm.formatKomponenLabel}
                  />
                ))}
              </div>
            )}
          </div>

          <div className='mb-8'>
            <SectionHeader
              icon={<FallOutlined />}
              iconWrapClassName='bg-red-100'
              iconClassName='text-lg text-red-600'
              title='Komponen Potongan'
              count={vm.kompPotongan.length}
              tagTone='danger'
            />

            {vm.kompPotongan.length === 0 ? (
              <AppEmpty.Card
                compact
                title='Belum ada komponen potongan'
                description='Tambahkan komponen dengan arah potongan untuk melengkapi master payroll.'
              />
            ) : (
              <div className='grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3'>
                {vm.kompPotongan.map((komponen) => (
                  <KomponenCard
                    key={komponen.id_definisi_komponen_payroll}
                    komponen={komponen}
                    onDetail={vm.openDetailModal}
                    onEdit={vm.openEditModal}
                    onDelete={vm.openDeleteDialog}
                    formatKomponenLabel={vm.formatKomponenLabel}
                  />
                ))}
              </div>
            )}
          </div>

          {vm.kompBerulang > 0 ? (
            <AppCard
              rounded='xl'
              ring={false}
              shadow='none'
              className='border border-gray-200'
              bodyStyle={{ padding: 20 }}
            >
              <div className='flex items-center gap-3'>
                <div className='flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100'>
                  <SettingOutlined className='text-lg text-blue-600' />
                </div>

                <div>
                  <AppTypography.Text
                    size={16}
                    weight={700}
                    className='block text-gray-900'
                  >
                    Komponen Berulang Default
                  </AppTypography.Text>

                  <AppTypography.Text
                    size={14}
                    className='text-gray-600'
                  >
                    Terdapat {vm.kompBerulang} komponen yang otomatis berulang pada payroll.
                  </AppTypography.Text>
                </div>
              </div>
            </AppCard>
          ) : null}
        </>
      )}

      <AppModal
        open={vm.isCreateModalOpen}
        onClose={vm.closeCreateModal}
        title='Tambah Definisi Komponen Payroll'
        footer={null}
        width={760}
      >
        <KomponenForm
          formData={vm.formData}
          setFormValue={vm.setFormValue}
          disabled={vm.isSubmitting}
          tipeKomponenOptions={vm.tipeKomponenOptions}
          tipeKomponenLoading={vm.isTipeKomponenLoading || vm.isTipeKomponenValidating}
          onOpenQuickAdd={vm.openQuickAddModal}
        />

        <div className='flex items-center justify-end gap-3 pt-4'>
          <AppButton
            variant='outline'
            onClick={vm.closeCreateModal}
            disabled={vm.isSubmitting}
            className={SECONDARY_BUTTON_CLASS_NAME}
          >
            Batal
          </AppButton>

          <AppButton
            onClick={vm.handleCreate}
            loading={vm.isSubmitting}
            className={PRIMARY_BUTTON_CLASS_NAME}
          >
            Simpan Komponen
          </AppButton>
        </div>
      </AppModal>

      <AppModal
        open={vm.isEditModalOpen}
        onClose={vm.closeEditModal}
        title='Edit Definisi Komponen Payroll'
        footer={null}
        width={760}
      >
        <KomponenForm
          formData={vm.formData}
          setFormValue={vm.setFormValue}
          disabled={vm.isSubmitting || vm.isPreparingEdit}
          tipeKomponenOptions={vm.tipeKomponenOptions}
          tipeKomponenLoading={vm.isTipeKomponenLoading || vm.isTipeKomponenValidating}
          onOpenQuickAdd={vm.openQuickAddModal}
        />

        <div className='flex items-center justify-end gap-3 pt-4'>
          <AppButton
            variant='outline'
            onClick={vm.closeEditModal}
            disabled={vm.isSubmitting || vm.isPreparingEdit}
            className={SECONDARY_BUTTON_CLASS_NAME}
          >
            Batal
          </AppButton>

          <AppButton
            onClick={vm.handleEdit}
            loading={vm.isSubmitting || vm.isPreparingEdit}
            disabled={vm.isPreparingEdit}
            className={PRIMARY_BUTTON_CLASS_NAME}
          >
            Simpan Perubahan
          </AppButton>
        </div>
      </AppModal>

      <AppModal
        open={vm.isDeleteDialogOpen}
        onClose={vm.closeDeleteDialog}
        title='Hapus Definisi Komponen Payroll'
        variant='danger'
        footer={null}
        width={520}
      >
        <AppTypography.Text
          size={14}
          className='leading-relaxed text-gray-700'
        >
          Apakah Anda yakin ingin menghapus komponen <strong>"{vm.selectedKomponen?.nama_komponen || '-'}"</strong>?
        </AppTypography.Text>

        <AppTypography.Text
          size={13}
          className='mt-2 block leading-relaxed text-gray-600'
        >
          Komponen yang dihapus tidak akan tampil dalam daftar aktif dan tidak dapat digunakan kembali, namun data histori tetap tersimpan untuk keperluan audit.
        </AppTypography.Text>

        <div className='mt-4 rounded-lg border border-amber-200 bg-amber-50 p-4'>
          <AppTypography.Text
            size={13}
            weight={600}
            className='block text-amber-800'
          >
            Tipe: {vm.formatKomponenLabel(vm.selectedKomponen?.tipe_komponen)}
          </AppTypography.Text>

          <AppTypography.Text
            size={12}
            className='mt-1 block text-amber-700'
          >
            Referensi item payroll: {vm.selectedKomponen?.item_payroll_count ?? 0}
          </AppTypography.Text>
        </div>

        <div className='flex items-center justify-end gap-3 pt-6'>
          <AppButton
            variant='outline'
            onClick={vm.closeDeleteDialog}
            disabled={vm.isSubmitting}
            className={SECONDARY_BUTTON_CLASS_NAME}
          >
            Batal
          </AppButton>

          <AppButton
            variant='danger'
            onClick={vm.handleDelete}
            loading={vm.isSubmitting}
            icon={<DeleteOutlined />}
            className='!h-10 !rounded-lg !px-4'
          >
            Hapus
          </AppButton>
        </div>
      </AppModal>

      <QuickAddTipeKomponenModal vm={vm} />
    </div>
  );
}
