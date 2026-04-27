'use client';

import { CreditCardOutlined, WalletOutlined } from '@ant-design/icons';

import PayrollHubContent from '../components_hub/PayrollHubContent';

const PINJAMAN_KARYAWAN_ITEMS = [
  {
    key: 'daftar-pinjaman',
    title: 'Daftar Pinjaman',
    description: 'Kelola pinjaman karyawan, pantau sisa saldo, dan pastikan cicilan berjalan sesuai jadwal.',
    helperText: 'Buka daftar pinjaman untuk menambah, mengubah, atau melihat rincian pinjaman karyawan.',
    href: '/home/payroll/pinjaman-karyawan/manajemen-pinjaman',
    status: 'ready',
    icon: CreditCardOutlined,
    iconWrapClassName: 'bg-blue-100',
    iconClassName: 'text-blue-600',
  },
  {
    key: 'tagihan-cicilan',
    title: 'Tagihan & Cicilan',
    description: 'Pantau cicilan berdasarkan jatuh tempo, status pembayaran, dan sisa tagihan.',
    helperText: 'Lihat ringkasan, cari cicilan, dan buka rincian tagihan dari satu halaman.',
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
      title='Pinjaman Karyawan'
      description='Kelola pinjaman dan cicilan karyawan dari satu area, mulai dari pembuatan pinjaman sampai pemantauan tagihan.'
      items={PINJAMAN_KARYAWAN_ITEMS}
      showHeaderSummary={false}
      showStatusTag={false}
    />
  );
}
