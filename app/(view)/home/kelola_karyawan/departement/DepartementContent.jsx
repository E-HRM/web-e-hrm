'use client';

import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';
import { PlusOutlined, AppstoreOutlined, UnorderedListOutlined, SearchOutlined } from '@ant-design/icons';

import AppTypography from '../../../component_shared/AppTypography';
import AppInput from '../../../component_shared/AppInput';
import AppButton from '../../../component_shared/AppButton';
import AppSelect from '../../../component_shared/AppSelect';
import AppCard from '../../../component_shared/AppCard';
import AppEmpty from '../../../component_shared/AppEmpty';
import AppModal from '../../../component_shared/AppModal';
import AppForm from '../../../component_shared/AppForm';
import AppGrid from '../../../component_shared/AppGrid';
import AppSegmented from '../../../component_shared/AppSegmented';
import AppSpace from '../../../component_shared/AppSpace';

import DepartmentCard from './component_departement/DepartementCard';
import EditDivisionModal from './component_departement/EditDivisionModal';
import { confirmDelete } from './component_departement/confirm';
import { useDepartementViewModel } from './useDepartementViewModel';

export default function DepartementContent() {
  const router = useRouter();
  const { divisions, departementLoading, onAdd, onUpdate, onDelete } = useDepartementViewModel();

  const [layout, setLayout] = useState('grid'); // "grid" | "list"
  const [orderBy, setOrderBy] = useState('name'); // "name" | "members"
  const [q, setQ] = useState('');

  // Add modal
  const [addOpen, setAddOpen] = useState(false);
  const [addSaving, setAddSaving] = useState(false);

  // Edit modal
  const [editOpen, setEditOpen] = useState(false);
  const [editId, setEditId] = useState(null);
  const [editName, setEditName] = useState('');
  const [saving, setSaving] = useState(false);

  const openEdit = (id, nm) => {
    setEditId(id);
    setEditName(nm);
    setEditOpen(true);
  };

  const goToEmployees = (d) => {
    router.push(`/home/kelola_karyawan/departement/karyawan?id=${encodeURIComponent(d.id)}&name=${encodeURIComponent(d.name)}`);
  };

  const filtered = useMemo(() => {
    const base = Array.isArray(divisions) ? divisions : [];
    const f = q.trim().toLowerCase();

    let res = f ? base.filter((d) => (d?.name || '').toLowerCase().includes(f)) : base.slice();

    if (orderBy === 'name') {
      res.sort((a, b) => (a?.name || '').localeCompare(b?.name || ''));
    } else {
      res.sort((a, b) => (b?.count || 0) - (a?.count || 0));
    }

    return res;
  }, [divisions, q, orderBy]);

  return (
    <div className='space-y-4 px-4 md:px-6 lg:px-8 py-5'>
      {/* Header */}
      <div className='flex items-center gap-3 flex-wrap'>
        <AppTypography.Title
          level={3}
          className='!mb-0'
        >
          Data Departement
        </AppTypography.Title>

        {/* kiri: Search + Urutkan */}
        <div className='flex items-center gap-2 ml-auto md:ml-6 flex-wrap'>
          <div className='w-56'>
            <AppInput
              allowClear
              placeholder='Cari departemen…'
              value={q}
              onChange={(e) => setQ(e.target.value)}
              prefix={<SearchOutlined />}
            />
          </div>

          <div className='w-56'>
            <AppSelect
              value={orderBy}
              onChange={setOrderBy}
              options={[
                { value: 'name', label: 'Urutkan: Nama' },
                { value: 'members', label: 'Urutkan: Jumlah Karyawan' },
              ]}
            />
          </div>
        </div>

        {/* kanan: tampilan + Tambah */}
        <div className='flex items-center gap-2'>
          <AppSegmented
            value={layout}
            onChange={setLayout}
            options={[
              {
                value: 'grid',
                label: (
                  <span className='inline-flex items-center gap-2'>
                    <AppstoreOutlined />
                    <span>Grid</span>
                  </span>
                ),
              },
              {
                value: 'list',
                label: (
                  <span className='inline-flex items-center gap-2'>
                    <UnorderedListOutlined />
                    <span>List</span>
                  </span>
                ),
              },
            ]}
          />

          <AppButton
            variant='primary'
            icon={<PlusOutlined />}
            onClick={() => setAddOpen(true)}
          >
            Tambah
          </AppButton>
        </div>
      </div>

      {/* Grid/List */}
      {filtered.length === 0 ? (
        <AppCard loading={departementLoading}>
          <AppEmpty description='Belum ada departemen' />
        </AppCard>
      ) : layout === 'grid' ? (
        <AppGrid.Row gap={[16, 16]}>
          {filtered.map((d) => (
            <AppGrid.Col
              key={d.id}
              xs={24}
              sm={12}
              xl={8}
              xxl={6}
            >
              <DepartmentCard
                name={d.name}
                count={d.count}
                layout='grid'
                onClick={() => goToEmployees(d)}
                showActions
                onEdit={() => openEdit(d.id, d.name)}
                onDelete={() =>
                  confirmDelete({
                    onOk: async () => {
                      await onDelete(d.id);
                    },
                  })
                }
              />
            </AppGrid.Col>
          ))}
        </AppGrid.Row>
      ) : (
        <AppSpace
          direction='vertical'
          size='sm'
          block
        >
          {filtered.map((d) => (
            <DepartmentCard
              key={d.id}
              name={d.name}
              count={d.count}
              layout='list'
              onClick={() => goToEmployees(d)}
              showActions
              onEdit={() => openEdit(d.id, d.name)}
              onDelete={() =>
                confirmDelete({
                  onOk: async () => {
                    await onDelete(d.id);
                  },
                })
              }
            />
          ))}
        </AppSpace>
      )}

      {/* ADD Modal */}
      <AppModal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        title='Tambah Departemen'
        subtitle='Tambahkan departemen baru'
        footer={false}
        destroyOnClose
      >
        <AppForm
          fields={[
            {
              type: 'text',
              name: 'name',
              label: 'Nama Departemen',
              placeholder: 'Contoh: HR',
              rules: [{ required: true, message: 'Nama departemen wajib diisi' }],
            },
          ]}
          loading={addSaving}
          submitText='Simpan'
          onFinish={async (values) => {
            const nm = String(values?.name ?? '').trim();
            if (!nm) return;

            try {
              setAddSaving(true);
              await onAdd(nm);
              setAddOpen(false);
            } finally {
              setAddSaving(false);
            }
          }}
        />
      </AppModal>

      {/* EDIT Modal */}
      <EditDivisionModal
        open={editOpen}
        initialName={editName}
        loading={saving}
        onCancel={() => setEditOpen(false)}
        onSubmit={async (nm) => {
          try {
            setSaving(true);
            await onUpdate(editId, nm);
            setEditOpen(false);
          } finally {
            setSaving(false);
          }
        }}
      />
    </div>
  );
}
