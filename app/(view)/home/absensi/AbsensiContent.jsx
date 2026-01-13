'use client';

import { useMemo, useState, useCallback } from 'react';
import Link from 'next/link';
import dayjs from 'dayjs';
import 'dayjs/locale/id';
import { SearchOutlined, DownloadOutlined, ClockCircleOutlined, CheckCircleOutlined, WarningOutlined, TeamOutlined, BarChartOutlined, EnvironmentOutlined } from '@ant-design/icons';

import useAbsensiViewModel from './useAbsensiViewModel';
import ExportExcelModal from './component_absensi/ExportExcelModal';

import AppTypography from '@/app/(view)/component_shared/AppTypography';
import AppDatePicker from '@/app/(view)/component_shared/AppDatePicker';
import AppInput from '@/app/(view)/component_shared/AppInput';
import AppTable from '@/app/(view)/component_shared/AppTable';
import AppTag from '@/app/(view)/component_shared/AppTag';
import AppButton from '@/app/(view)/component_shared/AppButton';
import AppCard from '@/app/(view)/component_shared/AppCard';
import AppEmpty from '@/app/(view)/component_shared/AppEmpty';
import AppStatistic from '@/app/(view)/component_shared/AppStatistic';
import AppGrid from '@/app/(view)/component_shared/AppGrid';
import AppDivider from '@/app/(view)/component_shared/AppDivider';
import AppTooltip from '@/app/(view)/component_shared/AppTooltip';
import AppAvatar from '@/app/(view)/component_shared/AppAvatar';
import AppModal from '@/app/(view)/component_shared/AppModal';
import AppImagePreview from '@/app/(view)/component_shared/AppImagePreview';
import AppSegmented from '@/app/(view)/component_shared/AppSegmented';

function fmtHHmmss(v) {
  if (!v) return '—';
  if (typeof v === 'string') {
    const m = v.match(/(?:T|\s)?(\d{2}):(\d{2})(?::(\d{2}))?/);
    if (m) return `${m[1]}:${m[2]}:${m[3] ?? '00'}`;
    const d = dayjs(v);
    return d.isValid() ? d.format('HH:mm:ss') : '—';
  }
  const d = dayjs(v);
  return d.isValid() ? d.format('HH:mm:ss') : '—';
}

function formatDateLabelId(d) {
  return dayjs(d).locale('id').format('dddd, DD MMMM YYYY');
}

function resolveUserPhoto(u) {
  const raw = u?.foto_profil_user || u?.avatarUrl || u?.foto || u?.foto_url || u?.photoUrl || u?.photo || u?.avatar || u?.gambar || '';
  if (!raw) return null;

  if (/^https?:\/\//i.test(raw)) return raw.replace(/^http:\/\//i, 'https://');

  if (String(raw).startsWith('/')) {
    if (typeof window !== 'undefined') return `${window.location.origin}${raw}`;
    return raw;
  }

  if (String(raw).startsWith('storage/') || String(raw).startsWith('/storage/')) {
    const base = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    return base ? `${base.replace(/\/+$/, '')}/${String(raw).replace(/^\/+/, '')}` : `/${String(raw).replace(/^\/+/, '')}`;
  }

  return `/${String(raw).replace(/^\.?\//, '')}`;
}

function rowKeySafe(r) {
  if (r?.id_absensi) return r.id_absensi;
  const uid = r?.user?.id_user || r?.user?.id || r?.user?.uuid || 'unknown';
  const tgl = r?.tanggal ? dayjs(r.tanggal).format('YYYY-MM-DD') : 'no-date';
  const jam = r?.jam_masuk || r?.jam_pulang || 'no-time';
  return `${uid}__${tgl}__${jam}`;
}

const tinyStatus = (s) => {
  const key = String(s || '').toLowerCase();
  if (!key) return null;

  if (key.includes('tepat'))
    return (
      <AppTag
        color='green'
        className='px-2 py-0.5 rounded-full'
      >
        Tepat
      </AppTag>
    );

  if (key.includes('lambat'))
    return (
      <AppTag
        color='orange'
        className='px-2 py-0.5 rounded-full'
      >
        Terlambat
      </AppTag>
    );

  if (key.includes('lembur'))
    return (
      <AppTag
        color='blue'
        className='px-2 py-0.5 rounded-full'
      >
        Lembur
      </AppTag>
    );

  if (key.includes('izin'))
    return (
      <AppTag
        color='geekblue'
        className='px-2 py-0.5 rounded-full'
      >
        Izin
      </AppTag>
    );

  if (key.includes('sakit'))
    return (
      <AppTag
        color='purple'
        className='px-2 py-0.5 rounded-full'
      >
        Sakit
      </AppTag>
    );

  return <AppTag className='px-2 py-0.5 rounded-full'>{s}</AppTag>;
};

function StatsCard({ title, value, icon, color, loading }) {
  const colorMap = {
    blue: '#1677ff',
    green: '#52c41a',
    orange: '#faad14',
    red: '#ff4d4f',
  };
  const c = colorMap[color] || '#003A6F';

  return (
    <AppCard
      className='h-full border-0 shadow-sm'
      loading={loading}
    >
      <AppStatistic
        title={<span className='text-gray-500'>{title}</span>}
        value={value}
        prefix={<span style={{ color: c }}>{icon}</span>}
        valueStyle={{ color: '#0f172a' }}
        className='h-full'
      />
    </AppCard>
  );
}

function AttendanceCard({ title, rows, loading, filters, setFilters, dateLabel, stats, headerRight, selectedDate, onOpenExport }) {
  const [photoOpen, setPhotoOpen] = useState(false);
  const [photoSrc, setPhotoSrc] = useState(null);

  const [mapOpen, setMapOpen] = useState(false);
  const [mapWhich, setMapWhich] = useState('start');
  const [mapEmbedUrl, setMapEmbedUrl] = useState(null);
  const [activeRow, setActiveRow] = useState(null);

  const normalizePhotoUrl = useCallback((u) => {
    if (!u) return null;
    if (/^https?:\/\//i.test(u)) return u.replace(/^http:\/\//i, 'https://');
    if (typeof window !== 'undefined' && u.startsWith('/')) return `${window.location.origin}${u}`;
    return u;
  }, []);

  const makeOsmEmbed = useCallback((lat, lon) => {
    const dx = 0.0025;
    const dy = 0.0025;
    const bbox = `${(lon - dx).toFixed(6)}%2C${(lat - dy).toFixed(6)}%2C${(lon + dx).toFixed(6)}%2C${(lat + dy).toFixed(6)}`;
    return `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${lat.toFixed(6)}%2C${lon.toFixed(6)}`;
  }, []);

  const getStartCoord = useCallback((row) => row?.lokasiIn || null, []);
  const getEndCoord = useCallback((row) => row?.lokasiOut || null, []);
  const getBreakStartCoord = useCallback((row) => row?.breakStartCoord || null, []);
  const getBreakEndCoord = useCallback((row) => row?.breakEndCoord || null, []);

  const coordFor = useCallback(
    (which, row) => {
      if (!row) return null;
      switch (which) {
        case 'start':
          return getStartCoord(row);
        case 'breakStart':
          return getBreakStartCoord(row);
        case 'breakEnd':
          return getBreakEndCoord(row);
        case 'end':
          return getEndCoord(row);
        default:
          return null;
      }
    },
    [getStartCoord, getBreakStartCoord, getBreakEndCoord, getEndCoord]
  );

  const openPhoto = useCallback(
    (which, row) => {
      const src = which === 'in' ? row?.photo_in : row?.photo_out;
      if (!src) return;
      setPhotoSrc(normalizePhotoUrl(src));
      setPhotoOpen(true);
    },
    [normalizePhotoUrl]
  );

  const openMap = useCallback(
    (which, row) => {
      const c = coordFor(which, row);
      if (!c) return;
      setActiveRow(row);
      setMapWhich(which);
      setMapEmbedUrl(makeOsmEmbed(c.lat, c.lon));
      setMapOpen(true);
    },
    [coordFor, makeOsmEmbed]
  );

  const mapOptions = useMemo(() => {
    if (!activeRow) return [];
    const opts = [];
    if (getStartCoord(activeRow)) opts.push({ label: 'Start', value: 'start' });
    if (getBreakStartCoord(activeRow)) opts.push({ label: 'Break Start', value: 'breakStart' });
    if (getBreakEndCoord(activeRow)) opts.push({ label: 'Break End', value: 'breakEnd' });
    if (getEndCoord(activeRow)) opts.push({ label: 'End', value: 'end' });
    return opts;
  }, [activeRow, getStartCoord, getBreakStartCoord, getBreakEndCoord, getEndCoord]);

  const data = useMemo(() => {
    const q = (filters?.q || '').toLowerCase().trim();
    const needDiv = filters?.divisi;
    const needStatus = (filters?.status || '').toLowerCase().trim();
    const dateKey = selectedDate ? dayjs(selectedDate).format('YYYY-MM-DD') : null;

    return (rows || [])
      .filter((r) => {
        if (!dateKey) return true;
        const rk = r?.tanggal ? dayjs(r.tanggal).format('YYYY-MM-DD') : '';
        return rk === dateKey;
      })
      .filter((r) => (needDiv ? r.user?.departement?.nama_departement === needDiv : true))
      .filter((r) => {
        if (!needStatus) return true;
        const hay = [r.status_masuk, r.status_pulang].map((x) => String(x || '').toLowerCase()).join(' ');
        return hay.includes(needStatus);
      })
      .filter((r) => {
        if (!q) return true;
        const hay = [r.user?.nama_pengguna, r.user?.departement?.nama_departement].map((s) => String(s || '').toLowerCase()).join(' ');
        return hay.includes(q);
      });
  }, [rows, filters, selectedDate]);

  const columns = useMemo(
    () => [
      {
        title: 'Nama',
        dataIndex: 'name',
        key: 'name',
        width: 320,
        fixed: 'left',
        render: (_, row) => {
          const u = row?.user || {};
          const id = u?.id_user ?? u?.id ?? u?.uuid;
          const href = id ? `/home/kelola_karyawan/karyawan/${id}` : undefined;

          const displayName = u?.nama_pengguna ?? u?.name ?? u?.email ?? '—';
          const jabatan = u?.jabatan?.nama_jabatan ?? u?.jabatan?.nama ?? (typeof u?.jabatan === 'string' ? u?.jabatan : '') ?? '';
          const departemen = u?.departement?.nama_departement ?? u?.departemen?.nama ?? (typeof u?.departemen === 'string' ? u?.departemen : '') ?? '';

          const subtitle = jabatan && departemen ? `${jabatan} | ${departemen}` : jabatan || departemen || '—';
          const photo = resolveUserPhoto(u);

          const node = (
            <div className='flex items-center gap-3 min-w-0'>
              <AppAvatar
                src={photo}
                name={displayName}
                size={36}
                bordered={false}
                className='ring-1 ring-[#003A6F22] bg-[#E6F0FA]'
              />
              <div className='min-w-0'>
                <div
                  className='truncate'
                  style={{ fontWeight: 700, color: '#0f172a' }}
                >
                  {displayName}
                </div>
                <div
                  className='truncate'
                  style={{ fontSize: 12, color: '#475569' }}
                >
                  {subtitle}
                </div>
              </div>
            </div>
          );

          return href ? (
            <Link
              href={href}
              className='no-underline'
            >
              {node}
            </Link>
          ) : (
            node
          );
        },
        sorter: (a, b) => (a.user?.nama_pengguna || '').localeCompare(b.user?.nama_pengguna || ''),
      },
      {
        title: 'Presensi Masuk',
        dataIndex: 'jam_masuk',
        width: 260,
        render: (_, r) => (
          <div className='flex items-center justify-between gap-2'>
            <div>
              <div className='text-3xl md:text-4xl font-bold tracking-tight tabular-nums'>{fmtHHmmss(r.jam_masuk)}</div>
              <div className='mt-1'>{tinyStatus(r.status_masuk)}</div>
            </div>
            <div className='flex items-center gap-1'>
              <AppTooltip title='Lihat lokasi masuk'>
                <AppButton
                  variant='outline'
                  size='middle'
                  shape='circle'
                  icon={<EnvironmentOutlined />}
                  onClick={() => openMap('start', r)}
                  disabled={!getStartCoord(r)}
                />
              </AppTooltip>
            </div>
          </div>
        ),
        sorter: (a, b) => String(a.jam_masuk || '').localeCompare(String(b.jam_masuk || '')),
      },
      {
        title: 'Mulai Istirahat',
        dataIndex: 'istirahat_mulai',
        width: 260,
        render: (_, r) => (
          <div className='flex items-center justify-between gap-2'>
            <div className='text-3xl md:text-4xl font-bold tracking-tight tabular-nums'>{fmtHHmmss(r.istirahat_mulai)}</div>
            <div className='flex items-center gap-1'>
              <AppTooltip title='Lihat lokasi mulai istirahat'>
                <AppButton
                  variant='outline'
                  size='middle'
                  shape='circle'
                  icon={<EnvironmentOutlined />}
                  onClick={() => openMap('breakStart', r)}
                  disabled={!getBreakStartCoord(r)}
                />
              </AppTooltip>
            </div>
          </div>
        ),
        sorter: (a, b) => String(a.istirahat_mulai || '').localeCompare(String(b.istirahat_mulai || '')),
      },
      {
        title: 'Selesai Istirahat',
        dataIndex: 'istirahat_selesai',
        width: 260,
        render: (_, r) => (
          <div className='flex items-center justify-between gap-2'>
            <div className='text-3xl md:text-4xl font-bold tracking-tight tabular-nums'>{fmtHHmmss(r.istirahat_selesai)}</div>
            <div className='flex items-center gap-1'>
              <AppTooltip title='Lihat lokasi selesai istirahat'>
                <AppButton
                  variant='outline'
                  size='middle'
                  shape='circle'
                  icon={<EnvironmentOutlined />}
                  onClick={() => openMap('breakEnd', r)}
                  disabled={!getBreakEndCoord(r)}
                />
              </AppTooltip>
            </div>
          </div>
        ),
        sorter: (a, b) => String(a.istirahat_selesai || '').localeCompare(String(b.istirahat_selesai || '')),
      },
      {
        title: 'Presensi Keluar',
        dataIndex: 'jam_pulang',
        width: 280,
        render: (_, r) => (
          <div className='flex items-center justify-between gap-2'>
            <div>
              <div className='text-3xl md:text-4xl font-bold tracking-tight tabular-nums'>{fmtHHmmss(r.jam_pulang)}</div>
              <div className='mt-1'>{tinyStatus(r.status_pulang)}</div>
            </div>
            <div className='flex items-center gap-1'>
              <AppTooltip title='Lihat lokasi pulang'>
                <AppButton
                  variant='outline'
                  size='middle'
                  shape='circle'
                  icon={<EnvironmentOutlined />}
                  onClick={() => openMap('end', r)}
                  disabled={!getEndCoord(r)}
                />
              </AppTooltip>
            </div>
          </div>
        ),
        sorter: (a, b) => String(a.jam_pulang || '').localeCompare(String(b.jam_pulang || '')),
      },
    ],
    [openMap, getStartCoord, getBreakStartCoord, getBreakEndCoord, getEndCoord]
  );

  return (
    <AppCard
      className='p-0 rounded-xl shadow-sm border-0 overflow-hidden'
      bodyStyle={{ padding: 0 }}
    >
      <div className='bg-gradient-to-r from-blue-50 to-indigo-50 px-6 py-4 border-b'>
        <div className='flex flex-col md:flex-row md:items-center md:justify-between gap-3'>
          <div>
            <AppTypography.Title
              level={4}
              className='!m-0 !text-gray-800 flex items-center gap-2'
            >
              <BarChartOutlined />
              {title}
            </AppTypography.Title>
            <div className='mt-1 text-sm text-gray-500'>{dateLabel}</div>
          </div>

          <div className='flex items-center gap-2'>
            {headerRight}
            <AppTooltip title='Export data'>
              <AppButton
                variant='primary'
                icon={<DownloadOutlined />}
                className='rounded-lg'
                onClick={onOpenExport}
              >
                Export
              </AppButton>
            </AppTooltip>
          </div>
        </div>

        {stats && (
          <div className='mt-4'>
            <AppDivider className='!my-4' />
            <AppGrid.Row gutter={[16, 16]}>
              <AppGrid.Col
                xs={12}
                sm={6}
              >
                <StatsCard
                  title='Karyawan Presensi'
                  value={stats.total}
                  icon={<TeamOutlined />}
                  color='blue'
                  loading={loading}
                />
              </AppGrid.Col>
              <AppGrid.Col
                xs={12}
                sm={6}
              >
                <StatsCard
                  title='Tepat Waktu'
                  value={stats.onTime}
                  icon={<CheckCircleOutlined />}
                  color='green'
                  loading={loading}
                />
              </AppGrid.Col>
              <AppGrid.Col
                xs={12}
                sm={6}
              >
                <StatsCard
                  title='Terlambat'
                  value={stats.late}
                  icon={<WarningOutlined />}
                  color='orange'
                  loading={loading}
                />
              </AppGrid.Col>
              <AppGrid.Col
                xs={12}
                sm={6}
              >
                <StatsCard
                  title='Lembur'
                  value={stats.overtime}
                  icon={<ClockCircleOutlined />}
                  color='blue'
                  loading={loading}
                />
              </AppGrid.Col>
            </AppGrid.Row>
          </div>
        )}
      </div>

      <div className='px-6 py-4'>
        <div className='grid grid-cols-1 lg:grid-cols-4 gap-3 mb-4'>
          <AppInput
            allowClear
            prefixIcon={<SearchOutlined className='text-gray-400' />}
            placeholder='Cari nama atau divisi...'
            value={filters.q}
            onChange={(e) => setFilters((p) => ({ ...p, q: e.target.value }))}
            className='rounded-lg'
          />
        </div>

        <AppTable
          rowKey={rowKeySafe}
          size='middle'
          loading={loading}
          scroll={{ x: 1200 }}
          columns={columns}
          dataSource={data}
          locale={{
            emptyText: (
              <AppEmpty
                title='Tidak ada data absensi'
                description='Tidak ada data absensi'
                compact
              />
            ),
          }}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) => `${range[0]}-${range[1]} dari ${total} data`,
            className: 'px-4 py-2',
          }}
          className='rounded-lg border border-gray-200'
          rowClassName={() => 'hover:bg-blue-50 transition-colors'}
        />
      </div>

      <AppModal
        title='Attachment'
        open={photoOpen}
        onClose={() => setPhotoOpen(false)}
        footer={false}
        width={560}
        zIndex={1500}
        getContainer={() => document.body}
      >
        {photoSrc ? (
          <AppImagePreview
            src={photoSrc}
            alt='Attachment'
            style={{ width: '100%', maxWidth: 520, maxHeight: '50vh', objectFit: 'contain' }}
            preview={{ mask: 'Click to zoom', zIndex: 1600 }}
            fallback='/image-not-found.png'
          />
        ) : (
          <div style={{ opacity: 0.6 }}>No attachment</div>
        )}
      </AppModal>

      <AppModal
        title='Location'
        open={mapOpen}
        onClose={() => setMapOpen(false)}
        footer={false}
        width={860}
        zIndex={1550}
        getContainer={() => document.body}
      >
        {mapOptions.length > 0 && (
          <div className='mb-2'>
            <AppSegmented
              value={mapWhich}
              onChange={(v) => {
                const c = coordFor(v, activeRow);
                setMapWhich(v);
                if (c) setMapEmbedUrl(makeOsmEmbed(c.lat, c.lon));
              }}
              options={mapOptions}
            />
          </div>
        )}

        {mapEmbedUrl ? (
          <div style={{ width: '100%', height: 420, borderRadius: 12, overflow: 'hidden', border: '1px solid #e5e7eb' }}>
            <iframe
              src={mapEmbedUrl}
              style={{ width: '100%', height: '100%', border: 0 }}
              loading='lazy'
              referrerPolicy='no-referrer-when-downgrade'
            />
          </div>
        ) : (
          <div style={{ opacity: 0.6 }}>No coordinates</div>
        )}
      </AppModal>
    </AppCard>
  );
}

export default function AbsensiContent() {
  const vm = useAbsensiViewModel();

  const [mode, setMode] = useState('in');
  const isIn = mode === 'in';

  const [exportOpen, setExportOpen] = useState(false);

  const rows = isIn ? vm.kedatangan : vm.kepulangan;
  const filters = isIn ? vm.filterIn : vm.filterOut;
  const setFilters = isIn ? vm.setFilterIn : vm.setFilterOut;

  const dateValue = isIn ? vm.dateIn : vm.dateOut;
  const setDateValue = isIn ? vm.setDateIn : vm.setDateOut;

  const dateLabel = useMemo(() => formatDateLabelId(dateValue), [dateValue]);
  const tableDate = isIn ? vm.dateIn : vm.dateOut;

  const stats = useMemo(() => {
    const total = rows.length;
    const onTime = rows.filter((r) => /tepat/i.test(r.status_label)).length;
    const late = rows.filter((r) => /lambat/i.test(r.status_label)).length;
    const overtime = rows.filter((r) => /lembur/i.test(r.status_label)).length;
    return { total, onTime, late, overtime };
  }, [rows]);

  return (
    <div className='min-h-screen bg-gray-50 p-4 md:p-6'>
      <div className='max-w-7xl mx-auto space-y-6'>
        <div className='flex items-end justify-between gap-3 flex-wrap'>
          <div>
            <AppTypography.Title
              level={2}
              className='!mb-1 !text-gray-800'
            >
              Absensi
            </AppTypography.Title>
            <AppTypography.Text tone='secondary'>Pantau kehadiran dan kepulangan karyawan secara real-time</AppTypography.Text>
          </div>
        </div>

        <AttendanceCard
          title={isIn ? 'Absensi Kedatangan Karyawan' : 'Absensi Kepulangan Karyawan'}
          rows={vm.rowsAll}
          loading={vm.loading}
          filters={filters}
          setFilters={setFilters}
          dateLabel={dateLabel}
          stats={stats}
          headerRight={
            <AppDatePicker
              value={dateValue}
              onChange={setDateValue}
              format='DD/MM/YYYY'
              allowClear={false}
            />
          }
          selectedDate={tableDate}
          onOpenExport={() => setExportOpen(true)}
        />

        <ExportExcelModal
          open={exportOpen}
          onClose={() => setExportOpen(false)}
          rowsAll={vm.rowsAll}
          employeeOptions={vm.employeeOptions}
          lokasiOptions={vm.lokasiOptions}
        />
      </div>
    </div>
  );
}
