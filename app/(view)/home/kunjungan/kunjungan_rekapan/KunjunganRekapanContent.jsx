'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import dayjs from 'dayjs';
import { EnvironmentOutlined, PictureOutlined, SearchOutlined } from '@ant-design/icons';

import AppCard from '../../../component_shared/AppCard';
import AppTable from '../../../component_shared/AppTable';
import AppTag from '../../../component_shared/AppTag';
import AppSelect from '../../../component_shared/AppSelect';
import AppDatePicker from '../../../component_shared/AppDatePicker';
import AppInput from '../../../component_shared/AppInput';
import AppButton from '../../../component_shared/AppButton';
import AppSpace from '../../../component_shared/AppSpace';
import AppTooltip from '../../../component_shared/AppTooltip';
import AppModal from '../../../component_shared/AppModal';
import AppImagePreview from '../../../component_shared/AppImagePreview';

import useVM, { showFromDB } from './useKunjunganRekapanViewModel';

function getPhotoUrl(user) {
  return user?.foto_profil_user || user?.avatarUrl || user?.foto || user?.foto_url || user?.photoUrl || user?.photo || user?.avatar || user?.gambar || '/avatar-placeholder.jpg';
}

function CircleImg({ src, size = 36, alt = 'Foto' }) {
  return (
    <img
      src={src || '/avatar-placeholder.jpg'}
      alt={alt}
      style={{
        width: size,
        height: size,
        borderRadius: 999,
        objectFit: 'cover',
        border: '1px solid #003A6F22',
        background: '#E6F0FA',
        display: 'inline-block',
      }}
      onError={(e) => {
        e.currentTarget.src = '/avatar-placeholder.jpg';
        e.currentTarget.onerror = null;
      }}
    />
  );
}

export default function KunjunganRekapanContent() {
  const vm = useVM();
  const [img, setImg] = useState(null);

  const columns = useMemo(
    () => [
      {
        title: 'Kategori',
        key: 'kategori',
        width: 180,
        render: (_, r) => r.kategori?.kategori_kunjungan || '—',
      },
      {
        title: 'Deskripsi',
        dataIndex: 'deskripsi',
        width: 300,
        key: 'desk',
        render: (v) => v || '—',
      },
      {
        title: 'Tanggal',
        dataIndex: 'tanggal',
        key: 'tgl',
        width: 150,
        render: (v) => (v ? showFromDB(v, 'DD MMM YYYY') : '-'),
      },
      {
        title: 'Start',
        key: 'start',
        render: (_, r) => {
          const t = r.jam_mulai ? showFromDB(r.jam_mulai, 'HH:mm') : '-';
          const { lat, lon } = vm.getStartCoord(r);
          const photo = vm.pickPhotoUrl(r);

          return (
            <AppSpace
              size='xs'
              align='center'
            >
              <span>{t}</span>
              {lat != null && lon != null ? (
                <AppTooltip title='Lihat lokasi (OpenStreetMap)'>
                  <AppButton
                    size='small'
                    variant='text'
                    icon={<EnvironmentOutlined />}
                    onClick={() => window.open(vm.osmUrl(lat, lon), '_blank')}
                  />
                </AppTooltip>
              ) : null}
              {photo ? (
                <AppTooltip title='Lihat foto'>
                  <AppButton
                    size='small'
                    variant='text'
                    icon={<PictureOutlined />}
                    onClick={() => setImg(photo)}
                  />
                </AppTooltip>
              ) : null}
            </AppSpace>
          );
        },
      },
      {
        title: 'End',
        key: 'end',
        render: (_, r) => {
          const t = r.jam_selesai ? showFromDB(r.jam_selesai, 'HH:mm') : '-';
          const { lat, lon } = vm.getEndCoord(r);
          const photo = vm.pickPhotoUrl(r);

          return (
            <AppSpace
              size='xs'
              align='center'
            >
              <span>{t}</span>
              {lat != null && lon != null ? (
                <AppTooltip title='Lihat lokasi (OpenStreetMap)'>
                  <AppButton
                    size='small'
                    variant='text'
                    icon={<EnvironmentOutlined />}
                    onClick={() => window.open(vm.osmUrl(lat, lon), '_blank')}
                  />
                </AppTooltip>
              ) : null}
              {photo ? (
                <AppTooltip title='Lihat foto'>
                  <AppButton
                    size='small'
                    variant='text'
                    icon={<PictureOutlined />}
                    onClick={() => setImg(photo)}
                  />
                </AppTooltip>
              ) : null}
            </AppSpace>
          );
        },
      },
      {
        title: 'Status',
        dataIndex: 'status_kunjungan',
        key: 'status',
        width: 140,
        render: (st) => {
          const m = st === 'selesai' ? { tone: 'success', text: 'Selesai' } : st === 'berlangsung' ? { tone: 'warning', text: 'Berlangsung' } : { tone: 'primary', text: 'Teragenda' };

          return (
            <AppTag
              tone={m.tone}
              variant='soft'
              pill={false}
            >
              {m.text}
            </AppTag>
          );
        },
      },
      {
        title: 'User',
        dataIndex: 'user',
        key: 'user',
        width: 360,
        render: (u) => {
          if (!u) return '—';

          const id = u.id_user ?? u.id ?? u.uuid;
          const href = id ? `/home/kelola_karyawan/karyawan/${id}` : undefined;
          const displayName = u.nama_pengguna ?? u.name ?? u.email ?? '—';

          const jabatan = u.jabatan?.nama_jabatan ?? u.jabatan?.nama ?? u.jabatan?.title ?? (typeof u.jabatan === 'string' ? u.jabatan : '') ?? '';

          const departemen =
            u.departemen?.nama_departemen ??
            u.departemen?.nama ??
            u.departemen?.title ??
            u.departement?.nama_departement ??
            u.departement?.nama ??
            u.departement?.title ??
            u.department?.name ??
            u.department?.nama ??
            u.department?.title ??
            u.divisi?.nama_divisi ??
            u.divisi?.nama ??
            u.divisi?.title ??
            (typeof u.departemen === 'string' ? u.departemen : '') ??
            (typeof u.departement === 'string' ? u.departement : '') ??
            (typeof u.department === 'string' ? u.department : '') ??
            (typeof u.divisi === 'string' ? u.divisi : '') ??
            '';

          const subtitle = jabatan && departemen ? `${jabatan} | ${departemen}` : jabatan || departemen || '—';

          const node = (
            <div className='flex items-center gap-3 min-w-0'>
              <CircleImg
                src={getPhotoUrl(u)}
                alt={displayName}
              />
              <div className='min-w-0'>
                <div
                  style={{ fontWeight: 600, color: '#0f172a' }}
                  className='truncate'
                >
                  {displayName}
                </div>
                <div
                  style={{ fontSize: 12, color: '#475569' }}
                  className='truncate'
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
      },
    ],
    [vm]
  );

  return (
    <div className='p-4'>
      <AppCard
        title={<span className='text-lg font-semibold'>Rekapan Kunjungan</span>}
        bodyStyle={{ paddingTop: 16 }}
      >
        <div className='mb-4'>
          <div className='grid items-center gap-2 grid-cols-1 lg:grid-cols-[240px_240px_160px_auto]'>
            <div className='w-full lg:w-[240px]'>
              <AppSelect
                className='w-full'
                size='middle'
                placeholder='Filter Karyawan'
                allowClear
                value={vm.filters.userId || undefined}
                options={vm.userOptions}
                onChange={(v) => vm.setFilters((s) => ({ ...s, userId: v || '' }))}
                showSearch
                optionFilterProp='label'
              />
            </div>

            <div className='w-full lg:w-[240px]'>
              <AppSelect
                className='w-full'
                size='middle'
                placeholder='Kategori Kunjungan'
                allowClear
                value={vm.filters.kategoriId || undefined}
                options={vm.kategoriOptions}
                onChange={(v) => vm.setFilters((s) => ({ ...s, kategoriId: v || '' }))}
                showSearch
                optionFilterProp='label'
              />
            </div>

            <div className='w-full lg:w-[160px]'>
              <AppSelect
                className='w-full'
                size='middle'
                placeholder='Status'
                allowClear
                value={vm.filters.status || undefined}
                onChange={(v) => vm.setFilters((s) => ({ ...s, status: v || '' }))}
                options={[
                  { value: 'diproses', label: 'Teragenda' },
                  { value: 'berlangsung', label: 'Berlangsung' },
                  { value: 'selesai', label: 'Selesai' },
                ]}
              />
            </div>

            <div className='flex items-center gap-2 whitespace-nowrap'>
              <div className='w-[170px]'>
                <AppDatePicker
                  className='w-full'
                  size='middle'
                  placeholder='Dari'
                  value={vm.filters.from ? dayjs(vm.filters.from) : null}
                  onChange={(d) => vm.setFilters((s) => ({ ...s, from: d ? d.toDate() : null }))}
                  format='DD/MM/YYYY'
                  allowClear
                />
              </div>

              <span className='opacity-60'>-</span>

              <div className='w-[170px]'>
                <AppDatePicker
                  className='w-full'
                  size='middle'
                  placeholder='Sampai'
                  value={vm.filters.to ? dayjs(vm.filters.to) : null}
                  onChange={(d) => vm.setFilters((s) => ({ ...s, to: d ? d.toDate() : null }))}
                  format='DD/MM/YYYY'
                  allowClear
                />
              </div>
            </div>
          </div>

          <div className='mt-2'>
            <AppInput
              className='w-full'
              size='middle'
              placeholder='Cari deskripsi/hand over'
              value={vm.filters.q}
              onChange={(e) => vm.setFilters((s) => ({ ...s, q: e.target.value }))}
              allowClear
              addonAfter={
                <div className='w-[56px] flex items-center justify-center'>
                  <SearchOutlined className='opacity-60' />
                </div>
              }
            />
          </div>
        </div>

        <AppTable
          card={false}
          rowKey='id_kunjungan'
          columns={columns}
          dataSource={vm.rows}
          loading={vm.loading}
          pagination={{
            pageSize: 15,
            showSizeChanger: false,
            showQuickJumper: false,
            showTotal: () => '',
          }}
          size='middle'
        />

        <AppModal
          open={!!img}
          onClose={() => setImg(null)}
          footer={null}
          width={720}
          centered
          maskClosable
          destroyOnClose={false}
        >
          <AppImagePreview
            src={img || ''}
            alt='Lampiran'
            preview={false}
            className='w-full'
            style={{ width: '100%' }}
          />
        </AppModal>
      </AppCard>
    </div>
  );
}
