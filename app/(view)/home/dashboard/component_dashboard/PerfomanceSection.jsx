'use client';

import React from 'react';
import Link from 'next/link';
import AppAvatar from '@/app/(view)/component_shared/AppAvatar';
import AppTypography from '@/app/(view)/component_shared/AppTypography';
import AppSelect from '@/app/(view)/component_shared/AppSelect';
import AppInput from '@/app/(view)/component_shared/AppInput';
import AppButton from '@/app/(view)/component_shared/AppButton';

const BRAND = '#003A6F';

/* === Utility === */
function getPhotoUrl(row) {
  return row?.photo || row?.foto_profil_user || row?.avatarUrl || row?.foto || row?.foto_url || row?.photoUrl || row?.avatar || row?.gambar || null;
}

/* === Item karyawan === */
function PerfRow({ userId, name, division, jobTitle, photo, time }) {
  const photoUrl = getPhotoUrl({ photo });
  const subtitle = jobTitle && division ? `${jobTitle} | ${division}` : jobTitle || division || '—';

  return (
    <div className='flex items-center justify-between py-3 border-b border-slate-100 last:border-none'>
      <div className='flex items-center gap-3 min-w-0'>
        <AppAvatar
          src={photoUrl}
          alt={name || 'Foto'}
          name={name}
          size={36}
          bordered
          className='bg-[#E6F0FA] ring-1 ring-[#003A6F22]'
        />

        <div className='min-w-0'>
          <Link
            href={`/home/kelola_karyawan/karyawan/${userId}`}
            className='no-underline'
          >
            <AppTypography.Text
              size={13}
              weight={600}
              className='text-slate-800 truncate'
            >
              {name}
            </AppTypography.Text>
          </Link>
          <AppTypography.Text
            size={11}
            tone='muted'
            className='truncate'
          >
            {subtitle}
          </AppTypography.Text>
        </div>
      </div>

      <span className='text-[11px] px-2 py-1 rounded-full bg-indigo-50 text-indigo-600'>{time ?? '—'}</span>
    </div>
  );
}

/* === Main Section === */
export default function PerformanceSection({ tabs, tab, setTab, date, setDate, division, setDivision, divisionOptions, q, setQ, rows }) {
  const safeRows = Array.isArray(rows) ? rows : [];

  return (
    <div className='bg-white rounded-2xl shadow-sm p-4'>
      {/* Filter Bar */}
      <div className='flex flex-wrap items-center gap-3 mb-3'>
        <AppInput
          type='date'
          size='middle'
          value={date}
          onChange={(e) => setDate(e.target.value)}
          inputClassName='!h-9 !rounded-lg !border !border-slate-200 text-sm'
          className='w-[150px]'
        />

        <AppSelect
          value={division}
          onChange={(v) => setDivision(v)}
          options={divisionOptions}
          size='middle'
          placeholder='Pilih Divisi'
          className='min-w-[160px]'
        />

        <AppInput
          placeholder='Cari'
          allowClear
          value={q}
          onChange={(e) => setQ(e.target.value)}
          prefixIcon={<span className='text-gray-400'>🔍</span>}
          className='w-[220px]'
        />
      </div>

      {/* Tabs */}
      <div className='flex gap-2 overflow-x-auto pb-2'>
        {tabs.map((t) => (
          <AppButton
            key={t.key}
            onClick={() => setTab(t.key)}
            size='small'
            variant={tab === t.key ? 'primary' : 'secondary'}
            className={`px-4 h-9 rounded-xl text-sm font-medium ${tab === t.key ? '!bg-[#003A6F] !text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
          >
            {t.label}
          </AppButton>
        ))}
      </div>

      {/* List */}
      <div className='mt-3'>
        {safeRows.length === 0 ? (
          <AppTypography.Text
            size={13}
            tone='muted'
          >
            Tidak ada data.
          </AppTypography.Text>
        ) : (
          <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
            <div className='divide-y divide-slate-100 bg-[#FAFAFB] rounded-xl p-3'>
              {safeRows.slice(0, Math.ceil(safeRows.length / 2)).map((r, idx) => (
                <PerfRow
                  key={r.id || `${r.userId}-${idx}`}
                  {...r}
                />
              ))}
            </div>
            <div className='divide-y divide-slate-100 bg-[#FAFAFB] rounded-xl p-3'>
              {safeRows.slice(Math.ceil(safeRows.length / 2)).map((r, idx) => (
                <PerfRow
                  key={r.id || `${r.userId}-${idx}-2`}
                  {...r}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
