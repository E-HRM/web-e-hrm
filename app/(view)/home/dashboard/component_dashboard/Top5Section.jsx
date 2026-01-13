'use client';

import React from 'react';
import Link from 'next/link';
import AppGrid from '@/app/(view)/component_shared/AppGrid';
import AppAvatar from '@/app/(view)/component_shared/AppAvatar';
import AppTypography from '@/app/(view)/component_shared/AppTypography';
import AppButton from '@/app/(view)/component_shared/AppButton';

const BRAND = '#003A6F';

function getPhotoUrl(row) {
  return row?.photo || row?.foto_profil_user || row?.avatarUrl || row?.foto || row?.foto_url || row?.photoUrl || row?.avatar || row?.gambar || null;
}

function RowLate({ r }) {
  const subtitle = r?.jobTitle && r?.division ? `${r.jobTitle} | ${r.division}` : r?.jobTitle || r?.division || '—';

  const userId = r?.userId ?? '';
  const profileHref = userId ? `/home/kelola_karyawan/karyawan/${encodeURIComponent(userId)}` : null;

  return (
    <div className='py-3 border-b last:border-none border-slate-100'>
      <AppGrid.Row
        align='middle'
        gutter={[12, 8]}
        wrap={false}
      >
        <AppGrid.Col flex='40px'>
          <AppTypography.Text
            size={13}
            tone='muted'
            className='text-slate-500 block'
          >
            {r?.rank ?? '—'}
          </AppTypography.Text>
        </AppGrid.Col>

        <AppGrid.Col flex='auto'>
          <div className='flex items-center gap-3 min-w-0'>
            <AppAvatar
              src={getPhotoUrl(r)}
              alt={r?.name || 'Foto'}
              name={r?.name}
              size={36}
              bordered={false}
              className='ring-1 ring-[#003A6F22] bg-[#E6F0FA]'
            />

            <div className='min-w-0'>
              {profileHref ? (
                <Link
                  href={profileHref}
                  className='no-underline block min-w-0'
                >
                  <AppTypography.Text
                    size={14}
                    weight={800}
                    className='block text-[#003A6F] truncate leading-5'
                  >
                    {r?.name ?? '—'}
                  </AppTypography.Text>
                  <AppTypography.Text
                    size={12}
                    tone='muted'
                    className='block text-slate-500 truncate leading-4'
                  >
                    {subtitle}
                  </AppTypography.Text>
                </Link>
              ) : (
                <>
                  <AppTypography.Text
                    size={14}
                    weight={800}
                    className='block text-[#003A6F] truncate leading-5'
                  >
                    {r?.name ?? '—'}
                  </AppTypography.Text>
                  <AppTypography.Text
                    size={12}
                    tone='muted'
                    className='block text-slate-500 truncate leading-4'
                  >
                    {subtitle}
                  </AppTypography.Text>
                </>
              )}
            </div>
          </div>
        </AppGrid.Col>

        <AppGrid.Col flex='120px'>
          <div className='text-right'>
            <AppTypography.Text
              size={13}
              weight={800}
              className='text-slate-900 block'
            >
              {r?.count ?? '—'}
            </AppTypography.Text>
          </div>
        </AppGrid.Col>

        <AppGrid.Col flex='160px'>
          <div className='text-right'>
            <AppTypography.Text
              size={13}
              className='text-slate-700 block'
            >
              {r?.duration ?? '—'}
            </AppTypography.Text>
          </div>
        </AppGrid.Col>
      </AppGrid.Row>
    </div>
  );
}

function RowDiscipline({ r }) {
  const subtitle = r?.jobTitle && r?.division ? `${r.jobTitle} | ${r.division}` : r?.jobTitle || r?.division || '—';

  const userId = r?.userId ?? '';
  const profileHref = userId ? `/home/kelola_karyawan/karyawan/${encodeURIComponent(userId)}` : null;

  return (
    <div className='py-3 border-b last:border-none border-slate-100'>
      <AppGrid.Row
        align='middle'
        gutter={[12, 8]}
        wrap={false}
      >
        <AppGrid.Col flex='40px'>
          <AppTypography.Text
            size={13}
            tone='muted'
            className='text-slate-500 block'
          >
            {r?.rank ?? '—'}
          </AppTypography.Text>
        </AppGrid.Col>

        <AppGrid.Col flex='auto'>
          <div className='flex items-center gap-3 min-w-0'>
            <AppAvatar
              src={getPhotoUrl(r)}
              alt={r?.name || 'Foto'}
              name={r?.name}
              size={36}
              bordered={false}
              className='ring-1 ring-[#003A6F22] bg-[#E6F0FA]'
            />

            <div className='min-w-0'>
              {profileHref ? (
                <Link
                  href={profileHref}
                  className='no-underline block min-w-0'
                >
                  <AppTypography.Text
                    size={14}
                    weight={800}
                    className='block text-[#003A6F] truncate leading-5'
                  >
                    {r?.name ?? '—'}
                  </AppTypography.Text>
                  <AppTypography.Text
                    size={12}
                    tone='muted'
                    className='block text-slate-500 truncate leading-4'
                  >
                    {subtitle}
                  </AppTypography.Text>
                </Link>
              ) : (
                <>
                  <AppTypography.Text
                    size={14}
                    weight={800}
                    className='block text-[#003A6F] truncate leading-5'
                  >
                    {r?.name ?? '—'}
                  </AppTypography.Text>
                  <AppTypography.Text
                    size={12}
                    tone='muted'
                    className='block text-slate-500 truncate leading-4'
                  >
                    {subtitle}
                  </AppTypography.Text>
                </>
              )}
            </div>
          </div>
        </AppGrid.Col>

        <AppGrid.Col flex='160px'>
          <div className='text-right'>
            <AppTypography.Text
              size={13}
              weight={800}
              className='text-slate-900 block'
            >
              {r?.score ?? '—'}
            </AppTypography.Text>
          </div>
        </AppGrid.Col>
      </AppGrid.Row>
    </div>
  );
}

/**
 * props:
 * - period: "this" | "last"
 * - setPeriod: fn
 * - leftRows: array
 * - rightRows: array
 */
export default function Top5Section({ period = 'this', setPeriod = () => {}, leftRows = [], rightRows = [] }) {
  const safeLeft = Array.isArray(leftRows) ? leftRows : [];
  const safeRight = Array.isArray(rightRows) ? rightRows : [];

  const lastActive = period === 'last';
  const thisActive = period === 'this';

  const btnBase = 'h-9 px-4 rounded-xl text-sm font-semibold border transition-colors';

  const btnLastStyle = lastActive
    ? {
        borderColor: BRAND,
        background: 'rgba(0, 58, 111, 0.08)',
        color: BRAND,
      }
    : {
        borderColor: '#e2e8f0',
        background: '#f8fafc',
        color: '#0f172a',
      };

  const btnThisStyle = thisActive
    ? {
        borderColor: BRAND,
        background: BRAND,
        color: '#ffffff',
      }
    : {
        borderColor: '#e2e8f0',
        background: '#f8fafc',
        color: '#0f172a',
      };

  return (
    <div className='bg-white rounded-2xl shadow-sm p-4'>
      <AppGrid.Row
        gutter={[8, 8]}
        className='mb-4'
      >
        <AppGrid.Col>
          <AppButton
            onClick={() => setPeriod('last')}
            className={btnBase}
            style={btnLastStyle}
            aria-pressed={lastActive}
          >
            Bulan Lalu
          </AppButton>
        </AppGrid.Col>

        <AppGrid.Col>
          <AppButton
            onClick={() => setPeriod('this')}
            className={btnBase}
            style={btnThisStyle}
            aria-pressed={thisActive}
          >
            Bulan Ini
          </AppButton>
        </AppGrid.Col>
      </AppGrid.Row>

      <AppGrid.Row gutter={[16, 16]}>
        <AppGrid.Col
          xs={24}
          lg={12}
        >
          <div className='bg-white rounded-2xl shadow-sm p-4'>
            <AppTypography.Text
              size={14}
              weight={700}
              className='text-slate-800 mb-3'
            >
              Top 5 Karyawan Paling Sering Terlambat
            </AppTypography.Text>

            <div className='px-1 mb-2'>
              <AppGrid.Row
                wrap={false}
                gutter={[12, 0]}
                align='middle'
              >
                <AppGrid.Col flex='40px'>
                  <span className='text-[11px] text-slate-400'>No</span>
                </AppGrid.Col>
                <AppGrid.Col flex='auto'>
                  <span className='text-[11px] text-slate-400'>Nama Karyawan</span>
                </AppGrid.Col>
                <AppGrid.Col flex='120px'>
                  <div className='text-right'>
                    <span className='text-[11px] text-slate-400'>Jumlah Telat</span>
                  </div>
                </AppGrid.Col>
                <AppGrid.Col flex='160px'>
                  <div className='text-right'>
                    <span className='text-[11px] text-slate-400'>Total Durasi Terlambat</span>
                  </div>
                </AppGrid.Col>
              </AppGrid.Row>
            </div>

            <div className='bg-[#FAFAFB] rounded-xl px-3'>
              {safeLeft.length === 0 ? (
                <AppTypography.Text
                  size={13}
                  tone='muted'
                  className='text-slate-500 py-3'
                >
                  Tidak ada data.
                </AppTypography.Text>
              ) : (
                safeLeft.map((r) => (
                  <RowLate
                    key={`late-${r?.rank}-${r?.userId || r?.name}`}
                    r={r}
                  />
                ))
              )}
            </div>
          </div>
        </AppGrid.Col>

        <AppGrid.Col
          xs={24}
          lg={12}
        >
          <div className='bg-white rounded-2xl shadow-sm p-4'>
            <AppTypography.Text
              size={14}
              weight={700}
              className='text-slate-800 mb-3'
            >
              Top 5 Karyawan Paling Disiplin
            </AppTypography.Text>

            <div className='px-1 mb-2'>
              <AppGrid.Row
                wrap={false}
                gutter={[12, 0]}
                align='middle'
              >
                <AppGrid.Col flex='40px'>
                  <span className='text-[11px] text-slate-400'>No</span>
                </AppGrid.Col>
                <AppGrid.Col flex='auto'>
                  <span className='text-[11px] text-slate-400'>Nama Karyawan</span>
                </AppGrid.Col>
                <AppGrid.Col flex='160px'>
                  <div className='text-right'>
                    <span className='text-[11px] text-slate-400'>Skor</span>
                  </div>
                </AppGrid.Col>
              </AppGrid.Row>
            </div>

            <div className='bg-[#FAFAFB] rounded-xl px-3'>
              {safeRight.length === 0 ? (
                <AppTypography.Text
                  size={13}
                  tone='muted'
                  className='text-slate-500 py-3'
                >
                  Tidak ada data.
                </AppTypography.Text>
              ) : (
                safeRight.map((r) => (
                  <RowDiscipline
                    key={`disc-${r?.rank}-${r?.userId || r?.name}`}
                    r={r}
                  />
                ))
              )}
            </div>
          </div>
        </AppGrid.Col>
      </AppGrid.Row>
    </div>
  );
}
