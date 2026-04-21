'use client';

import { CreditCardOutlined, WalletOutlined } from '@ant-design/icons';

import PayrollHubContent from '../components_hub/PayrollHubContent';

const PINJAMAN_KARYAWAN_ITEMS = [
  {
    key: 'daftar-pinjaman',
    title: 'Daftar Pinjaman',
    description: 'Kelola data pinjaman karyawan aktif, status pinjaman, sisa saldo, dan kebutuhan administrasi pinjaman payroll.',
    helperText: 'Mengarah ke halaman manajemen pinjaman yang sudah disesuaikan dengan modul payroll.',
    href: '/home/payroll/pinjaman-karyawan/manajemen-pinjaman',
    status: 'ready',
    icon: CreditCardOutlined,
    iconWrapClassName: 'bg-blue-100',
    iconClassName: 'text-blue-600',
  },
  {
    key: 'tagihan-cicilan',
    title: 'Tagihan & Cicilan',
    description: 'Pantau daftar cicilan pinjaman karyawan berdasarkan jatuh tempo, status pembayaran, keterkaitan payroll, dan nilai outstanding.',
    helperText: 'Frontend sudah mengikuti pola halaman payroll: summary, filter, tabel, dan modal detail.',
    href: '/home/payroll/pinjaman-karyawan/tagihan-cicilan',
    status: 'ready',
    icon: WalletOutlined,
    iconWrapClassName: 'bg-amber-100',
    iconClassName: 'text-amber-600',
  },
];

export default function PinjamanKaryawanPayrollContent() {
  return (
    <PayrollHubContent
      title='Pinjaman Karyawan Payroll'
      description='Kelompok navigasi untuk pengelolaan pinjaman dan cicilan karyawan. Halaman daftar pinjaman dan tagihan cicilan sudah terhubung dengan API internal payroll agar operasional pinjaman dapat dipantau dari satu area.'
      items={PINJAMAN_KARYAWAN_ITEMS}
    />
  );
}
