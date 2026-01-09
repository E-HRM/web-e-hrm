'use client';

import React, { useMemo, useCallback } from 'react';
import { SearchOutlined, SaveOutlined } from '@ant-design/icons';
import { useRouter } from 'next/navigation';

import AppCard from '@/app/(view)/component_shared/AppCard';
import AppTable from '@/app/(view)/component_shared/AppTable';
import AppInput from '@/app/(view)/component_shared/AppInput';
import AppButton from '@/app/(view)/component_shared/AppButton';
import AppSpace from '@/app/(view)/component_shared/AppSpace';
import AppTooltip from '@/app/(view)/component_shared/AppTooltip';
import AppAlert from '@/app/(view)/component_shared/AppAlert';
import AppMessage from '@/app/(view)/component_shared/AppMessage';
import AppAvatar from '@/app/(view)/component_shared/AppAvatar';

import useKonfigurasiCutiViewModel, { GOLD, LIGHT_BLUE, HEADER_BLUE_BG } from './useKonfigurasiCutiViewModel';

/** Ambil URL foto dari row dengan berbagai kemungkinan nama field */
function getPhotoUrl(row) {
  return row?.foto_profil_user || row?.avatarUrl || row?.foto || row?.foto_url || row?.photoUrl || row?.photo || row?.avatar || row?.gambar || null;
}

export default function KonfigurasiCutiContent() {
  const vm = useKonfigurasiCutiViewModel();
  const router = useRouter();

  const goldButtonColors = useMemo(
    () => ({
      primary: GOLD,
      primaryHover: '#0B63C7',
      primaryActive: '#084E9E',
      accent: '#98D5FF',
      accentHover: '#6FC0FF',
      accentActive: '#4AAEFF',
    }),
    []
  );

  const monthColumns = useMemo(
    () =>
      vm.months.map((m) => ({
        title: m.label,
        key: m.key,
        dataIndex: ['quotas', m.key],
        width: 110,
        align: 'center',
        render: (_v, row) => {
          const dirty = vm.isDirty(row.id, m.key);
          return (
            <AppTooltip title={dirty ? 'Perubahan belum disimpan' : ''}>
              <div className='mx-auto w-[92px]'>
                <AppInput.Number
                  size='small'
                  min={0}
                  value={Number(row.quotas?.[m.key] ?? 0)}
                  onChange={(val) => vm.setQuota(row.id, m.key, val)}
                  controls
                  style={{
                    width: '100%',
                    background: dirty ? '#FFF7E6' : undefined,
                    borderColor: dirty ? '#FAAD14' : undefined,
                  }}
                  inputClassName='!rounded-lg'
                />
              </div>
            </AppTooltip>
          );
        },
      })),
    [vm.months, vm.setQuota, vm.isDirty]
  );

  const columns = useMemo(() => {
    return [
      {
        title: 'Karyawan',
        key: 'karyawan',
        fixed: 'left',
        width: 320,
        render: (_, r) => {
          const total = vm.getTotal(r);
          const photo = getPhotoUrl(r) || '/avatar-placeholder.jpg';

          const jab = r.jabatan || '—';
          const dep = r.departemen ? `| ${r.departemen}` : r.jabatan ? '' : '—';

          return (
            <div className='flex items-start gap-3 min-w-0'>
              <AppAvatar
                name={r?.name}
                src={photo}
                size='lg'
                bordered
                tooltip={r?.name}
              />

              <div className='min-w-0'>
                <div
                  className='truncate'
                  style={{ fontWeight: 600, color: '#0f172a' }}
                >
                  {r.name}
                </div>

                <div
                  className='truncate'
                  style={{ fontSize: 12, color: '#475569' }}
                >
                  {jab} {dep}
                </div>

                <div style={{ marginTop: 6 }}>
                  <span
                    className='inline-block px-2 py-1 rounded-md'
                    style={{
                      background: LIGHT_BLUE,
                      color: GOLD,
                      fontSize: 12,
                      fontWeight: 600,
                    }}
                  >
                    Total kuota (tahun berjalan): {total} hari
                  </span>
                </div>
              </div>
            </div>
          );
        },
      },
      ...monthColumns,
    ];
  }, [monthColumns, vm]);

  const handleSave = useCallback(async () => {
    const res = await vm.saveAll();
    if (res.ok) {
      AppMessage.success(res.message || 'Perubahan tersimpan.');
      router.push('/home/pengajuan/cuti');
      return;
    }
    AppMessage.error(res.message || 'Gagal menyimpan.');
  }, [router, vm]);

  return (
    <div className='p-6'>
      <AppCard
        className='shadow-lg'
        ring={false}
        bodyStyle={{ padding: 0 }}
      >
        {/* HEADER / Filter bar */}
        <div
          className='p-5 border-b border-slate-100'
          style={{ background: HEADER_BLUE_BG }}
        >
          <div className='flex flex-col md:flex-row md:items-center justify-between gap-3'>
            <div>
              <h2 className='text-base md:text-lg font-semibold text-slate-800 mb-0.5'>Konfigurasi Kuota Cuti</h2>
              <p className='text-slate-500 text-xs md:text-sm'>
                Perubahan hanya akan disimpan setelah menekan <b>Simpan Semua</b>.
              </p>
            </div>

            <AppSpace
              wrap
              size='sm'
              className='items-center'
            >
              <div className='w-[320px] max-w-[75vw]'>
                <AppInput
                  value={vm.q}
                  onChange={(e) => vm.setQ(e.target.value)}
                  onPressEnter={(e) => vm.setQ(e.currentTarget.value ?? '')}
                  placeholder='Cari nama/email/jabatan/dept…'
                  allowClear
                  prefix={<SearchOutlined />}
                  size='middle'
                />
              </div>

              <AppTooltip title={vm.hasDirty ? '' : 'Tidak ada perubahan'}>
                <AppButton
                  colors={goldButtonColors}
                  variant='primary'
                  icon={<SaveOutlined />}
                  onClick={handleSave}
                  loading={vm.saving}
                  disabled={!vm.hasDirty}
                >
                  {vm.hasDirty ? `Simpan Semua (${vm.dirtyCount})` : 'Simpan Semua'}
                </AppButton>
              </AppTooltip>
            </AppSpace>
          </div>

          {vm.hasDirty && (
            <div className='mt-3'>
              <AppAlert
                type='warning'
                showIcon
                message='Ada perubahan yang belum disimpan.'
                description='Sistem baru akan memperbarui kuota cuti setelah Anda menekan tombol Simpan Semua.'
              />
            </div>
          )}
        </div>

        {/* TABLE */}
        <div className='p-4'>
          <AppTable
            rowKey='id'
            loading={vm.loading}
            dataSource={vm.rows}
            columns={columns}
            size='small'
            tableLayout='fixed'
            sticky
            pagination={false}
            scroll={{ x: 1600, y: 600 }}
            rowClassName={() => 'align-top'}
          />
        </div>
      </AppCard>

      <style
        jsx
        global
      >{`
        .ant-input-number {
          border-radius: 10px !important;
        }
      `}</style>
    </div>
  );
}
