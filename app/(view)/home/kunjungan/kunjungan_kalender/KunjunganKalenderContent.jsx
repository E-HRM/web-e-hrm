'use client';

import './fullcalendar.css';

import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useCallback, useMemo, useState } from 'react';
import { EditOutlined, EnvironmentOutlined, PictureOutlined, SaveOutlined, CloseOutlined, ProfileOutlined, ClockCircleOutlined, DeleteOutlined, ExclamationCircleFilled } from '@ant-design/icons';

import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
dayjs.extend(utc);

import useVM from './useKunjunganKalenderViewModel';

import AppCard from '../../../component_shared/AppCard';
import AppModal from '../../../component_shared/AppModal';
import AppSelect from '../../../component_shared/AppSelect';
import AppDatePicker from '../../../component_shared/AppDatePicker';
import AppTimePicker from '../../../component_shared/AppTimePicker';
import AppInput from '../../../component_shared/AppInput';
import AppMessage from '../../../component_shared/AppMessage';
import AppTooltip from '../../../component_shared/AppTooltip';
import AppButton from '../../../component_shared/AppButton';
import AppSegmented from '../../../component_shared/AppSegmented';
import AppDivider from '../../../component_shared/AppDivider';
import AppImagePreview from '../../../component_shared/AppImagePreview';

const FullCalendar = dynamic(() => import('@fullcalendar/react'), { ssr: false });
import interactionPlugin from '@fullcalendar/interaction';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import listPlugin from '@fullcalendar/list';

const NAVY = '#003A6F';

function CircleImg({ src, size = 44, alt = 'Avatar' }) {
  const s = {
    width: size,
    height: size,
    borderRadius: '9999px',
    overflow: 'hidden',
    border: `1px solid ${NAVY}22`,
    background: '#E6F0FA',
    flexShrink: 0,
    display: 'inline-block',
  };
  return (
    <span
      style={s}
      className='shrink-0'
    >
      <img
        src={src || '/avatar-placeholder.jpg'}
        alt={alt}
        style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
        onError={(e) => {
          e.currentTarget.src = '/avatar-placeholder.jpg';
          e.currentTarget.onerror = null;
        }}
      />
    </span>
  );
}

const parseForPicker = (v) => {
  if (!v) return null;
  const s = String(v);
  return s.endsWith('Z') || /[+-]\d{2}:\d{2}$/.test(s) ? dayjs.utc(s) : dayjs(s);
};

export default function KunjunganKalenderContent() {
  const vm = useVM();

  const [openCreate, setOpenCreate] = useState(false);
  const [createVal, setCreateVal] = useState({
    user_ids: [],
    id_kategori_kunjungan: undefined,
    tanggal: null,
    jam_mulai: null,
    jam_selesai: null,
    deskripsi: '',
  });
  const [createErr, setCreateErr] = useState({
    user_ids: '',
    id_kategori_kunjungan: '',
    tanggal: '',
  });
  const [savingCreate, setSavingCreate] = useState(false);

  const [openDetail, setOpenDetail] = useState(false);
  const [editing, setEditing] = useState(false);
  const [activeRow, setActiveRow] = useState(null);
  const [editVal, setEditVal] = useState({
    id_kategori_kunjungan: undefined,
    tanggal: null,
    jam_mulai: null,
    jam_selesai: null,
    deskripsi: '',
  });
  const [editErr, setEditErr] = useState({
    id_kategori_kunjungan: '',
    tanggal: '',
  });
  const [savingEdit, setSavingEdit] = useState(false);

  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);

  const [photoOpen, setPhotoOpen] = useState(false);
  const [photoSrc, setPhotoSrc] = useState(null);

  const [mapOpen, setMapOpen] = useState(false);
  const [mapEmbedUrl, setMapEmbedUrl] = useState(null);
  const [mapWhich, setMapWhich] = useState('start');

  const resetCreate = useCallback(() => {
    setCreateVal({
      user_ids: [],
      id_kategori_kunjungan: undefined,
      tanggal: null,
      jam_mulai: null,
      jam_selesai: null,
      deskripsi: '',
    });
    setCreateErr({ user_ids: '', id_kategori_kunjungan: '', tanggal: '' });
    setSavingCreate(false);
  }, []);

  const resetEdit = useCallback(() => {
    setEditing(false);
    setEditVal({
      id_kategori_kunjungan: undefined,
      tanggal: null,
      jam_mulai: null,
      jam_selesai: null,
      deskripsi: '',
    });
    setEditErr({ id_kategori_kunjungan: '', tanggal: '' });
    setSavingEdit(false);
  }, []);

  const validateCreate = useCallback(() => {
    const err = { user_ids: '', id_kategori_kunjungan: '', tanggal: '' };

    if (!Array.isArray(createVal.user_ids) || createVal.user_ids.length === 0) {
      err.user_ids = 'Pilih setidaknya satu karyawan';
    }
    if (!!vm.kategoriRequired && !createVal.id_kategori_kunjungan) {
      err.id_kategori_kunjungan = 'Pilih kategori';
    }
    if (!createVal.tanggal) {
      err.tanggal = 'Pilih tanggal';
    }

    setCreateErr(err);
    return !(err.user_ids || err.id_kategori_kunjungan || err.tanggal);
  }, [createVal, vm.kategoriRequired]);

  const validateEdit = useCallback(() => {
    const err = { id_kategori_kunjungan: '', tanggal: '' };

    if (!!vm.kategoriRequired && !editVal.id_kategori_kunjungan) {
      err.id_kategori_kunjungan = 'Pilih Kategori';
    }
    if (!editVal.tanggal) {
      err.tanggal = 'Pilih tanggal';
    }

    setEditErr(err);
    return !(err.id_kategori_kunjungan || err.tanggal);
  }, [editVal, vm.kategoriRequired]);

  const onDateClick = useCallback(
    (arg) => {
      resetCreate();
      setCreateVal((s) => ({ ...s, tanggal: dayjs(arg.date) }));
      setOpenCreate(true);
    },
    [resetCreate]
  );

  const handleDatesSet = useCallback(
    (info) => {
      vm.setRange({ start: info.start, end: info.end });
    },
    [vm]
  );

  const onEventClick = useCallback(
    (clickInfo) => {
      const r = clickInfo.event?.extendedProps?.raw || null;
      if (!r) return;

      setActiveRow(r);
      resetEdit();

      const dateVal = r.tanggal ? dayjs(r.tanggal) : r.jam_mulai ? parseForPicker(r.jam_mulai) : r.jam_selesai ? parseForPicker(r.jam_selesai) : null;

      setEditVal({
        id_kategori_kunjungan: r.id_kategori_kunjungan || r?.kategori?.id_kategori_kunjungan || undefined,
        tanggal: dateVal ? dayjs(dateVal) : null,
        jam_mulai: r.jam_mulai ? parseForPicker(r.jam_mulai) : null,
        jam_selesai: r.jam_selesai ? parseForPicker(r.jam_selesai) : null,
        deskripsi: r.deskripsi || '',
      });

      setOpenDetail(true);
    },
    [resetEdit]
  );

  const submitCreate = useCallback(async () => {
    if (!validateCreate()) return;

    try {
      setSavingCreate(true);
      await vm.createPlansForUsers({
        userIds: createVal.user_ids,
        tanggal: createVal.tanggal?.toDate(),
        jam_mulai: createVal.jam_mulai?.toDate() || null,
        jam_selesai: createVal.jam_selesai?.toDate() || null,
        deskripsi: createVal.deskripsi,
        kategoriId: createVal.id_kategori_kunjungan || null,
      });
      setOpenCreate(false);
      AppMessage.success('Jadwal Kunjungan tersimpan');
    } catch (e) {
      AppMessage.error(e?.message || 'Gagal menyimpan');
    } finally {
      setSavingCreate(false);
    }
  }, [createVal, validateCreate, vm]);

  const submitEdit = useCallback(async () => {
    if (!activeRow?.id_kunjungan) {
      AppMessage.error('Data kunjungan tidak valid');
      return;
    }
    if (!validateEdit()) return;

    try {
      setSavingEdit(true);
      await vm.updatePlan(activeRow.id_kunjungan, {
        tanggal: editVal.tanggal?.toDate() || null,
        jam_mulai: editVal.jam_mulai?.toDate() || null,
        jam_selesai: editVal.jam_selesai?.toDate() || null,
        deskripsi: editVal.deskripsi,
        id_kategori_kunjungan: editVal.id_kategori_kunjungan,
      });
      AppMessage.success('Kunjungan berhasil diperbarui');
      setEditing(false);
      setOpenDetail(false);
    } catch (e) {
      AppMessage.error(e?.message || 'Gagal Memperbarui Kunjungan');
    } finally {
      setSavingEdit(false);
    }
  }, [activeRow, editVal, validateEdit, vm]);

  const canDelete = useMemo(() => {
    const st = String(activeRow?.status_kunjungan || '').toLowerCase();
    return st !== 'selesai';
  }, [activeRow]);

  const isDone = useMemo(() => !canDelete, [canDelete]);

  const userInfo = useMemo(() => {
    if (!activeRow) return null;
    const u = vm.getUserById(activeRow.id_user);
    return {
      user: u,
      name: u?.nama_pengguna || u?.name || u?.email || activeRow.id_user,
      photo: vm.getPhotoUrl(u) || '/avatar-placeholder.jpg',
      sub: vm.getJabatanName(u) || vm.getDepartemenName(u) || '—',
      link: u?.id_user ? `/home/kelola_karyawan/karyawan/${u.id_user}` : null,
    };
  }, [activeRow, vm]);

  const statusClass = (st) => {
    const s = String(st || '').toLowerCase();
    if (s === 'selesai') return 'fc-chip fc-chip--done';
    if (s === 'ditunda' || s === 'berlangsung') return 'fc-chip fc-chip--hold';
    return 'fc-chip fc-chip--proc';
  };

  const photoAvailable = activeRow ? !!vm.pickPhotoUrl(activeRow) : false;
  const startCoord = activeRow ? vm.getStartCoord(activeRow) : { lat: null, lon: null };
  const endCoord = activeRow ? vm.getEndCoord(activeRow) : { lat: null, lon: null };
  const startMapOk = !!vm.makeOsmEmbed(startCoord.lat, startCoord.lon);
  const endMapOk = !!vm.makeOsmEmbed(endCoord.lat, endCoord.lon);

  const openPhotoModal = useCallback(() => {
    if (!activeRow) return;
    const photo = vm.pickPhotoUrl(activeRow);
    setPhotoSrc(photo);
    setPhotoOpen(!!photo);
  }, [activeRow, vm]);

  const openMapModal = useCallback(
    (which = 'start') => {
      if (!activeRow) return;
      const { lat, lon } = which === 'end' ? endCoord : startCoord;
      const url = vm.makeOsmEmbed(lat, lon);
      if (!url) return;
      setMapWhich(which);
      setMapEmbedUrl(url);
      setMapOpen(true);
    },
    [activeRow, startCoord, endCoord, vm]
  );

  const requestDelete = useCallback(() => {
    if (!activeRow?.id_kunjungan) return;
    if (!canDelete) return;
    setConfirmDeleteOpen(true);
  }, [activeRow, canDelete]);

  const onConfirmDelete = useCallback(async () => {
    if (!activeRow?.id_kunjungan) return;
    try {
      await vm.deletePlan(activeRow.id_kunjungan);
      AppMessage.success('Kunjungan dihapus.');
      setConfirmDeleteOpen(false);
      setEditing(false);
      setOpenDetail(false);
    } catch (e) {
      AppMessage.error(e?.message || 'Gagal menghapus kunjungan');
    }
  }, [activeRow, vm]);

  const renderEventContent = (info) => {
    const r = info.event.extendedProps?.raw || {};
    const jam = info.timeText ? info.timeText.replace(':', '.') : '';
    const kategori = r?.kategori?.kategori_kunjungan || '-';

    const uid = r?.id_user ?? info.event.extendedProps?.id_user ?? r?.user?.id_user;
    const fromMap = uid ? vm.getUserById(uid) : null;
    const userObj = fromMap || r?.user || info.event.extendedProps?.user || {};
    const nama = userObj?.nama_pengguna || userObj?.name || userObj?.email || String(uid || '—');

    const stDb = (r?.status_kunjungan || info.event.extendedProps?.status || '').toLowerCase();
    const stText = vm.displayStatusLabel(stDb) || '-';

    const dotColor = info.event.backgroundColor || info.event.borderColor || '#3b82f6';
    const titleText = [jam, kategori, nama].filter(Boolean).join(' · ');

    return (
      <div className='fc-event-custom'>
        <span
          className='fc-dot'
          style={{ backgroundColor: dotColor }}
        />
        <span
          className='fc-title-ellipsis'
          title={`${titleText} · ${stText}`}
        >
          {titleText}
        </span>
        {stDb ? <span className={statusClass(stDb)}>{stText}</span> : null}
      </div>
    );
  };

  const fieldLabel = (label, required) => (
    <div
      className='mb-1'
      style={{ fontSize: 13, fontWeight: 600, color: '#0f172a' }}
    >
      {label}
      {required ? <span style={{ color: '#ef4444' }}> *</span> : null}
    </div>
  );

  const fieldError = (msg) =>
    msg ? (
      <div
        className='mt-1'
        style={{ fontSize: 12, color: '#ef4444' }}
      >
        {msg}
      </div>
    ) : null;

  return (
    <>
      <div className='p-4'>
        <AppCard
          title={<span className='text-lg font-semibold'>Kalender Kunjungan</span>}
          styles={{ body: { paddingTop: 16 } }}
        >
          <FullCalendar
            height='auto'
            plugins={[dayGridPlugin, timeGridPlugin, listPlugin, interactionPlugin]}
            initialView='dayGridMonth'
            headerToolbar={{
              left: 'prev,next today',
              center: 'title',
              right: 'dayGridMonth,timeGridWeek,timeGridDay,listWeek',
            }}
            locale='id'
            timeZone='local'
            dayMaxEventRows={3}
            moreLinkClick='popover'
            selectable
            selectMirror
            datesSet={handleDatesSet}
            dateClick={onDateClick}
            eventClick={onEventClick}
            events={vm.events}
            eventTimeFormat={{ hour: '2-digit', minute: '2-digit', hour12: false }}
            eventContent={renderEventContent}
          />
        </AppCard>
      </div>

      {/* CREATE MODAL */}
      <AppModal
        open={openCreate}
        onClose={() => {
          setOpenCreate(false);
        }}
        title='Buat Jadwal Kunjungan'
        footer={false}
        destroyOnClose
        zIndex={1250}
      >
        <div className='space-y-4'>
          <div>
            {fieldLabel('Karyawan', true)}
            <AppSelect
              mode='multiple'
              placeholder='Pilih Karyawan'
              value={createVal.user_ids}
              onChange={(v) => {
                setCreateVal((s) => ({ ...s, user_ids: v }));
                setCreateErr((e) => ({ ...e, user_ids: '' }));
              }}
              options={vm.userOptions}
              showSearch
              optionFilterProp='label'
              listHeight={400}
              virtual
              loading={!vm.userOptions?.length}
              style={{ width: '100%' }}
            />
            {fieldError(createErr.user_ids)}
          </div>

          <div>
            {fieldLabel('Kategori Kunjungan', !!vm.kategoriRequired)}
            <AppSelect
              placeholder='Pilih kategori'
              value={createVal.id_kategori_kunjungan}
              onChange={(v) => {
                setCreateVal((s) => ({ ...s, id_kategori_kunjungan: v }));
                setCreateErr((e) => ({ ...e, id_kategori_kunjungan: '' }));
              }}
              options={vm.kategoriOptions}
              allowClear
              showSearch
              optionFilterProp='label'
              style={{ width: '100%' }}
            />
            {fieldError(createErr.id_kategori_kunjungan)}
          </div>

          <div>
            {fieldLabel('Tanggal', true)}
            <AppDatePicker
              value={createVal.tanggal}
              onChange={(v) => {
                setCreateVal((s) => ({ ...s, tanggal: v || null }));
                setCreateErr((e) => ({ ...e, tanggal: '' }));
              }}
              className='w-full'
            />
            {fieldError(createErr.tanggal)}
          </div>

          <div className='grid grid-cols-2 gap-2'>
            <div>
              {fieldLabel('Jam mulai', false)}
              <AppTimePicker
                value={createVal.jam_mulai}
                onChange={(v) => setCreateVal((s) => ({ ...s, jam_mulai: v || null }))}
                format='HH:mm'
                className='w-full'
              />
            </div>
            <div>
              {fieldLabel('Jam selesai', false)}
              <AppTimePicker
                value={createVal.jam_selesai}
                onChange={(v) => setCreateVal((s) => ({ ...s, jam_selesai: v || null }))}
                format='HH:mm'
                className='w-full'
              />
            </div>
          </div>

          <div>
            {fieldLabel('Deskripsi', false)}
            <AppInput
              type='textarea'
              placeholder='Opsional'
              value={createVal.deskripsi}
              onChange={(e) => setCreateVal((s) => ({ ...s, deskripsi: e?.target?.value ?? '' }))}
              rows={3}
            />
          </div>

          <div className='flex justify-end gap-2'>
            <AppButton
              variant='ghost'
              icon={<CloseOutlined />}
              onClick={() => {
                setOpenCreate(false);
                resetCreate();
              }}
              disabled={savingCreate}
            >
              Cancel
            </AppButton>
            <AppButton
              variant='primary'
              icon={<SaveOutlined />}
              onClick={submitCreate}
              loading={savingCreate}
            >
              Save
            </AppButton>
          </div>
        </div>
      </AppModal>

      {/* DETAIL / EDIT MODAL */}
      <AppModal
        open={openDetail}
        onClose={() => {
          setOpenDetail(false);
          resetEdit();
        }}
        title={
          <div className='flex items-center gap-2'>
            <ProfileOutlined />
            <span>Detail Kunjungan</span>
          </div>
        }
        footer={false}
        destroyOnClose
        width={760}
        maskClosable={false}
        zIndex={2600}
        getContainer={() => document.body}
      >
        {!activeRow ? null : (
          <>
            <div className='flex items-start gap-3'>
              <CircleImg
                src={userInfo?.photo}
                size={48}
                alt={userInfo?.name || 'Avatar'}
              />
              <div className='min-w-0'>
                <div
                  style={{ fontWeight: 700, fontSize: 16 }}
                  className='truncate'
                >
                  {userInfo?.link ? (
                    <Link
                      href={userInfo.link}
                      className='no-underline'
                      style={{ color: '#0f172a' }}
                    >
                      {userInfo?.name}
                    </Link>
                  ) : (
                    userInfo?.name
                  )}
                </div>

                <div
                  style={{ color: '#64748b', marginTop: 2 }}
                  className='truncate'
                >
                  {userInfo?.sub || '—'}
                </div>

                <div className='mt-3 flex flex-wrap items-center gap-2'>
                  {activeRow?.status_kunjungan ? <span className={statusClass(activeRow.status_kunjungan)}>{vm.displayStatusLabel(activeRow.status_kunjungan)}</span> : null}

                  {activeRow?.kategori?.kategori_kunjungan ? <span className='fc-chip'>{activeRow.kategori.kategori_kunjungan}</span> : null}

                  <div
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 8,
                      padding: '6px 10px',
                      border: '1px solid #e5e7eb',
                      borderRadius: 999,
                      fontSize: 12,
                      color: '#334155',
                      background: '#fafafa',
                    }}
                  >
                    <ClockCircleOutlined />
                    <span>{vm.formatPeriod(activeRow)}</span>
                  </div>
                </div>
              </div>
            </div>

            <AppDivider style={{ margin: '14px 0 12px' }} />

            {editing ? (
              <div className='space-y-4'>
                <div>
                  {fieldLabel('Kategori Kunjungan', !!vm.kategoriRequired)}
                  <AppSelect
                    placeholder='Pilih kategori'
                    value={editVal.id_kategori_kunjungan}
                    onChange={(v) => {
                      setEditVal((s) => ({ ...s, id_kategori_kunjungan: v }));
                      setEditErr((e) => ({ ...e, id_kategori_kunjungan: '' }));
                    }}
                    options={vm.kategoriOptions}
                    allowClear
                    showSearch
                    optionFilterProp='label'
                    style={{ width: '100%' }}
                  />
                  {fieldError(editErr.id_kategori_kunjungan)}
                </div>

                <div>
                  {fieldLabel('Tanggal', true)}
                  <AppDatePicker
                    value={editVal.tanggal}
                    onChange={(v) => {
                      setEditVal((s) => ({ ...s, tanggal: v || null }));
                      setEditErr((e) => ({ ...e, tanggal: '' }));
                    }}
                    className='w-full'
                  />
                  {fieldError(editErr.tanggal)}
                </div>

                <div className='grid grid-cols-2 gap-2'>
                  <div>
                    {fieldLabel('Jam mulai', false)}
                    <AppTimePicker
                      value={editVal.jam_mulai}
                      onChange={(v) => setEditVal((s) => ({ ...s, jam_mulai: v || null }))}
                      format='HH:mm'
                      className='w-full'
                    />
                  </div>
                  <div>
                    {fieldLabel('Jam selesai', false)}
                    <AppTimePicker
                      value={editVal.jam_selesai}
                      onChange={(v) => setEditVal((s) => ({ ...s, jam_selesai: v || null }))}
                      format='HH:mm'
                      className='w-full'
                    />
                  </div>
                </div>

                <div>
                  {fieldLabel('Deskripsi', false)}
                  <AppInput
                    type='textarea'
                    placeholder='Optional notes'
                    value={editVal.deskripsi}
                    onChange={(e) => setEditVal((s) => ({ ...s, deskripsi: e?.target?.value ?? '' }))}
                    rows={3}
                  />
                </div>

                <div className='flex justify-end gap-2 mt-2'>
                  <AppButton
                    variant='ghost'
                    icon={<CloseOutlined />}
                    onClick={() => {
                      setEditing(false);
                      setEditErr({ id_kategori_kunjungan: '', tanggal: '' });
                    }}
                    disabled={savingEdit}
                  >
                    Cancel
                  </AppButton>

                  <AppButton
                    variant='danger'
                    icon={<DeleteOutlined />}
                    disabled={isDone || savingEdit}
                    onClick={requestDelete}
                  >
                    Delete
                  </AppButton>

                  <AppButton
                    variant='primary'
                    icon={<SaveOutlined />}
                    onClick={submitEdit}
                    loading={savingEdit}
                  >
                    Save
                  </AppButton>
                </div>
              </div>
            ) : (
              <>
                <div style={{ fontSize: 14, color: '#0f172a', whiteSpace: 'pre-wrap' }}>{activeRow?.deskripsi || '—'}</div>

                <div className='flex justify-end gap-2 mt-12'>
                  <AppTooltip title='View photo'>
                    <AppButton
                      size='large'
                      shape='circle'
                      icon={<PictureOutlined />}
                      onClick={openPhotoModal}
                      disabled={!photoAvailable}
                      variant='outline'
                    />
                  </AppTooltip>

                  <AppTooltip title='View start location'>
                    <AppButton
                      size='large'
                      shape='circle'
                      icon={<EnvironmentOutlined />}
                      onClick={() => openMapModal('start')}
                      disabled={!startMapOk}
                      variant='outline'
                    />
                  </AppTooltip>

                  <AppTooltip title='View end location'>
                    <AppButton
                      size='large'
                      shape='circle'
                      icon={<EnvironmentOutlined />}
                      onClick={() => openMapModal('end')}
                      disabled={!endMapOk}
                      variant='outline'
                    />
                  </AppTooltip>

                  <AppTooltip title={isDone ? 'Tidak bisa hapus (status selesai)' : 'Hapus Kunjungan'}>
                    <AppButton
                      size='large'
                      shape='circle'
                      icon={<DeleteOutlined />}
                      disabled={isDone}
                      onClick={requestDelete}
                      variant='danger'
                    />
                  </AppTooltip>

                  <AppTooltip title='Edit visit'>
                    <AppButton
                      size='large'
                      shape='circle'
                      icon={<EditOutlined />}
                      onClick={() => setEditing(true)}
                      variant='outline'
                    />
                  </AppTooltip>
                </div>
              </>
            )}
          </>
        )}
      </AppModal>

      {/* CONFIRM DELETE MODAL */}
      <AppModal
        open={confirmDeleteOpen}
        onClose={() => setConfirmDeleteOpen(false)}
        title={
          <div className='flex items-center gap-2'>
            <ExclamationCircleFilled style={{ color: '#ef4444' }} />
            <span>Hapus kunjungan?</span>
          </div>
        }
        footer={false}
        destroyOnClose
        zIndex={3100}
        width={520}
        getContainer={() => document.body}
      >
        <div style={{ color: '#334155', fontSize: 14 }}>Tindakan ini tidak dapat dibatalkan.</div>

        <div className='flex justify-end gap-2 mt-6'>
          <AppButton
            variant='ghost'
            onClick={() => setConfirmDeleteOpen(false)}
          >
            Batal
          </AppButton>
          <AppButton
            variant='danger'
            icon={<DeleteOutlined />}
            onClick={onConfirmDelete}
            disabled={isDone}
          >
            Hapus
          </AppButton>
        </div>
      </AppModal>

      {/* PHOTO MODAL */}
      <AppModal
        open={photoOpen}
        onClose={() => setPhotoOpen(false)}
        title='Attachment'
        footer={false}
        width={560}
        zIndex={3000}
        getContainer={() => document.body}
      >
        {photoSrc ? (
          <AppImagePreview
            src={photoSrc}
            alt='Attachment'
            style={{ width: '100%', maxWidth: 520, maxHeight: '50vh' }}
            imgStyle={{ objectFit: 'contain' }}
            preview={{ mask: 'Click to zoom', zIndex: 3100 }}
            fallbackSrc='/image-not-found.png'
          />
        ) : (
          <div style={{ opacity: 0.6 }}>No attachment</div>
        )}
      </AppModal>

      {/* MAP MODAL */}
      <AppModal
        open={mapOpen}
        onClose={() => setMapOpen(false)}
        title='Location'
        footer={false}
        width={860}
        zIndex={3050}
        getContainer={() => document.body}
      >
        <div className='mb-2'>
          <AppSegmented
            value={mapWhich}
            onChange={(v) => {
              setMapWhich(v);
              if (!activeRow) return;
              const source = v === 'end' ? vm.getEndCoord(activeRow) : vm.getStartCoord(activeRow);
              const url = vm.makeOsmEmbed(source.lat, source.lon);
              setMapEmbedUrl(url || null);
            }}
            options={[
              { label: 'Start', value: 'start' },
              { label: 'End', value: 'end' },
            ]}
          />
        </div>

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

      <style
        jsx
        global
      >{`
        .fc-popover {
          z-index: 1500 !important;
        }

        /* FIX: kalau font global kamu override, icon FullCalendar jadi kotak */
        .fc .fc-icon,
        .fc .fc-button .fc-icon {
          font-family: 'fcicons' !important;
          speak: none;
          font-style: normal;
          font-weight: normal;
          font-variant: normal;
          text-transform: none;
          line-height: 1;
        }

        .fc .fc-daygrid-event {
          padding: 2px 6px;
        }
        .fc-event-custom {
          display: flex;
          align-items: center;
          gap: 6px;
          min-width: 0;
        }
        .fc-dot {
          width: 8px;
          height: 8px;
          border-radius: 999px;
          flex: 0 0 auto;
          margin-top: 1px;
        }
        .fc-title-ellipsis {
          min-width: 0;
          max-width: 100%;
          overflow: hidden;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          white-space: normal;
          line-height: 1.15;
        }
        .fc-chip {
          display: inline-block;
          padding: 1px 6px;
          border-radius: 999px;
          font-size: 10px;
          line-height: 16px;
          border: 1px solid transparent;
          flex: 0 0 auto;
          background: #f3f4f6;
          color: #334155;
          border-color: #e5e7eb;
        }
        .fc-chip--proc {
          background: #ebf2ff;
          color: #1d4ed8;
          border-color: #dbeafe;
        }
        .fc-chip--hold {
          background: #fff7e6;
          color: #b45309;
          border-color: #fde68a;
        }
        .fc-chip--done {
          background: #eaf7ec;
          color: #15803d;
          border-color: #bbf7d0;
        }
        .fc .fc-daygrid-event a {
          text-decoration: none;
        }
      `}</style>
    </>
  );
}