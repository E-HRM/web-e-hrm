// AktivitasContent.jsx
'use client';

import { useMemo, useState, useCallback } from 'react';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';

import { EditOutlined, DeleteOutlined, PlusOutlined, UploadOutlined, DownloadOutlined, SearchOutlined } from '@ant-design/icons';

import AppCard from '@/app/(view)/component_shared/AppCard';
import AppSelect from '@/app/(view)/component_shared/AppSelect';
import AppDatePicker from '@/app/(view)/component_shared/AppDatePicker';
import AppInput from '@/app/(view)/component_shared/AppInput';
import AppTag from '@/app/(view)/component_shared/AppTag';
import AppTable from '@/app/(view)/component_shared/AppTable';
import AppSpace from '@/app/(view)/component_shared/AppSpace';
import AppButton from '@/app/(view)/component_shared/AppButton';
import AppTooltip from '@/app/(view)/component_shared/AppTooltip';
import AppEmpty from '@/app/(view)/component_shared/AppEmpty';
import AppSkeleton from '@/app/(view)/component_shared/AppSkeleton';
import AppModal from '@/app/(view)/component_shared/AppModal';
import AppMessage from '@/app/(view)/component_shared/AppMessage';
import AppPopconfirm from '@/app/(view)/component_shared/AppPopconfirm';
import AppAlert from '@/app/(view)/component_shared/AppAlert';
import AppUpload from '@/app/(view)/component_shared/AppUpload';
import AppForm, { useAppForm } from '@/app/(view)/component_shared/AppForm';

import useAktivitasTimesheetViewModel from './AktivitasViewModel';
import { ApiEndpoints } from '../../../../../constrainst/endpoints';

dayjs.extend(utc);

/* === helper tampilan === */
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

function normalizeUrgency(v) {
  const s = (v || '').toString().trim().toUpperCase();
  switch (s) {
    case 'PENTING MENDESAK':
      return { label: 'PENTING MENDESAK', color: 'red' };
    case 'TIDAK PENTING TAPI MENDESAK':
    case 'TIDAK PENTING, TAPI MENDESAK':
      return { label: 'TIDAK PENTING TAPI MENDESAK', color: 'magenta' };
    case 'PENTING TAK MENDESAK':
    case 'PENTING TIDAK MENDESAK':
      return { label: 'PENTING TAK MENDESAK', color: 'orange' };
    case 'TIDAK PENTING TIDAK MENDESAK':
      return { label: 'TIDAK PENTING TIDAK MENDESAK', color: 'default' };
    default:
      return s ? { label: s, color: 'default' } : null;
  }
}

export default function AktivitasContent() {
  const vm = useAktivitasTimesheetViewModel();

  const [openAdd, setOpenAdd] = useState(false);
  const [savingAdd, setSavingAdd] = useState(false);
  const [addForm] = useAppForm();

  const [openAddAgenda, setOpenAddAgenda] = useState(false);
  const [savingAgenda, setSavingAgenda] = useState(false);
  const [agendaForm] = useAppForm();

  const [openEdit, setOpenEdit] = useState(false);
  const [savingEdit, setSavingEdit] = useState(false);
  const [editForm] = useAppForm();
  const [editingRow, setEditingRow] = useState(null);

  const [openImport, setOpenImport] = useState(false);
  const [importing, setImporting] = useState(false);
  const [fileImport, setFileImport] = useState(null);

  const handleOpenEdit = useCallback(
    (row) => {
      setEditingRow(row);
      editForm.setFieldsValue({
        deskripsi_kerja: row.deskripsi_kerja || '',
        id_agenda: row.id_agenda || row.agenda?.id_agenda || undefined,
      });
      setOpenEdit(true);
    },
    [editForm]
  );

  const handleDownloadTemplate = useCallback(async () => {
    try {
      const res = await fetch(ApiEndpoints.ImportAgendaKerjaTemplate, { method: 'GET' });
      if (!res.ok) throw new Error('Gagal mengunduh template');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'format-import-timesheet.xlsx';
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error(e);
      AppMessage.error(e?.message || 'Gagal mengunduh template');
    }
  }, []);

  const handleExport = useCallback(() => {
    if (!vm.filters.user_id) return;
    const p = new URLSearchParams();
    p.set('user_id', vm.filters.user_id);
    if (vm.filters.id_agenda) p.set('id_agenda', vm.filters.id_agenda);
    if (vm.filters.status) p.set('status', vm.filters.status);
    if (vm.filters.from) p.set('from', vm.filters.from);
    if (vm.filters.to) p.set('to', vm.filters.to);
    p.set('perPage', '1000');
    p.set('format', 'xlsx');
    window.location.href = `${ApiEndpoints.GetAgendaKerja}?${p.toString()}`;
  }, [vm.filters]);

  const columns = useMemo(
    () => [
      {
        title: 'Pekerjaan',
        dataIndex: 'deskripsi_kerja',
        key: 'deskripsi_kerja',
        width: 420,
        render: (v, r) => (
          <div
            className='flex flex-col'
            style={{ maxWidth: 400 }}
          >
            <span
              className='font-medium'
              style={{
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
                overflowWrap: 'anywhere',
              }}
              title={v}
            >
              {v || '—'}
            </span>
            <span className='opacity-60 text-xs'>Dibuat: {r.created_at ? dayjs.utc(r.created_at).local().format('DD MMM YYYY HH:mm') : '—'}</span>
          </div>
        ),
      },
      {
        title: 'Proyek',
        dataIndex: ['agenda', 'nama_agenda'],
        key: 'agenda',
        width: 100,
        render: (v) => v || '—',
      },
      {
        title: 'Waktu',
        key: 'waktu',
        width: 100,
        render: (_, r) => {
          const s = r.start_date ? dayjs.utc(r.start_date) : null;
          const e = r.end_date ? dayjs.utc(r.end_date) : null;

          if (!s && !e) return 'Belum diisi';

          const isSentinel = s && e && s.format('HH:mm:ss') === '00:00:00' && e.format('HH:mm:ss') === '00:00:00';

          if (isSentinel) return 'Belum diisi';
          if (s && e && s.isSame(e)) return s.format('HH:mm');
          return `${s ? s.format('HH:mm') : '-'} - ${e ? e.format('HH:mm') : '-'}`;
        },
      },
      {
        title: 'Durasi',
        dataIndex: 'duration_seconds',
        key: 'durasi',
        width: 100,
        render: (sec) => formatDuration(sec),
      },
      {
        title: 'Status',
        dataIndex: 'status',
        key: 'status',
        width: 120,
        render: (st = '') => {
          const map = {
            selesai: { color: 'success', text: 'Selesai' },
            ditunda: { color: 'warning', text: 'Ditunda' },
            diproses: { color: 'processing', text: 'Diproses' },
            teragenda: { color: 'default', text: 'Teragenda' },
          };
          const m = map[st] || { color: 'default', text: st ? st[0].toUpperCase() + st.slice(1) : '—' };
          return <AppTag color={m.color}>{m.text}</AppTag>;
        },
      },
      {
        title: 'Urgensi',
        dataIndex: 'kebutuhan_agenda',
        key: 'urgensi',
        width: 220,
        render: (v) => {
          const u = normalizeUrgency(v);
          if (!u) return <AppTag style={{ fontStyle: 'italic' }}>Belum diisi</AppTag>;
          return <AppTag color={u.color}>{u.label}</AppTag>;
        },
      },
      {
        title: 'Pembuat',
        dataIndex: 'user',
        key: 'user',
        width: 180,
        render: (u) => u?.nama_pengguna || u?.email || '—',
      },
      {
        title: 'Aksi',
        key: 'aksi',
        align: 'right',
        fixed: 'right',
        width: 120,
        render: (_, r) => (
          <AppSpace size='xs'>
            <AppTooltip title='Ubah aktivitas'>
              <AppButton
                variant='outline'
                size='small'
                icon={<EditOutlined />}
                onClick={() => handleOpenEdit(r)}
              />
            </AppTooltip>

            <AppPopconfirm
              title='Hapus pekerjaan?'
              okText='Hapus'
              cancelText='Batal'
              onConfirm={() => vm.remove(r.id_agenda_kerja)}
            >
              <AppButton
                variant='danger'
                size='small'
                icon={<DeleteOutlined />}
              />
            </AppPopconfirm>
          </AppSpace>
        ),
      },
    ],
    [handleOpenEdit, vm]
  );

  const addFields = useMemo(() => {
    return [
      {
        name: 'deskripsi_kerja',
        label: 'Deskripsi Pekerjaan',
        type: 'text',
        rules: [{ required: true, message: 'Wajib diisi' }],
        placeholder: 'Mis. Membuat laporan mingguan',
      },
      {
        type: 'row',
        gutter: [8, 8],
        children: [
          {
            name: 'id_agenda',
            label: 'Proyek',
            type: 'select',
            rules: [{ required: true, message: 'Pilih proyek/agenda' }],
            col: { xs: 24, md: 16 },
            placeholder: 'Pilih Proyek',
            controlProps: {
              options: vm.agendaOptions,
              loading: vm.loadingAgenda,
              showSearch: true,
              optionFilterProp: 'label',
            },
          },
          {
            type: 'custom',
            noItem: true,
            col: { xs: 24, md: 8 },
            component: () => (
              <div className='md:pt-[30px]'>
                <AppButton
                  variant='primary'
                  onClick={() => setOpenAddAgenda(true)}
                >
                  Tambah Proyek
                </AppButton>
              </div>
            ),
          },
        ],
      },
    ];
  }, [vm.agendaOptions, vm.loadingAgenda]);

  const editFields = useMemo(() => {
    return [
      {
        name: 'deskripsi_kerja',
        label: 'Deskripsi Pekerjaan',
        type: 'text',
        rules: [{ required: true, message: 'Wajib diisi' }],
        placeholder: 'Mis. Membuat laporan mingguan',
      },
      {
        name: 'id_agenda',
        label: 'Proyek/Agenda',
        type: 'select',
        rules: [{ required: true, message: 'Pilih proyek/agenda' }],
        placeholder: 'Pilih Proyek',
        controlProps: {
          options: vm.agendaOptions,
          loading: vm.loadingAgenda,
          showSearch: true,
          optionFilterProp: 'label',
        },
      },
    ];
  }, [vm.agendaOptions, vm.loadingAgenda]);

  const agendaFields = useMemo(() => {
    return [
      {
        name: 'nama_agenda',
        label: 'Nama Proyek/Agenda',
        type: 'text',
        rules: [{ required: true, message: 'Wajib diisi' }],
        placeholder: 'Mis. Pengembangan HRIS',
      },
    ];
  }, []);

  const onFinishAdd = useCallback(
    async (values) => {
      try {
        const deskripsi = String(values?.deskripsi_kerja || '').trim();
        if (!deskripsi) {
          AppMessage.warning('Deskripsi pekerjaan wajib diisi');
          return;
        }

        setSavingAdd(true);
        await vm.createActivity({
          deskripsi_kerja: deskripsi,
          id_agenda: values.id_agenda,
        });

        setOpenAdd(false);
        addForm.resetFields();
        AppMessage.success('Pekerjaan ditambahkan');
      } catch (e) {
        AppMessage.error(e?.message || 'Gagal menambahkan pekerjaan');
      } finally {
        setSavingAdd(false);
      }
    },
    [addForm, vm]
  );

  const onFinishEdit = useCallback(
    async (values) => {
      try {
        if (!editingRow) return;

        const deskripsi = String(values?.deskripsi_kerja || '').trim();
        if (!deskripsi) {
          AppMessage.warning('Deskripsi pekerjaan wajib diisi');
          return;
        }

        setSavingEdit(true);
        await vm.updateActivity(editingRow.id_agenda_kerja, {
          deskripsi_kerja: deskripsi,
          id_agenda: values.id_agenda,
        });

        setOpenEdit(false);
        setEditingRow(null);
        editForm.resetFields();
        AppMessage.success('Aktivitas diperbarui');
      } catch (e) {
        AppMessage.error(e?.message || 'Gagal memperbarui aktivitas');
      } finally {
        setSavingEdit(false);
      }
    },
    [editForm, editingRow, vm]
  );

  const onFinishAgenda = useCallback(
    async (values) => {
      try {
        const nama = String(values?.nama_agenda || '').trim();
        if (!nama) {
          AppMessage.warning('Nama proyek wajib diisi');
          return;
        }

        setSavingAgenda(true);
        await vm.createAgendaMaster(nama);

        setOpenAddAgenda(false);
        agendaForm.resetFields();
        AppMessage.success('Proyek/Agenda berhasil dibuat');
      } catch (e) {
        AppMessage.error(e?.message || 'Gagal membuat proyek/agenda');
      } finally {
        setSavingAgenda(false);
      }
    },
    [agendaForm, vm]
  );

  return (
    <div className='p-4'>
      <AppCard
        styles={{ body: { paddingTop: 16 } }}
        title={<span className='text-lg font-semibold'>Aktivitas</span>}
        extra={
          <AppSpace size='sm'>
            <AppButton
              variant='outline'
              icon={<DownloadOutlined />}
              onClick={handleExport}
              disabled={!vm.filters.user_id}
            >
              Export Excel
            </AppButton>

            <AppButton
              variant='primary'
              icon={<UploadOutlined />}
              onClick={() => setOpenImport(true)}
              disabled={!vm.filters.user_id}
            >
              Import Excel
            </AppButton>

            <AppButton
              variant='primary'
              icon={<PlusOutlined />}
              onClick={() => setOpenAdd(true)}
              disabled={!vm.filters.user_id}
            >
              Tambah Pekerjaan
            </AppButton>
          </AppSpace>
        }
      >
        {/* BAR FILTER ATAS */}
        <div className='mb-4 grid grid-cols-1 gap-3 items-center md:grid-cols-[minmax(320px,1fr)_180px_18px_180px]'>
          <AppSelect
            className='w-full'
            placeholder='Pilih Karyawan'
            options={vm.userOptions}
            loading={vm.loadingUsers}
            value={vm.filters.user_id || undefined}
            onChange={(v) => vm.setFilters((s) => ({ ...s, user_id: v }))}
            showSearch
            optionFilterProp='label'
            listHeight={400}
            virtual
            size='large'
          />

          <AppDatePicker
            className='w-full'
            value={vm.filters.from ? dayjs(vm.filters.from, 'YYYY-MM-DD HH:mm:ss') : null}
            onChange={(d) =>
              vm.setFilters((s) => ({
                ...s,
                from: d ? d.startOf('day').format('YYYY-MM-DD HH:mm:ss') : '',
              }))
            }
            format='DD/MM/YYYY'
            size='large'
          />

          <div className='hidden md:flex items-center justify-center opacity-60'>-</div>

          <AppDatePicker
            className='w-full'
            value={vm.filters.to ? dayjs(vm.filters.to, 'YYYY-MM-DD HH:mm:ss') : null}
            onChange={(d) =>
              vm.setFilters((s) => ({
                ...s,
                to: d ? d.endOf('day').format('YYYY-MM-DD HH:mm:ss') : '',
              }))
            }
            format='DD/MM/YYYY'
            size='large'
          />
        </div>

        {/* STRIP TANGGAL + TABEL */}
        {vm.filters.user_id ? (
          vm.loading ? (
            <AppSkeleton active />
          ) : (
            <>
              <div className='flex gap-2 overflow-x-auto pb-2 -mb-1'>
                {vm.dayBuckets.map((d) => {
                  const active = vm.selectedDay === d.date;
                  return (
                    <button
                      key={d.date}
                      onClick={() => vm.setSelectedDay(active ? '' : d.date)}
                      className={[
                        'group px-3 py-2 rounded-md border',
                        'text-left whitespace-nowrap transition-colors',
                        active ? 'bg-[#003A6F] text-white border-transparent shadow-sm' : 'border-white/10 hover:bg-[#003A6F] hover:text-white hover:border-transparent hover:shadow-sm',
                      ].join(' ')}
                    >
                      <div className={['font-semibold', active ? 'text-white' : '', 'group-hover:text-white'].join(' ')}>{dayjs(d.date).format('DD MMM YYYY')}</div>
                      <div className={[active ? 'text-white' : 'opacity-70', 'group-hover:text-white'].join(' ')}>{d.count} Pekerjaan</div>
                    </button>
                  );
                })}
              </div>

              <div className='mt-4 flex flex-col gap-3'>
                {/* Baris 1: Kontainer untuk Dropdown Status & Proyek (Sejajar ke samping) */}
                <div className='flex flex-row gap-3 items-center'>
                  <AppSelect
                    // Menggunakan !w-[200px] untuk memaksa lebar fix, agar tidak full width
                    className='!w-[200px]'
                    placeholder='-- Filter Status --'
                    allowClear
                    value={vm.filters.status || undefined}
                    onChange={(v) => vm.setFilters((s) => ({ ...s, status: v || '' }))}
                    options={[
                      { value: 'teragenda', label: 'Teragenda' },
                      { value: 'diproses', label: 'Diproses' },
                      { value: 'ditunda', label: 'Ditunda' },
                      { value: 'selesai', label: 'Selesai' },
                    ]}
                  />

                  <AppSelect
                    // Menggunakan !w-[220px] agar pas dengan panjang teks
                    className='!w-[220px]'
                    placeholder='Filter Proyek'
                    allowClear
                    value={vm.filters.id_agenda || undefined}
                    onChange={(v) => vm.setFilters((s) => ({ ...s, id_agenda: v || '' }))}
                    options={vm.agendaOptions}
                    showSearch
                    optionFilterProp='label'
                  />
                </div>

                {/* Baris 2: Pencarian (Full Width ke bawah) */}
                <div className='w-full'>
                  <AppInput
                    className='w-full'
                    placeholder='Cari'
                    value={vm.filters.q}
                    onChange={(e) => vm.setFilters((s) => ({ ...s, q: e.target.value }))}
                    allowClear
                    suffix={<SearchOutlined className='text-slate-400' />}
                  />
                </div>
              </div>

              <div className='mt-4'>
                {vm.filteredRows.length === 0 ? (
                  <AppEmpty description='Tidak ada pekerjaan pada rentang/tanggal ini' />
                ) : (
                  <AppTable
                    rowKey='id_agenda_kerja'
                    columns={columns}
                    dataSource={vm.filteredRows}
                    pagination={false}
                    size='middle'
                    scroll={{ x: 1100 }}
                  />
                )}
              </div>
            </>
          )
        ) : (
          <AppAlert
            className='mt-2'
            type='info'
            showIcon
            message='Silakan pilih karyawan terlebih dahulu'
          />
        )}
      </AppCard>

      {/* MODAL: TAMBAH PEKERJAAN */}
      <AppModal
        title='Tambah Pekerjaan'
        open={openAdd}
        onClose={() => setOpenAdd(false)}
        maskClosable={false}
        destroyOnClose
        footer={({ close }) => (
          <div className='flex justify-end gap-2'>
            <AppButton
              variant='outline'
              disabled={savingAdd}
              onClick={() => {
                close();
                addForm.resetFields();
              }}
            >
              Batal
            </AppButton>
            <AppButton
              variant='primary'
              loading={savingAdd}
              onClick={() => addForm.submit()}
            >
              Simpan
            </AppButton>
          </div>
        )}
      >
        <AppForm
          form={addForm}
          layout='vertical'
          requiredMark={false}
          showSubmit={false}
          fields={addFields}
          onFinish={onFinishAdd}
        />
      </AppModal>

      {/* MODAL: UBAH AKTIVITAS */}
      <AppModal
        title='Ubah Aktivitas'
        open={openEdit}
        onClose={() => {
          setOpenEdit(false);
          setEditingRow(null);
          editForm.resetFields();
        }}
        maskClosable={false}
        destroyOnClose
        footer={({ close }) => (
          <div className='flex justify-end gap-2'>
            <AppButton
              variant='outline'
              disabled={savingEdit}
              onClick={() => {
                close();
                setEditingRow(null);
                editForm.resetFields();
              }}
            >
              Batal
            </AppButton>
            <AppButton
              variant='primary'
              loading={savingEdit}
              onClick={() => editForm.submit()}
              disabled={!editingRow}
            >
              Simpan
            </AppButton>
          </div>
        )}
      >
        <AppForm
          form={editForm}
          layout='vertical'
          requiredMark={false}
          showSubmit={false}
          fields={editFields}
          onFinish={onFinishEdit}
        />
      </AppModal>

      {/* MODAL: IMPOR EXCEL */}
      <AppModal
        title='Impor Excel'
        open={openImport}
        onClose={() => {
          setOpenImport(false);
          setFileImport(null);
        }}
        destroyOnClose
        maskClosable={false}
        okText='Proses'
        cancelText='Tutup'
        okDisabled={!fileImport}
        okLoading={importing}
        onOk={async () => {
          try {
            if (!fileImport) return false;
            setImporting(true);

            const fd = new FormData();
            fd.append('file', fileImport);
            fd.append('user_id', vm.filters.user_id);
            fd.append('createAgendaIfMissing', '1');

            const res = await fetch(ApiEndpoints.ImportAgendaKerja, {
              method: 'POST',
              body: fd,
            });

            const json = await res.json();
            if (!res.ok || json?.ok === false) {
              throw new Error(json?.message || 'Gagal impor');
            }

            AppMessage.success(`Impor selesai: ${json?.summary?.created || 0} baris dibuat`);
            setOpenImport(false);
            setFileImport(null);
            vm.refresh();
            return true;
          } catch (e) {
            AppMessage.error(e?.message || 'Gagal memproses impor');
            return false;
          } finally {
            setImporting(false);
          }
        }}
        closeOnOk
      >
        <AppAlert
          type='info'
          showIcon
          className='mb-3'
          message='PENTING!'
          description={
            <div>
              <ul className='list-disc pl-5 space-y-1'>
                <li>
                  Gunakan template 3 kolom: <b>Tanggal Proyek</b>, <b>Aktivitas</b>, Pastikan penulisan <b>Proyek</b> sesuai dengan Proyek yang sudah dibuat pada menu Proyek.{' '}
                  <a
                    className='text-blue-600 underline cursor-pointer'
                    onClick={(e) => {
                      e.preventDefault();
                      handleDownloadTemplate();
                    }}
                  >
                    Download format impor excel di sini
                  </a>
                  .
                </li>
                <li>Kolom jam (Mulai/Selesai) tidak wajib; jika kosong, sistem set 00:00:00.</li>
                <li>Aksi impor hanya dijalankan bila data valid.</li>
              </ul>
            </div>
          }
        />

        <div className='mb-2 font-medium'>
          Pilih Berkas <span className='text-red-500'>*</span>
        </div>

        <div className='flex flex-wrap items-center gap-2'>
          <AppUpload
            accept='.xlsx,.xls'
            maxCount={1}
            maxSizeBytes={500 * 1024}
            showUploadList={fileImport ? { showRemoveIcon: true } : false}
            beforeUpload={(file) => {
              setFileImport(file);
              return false; // manual upload
            }}
            onRemove={() => {
              setFileImport(null);
              return true;
            }}
          >
            <AppButton variant='primary'>Pilih File</AppButton>
          </AppUpload>

          <div className='text-sm'>{fileImport?.name || 'Belum ada file'}</div>
        </div>

        <div className='text-xs opacity-60 mt-2'>Ukuran Maksimal: 500 KB</div>
      </AppModal>

      {/* MODAL: TAMBAH PROYEK MASTER */}
      <AppModal
        title='Tambah Proyek/Agenda'
        open={openAddAgenda}
        onClose={() => setOpenAddAgenda(false)}
        maskClosable={false}
        destroyOnClose
        footer={({ close }) => (
          <div className='flex justify-end gap-2'>
            <AppButton
              variant='outline'
              disabled={savingAgenda}
              onClick={() => {
                close();
                agendaForm.resetFields();
              }}
            >
              Batal
            </AppButton>
            <AppButton
              variant='primary'
              loading={savingAgenda}
              onClick={() => agendaForm.submit()}
            >
              Simpan
            </AppButton>
          </div>
        )}
      >
        <AppForm
          form={agendaForm}
          layout='vertical'
          requiredMark={false}
          showSubmit={false}
          fields={agendaFields}
          onFinish={onFinishAgenda}
        />
      </AppModal>
    </div>
  );
}