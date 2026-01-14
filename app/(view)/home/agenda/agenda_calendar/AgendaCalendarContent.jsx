'use client';

import { useMemo, useRef, useState, useEffect, useCallback } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';

import {
  ProfileOutlined,
  ClockCircleOutlined,
  EditOutlined,
  DeleteOutlined,
  PlusOutlined,
  EllipsisOutlined,
} from '@ant-design/icons';

import dayjs from 'dayjs';
import 'dayjs/locale/id';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';

import AppButton from '@/app/(view)/component_shared/AppButton';
import AppModal from '@/app/(view)/component_shared/AppModal';
import AppTooltip from '@/app/(view)/component_shared/AppTooltip';
import AppDivider from '@/app/(view)/component_shared/AppDivider';
import AppDropdown from '@/app/(view)/component_shared/AppDropdown';
import AppMessage from '@/app/(view)/component_shared/AppMessage';
import AppForm, { useAppForm, useAppWatch } from '@/app/(view)/component_shared/AppForm';

import useVM, { showFromDB as showFromDBVM } from './useAgendaCalendarViewModel';

dayjs.locale('id');
dayjs.extend(utc);
dayjs.extend(timezone);

const FullCalendar = dynamic(() => import('@fullcalendar/react'), { ssr: false });

import interactionPlugin from '@fullcalendar/interaction';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import listPlugin from '@fullcalendar/list';

function CircleImg({ src, size = 44, alt = 'Avatar' }) {
  const s = {
    width: size,
    height: size,
    borderRadius: '9999px',
    overflow: 'hidden',
    border: `1px solid #003A6F22`,
    background: '#E6F0FA',
    flexShrink: 0,
    display: 'inline-block',
  };
  return (
    <span style={s} className="shrink-0">
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

function isQuillEmpty(html) {
  if (!html) return true;
  const stripped = html
    .replace(/<p><br><\/p>/gi, '')
    .replace(/<[^>]+>/g, '')
    .trim();
  return stripped.length === 0;
}

const AUDIT_TZ = dayjs.tz.guess();
function formatAuditLocal(v, fmt = 'DD MMM YYYY HH:mm:ss') {
  if (!v) return '—';
  const s = String(v).trim();
  const hasTZ = /Z|[+-]\d{2}:\d{2}$/.test(s);
  const m = hasTZ ? dayjs(s).tz(AUDIT_TZ) : dayjs.utc(s).tz(AUDIT_TZ);
  return m.isValid() ? m.format(fmt) : '—';
}

function normalizeUrgencyLocal(v) {
  const s = (v || '').toString().trim().toUpperCase();
  switch (s) {
    case 'PENTING MENDESAK':
      return { label: 'PENTING MENDESAK', level: 1 };
    case 'TIDAK PENTING TAPI MENDESAK':
    case 'TIDAK PENTING, TAPI MENDESAK':
      return { label: 'TIDAK PENTING TAPI MENDESAK', level: 2 };
    case 'PENTING TAK MENDESAK':
    case 'PENTING TIDAK MENDESAK':
      return { label: 'PENTING TAK MENDESAK', level: 3 };
    case 'TIDAK PENTING TIDAK MENDESAK':
      return { label: 'TIDAK PENTING TIDAK MENDESAK', level: 4 };
    default:
      return s ? { label: s, level: 4 } : null;
  }
}

/* === helpers multiple === */
const uniqYMD = (arr) => {
  const set = new Set();
  (arr || []).forEach((d) => {
    const ymd = dayjs(d).format('YYYY-MM-DD');
    if (ymd) set.add(ymd);
  });
  return Array.from(set);
};

const toDayjs = (v) => {
  if (!v) return null;
  // kalau sudah dayjs
  if (dayjs.isDayjs?.(v)) return v;
  // kalau Date / string
  return dayjs(v);
};

const buildYMDsFromRange = (startDate, endDate, repeatDays = []) => {
  const s0 = toDayjs(startDate);
  const e0 = toDayjs(endDate);
  if (!s0 || !e0) return [];

  const s = s0.startOf('day');
  const e = e0.startOf('day');

  if (!s.isValid() || !e.isValid()) return [];
  if (e.isBefore(s)) return [];

  const dayFilter = new Set((repeatDays || []).map((n) => Number(n)));

  const out = [];
  let cur = s;

  const MAX_DAYS = 370;
  let guard = 0;

  while (cur.isSameOrBefore(e, 'day')) {
    guard += 1;
    if (guard > MAX_DAYS) break;

    const d = cur.day(); // 0..6
    if (dayFilter.size === 0 || dayFilter.has(d)) {
      out.push(cur.format('YYYY-MM-DD'));
    }
    cur = cur.add(1, 'day');
  }

  return out;
};



export default function AgendaCalendarContent() {
  const calRef = useRef(null);
  const vm = useVM();

  const defaultStartTime = dayjs('00:00', 'HH:mm');
  const defaultEndTime = dayjs('23:59', 'HH:mm');

  const [formOpen, setFormOpen] = useState(false);
  const [form] = useAppForm();
  const [editId, setEditId] = useState(null);

  const usersSelected = useAppWatch('users', form) || [];
  const totalUsers = vm.userOptions?.length || 0;

  const [createProgress, setCreateProgress] = useState({
    running: false,
    sent: 0,
    total: 0,
  });

  const [agendaOpen, setAgendaOpen] = useState(false);
  const [agendaForm] = useAppForm();
  const [agendaSaving, setAgendaSaving] = useState(false);

  const [detailOpen, setDetailOpen] = useState(false);
  const [detailEvent, setDetailEvent] = useState(null);

  const [historyOpen, setHistoryOpen] = useState(false);

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmCfg, setConfirmCfg] = useState({
    title: 'Konfirmasi',
    content: null,
    okText: 'OK',
    cancelText: 'Batal',
    variant: 'default',
    onOk: async () => true,
  });

  /* =========================
   *  Modal pilih mode
   * ========================= */
  const [pickOpen, setPickOpen] = useState(false);
  const [pickedDateStr, setPickedDateStr] = useState(null); // YYYY-MM-DD

  // form khusus multiple
  const [multiOpen, setMultiOpen] = useState(false);
  const [multiForm] = useAppForm();
  const [multiSaving, setMultiSaving] = useState(false);

  const openConfirm = useCallback(({ title, content, okText, cancelText, variant, onOk }) => {
    setConfirmCfg({
      title: title ?? 'Konfirmasi',
      content: content ?? null,
      okText: okText ?? 'OK',
      cancelText: cancelText ?? 'Batal',
      variant: variant ?? 'default',
      onOk: typeof onOk === 'function' ? onOk : async () => true,
    });
    setConfirmOpen(true);
  }, []);

  const statusColor = useCallback(
    (st) =>
      st === 'selesai'
        ? 'fc-chip fc-chip--done'
        : st === 'ditunda'
        ? 'fc-chip fc-chip--hold'
        : st === 'teragenda'
        ? 'fc-chip fc-chip--plan'
        : 'fc-chip fc-chip--proc',
    []
  );

  const usersLabelNode = useMemo(
    () => (
      <div className="flex items-center justify-between gap-2">
        <span>Karyawan</span>
        <span className="text-[11px] text-slate-500">
          Dipilih: {usersSelected.length}/{totalUsers}
        </span>
      </div>
    ),
    [usersSelected.length, totalUsers]
  );

  const handleSelectAllUsers = useCallback(() => {
    const allIds = (vm.userOptions || []).map((opt) => opt.value);
    form.setFieldsValue({ users: allIds });
  }, [form, vm.userOptions]);

  const handleClearUsers = useCallback(() => {
    form.setFieldsValue({ users: [] });
  }, [form]);

  /* =========================================
   *  SINGLE: create / edit
   * ========================================= */
  const openCreateSingle = useCallback(
    (startStr) => {
      setEditId(null);
      const baseDay = startStr ? dayjs(startStr) : dayjs();
      const start = baseDay.startOf('day');
      const end = baseDay.hour(23).minute(59);

      form.setFieldsValue({
        title: '',
        status: 'teragenda',
        users: [],
        id_agenda: null,
        start,
        end,
      });
      setFormOpen(true);
    },
    [form]
  );

  const openEdit = useCallback(
    (fcEvent) => {
      setEditId(fcEvent.id);

      const raw = fcEvent.extendedProps?.raw || {};
      const descText = fcEvent.extendedProps?.deskripsi ?? raw.deskripsi_kerja ?? raw.deskripsi ?? '';

      let start = dayjs(fcEvent.start);
      let end = dayjs(fcEvent.end || fcEvent.start);

      // kalau end exclusive (00:00 besok) ubah jadi 23:59 hari yang sama
      if (
        fcEvent.end &&
        end.diff(start, 'day') === 1 &&
        start.hour() === 0 &&
        start.minute() === 0 &&
        end.hour() === 0 &&
        end.minute() === 0
      ) {
        end = start.hour(23).minute(59);
      }

      form.setFieldsValue({
        title: descText,
        status: fcEvent.extendedProps?.status || 'teragenda',
        users: [fcEvent.extendedProps?.id_user].filter(Boolean),
        id_agenda: fcEvent.extendedProps?.id_agenda || null,
        start,
        end,
      });
      setFormOpen(true);
    },
    [form]
  );

  const handleSubmitForm = useCallback(
    async (values) => {
      const title = (values.title || '').trim();
      if (!title) {
        AppMessage.warning('Nama aktivitas tidak boleh kosong');
        return;
      }

      const payload = {
        title,
        start: values.start?.toDate?.(),
        end: (values.end || values.start)?.toDate?.(),
        status: values.status,
        id_agenda: values.id_agenda || null,
      };

      try {
        if (editId) {
          setCreateProgress({ running: true, sent: 0, total: 1 });
          await vm.updateEvent(editId, payload);
          AppMessage.success('Agenda diperbarui');
        } else {
          if (!Array.isArray(values.users) || values.users.length === 0) {
            AppMessage.warning('Pilih setidaknya satu karyawan');
            return;
          }

          const total = values.users.length;
          setCreateProgress({ running: true, sent: 0, total });

          await vm.createEvents({
            ...payload,
            userIds: values.users,
            onProgress: ({ sent, total }) => {
              setCreateProgress((prev) => ({ ...prev, running: true, sent, total }));
            },
          });

          AppMessage.success('Agenda dibuat');
        }

        setFormOpen(false);
        setEditId(null);
        form.resetFields();
      } catch (e) {
        const msg = e?.response?.data?.message || e?.message || 'Gagal menyimpan agenda';
        AppMessage.error(msg);
      } finally {
        setCreateProgress({ running: false, sent: 0, total: 0 });
      }
    },
    [editId, form, vm]
  );

  /* =========================================
   *  MULTIPLE: pakai VM.createMultipleEvents
   * ========================================= */
  const openCreateMultiple = useCallback(
  (startStr) => {
    const baseDay = startStr ? dayjs(startStr) : dayjs();

    const startTime = baseDay.startOf('day');
    const endTime = baseDay.hour(23).minute(59);

    multiForm.setFieldsValue({
      id_agenda: null,
      title: '',
      status: 'teragenda',
      users: [],

      // ✅ range
      rangeStart: baseDay.startOf('day'),
      rangeEnd: baseDay.startOf('day'),


      // ✅ optional filter hari (kosong = semua hari)
      repeatDays: [],

      startTime,
      endTime,
    });

    setMultiOpen(true);
  },
  [multiForm]
);


  const handleSubmitMultiple = useCallback(
  async (values) => {
    const title = (values.title || '').trim();
    if (!title) return AppMessage.warning('Nama aktivitas tidak boleh kosong');
    if (!values?.id_agenda) return AppMessage.warning('Pilih proyek/agenda');
    if (!Array.isArray(values.users) || values.users.length === 0)
      return AppMessage.warning('Pilih setidaknya satu karyawan');

    if (!values?.rangeStart || !values?.rangeEnd)
      return AppMessage.warning('Pilih tanggal mulai dan tanggal selesai');

    // repeatDays optional: array 0..6
    const repeatDays = Array.isArray(values.repeatDays) ? values.repeatDays : [];

    const datesYMD = buildYMDsFromRange(values.rangeStart, values.rangeEnd, repeatDays);

    if (!datesYMD.length) {
      // kalau end < start atau filter hari membuat kosong
      const isEndBefore = dayjs(values.rangeEnd).isBefore(dayjs(values.rangeStart), 'day');
      return AppMessage.warning(
        isEndBefore
          ? 'Tanggal selesai tidak boleh lebih kecil dari tanggal mulai'
          : 'Tidak ada tanggal yang cocok pada range tersebut'
      );
    }

    const st = dayjs(values.startTime || dayjs().startOf('day'));
    const en = dayjs(values.endTime || dayjs().hour(23).minute(59));

    const startHHmm = st.format('HH:mm');
    const durationSeconds = Math.max(0, Math.floor(en.diff(st, 'minute') * 60));

    const start_dates = datesYMD.map((ymd) => `${ymd} ${startHHmm}:00`);

    const total = values.users.length;
    setMultiSaving(true);
    setCreateProgress({ running: true, sent: 0, total });

    try {
      await vm.createMultipleEvents({
        title,
        status: values.status || 'teragenda',
        userIds: values.users,
        id_agenda: values.id_agenda,
        start_dates,
        duration_seconds: durationSeconds,
        onProgress: ({ sent, total }) => {
          setCreateProgress((prev) => ({ ...prev, running: true, sent, total }));
        },
      });

      AppMessage.success(
        `Multiple activity dibuat (${datesYMD.length} hari × ${values.users.length} karyawan)`
      );

      setMultiOpen(false);
      multiForm.resetFields();
    } catch (e) {
      const msg = e?.response?.data?.message || e?.message || 'Gagal membuat multiple activity';
      AppMessage.error(msg);
    } finally {
      setMultiSaving(false);
      setCreateProgress({ running: false, sent: 0, total: 0 });
    }
  },
  [multiForm, vm]
);


  /* =========================================
   *  Click tanggal: buka modal pilih mode
   * ========================================= */
  const onDateSelect = useCallback((sel) => {
    // clear selection biar tidak nyangkut di UI
    try { sel?.view?.calendar?.unselect?.(); } catch {}

    const startStr = sel?.startStr || null;
    const ymd = startStr ? dayjs(startStr).format('YYYY-MM-DD') : dayjs().format('YYYY-MM-DD');
    setPickedDateStr(ymd);
    setPickOpen(true);
  }, []);

  const handlePickSingle = useCallback(() => {
    setPickOpen(false);
    openCreateSingle(pickedDateStr);
  }, [openCreateSingle, pickedDateStr]);

  const handlePickMultiple = useCallback(() => {
    setPickOpen(false);
    openCreateMultiple(pickedDateStr);
  }, [openCreateMultiple, pickedDateStr]);

  /* =========================================
   *  Delete + Bulk delete
   * ========================================= */
  const confirmDelete = useCallback(
    (id) => {
      openConfirm({
        title: 'Hapus agenda ini?',
        content: 'Data agenda akan dihapus permanen.',
        okText: 'Hapus',
        cancelText: 'Batal',
        variant: 'danger',
        onOk: async () => {
          try {
            await vm.deleteEvent(id);
            AppMessage.success('Agenda dihapus');
            setDetailOpen(false);
            return true;
          } catch (e) {
            const msg = e?.response?.data?.message || e?.message || 'Gagal menghapus agenda';
            AppMessage.error(msg);
            return false;
          }
        },
      });
    },
    [openConfirm, vm]
  );

  const confirmBulkDeleteSimilar = useCallback(async () => {
    if (!detailEvent) return;
    try {
      const { targets } = await vm.findSimilarEventsByEvent(detailEvent);
      const n = targets.length;

      if (!n) return AppMessage.info('Tidak ada agenda serupa ditemukan.');

      openConfirm({
        title: `Hapus ${n} agenda serupa untuk semua karyawan?`,
        content: 'Semua item dengan Proyek, Aktivitas, dan jam Mulai/Selesai yang sama akan dihapus.',
        okText: 'Hapus Semua',
        cancelText: 'Batal',
        variant: 'danger',
        onOk: async () => {
          try {
            const ids = targets.map((t) => t.id_agenda_kerja || t.id);
            await vm.bulkDeleteByIds(ids);
            AppMessage.success(`Terhapus ${n} agenda`);
            setDetailOpen(false);
            return true;
          } catch (e) {
            const msg = e?.response?.data?.message || e?.message || 'Gagal hapus massal';
            AppMessage.error(msg);
            return false;
          }
        },
      });
    } catch (e) {
      const msg = e?.response?.data?.message || e?.message || 'Gagal mencari agenda serupa';
      AppMessage.error(msg);
    }
  }, [detailEvent, openConfirm, vm]);

  const openDetail = useCallback((arg) => {
    arg.jsEvent?.preventDefault?.();
    arg.jsEvent?.stopPropagation?.();
    setDetailEvent(arg.event);
    setDetailOpen(true);
  }, []);

  useEffect(() => {
    if (!detailOpen) return;
    const guard = (e) => e.stopPropagation();
    document.addEventListener('mousedown', guard, true);
    document.addEventListener('touchstart', guard, true);
    return () => {
      document.removeEventListener('mousedown', guard, true);
      document.removeEventListener('touchstart', guard, true);
    };
  }, [detailOpen]);

  const commitMoveResize = useCallback(
    async ({ event }) => {
      try {
        const raw = event.extendedProps?.raw || {};
        const descText = event.extendedProps?.deskripsi ?? raw.deskripsi_kerja ?? raw.deskripsi ?? '';

        await vm.updateEvent(event.id, {
          title: descText,
          start: event.start,
          end: event.end || event.start,
          status: event.extendedProps?.status || 'teragenda',
          id_agenda: event.extendedProps?.id_agenda || null,
        });

        AppMessage.success('Agenda diperbarui');
      } catch (e) {
        const msg = e?.response?.data?.message || e?.message || 'Gagal memperbarui agenda';
        AppMessage.error(msg);
        event.revert();
      }
    },
    [vm]
  );

  const renderEventContent = useCallback(
    (info) => {
      const st = info.event.extendedProps?.status;

      const projectName =
        info.event.extendedProps?.agenda?.nama_agenda ||
        info.event.extendedProps?.agenda_name ||
        info.event.title ||
        '-';

      const uid = info.event.extendedProps?.id_user;
      const userFromMap = uid ? vm.getUserById(uid) : null;
      const userName =
        info.event.extendedProps?.user?.nama_pengguna ||
        userFromMap?.nama_pengguna ||
        info.event.extendedProps?.user?.name ||
        info.event.extendedProps?.user?.email ||
        '';

      const jam = info.timeText ? info.timeText.replace(':', '.') : '';
      const titleText = [jam, projectName, userName].filter(Boolean).join(' · ');

      return (
        <div className="fc-event-custom">
          <span className="fc-title-ellipsis" title={titleText}>
            {titleText}
          </span>
          {st ? <span className={statusColor(st)}>{st}</span> : null}
        </div>
      );
    },
    [statusColor, vm]
  );

  const detailUser = useMemo(() => {
    if (!detailEvent) return null;
    const raw = detailEvent.extendedProps?.raw || {};

    const id = detailEvent.extendedProps?.id_user ?? raw?.id_user ?? raw?.user?.id_user ?? null;

    const fromMap = id ? vm.getUserById(id) : null;
    const fallback = detailEvent.extendedProps?.user || raw?.user || null;
    const user = fromMap ? { ...fallback, ...fromMap } : fallback;

    const name = user?.nama_pengguna || user?.name || user?.email || id || '—';
    const photo = vm.getPhotoUrl(user) || '/avatar-placeholder.jpg';
    const sub = vm.getJabatanName(user) || vm.getDepartemenName(user) || '—';
    const link = user?.id_user ? `/home/kelola_karyawan/karyawan/${user.id_user}` : null;

    return { user, name, photo, sub, link };
  }, [detailEvent, vm]);

  const audit = useMemo(() => {
    const raw = detailEvent?.extendedProps?.raw || {};
    const created = raw.created_at ?? raw.createdAt ?? raw.created ?? raw.tanggal_dibuat ?? null;
    const updated = raw.updated_at ?? raw.updatedAt ?? raw.updated ?? raw.tanggal_diubah ?? null;

    return {
      createdText: formatAuditLocal(created, 'DD MMM YYYY HH:mm'),
      updatedText: formatAuditLocal(updated, 'DD MMM YYYY HH:mm'),
    };
  }, [detailEvent]);

  const urgencyChip = useMemo(() => {
    if (!detailEvent) return null;
    const fromProps = detailEvent.extendedProps?.urgency || null;
    if (fromProps?.label) return fromProps;

    const raw = detailEvent.extendedProps?.raw || {};
    const rawVal =
      raw.kebutuhan_agenda ??
      raw.kebutuhan ??
      raw.urgensi ??
      raw.prioritas ??
      raw.agenda?.kebutuhan_agenda ??
      raw.agenda_kerja?.kebutuhan_agenda ??
      null;

    return normalizeUrgencyLocal(rawVal);
  }, [detailEvent]);

  const descHtml = detailEvent?.extendedProps?.deskripsi || '';

  const moreMenuItems = useMemo(
    () => [
      { key: 'history', label: 'Lihat Riwayat', icon: <ClockCircleOutlined />, onClick: async () => setHistoryOpen(true) },
      { type: 'divider' },
      { key: 'bulk-delete', label: 'Hapus Serentak', icon: <DeleteOutlined />, danger: true, onClick: confirmBulkDeleteSimilar },
    ],
    [confirmBulkDeleteSimilar]
  );

  /* =========================
   *  Form SINGLE fields
   * ========================= */
  const formFields = useMemo(() => {
    const agendaOptions = vm.agendaOptions || [];
    const userOptions = vm.userOptions || [];

    return [
      {
        type: 'row',
        gutter: [8, 8],
        children: [
          {
            name: 'id_agenda',
            label: 'Proyek/Agenda',
            type: 'select',
            rules: [{ required: true, message: 'Pilih proyek/agenda' }],
            col: { xs: 24, md: 16 },
            placeholder: 'Pilih Proyek',
            controlProps: {
              options: agendaOptions,
              showSearch: true,
              optionFilterProp: 'label',
              dropdownStyle: { maxHeight: 320, overflowY: 'auto' },
            },
          },
          {
            type: 'custom',
            noItem: true,
            col: { xs: 24, md: 8 },
            component: () => (
              <div className="md:pt-[30px]">
                <AppButton variant="outline" icon={<PlusOutlined />} onClick={() => setAgendaOpen(true)}>
                  Tambah Proyek
                </AppButton>
              </div>
            ),
          },
        ],
      },
      {
        name: 'title',
        label: 'Nama Aktivitas',
        type: 'textarea',
        rules: [{ required: true, message: 'Judul wajib diisi' }],
        placeholder: 'Isi kegiatan...',
        controlProps: { autoSize: { minRows: 4, maxRows: 8 }, rows: 4 },
      },
      {
        name: 'users',
        label: usersLabelNode,
        type: 'multiselect',
        hidden: () => !!editId,
        rules: [{ required: true, message: 'Pilih minimal satu karyawan' }],
        placeholder: 'Pilih karyawan',
        controlProps: {
          options: userOptions,
          showSearch: true,
          optionFilterProp: 'label',
          listHeight: 256,
          virtual: true,
          loading: !userOptions?.length,
          maxTagCount: 'responsive',
          dropdownStyle: { maxHeight: 360 },
          dropdownRender: (menu) => (
            <div>
              <div className="flex items-center justify-between px-3 py-2 border-b border-slate-200 bg-slate-50">
                <span className="text-[11px] text-slate-600">
                  Dipilih: {usersSelected.length}/{totalUsers}
                </span>
                <div className="flex items-center gap-1">
                  <AppButton
                    variant="link"
                    size="small"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleSelectAllUsers();
                    }}
                  >
                    Pilih semua
                  </AppButton>
                  <AppButton
                    variant="link"
                    size="small"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleClearUsers();
                    }}
                  >
                    Bersihkan
                  </AppButton>
                </div>
              </div>
              <div style={{ maxHeight: 320, overflowY: 'auto' }}>{menu}</div>
            </div>
          ),
        },
      },
      {
        name: 'users',
        label: usersLabelNode,
        type: 'multiselect',
        hidden: () => !editId,
        controlProps: { options: userOptions, disabled: true, maxTagCount: 'responsive' },
      },
      {
        name: 'status',
        label: 'Status',
        type: 'select',
        controlProps: {
          options: [
            { value: 'teragenda', label: 'Teragenda' },
            { value: 'diproses', label: 'Diproses' },
            { value: 'ditunda', label: 'Ditunda' },
            { value: 'selesai', label: 'Selesai' },
          ],
        },
      },
      {
        name: 'start',
        label: 'Mulai',
        type: 'datetime',
        rules: [{ required: true, message: 'Tanggal mulai wajib diisi' }],
        controlProps: {
          showTime: { format: 'HH:mm', defaultValue: defaultStartTime },
          format: 'YYYY-MM-DD HH:mm',
          className: 'w-full',
        },
      },
      {
        name: 'end',
        label: 'Selesai',
        type: 'datetime',
        controlProps: {
          showTime: { format: 'HH:mm', defaultValue: defaultEndTime },
          format: 'YYYY-MM-DD HH:mm',
          className: 'w-full',
        },
      },
    ];
  }, [
    defaultEndTime,
    defaultStartTime,
    editId,
    handleClearUsers,
    handleSelectAllUsers,
    totalUsers,
    usersLabelNode,
    usersSelected.length,
    vm.agendaOptions,
    vm.userOptions,
  ]);

  /* =========================
   *  Form MULTIPLE fields
   *  NOTE: "date-multiple" harus didukung AppForm kamu.
   *  Kalau belum, bilang ya—aku buatin type handler di AppForm.
   * ========================= */
  const multiFields = useMemo(() => {
    const agendaOptions = vm.agendaOptions || [];
    const userOptions = vm.userOptions || [];

    return [
      {
        type: 'row',
        gutter: [8, 8],
        children: [
          {
            name: 'id_agenda',
            label: 'Proyek/Agenda',
            type: 'select',
            rules: [{ required: true, message: 'Pilih proyek/agenda' }],
            col: { xs: 24, md: 16 },
            placeholder: 'Pilih Proyek',
            controlProps: {
              options: agendaOptions,
              showSearch: true,
              optionFilterProp: 'label',
              dropdownStyle: { maxHeight: 320, overflowY: 'auto' },
            },
          },
          {
            type: 'custom',
            noItem: true,
            col: { xs: 24, md: 8 },
            component: () => (
              <div className="md:pt-[30px]">
                <AppButton variant="outline" icon={<PlusOutlined />} onClick={() => setAgendaOpen(true)}>
                  Tambah Proyek
                </AppButton>
              </div>
            ),
          },
        ],
      },
      {
        name: 'title',
        label: 'Nama Aktivitas',
        type: 'textarea',
        rules: [{ required: true, message: 'Judul wajib diisi' }],
        placeholder: 'Isi kegiatan...',
        controlProps: { autoSize: { minRows: 4, maxRows: 8 }, rows: 4 },
      },
      {
  type: 'row',
  gutter: [8, 8],
  children: [
    {
      name: 'rangeStart',
      label: 'Tanggal Mulai',
      type: 'date',
      rules: [{ required: true, message: 'Tanggal mulai wajib diisi' }],
      col: { xs: 24, md: 12 },
      controlProps: { format: 'YYYY-MM-DD', className: 'w-full' },
    },
    {
      name: 'rangeEnd',
      label: 'Tanggal Selesai',
      type: 'date',
      rules: [{ required: true, message: 'Tanggal selesai wajib diisi' }],
      col: { xs: 24, md: 12 },
      controlProps: { format: 'YYYY-MM-DD', className: 'w-full' },
    },
  ],
},

      {
        type: 'row',
        gutter: [8, 8],
        children: [
          {
            name: 'startTime',
            label: 'Jam Mulai',
            type: 'time',
            rules: [{ required: true, message: 'Jam mulai wajib diisi' }],
            col: { xs: 24, md: 12 },
            controlProps: { format: 'HH:mm', className: 'w-full' },
          },
          {
            name: 'endTime',
            label: 'Jam Selesai',
            type: 'time',
            col: { xs: 24, md: 12 },
            controlProps: { format: 'HH:mm', className: 'w-full' },
          },
        ],
      },
      {
        name: 'users',
        label: usersLabelNode,
        type: 'multiselect',
        rules: [{ required: true, message: 'Pilih minimal satu karyawan' }],
        placeholder: 'Pilih karyawan',
        controlProps: {
          options: userOptions,
          showSearch: true,
          optionFilterProp: 'label',
          listHeight: 256,
          virtual: true,
          loading: !userOptions?.length,
          maxTagCount: 'responsive',
          dropdownStyle: { maxHeight: 360 },
          dropdownRender: (menu) => (
            <div>
              <div className="flex items-center justify-between px-3 py-2 border-b border-slate-200 bg-slate-50">
                <span className="text-[11px] text-slate-600">
                  Dipilih: {usersSelected.length}/{totalUsers}
                </span>
                <div className="flex items-center gap-1">
                  <AppButton
                    variant="link"
                    size="small"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      const allIds = (vm.userOptions || []).map((opt) => opt.value);
                      multiForm.setFieldsValue({ users: allIds });
                    }}
                  >
                    Pilih semua
                  </AppButton>
                  <AppButton
                    variant="link"
                    size="small"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      multiForm.setFieldsValue({ users: [] });
                    }}
                  >
                    Bersihkan
                  </AppButton>
                </div>
              </div>
              <div style={{ maxHeight: 320, overflowY: 'auto' }}>{menu}</div>
            </div>
          ),
        },
      },
      {
        name: 'status',
        label: 'Status',
        type: 'select',
        controlProps: {
          options: [
            { value: 'teragenda', label: 'Teragenda' },
            { value: 'diproses', label: 'Diproses' },
            { value: 'ditunda', label: 'Ditunda' },
            { value: 'selesai', label: 'Selesai' },
          ],
        },
      },
    ];
  }, [multiForm, totalUsers, usersLabelNode, usersSelected.length, vm.agendaOptions, vm.userOptions]);

  const agendaFields = useMemo(
    () => [
      {
        name: 'nama_agenda',
        label: 'Nama Proyek / Agenda',
        type: 'text',
        rules: [{ required: true, message: 'Nama proyek wajib diisi' }],
        placeholder: 'Contoh: Implementasi Client X',
      },
    ],
    []
  );

  return (
    <div className="p-4">
      <div className="relative rounded-2xl border border-slate-200 bg-white shadow-xl p-3">
        {vm.loadingInitialEvents && (
          <div className="absolute inset-0 z-20 flex items-center justify-center pointer-events-none">
            <div className="inline-flex items-center gap-2 rounded-full bg-sky-50/90 px-4 py-1 text-xs text-sky-700 ring-1 ring-sky-200 shadow">
              <span className="inline-block h-3 w-3 rounded-full border border-sky-500 border-t-transparent animate-spin" />
              <span>Memuat agenda kerja…</span>
            </div>
          </div>
        )}

        {vm.reloadingEvents && !vm.loadingInitialEvents && (
          <div className="absolute right-3 top-3 z-10 rounded-full bg-white/90 px-3 py-1 text-[11px] text-slate-500 shadow-sm">
            Memuat ulang agenda…
          </div>
        )}

        <FullCalendar
          ref={calRef}
          height="auto"
          plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin, listPlugin]}
          initialView="dayGridMonth"
          locale="id"
          timeZone="local"
          dayMaxEventRows={3}
          headerToolbar={{
            left: 'prev,next today',
            center: 'title',
            right: 'dayGridMonth,timeGridWeek,timeGridDay,listWeek',
          }}
          selectable
          selectMirror
          editable
          eventResizableFromStart
          eventTimeFormat={{ hour: '2-digit', minute: '2-digit', hour12: false }}
          select={onDateSelect}
          eventClick={openDetail}
          eventDrop={commitMoveResize}
          eventResize={commitMoveResize}
          datesSet={(info) => vm.setRange(info.start, info.end)}
          events={vm.events}
          eventContent={renderEventContent}
        />
      </div>

      {/* Modal pilih mode */}
      <AppModal
        title="Buat Agenda"
        open={pickOpen}
        onClose={() => setPickOpen(false)}
        footer={null}
        width={420}
        destroyOnClose
        centered
        maskClosable
        zIndex={11200}
      >
        <div className="text-sm text-slate-700">
          Pilih jenis pembuatan agenda untuk tanggal <b>{pickedDateStr || '—'}</b>
        </div>

        <div className="mt-4 grid gap-2">
          <AppButton variant="primary" size="large" onClick={handlePickSingle} className="h-11 rounded-xl">
            Single Activity
          </AppButton>

          <AppButton variant="outline" size="large" onClick={handlePickMultiple} className="h-11 rounded-xl">
            Multiple Activity
          </AppButton>

          <div className="text-[12px] text-slate-500 mt-2">
            Multiple Activity akan membuat <b>1 record per tanggal</b>, jadi saat salah satu selesai, tidak akan “mengubah semua tanggal”.
          </div>
        </div>
      </AppModal>

      {/* DETAIL */}
      <AppModal
        title={
          <div className="flex items-center gap-2">
            <ProfileOutlined />
            <span>Agenda Detail</span>
          </div>
        }
        open={detailOpen}
        onClose={() => setDetailOpen(false)}
        footer={null}
        width={760}
        destroyOnClose
        maskClosable={false}
        zIndex={11000}
        centered
        styles={{ body: { maxHeight: '72vh', overflowY: 'auto' } }}
      >
        {!detailEvent ? null : (
          <>
            <div className="flex items-start gap-3">
              <CircleImg src={detailUser?.photo} alt={detailUser?.name} size={48} />
              <div className="min-w-0">
                <div style={{ fontWeight: 700, fontSize: 16 }} className="truncate">
                  {detailUser?.link ? (
                    <Link href={detailUser.link} className="no-underline" style={{ color: '#0f172a' }}>
                      {detailUser?.name}
                    </Link>
                  ) : (
                    detailUser?.name
                  )}
                </div>
                <div style={{ color: '#64748b', marginTop: 2 }} className="truncate">
                  {detailUser?.sub || '—'}
                </div>

                <div className="mt-3 flex flex-wrap items-center gap-2">
                  {detailEvent.extendedProps?.status ? (
                    <span className={statusColor(detailEvent.extendedProps.status)}>
                      {detailEvent.extendedProps.status}
                    </span>
                  ) : null}

                  {urgencyChip?.label ? (
                    <span className={`fc-chip fc-chip--urg-${urgencyChip.level}`}>{urgencyChip.label}</span>
                  ) : null}

                  {detailEvent.extendedProps?.agenda?.nama_agenda ? (
                    <span className="fc-chip fc-chip--clip1">{detailEvent.extendedProps.agenda.nama_agenda}</span>
                  ) : null}

                  <div className="fc-chip--time">
                    <ClockCircleOutlined />
                    <span>
                      {showFromDBVM(detailEvent.extendedProps?.raw?.start_date || detailEvent.start, 'DD MMM YYYY HH:mm')} -{' '}
                      {showFromDBVM(detailEvent.extendedProps?.raw?.end_date || detailEvent.end || detailEvent.start, 'DD MMM YYYY HH:mm')}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <AppDivider style={{ margin: '14px 0 12px' }} />

            <div
              style={{ fontSize: 14, color: '#0f172a', wordBreak: 'break-word' }}
              dangerouslySetInnerHTML={{
                __html: isQuillEmpty(descHtml) ? '<span style="color:#94a3b8">—</span>' : descHtml,
              }}
            />

            <div className="flex justify-end gap-2 mt-10">
              <AppTooltip title="Edit">
                <AppButton
                  variant="outline"
                  size="large"
                  shape="circle"
                  icon={<EditOutlined />}
                  onClick={() => {
                    setDetailOpen(false);
                    openEdit(detailEvent);
                  }}
                />
              </AppTooltip>

              <AppTooltip title="Hapus satu ini">
                <AppButton
                  variant="danger"
                  size="large"
                  shape="circle"
                  icon={<DeleteOutlined />}
                  onClick={() => confirmDelete(detailEvent.id)}
                />
              </AppTooltip>

              <AppDropdown items={moreMenuItems} placement="bottomRight" trigger={['click']}>
                <AppButton variant="outline" size="large" shape="circle" icon={<EllipsisOutlined />} />
              </AppDropdown>
            </div>
          </>
        )}
      </AppModal>

      {/* Riwayat */}
      <AppModal
        title="Riwayat Agenda"
        open={historyOpen}
        onClose={() => setHistoryOpen(false)}
        footer={null}
        width={480}
        destroyOnClose
        maskClosable
        zIndex={11100}
        centered
        styles={{ body: { maxHeight: '60vh', overflowY: 'auto' } }}
      >
        <div style={{ display: 'grid', rowGap: 8, fontSize: 14 }}>
          <div style={{ display: 'flex', gap: 8 }}>
            <div style={{ width: 120, color: '#64748b' }}>Dibuat</div>
            <div style={{ color: '#0f172a' }}>{audit.createdText}</div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <div style={{ width: 120, color: '#64748b' }}>Diubah</div>
            <div style={{ color: '#0f172a' }}>{audit.updatedText}</div>
          </div>
        </div>
      </AppModal>

      {/* SINGLE MODAL */}
      <AppModal
        title={editId ? 'Edit Agenda' : 'Agenda Baru'}
        open={formOpen}
        onClose={() => {
          setFormOpen(false);
          setEditId(null);
          form.resetFields();
        }}
        centered
        destroyOnClose
        maskClosable={false}
        styles={{ body: { maxHeight: '60vh', overflowY: 'auto' } }}
        footer={
          <div className="flex items-center justify-between gap-3">
            <div>
              {createProgress.running && !editId && (
                <span className="text-xs text-slate-500">
                  Sedang memproses agenda ({createProgress.sent}/{createProgress.total})
                </span>
              )}
              {createProgress.running && editId && <span className="text-xs text-slate-500">Menyimpan perubahan agenda...</span>}
            </div>

            <div className="flex gap-2">
              <AppButton
                variant="outline"
                onClick={() => {
                  setFormOpen(false);
                  setEditId(null);
                  form.resetFields();
                }}
                disabled={createProgress.running}
              >
                Batal
              </AppButton>
              <AppButton variant="primary" onClick={() => form.submit()} loading={createProgress.running}>
                {createProgress.running && !editId
                  ? `Buat (${createProgress.sent}/${createProgress.total})`
                  : createProgress.running && editId
                  ? 'Menyimpan...'
                  : editId
                  ? 'Simpan'
                  : 'Buat'}
              </AppButton>
            </div>
          </div>
        }
      >
        <AppForm
          form={form}
          fields={formFields}
          layout="vertical"
          showSubmit={false}
          requiredMark={false}
          onFinish={handleSubmitForm}
        />
      </AppModal>

      {/* MULTIPLE MODAL */}
      <AppModal
        title="Multiple Activity"
        open={multiOpen}
        onClose={() => {
          if (multiSaving) return;
          setMultiOpen(false);
          multiForm.resetFields();
        }}
        centered
        destroyOnClose
        maskClosable={false}
        styles={{ body: { maxHeight: '60vh', overflowY: 'auto' } }}
        footer={
          <div className="flex items-center justify-between gap-3">
            <div>
              {createProgress.running && (
                <span className="text-xs text-slate-500">
                  Memproses ({createProgress.sent}/{createProgress.total}) karyawan...
                </span>
              )}
            </div>
            <div className="flex gap-2">
              <AppButton
                variant="outline"
                disabled={multiSaving}
                onClick={() => {
                  setMultiOpen(false);
                  multiForm.resetFields();
                }}
              >
                Batal
              </AppButton>
              <AppButton variant="primary" loading={multiSaving} onClick={() => multiForm.submit()}>
                Simpan
              </AppButton>
            </div>
          </div>
        }
      >
        <AppForm
          form={multiForm}
          fields={multiFields}
          layout="vertical"
          showSubmit={false}
          requiredMark={false}
          onFinish={handleSubmitMultiple}
        />

        <div className="mt-3 text-[12px] text-slate-500">
         Sistem akan membuat <b>1 agenda per hari</b> dalam rentang tanggal (bukan 1 agenda rentang panjang).
        </div>
      </AppModal>

      {/* Tambah Proyek */}
      <AppModal
        title="Tambah Proyek"
        open={agendaOpen}
        onClose={() => {
          if (agendaSaving) return;
          setAgendaOpen(false);
          agendaForm.resetFields();
        }}
        centered
        destroyOnClose
        maskClosable={false}
        styles={{ body: { maxHeight: '60vh', overflowY: 'auto' } }}
        footer={
          <div className="flex justify-end gap-2">
            <AppButton
              variant="outline"
              disabled={agendaSaving}
              onClick={() => {
                setAgendaOpen(false);
                agendaForm.resetFields();
              }}
            >
              Batal
            </AppButton>
            <AppButton variant="primary" loading={agendaSaving} onClick={() => agendaForm.submit()}>
              Simpan
            </AppButton>
          </div>
        }
      >
        <AppForm
          form={agendaForm}
          fields={agendaFields}
          layout="vertical"
          showSubmit={false}
          requiredMark={false}
          onFinish={async (values) => {
            const nama = String(values?.nama_agenda || '').trim();
            if (!nama) return AppMessage.warning('Nama proyek wajib diisi');

            try {
              setAgendaSaving(true);
              const newId = await vm.createAgendaMaster(nama);

              if (newId) {
                try { form.setFieldsValue({ id_agenda: newId }); } catch {}
                try { multiForm.setFieldsValue({ id_agenda: newId }); } catch {}
              }

              AppMessage.success('Proyek/agenda berhasil ditambahkan');
              setAgendaOpen(false);
              agendaForm.resetFields();
            } catch (e) {
              const msg = e?.response?.data?.message || e?.message || 'Gagal menambah proyek/agenda';
              AppMessage.error(msg);
            } finally {
              setAgendaSaving(false);
            }
          }}
        />
      </AppModal>

      {/* Confirm modal */}
      <AppModal
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        title={confirmCfg.title}
        variant={confirmCfg.variant}
        okText={confirmCfg.okText}
        cancelText={confirmCfg.cancelText}
        onOk={confirmCfg.onOk}
        zIndex={11150}
        centered
        maskClosable={false}
        styles={{ body: { maxHeight: '50vh', overflowY: 'auto' } }}
      >
        {typeof confirmCfg.content === 'string' ? (
          <div className="text-sm text-slate-700">{confirmCfg.content}</div>
        ) : (
          confirmCfg.content
        )}
      </AppModal>

      <style jsx global>{`
        .fc .fc-daygrid-event { padding: 2px 6px; }
        .fc-event-custom { display: flex; align-items: center; gap: 6px; min-width: 0; }
        .fc-title-ellipsis {
          display: inline-block; min-width: 0; max-width: 100%;
          overflow: hidden; white-space: nowrap; text-overflow: ellipsis; line-height: 1.15;
        }
        .fc-more-popover { max-width: min(90vw, 560px); z-index: 1050 !important; }
        .fc-more-popover .fc-popover-body { max-height: 60vh; overflow: auto; padding-right: 4px; }
        .fc-more-popover .fc-event-custom { align-items: flex-start; }
        .fc-more-popover .fc-title-ellipsis {
          white-space: normal !important; display: -webkit-box !important;
          -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; line-height: 1.25;
        }
        .fc-chip {
          display: inline-block; padding: 1px 6px; border-radius: 999px;
          font-size: 10px; line-height: 16px; border: 1px solid transparent;
          flex: 0 0 auto; background: #f3f4f6; color: #334155; border-color: #e5e7eb;
          max-width: 220px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
        }
        .fc-chip--proc { background: #ebf2ff; color: #1d4ed8; border-color: #dbeafe; }
        .fc-chip--hold { background: #fff7e6; color: #b45309; border-color: #fde68a; }
        .fc-chip--done { background: #eaf7ec; color: #15803d; border-color: #bbf7d0; }
        .fc-chip--plan { background: #f3f4f6; color: #374151; border-color: #e5e7eb; }
        .fc-chip--clip1 { max-width: 280px; }
        .fc-chip--time {
          display: inline-flex; align-items: center; gap: 8px; padding: 6px 10px;
          font-size: 12px; line-height: 20px; border-radius: 999px;
          background: #f3f4f6; color: #334155; border: 1px solid #e5e7eb;
          width: max-content; max-width: none; white-space: nowrap; overflow: visible; text-overflow: clip;
          flex: 0 0 auto; flex-shrink: 0;
        }
        .fc .fc-daygrid-event a { text-decoration: none; }
      `}</style>
    </div>
  );
}
