// ProyekContent.jsx (dengan ActivitiesModal) — disusun A-Z otomatis
'use client';

import React, { useMemo, useState, useCallback } from 'react';
import useSWR from 'swr';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';

import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';

import AppCard from '@/app/(view)/component_shared/AppCard';
import AppTable from '@/app/(view)/component_shared/AppTable';
import AppInput from '@/app/(view)/component_shared/AppInput';
import AppButton from '@/app/(view)/component_shared/AppButton';
import AppModal from '@/app/(view)/component_shared/AppModal';
import AppPopconfirm from '@/app/(view)/component_shared/AppPopconfirm';
import AppTooltip from '@/app/(view)/component_shared/AppTooltip';
import AppMessage from '@/app/(view)/component_shared/AppMessage';
import AppSelect from '@/app/(view)/component_shared/AppSelect';
import AppTag from '@/app/(view)/component_shared/AppTag';
import AppDatePicker from '@/app/(view)/component_shared/AppDatePicker';
import AppAlert from '@/app/(view)/component_shared/AppAlert';
import AppSpace from '@/app/(view)/component_shared/AppSpace';
import AppForm, { useAppForm } from '@/app/(view)/component_shared/AppForm';

import { fetcher } from '../../../../utils/fetcher';
import { ApiEndpoints } from '../../../../../constrainst/endpoints';
import useProyekViewModel from './ProyekViewModel';

dayjs.extend(utc);

export default function ProyekContent() {
  const vm = useProyekViewModel();

  const [openAdd, setOpenAdd] = useState(false);
  const [savingAdd, setSavingAdd] = useState(false);
  const [addForm] = useAppForm();

  const [openEdit, setOpenEdit] = useState(false);
  const [savingEdit, setSavingEdit] = useState(false);
  const [editForm] = useAppForm();
  const [editingRow, setEditingRow] = useState(null);

  const [openList, setOpenList] = useState(false);
  const [listProject, setListProject] = useState(null);

  const [openMembers, setOpenMembers] = useState(false);
  const [membersProjectName, setMembersProjectName] = useState('');
  const [membersList, setMembersList] = useState([]);

  const onEditOpen = useCallback(
    (row) => {
      setEditingRow(row);
      editForm.setFieldsValue({ nama_agenda: row.nama_agenda });
      setOpenEdit(true);
    },
    [editForm]
  );

  const openActivities = useCallback((row) => {
    setListProject({ id_agenda: row.id_agenda, nama_agenda: row.nama_agenda });
    setOpenList(true);
  }, []);

  const openMembersModal = useCallback((row, allNames, showFrom = 3) => {
    setMembersProjectName(row.nama_agenda);
    setMembersList(allNames.slice(showFrom));
    setOpenMembers(true);
  }, []);

  const addFields = useMemo(
    () => [
      {
        name: 'nama_agenda',
        label: 'Nama',
        type: 'text',
        rules: [{ required: true, message: 'Wajib diisi' }],
        placeholder: 'Mis. The Day OSS EXPO',
      },
    ],
    []
  );

  const editFields = useMemo(
    () => [
      {
        name: 'nama_agenda',
        label: 'Nama',
        type: 'text',
        rules: [{ required: true, message: 'Wajib diisi' }],
        placeholder: 'Mis. The Day OSS EXPO',
      },
    ],
    []
  );

  const columns = useMemo(
    () => [
      {
        title: 'Nama',
        dataIndex: 'nama_agenda',
        key: 'nama',
        render: (v, row) => (
          <a
            className='underline'
            onClick={() => openActivities(row)}
          >
            {v}
          </a>
        ),
      },
      {
        title: 'Anggota',
        key: 'anggota',
        render: (_, row) => {
          const names = vm.membersNames(row.id_agenda);
          if (!names.length) return '—';

          const top = names.slice(0, 3);
          const more = names.length - top.length;

          return (
            <div className='whitespace-pre-wrap'>
              {top.map((n, i) => `${i + 1}. ${n}`).join('\n')}
              {more > 0 ? (
                <>
                  {'\n'}
                  <a onClick={() => openMembersModal(row, names)}>{`+${more} lainnya`}</a>
                </>
              ) : null}
            </div>
          );
        },
      },
      {
        title: 'Jml. Pekerjaan',
        dataIndex: ['_count', 'items'],
        key: 'jumlah',
        align: 'center',
        render: (n = 0, row) => <a onClick={() => openActivities(row)}>{n}</a>,
      },
      {
        title: 'Aksi',
        key: 'aksi',
        align: 'right',
        render: (_, row) => (
          <div className='flex gap-2 justify-end'>
            <AppTooltip title='Ubah'>
              <AppButton
                variant='outline'
                size='small'
                icon={<EditOutlined />}
                onClick={() => onEditOpen(row)}
              />
            </AppTooltip>

            <AppPopconfirm
              title='Hapus proyek?'
              description='Soft delete.'
              okText='Hapus'
              cancelText='Batal'
              onConfirm={() => vm.remove(row.id_agenda)}
            >
              <AppButton
                variant='danger'
                size='small'
                icon={<DeleteOutlined />}
              />
            </AppPopconfirm>
          </div>
        ),
      },
    ],
    [openActivities, onEditOpen, openMembersModal, vm]
  );

  // ✅ SORT A-Z (case-insensitive) agar proyek selalu rapi
  const sortedRows = useMemo(() => {
    const arr = Array.isArray(vm.filteredRows) ? [...vm.filteredRows] : [];

    arr.sort((a, b) => {
      const an = (a?.nama_agenda || '').toString().trim().toLowerCase();
      const bn = (b?.nama_agenda || '').toString().trim().toLowerCase();

      // kosong taruh paling bawah
      if (!an && !bn) return 0;
      if (!an) return 1;
      if (!bn) return -1;

      return an.localeCompare(bn, 'id-ID', { sensitivity: 'base' });
    });

    return arr;
  }, [vm.filteredRows]);

  return (
    <div className='p-4'>
      <AppCard
        styles={{ body: { paddingTop: 16 } }}
        title={<span className='text-lg font-semibold'>Proyek</span>}
      >
        <div className='flex items-center gap-2 md:flex-nowrap flex-wrap mb-4'>
          <AppInput
            placeholder='Cari proyek'
            className='w-[180px]'
            value={vm.q}
            onChange={(e) => vm.setQ(e.target.value)}
            onPressEnter={(e) => vm.setQ(e.currentTarget.value)}
            allowClear
          />

          <AppSelect
            className='w-[240px]'
            placeholder='Filter Karyawan'
            allowClear
            value={vm.filterUserId || undefined}
            onChange={(v) => vm.setFilterUserId(v || '')}
            options={vm.userOptions}
            showSearch
            optionFilterProp='label'
          />

          <AppButton
            icon={<PlusOutlined />}
            onClick={() => setOpenAdd(true)}
          >
            Tambah Proyek
          </AppButton>
        </div>

        <AppTable
          rowKey='id_agenda'
          columns={columns}
          dataSource={sortedRows} // ✅ pakai hasil sort A-Z
          loading={vm.loading}
          pagination={false}
          size='middle'
        />
      </AppCard>

      {/* Modal Tambah */}
      <AppModal
        title='Tambah Proyek'
        open={openAdd}
        onClose={() => {
          setOpenAdd(false);
          addForm.resetFields();
        }}
        okText='Simpan'
        cancelText='Batal'
        okLoading={savingAdd}
        maskClosable={false}
        destroyOnClose
        onOk={async () => {
          try {
            const v = await addForm.validateFields();
            const nama = String(v?.nama_agenda || '').trim();
            if (!nama) {
              AppMessage.warning('Nama wajib diisi');
              return false;
            }

            setSavingAdd(true);
            await vm.create(nama);
            setOpenAdd(false);
            addForm.resetFields();
            AppMessage.success('Proyek berhasil ditambahkan');
            return true;
          } catch (e) {
            if (e?.errorFields) return false;
            AppMessage.error(e?.message || 'Gagal menambah proyek');
            return false;
          } finally {
            setSavingAdd(false);
          }
        }}
      >
        <AppForm
          form={addForm}
          layout='vertical'
          requiredMark={false}
          showSubmit={false}
          fields={addFields}
        />
      </AppModal>

      {/* Modal Edit */}
      <AppModal
        title='Ubah Proyek'
        open={openEdit}
        onClose={() => {
          setOpenEdit(false);
          setEditingRow(null);
          editForm.resetFields();
        }}
        okText='Simpan'
        cancelText='Batal'
        okLoading={savingEdit}
        okDisabled={!editingRow}
        maskClosable={false}
        destroyOnClose
        onOk={async () => {
          try {
            if (!editingRow) return false;

            const v = await editForm.validateFields();
            const nama = String(v?.nama_agenda || '').trim();
            if (!nama) {
              AppMessage.warning('Nama wajib diisi');
              return false;
            }

            setSavingEdit(true);
            await vm.update(editingRow.id_agenda, nama);
            setOpenEdit(false);
            setEditingRow(null);
            editForm.resetFields();
            AppMessage.success('Proyek berhasil diubah');
            return true;
          } catch (e) {
            if (e?.errorFields) return false;
            AppMessage.error(e?.message || 'Gagal mengubah proyek');
            return false;
          } finally {
            setSavingEdit(false);
          }
        }}
      >
        <AppForm
          form={editForm}
          layout='vertical'
          requiredMark={false}
          showSubmit={false}
          fields={editFields}
        />
      </AppModal>

      {/* Modal Aktivitas Proyek */}
      <ActivitiesModal
        open={openList}
        onClose={() => setOpenList(false)}
        project={listProject}
      />

      {/* Modal Anggota Lainnya */}
      <AppModal
        title={`Anggota Proyek: ${membersProjectName || '-'}`}
        open={openMembers}
        onClose={() => setOpenMembers(false)}
        footer={({ close }) => (
          <AppButton
            variant='outline'
            onClick={close}
          >
            Tutup
          </AppButton>
        )}
        destroyOnClose
      >
        {membersList.length ? (
          <div className='space-y-1'>
            {membersList.map((n, i) => (
              <div key={i}>{`${i + 4}. ${n}`}</div>
            ))}
          </div>
        ) : (
          <div className='opacity-60'>Tidak ada data.</div>
        )}
      </AppModal>
    </div>
  );
}

/* ======================= Modal List Aktivitas ======================= */

function normalizeUrgency(v) {
  const s = (v || '').toString().trim().toUpperCase();
  switch (s) {
    case 'PENTING MENDESAK':
      return { label: 'PENTING MENDESAK', tone: 'danger' };
    case 'TIDAK PENTING TAPI MENDESAK':
    case 'TIDAK PENTING, TAPI MENDESAK':
      return { label: 'TIDAK PENTING TAPI MENDESAK', tone: 'purple' };
    case 'PENTING TAK MENDESAK':
    case 'PENTING TIDAK MENDESAK':
      return { label: 'PENTING TAK MENDESAK', tone: 'warning' };
    case 'TIDAK PENTING TIDAK MENDESAK':
      return { label: 'TIDAK PENTING TIDAK MENDESAK', tone: 'neutral' };
    default:
      return s ? { label: s, tone: 'neutral' } : null;
  }
}

function formatDuration(sec = 0) {
  if (!sec || sec < 1) return '0 detik';
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = Math.floor(sec % 60);
  const parts = [];
  if (h) parts.push(`${h} jam`);
  if (m) parts.push(`${m} menit`);
  if (s) parts.push(`${s} detik`);
  return parts.join(' ');
}

function ActivitiesModal({ open, onClose, project }) {
  const [from, setFrom] = useState(null); // dayjs|null
  const [to, setTo] = useState(null); // dayjs|null
  const [status, setStatus] = useState('');
  const [division, setDivision] = useState('');
  const [urgency, setUrgency] = useState('');
  const [q, setQ] = useState('');

  const showDB = (v) => (v ? dayjs.utc(v).format('DD MMM YYYY HH:mm') : '-');

  const fmtLocal = (d, edge) =>
    d ? d[edge === 'end' ? 'endOf' : 'startOf']('day').format('YYYY-MM-DD HH:mm:ss') : null;

  const qs = useMemo(() => {
    if (!project?.id_agenda) return null;
    const p = new URLSearchParams();
    p.set('id_agenda', project.id_agenda);
    const f = fmtLocal(from, 'start');
    const t = fmtLocal(to, 'end');
    if (f) p.set('from', f);
    if (t) p.set('to', t);
    if (status) p.set('status', status);
    p.set('perPage', '500');
    return `${ApiEndpoints.GetAgendaKerja}?${p.toString()}`;
  }, [project?.id_agenda, from, to, status]);

  const { data, isLoading } = useSWR(open && qs ? qs : null, fetcher, { revalidateOnFocus: false });
  const rows = useMemo(() => (Array.isArray(data?.data) ? data.data : []), [data]);

  const divisionOptions = useMemo(() => {
    const s = new Set();
    rows.forEach((r) => r.user?.role && s.add(r.user.role));
    return Array.from(s).map((v) => ({ value: v, label: v }));
  }, [rows]);

  const urgencyOptions = useMemo(() => {
    const s = new Map();
    rows.forEach((r) => {
      const u = normalizeUrgency(r?.kebutuhan_agenda);
      if (u) s.set(u.label, u.tone);
    });
    return Array.from(s.entries()).map(([label, tone]) => ({
      value: label,
      label,
      tone,
    }));
  }, [rows]);

  const filteredRows = useMemo(() => {
    let xs = rows;

    if (division) xs = xs.filter((r) => (r.user?.role || '') === division);

    if (urgency) {
      xs = xs.filter((r) => {
        const u = normalizeUrgency(r?.kebutuhan_agenda);
        return u?.label === urgency;
      });
    }

    const qq = q.trim().toLowerCase();
    if (qq) {
      xs = xs.filter(
        (r) =>
          (r.deskripsi_kerja || '').toLowerCase().includes(qq) ||
          (r.user?.nama_pengguna || r.user?.email || '').toLowerCase().includes(qq) ||
          (r.kebutuhan_agenda || '').toLowerCase().includes(qq)
      );
    }

    return xs;
  }, [rows, division, urgency, q]);

  const columns = useMemo(
    () => [
      {
        title: 'Pekerjaan',
        dataIndex: 'deskripsi_kerja',
        key: 'pek',
        width: 280,
        onCell: () => ({
          style: {
            maxWidth: 280,
            whiteSpace: 'pre-wrap',
            overflowWrap: 'anywhere',
            wordBreak: 'break-word',
          },
        }),
        render: (v) => <span className='block leading-5'>{v || '-'}</span>,
      },
      {
        title: 'Diproses Oleh',
        key: 'oleh',
        width: 150,
        onCell: () => ({
          style: {
            maxWidth: 220,
            whiteSpace: 'pre-wrap',
            overflowWrap: 'anywhere',
            wordBreak: 'break-word',
          },
        }),
        render: (_, r) => r.user?.nama_pengguna || r.user?.email || '—',
      },
      {
        title: 'Diproses Pada',
        key: 'pada',
        width: 150,
        onCell: () => ({
          style: { whiteSpace: 'pre', maxWidth: 220, overflowWrap: 'anywhere' },
        }),
        render: (_, r) => (
          <div className='whitespace-pre leading-5'>{`${showDB(r.start_date)}\n${showDB(
            r.end_date
          )}`}</div>
        ),
      },
      {
        title: 'Durasi',
        dataIndex: 'duration_seconds',
        key: 'dur',
        width: 90,
        render: (s) => formatDuration(s),
      },
      {
        title: 'Status',
        dataIndex: 'status',
        key: 'status',
        width: 110,
        render: (st = '') => {
          const map = {
            selesai: { tone: 'success', text: 'Selesai' },
            ditunda: { tone: 'warning', text: 'Ditunda' },
            diproses: { tone: 'info', text: 'Diproses' },
            teragenda: { tone: 'neutral', text: 'Teragenda' },
          };
          const m = map[st] || {
            tone: 'neutral',
            text: st ? st[0].toUpperCase() + st.slice(1) : '—',
          };
          return <AppTag tone={m.tone}>{m.text}</AppTag>;
        },
      },
      {
        title: 'Urgensi',
        dataIndex: 'kebutuhan_agenda',
        key: 'urgensi',
        width: 220,
        onCell: () => ({
          style: {
            maxWidth: 220,
            whiteSpace: 'pre-wrap',
            overflowWrap: 'anywhere',
            wordBreak: 'break-word',
          },
        }),
        render: (v) => {
          const u = normalizeUrgency(v);
          if (!u)
            return (
              <AppTag
                tone='neutral'
                style={{ fontStyle: 'italic' }}
              >
                Belum diisi
              </AppTag>
            );
          return <AppTag tone={u.tone}>{u.label}</AppTag>;
        },
      },
    ],
    []
  );

  return (
    <AppModal
      title={`Daftar Pekerjaan Proyek: ${project?.nama_agenda || '-'}`}
      open={open}
      onClose={onClose}
      width={1000}
      destroyOnClose
      styles={{ body: { maxHeight: 640, overflowY: 'auto' } }}
      footer={({ close }) => (
        <AppButton
          variant='outline'
          onClick={close}
        >
          Tutup
        </AppButton>
      )}
    >
      <div className='flex flex-wrap items-center gap-2 mb-3'>
        <AppDatePicker
          placeholder='Tanggal Mulai'
          value={from}
          onChange={(d) => setFrom(d || null)}
        />
        <span className='opacity-60'>-</span>
        <AppDatePicker
          placeholder='Tanggal Selesai'
          value={to}
          onChange={(d) => setTo(d || null)}
        />

        <AppSelect
          className='min-w-[170px]'
          placeholder='--Filter Divisi--'
          allowClear
          options={divisionOptions}
          value={division || undefined}
          onChange={(v) => setDivision(v || '')}
        />

        <AppSelect
          className='min-w-[170px]'
          placeholder='--Filter Status--'
          allowClear
          value={status || undefined}
          onChange={(v) => setStatus(v || '')}
          options={[
            { value: 'teragenda', label: 'Teragenda' },
            { value: 'diproses', label: 'Diproses' },
            { value: 'ditunda', label: 'Ditunda' },
            { value: 'selesai', label: 'Selesai' },
          ]}
        />

        <AppSelect
          className='min-w-[220px]'
          placeholder='--Filter Urgensi--'
          allowClear
          value={urgency || undefined}
          onChange={(v) => setUrgency(v || '')}
          options={urgencyOptions}
          optionFilterProp='label'
          showSearch
        />

        <AppInput
          className='w-[160px]'
          placeholder='Cari'
          value={q}
          onChange={(e) => setQ(e.target.value)}
          allowClear
        />
      </div>

      {isLoading ? (
        <AppAlert
          type='info'
          message='Memuat data...'
          showIcon
        />
      ) : (
        <AppTable
          rowKey='id_agenda_kerja'
          columns={columns}
          dataSource={filteredRows}
          pagination={{ pageSize: 10 }}
          size='middle'
          className='activities-table'
          tableLayout='fixed'
        />
      )}

      <style
        jsx
        global
      >{`
        .activities-table .ant-table-cell {
          white-space: normal;
          word-break: break-word;
        }
        .activities-table .ant-table {
          overflow-x: hidden !important;
        }
      `}</style>

      <div className='mt-2 text-sm font-semibold'>
        Menampilkan {filteredRows.length} dari {rows.length} total data
      </div>
    </AppModal>
  );
}
