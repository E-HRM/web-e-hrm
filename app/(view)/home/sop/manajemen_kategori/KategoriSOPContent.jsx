'use client';

import React from 'react';
import SOPCategoryModal from '../component_sop/SOPCategoryModal';

export default function KategoriSOPContent({ vm }) {
  if (!vm) return null;

  return (
    <SOPCategoryModal
      open={vm.categoryModalOpen}
      categories={vm.categories}
      onClose={() => vm.setCategoryModalOpen(false)}
      onSave={vm.saveCategory}
      onDelete={vm.deleteCategory}
      nowISO={vm.nowISO}
    />
  );
}
