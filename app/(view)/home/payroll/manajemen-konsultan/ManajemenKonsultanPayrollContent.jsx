'use client';

import { DollarOutlined, ScheduleOutlined, ShoppingCartOutlined } from '@ant-design/icons';

import PayrollHubContent from '../components_hub/PayrollHubContent';

const MANAJEMEN_KONSULTAN_ITEMS = [
  {
    key: 'periode-konsultan',
    title: 'Periode Konsultan',
    description: 'Kelola periode konsultan sebagai acuan transaksi harian, review payout, dan penguncian data payroll konsultan.',
    helperText: 'Mengarah ke halaman periode konsultan yang sudah disesuaikan dengan API dan pola UI project.',
    href: '/home/payroll/manajemen-konsultan/periode-konsultan',
    status: 'ready',
    icon: ScheduleOutlined,
    iconWrapClassName: 'bg-amber-100',
    iconClassName: 'text-amber-600',
  },
  {
    key: 'transaksi-harian',
    title: 'Transaksi Harian',
    description: 'Kelola model TransaksiKonsultan untuk input transaksi harian konsultan dan pemetaan ke payout.',
    helperText: 'Mengarah ke halaman transaksi konsultan yang sudah tersedia.',
    href: '/home/payroll/manajemen-konsultan/transaksi-konsultan',
    status: 'ready',
    icon: ShoppingCartOutlined,
    iconWrapClassName: 'bg-blue-100',
    iconClassName: 'text-blue-600',
  },
  {
    key: 'pencairan-konsultan',
    title: 'Pencairan (Payout)',
    description: 'Menampilkan rekap payout konsultan dan detail pencairan berdasarkan data PayoutKonsultan.',
    helperText: 'Mengarah ke halaman payout konsultan yang sudah tersedia.',
    href: '/home/payroll/manajemen-konsultan/payout-konsultan',
    status: 'ready',
    icon: DollarOutlined,
    iconWrapClassName: 'bg-emerald-100',
    iconClassName: 'text-emerald-600',
  },
];

export default function ManajemenKonsultanPayrollContent() {
  return (
    <PayrollHubContent
      title='Manajemen Konsultan Payroll'
      description='Kelompok navigasi untuk periode konsultan, transaksi harian, dan payout konsultan yang sudah terhubung ke pola UI payroll project.'
      items={MANAJEMEN_KONSULTAN_ITEMS}
    />
  );
}
