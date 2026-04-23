import { CheckCircleOutlined, DeleteOutlined, EditOutlined, ExclamationCircleOutlined, FileTextOutlined, InfoCircleOutlined, RollbackOutlined } from '@ant-design/icons';

import AppButton from '@/app/(view)/component_shared/AppButton';
import AppCard from '@/app/(view)/component_shared/AppCard';
import AppEmpty from '@/app/(view)/component_shared/AppEmpty';
import AppTag from '@/app/(view)/component_shared/AppTag';
import AppTypography from '@/app/(view)/component_shared/AppTypography';

import { STATUS_PAYOUT_KONSULTAN, getInitials } from '../data/payoutKonsultanShared';

function getStatusMeta(status) {
  const statusMap = {
    [STATUS_PAYOUT_KONSULTAN.DRAFT]: {
      label: 'Draft',
      icon: <FileTextOutlined />,
      tone: 'neutral',
      className: '!text-gray-700',
    },
    [STATUS_PAYOUT_KONSULTAN.DISETUJUI]: {
      label: 'Disetujui',
      icon: <CheckCircleOutlined />,
      tone: 'info',
      className: '!text-blue-700',
    },
    [STATUS_PAYOUT_KONSULTAN.DIPOSTING_KE_PAYROLL]: {
      label: 'Diposting ke Payroll',
      icon: <CheckCircleOutlined />,
      tone: 'success',
      className: '!text-green-700',
    },
    [STATUS_PAYOUT_KONSULTAN.DITAHAN]: {
      label: 'Ditahan',
      icon: <ExclamationCircleOutlined />,
      tone: 'danger',
      className: '!text-red-700',
    },
  };

  return statusMap[status] || statusMap[STATUS_PAYOUT_KONSULTAN.DRAFT];
}

function PayoutKonsultanListCard({
  payout,
  pendingActionId,
  formatCurrency,
  formatDate,
  onApprovePayout,
  onEditPayout,
  onDeletePayout,
  onPostToPayroll,
  onUnpostPayout,
  onHoldPayment,
  onReleaseHold,
}) {
  const statusMeta = getStatusMeta(payout.status_payout);
  const isRowLoading = pendingActionId === payout.id_payout_konsultan;

  return (
    <AppCard
      rounded='xl'
      ring={false}
      shadow='none'
      className='border border-gray-200 hover:shadow-md transition-shadow'
      bodyStyle={{ padding: 24 }}
    >
      <div className='flex items-start justify-between gap-6 flex-wrap xl:flex-nowrap'>
        <div className='flex items-start gap-4 flex-1 min-w-0'>
          <div className='w-14 h-14 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center text-white font-bold text-xl shrink-0'>
            {getInitials(payout.user_display_name)}
          </div>

          <div className='flex-1 min-w-0'>
            <div className='flex items-center gap-3 mb-1 flex-wrap'>
              <AppTypography.Text
                size={18}
                weight={700}
                className='text-gray-900'
              >
                {payout.user_display_name || payout.id_user}
              </AppTypography.Text>

              <AppTag
                tone={statusMeta.tone}
                variant='soft'
                size='sm'
                className='!font-medium'
              >
                <span className='inline-flex items-center gap-1'>
                  {statusMeta.icon}
                  <span className={statusMeta.className}>{statusMeta.label}</span>
                </span>
              </AppTag>
            </div>

            <AppTypography.Text
              size={13}
              className='block text-gray-500 mb-4'
            >
              {payout.user_identity || payout.id_user}
            </AppTypography.Text>

            <div className='grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 mb-4'>
              <div>
                <AppTypography.Text
                  size={12}
                  className='block text-gray-500 mb-1'
                >
                  Periode Konsultan
                </AppTypography.Text>

                <AppTypography.Text
                  size={14}
                  weight={600}
                  className='text-gray-900'
                >
                  {payout.periode_label}
                </AppTypography.Text>
              </div>

              <div>
                <AppTypography.Text
                  size={12}
                  className='block text-gray-500 mb-1'
                >
                  Jumlah Transaksi
                </AppTypography.Text>

                <AppTypography.Text
                  size={14}
                  weight={600}
                  className='text-gray-900'
                >
                  {payout.transaksiCount} transaksi
                </AppTypography.Text>
              </div>

              {payout.id_periode_payroll ? (
                <div>
                  <AppTypography.Text
                    size={12}
                    className='block text-gray-500 mb-1'
                  >
                    Periode Payroll
                  </AppTypography.Text>

                  <AppTypography.Text
                    size={14}
                    weight={600}
                    className='text-gray-900'
                  >
                    {payout.payroll_periode_label}
                  </AppTypography.Text>
                </div>
              ) : null}

              {payout.disetujui_pada ? (
                <div>
                  <AppTypography.Text
                    size={12}
                    className='block text-gray-500 mb-1'
                  >
                    Disetujui Pada
                  </AppTypography.Text>

                  <AppTypography.Text
                    size={14}
                    weight={600}
                    className='text-gray-900'
                  >
                    {formatDate(payout.disetujui_pada)}
                  </AppTypography.Text>
                </div>
              ) : null}

              {payout.diposting_pada ? (
                <div>
                  <AppTypography.Text
                    size={12}
                    className='block text-gray-500 mb-1'
                  >
                    Diposting Pada
                  </AppTypography.Text>

                  <AppTypography.Text
                    size={14}
                    weight={600}
                    className='text-gray-900'
                  >
                    {formatDate(payout.diposting_pada)}
                  </AppTypography.Text>
                </div>
              ) : null}
            </div>

            <div className='bg-gray-50 rounded-lg p-4'>
              <div className='grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4'>
                <div>
                  <AppTypography.Text
                    size={12}
                    className='block text-gray-600 mb-1'
                  >
                    Total Share
                  </AppTypography.Text>

                  <AppTypography.Text
                    size={20}
                    weight={800}
                    className='text-blue-600'
                  >
                    {formatCurrency(payout.total_share)}
                  </AppTypography.Text>
                </div>

                <div>
                  <AppTypography.Text
                    size={12}
                    className='block text-gray-600 mb-1'
                  >
                    Ditahan
                  </AppTypography.Text>

                  <AppTypography.Text
                    size={20}
                    weight={800}
                    className='text-red-600'
                  >
                    {toNumber(payout.nominal_ditahan) > 0 ? `(${formatCurrency(payout.nominal_ditahan)})` : '-'}
                  </AppTypography.Text>
                </div>

                <div>
                  <AppTypography.Text
                    size={12}
                    className='block text-gray-600 mb-1'
                  >
                    Total Dibayarkan
                  </AppTypography.Text>

                  <AppTypography.Text
                    size={20}
                    weight={800}
                    className='text-green-600'
                  >
                    {formatCurrency(payout.nominal_dibayarkan)}
                  </AppTypography.Text>
                </div>
              </div>
            </div>

            {payout.catatan ? (
              <div className='mt-3 flex items-start gap-2'>
                <InfoCircleOutlined className='text-blue-600 mt-0.5' />

                <AppTypography.Text
                  size={14}
                  className='text-gray-600 italic'
                >
                  {payout.catatan}
                </AppTypography.Text>
              </div>
            ) : null}
          </div>
        </div>

        <div className='flex flex-col gap-2 w-full xl:w-auto xl:min-w-[220px]'>
          {payout.status_payout === STATUS_PAYOUT_KONSULTAN.DRAFT ? (
            <>
              <AppButton
                onClick={() => onApprovePayout(payout)}
                loading={isRowLoading}
                className='!rounded-lg !h-10 !bg-blue-600 hover:!bg-blue-700 !border-blue-600 hover:!border-blue-700 !text-white'
              >
                Setujui Payout
              </AppButton>

              <AppButton
                variant='outline'
                icon={<EditOutlined />}
                onClick={() => onEditPayout(payout)}
                disabled={isRowLoading}
                className='!rounded-lg !h-10'
              >
                Edit Detail
              </AppButton>

              <AppButton
                variant='danger'
                icon={<DeleteOutlined />}
                onClick={() => onDeletePayout(payout)}
                disabled={isRowLoading}
                className='!rounded-lg !h-10'
              >
                Hapus Payout
              </AppButton>
            </>
          ) : null}

          {payout.status_payout === STATUS_PAYOUT_KONSULTAN.DISETUJUI ? (
            <>
              <AppButton
                onClick={() => onPostToPayroll(payout)}
                disabled={isRowLoading}
                className='!rounded-lg !h-10 !bg-green-600 hover:!bg-green-700 !border-green-600 hover:!border-green-700 !text-white'
              >
                Posting ke Payroll
              </AppButton>

              <AppButton
                variant='danger'
                onClick={() => onHoldPayment(payout)}
                loading={isRowLoading}
                className='!rounded-lg !h-10'
              >
                Tahan Pembayaran
              </AppButton>
            </>
          ) : null}

          {payout.status_payout === STATUS_PAYOUT_KONSULTAN.DIPOSTING_KE_PAYROLL && payout.id_periode_payroll ? (
            <>
              <AppButton
                variant='outline'
                icon={<RollbackOutlined />}
                onClick={() => onUnpostPayout(payout)}
                disabled={isRowLoading || !payout?.business_state?.bisa_lepas_posting}
                className='!rounded-lg !h-10'
              >
                Lepas Posting
              </AppButton>

              <AppButton
                variant='outline'
                disabled
                className='!rounded-lg !h-10'
              >
                Sudah Diposting
              </AppButton>
            </>
          ) : null}

          {payout.status_payout === STATUS_PAYOUT_KONSULTAN.DITAHAN ? (
            <>
              <AppButton
                onClick={() => onReleaseHold(payout)}
                loading={isRowLoading}
                className='!rounded-lg !h-10 !bg-orange-600 hover:!bg-orange-700 !border-orange-600 hover:!border-orange-700 !text-white'
              >
                Lepas Penahanan
              </AppButton>

              <AppButton
                variant='outline'
                icon={<EditOutlined />}
                onClick={() => onEditPayout(payout)}
                disabled={isRowLoading}
                className='!rounded-lg !h-10'
              >
                Edit Detail
              </AppButton>

              <AppButton
                variant='danger'
                icon={<DeleteOutlined />}
                onClick={() => onDeletePayout(payout)}
                disabled={isRowLoading}
                className='!rounded-lg !h-10'
              >
                Hapus Payout
              </AppButton>
            </>
          ) : null}
        </div>
      </div>

    </AppCard>
  );
}

export default function PayoutKonsultanListSection({ payoutWithMeta, loading = false, ...props }) {
  if (loading && payoutWithMeta.length === 0) {
    return (
      <AppEmpty.Card
        title='Memuat payout konsultan'
        description='Sedang mengambil data payout dan detail transaksi dari backend.'
      />
    );
  }

  if (payoutWithMeta.length === 0) {
    return (
      <AppEmpty.Card
        title='Belum ada payout konsultan'
        description='Buat payout baru untuk mulai memproses pembayaran share konsultan.'
      />
    );
  }

  return (
    <div className='space-y-4'>
      {payoutWithMeta.map((payout) => (
        <PayoutKonsultanListCard
          key={payout.id_payout_konsultan}
          payout={payout}
          {...props}
        />
      ))}
    </div>
  );
}

function toNumber(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}
