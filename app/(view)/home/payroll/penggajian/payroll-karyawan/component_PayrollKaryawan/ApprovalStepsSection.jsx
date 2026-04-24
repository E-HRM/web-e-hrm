'use client';

import { DeleteOutlined, PlusOutlined } from '@ant-design/icons';

import AppButton from '@/app/(view)/component_shared/AppButton';
import AppSelect from '@/app/(view)/component_shared/AppSelect';
import AppTypography from '@/app/(view)/component_shared/AppTypography';

function ApprovalStepCard({ vm, step, index, disabled = false, removable = false }) {
  const approver = vm.getApproverById(step?.approver_user_id);
  const helperText = approver ? `Peran penyetuju: ${vm.formatApproverRole(approver.role)}${approver.email ? ` • ${approver.email}` : ''}` : 'Pilih penyetuju untuk penggajian ini.';

  return (
    <div className='rounded-2xl border border-gray-200 bg-white p-4'>
      <div className='flex items-start justify-between gap-3'>
        <div className='flex-1'>
          <AppSelect
            label={`Penyetuju ${index + 1}`}
            required
            value={step?.approver_user_id || undefined}
            onChange={(value) => vm.updateApprovalStep(step.client_key, value)}
            options={vm.approverOptions}
            placeholder='Pilih penyetuju'
            allowClear
            filterOption={vm.filterApproverOption}
            optionFilterProp='searchText'
            optionLabelProp='plainLabel'
            selectClassName='!rounded-lg'
            hint={index === 0 ? vm.approverSelectionHint : undefined}
            disabled={disabled}
          />
        </div>

        {removable ? (
          <AppButton
            variant='text'
            icon={<DeleteOutlined />}
            onClick={() => vm.removeApprovalStep(step.client_key)}
            className='!mt-6 !text-red-600 hover:!text-red-700'
            disabled={disabled}
          />
        ) : null}
      </div>

      <AppTypography.Text
        size={12}
        className='mt-2 block text-gray-500'
      >
        {helperText}
      </AppTypography.Text>
    </div>
  );
}

export default function ApprovalStepsSection({ vm, disabled = false }) {
  const approvalSteps = Array.isArray(vm.formData.approval_steps) ? vm.formData.approval_steps : [];

  return (
    <div className='space-y-4 rounded-2xl border border-gray-200 bg-gray-50 p-4'>
      <div className='flex flex-col gap-2 md:flex-row md:items-start md:justify-between'>
        <div>
          <AppTypography.Text
            size={13}
            weight={700}
            className='block text-gray-900'
          >
            Persetujuan Penggajian Karyawan
          </AppTypography.Text>

          <AppTypography.Text
            size={12}
            className='mt-1 block leading-5 text-gray-500'
          >
            Pilih satu penyetuju untuk alur sederhana. Tambahkan penyetuju lain bila penggajian perlu diperiksa lebih dari satu pihak.
          </AppTypography.Text>
        </div>

        <AppButton
          variant='outline'
          icon={<PlusOutlined />}
          onClick={vm.addApprovalStep}
          className='!rounded-lg !h-10'
          disabled={disabled}
        >
          Tambah Penyetuju
        </AppButton>
      </div>

      <div className='space-y-3'>
        {approvalSteps.map((step, index) => (
          <ApprovalStepCard
            key={step.client_key}
            vm={vm}
            step={step}
            index={index}
            disabled={disabled}
            removable={approvalSteps.length > 1}
          />
        ))}
      </div>
    </div>
  );
}
