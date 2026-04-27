'use client';

import { DollarOutlined, ScheduleOutlined, ShoppingCartOutlined } from '@ant-design/icons';

import PayrollHubContent from '../components_hub/PayrollHubContent';

const BREADCRUMB_ITEMS = [
  {
    key: 'payroll',
    label: 'Payroll',
    href: '/home/payroll',
  },
  {
    key: 'manajemen-payroll-konsultan',
    label: 'Manajemen Payroll Konsultan',
  },
];

const MANAJEMEN_KONSULTAN_ITEMS = [
  {
    key: 'periode-konsultan',
    title: 'Periode Konsultan',
    description: 'Buat dan kelola periode kerja konsultan sebagai dasar pencatatan transaksi dan proses pencairan.',
    helperText: 'Gunakan halaman ini untuk menyiapkan periode sebelum transaksi dan pencairan diproses.',
    href: '/home/payroll/manajemen-konsultan/periode-konsultan',
    status: 'ready',
    ctaLabel: 'Kelola Periode',
    icon: ScheduleOutlined,
    iconWrapClassName: 'bg-amber-100',
    iconClassName: 'text-amber-600',
  },
  {
    key: 'transaksi-harian',
    title: 'Transaksi Harian',
    description: 'Catat, periksa, atau impor transaksi harian konsultan berdasarkan periode yang sedang berjalan.',
    helperText: 'Data transaksi akan menjadi dasar perhitungan bagian konsultan dan pencairannya.',
    href: '/home/payroll/manajemen-konsultan/transaksi-konsultan',
    status: 'ready',
    ctaLabel: 'Kelola Transaksi',
    icon: ShoppingCartOutlined,
    iconWrapClassName: 'bg-blue-100',
    iconClassName: 'text-blue-600',
  },
  {
    key: 'pencairan-konsultan',
    title: 'Pencairan Konsultan',
    description: 'Kelola rekap pencairan, nominal yang dibayarkan, dan transaksi yang perlu ditahan atau diproses ke payroll.',
    helperText: 'Gunakan halaman ini untuk meninjau, menyetujui, dan memproses pencairan konsultan.',
    href: '/home/payroll/manajemen-konsultan/payout-konsultan',
    status: 'ready',
    ctaLabel: 'Kelola Pencairan',
    icon: DollarOutlined,
    iconWrapClassName: 'bg-emerald-100',
    iconClassName: 'text-emerald-600',
  },
];

export default function ManajemenKonsultanPayrollContent() {
  return (
    <PayrollHubContent
      title='Manajemen Payroll Konsultan'
      description='Kelola proses payroll konsultan mulai dari periode kerja, pencatatan transaksi harian, hingga pencairan hak konsultan.'
      items={MANAJEMEN_KONSULTAN_ITEMS}
      breadcrumbItems={BREADCRUMB_ITEMS}
      showHeaderSummary={false}
      showStatusTag={false}
    />
  );
}
