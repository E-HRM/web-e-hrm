'use client';

import React from 'react';
import { PlusOutlined } from '@ant-design/icons';

import AppButton from '@/app/(view)/component_shared/AppButton';
import AppTypography from '@/app/(view)/component_shared/AppTypography';

import useMasterTemplateViewModel from './useMasterTemplateViewModel';
import MasterTemplateTable from './components/MasterTemplateTable';
import MasterTemplateDetailModal from './components/MasterTemplateDetailModal';
import MasterTemplateFormModal from './components/MasterTemplateFormModal';

export default function MasterTemplateContent() {
  const vm = useMasterTemplateViewModel();

  return (
    <div className='min-h-screen bg-gray-50 p-6'>
      <div className='mb-6 flex items-start justify-between gap-3 flex-wrap'>
        <div>
          <AppTypography.Title level={3} className='!mb-1'>
            Master Template
          </AppTypography.Title>
          <AppTypography.Text tone='secondary'>
            Kelola file template payroll dalam satu tempat
          </AppTypography.Text>
        </div>

        <AppButton variant='primary' icon={<PlusOutlined />} onClick={vm.openCreate}>
          Tambah Template
        </AppButton>
      </div>

      <MasterTemplateTable
        templates={vm.templates}
        loading={vm.loading}
        onSelectTemplate={vm.openDetail}
        onEdit={vm.openEdit}
        onDelete={vm.deleteTemplate}
      />

      <MasterTemplateDetailModal
        open={Boolean(vm.selectedTemplate)}
        template={vm.selectedTemplate}
        onClose={() => vm.setSelectedTemplate(null)}
        onEdit={() => {
          if (!vm.selectedTemplate) return;
          vm.openEdit(vm.selectedTemplate);
          vm.setSelectedTemplate(null);
        }}
      />

      <MasterTemplateFormModal
        open={vm.formOpen}
        template={vm.editingTemplate}
        onClose={() => {
          vm.setFormOpen(false);
          vm.setEditingTemplate(null);
        }}
        onSave={vm.saveTemplate}
      />
    </div>
  );
}
