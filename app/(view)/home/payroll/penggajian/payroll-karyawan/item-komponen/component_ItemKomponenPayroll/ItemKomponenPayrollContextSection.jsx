// app/(view)/home/payroll/payroll-karyawan/item-komponen/component_ItemKomponenPayroll/ItemKomponenPayrollContextSection.jsx
'use client';

import AppCard from '@/app/(view)/component_shared/AppCard';
import AppTag from '@/app/(view)/component_shared/AppTag';
import AppTypography from '@/app/(view)/component_shared/AppTypography';

function DetailField({ label, value, valueClassName = 'text-gray-900', valueSize = 14, weight = 600 }) {
  return (
    <div>
      <AppTypography.Text
        size={12}
        className='block text-gray-600 mb-1'
      >
        {label}
      </AppTypography.Text>

      <AppTypography.Text
        size={valueSize}
        weight={weight}
        className={`block ${valueClassName}`}
      >
        {value}
      </AppTypography.Text>
    </div>
  );
}

export default function ItemKomponenPayrollContextSection({ vm }) {
  const payrollTarifPajakLabel = vm.currentPayroll.kode_kategori_pajak_snapshot ? `${vm.currentPayroll.kode_kategori_pajak_snapshot}${vm.currentPayroll.persen_tarif_snapshot ? ` (${vm.currentPayroll.persen_tarif_snapshot}%)` : ''}` : '';

  return (
    <AppCard
      rounded='lg'
      ring={false}
      shadow='none'
      className='border border-gray-200'
      bodyStyle={{ padding: 24 }}
    >
      <div className='flex items-center justify-between gap-3 mb-5 flex-wrap'>
        <div>
          <AppTypography.Text
            size={16}
            weight={800}
            className='block text-gray-900'
          >
            Ringkasan Payroll Karyawan
          </AppTypography.Text>

          <AppTypography.Text
            size={13}
            className='text-gray-500'
          >
            Context payroll yang sedang dikelola oleh halaman item komponen.
          </AppTypography.Text>
        </div>

        <div className='flex items-center gap-2 flex-wrap'>
          {vm.currentPayroll.periode_status ? (
            <AppTag
              tone='neutral'
              variant='soft'
            >
              Periode: {vm.formatEnumLabel(vm.currentPayroll.periode_status)}
            </AppTag>
          ) : null}

          {payrollTarifPajakLabel ? (
            <AppTag
              tone='info'
              variant='soft'
            >
              Tarif TER: {payrollTarifPajakLabel}
            </AppTag>
          ) : null}
        </div>
      </div>

      <div className='grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5'>
        <DetailField
          label='Karyawan'
          value={vm.currentPayroll.nama_karyawan || '-'}
        />
        <DetailField
          label='Periode'
          value={vm.currentPayroll.periode_label || '-'}
        />
        <DetailField
          label='Departemen / Jabatan'
          value={`${vm.currentPayroll.departement || '-'} / ${vm.currentPayroll.jabatan || '-'}`}
        />
        <DetailField
          label='Hubungan Kerja'
          value={vm.formatEnumLabel(vm.currentPayroll.jenis_hubungan_kerja)}
        />
        <DetailField
          label='Bank'
          value={vm.currentPayroll.bank_name || '-'}
        />
        <DetailField
          label='No. Rekening'
          value={vm.currentPayroll.bank_account || '-'}
        />
        <DetailField
          label='Bruto Payroll'
          value={vm.formatCurrency(vm.currentPayroll.total_pendapatan_bruto)}
          valueClassName='text-blue-700'
        />
        <DetailField
          label='Pendapatan Bersih'
          value={vm.formatCurrency(vm.currentPayroll.pendapatan_bersih)}
          valueClassName='text-green-600'
        />
      </div>
    </AppCard>
  );
}
