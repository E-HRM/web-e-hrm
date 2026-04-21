'use client';

import { FileDoneOutlined, FileTextOutlined, WalletOutlined } from '@ant-design/icons';

import PayrollHubContent from '../components_hub/PayrollHubContent';

const PENGGAJIAN_ITEMS = [
  {
    key: 'periode-payroll',
    title: 'Periode Payroll',
    description: 'Kelola periode payroll sesuai schema `PeriodePayroll`, lengkap dengan status proses, rentang tanggal, jumlah payroll karyawan, dan approval yang terhubung.',
    helperText: 'Sudah terintegrasi ke API `/api/admin/periode-payroll` dan menjadi sumber acuan periode payroll.',
    href: '/home/payroll/penggajian/periode-payroll',
    status: 'ready',
    icon: WalletOutlined,
    iconWrapClassName: 'bg-amber-100',
    iconClassName: 'text-amber-600',
  },
  {
    key: 'persetujuan-payroll',
    title: 'Persetujuan Payroll',
    description: 'Kelola approval payroll per periode berdasarkan schema `PersetujuanPeriodePayroll`, termasuk level, approver, keputusan, dan timestamp keputusan.',
    helperText: 'Sudah terintegrasi ke API `/api/admin/persetujuan-periode-payroll` tanpa mock data.',
    href: '/home/payroll/penggajian/persetujuan-payroll',
    status: 'ready',
    icon: FileDoneOutlined,
    iconWrapClassName: 'bg-orange-100',
    iconClassName: 'text-orange-600',
  },
  {
    key: 'slip-gaji',
    title: 'Slip Gaji',
    description: 'Tahap 1 sementara diarahkan ke builder payslip existing sambil menunggu halaman rekap SlipGajiPayroll dan item slip yang terpisah.',
    helperText: 'Mapping sementara ke halaman payslip existing agar alur slip gaji tetap bisa diakses dari struktur baru.',
    href: '/home/payroll/payslip',
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
      description='Kelompok navigasi untuk proses penggajian inti. Tahap 1 memisahkan domain penggajian di satu hub, sambil mempertahankan akses sementara ke builder payslip existing.'
      items={PENGGAJIAN_ITEMS}
    />
  );
}
