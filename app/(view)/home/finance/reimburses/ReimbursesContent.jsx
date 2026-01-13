'use client';

import React from 'react';

import useReimbursesViewModel from './useReimbursesViewModel';

import FinanceRequestsTable from '../component_finance/FinanceRequestsTable';
import ReimbursesDetailModal from './detail/ReimbursesDetailModal';

export default function ReimbursesContent({ filters }) {
  const vm = useReimbursesViewModel(filters);

  return (
    <>
      <FinanceRequestsTable
        rows={vm.rows}
        onRowClick={vm.openDetail}
      />

      <ReimbursesDetailModal
        open={!!vm.selected}
        data={vm.selected}
        onClose={vm.closeDetail}
        onApprove={vm.approve}
        onReject={vm.reject}
      />
    </>
  );
}