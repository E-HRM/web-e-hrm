'use client';

import dynamic from 'next/dynamic';
import { useMemo, useState } from 'react';
import { SearchOutlined, PlusOutlined, EditOutlined, DeleteOutlined, EnvironmentOutlined, AimOutlined } from '@ant-design/icons';

import AppInput from '@/app/(view)/component_shared/AppInput';
import AppSelect from '@/app/(view)/component_shared/AppSelect';
import AppButton from '@/app/(view)/component_shared/AppButton';
import AppTable from '@/app/(view)/component_shared/AppTable';
import AppTooltip from '@/app/(view)/component_shared/AppTooltip';
import AppModal from '@/app/(view)/component_shared/AppModal';
import AppForm from '@/app/(view)/component_shared/AppForm';
import AppCard from '@/app/(view)/component_shared/AppCard';
import AppTag from '@/app/(view)/component_shared/AppTag';
import AppSpace from '@/app/(view)/component_shared/AppSpace';
import AppTypography from '@/app/(view)/component_shared/AppTypography';

import useLokasiViewModel from './useLokasiViewModel';

const BRAND = { accent: '#003A6F' };

// react-leaflet butuh DOM → matikan SSR
const LocationPicker = dynamic(() => import('./component_lokasi/LocationPicker'), { ssr: false });

export default function LokasiContent() {
  const {
    rows,
    loading,
    pagination,
    onTableChange,
    // filters
    search,
    setSearch,
    radiusMin,
    setRadiusMin,
    radiusMax,
    setRadiusMax,
    orderBy,
    setOrderBy,
    sort,
    setSort,
    // actions
    addLocation,
    updateLocation,
    deleteLocation,
  } = useLokasiViewModel();

  // Modal tambah
  const [openAdd, setOpenAdd] = useState(false);
  const [addLoading, setAddLoading] = useState(false);
  const [addMapOpenVersion, setAddMapOpenVersion] = useState(0);

  // Modal edit
  const [openEdit, setOpenEdit] = useState(false);
  const [editLoading, setEditLoading] = useState(false);
  const [currentRow, setCurrentRow] = useState(null);
  const [editMapOpenVersion, setEditMapOpenVersion] = useState(0);

  // Modal delete
  const [openDelete, setOpenDelete] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // quick stats (gunakan total dari pagination kalau tersedia)
  const totalLokasi = pagination?.total ?? rows?.length ?? 0;

  const radiusBadge = (v) => {
    if (v == null)
      return (
        <AppTag
          tone='neutral'
          variant='soft'
        >
          —
        </AppTag>
      );
    const val = Number(v);
    if (val < 50)
      return (
        <AppTag
          tone='success'
          variant='soft'
        >
          {val}
        </AppTag>
      );
    if (val <= 100)
      return (
        <AppTag
          tone='info'
          variant='soft'
        >
          {val}
        </AppTag>
      );
    return (
      <AppTag
        tone='warning'
        variant='soft'
      >
        {val}
      </AppTag>
    );
  };

  const columns = useMemo(
    () => [
      {
        title: 'Nama Lokasi',
        dataIndex: 'nama_kantor',
        key: 'nama_kantor',
        width: 280,
        render: (t) => (
          <div className='flex items-center gap-2'>
            <span className='inline-flex w-7 h-7 rounded-full bg-slate-100 text-[var(--brand-teal-700)] items-center justify-center ring-1 ring-slate-200'>
              <EnvironmentOutlined />
            </span>
            <span className='font-medium'>{t}</span>
          </div>
        ),
      },
      {
        title: 'Lokasi',
        key: 'lokasi',
        width: 240,
        render: (_, r) => {
          const has = r.latitude != null && r.longitude != null;
          if (!has) return <span className='text-xs text-slate-500'>Belum ditentukan</span>;

          const lat = Number(r.latitude);
          const lng = Number(r.longitude);
          const zoom = 17;
          const mapHref = `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lng}#map=${zoom}/${lat}/${lng}`;

          return (
            <a
              href={mapHref}
              target='_blank'
              rel='noreferrer'
              className='inline-flex items-center gap-1 text-xs'
              style={{ color: BRAND.accent }}
            >
              <AimOutlined /> Lihat di OpenStreetMap
            </a>
          );
        },
      },
      {
        title: 'Radius (m)',
        dataIndex: 'radius',
        key: 'radius',
        width: 130,
        align: 'center',
        render: radiusBadge,
      },
      {
        title: 'Dibuat',
        dataIndex: 'created_at',
        key: 'created_at',
        width: 180,
        render: (v) => (v ? new Date(v).toLocaleString() : '-'),
        responsive: ['lg'],
      },
      {
        title: 'Diubah',
        dataIndex: 'updated_at',
        key: 'updated_at',
        width: 180,
        render: (v) => (v ? new Date(v).toLocaleString() : '-'),
        responsive: ['lg'],
      },
      {
        title: 'Aksi',
        key: 'aksi',
        width: 160,
        fixed: 'right',
        align: 'center',
        render: (_, row) => (
          <AppSpace size='sm'>
            <AppTooltip title='Edit'>
              <AppButton
                variant='ghost'
                size='small'
                shape='circle'
                icon={<EditOutlined />}
                onClick={() => {
                  setCurrentRow(row);
                  setOpenEdit(true);
                }}
              />
            </AppTooltip>

            <AppTooltip title='Hapus'>
              <AppButton
                variant='danger'
                size='small'
                shape='circle'
                icon={<DeleteOutlined />}
                onClick={() => {
                  setCurrentRow(row);
                  setOpenDelete(true);
                }}
              />
            </AppTooltip>
          </AppSpace>
        ),
      },
    ],
    []
  );

  const addFields = useMemo(
    () => [
      {
        name: 'nama_kantor',
        label: 'Nama Lokasi',
        placeholder: 'Contoh: OSS Bali Denpasar',
        rules: [{ required: true, message: 'Nama lokasi wajib diisi' }],
      },
      {
        type: 'row',
        gutter: [12, 12],
        children: [
          {
            name: 'latitude',
            label: 'Latitude',
            type: 'number',
            xs: 24,
            md: 12,
            rules: [
              { required: true, message: 'Latitude wajib diisi' },
              {
                validator: (_, v) => (v >= -90 && v <= 90 ? Promise.resolve() : Promise.reject(new Error('Latitude harus di -90..90'))),
              },
            ],
            controlProps: {
              step: 0.000001,
              min: -90,
              max: 90,
              placeholder: '-90 .. 90',
            },
          },
          {
            name: 'longitude',
            label: 'Longitude',
            type: 'number',
            xs: 24,
            md: 12,
            rules: [
              { required: true, message: 'Longitude wajib diisi' },
              {
                validator: (_, v) => (v >= -180 && v <= 180 ? Promise.resolve() : Promise.reject(new Error('Longitude harus di -180..180'))),
              },
            ],
            controlProps: {
              step: 0.000001,
              min: -180,
              max: 180,
              placeholder: '-180 .. 180',
            },
          },
        ],
      },
      {
        key: 'map-add',
        noItem: true,
        rerenderOn: ['latitude', 'longitude', 'radius'],
        render: (ctx) => {
          const lat = Number(ctx.getValue('latitude') ?? -8.65);
          const lng = Number(ctx.getValue('longitude') ?? 115.21);
          const rRaw = ctx.getValue('radius');
          const radius = typeof rRaw === 'number' ? rRaw : Number(rRaw ?? 50);

          return (
            <div className='mb-3'>
              <LocationPicker
                key={addMapOpenVersion}
                value={{ lat, lng, radius }}
                visible={openAdd}
                openVersion={addMapOpenVersion}
                onChange={({ lat, lng, radius }) => {
                  ctx.setValues({
                    latitude: Number(Number(lat).toFixed(6)),
                    longitude: Number(Number(lng).toFixed(6)),
                    ...(typeof radius === 'number' ? { radius } : {}),
                  });
                }}
              />
            </div>
          );
        },
      },
      {
        name: 'radius',
        label: 'Radius (meter)',
        type: 'number',
        controlProps: { min: 0, placeholder: 'Opsional, contoh: 50' },
      },
    ],
    [openAdd, addMapOpenVersion]
  );

  const editFields = useMemo(
    () => [
      {
        name: 'nama_kantor',
        label: 'Nama Lokasi',
        placeholder: 'Contoh: OSS Bali Denpasar',
        rules: [{ required: true, message: 'Nama lokasi wajib diisi' }],
      },
      {
        type: 'row',
        gutter: [12, 12],
        children: [
          {
            name: 'latitude',
            label: 'Latitude',
            type: 'number',
            xs: 24,
            md: 12,
            rules: [
              { required: true, message: 'Latitude wajib diisi' },
              {
                validator: (_, v) => (v >= -90 && v <= 90 ? Promise.resolve() : Promise.reject(new Error('Latitude harus di -90..90'))),
              },
            ],
            controlProps: {
              step: 0.000001,
              min: -90,
              max: 90,
              placeholder: '-90 .. 90',
            },
          },
          {
            name: 'longitude',
            label: 'Longitude',
            type: 'number',
            xs: 24,
            md: 12,
            rules: [
              { required: true, message: 'Longitude wajib diisi' },
              {
                validator: (_, v) => (v >= -180 && v <= 180 ? Promise.resolve() : Promise.reject(new Error('Longitude harus di -180..180'))),
              },
            ],
            controlProps: {
              step: 0.000001,
              min: -180,
              max: 180,
              placeholder: '-180 .. 180',
            },
          },
        ],
      },
      {
        key: 'map-edit',
        noItem: true,
        rerenderOn: ['latitude', 'longitude', 'radius'],
        render: (ctx) => {
          const lat = Number(ctx.getValue('latitude') ?? -8.65);
          const lng = Number(ctx.getValue('longitude') ?? 115.21);
          const rRaw = ctx.getValue('radius');
          const radius = typeof rRaw === 'number' ? rRaw : Number(rRaw ?? 50);

          return (
            <div className='mb-3'>
              <LocationPicker
                key={editMapOpenVersion}
                value={{ lat, lng, radius }}
                visible={openEdit}
                openVersion={editMapOpenVersion}
                onChange={({ lat, lng, radius }) => {
                  ctx.setValues({
                    latitude: Number(Number(lat).toFixed(6)),
                    longitude: Number(Number(lng).toFixed(6)),
                    ...(typeof radius === 'number' ? { radius } : {}),
                  });
                }}
              />
            </div>
          );
        },
      },
      {
        name: 'radius',
        label: 'Radius (meter)',
        type: 'number',
        controlProps: { min: 0, placeholder: 'Opsional, contoh: 50' },
      },
    ],
    [openEdit, editMapOpenVersion]
  );

  const editInitialValues = useMemo(() => {
    const r = currentRow;
    return {
      nama_kantor: r?.nama_kantor ?? '',
      latitude: r?.latitude == null ? -8.65 : Number(r.latitude),
      longitude: r?.longitude == null ? 115.21 : Number(r.longitude),
      radius: r?.radius == null ? null : Number(r.radius),
    };
  }, [currentRow]);

  return (
    <div className='px-4 md:px-6 lg:px-8 py-5 space-y-4'>
      {/* ======= PAGE HEADER ======= */}
      <div className='page-header flex flex-col md:flex-row md:items-center md:justify-between gap-2'>
        <div>
          <AppTypography.Title
            level={3}
            className='!m-0'
          >
            Lokasi Kantor
          </AppTypography.Title>
          <AppTypography.Text
            tone='secondary'
            className='mt-1 block'
          >
            Kelola titik absen & radius geofence untuk setiap kantor.
          </AppTypography.Text>
        </div>

        <div className='flex items-center gap-2'>
          <AppTag
            tone='info'
            variant='soft'
          >
            Total Lokasi: {totalLokasi}
          </AppTag>
          <AppButton
            variant='primary'
            icon={<PlusOutlined />}
            onClick={() => setOpenAdd(true)}
          >
            Tambah Lokasi
          </AppButton>
        </div>
      </div>

      {/* ======= FILTER BAR ======= */}
      <AppCard className='surface-card p-3 md:p-4'>
        <div className='grid gap-3 md:grid-cols-[1fr_auto_auto_auto_auto_auto] items-center'>
          <AppInput
            allowClear
            prefixIcon={<SearchOutlined />}
            placeholder='Cari lokasi…'
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          <div className='flex items-center gap-2'>
            <AppInput.Number
              placeholder='Radius min'
              value={radiusMin}
              onChange={setRadiusMin}
              min={0}
            />
            <AppInput.Number
              placeholder='Radius max'
              value={radiusMax}
              onChange={setRadiusMax}
              min={0}
            />
          </div>

          <AppSelect
            value={orderBy}
            onChange={setOrderBy}
            className='w-full md:w-[170px]'
            options={[
              { value: 'created_at', label: 'Urutkan: Dibuat' },
              { value: 'updated_at', label: 'Urutkan: Diubah' },
              { value: 'nama_kantor', label: 'Urutkan: Nama' },
              { value: 'radius', label: 'Urutkan: Radius' },
            ]}
          />

          <AppSelect
            value={sort}
            onChange={setSort}
            className='w-full md:w-[120px]'
            options={[
              { value: 'desc', label: 'Desc' },
              { value: 'asc', label: 'Asc' },
            ]}
          />
        </div>
      </AppCard>

      {/* ======= TABLE ======= */}
      <AppCard className='surface-card p-2 md:p-3'>
        <AppTable
          card={false}
          rowKey='id_location'
          columns={columns}
          dataSource={rows}
          loading={loading}
          size='small'
          tableLayout='auto'
          scroll={{ x: 'max-content' }}
          sticky
          pagination={{
            current: pagination.page,
            pageSize: pagination.pageSize,
            total: pagination.total,
            showSizeChanger: true,
          }}
          onChange={onTableChange}
          emptyTitle='Belum ada lokasi'
          emptyDescription='Tambahkan lokasi pertama Anda.'
          tableClassName='
            [&_.ant-table-container]:!rounded-2xl
            [&_.ant-table]:!border [&_.ant-table]:!border-slate-200
            [&_.ant-table-thead_th]:!bg-slate-50
            [&_.ant-table-thead_th]:!font-semibold
            [&_.ant-table-thead_th]:!text-slate-600
            [&_.ant-table-thead_th]:!py-2
            [&_.ant-table-tbody_td]:!py-2
            [&_.ant-table-tbody_tr:hover_td]:!bg-slate-50
          '
        />
      </AppCard>

      {/* ======= MODALS ======= */}
      {/* Tambah */}
      <AppModal
        open={openAdd}
        onClose={() => setOpenAdd(false)}
        footer={null}
        title={<div className='text-lg font-semibold'>Tambah Lokasi</div>}
        destroyOnClose
        afterOpenChange={(opened) => {
          if (opened) setAddMapOpenVersion((v) => v + 1);
        }}
      >
        <AppForm
          fields={addFields}
          initialValues={{ latitude: -8.65, longitude: 115.21, radius: 50 }}
          loading={addLoading}
          showSubmit={false}
          onFinish={async (values) => {
            setAddLoading(true);
            try {
              await addLocation({
                nama_kantor: values.nama_kantor,
                latitude: values.latitude,
                longitude: values.longitude,
                radius: values.radius ?? null,
              });
              setOpenAdd(false);
            } finally {
              setAddLoading(false);
            }
          }}
          footer={() => (
            <AppSpace
              block
              size='sm'
              className='w-full'
            >
              <AppButton
                variant='secondary'
                className='flex-1'
                onClick={() => setOpenAdd(false)}
                disabled={addLoading}
              >
                Batal
              </AppButton>
              <AppButton
                variant='primary'
                className='flex-1'
                htmlType='submit'
                loading={addLoading}
              >
                Simpan
              </AppButton>
            </AppSpace>
          )}
        />
      </AppModal>

      {/* Edit */}
      <AppModal
        open={openEdit}
        onClose={() => {
          setOpenEdit(false);
          setCurrentRow(null);
        }}
        footer={null}
        title={<div className='text-lg font-semibold'>Edit Lokasi</div>}
        destroyOnClose
        afterOpenChange={(opened) => {
          if (opened) setEditMapOpenVersion((v) => v + 1);
        }}
      >
        <AppForm
          key={currentRow?.id_location ?? 'edit'}
          fields={editFields}
          initialValues={editInitialValues}
          loading={editLoading}
          showSubmit={false}
          onFinish={async (values) => {
            if (!currentRow) return;
            setEditLoading(true);
            try {
              await updateLocation(currentRow.id_location, {
                nama_kantor: values.nama_kantor,
                latitude: values.latitude,
                longitude: values.longitude,
                radius: values.radius ?? null,
              });
              setOpenEdit(false);
              setCurrentRow(null);
            } finally {
              setEditLoading(false);
            }
          }}
          footer={() => (
            <AppSpace
              block
              size='sm'
              className='w-full'
            >
              <AppButton
                variant='secondary'
                className='flex-1'
                onClick={() => {
                  setOpenEdit(false);
                  setCurrentRow(null);
                }}
                disabled={editLoading}
              >
                Batal
              </AppButton>
              <AppButton
                variant='primary'
                className='flex-1'
                htmlType='submit'
                loading={editLoading}
              >
                Simpan Perubahan
              </AppButton>
            </AppSpace>
          )}
        />
      </AppModal>

      {/* Hapus */}
      <AppModal
        open={openDelete}
        onClose={() => {
          setOpenDelete(false);
          setCurrentRow(null);
        }}
        variant='danger'
        title='Konfirmasi Hapus'
        okText='Hapus'
        cancelText='Batal'
        okLoading={deleteLoading}
        onOk={async () => {
          if (!currentRow) return false;
          setDeleteLoading(true);
          try {
            await deleteLocation(currentRow.id_location);
            setOpenDelete(false);
            setCurrentRow(null);
            return true;
          } finally {
            setDeleteLoading(false);
          }
        }}
      >
        <AppTypography.Paragraph
          tone='secondary'
          className='mb-2'
        >
          Yakin ingin menghapus lokasi <span className='font-semibold'>{currentRow?.nama_kantor}</span>? Tindakan ini akan melakukan <i>soft delete</i>.
        </AppTypography.Paragraph>
      </AppModal>
    </div>
  );
}