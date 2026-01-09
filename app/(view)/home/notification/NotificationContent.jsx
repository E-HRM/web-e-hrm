'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { BellOutlined, CheckCircleOutlined, ExclamationCircleOutlined, ClockCircleOutlined } from '@ant-design/icons';
import AppGrid from '@/app/(view)/component_shared/AppGrid';
import AppDropdown from '@/app/(view)/component_shared/AppDropdown';
import AppButton from '@/app/(view)/component_shared/AppButton';
import AppBadge from '@/app/(view)/component_shared/AppBadge';
import AppTabs from '@/app/(view)/component_shared/AppTabs';
import AppEmpty from '@/app/(view)/component_shared/AppEmpty';
import AppSpin from '@/app/(view)/component_shared/AppSpin';
import AppAlert from '@/app/(view)/component_shared/AppAlert';
import AppTypography from '@/app/(view)/component_shared/AppTypography';

import useNotificationViewModel from './useNotificationViewModel';

function renderTypeIcon(type) {
  if (type === 'absensi') return <CheckCircleOutlined />;
  if (type === 'shift') return <ExclamationCircleOutlined />;
  return <ClockCircleOutlined />;
}

function getTypeFor(it) {
  const tbl = it?.related_table;
  if (!tbl) return 'info';
  if (tbl === 'pengajuan_cuti') return 'absensi';
  if (tbl === 'izin_tukar_hari') return 'shift';
  if (tbl === 'pengajuan_izin_sakit') return 'info';
  if (tbl === 'pengajuan_izin_jam') return 'info';
  return 'info';
}

function buildTargetUrl(it) {
  const deeplink = it?.deeplink;
  const table = it?.related_table;
  const id = it?.related_id;

  if (deeplink && typeof deeplink === 'string') return deeplink;
  if (!table || !id) return null;

  if (table === 'pengajuan_cuti') return '/home/pengajuan/cuti';
  if (table === 'pengajuan_izin_jam') return '/home/pengajuan/izinJam';
  if (table === 'pengajuan_izin_sakit') return '/home/pengajuan/sakit';
  if (table === 'izin_tukar_hari') return '/home/pengajuan/tukarHari';

  return null;
}

export default function NotificationContent() {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  const { filteredItems, unreadCount, activeTabKey, setActiveTabKey, markAllRead, markOneRead, formatRelativeTime, isLoading, apiError } = useNotificationViewModel();

  const handleGo = (url) => {
    if (!url) return;
    if (typeof url === 'string' && /^https?:\/\//i.test(url)) {
      window.location.href = url;
      return;
    }
    router.push(url);
  };

  const renderItem = (it) => {
    const key = it?.id_notification || it?.id;
    const read = it?.status === 'read';
    const type = getTypeFor(it);
    const desc = it?.body || it?.desc || '';
    const timeVal = it?.created_at || it?.time;
    const targetUrl = buildTargetUrl(it);

    const handleClick = async () => {
      try {
        await markOneRead(key);
      } finally {
        setOpen(false);
        if (targetUrl) handleGo(targetUrl);
      }
    };

    return (
      <button
        key={key}
        type='button'
        onClick={handleClick}
        className={`w-full text-left px-3 py-2 rounded-xl transition ${read ? 'bg-white hover:bg-slate-50' : 'bg-amber-50 hover:bg-amber-100'}`}
      >
        <div className='flex items-start gap-3'>
          <div className={`mt-1 inline-flex h-7 w-7 items-center justify-center rounded-full ${type === 'absensi' ? 'bg-emerald-100 text-emerald-700' : type === 'shift' ? 'bg-sky-100 text-sky-700' : 'bg-slate-100 text-slate-700'}`}>
            {renderTypeIcon(type)}
          </div>

          <div className='min-w-0'>
            <div className='font-medium text-slate-800 line-clamp-1'>{it?.title}</div>
            <div className='text-xs text-slate-600 line-clamp-2'>{desc}</div>
            <div className='text-[11px] text-slate-400 mt-1'>{timeVal ? formatRelativeTime(timeVal) : ''}</div>
          </div>

          {!read ? <span className='ml-auto mt-1 inline-block h-2 w-2 rounded-full bg-red-500' /> : null}
        </div>
      </button>
    );
  };

  const dropdownWithTabs = (
    <div
      className='rounded-2xl border border-slate-200 bg-white shadow-xl'
      style={{ width: 360, overflow: 'hidden' }}
    >
      <div className='px-4 py-3 border-b border-slate-200 flex items-center justify-between bg-white/60 backdrop-blur'>
        <div>
          <AppGrid.Row gutter={[0, 0]}>
            <AppGrid.Col span={24}>
              <div>
                <AppTypography.Text
                  size={14}
                  weight={800}
                  className='text-slate-800'
                >
                  Notifikasi
                </AppTypography.Text>
              </div>

              <div>
                <AppTypography.Text
                  size={12}
                  tone='muted'
                  className='text-slate-500'
                >
                  {unreadCount} belum dibaca
                </AppTypography.Text>
              </div>
            </AppGrid.Col>
          </AppGrid.Row>
        </div>

        <AppButton
          size='small'
          variant='outline'
          onClick={async () => {
            await markAllRead();
          }}
        >
          Tandai semua dibaca
        </AppButton>
      </div>

      <div className='px-2 pt-2'>
        <AppTabs
          size='small'
          activeKey={activeTabKey}
          onChange={setActiveTabKey}
          destroyInactiveTabPane
          tabBarGutter={12}
          items={[
            { key: 'unread', label: 'Belum Dibaca' },
            { key: 'all', label: 'Semua' },
          ]}
        />
      </div>

      {apiError ? (
        <div className='px-3 pb-2'>
          <AppAlert
            type='error'
            showIcon
            title='Gagal memuat notifikasi'
          />
        </div>
      ) : null}

      {isLoading ? (
        <div className='px-4 py-8 text-center'>
          <AppSpin
            spinning
            tip={null}
            size='small'
          />
        </div>
      ) : filteredItems?.length ? (
        <div className='px-2 pb-2 max-h-[60vh] overflow-auto space-y-2'>{filteredItems.map(renderItem)}</div>
      ) : (
        <div className='px-4 py-8'>
          <AppEmpty
            image={AppEmpty.Simple}
            description={activeTabKey === 'unread' ? 'Tidak ada notifikasi baru' : 'Tidak ada notifikasi'}
          />
        </div>
      )}

      <div className='px-3 py-2 border-t border-slate-200 bg-slate-50/50 text-right' />
    </div>
  );

  return (
    <AppDropdown
      trigger={['click']}
      placement='bottomRight'
      open={open}
      onOpenChange={setOpen}
      overlayStyle={{ padding: 0 }}
      dropdownContent={dropdownWithTabs}
    >
      <span>
        <AppBadge
          count={unreadCount}
          overflowCount={99}
          offset={[-2, 2]}
          tone='danger'
          indicatorStyle={{ boxShadow: '0 0 0 1.5px #fff inset' }}
        >
          <AppButton
            variant='text'
            aria-label='Notifikasi'
            icon={<BellOutlined />}
            className='hover:!bg-amber-50'
          />
        </AppBadge>
      </span>
    </AppDropdown>
  );
}
