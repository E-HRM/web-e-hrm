'use client';

import { PercentageOutlined, SettingOutlined, ShoppingOutlined } from '@ant-design/icons';

import PayrollHubContent from '../components_hub/PayrollHubContent';

const MASTER_DATA_ITEMS = [
  {
    key: 'definisi-komponen-payroll',
    title: 'Definisi Komponen Payroll',
    description: 'Atur komponen pendapatan dan potongan yang digunakan dalam proses payroll.',
    href: '/home/payroll/master-data/definisi-komponen',
    ctaLabel: 'Kelola Komponen',
    status: 'ready',
    icon: SettingOutlined,
    iconWrapClassName: 'bg-blue-100',
    iconClassName: 'text-blue-600',
  },
  {
    key: 'tarif-pajak-ter',
    title: 'Tarif Pajak TER',
    description: 'Lihat dan kelola tarif Pajak TER sebagai acuan perhitungan pajak payroll.',
    href: '/home/payroll/master-data/pajak-ter',
    ctaLabel: 'Lihat Tarif TER',
    status: 'ready',
    icon: PercentageOutlined,
    iconWrapClassName: 'bg-emerald-100',
    iconClassName: 'text-emerald-600',
  },
  {
    key: 'produk-konsultan',
    title: 'Produk Konsultan',
    description: 'Kelola daftar produk konsultan yang digunakan dalam layanan atau kebutuhan terkait payroll.',
    href: '/home/payroll/master-data/produk-konsultan',
    ctaLabel: 'Kelola Produk',
    status: 'ready',
    icon: ShoppingOutlined,
    iconWrapClassName: 'bg-amber-100',
    iconClassName: 'text-amber-600',
  },
];

const BREADCRUMB_ITEMS = [
  {
    key: 'payroll',
    label: 'Payroll',
    href: '/home/payroll',
  },
  {
    key: 'master-data-payroll',
    label: 'Master Data Payroll',
  },
];

export default function MasterDataPayrollContent() {
  return (
    <PayrollHubContent
      title='Master Data Payroll'
      description='Kelola data utama payroll di satu tempat, mulai dari komponen gaji, tarif Pajak TER, hingga produk konsultan.'
      items={MASTER_DATA_ITEMS}
      breadcrumbItems={BREADCRUMB_ITEMS}
      showHeaderSummary={false}
      showStatusTag={false}
    />
  );
}
