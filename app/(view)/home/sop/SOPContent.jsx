'use client';

import React from 'react';

import AppTypography from '@/app/(view)/component_shared/AppTypography';
import AppButton from '@/app/(view)/component_shared/AppButton';
import AppCard from '@/app/(view)/component_shared/AppCard';

import { PlusOutlined, FolderOutlined } from '@ant-design/icons';

import useSOPViewModel from './useSOPViewModel';

import SOPTable from './component_sop/SOPTable';
import SOPDetailModal from './component_sop/SOPDetailModal';
import SOPFormModal from './component_sop/SOPFormModal';
import SOPCategoryModal from './component_sop/SOPCategoryModal';

export default function SOPContent() {
  const vm = useSOPViewModel();

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
          {/* ✅ outlined (bukan biru muda) */}
          <AppButton
            variant='outline'
            icon={<FolderOutlined />}
            onClick={() => vm.setCategoryModalOpen(true)}
          >
            Kelola Kategori
          </AppButton>

          <AppButton variant='primary' icon={<PlusOutlined />} onClick={vm.openCreate}>
            Tambah SOP Baru
          </AppButton>
        </div>
      </div>

      <AppCard className='shadow-sm border-0'>
        <SOPTable
          sops={vm.sops}
          categories={vm.categories}
          onSelectSOP={vm.setSelectedSOP}
          onEdit={vm.openEdit}
          onDelete={vm.deleteSOP}
        />
      </AppCard>

      <SOPDetailModal
        open={Boolean(vm.selectedSOP)}
        sop={vm.selectedSOP}
        categoryMap={vm.categoryMap}
        onClose={() => vm.setSelectedSOP(null)}
        onEdit={() => {
          if (!vm.selectedSOP) return;
          vm.openEdit(vm.selectedSOP);
        }}
      />

      <SOPFormModal
        open={vm.formOpen}
        sop={vm.editingSOP}
        activeCategories={vm.activeCategories}
        onClose={() => {
          vm.setFormOpen(false);
          vm.setEditingSOP(null);
        }}
        onSave={(payload) => vm.saveSOP(payload)}
        nowISO={vm.nowISO}
      />

      <SOPCategoryModal
        open={vm.categoryModalOpen}
        categories={vm.categories}
        onClose={() => vm.setCategoryModalOpen(false)}
        onSave={vm.saveCategory}
        onDelete={vm.deleteCategory}
        onToggleStatus={vm.toggleCategoryStatus}
        toSnakeCaseKey={vm.toSnakeCaseKey}
        nowISO={vm.nowISO}
      />
    </div>
  );
}
