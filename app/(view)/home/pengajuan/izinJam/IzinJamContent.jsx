'use client';

import React, { useMemo, useState, useRef, useCallback, useLayoutEffect } from 'react';
import dayjs from 'dayjs';
import 'dayjs/locale/id';
import { FileTextOutlined, CheckOutlined, CloseOutlined, InfoCircleOutlined, ClockCircleOutlined } from '@ant-design/icons';

import useIzinJamViewModel from './useIzinJamViewModel';
import ApprovalTable from '@/app/(view)/home/pengajuan/component_pengajuan/ApprovalTable';

import AppTabs from '@/app/(view)/component_shared/AppTabs';
import AppCard from '@/app/(view)/component_shared/AppCard';
import AppButton from '@/app/(view)/component_shared/AppButton';
import AppModal from '@/app/(view)/component_shared/AppModal';
import AppTooltip from '@/app/(view)/component_shared/AppTooltip';
import AppSpace from '@/app/(view)/component_shared/AppSpace';
import AppAvatar from '@/app/(view)/component_shared/AppAvatar';
import AppBadge from '@/app/(view)/component_shared/AppBadge';
import AppInput from '@/app/(view)/component_shared/AppInput';
import AppMessage from '@/app/(view)/component_shared/AppMessage';

dayjs.locale('id');

const SUCCESS_BTN_COLORS = {
  primary: '#16a34a',
  primaryHover: '#15803d',
  primaryActive: '#166534',
  accent: '#bbf7d0',
  accentHover: '#86efac',
  accentActive: '#4ade80',
};

/* ====== Komponen kecil yang reusable ====== */
function MiniField({ label, children, span = 1, className = '' }) {
  return (
    <div
      className={`min-w-0 ${className}`}
      style={{ gridColumn: `span ${span} / span ${span}` }}
    >
      <div className='text-xs font-semibold text-gray-600 mb-1'>{label}</div>
      <div className='text-sm text-gray-900 leading-5 break-words'>{children}</div>
    </div>
  );
}

function StatusBadge({ status }) {
  const map = {
    Disetujui: { antStatus: 'success', text: 'Disetujui' },
    Ditolak: { antStatus: 'error', text: 'Ditolak' },
    Menunggu: { antStatus: 'warning', text: 'Menunggu' },
  };
  const cfg = map[status] || map.Menunggu;

  return (
    <AppBadge.Status
      status={cfg.antStatus}
      text={cfg.text}
      className='font-medium text-xs'
    />
  );
}

function formatDateTimeID(date) {
  try {
    return dayjs(date).format('DD MMM YYYY • HH:mm');
  } catch {
    return String(date);
  }
}

function formatDateOnlyID(date) {
  try {
    return dayjs(date).format('DD MMM YYYY');
  } catch {
    return String(date);
  }
}

function ellipsisWords(str, maxWords = 2) {
  const s = String(str ?? '').trim();
  if (!s) return '—';
  const parts = s.split(/\s+/);
  return parts.length <= maxWords ? s : `${parts.slice(0, maxWords).join(' ')}…`;
}

/* ===== Text clamp ===== */
function TextClampCell({ text, expanded, onToggle }) {
  const ghostRef = useRef(null);
  const [showToggle, setShowToggle] = useState(false);

  const recompute = useCallback(() => {
    const el = ghostRef.current;
    if (!el) return;
    const cs = window.getComputedStyle(el);
    const base = parseFloat(cs.lineHeight) || parseFloat(cs.fontSize) * 1.3 || 18;
    const lines = Math.round(el.scrollHeight / base);
    setShowToggle(lines > 1);
  }, []);

  useLayoutEffect(() => {
    recompute();
    const ro = new ResizeObserver(recompute);
    if (ghostRef.current?.parentElement) ro.observe(ghostRef.current.parentElement);
    return () => ro.disconnect();
  }, [recompute, text]);

  return (
    <>
      <AppTooltip title={!expanded && text?.length > 100 ? text : undefined}>
        <span
          className='block text-sm text-gray-900'
          style={
            expanded
              ? { whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }
              : {
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden',
                  overflowWrap: 'anywhere',
                }
          }
        >
          {text || '—'}
        </span>
      </AppTooltip>

      {showToggle && (
        <button
          onClick={onToggle}
          className='mt-1 inline-block text-xs font-medium text-blue-600 hover:text-blue-800 transition-colors'
          style={{ border: 'none', background: 'transparent', padding: 0 }}
        >
          {expanded ? 'Sembunyikan' : 'Selengkapnya'}
        </button>
      )}

      <div
        ref={ghostRef}
        aria-hidden
        className='absolute invisible pointer-events-none text-sm leading-5'
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
          visibility: 'hidden',
          whiteSpace: 'pre-wrap',
          overflowWrap: 'anywhere',
        }}
      >
        {text}
      </div>
    </>
  );
}

export default function IzinJamContent() {
  const vm = useIzinJamViewModel();

  const [rejectRow, setRejectRow] = useState(null);
  const [reason, setReason] = useState('');
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10 });
  const [expandedKeperluan, setExpandedKeperluan] = useState(new Set());
  const [expandedHandover, setExpandedHandover] = useState(new Set());
  const [approveRow, setApproveRow] = useState(null);

  const [previewDocUrl, setPreviewDocUrl] = useState(null);
  const [previewDocTitle, setPreviewDocTitle] = useState('');

  const toggleKeperluan = (id) =>
    setExpandedKeperluan((prev) => {
      const s = new Set(prev);
      s.has(id) ? s.delete(id) : s.add(id);
      return s;
    });

  const toggleHandover = (id) =>
    setExpandedHandover((prev) => {
      const s = new Set(prev);
      s.has(id) ? s.delete(id) : s.add(id);
      return s;
    });

  const counts = vm.tabCounts || { pengajuan: 0, disetujui: 0, ditolak: 0 };

  const columns = useMemo(() => {
    return [
      {
        title: 'NO',
        key: 'no',
        width: 60,
        fixed: 'left',
        align: 'center',
        render: (_, __, index) => <div className='text-sm font-medium text-gray-600'>{(pagination.current - 1) * pagination.pageSize + index + 1}</div>,
      },
      {
        title: 'KARYAWAN',
        key: 'karyawan',
        width: 280,
        fixed: 'left',
        onCell: () => ({ style: { verticalAlign: 'top' } }),
        render: (_, r) => (
          <div className='flex items-start gap-3'>
            <AppAvatar
              src={r.foto}
              name={r.nama}
              size={48}
              bordered
              className='border-2 border-gray-200'
            />
            <div className='min-w-0 flex-1'>
              <div className='font-semibold text-gray-900 text-sm mb-0.5 truncate'>{r.nama}</div>
              <div className='text-xs text-gray-600 truncate'>{r.jabatanDivisi}</div>

              <div className='mt-2 flex items-center gap-1 text-xs text-gray-500'>
                <ClockCircleOutlined />
                <span>{formatDateTimeID(r.tglPengajuan)}</span>
              </div>
              <div className='mt-2'>
                <StatusBadge status={r.status} />
              </div>
            </div>
          </div>
        ),
      },
      {
        title: 'DETAIL PENGAJUAN',
        key: 'detail',
        render: (_, r) => {
          const expKep = expandedKeperluan.has(r.id);
          const expHan = expandedHandover.has(r.id);

          const jamIzin =
            r.jamMulai && r.jamSelesai ? (
              <span className='font-medium'>
                {r.jamMulai} – {r.jamSelesai}
              </span>
            ) : (
              '—'
            );

          const jamPengganti =
            r.pgTglMulai && r.pgJamMulai && r.pgTglSelesai && r.pgJamSelesai ? (
              <div className='space-y-0.5'>
                <div className='text-gray-700'>
                  {formatDateOnlyID(r.pgTglMulai)}
                  {r.pgTglSelesai !== r.pgTglMulai ? ` → ${formatDateOnlyID(r.pgTglSelesai)}` : ''}
                </div>
                <div className='font-medium'>
                  {r.pgJamMulai} – {r.pgJamSelesai}
                </div>
              </div>
            ) : (
              '—'
            );

          return (
            <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
              <MiniField label='Kategori'>
                <div className='flex items-center gap-2'>
                  <div className='w-2 h-2 bg-blue-500 rounded-full' />
                  <span className='font-medium'>{r.kategori}</span>
                </div>
              </MiniField>

              <MiniField label='Tanggal Pengajuan'>{formatDateTimeID(r.tglPengajuan)}</MiniField>
              <MiniField label='Tanggal Izin'>{r.tglIzin ? formatDateOnlyID(r.tglIzin) : '—'}</MiniField>
              <MiniField label='Jam Izin'>{jamIzin}</MiniField>
              <MiniField label='Jam Pengganti'>{jamPengganti}</MiniField>

              <MiniField
                label='Keperluan'
                className='lg:col-span-3'
              >
                <div className='bg-gray-50 rounded-lg p-3'>
                  <TextClampCell
                    text={r.keperluan}
                    expanded={expKep}
                    onToggle={() => toggleKeperluan(r.id)}
                  />
                </div>
              </MiniField>

              <MiniField
                label='Handover Pekerjaan'
                className='lg:col-span-3'
              >
                <div className='bg-gray-50 rounded-lg p-3'>
                  <TextClampCell
                    text={r.handover}
                    expanded={expHan}
                    onToggle={() => toggleHandover(r.id)}
                  />

                  {Array.isArray(r.handoverUsers) && r.handoverUsers.length > 0 && (
                    <div className='mt-3'>
                      <div className='text-xs font-semibold text-gray-700 mb-2'>Daftar Penerima Handover :</div>
                      <div className='flex flex-wrap gap-2'>
                        {r.handoverUsers.map((u) => (
                          <div
                            key={u.id}
                            className='flex items-center gap-2 bg-white px-3 py-2 rounded-lg border border-gray-200'
                          >
                            <AppAvatar
                              src={u.photo}
                              name={u.name}
                              size={24}
                              bordered
                            />
                            <AppTooltip title={u.name}>
                              <span className='text-sm font-medium text-gray-900 whitespace-nowrap'>{ellipsisWords(u.name, 2)}</span>
                            </AppTooltip>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </MiniField>

              <MiniField label='Dokumen Pendukung'>
                <AppButton
                  icon={<FileTextOutlined />}
                  size='small'
                  variant={r.buktiUrl ? 'primary' : 'outline'}
                  disabled={!r.buktiUrl}
                  onClick={() => {
                    if (!r.buktiUrl) return;
                    setPreviewDocUrl(r.buktiUrl);
                    setPreviewDocTitle(`Dokumen pendukung - ${r.nama || ''}`);
                  }}
                  className='flex items-center gap-1'
                >
                  {r.buktiUrl ? 'Lihat Dokumen' : 'Tidak Ada File'}
                </AppButton>
              </MiniField>
            </div>
          );
        },
      },
      {
        title: 'AKSI & KEPUTUSAN',
        key: 'aksi',
        width: 200,
        fixed: 'right',
        onCell: () => ({ style: { verticalAlign: 'top' } }),
        render: (_, r) => {
          if (vm.tab === 'pengajuan') {
            return (
              <AppSpace
                direction='vertical'
                size={8}
                className='w-full'
                block
              >
                <AppButton
                  variant='primary'
                  colors={SUCCESS_BTN_COLORS}
                  icon={<CheckOutlined />}
                  className='w-full font-semibold'
                  onClick={() => setApproveRow(r)}
                  size='small'
                >
                  Setujui
                </AppButton>

                <AppButton
                  variant='danger'
                  icon={<CloseOutlined />}
                  className='w-full font-semibold'
                  onClick={() => {
                    setRejectRow(r);
                    setReason('');
                  }}
                  size='small'
                >
                  Tolak
                </AppButton>
              </AppSpace>
            );
          }

          const isApproved = vm.tab === 'disetujui';
          return (
            <div className={`rounded-lg p-3 border ${isApproved ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
              <div className={`text-xs font-semibold mb-1 ${isApproved ? 'text-green-700' : 'text-red-700'}`}>{isApproved ? 'Disetujui Pada' : 'Ditolak Pada'}</div>

              <div className={`text-sm font-medium ${isApproved ? 'text-green-900' : 'text-red-900'}`}>{formatDateTimeID(r.tglKeputusan)}</div>

              {r.alasan && (
                <div className='mt-3'>
                  <div className={`text-xs font-semibold mb-1 ${isApproved ? 'text-green-700' : 'text-red-700'}`}>Catatan</div>
                  <div className={`text-sm rounded p-2 ${isApproved ? 'bg-white/60 text-green-900' : 'bg-white/60 text-red-900'}`}>{r.alasan}</div>
                </div>
              )}
            </div>
          );
        },
      },
    ];
  }, [vm.tab, expandedKeperluan, expandedHandover, pagination]);

  const dataSource = vm.filteredData.map((d) => ({ key: d.id, ...d }));

  const tabItems = [
    {
      key: 'pengajuan',
      label: (
        <div className='flex items-center gap-2 px-3 py-2'>
          <span className='font-medium'>Pengajuan</span>
          <span className='bg-orange-100 text-orange-800 rounded-full px-2 py-1 text-xs font-medium min-w-6 text-center'>{counts.pengajuan}</span>
        </div>
      ),
    },
    {
      key: 'disetujui',
      label: (
        <div className='flex items-center gap-2 px-3 py-2'>
          <span className='font-medium'>Disetujui</span>
          <span className='bg-green-100 text-green-800 rounded-full px-2 py-1 text-xs font-medium min-w-6 text-center'>{counts.disetujui}</span>
        </div>
      ),
    },
    {
      key: 'ditolak',
      label: (
        <div className='flex items-center gap-2 px-3 py-2'>
          <span className='font-medium'>Ditolak</span>
          <span className='bg-red-100 text-red-800 rounded-full px-2 py-1 text-xs font-medium min-w-6 text-center'>{counts.ditolak}</span>
        </div>
      ),
    },
  ];

  return (
    <div className='min-h-screen bg-gray-50 p-6'>
      <div className='mb-6'>
        <div className='flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4'>
          <div>
            <h1 className='text-2xl font-bold text-gray-900 mb-2'>Manajemen Pengajuan Izin Jam</h1>
            <p className='text-gray-600 text-sm'>Kelola dan pantau semua pengajuan izin jam karyawan dalam satu tempat</p>
          </div>
        </div>
      </div>

      <AppCard
        tone='white'
        ring={false}
        className='shadow-sm border-0'
      >
        <AppTabs
          activeKey={vm.tab}
          onChange={vm.setTab}
          variant='line'
          size='large'
          items={tabItems.map((t) => ({
            key: t.key,
            label: t.label,
            children: (
              <div className='mt-6'>
                <div className='flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6'>
                  <div>
                    <h2 className='text-lg font-semibold text-gray-900'>Daftar {t.key.charAt(0).toUpperCase() + t.key.slice(1)}</h2>
                    <p className='text-gray-500 text-sm mt-1'>
                      Menampilkan {dataSource.length} dari {counts[t.key]} pengajuan
                    </p>
                  </div>
                </div>

                <ApprovalTable
                  columns={columns}
                  dataSource={dataSource}
                  page={pagination.current}
                  pageSize={pagination.pageSize}
                  total={counts[vm.tab]}
                  loading={vm.loading}
                  onChangePage={(current, pageSize) => setPagination({ current, pageSize })}
                />
              </div>
            ),
          }))}
        />
      </AppCard>

      <AppModal
        title={previewDocTitle || 'Preview Dokumen'}
        open={!!previewDocUrl}
        onClose={() => {
          setPreviewDocUrl(null);
          setPreviewDocTitle('');
        }}
        footer={false}
        width='50%'
        style={{ top: 20 }}
        bodyStyle={{ padding: 0 }}
      >
        {previewDocUrl && (
          <div style={{ height: '75vh' }}>
            {/\.(png|jpe?g|gif|webp)$/i.test(previewDocUrl) ? (
              <img
                src={previewDocUrl}
                alt={previewDocTitle || 'Dokumen'}
                style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block' }}
              />
            ) : (
              <iframe
                src={previewDocUrl}
                title={previewDocTitle || 'Dokumen'}
                style={{ width: '100%', height: '100%', border: 'none' }}
              />
            )}
          </div>
        )}
      </AppModal>

      <AppModal
        title={
          <div className='flex items-center gap-2'>
            <span>Tolak Pengajuan Izin Jam</span>
          </div>
        }
        open={!!rejectRow}
        variant='danger'
        okText='Tolak Pengajuan'
        cancelText='Batal'
        okDisabled={!reason.trim()}
        width={500}
        onClose={() => {
          setRejectRow(null);
          setReason('');
        }}
        onOk={async () => {
          const r = String(reason || '').trim();
          if (!r) {
            AppMessage.error('Alasan wajib diisi saat menolak.');
            return;
          }
          const ok = await vm.reject(rejectRow.id, r);
          if (ok) {
            setRejectRow(null);
            setReason('');
          }
        }}
      >
        <div className='space-y-4'>
          <div className='bg-red-50 border border-red-200 rounded-lg p-3'>
            <div className='flex items-center gap-2 text-sm font-medium text-red-900'>
              <InfoCircleOutlined />
              Konfirmasi Penolakan
            </div>
            <div className='text-sm text-red-700 mt-1'>
              Anda akan menolak pengajuan dari <strong>{rejectRow?.nama}</strong>
            </div>
          </div>

          <div>
            <label className='block text-sm font-medium text-gray-700 mb-2'>Alasan Penolakan *</label>
            <AppInput.TextArea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={4}
              placeholder='Berikan alasan penolakan yang jelas dan konstruktif...'
              className='resize-none'
            />
            <div className='text-xs text-gray-500 mt-2'>Alasan penolakan wajib diisi dan akan dikirimkan kepada karyawan</div>
          </div>
        </div>
      </AppModal>

      <AppModal
        title={
          <div className='flex items-center gap-2'>
            <span>Setujui Pengajuan Izin Jam</span>
          </div>
        }
        open={!!approveRow}
        okText='Setujui Pengajuan'
        cancelText='Batal'
        width={480}
        onClose={() => setApproveRow(null)}
        onOk={async () => {
          if (!approveRow) return;
          await vm.approve(approveRow.id);
          setApproveRow(null);
        }}
      >
        <div className='space-y-3'>
          <div className='bg-green-50 border border-green-200 rounded-lg p-3'>
            <div className='flex items-center gap-2 text-sm font-medium text-green-900'>
              <InfoCircleOutlined />
              Konfirmasi Persetujuan
            </div>
            <div className='text-sm text-green-700 mt-1'>
              Anda akan menyetujui pengajuan izin jam dari <strong>{approveRow?.nama}</strong>.
            </div>
          </div>
          <p className='text-xs text-gray-500'>Pastikan tanggal & jam izin sudah sesuai sebelum melanjutkan.</p>
        </div>
      </AppModal>
    </div>
  );
}
