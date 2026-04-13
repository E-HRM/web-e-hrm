'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import useSWR from 'swr';
import dayjs from 'dayjs';
import {
  CalendarOutlined,
  CheckCircleOutlined,
  MinusCircleOutlined,
  PlusOutlined,
  ReloadOutlined,
  SaveOutlined,
} from '@ant-design/icons';

import { ApiEndpoints } from '@/constrainst/endpoints';
import { crudService } from '@/app/utils/services/crudService';
import AppButton from '@/app/(view)/component_shared/AppButton';
import AppCard from '@/app/(view)/component_shared/AppCard';
import AppDatePicker from '@/app/(view)/component_shared/AppDatePicker';
import AppInput from '@/app/(view)/component_shared/AppInput';
import AppMessage from '@/app/(view)/component_shared/AppMessage';
import AppTable from '@/app/(view)/component_shared/AppTable';

function createInitialForm() {
  return {
    id_form_freelance: null,
    tanggal_kerja: dayjs(),
    todo_list: [''],
  };
}

async function publicFetcher(url) {
  const response = await fetch(url, { cache: 'no-store' });
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data?.message || 'Gagal memuat form freelance.');
  }

  return data;
}

function formatDate(value, pattern = 'DD MMM YYYY') {
  const parsed = dayjs(value);
  return parsed.isValid() ? parsed.format(pattern) : '-';
}

function formatDateKey(value) {
  const parsed = dayjs(value);
  return parsed.isValid() ? parsed.format('YYYY-MM-DD') : '';
}

function toFormState(submission, fallbackDate = dayjs()) {
  return {
    id_form_freelance: submission?.id_form_freelance || null,
    tanggal_kerja: dayjs(submission?.tanggal_kerja || fallbackDate),
    todo_list: Array.isArray(submission?.todo_items) && submission.todo_items.length ? submission.todo_items : [''],
  };
}

function deriveWorkdayStatus(todoItems = []) {
  const total = (Array.isArray(todoItems) ? todoItems : [])
    .map((item) => String(item || '').trim())
    .filter(Boolean).length;

  return total >= 3 ? 'FULL_DAY' : 'HALF_DAY';
}

function workdayStatusLabel(status) {
  return status === 'FULL_DAY' ? 'Full Day' : 'Half Day';
}

function statusBadge(status) {
  if (status === 'HALF_DAY') {
    return 'inline-flex rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700';
  }
  return 'inline-flex rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700';
}

function decisionBadge(decision) {
  const value = String(decision || 'pending').toLowerCase();
  if (value === 'disetujui') {
    return 'inline-flex rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700';
  }
  if (value === 'ditolak') {
    return 'inline-flex rounded-full bg-rose-50 px-2.5 py-1 text-xs font-semibold text-rose-700';
  }
  return 'inline-flex rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600';
}

function decisionLabel(decision) {
  const value = String(decision || 'pending').toLowerCase();
  if (value === 'disetujui') return 'Disetujui';
  if (value === 'ditolak') return 'Ditolak';
  return 'Pending';
}

export default function FreelanceFormClient({ freelanceId }) {
  const endpoint = useMemo(() => ApiEndpoints.GetPublicFreelanceForm(freelanceId), [freelanceId]);
  const { data, error, isLoading, mutate } = useSWR(endpoint, publicFetcher, {
    revalidateOnFocus: false,
  });

  const initializedRef = useRef(false);
  const [form, setForm] = useState(createInitialForm);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  const freelance = data?.data?.freelance || null;
  const submissions = useMemo(() => (Array.isArray(data?.data?.submissions) ? data.data.submissions : []), [data]);

  useEffect(() => {
    if (!data || initializedRef.current) return;

    const preferredKey = formatDateKey(form.tanggal_kerja || dayjs());
    const matchedSubmission = submissions.find((item) => item?.tanggal_kerja === preferredKey);

    if (matchedSubmission) {
      setForm(toFormState(matchedSubmission, form.tanggal_kerja || dayjs()));
    } else {
      setForm((prev) => ({
        ...createInitialForm(),
        tanggal_kerja: prev.tanggal_kerja || dayjs(),
      }));
    }

    initializedRef.current = true;
  }, [data, form.tanggal_kerja, submissions]);

  const derivedStatus = useMemo(() => deriveWorkdayStatus(form.todo_list), [form.todo_list]);

  const historyColumns = useMemo(
    () => [
      {
        title: 'Tanggal Kerja',
        dataIndex: 'tanggal_kerja',
        key: 'tanggal_kerja',
        width: 160,
        render: (value) => formatDate(value),
      },
      {
        title: 'Status',
        dataIndex: 'status_hari_kerja',
        key: 'status_hari_kerja',
        width: 140,
        render: (value) => <span className={statusBadge(value)}>{value === 'HALF_DAY' ? 'Half Day' : 'Full Day'}</span>,
      },
      {
        title: 'Todo List',
        dataIndex: 'todo_items',
        key: 'todo_items',
        render: (value) => {
          const items = Array.isArray(value) ? value : [];
          return (
            <ol className='list-decimal space-y-1 pl-4 text-sm text-slate-700'>
              {items.map((item, index) => (
                <li key={`${index}-${item}`}>{item}</li>
              ))}
            </ol>
          );
        },
      },
      {
        title: 'Approval Admin',
        dataIndex: 'decision',
        key: 'decision',
        width: 170,
        render: (value, row) => (
          <div className='space-y-1'>
            <span className={decisionBadge(value)}>{decisionLabel(value)}</span>
            <div className='text-xs text-slate-500'>
              {row?.decided_at ? `Diproses ${formatDate(row.decided_at, 'DD MMM YYYY HH:mm')}` : 'Belum diproses admin'}
            </div>
          </div>
        ),
      },
      {
        title: 'Catatan Admin',
        dataIndex: 'note',
        key: 'note',
        width: 260,
        render: (value) => value || <span className='text-slate-400'>Belum ada catatan</span>,
      },
      {
        title: 'Aksi',
        key: 'aksi',
        width: 140,
        align: 'right',
        render: (_, row) => (
          <AppButton
            size='small'
            variant='outline'
            onClick={() => {
              setForm(toFormState(row));
              setErrors({});
            }}
          >
            Gunakan
          </AppButton>
        ),
      },
    ],
    []
  );

  const handleDateChange = (value) => {
    const nextDate = value || null;
    const dateKey = formatDateKey(nextDate);
    const existing = submissions.find((item) => item?.tanggal_kerja === dateKey);

    if (existing) {
      setForm(toFormState(existing, nextDate || dayjs()));
    } else {
      setForm({
        id_form_freelance: null,
        tanggal_kerja: nextDate,
        todo_list: [''],
      });
    }

    setErrors((prev) => ({ ...prev, tanggal_kerja: '', todo_list: '' }));
  };

  const updateTodo = (index, value) => {
    setForm((prev) => ({
      ...prev,
      todo_list: prev.todo_list.map((item, itemIndex) => (itemIndex === index ? value : item)),
    }));
    setErrors((prev) => ({ ...prev, todo_list: '' }));
  };

  const addTodoRow = () => {
    setForm((prev) => ({
      ...prev,
      todo_list: [...prev.todo_list, ''],
    }));
  };

  const removeTodoRow = (index) => {
    setForm((prev) => {
      if (prev.todo_list.length <= 1) {
        return { ...prev, todo_list: [''] };
      }

      return {
        ...prev,
        todo_list: prev.todo_list.filter((_, itemIndex) => itemIndex !== index),
      };
    });
  };

  const validate = () => {
    const nextErrors = {};
    if (!form.tanggal_kerja || !dayjs(form.tanggal_kerja).isValid()) {
      nextErrors.tanggal_kerja = 'Tanggal kerja wajib diisi';
    }

    const cleanedTodos = form.todo_list.map((item) => String(item || '').trim()).filter(Boolean);
    if (!cleanedTodos.length) {
      nextErrors.todo_list = 'Todo list wajib diisi minimal 1 item';
    }

    setErrors(nextErrors);
    return cleanedTodos;
  };

  const submit = async () => {
    const cleanedTodos = validate();
    if (!Array.isArray(cleanedTodos) || !cleanedTodos.length) return;

    try {
      setSaving(true);
      const response = await crudService.post(ApiEndpoints.SubmitPublicFreelanceForm(freelanceId), {
        id_form_freelance: form.id_form_freelance,
        tanggal_kerja: dayjs(form.tanggal_kerja).format('YYYY-MM-DD'),
        todo_list: cleanedTodos,
      });

      if (response?.data) {
        setForm(toFormState(response.data, form.tanggal_kerja));
      }

      await mutate();
      AppMessage.success(response?.message || 'Form freelance berhasil disimpan.');
    } catch (submitError) {
      AppMessage.error(submitError?.message || 'Gagal menyimpan form freelance.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className='min-h-screen bg-[linear-gradient(180deg,#eef6ff_0%,#f8fbff_28%,#ffffff_100%)] px-4 py-8 sm:px-6 lg:px-8'>
      <div className='mx-auto flex w-full max-w-5xl flex-col gap-6'>
        <div className='space-y-2'>
          <h1 className='text-3xl font-bold text-slate-900'>Laporan Aktivitas Freelance</h1>
          <p className='max-w-3xl text-sm text-slate-600'>
            Isi form ini untuk mencatat tanggal kerja dan daftar aktivitas yang dikerjakan.
            Status hari kerja dihitung otomatis dari jumlah todo list. Jika tanggal yang dipilih sudah pernah diisi,
            form akan otomatis memuat data terakhir untuk tanggal tersebut.
          </p>
        </div>

        <AppCard bodyStyle={{ padding: 24 }}>
          {isLoading ? (
            <div className='py-16 text-center text-sm text-slate-500'>Memuat data freelance...</div>
          ) : error ? (
            <div className='space-y-4 py-10 text-center'>
              <div className='text-base font-semibold text-rose-600'>Gagal memuat form freelance</div>
              <div className='text-sm text-slate-500'>{error.message}</div>
              <div>
                <AppButton
                  variant='outline'
                  icon={<ReloadOutlined />}
                  onClick={() => mutate()}
                >
                  Muat Ulang
                </AppButton>
              </div>
            </div>
          ) : !freelance ? (
            <div className='py-16 text-center text-sm text-slate-500'>Freelance tidak ditemukan.</div>
          ) : (
            <div className='space-y-6'>
              <div className='grid gap-4 rounded-2xl bg-slate-50 p-5 md:grid-cols-[1.5fr,1fr,1fr]'>
                <div>
                  <div className='text-xs font-semibold uppercase tracking-[0.2em] text-slate-500'>Freelance</div>
                  <div className='mt-2 text-xl font-bold text-slate-900'>{freelance.nama}</div>
                  <div className='mt-1 text-sm text-slate-500'>{freelance.email || 'Tanpa email'}</div>
                </div>
                <div>
                  <div className='text-xs font-semibold uppercase tracking-[0.2em] text-slate-500'>Kontak</div>
                  <div className='mt-2 text-sm font-medium text-slate-800'>{freelance.kontak || '-'}</div>
                </div>
                <div>
                  <div className='text-xs font-semibold uppercase tracking-[0.2em] text-slate-500'>Alamat</div>
                  <div className='mt-2 text-sm font-medium text-slate-800'>{freelance.alamat || '-'}</div>
                </div>
              </div>

              <div className='grid gap-4 md:grid-cols-[1.35fr,0.65fr]'>
                <AppDatePicker
                  label='Tanggal Kerja'
                  required
                  value={form.tanggal_kerja}
                  error={errors.tanggal_kerja}
                  format='DD MMMM YYYY'
                  onChange={handleDateChange}
                />

                <div className='rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3'>
                  <div className='text-xs font-semibold uppercase tracking-[0.18em] text-slate-500'>Status Hari Kerja</div>
                  <div className='mt-2 inline-flex rounded-full bg-white px-3 py-1.5 text-sm font-semibold text-slate-800 shadow-sm'>
                    {workdayStatusLabel(derivedStatus)}
                  </div>
                  <div className='mt-2 text-xs text-slate-500'>
                    Status dihitung otomatis dari jumlah todo list
                  </div>
                </div>
              </div>

              <div className='space-y-3'>
                <div className='flex flex-wrap items-center justify-between gap-3'>
                  <div>
                    <div className='text-sm font-semibold text-slate-900'>Todo List</div>
                    <div className='text-xs text-slate-500'>Tambahkan aktivitas satu per satu agar mudah dibaca.</div>
                    <div className='mt-1 text-xs font-medium text-slate-600'>
                      Status otomatis saat ini: {workdayStatusLabel(derivedStatus)}
                    </div>
                  </div>

                  <AppButton
                    variant='outline'
                    icon={<PlusOutlined />}
                    onClick={addTodoRow}
                  >
                    Tambah Baris
                  </AppButton>
                </div>

                <div className='space-y-3'>
                  {form.todo_list.map((todo, index) => (
                    <div
                      key={`todo-${index}`}
                      className='rounded-2xl border border-slate-200 bg-white p-4 shadow-sm'
                    >
                      <div className='mb-3 flex items-center justify-between gap-3'>
                        <div className='inline-flex h-8 w-8 items-center justify-center rounded-full bg-[#003A6F] text-sm font-semibold text-white'>
                          {index + 1}
                        </div>
                        <AppButton
                          variant='ghost'
                          danger={false}
                          icon={<MinusCircleOutlined />}
                          onClick={() => removeTodoRow(index)}
                        >
                          Hapus
                        </AppButton>
                      </div>

                      <AppInput.TextArea
                        placeholder='Contoh: Review desain landing page untuk campaign April'
                        value={todo}
                        onChange={(event) => updateTodo(index, event.target.value)}
                        autoSize={{ minRows: 2, maxRows: 5 }}
                      />
                    </div>
                  ))}
                </div>

                {errors.todo_list ? <div className='text-sm font-medium text-rose-600'>{errors.todo_list}</div> : null}
              </div>

              <div className='flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 pt-5'>
                <div className='inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700'>
                  <CheckCircleOutlined />
                  {form.id_form_freelance ? 'Mode edit untuk tanggal terpilih' : 'Mode input baru'}
                </div>

                <div className='flex flex-wrap items-center gap-2'>
                  <AppButton
                    variant='ghost'
                    icon={<ReloadOutlined />}
                    onClick={() => {
                      setErrors({});
                      initializedRef.current = false;
                      mutate();
                    }}
                  >
                    Refresh
                  </AppButton>
                  <AppButton
                    variant='primary'
                    loading={saving}
                    icon={<SaveOutlined />}
                    onClick={submit}
                  >
                    Simpan Form
                  </AppButton>
                </div>
              </div>
            </div>
          )}
        </AppCard>

        <AppTable
          title='Riwayat Form'
          subtitle='Data terbaru per tanggal kerja untuk freelance ini.'
          rowKey='id_form_freelance'
          columns={historyColumns}
          dataSource={submissions}
          loading={isLoading}
          pagination={false}
          emptyTitle='Belum ada riwayat form'
          emptyDescription='Riwayat pengisian akan muncul setelah form pertama berhasil disimpan.'
        />
      </div>
    </div>
  );
}
