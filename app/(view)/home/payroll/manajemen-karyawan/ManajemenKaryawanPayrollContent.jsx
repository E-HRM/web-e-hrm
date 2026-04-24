'use client';

import { TeamOutlined } from '@ant-design/icons';

import PayrollHubContent from '../components_hub/PayrollHubContent';

const MANAJEMEN_KARYAWAN_ITEMS = [
  {
    key: 'profile-payroll',
    title: 'Profil Payroll Karyawan',
    description: 'Kelola data payroll karyawan seperti rekening pembayaran, status payroll, NPWP, PTKP, dan informasi administrasi penggajian.',
    helperText: 'Pastikan data payroll karyawan sudah lengkap dan sesuai sebelum proses penggajian dijalankan.',
    href: '/home/payroll/manajemen-karyawan/profile-payroll',
    status: 'ready',
    icon: TeamOutlined,
    iconWrapClassName: 'bg-blue-100',
    iconClassName: 'text-blue-600',
    ctaLabel: 'Kelola Profil Payroll',
  },
];

export default function ManajemenKaryawanPayrollContent() {
  return (
    <PayrollHubContent
      title='Manajemen Karyawan Payroll'
      description='Kelola data karyawan yang digunakan dalam proses payroll, termasuk informasi pembayaran, pajak, dan status administrasi penggajian.'
      items={MANAJEMEN_KARYAWAN_ITEMS}
      showHeaderSummary={false}
      showStatusTag={false}
    />
  );
}
