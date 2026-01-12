'use client';

import React, { useMemo } from 'react';

import AppTypography from '@/app/(view)/component_shared/AppTypography';
import AppButton from '@/app/(view)/component_shared/AppButton';

import { PlusOutlined, FolderOutlined } from '@ant-design/icons';

import useSOPViewModel from './useSOPViewModel';
import useKategoriSOPViewModel from './manajemen_kategori/useKategoriSOPViewModel';

import SOPTable from './component_sop/SOPTable';
import SOPDetailModal from './component_sop/SOPDetailModal';
import SOPFormModal from './component_sop/SOPFormModal';
import KategoriSOPContent from './manajemen_kategori/KategoriSOPContent';

export default function SOPContent() {
  const sopVm = useSOPViewModel();
  const kategoriVm = useKategoriSOPViewModel();

  const categoriesForTable = useMemo(() => kategoriVm.categoriesForSOP || [], [kategoriVm.categoriesForSOP]);

  return (
    <div className='min-h-screen bg-gray-50 p-6'>
      <div className='mb-6 flex items-start justify-between gap-3 flex-wrap'>
        <div>
          <AppTypography.Title level={3} className='!mb-1'>
            Standard Operating Procedure (SOP)
          </AppTypography.Title>
          <AppTypography.Text tone='secondary'>Kelola SOP dan kategori dalam satu tempat</AppTypography.Text>
        </div>

        <div className='flex items-center gap-2'>
          <AppButton variant='outline' icon={<FolderOutlined />} onClick={() => kategoriVm.setCategoryModalOpen(true)}>
            Kelola Kategori
          </AppButton>

          <AppButton variant='primary' icon={<PlusOutlined />} onClick={sopVm.openCreate}>
            Tambah SOP Baru
          </AppButton>
        </div>
      </div>

      <SOPTable
        sops={sopVm.sops}
        categories={categoriesForTable}
        onSelectSOP={sopVm.openDetail}
        onEdit={sopVm.openEdit}
        onDelete={sopVm.deleteSOP}
      />

      <SOPDetailModal
        open={Boolean(sopVm.selectedSOP)}
        sop={sopVm.selectedSOP}
        categoryMap={kategoriVm.categoryMap}
        onClose={() => sopVm.setSelectedSOP(null)}
        onEdit={() => {
          if (!sopVm.selectedSOP) return;
          sopVm.openEdit(sopVm.selectedSOP);
        }}
      />

      <SOPFormModal
        open={sopVm.formOpen}
        sop={sopVm.editingSOP}
        activeCategories={kategoriVm.activeCategories}
        onClose={() => {
          sopVm.setFormOpen(false);
          sopVm.setEditingSOP(null);
        }}
        onSave={(payload) => sopVm.saveSOP(payload)}
        nowISO={sopVm.nowISO}
      />

      <KategoriSOPContent vm={kategoriVm} />
    </div>
  );
}
