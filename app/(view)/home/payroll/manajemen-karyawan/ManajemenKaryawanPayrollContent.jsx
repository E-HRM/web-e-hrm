'use client';

import { HistoryOutlined, TeamOutlined } from '@ant-design/icons';

import PayrollHubContent from '../components_hub/PayrollHubContent';

const MANAJEMEN_KARYAWAN_ITEMS = [
  {
    key: 'direktori-karyawan',
    title: 'Direktori Karyawan',
    description: 'Menampilkan data User dan ProfilPayroll untuk kebutuhan administrasi payroll karyawan dalam satu direktori.',
    helperText: 'Pada tahap 1 diarahkan ke halaman profile payroll yang sudah tersedia.',
    href: '/home/payroll/manajemen-karyawan/profile-payroll',
    status: 'ready',
    icon: TeamOutlined,
    iconWrapClassName: 'bg-blue-100',
    iconClassName: 'text-blue-600',
  },
  {
    key: 'riwayat-kompensasi',
    title: 'Riwayat Kompensasi',
    description: 'Menampilkan model RiwayatKompensasiKaryawan untuk menelusuri histori kompensasi tiap karyawan.',
    helperText: 'Mengarah ke halaman riwayat kompensasi karyawan yang sudah tersedia.',
    href: '/home/payroll/manajemen-karyawan/riwayat-kompensasi-karyawan',
    status: 'ready',
    icon: HistoryOutlined,
    iconWrapClassName: 'bg-violet-100',
    iconClassName: 'text-violet-600',
  },
];



export default function ManajemenKaryawanPayrollContent() {
  return (
    <PayrollHubContent
      title='Manajemen Karyawan Payroll'
      description='Kelompok navigasi untuk direktori data karyawan payroll dan riwayat kompensasi. Tahap 1 seluruh item di bagian ini sudah dapat dipakai melalui halaman existing.'
      items={MANAJEMEN_KARYAWAN_ITEMS}
    />
  );
}
