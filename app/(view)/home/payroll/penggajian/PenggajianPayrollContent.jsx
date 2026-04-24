'use client';

import { FileDoneOutlined, FileTextOutlined, WalletOutlined } from '@ant-design/icons';

import PayrollHubContent from '../components_hub/PayrollHubContent';

const PENGGAJIAN_ITEMS = [
  {
    key: 'periode-payroll',
    title: 'Periode Payroll',
    description: 'Buat dan kelola periode penggajian yang menjadi acuan proses payroll karyawan.',
    helperText: 'Gunakan halaman ini untuk menyiapkan periode payroll sebelum data penggajian karyawan diproses.',
    href: '/home/payroll/penggajian/periode-payroll',
    status: 'ready',
    icon: WalletOutlined,
    iconWrapClassName: 'bg-amber-100',
    iconClassName: 'text-amber-600',
    ctaLabel: 'Kelola Periode Payroll',
  },
  {
    key: 'payroll-karyawan',
    title: 'Payroll Karyawan',
    description: 'Kelola data penggajian setiap karyawan, termasuk komponen pendapatan, potongan, pajak, approval, dan payslip.',
    helperText: 'Gunakan halaman ini untuk memproses, memeriksa, menyetujui, dan melihat detail payroll karyawan.',
    href: '/home/payroll/penggajian/payroll-karyawan',
    status: 'ready',
    icon: FileDoneOutlined,
    iconWrapClassName: 'bg-orange-100',
    iconClassName: 'text-orange-600',
    ctaLabel: 'Kelola Payroll Karyawan',
  },
  {
    key: 'template-slip-gaji',
    title: 'Template Slip Gaji',
    description: 'Kelola template dokumen payroll yang digunakan untuk slip gaji dan dokumen pendukung penggajian.',
    helperText: 'Gunakan halaman ini untuk menyiapkan format dokumen payroll sebelum slip gaji dibuat atau dikirimkan.',
    href: '/home/payroll/manajemen-template',
    status: 'ready',
    icon: FileTextOutlined,
    iconWrapClassName: 'bg-blue-100',
    iconClassName: 'text-blue-600',
    ctaLabel: 'Kelola Template',
  },
];

export default function PenggajianPayrollContent() {
  return (
    <PayrollHubContent
      title='Penggajian Payroll'
      description='Kelola proses penggajian mulai dari periode payroll, payroll karyawan, hingga template dokumen payroll.'
      items={PENGGAJIAN_ITEMS}
      showHeaderSummary={false}
      showStatusTag={false}
    />
  );
}
