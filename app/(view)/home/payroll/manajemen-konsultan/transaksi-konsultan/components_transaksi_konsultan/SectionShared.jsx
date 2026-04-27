import { CheckCircleOutlined, ClockCircleOutlined } from '@ant-design/icons';

import AppCard from '@/app/(view)/component_shared/AppCard';
import AppTag from '@/app/(view)/component_shared/AppTag';
import AppTypography from '@/app/(view)/component_shared/AppTypography';

export function SummaryCard({ icon, iconWrapClassName, iconClassName, value, label }) {
  return (
    <AppCard
      rounded='xl'
      ring={false}
      shadow='none'
      className='border border-gray-200'
      bodyStyle={{ padding: 24 }}
    >
      <div className='flex items-center justify-between mb-4'>
        <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${iconWrapClassName}`}>
          <span className={iconClassName}>{icon}</span>
        </div>
      </div>

      <AppTypography.Text
        size={24}
        weight={700}
        className='block text-gray-900 mb-1'
      >
        {value}
      </AppTypography.Text>

      <AppTypography.Text
        size={14}
        className='text-gray-600'
      >
        {label}
      </AppTypography.Text>
    </AppCard>
  );
}

export function StatusTag({ posted }) {
  if (posted) {
    return (
      <AppTag
        tone='success'
        variant='soft'
        size='sm'
        icon={<CheckCircleOutlined />}
        className='!font-medium'
      >
        Sudah Masuk Payroll
      </AppTag>
    );
  }

  return (
    <AppTag
      tone='warning'
      variant='soft'
      size='sm'
      icon={<ClockCircleOutlined />}
      className='!font-medium'
    >
      Belum Masuk Payroll
    </AppTag>
  );
}

export function PeriodeStatusTag({ status, vm }) {
  const toneMap = {
    DRAFT: 'warning',
    DIREVIEW: 'info',
    DISETUJUI: 'success',
    TERKUNCI: 'danger',
  };

  return (
    <AppTag
      tone={toneMap[status] || 'default'}
      variant='soft'
      size='sm'
      className='!font-medium'
    >
      {vm.formatStatusPeriode(status)}
    </AppTag>
  );
}

export function ShareTag({ persenShare, overrideManual, vm }) {
  return (
    <div className='flex items-center justify-center gap-2'>
      <AppTag
        tone={overrideManual ? 'warning' : 'info'}
        variant='soft'
        size='sm'
        className='!font-medium'
      >
        {vm.formatDecimalPercent(persenShare)}%
      </AppTag>

      {overrideManual ? (
        <AppTypography.Text
          size={12}
          className='text-orange-600'
        >
          (Diatur Manual)
        </AppTypography.Text>
      ) : null}
    </div>
  );
}

export function StepItem({ number, children, tone = 'blue' }) {
  const palette =
    tone === 'purple'
      ? {
          wrap: 'bg-purple-200 text-purple-700',
          text: 'text-purple-800',
        }
      : {
          wrap: 'bg-blue-200 text-blue-700',
          text: 'text-blue-800',
        };

  return (
    <div className={`flex items-start gap-2 text-sm ${palette.text}`}>
      <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 font-semibold text-xs ${palette.wrap}`}>{number}</div>
      <div>{children}</div>
    </div>
  );
}
