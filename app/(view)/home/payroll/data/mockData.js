// app/(view)/home/payroll/data/mockData.js
export const mockPeriodePayroll = [
  {
    id_periode_payroll: 'prd-2026-03',
    bulan: 3,
    tahun: 2026,
    tanggal_mulai: '2026-03-01',
    tanggal_selesai: '2026-03-31',
    status_periode: 'AKTIF',
  },
  {
    id_periode_payroll: 'prd-2026-02',
    bulan: 2,
    tahun: 2026,
    tanggal_mulai: '2026-02-01',
    tanggal_selesai: '2026-02-28',
    status_periode: 'SELESAI',
  },
  {
    id_periode_payroll: 'prd-2026-01',
    bulan: 1,
    tahun: 2026,
    tanggal_mulai: '2026-01-01',
    tanggal_selesai: '2026-01-31',
    status_periode: 'SELESAI',
  },
];

export const mockPayrollKaryawan = [
  {
    id_payroll_karyawan: 'pay-001',
    id_user: 'usr-001',
    nama_karyawan_snapshot: 'I Dewa Gede Arsana Pucanganom',
    nama_jabatan_snapshot: 'Back End Developer - E-HRM',
    status_payroll: 'DIBAYAR',
    total_dibayarkan: 8250000,
  },
  {
    id_payroll_karyawan: 'pay-002',
    id_user: 'usr-002',
    nama_karyawan_snapshot: 'Ni Putu Ayu Lestari',
    nama_jabatan_snapshot: 'UI Designer',
    status_payroll: 'DIBAYAR',
    total_dibayarkan: 7100000,
  },
  {
    id_payroll_karyawan: 'pay-003',
    id_user: 'usr-003',
    nama_karyawan_snapshot: 'Made Surya Pratama',
    nama_jabatan_snapshot: 'Mobile Developer',
    status_payroll: 'DRAFT',
    total_dibayarkan: 7800000,
  },
  {
    id_payroll_karyawan: 'pay-004',
    id_user: 'usr-004',
    nama_karyawan_snapshot: 'Kadek Ananda Putri',
    nama_jabatan_snapshot: 'HR Generalist',
    status_payroll: 'DRAFT',
    total_dibayarkan: 6400000,
  },
];

export const mockPinjamanKaryawan = [
  {
    id_pinjaman_karyawan: 'loan-001',
    nama_karyawan: 'Made Surya Pratama',
    status_pinjaman: 'AKTIF',
    sisa_pinjaman: 2500000,
  },
  {
    id_pinjaman_karyawan: 'loan-002',
    nama_karyawan: 'Kadek Ananda Putri',
    status_pinjaman: 'AKTIF',
    sisa_pinjaman: 1800000,
  },
  {
    id_pinjaman_karyawan: 'loan-003',
    nama_karyawan: 'Ni Putu Ayu Lestari',
    status_pinjaman: 'LUNAS',
    sisa_pinjaman: 0,
  },
];

export function formatCurrency(value) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(Number(value || 0));
}

export function formatBulan(bulan) {
  const daftarBulan = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];

  const index = Number(bulan) - 1;
  return daftarBulan[index] || '-';
}

export function formatStatusPayroll(status) {
  const map = {
    DIBAYAR: {
      label: 'Dibayar',
      tone: 'success',
    },
    DRAFT: {
      label: 'Draft',
      tone: 'warning',
    },
    DIPROSES: {
      label: 'Diproses',
      tone: 'info',
    },
  };

  return (
    map[status] || {
      label: status || '-',
      tone: 'neutral',
    }
  );
}

export function formatStatusPeriode(status) {
  const map = {
    AKTIF: {
      label: 'Aktif',
      tone: 'info',
    },
    SELESAI: {
      label: 'Selesai',
      tone: 'success',
    },
    DRAFT: {
      label: 'Draft',
      tone: 'warning',
    },
  };

  return (
    map[status] || {
      label: status || '-',
      tone: 'neutral',
    }
  );
}
