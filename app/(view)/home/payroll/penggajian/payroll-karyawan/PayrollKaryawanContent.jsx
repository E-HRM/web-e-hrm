// app/(view)/home/payroll/payroll-karyawan/PayrollKaryawanContent.jsx
'use client';

import AppButton from '@/app/(view)/component_shared/AppButton';
import AppEmpty from '@/app/(view)/component_shared/AppEmpty';

import CreatePayrollKaryawanModal from './component_PayrollKaryawan/CreatePayrollKaryawanModal';
import DeletePayrollKaryawanDialog from './component_PayrollKaryawan/DeletePayrollKaryawanDialog';
import DetailPayrollKaryawanModal from './component_PayrollKaryawan/DetailPayrollKaryawanModal';
import EditPayrollKaryawanModal from './component_PayrollKaryawan/EditPayrollKaryawanModal';
import PayrollKaryawanDataSection from './component_PayrollKaryawan/PayrollKaryawanDataSection';
import PayrollKaryawanFilterSection from './component_PayrollKaryawan/PayrollKaryawanFilterSection';
import PayrollKaryawanFocusedPeriodeSection from './component_PayrollKaryawan/PayrollKaryawanFocusedPeriodeSection';
import PayrollKaryawanHeader from './component_PayrollKaryawan/PayrollKaryawanHeader';
import PayrollKaryawanSummarySection from './component_PayrollKaryawan/PayrollKaryawanSummarySection';
import usePayrollKaryawanViewModel from './usePayrollKaryawanViewModel';

export default function PayrollKaryawanContent() {
  const vm = usePayrollKaryawanViewModel();

  const buildItemKomponenHref = (payroll) => {
    const query = new URLSearchParams({
      id_payroll_karyawan: payroll.id_payroll_karyawan || '',
      id_periode_payroll: payroll.id_periode_payroll || '',
      id_user: payroll.id_user || '',
      id_tarif_pajak_ter: payroll.id_tarif_pajak_ter || '',
      nama_karyawan: payroll.nama_karyawan_snapshot || '',
      departement: payroll.nama_departement_snapshot || '',
      jabatan: payroll.nama_jabatan_snapshot || '',
      periode_label: vm.getPeriodeInfo(payroll.id_periode_payroll),
      jenis_hubungan_kerja: payroll.jenis_hubungan_snapshot || '',
      kode_kategori_pajak_snapshot: payroll.kode_kategori_pajak_snapshot || '',
      persen_tarif_snapshot: String(payroll.persen_tarif_snapshot ?? ''),
      status_payroll: payroll.status_payroll || '',
      periode_status: payroll.periode_status || '',
      total_pendapatan_bruto: String(payroll.total_bruto_kena_pajak ?? ''),
      total_potongan: String((payroll.total_pajak || 0) + (payroll.total_potongan_lain || 0)),
      pph21_nominal: String(payroll.total_pajak ?? ''),
      pendapatan_bersih: String(payroll.total_dibayarkan ?? ''),
    });

    return `/home/payroll/penggajian/payroll-karyawan/item-komponen?${query.toString()}`;
  };

  if (vm.error && vm.payrollData.length === 0) {
    return (
      <AppEmpty.Card
        title='Data payroll karyawan gagal dimuat'
        description={vm.error?.message || 'Terjadi kesalahan saat mengambil data payroll karyawan.'}
        action={
          <AppButton
            variant='outline'
            onClick={vm.reloadData}
            className='!rounded-lg'
          >
            Muat Ulang
          </AppButton>
        }
      />
    );
  }

  return (
    <div className='p-8'>
      <PayrollKaryawanHeader vm={vm} />

      {vm.focusedPeriode ? <PayrollKaryawanFocusedPeriodeSection vm={vm} /> : null}

      <PayrollKaryawanSummarySection vm={vm} />
      <PayrollKaryawanFilterSection vm={vm} />
      <PayrollKaryawanDataSection
        vm={vm}
        buildItemKomponenHref={buildItemKomponenHref}
      />

      <CreatePayrollKaryawanModal vm={vm} />
      <EditPayrollKaryawanModal vm={vm} />
      <DetailPayrollKaryawanModal
        vm={vm}
        buildItemKomponenHref={buildItemKomponenHref}
      />
      <DeletePayrollKaryawanDialog vm={vm} />
    </div>
  );
}
