'use client';

import { FileDoneOutlined, FileTextOutlined, WalletOutlined } from '@ant-design/icons';

import PayrollHubContent from '../components_hub/PayrollHubContent';

const PENGGAJIAN_ITEMS = [
  {
    key: 'periode-payroll',
    title: 'Periode Payroll',
    description: 'Kelola periode payroll sesuai schema `PeriodePayroll`, lengkap dengan status proses, rentang tanggal, jumlah payroll karyawan, dan payout yang terhubung.',
    helperText: 'Terintegrasi ke API `/api/admin/periode-payroll` dan menjadi sumber acuan payroll tanpa approval level periode.',
    href: '/home/payroll/penggajian/periode-payroll',
    status: 'ready',
    icon: WalletOutlined,
    iconWrapClassName: 'bg-amber-100',
    iconClassName: 'text-amber-600',
  },
  {
    key: 'payroll-karyawan',
    title: 'Payroll Karyawan',
    description: 'Kelola payroll per karyawan berikut approval dinamis single atau multi approver berdasarkan schema `PayrollKaryawan` dan `ApprovalPayrollKaryawan`.',
    helperText: 'Approval sekarang diset per payroll karyawan dan tidak lagi bergantung pada approval level periode.',
    href: '/home/payroll/penggajian/payroll-karyawan',
    status: 'ready',
    icon: FileDoneOutlined,
    iconWrapClassName: 'bg-orange-100',
    iconClassName: 'text-orange-600',
  },
  {
    key: 'slip-gaji',
    title: 'Slip Gaji',
    description: 'Tahap 1 sementara diarahkan ke halaman master template untuk pengelolaan template payslip sambil menunggu halaman rekap SlipGajiPayroll dan item slip yang terpisah.',
    helperText: 'Mapping sementara ke manajemen template payslip agar alur slip gaji tetap bisa diakses dari struktur baru.',
    href: '/home/payroll/manajemen-template',
    status: 'temporary',
    icon: FileTextOutlined,
    iconWrapClassName: 'bg-blue-100',
    iconClassName: 'text-blue-600',
  },
];

export default function PenggajianPayrollContent() {
  return (
    <PayrollHubContent
      title='Penggajian Payroll'
      description='Kelompok navigasi untuk proses penggajian inti: periode payroll, payroll per karyawan, approval karyawan dinamis, dan akses sementara ke pengelolaan template payslip.'
      items={PENGGAJIAN_ITEMS}
    />
  );
}
