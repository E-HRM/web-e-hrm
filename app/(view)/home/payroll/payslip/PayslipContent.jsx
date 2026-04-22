'use client';

import { ArrowLeftOutlined, FileTextOutlined, PrinterOutlined, ReloadOutlined } from '@ant-design/icons';

import AppButton from '@/app/(view)/component_shared/AppButton';
import AppCard from '@/app/(view)/component_shared/AppCard';
import AppEmpty from '@/app/(view)/component_shared/AppEmpty';
import AppTypography from '@/app/(view)/component_shared/AppTypography';

import usePayslipViewModel from './usePayslipViewModel';

const COMPANY_NAME = 'One Step Solution (OSS) Bali';

function SectionTitle({ children }) {
  return (
    <AppTypography.Text
      size={18}
      weight={800}
      className='block text-slate-950'
    >
      {children}
    </AppTypography.Text>
  );
}

function MetadataLine({ label, value }) {
  return (
    <div className='flex justify-end gap-2 text-right'>
      <AppTypography.Text
        size={14}
        italic
        className='text-slate-700'
      >
        {label}
      </AppTypography.Text>

      <AppTypography.Text
        size={14}
        italic
        className='text-slate-700'
      >
        :
      </AppTypography.Text>

      <AppTypography.Text
        size={14}
        italic
        className='text-slate-700'
      >
        {value || '-'}
      </AppTypography.Text>
    </div>
  );
}

function BlueLabelTable({ rows = [], labelWidth = '220px', valueAlign = 'left' }) {
  return (
    <div className='overflow-x-auto'>
      <table className='w-full border-collapse border border-slate-700'>
        <tbody>
          {rows.map((row) => (
            <tr key={row.label}>
              <td
                className='border border-slate-700 bg-[#c8d7ee] px-3 py-3 align-middle'
                style={{ width: labelWidth }}
              >
                <AppTypography.Text
                  size={14}
                  className='text-slate-950'
                >
                  {row.label}
                </AppTypography.Text>
              </td>

              <td className={`border border-slate-700 px-3 py-3 align-middle ${valueAlign === 'right' ? 'text-right' : 'text-left'}`}>
                <AppTypography.Text
                  size={14}
                  className='text-slate-950'
                >
                  {row.value || '-'}
                </AppTypography.Text>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function DetailTable({ rows = [], typeWidth = '220px', labelWidth = '260px' }) {
  const hasTypeColumn = rows.some((row) => row.type);
  let lastMergedTypeId = null;
  let lastMergedTypeIndex = -1;

  const preparedRows = [];

  rows.forEach((row) => {
    const preparedRow = {
      ...row,
      shouldRenderTypeCell: false,
      typeRowSpan: 1,
      labelColSpan: hasTypeColumn && !row.type ? 2 : 1,
    };

    if (!hasTypeColumn || !row.type) {
      lastMergedTypeId = null;
      lastMergedTypeIndex = -1;
      preparedRows.push(preparedRow);
      return;
    }

    if (row.typeId && row.typeId === lastMergedTypeId && lastMergedTypeIndex >= 0) {
      preparedRows[lastMergedTypeIndex].typeRowSpan += 1;
      lastMergedTypeId = row.typeId;
      preparedRows.push(preparedRow);
      return;
    }

    preparedRow.shouldRenderTypeCell = true;
    lastMergedTypeId = row.typeId || null;
    lastMergedTypeIndex = preparedRows.length;
    preparedRows.push(preparedRow);
  });

  return (
    <div className='overflow-x-auto'>
      <table className='w-full border-collapse border border-slate-700'>
        <tbody>
          {preparedRows.map((row, index) => (
            <tr key={`${row.type || 'detail'}-${row.label}-${index}`}>
              {row.shouldRenderTypeCell ? (
                <td
                  className='border border-slate-700 bg-[#c8d7ee] px-3 py-3 align-middle'
                  style={{ width: typeWidth }}
                  rowSpan={row.typeRowSpan}
                >
                  <AppTypography.Text
                    size={14}
                    className='text-slate-950'
                  >
                    {row.type}
                  </AppTypography.Text>
                </td>
              ) : null}

              <td
                className='border border-slate-700 bg-[#c8d7ee] px-3 py-3 align-middle'
                style={{ width: labelWidth }}
                colSpan={row.labelColSpan}
              >
                <AppTypography.Text
                  size={14}
                  className='text-slate-950'
                >
                  {row.label || '-'}
                </AppTypography.Text>
              </td>

              <td className='border border-slate-700 px-3 py-3 text-right align-middle'>
                <AppTypography.Text
                  size={14}
                  className='text-slate-950'
                >
                  {row.value || '-'}
                </AppTypography.Text>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function buildDetailItems(groups = []) {
  return groups.flatMap((group) =>
    (Array.isArray(group?.items) ? group.items : []).map((item) => ({
      ...item,
      sign: group?.key === 'POTONGAN' ? '-' : '',
    })),
  );
}

function resolveDetailTypeLabel(item) {
  return item?.definisi_komponen?.tipe_komponen?.nama_tipe_komponen || item?.tipe_komponen_label || item?.tipe_komponen || '';
}

function resolveDetailTypeId(item) {
  return item?.definisi_komponen?.tipe_komponen?.id_tipe_komponen_payroll || '';
}

function normalizeDetailIdentity(value) {
  return String(value || '')
    .trim()
    .toLowerCase();
}

function isSnapshotBackedDetail(item, snapshotKey) {
  const itemName = normalizeDetailIdentity(item?.nama_komponen);
  const itemType = String(resolveDetailTypeLabel(item) || '')
    .trim()
    .toUpperCase();

  if (snapshotKey === 'gaji_pokok') {
    return itemType === 'GAJI_POKOK' || itemName.includes('gaji pokok');
  }

  if (snapshotKey === 'pph21') {
    return itemName.includes('pph 21') || itemName.includes('pph21');
  }

  return false;
}

function ApprovalTable({ slip, vm }) {
  const allSteps = Array.isArray(slip?.approval?.steps) ? slip.approval.steps : [];
  const approvedSteps = Array.isArray(slip?.approval?.approved_steps) ? slip.approval.approved_steps : [];
  const stepsToDisplay = (approvedSteps.length > 0 ? approvedSteps : allSteps).filter(Boolean);
  const columns = Array.from(
    new Map(
      stepsToDisplay.map((step) => [
        String(step?.id_approval_payroll_karyawan || step?.level || step?.approver_user_id || ''),
        step,
      ]),
    ).values(),
  );

  const normalizedColumns =
    columns.length > 0
      ? columns.map((step) => ({
          title: step?.approver_role ? `Approve By ${vm.formatApproverRole(step.approver_role)}` : `Approval Level ${step?.level || '-'}`,
          step,
        }))
      : [
          {
            title: 'Approval',
            step: null,
          },
        ];

  return (
    <div className='overflow-hidden rounded-[4px] border border-slate-300 payslip-section-block'>
      <div
        className='grid border-b border-slate-300'
        style={{ gridTemplateColumns: `repeat(${normalizedColumns.length}, minmax(0, 1fr))` }}
      >
        {normalizedColumns.map((column) => (
          <div
            key={column.title}
            className='border-r border-slate-300 px-4 py-3 last:border-r-0'
          >
            <AppTypography.Text
              size={14}
              weight={700}
              className='block text-center text-slate-900'
            >
              {column.title}
            </AppTypography.Text>
          </div>
        ))}
      </div>

      <div
        className='grid'
        style={{ gridTemplateColumns: `repeat(${normalizedColumns.length}, minmax(0, 1fr))` }}
      >
        {normalizedColumns.map((column) => {
          const approverName = column.step?.approver_nama_snapshot || column.step?.approver?.nama_pengguna || '-';

          return (
            <div
              key={column.title}
              className='border-r border-slate-300 px-4 py-4 last:border-r-0'
            >
              <div className='flex h-[88px] items-center justify-center'>
                {column.step?.ttd_approval_url ? (
                  <img
                    src={column.step.ttd_approval_url}
                    alt={approverName}
                    className='max-h-[72px] max-w-[180px] object-contain'
                  />
                ) : (
                  <AppTypography.Text
                    size={13}
                    className='text-slate-500'
                  >
                    [Tanda tangan]
                  </AppTypography.Text>
                )}
              </div>

              <AppTypography.Text
                size={14}
                className='block text-center text-slate-700'
              >
                {approverName}
              </AppTypography.Text>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function PayslipDocument({ slip, vm }) {
  const detailItems = buildDetailItems(slip?.groups);
  const gajiPokokSnapshot = Number(slip?.payroll?.gaji_pokok_snapshot || 0);
  const pph21Nominal = Number(slip?.summary?.pph21_nominal ?? slip?.payroll?.pph21_nominal ?? 0);

  const snapshotRows = [
    ...(gajiPokokSnapshot > 0
      ? [
          {
            snapshotKey: 'gaji_pokok',
            label: 'Gaji Pokok',
            value: vm.formatCurrency(gajiPokokSnapshot),
          },
        ]
      : []),
    ...(pph21Nominal > 0
      ? [
          {
            snapshotKey: 'pph21',
            label: 'PPh 21',
            value: `-${vm.formatCurrency(pph21Nominal)}`,
          },
        ]
      : []),
  ];

  const filteredDetailItems = detailItems.filter(
    (item) => !snapshotRows.some((row) => isSnapshotBackedDetail(item, row.snapshotKey)),
  );

  const detailRows =
    snapshotRows.length > 0 || filteredDetailItems.length > 0
      ? [
          ...snapshotRows,
          ...filteredDetailItems.map((item) => ({
            typeId: resolveDetailTypeId(item),
            type: resolveDetailTypeLabel(item),
            label: item.nama_komponen || '-',
            value: `${item.sign}${vm.formatCurrency(item.nominal_number)}`,
          })),
        ]
      : [
          {
            label: 'Detail Komponen',
            value: 'Tidak ada detail komponen payroll.',
          },
        ];

  const summaryRows = [
    {
      label: 'Total Pendapatan',
      value: vm.formatCurrency(slip?.summary?.total_pendapatan_bruto),
    },
    {
      label: 'Total Potongan',
      value: vm.formatCurrency(slip?.summary?.total_potongan),
    },
    {
      label: 'Take Home Pay',
      value: vm.formatCurrency(slip?.summary?.pendapatan_bersih),
    },
  ];

  const termRows = [
    {
      label: 'Periode',
      value: vm.formatPeriodeLabel(slip?.period),
    },
    {
      label: 'Note',
      value: slip?.payroll?.catatan || '-',
    },
  ];

  return (
    <div className='payslip-sheet bg-white'>
      <div className='px-8 py-10 md:px-12'>
        <div className='mb-8 flex justify-end payslip-section-block'>
          <div className='space-y-1'>
            <MetadataLine
              label='Date of Issue'
              value={vm.formatDate(slip?.document?.issued_at)}
            />
            <MetadataLine
              label='Company Issue'
              value={COMPANY_NAME}
            />
            <MetadataLine
              label='Number of Issue'
              value={slip?.document?.issue_number || '-'}
            />
          </div>
        </div>

        <div className='mb-8 text-center payslip-section-block'>
          <AppTypography.Text
            size={22}
            weight={800}
            underline
            className='block text-slate-950'
          >
            {COMPANY_NAME}
          </AppTypography.Text>

          <AppTypography.Text
            size={18}
            weight={800}
            className='mt-3 block text-slate-950'
          >
            PAYSLIP STATEMENT
          </AppTypography.Text>
        </div>

        <div className='mb-8 border-t border-slate-300 payslip-section-block' />

        <div className='mb-8 space-y-4 payslip-section-block'>
          <SectionTitle>Biodata :</SectionTitle>

          <BlueLabelTable
            labelWidth='220px'
            valueAlign='left'
            rows={[
              {
                label: 'Name',
                value: slip?.employee?.nama_karyawan,
              },
              {
                label: 'Position',
                value: slip?.employee?.nama_jabatan,
              },
              {
                label: 'Department',
                value: slip?.employee?.nama_departement,
              },
              {
                label: 'Employee Status',
                value: vm.formatJenisHubungan(slip?.employee?.jenis_hubungan_kerja),
              },
            ]}
          />
        </div>

        <div className='mb-8 space-y-4 payslip-section-block'>
          <SectionTitle>Detail :</SectionTitle>

          <DetailTable
            labelWidth='260px'
            rows={detailRows}
          />
        </div>

        <div className='mb-8 space-y-4 payslip-section-block'>
          <SectionTitle>Summary :</SectionTitle>

          <BlueLabelTable
            labelWidth='260px'
            valueAlign='right'
            rows={summaryRows}
          />
        </div>

        <div className='mb-8 space-y-4 payslip-section-block'>
          <SectionTitle>TERM :</SectionTitle>

          <BlueLabelTable
            labelWidth='220px'
            valueAlign='left'
            rows={termRows}
          />
        </div>

        <div className='payslip-section-block'>
          <ApprovalTable
            slip={slip}
            vm={vm}
          />
        </div>
      </div>
    </div>
  );
}

export default function PayslipContent() {
  const vm = usePayslipViewModel();

  if (!vm.hasFilters) {
    return (
      <div className='p-6 md:p-8'>
        <AppEmpty.Card
          title='Slip payroll belum dipilih'
          description='Buka halaman ini dari daftar payroll karyawan atau dari periode payroll agar slip yang ingin dicetak bisa diketahui.'
          action={
            <AppButton
              variant='outline'
              href='/home/payroll/penggajian/payroll-karyawan'
              className='!rounded-lg'
            >
              Buka Payroll Karyawan
            </AppButton>
          }
        />
      </div>
    );
  }

  return (
    <div className='min-h-screen bg-slate-100 p-6 md:p-8 payslip-shell'>
      <div className='mb-6 flex flex-col gap-4 md:flex-row md:items-start md:justify-between payslip-no-print'>
        <div>
          <AppTypography.Title
            level={2}
            className='!mb-1 !text-slate-900'
          >
            Payslip Payroll
          </AppTypography.Title>

          <AppTypography.Text
            size={15}
            className='text-slate-600'
          >
            Preview slip A4 yang dipakai sebagai sumber export PDF payroll karyawan.
          </AppTypography.Text>
        </div>

        <div className='flex flex-wrap items-center gap-3'>
          <AppButton
            variant='outline'
            href={vm.backHref}
            icon={<ArrowLeftOutlined />}
            className='!rounded-lg'
          >
            Kembali
          </AppButton>

          <AppButton
            variant='outline'
            onClick={vm.reloadData}
            loading={vm.validating}
            icon={<ReloadOutlined />}
            className='!rounded-lg'
          >
            Muat Ulang
          </AppButton>

          {vm.slip ? (
            <AppButton
              variant='outline'
              href={vm.buildItemKomponenHref(vm.slip.payroll)}
              icon={<FileTextOutlined />}
              className='!rounded-lg'
            >
              Item Komponen
            </AppButton>
          ) : null}

          <AppButton
            onClick={vm.handlePrint}
            icon={<PrinterOutlined />}
            className='!rounded-lg'
          >
            Cetak / PDF
          </AppButton>
        </div>
      </div>

      <div className={`grid grid-cols-1 gap-6 ${vm.payrollList.length > 0 ? 'xl:grid-cols-[320px_minmax(0,1fr)]' : ''}`}>
        {vm.payrollList.length > 0 ? (
          <AppCard
            rounded='xl'
            ring={false}
            shadow='none'
            className='border border-slate-200 payslip-no-print'
            bodyStyle={{ padding: 0 }}
          >
            <div className='border-b border-slate-200 px-5 py-4'>
              <AppTypography.Text
                size={15}
                weight={800}
                className='block text-slate-900'
              >
                Slip Per Periode
              </AppTypography.Text>

              <AppTypography.Text
                size={12}
                className='mt-1 block text-slate-500'
              >
                Pilih payroll untuk melihat preview slip dan melakukan export PDF.
              </AppTypography.Text>
            </div>

            <div className='divide-y divide-slate-100'>
              {vm.payrollList.map((item) => {
                const isActive = vm.activePayrollId === item.id_payroll_karyawan;

                return (
                  <button
                    key={item.id_payroll_karyawan}
                    type='button'
                    onClick={() => vm.selectPayroll(item.id_payroll_karyawan)}
                    className={`w-full px-5 py-4 text-left transition ${isActive ? 'bg-[#EDF5FF]' : 'bg-white hover:bg-slate-50'}`}
                  >
                    <AppTypography.Text
                      size={14}
                      weight={800}
                      className='block truncate text-slate-900'
                    >
                      {item.nama_karyawan}
                    </AppTypography.Text>

                    <AppTypography.Text
                      size={12}
                      className='mt-1 block text-slate-500'
                    >
                      {item.period_label}
                    </AppTypography.Text>

                    <AppTypography.Text
                      size={12}
                      className='mt-1 block text-slate-400'
                    >
                      {item.issue_number || 'Nomor slip belum tersedia'}
                    </AppTypography.Text>
                  </button>
                );
              })}
            </div>
          </AppCard>
        ) : null}

        <div className='min-w-0'>
          {vm.loading && !vm.slip ? (
            <AppCard
              rounded='xl'
              ring={false}
              shadow='none'
              className='border border-slate-200'
              bodyStyle={{ padding: 24 }}
            >
              <AppTypography.Text
                size={14}
                className='text-slate-600'
              >
                Menyiapkan slip payroll...
              </AppTypography.Text>
            </AppCard>
          ) : vm.slip ? (
            <PayslipDocument
              slip={vm.slip}
              vm={vm}
            />
          ) : (
            <AppEmpty.Card
              title='Slip payroll tidak tersedia'
              description='Data slip untuk payroll yang dipilih belum bisa ditampilkan.'
            />
          )}
        </div>
      </div>

      <style
        jsx
        global
      >{`
        .payslip-sheet {
          width: 100%;
          max-width: 210mm;
          margin-inline: auto;
          border: 1px solid rgb(203 213 225);
          box-shadow: 0 12px 30px rgba(15, 23, 42, 0.08);
        }

        @media print {
          html,
          body {
            background: #ffffff !important;
          }

          body {
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }

          .payslip-no-print,
          .ant-layout-sider,
          .ant-layout-header {
            display: none !important;
          }

          .payslip-shell {
            padding: 0 !important;
            background: #ffffff !important;
          }

          .payslip-sheet {
            max-width: 210mm !important;
            width: 210mm !important;
            min-height: 297mm;
            margin: 0 auto !important;
            border: 0 !important;
            box-shadow: none !important;
          }

          .payslip-section-block {
            break-inside: avoid;
            page-break-inside: avoid;
          }
        }
      `}</style>
    </div>
  );
}
