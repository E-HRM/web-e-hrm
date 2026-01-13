'use client';

import React, { useMemo, useState, useRef, useCallback, useLayoutEffect, useEffect } from 'react';
import Link from 'next/link';
import dayjs from 'dayjs';
import 'dayjs/locale/id';

import { SearchOutlined, FileTextOutlined, CalendarOutlined, CheckOutlined, CloseOutlined, InfoCircleOutlined, SettingOutlined, UserOutlined, ClockCircleOutlined } from '@ant-design/icons';

import AppCard from '@/app/(view)/component_shared/AppCard';
import AppTabs from '@/app/(view)/component_shared/AppTabs';
import AppButton from '@/app/(view)/component_shared/AppButton';
import AppModal from '@/app/(view)/component_shared/AppModal';
import AppTooltip from '@/app/(view)/component_shared/AppTooltip';
import AppSpace from '@/app/(view)/component_shared/AppSpace';
import AppInput from '@/app/(view)/component_shared/AppInput';
import AppSelect from '@/app/(view)/component_shared/AppSelect';
import AppDatePicker from '@/app/(view)/component_shared/AppDatePicker';
import AppTag from '@/app/(view)/component_shared/AppTag';
import AppAvatar from '@/app/(view)/component_shared/AppAvatar';
import AppMessage from '@/app/(view)/component_shared/AppMessage';

import useCutiViewModel from './useCutiViewModel';
import ApprovalTable from '@/app/(view)/home/pengajuan/component_pengajuan/ApprovalTable';

dayjs.locale('id');

const PRIMARY_COLOR = '#003A6F';
const SUCCESS_COLOR = '#52c41a';
const ERROR_COLOR = '#ff4d4f';
const WARNING_COLOR = '#faad14';

const GREEN_BUTTON = {
  primary: '#16A34A',
  primaryHover: '#15803D',
  primaryActive: '#166534',
  accent: '#BBF7D0',
  accentHover: '#86EFAC',
  accentActive: '#4ADE80',
};

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

function ellipsisWords(str, maxWords = 2) {
  const s = String(str ?? '').trim();
  if (!s) return '—';
  const parts = s.split(/\s+/);
  return parts.length <= maxWords ? s : `${parts.slice(0, maxWords).join(' ')}…`;
}

function StatusTag({ status }) {
  const map = {
    Disetujui: { color: SUCCESS_COLOR, label: 'Disetujui' },
    Ditolak: { color: ERROR_COLOR, label: 'Ditolak' },
    Menunggu: { color: WARNING_COLOR, label: 'Menunggu' },
  };
  const cfg = map[status] || map.Menunggu;
  return (
    <AppTag
      color={cfg.color}
      variant='soft'
      size='sm'
    >
      {cfg.label}
    </AppTag>
  );
}

function formatDateListID(date) {
  try {
    return dayjs(date).format('DD MMM YYYY');
  } catch {
    return String(date);
  }
}

function formatDateTimeID(date) {
  try {
    return dayjs(date).format('DD MMM YYYY • HH:mm');
  } catch {
    return String(date);
  }
}

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
      <AppTooltip title={!expanded && String(text || '').length > 100 ? text : undefined}>
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

function ApproveModal({ openRow, polaOptions, onSubmit, onCancel }) {
  const [dateVal, setDateVal] = useState(() => (openRow?.tglMasuk ? dayjs(openRow.tglMasuk) : dayjs()));
  const [polaId, setPolaId] = useState(undefined);
  const canSubmit = Boolean(dateVal) && Boolean(polaId);

  useEffect(() => {
    setDateVal(openRow?.tglMasuk ? dayjs(openRow.tglMasuk) : dayjs());
    setPolaId(undefined);
  }, [openRow]);

  return (
    <AppModal
      title='Setujui Pengajuan Cuti'
      open={!!openRow}
      onClose={onCancel}
      width={520}
      maskClosable={false}
      destroyOnClose
      footer={({ close }) => (
        <div className='flex justify-end gap-2'>
          <AppButton
            variant='outline'
            onClick={close}
          >
            Batal
          </AppButton>
          <AppButton
            colors={GREEN_BUTTON}
            variant='primary'
            icon={<CheckOutlined />}
            disabled={!canSubmit}
            onClick={async () => {
              if (!canSubmit) return;
              await onSubmit({
                date: dateVal.format('YYYY-MM-DD'),
                id_pola_kerja: String(polaId),
              });
            }}
          >
            Setujui Pengajuan
          </AppButton>
        </div>
      )}
    >
      <div className='space-y-4'>
        <div className='bg-blue-50 border border-blue-200 rounded-lg p-3'>
          <div className='flex items-center gap-2 text-sm font-medium text-blue-900 mb-1'>
            <UserOutlined />
            Informasi Karyawan
          </div>
          <div className='text-sm text-blue-700'>
            {openRow?.nama} • {openRow?.jabatanDivisi}
          </div>
        </div>

        <div className='space-y-3'>
          <div>
            <label className='block text-sm font-medium text-gray-700 mb-2'>Tanggal Masuk Kerja *</label>
            <AppDatePicker
              className='w-full'
              value={dateVal}
              onChange={(d) => setDateVal(d ?? null)}
              format='DD MMM YYYY'
              placeholder='Pilih tanggal masuk'
              size='middle'
            />
          </div>

          <div>
            <label className='block text-sm font-medium text-gray-700 mb-2'>Pola Kerja *</label>
            <AppSelect
              className='w-full'
              showSearch
              optionFilterProp='label'
              placeholder='Pilih pola kerja'
              value={polaId}
              onChange={setPolaId}
              options={polaOptions}
            />
            <div className='mt-2 text-xs text-gray-500'>Pola kerja yang dipilih akan diterapkan pada tanggal masuk kerja.</div>
          </div>
        </div>
      </div>
    </AppModal>
  );
}

export default function CutiContent() {
  const vm = useCutiViewModel();

  const [rejectRow, setRejectRow] = useState(null);
  const [reason, setReason] = useState('');
  const [approveRow, setApproveRow] = useState(null);
  const [expandedKeterangan, setExpandedKeterangan] = useState(new Set());
  const [expandedHandover, setExpandedHandover] = useState(new Set());

  const [previewDocUrl, setPreviewDocUrl] = useState(null);
  const [previewDocTitle, setPreviewDocTitle] = useState('');

  const toggleKeterangan = (id) =>
    setExpandedKeterangan((prev) => {
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
        onCell: () => ({ style: { verticalAlign: 'top' } }),
        align: 'center',
        render: (_, __, index) => <div className='text-sm font-medium text-gray-600'>{(vm.page - 1) * vm.pageSize + index + 1}</div>,
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
              size='xl'
              bordered
              tooltip={r.nama}
            />
            <div className='min-w-0 flex-1'>
              <div className='font-semibold text-gray-900 text-sm mb-0.5 truncate'>{r.nama}</div>
              <div className='text-xs text-gray-600 truncate'>{r.jabatanDivisi}</div>

              <div className='mt-2 flex items-center gap-1 text-xs text-gray-500'>
                <ClockCircleOutlined />
                <span>{formatDateTimeID(r.tglPengajuan)}</span>
              </div>

              <div className='mt-2'>
                <StatusTag status={r.status} />
              </div>
            </div>
          </div>
        ),
      },
      {
        title: 'DETAIL PENGAJUAN',
        key: 'detail',
        render: (_, r) => {
          const expKet = expandedKeterangan.has(r.id);
          const expHan = expandedHandover.has(r.id);

          return (
            <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
              <MiniField label='Jenis Cuti'>
                <div className='flex items-center gap-2'>
                  <div className='w-2 h-2 bg-blue-500 rounded-full' />
                  <span className='font-medium'>{r.jenisCuti}</span>
                </div>
              </MiniField>

              <MiniField label='Tanggal Pengajuan'>{formatDateTimeID(r.tglPengajuan)}</MiniField>

              <MiniField label='Total Hari Cuti'>
                <div className='flex items-center gap-2'>
                  <CalendarOutlined className='text-blue-600' />
                  <span className='font-semibold'>{r.totalHariCuti} hari</span>
                </div>
              </MiniField>

              <MiniField
                label='Tanggal Cuti'
                className='lg:col-span-3'
              >
                <div className='bg-gray-50 rounded-lg p-3'>
                  {Array.isArray(r.tglCutiList) && r.tglCutiList.length ? (
                    <div className='flex flex-wrap gap-2'>
                      {r.tglCutiList.map((d, idx) => (
                        <div
                          key={idx}
                          className='flex items-center gap-2 bg-white px-3 py-2 rounded-lg border border-gray-200'
                        >
                          <CalendarOutlined className='text-gray-400 text-xs' />
                          <span className='text-sm font-medium text-gray-700'>{formatDateListID(d)}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <span className='text-gray-500'>—</span>
                  )}
                </div>
              </MiniField>

              <MiniField label='Tanggal Masuk Kerja'>
                {r.tglMasuk ? (
                  <div className='flex items-center gap-2 text-green-700 font-medium'>
                    <CheckOutlined />
                    {formatDateListID(r.tglMasuk)}
                  </div>
                ) : (
                  '—'
                )}
              </MiniField>

              <MiniField
                label='Keterangan'
                className='lg:col-span-3'
              >
                <div className='bg-gray-50 rounded-lg p-3'>
                  <TextClampCell
                    text={r.keterangan}
                    expanded={expKet}
                    onToggle={() => toggleKeterangan(r.id)}
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
                              size='xs'
                              tooltip={u.name}
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
                  variant={r.buktiUrl ? 'primary' : 'outline'}
                  icon={<FileTextOutlined />}
                  size='small'
                  disabled={!r.buktiUrl}
                  onClick={() => {
                    if (!r.buktiUrl) return;
                    setPreviewDocUrl(r.buktiUrl);
                    setPreviewDocTitle(`Dokumen pendukung - ${r.nama || ''}`);
                  }}
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
        width: 220,
        fixed: 'right',
        onCell: () => ({ style: { verticalAlign: 'top' } }),
        render: (_, r) => {
          if (vm.tab === 'pengajuan') {
            return (
              <AppSpace
                direction='vertical'
                size='xs'
                className='w-full'
              >
                <AppButton
                  colors={GREEN_BUTTON}
                  variant='primary'
                  icon={<CheckOutlined />}
                  className='w-full'
                  onClick={() => setApproveRow(r)}
                  size='small'
                >
                  Setujui
                </AppButton>

                <AppButton
                  variant='danger'
                  icon={<CloseOutlined />}
                  className='w-full'
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
            <div className={['rounded-lg p-3 border', isApproved ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'].join(' ')}>
              <div className={['text-xs font-semibold mb-1', isApproved ? 'text-green-700' : 'text-red-700'].join(' ')}>{isApproved ? 'Disetujui Pada' : 'Ditolak Pada'}</div>

              <div className={['text-sm font-medium', isApproved ? 'text-green-900' : 'text-red-900'].join(' ')}>{formatDateTimeID(r.tglKeputusan)}</div>

              {r.alasan && (
                <div className='mt-3'>
                  <div className={['text-xs font-semibold mb-1', isApproved ? 'text-green-700' : 'text-red-700'].join(' ')}>Catatan</div>
                  <div className={['text-sm rounded p-2', isApproved ? 'bg-white/60 text-green-900' : 'bg-white/60 text-red-900'].join(' ')}>{r.alasan}</div>
                </div>
              )}
            </div>
          );
        },
      },
    ];
  }, [expandedHandover, expandedKeterangan, vm.page, vm.pageSize, vm.tab]);

  const dataSource = useMemo(() => vm.filteredData.map((d) => ({ key: d.id, ...d })), [vm.filteredData]);

  const tabItems = useMemo(() => {
    const TabLabel = ({ text, count, tone }) => {
      const toneCls = tone === 'success' ? 'bg-emerald-100 text-emerald-800' : tone === 'danger' ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-800';

      return (
        <div className='inline-flex items-center gap-3 px-4 py-2'>
          <span className='font-semibold'>{text}</span>
          <span className={['inline-flex items-center justify-center', 'h-6 min-w-6 px-2 rounded-full text-xs font-bold', toneCls].join(' ')}>{count}</span>
        </div>
      );
    };

    return [
      {
        key: 'pengajuan',
        label: (
          <TabLabel
            text='Pengajuan'
            count={counts.pengajuan}
            tone='warning'
          />
        ),
      },
      {
        key: 'disetujui',
        label: (
          <TabLabel
            text='Disetujui'
            count={counts.disetujui}
            tone='success'
          />
        ),
      },
      {
        key: 'ditolak',
        label: (
          <TabLabel
            text='Ditolak'
            count={counts.ditolak}
            tone='danger'
          />
        ),
      },
    ];
  }, [counts]);

  return (
    <div className='min-h-screen bg-gray-50 p-6'>
      <div className='mb-6'>
        <div className='flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4'>
          <div>
            <h1 className='text-2xl font-bold text-gray-900 mb-2'>Manajemen Pengajuan Cuti</h1>
            <p className='text-gray-600 text-sm'>Kelola dan pantau semua pengajuan cuti karyawan dalam satu tempat</p>
          </div>

          <div className='flex items-center gap-3'>
            <Link href='/home/pengajuan/cuti/konfigurasi_cuti'>
              <AppButton
                variant='outline'
                icon={<SettingOutlined />}
              >
                Konfigurasi Kuota Cuti
              </AppButton>
            </Link>
          </div>
        </div>
      </div>

      <AppCard className='shadow-sm border-0'>
        <AppTabs
          activeKey={vm.tab}
          onChange={vm.setTab}
          size='large'
          items={tabItems.map((t) => ({
            key: t.key,
            label: t.label,
            badge: t.badge,
            children: (
              <div className='mt-6'>
                <div className='flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6'>
                  <div>
                    <h2 className='text-lg font-semibold text-gray-900'>Daftar {t.label}</h2>
                    <p className='text-gray-500 text-sm mt-1'>
                      Menampilkan {dataSource.length} dari {counts[t.key]} pengajuan
                    </p>
                  </div>
                </div>

                <ApprovalTable
                  columns={columns}
                  dataSource={dataSource}
                  page={vm.page}
                  pageSize={vm.pageSize}
                  total={counts[vm.tab]}
                  loading={vm.loading}
                  onChangePage={(current, pageSize) => vm.changePage(current, pageSize)}
                />
              </div>
            ),
          }))}
        />
      </AppCard>

      {/* Modal preview dokumen */}
      <AppModal
        title={previewDocTitle || 'Preview Dokumen'}
        open={!!previewDocUrl}
        onClose={() => {
          setPreviewDocUrl(null);
          setPreviewDocTitle('');
        }}
        footer={null}
        width={860}
        styles={{ body: { padding: 0 } }}
        centered
        destroyOnClose
      >
        {previewDocUrl && (
          <div style={{ height: '75vh' }}>
            {/\.(png|jpe?g|gif|webp)$/i.test(previewDocUrl) ? (
              // eslint-disable-next-line @next/next/no-img-element
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

      {/* Modal Penolakan */}
      <AppModal
        title='Tolak Pengajuan Cuti'
        open={!!rejectRow}
        onClose={() => {
          setRejectRow(null);
          setReason('');
        }}
        width={520}
        maskClosable={false}
        destroyOnClose
        variant='danger'
        okText='Tolak Pengajuan'
        cancelText='Batal'
        okDisabled={!String(reason || '').trim()}
        onOk={async () => {
          const r = String(reason || '').trim();
          if (!r) {
            AppMessage.error('Alasan wajib diisi saat menolak.');
            return false;
          }
          const ok = await vm.reject(rejectRow.id, r);
          if (ok) {
            setRejectRow(null);
            setReason('');
            return true;
          }
          return false;
        }}
      >
        <div className='space-y-4'>
          <div className='bg-red-50 border border-red-200 rounded-lg p-3'>
            <div className='flex items-center gap-2 text-sm font-medium text-red-900'>
              <InfoCircleOutlined />
              Konfirmasi Penolakan
            </div>
            <div className='text-sm text-red-700 mt-1'>
              Anda akan menolak pengajuan cuti dari <strong>{rejectRow?.nama}</strong>
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

      {/* Modal Persetujuan */}
      <ApproveModal
        openRow={approveRow}
        polaOptions={vm.polaOptions}
        onCancel={() => setApproveRow(null)}
        onSubmit={async (returnShift) => {
          await vm.approve(approveRow.id, null, returnShift);
          setApproveRow(null);
        }}
      />

      <style
        jsx
        global
      >{`
        :root {
          --cuti-primary: ${PRIMARY_COLOR};
        }
      `}</style>
    </div>
  );
}
