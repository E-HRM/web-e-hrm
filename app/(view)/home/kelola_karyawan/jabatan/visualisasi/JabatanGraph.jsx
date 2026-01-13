'use client';

import React from 'react';
import { PlusOutlined, ArrowLeftOutlined } from '@ant-design/icons';
import useJabatanGraphViewModel from './useJabatanGraphViewModel';

import AppCard from '../../../../component_shared/AppCard';
import AppButton from '../../../../component_shared/AppButton';
import AppTooltip from '../../../../component_shared/AppTooltip';
import AppModal from '../../../../component_shared/AppModal';
import AppForm from '../../../../component_shared/AppForm';
import AppTypography from '../../../../component_shared/AppTypography';
import AppEmpty from '../../../../component_shared/AppEmpty';

function NodeBox({ node, onAddChild }) {
  return (
    <div className='flex flex-col items-center'>
      <div className='relative flex flex-col items-center'>
        <div
          className='px-3 py-2 rounded border text-slate-800 bg-white'
          style={{ minWidth: 140 }}
        >
          {node.nama_jabatan}
        </div>

        <AppTooltip title='Tambah anak jabatan'>
          <span className='absolute left-1/2 -translate-x-1/2 top-full -mt-3'>
            <AppButton
              variant='primary'
              shape='circle'
              size='small'
              icon={<PlusOutlined />}
              onClick={() => onAddChild(node)}
              aria-label={`Tambah anak untuk ${node.nama_jabatan}`}
              className='!h-8 !w-8 !min-w-0 !p-0 !flex !items-center !justify-center !rounded-full shadow ring-2 ring-white'
            />
          </span>
        </AppTooltip>
      </div>

      {node.children?.length > 0 && (
        <>
          <div
            className='w-[2px] bg-slate-400 mt-6'
            style={{ height: 16 }}
          />
          <div className='flex items-start gap-10'>
            {node.children.map((c) => (
              <div
                key={c.id_jabatan}
                className='flex flex-col items-center'
              >
                <div
                  className='h-[2px] bg-slate-400'
                  style={{ width: 40, marginBottom: 8 }}
                />
                <NodeBox
                  node={c}
                  onAddChild={onAddChild}
                />
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export default function JabatanGraph() {
  const vm = useJabatanGraphViewModel();

  return (
    <div className='p-6'>
      <AppCard
        className='!rounded-2xl'
        title={<div className='flex gap-3' />}
        extra={
          <AppButton
            variant='outline'
            icon={<ArrowLeftOutlined />}
            href='/home/kelola_karyawan/jabatan'
          >
            Kembali
          </AppButton>
        }
        bodyStyle={{ paddingTop: 20 }}
      >
        <div className='min-h-[420px] overflow-auto'>
          {vm.loading ? (
            <div className='min-h-[420px] grid place-items-center p-8 text-slate-500 text-center'>Memuat struktur…</div>
          ) : vm.roots.length === 0 ? (
            <div className='min-h-[420px] grid place-items-center p-8'>
              <AppEmpty description='Belum ada jabatan. Tambahkan dulu dari tabel atau seed default.' />
            </div>
          ) : (
            <div className='flex items-start justify-between gap-16 px-6'>
              {vm.roots.map((r) => (
                <div
                  key={r.id_jabatan}
                  className='flex-1 flex justify-center'
                >
                  <NodeBox
                    node={r}
                    onAddChild={vm.openCreateChild}
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      </AppCard>

      <AppModal
        open={vm.modal.open}
        onClose={vm.closeModal}
        title='Tambah Jabatan'
        subtitle={vm.modal.parent?.nama_jabatan ? `Tambah anak untuk "${vm.modal.parent.nama_jabatan}"` : undefined}
        okText='Simpan'
        cancelText='Batal'
        onOk={() => vm.form.submit()}
        okLoading={vm.saving}
        destroyOnClose
      >
        <AppForm
          form={vm.form}
          layout='vertical'
          showSubmit={false}
          onFinish={vm.submit}
          fields={[
            {
              type: 'text',
              name: 'nama_jabatan',
              label: 'Nama Jabatan',
              placeholder: 'cth: Supervisor',
              rules: [{ required: true, message: 'Nama jabatan wajib diisi' }],
            },
          ]}
        />
        <div className='pt-1'>
          <AppTypography.Text
            tone='muted'
            size={12}
          >
            Nama jabatan akan ditambahkan sebagai anak dari jabatan yang dipilih.
          </AppTypography.Text>
        </div>
      </AppModal>
    </div>
  );
}
