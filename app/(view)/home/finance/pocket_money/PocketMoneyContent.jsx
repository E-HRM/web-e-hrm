'use client';

import React from 'react';

import usePocketMoneyViewModel from './usePocketMoneyViewModel';

import FinanceRequestsTable from '../component_finance/FinanceRequestsTable';
import PocketMoneyDetailModal from './detail/PocketMoneyDetailModal';

export default function PocketMoneyContent({ filters }) {
  const vm = usePocketMoneyViewModel(filters);

  return (
    <>
      <FinanceRequestsTable
        rows={vm.rows}
        onRowClick={vm.openDetail}
      />

      <PocketMoneyDetailModal
        open={!!vm.selected}
        data={vm.selected}
        onClose={vm.closeDetail}
        onApprove={vm.approve}
        onReject={vm.reject}
      />
    </>
  );
}
