'use client';

import React from 'react';

import usePaymentViewModel from './usePaymentViewModel';

import FinanceRequestsTable from '../component_finance/FinanceRequestsTable';
import PaymentDetailModal from './detail/PaymentDetailModal';

export default function PaymentContent({ filters }) {
  const vm = usePaymentViewModel(filters);

  return (
    <>
      <FinanceRequestsTable
        rows={vm.rows}
        onRowClick={vm.openDetail}
      />

      <PaymentDetailModal
        open={!!vm.selected}
        data={vm.selected}
        onClose={vm.closeDetail}
        onApprove={vm.approve}
        onReject={vm.reject}
        onMarkReceiptUploaded={vm.markReceiptUploaded}
      />
    </>
  );
}