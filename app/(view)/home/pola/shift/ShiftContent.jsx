'use client';

import { Form } from 'antd';
import { SearchOutlined, PlusOutlined, EditOutlined, DeleteOutlined, QuestionCircleOutlined } from '@ant-design/icons';
import { useEffect, useState } from 'react';
import dayjs from 'dayjs';

import UseShiftViewModel from './UseShiftViewModel';

import AppButton from '@/app/(view)/component_shared/AppButton';
import AppInput from '@/app/(view)/component_shared/AppInput';
import AppModal from '@/app/(view)/component_shared/AppModal';
import AppSpace from '@/app/(view)/component_shared/AppSpace';
import AppTable from '@/app/(view)/component_shared/AppTable';
import AppTooltip from '@/app/(view)/component_shared/AppTooltip';
import AppTypography from '@/app/(view)/component_shared/AppTypography';
import AppTimePicker from '@/app/(view)/component_shared/AppTimePicker';

export default function ShiftContent() {
  const vm = UseShiftViewModel();

  const [openAdd, setOpenAdd] = useState(false);

  const [formAdd] = Form.useForm();
  const [formEdit] = Form.useForm();

  useEffect(() => {
    if (vm.openEdit && vm.selected) {
      formEdit.setFieldsValue(vm.getEditInitial());
    }
  }, [vm.openEdit, vm.selected, formEdit, vm]);

  const columns = [
    {
      title: <span className='text-slate-600'>Nama Pola Kerja</span>,
      dataIndex: 'name',
      key: 'name',
      width: 240,
      render: (v) => <span className='text-slate-800'>{v}</span>,
    },
    {
      title: <span className='text-slate-600'>Jam Kerja</span>,
      dataIndex: 'jamKerja',
      key: 'jamKerja',
      width: 200,
      render: (v) => <span className='text-slate-700'>{v}</span>,
    },
    {
      title: <span className='text-slate-600'>Jam Istirahat</span>,
      dataIndex: 'istirahat',
      key: 'istirahat',
      width: 230,
      render: (v) => <span className='text-slate-700'>{v}</span>,
    },
    {
      title: <span className='text-slate-600'>Aksi</span>,
      key: 'aksi',
      fixed: 'right',
      width: 170,
      render: (_, row) => (
        <AppSpace size='xs'>
          <AppTooltip title='Edit'>
            <AppButton
              variant='text'
              className='!h-8 !w-8 !rounded-full !bg-white hover:!bg-slate-100 !text-slate-600 !border !border-slate-300'
              icon={<EditOutlined />}
              onClick={() => vm.onEditOpen(row)}
            />
          </AppTooltip>

          <AppTooltip title='Hapus'>
            <AppButton
              variant='text'
              className='!h-8 !w-8 !rounded-full !bg-white !text-rose-500 !border !border-rose-300 hover:!bg-rose-50'
              icon={<DeleteOutlined />}
              onClick={() => vm.onDeleteOpen(row)}
            />
          </AppTooltip>
        </AppSpace>
      ),
    },
  ];

  return (
    <div className='p-6'>
      <div className='mb-4 flex items-center gap-3'>
        <AppTypography.Title
          level={3}
          weight={800}
          className='!m-0 text-slate-900'
        >
          Pola Kerja - Shift
        </AppTypography.Title>

        <div className='ml-auto flex items-center gap-2'>
          <AppInput
            allowClear
            placeholder='Cari nama pola…'
            prefixIcon={<SearchOutlined className='text-slate-400' />}
            value={vm.search}
            onChange={(e) => vm.setSearch(e.target.value)}
            className='w-72'
            size='large'
          />

          <AppButton
            variant='primary'
            size='large'
            icon={<PlusOutlined />}
            className='rounded-xl'
            onClick={() => setOpenAdd(true)}
          >
            Tambah
          </AppButton>
        </div>
      </div>

      <AppTable
        card
        columns={columns}
        dataSource={vm.rows}
        rowKey='id'
        loading={vm.loading}
        pagination={{
          current: vm.pagination.page,
          pageSize: vm.pagination.pageSize,
          total: vm.pagination.total,
          position: ['bottomRight'],
          showSizeChanger: true,
          pageSizeOptions: ['10', '20', '50'],
          showTotal: (t, [a, b]) => `${a}-${b} dari ${t}`,
          className: 'px-2 pb-2',
        }}
        onChange={vm.onTableChange}
        containerClassName='border border-slate-200'
        tableClassName='!bg-transparent [&_.ant-table-container]:!bg-transparent
                        [&_.ant-table-thead>tr>th]:!bg-slate-50 [&_.ant-table-thead>tr>th]:!text-slate-600
                        [&_.ant-table-tbody>tr>td]:!bg-white'
      />

      {/* ========= MODAL TAMBAH ========= */}
      <AppModal
        title='Tambah Pola Kerja - Shift'
        open={openAdd}
        onClose={() => setOpenAdd(false)}
        footer={null}
        width={960}
      >
        <Form
          layout='horizontal'
          labelCol={{ span: 6 }}
          wrapperCol={{ span: 18 }}
          className='mt-2'
          form={formAdd}
          initialValues={{
            maxIstirahat: 60,
            jamMasuk: dayjs('09:00', 'HH:mm'),
            jamKeluar: dayjs('18:00', 'HH:mm'),
          }}
          onFinish={async (vals) => {
            await vm.onAddSubmit(vals);
            formAdd.resetFields();
            setOpenAdd(false);
          }}
        >
          <Form.Item
            label={
              <span>
                Nama Pola Kerja<span className='text-rose-500'>*</span>
              </span>
            }
            name='nama'
            rules={[{ required: true, message: 'Wajib diisi' }]}
          >
            <AppInput />
          </Form.Item>

          <div className='pl-[25%] -mt-2 mb-2 text-slate-700 flex items-center gap-2'>
            <span className='font-medium'>Jadwal Kerja</span>
            <QuestionCircleOutlined className='text-slate-400' />
            <span className='text-rose-500 ml-1'>*</span>
          </div>

          <div className='rounded-xl border border-slate-200 bg-slate-50/60 p-3'>
            <div className='grid grid-cols-5 gap-3 text-sm font-medium text-slate-600 mb-2 px-1'>
              <div>Jam Masuk</div>
              <div>Jam Keluar</div>
              <div>Mulai Istirahat</div>
              <div>Selesai Istirahat</div>
              <div>Maks. Menit Istirahat</div>
            </div>

            <div className='grid grid-cols-5 gap-3'>
              <Form.Item
                name='jamMasuk'
                noStyle
                rules={[{ required: true, message: 'Wajib' }]}
              >
                <AppTimePicker format='HH:mm' />
              </Form.Item>

              <Form.Item
                name='jamKeluar'
                noStyle
                rules={[{ required: true, message: 'Wajib' }]}
              >
                <AppTimePicker format='HH:mm' />
              </Form.Item>

              <Form.Item
                name='mulaiIstirahat'
                noStyle
              >
                <AppTimePicker format='HH:mm' />
              </Form.Item>

              <Form.Item
                name='selesaiIstirahat'
                noStyle
              >
                <AppTimePicker format='HH:mm' />
              </Form.Item>

              <Form.Item
                name='maxIstirahat'
                noStyle
              >
                <AppInput.Number min={0} />
              </Form.Item>
            </div>
          </div>

          <div className='mt-6 flex gap-2 justify-end'>
            <AppButton
              variant='outline'
              className='rounded-xl px-6'
              onClick={() => setOpenAdd(false)}
            >
              Tutup
            </AppButton>

            <AppButton
              variant='primary'
              htmlType='submit'
              className='rounded-xl px-6'
            >
              Simpan
            </AppButton>
          </div>
        </Form>
      </AppModal>

      {/* ========= MODAL EDIT ========= */}
      <AppModal
        title='Ubah Data'
        open={vm.openEdit}
        onClose={vm.onEditClose}
        footer={null}
        width={960}
      >
        <Form
          layout='horizontal'
          labelCol={{ span: 6 }}
          wrapperCol={{ span: 18 }}
          className='mt-2'
          form={formEdit}
          onFinish={vm.onEditSubmit}
        >
          <Form.Item
            label={
              <span>
                Nama Pola Kerja<span className='text-rose-500'>*</span>
              </span>
            }
            name='nama'
            rules={[{ required: true, message: 'Wajib diisi' }]}
          >
            <AppInput />
          </Form.Item>

          <div className='pl-[25%] -mt-2 mb-2 text-slate-700 flex items-center gap-2'>
            <span className='font-medium'>Jadwal Kerja</span>
            <QuestionCircleOutlined className='text-slate-400' />
            <span className='text-rose-500 ml-1'>*</span>
          </div>

          <div className='rounded-xl border border-slate-200 bg-slate-50/60 p-3'>
            <div className='grid grid-cols-5 gap-3 text-sm font-medium text-slate-600 mb-2 px-1'>
              <div>Jam Masuk</div>
              <div>Jam Keluar</div>
              <div>Mulai Istirahat</div>
              <div>Selesai Istirahat</div>
              <div>Maks. Menit Istirahat</div>
            </div>

            <div className='grid grid-cols-5 gap-3'>
              <Form.Item
                name='jamMasuk'
                noStyle
                rules={[{ required: true, message: 'Wajib' }]}
              >
                <AppTimePicker format='HH:mm' />
              </Form.Item>

              <Form.Item
                name='jamKeluar'
                noStyle
                rules={[{ required: true, message: 'Wajib' }]}
              >
                <AppTimePicker format='HH:mm' />
              </Form.Item>

              <Form.Item
                name='mulaiIstirahat'
                noStyle
              >
                <AppTimePicker format='HH:mm' />
              </Form.Item>

              <Form.Item
                name='selesaiIstirahat'
                noStyle
              >
                <AppTimePicker format='HH:mm' />
              </Form.Item>

              <Form.Item
                name='maxIstirahat'
                noStyle
              >
                <AppInput.Number min={0} />
              </Form.Item>
            </div>
          </div>

          <div className='mt-6 flex gap-2 justify-end pl-[25%]'>
            <AppButton
              variant='primary'
              htmlType='submit'
              className='rounded-xl px-6'
            >
              Simpan
            </AppButton>

            <AppButton
              variant='outline'
              className='rounded-xl px-6'
              onClick={vm.onEditClose}
            >
              Tutup
            </AppButton>
          </div>
        </Form>
      </AppModal>

      {/* ========= MODAL DELETE ========= */}
      <AppModal
        open={vm.openDelete}
        onClose={vm.onDeleteClose}
        title='Hapus Pola Kerja'
        variant='danger'
        okText='Hapus'
        cancelText='Batal'
        onOk={vm.onDeleteConfirm}
      >
        <AppTypography.Text className='text-slate-600'>
          Yakin ingin menghapus pola <span className='font-semibold'>{vm.selected?.name}</span>?
        </AppTypography.Text>
      </AppModal>
    </div>
  );
}
