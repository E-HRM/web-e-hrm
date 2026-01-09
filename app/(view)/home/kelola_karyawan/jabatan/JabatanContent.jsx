'use client';

import React, { useMemo } from 'react';
import { PlusOutlined, SearchOutlined, EditOutlined, DeleteOutlined, ApartmentOutlined } from '@ant-design/icons';
import useJabatanViewModel from './useJabatanViewModel';

import AppCard from '../../../component_shared/AppCard';
import AppTable from '../../../component_shared/AppTable';
import AppInput from '../../../component_shared/AppInput';
import AppButton from '../../../component_shared/AppButton';
import AppSpace from '../../../component_shared/AppSpace';
import AppModal from '../../../component_shared/AppModal';
import AppForm from '../../../component_shared/AppForm';
import AppTypography from '../../../component_shared/AppTypography';
import AppMessage from '../../../component_shared/AppMessage';

export default function JabatanContent() {
  const vm = useJabatanViewModel();

  const parentOptions = useMemo(() => {
    const base = Array.isArray(vm.parentOptions) ? vm.parentOptions : [];
    if (vm.modal.mode === 'edit' && vm.modal.id) {
      return base.filter((o) => o.value !== vm.modal.id);
    }
    return base;
  }, [vm.parentOptions, vm.modal.mode, vm.modal.id]);

  const runSearch = () => {
    vm.reload();
  };

  const columns = useMemo(
    () => [
      {
        title: 'Jabatan',
        dataIndex: 'nama_jabatan',
        key: 'nama_jabatan',
      },
      {
        title: 'Aksi',
        key: 'action',
        fixed: 'right',
        width: 160,
        render: (_, row) => (
          <div className='flex items-center gap-2'>
            <AppButton
              variant='text'
              size='small'
              icon={<EditOutlined />}
              onClick={() => vm.openEdit(row.id_jabatan)}
              aria-label='Edit'
            />
            <AppButton
              variant='danger'
              size='small'
              icon={<DeleteOutlined />}
              aria-label='Hapus'
              confirm={{
                title: 'Hapus jabatan ini?',
                okText: 'Hapus',
                cancelText: 'Batal',
                okButtonProps: { danger: true },
                onOk: async () => {
                  await vm.remove(row.id_jabatan);
                },
              }}
            />
          </div>
        ),
      },
    ],
    [vm]
  );

  return (
    <div className='p-6'>
      <AppTypography.Title
        level={2}
        className='!mt-0'
      >
        Jabatan
      </AppTypography.Title>

      <AppCard
        className='!rounded-2xl'
        bodyStyle={{ paddingTop: 16 }}
        title={
          <AppSpace>
            <div className='flex items-center gap-2'>
              <div className='w-[320px]'>
                <AppInput
                  placeholder='Cari jabatan…'
                  allowClear
                  value={vm.search}
                  onChange={(e) => vm.setSearch(e.target.value)}
                  onPressEnter={runSearch}
                  prefixIcon={<SearchOutlined />}
                />
              </div>
              <AppButton
                variant='outline'
                icon={<SearchOutlined />}
                onClick={runSearch}
              >
                Cari
              </AppButton>
            </div>
          </AppSpace>
        }
        extra={
          <AppSpace>
            <AppButton
              variant='outline'
              icon={<ApartmentOutlined />}
              href='/home/kelola_karyawan/jabatan/visualisasi'
            >
              Lihat Visualisasi
            </AppButton>

            <AppButton
              variant='primary'
              icon={<PlusOutlined />}
              onClick={vm.openCreate}
            >
              Tambah Jabatan
            </AppButton>
          </AppSpace>
        }
      >
        <AppTable
          rowKey='id_jabatan'
          loading={vm.loading}
          columns={columns}
          dataSource={vm.data}
          pagination={{
            current: vm.page,
            pageSize: vm.pageSize,
            total: vm.total,
            showSizeChanger: true,
            onChange: (p, ps) => vm.changePage(p, ps),
          }}
          scroll={{ x: 560 }}
        />
      </AppCard>

      <AppModal
        open={vm.modal.open}
        onClose={vm.closeModal}
        title={vm.modal.mode === 'create' ? 'Tambah Jabatan' : 'Ubah Jabatan'}
        okText={vm.modal.mode === 'create' ? 'Simpan' : 'Simpan Perubahan'}
        cancelText='Batal'
        onOk={() => vm.form.submit()}
        okLoading={vm.saving}
        destroyOnClose
      >
        <AppForm
          form={vm.form}
          layout='vertical'
          showSubmit={false}
          initialValues={{
            nama_jabatan: '',
            id_induk_jabatan: undefined,
          }}
          fields={[
            {
              type: 'text',
              name: 'nama_jabatan',
              label: 'Nama',
              placeholder: 'cth: Manager Operasional',
              rules: [{ required: true, message: 'Nama jabatan wajib diisi' }],
              controlProps: { size: 'large', allowClear: true },
            },
            {
              type: 'select',
              name: 'id_induk_jabatan',
              label: 'Induk',
              tooltip: 'Biarkan kosong untuk menjadikannya root (Tanpa Induk).',
              placeholder: 'Tanpa Induk',
              options: parentOptions,
              allowClear: true,
              controlProps: {
                size: 'large',
                showSearch: true,
                optionFilterProp: 'label',
                filterOption: (input, option) =>
                  String(option?.label ?? '')
                    .toLowerCase()
                    .includes(String(input ?? '').toLowerCase()),
              },
            },
          ]}
          onFinish={(values) => {
            if (vm.modal.mode === 'edit' && values.id_induk_jabatan === vm.modal.id) {
              AppMessage.error('Induk jabatan tidak boleh sama dengan jabatan itu sendiri.');
              return;
            }
            vm.submit(values);
          }}
        />
      </AppModal>
    </div>
  );
}
