'use client';

import { AppConfirm } from '../../../../component_shared/AppModal';

const ACCENT = '#D9A96F';

export function confirmDelete({ title = 'Hapus Divisi', content = 'Yakin ingin menghapus divisi ini?', onOk }) {
  return AppConfirm({
    title,
    content,
    okText: 'Hapus',
    cancelText: 'Batal',
    danger: true,
    onOk,
    okButtonProps: {
      style: { backgroundColor: ACCENT, borderColor: ACCENT },
    },
  });
}
