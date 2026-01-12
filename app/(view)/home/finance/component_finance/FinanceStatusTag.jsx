'use client';

import React, { useMemo } from 'react';
import AppTag from '@/app/(view)/component_shared/AppTag';

const MAP = {
  PENDING: { label: 'Pending', tone: 'warning' },
  APPROVED: { label: 'Approved', tone: 'success' },
  REJECTED: { label: 'Rejected', tone: 'danger' },
  // backward-compat: kalau masih ada status lama di response
  IN_REVIEW: { label: 'Pending', tone: 'warning' },
};

export default function FinanceStatusTag({ status }) {
  const conf = useMemo(() => {
    if (!status) return { label: '—', tone: 'neutral' };
    return MAP[status] || { label: String(status), tone: 'neutral' };
  }, [status]);

  return (
    <AppTag
      tone={conf.tone}
      variant='soft'
      pill={false}
    >
      {conf.label}
    </AppTag>
  );
}
