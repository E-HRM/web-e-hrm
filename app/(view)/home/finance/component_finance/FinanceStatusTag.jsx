'use client';

import React, { useMemo } from 'react';
import AppTag from '@/app/(view)/component_shared/AppTag';

const MAP = {
  PENDING: { label: 'Pending', tone: 'info' },
  IN_REVIEW: { label: 'In Review', tone: 'warning' },
  APPROVED: { label: 'Approved', tone: 'success' },
  REJECTED: { label: 'Rejected', tone: 'danger' },
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
