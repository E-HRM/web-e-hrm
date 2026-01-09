'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { CameraOutlined, EditOutlined, SaveOutlined, UserOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import 'dayjs/locale/id';
import useSWR from 'swr';

import AppCard from '../../../../component_shared/AppCard';
import AppButton from '../../../../component_shared/AppButton';
import AppDivider from '../../../../component_shared/AppDivider';
import AppGrid from '../../../../component_shared/AppGrid';
import AppTypography from '../../../../component_shared/AppTypography';
import AppTag from '../../../../component_shared/AppTag';
import AppAvatar from '../../../../component_shared/AppAvatar';
import AppSkeleton from '../../../../component_shared/AppSkeleton';
import AppForm from '../../../../component_shared/AppForm';
import AppUpload from '../../../../component_shared/AppUpload';
import AppAlert from '../../../../component_shared/AppAlert';
import AppSpace from '../../../../component_shared/AppSpace';
import { useAppMessage } from '../../../../component_shared/AppMessage';

import { ApiEndpoints } from '@/constrainst/endpoints';
import { crudService } from '@/app/utils/services/crudService';

dayjs.locale('id');

const OPSI_STATUS_PERKAWINAN = [
  { value: 'Belum Kawin', label: 'Belum Kawin' },
  { value: 'Kawin', label: 'Kawin' },
  { value: 'Janda', label: 'Janda' },
  { value: 'Duda', label: 'Duda' },
];

const OPSI_GOLONGAN_DARAH = [
  { value: 'A', label: 'A' },
  { value: 'B', label: 'B' },
  { value: 'AB', label: 'AB' },
  { value: 'O', label: 'O' },
];

const OPSI_AGAMA = [
  { value: 'Islam', label: 'Islam' },
  { value: 'Kristen Protestan', label: 'Kristen Protestan' },
  { value: 'Katolik', label: 'Katolik' },
  { value: 'Hindu', label: 'Hindu' },
  { value: 'Buddha', label: 'Buddha' },
  { value: 'Konghucu', label: 'Konghucu' },
];

const OPSI_JENJANG = [
  { value: 'SMA/MA', label: 'SMA/MA' },
  { value: 'SMK', label: 'SMK' },
  { value: 'Diploma', label: 'Diploma' },
  { value: 'Sarjana/S1', label: 'Sarjana/S1' },
  { value: 'Magister/S2', label: 'Magister/S2' },
  { value: 'Doktor/S3', label: 'Doktor/S3' },
];

const OPSI_STATUS_KERJA = [
  { value: 'AKTIF', label: 'AKTIF' },
  { value: 'TIDAK_AKTIF', label: 'TIDAK AKTIF' },
  { value: 'CUTI', label: 'CUTI' },
];

const OPSI_STATUS_CUTI = [
  { value: 'aktif', label: 'Aktif' },
  { value: 'nonaktif', label: 'Nonaktif' },
];

const DASH = '—';

function displayOrDash(v) {
  if (v === 0) return 0;
  if (v == null) return DASH;
  const s = String(v).trim();
  return !s || s.toLowerCase() === 'null' || s.toLowerCase() === 'undefined' ? DASH : s;
}

function nz(v) {
  if (v == null) return undefined;
  const s = String(v).trim();
  if (!s || s.toLowerCase() === 'null' || s.toLowerCase() === 'undefined') return undefined;
  return v;
}

function toDateOnly(input) {
  if (input === undefined) return undefined;
  if (input === null || input === '') return null;
  const parsed = dayjs.isDayjs(input) ? input : dayjs(input);
  if (!parsed.isValid()) return null;
  return parsed.format('YYYY-MM-DD');
}

function joinAlamat(base, kota, prov) {
  const b = displayOrDash(base);
  const k = displayOrDash(kota);
  const p = displayOrDash(prov);
  if (b === DASH) {
    const segs = [k, p].filter((x) => x !== DASH);
    return segs.length ? segs.join(', ') : DASH;
  }
  return b + (k !== DASH ? ` — ${k}` : '') + (p !== DASH ? `, ${p}` : '');
}

function append(fd, key, val) {
  if (val === undefined) return;
  const v = val === null ? '' : typeof val === 'number' ? String(val) : String(val);
  fd.append(key, v);
}

function appendDateOnly(fd, key, val) {
  append(fd, key, toDateOnly(val));
}

function mapDetailToInitialValues(detail) {
  return {
    nama_pengguna: nz(detail?.nama_pengguna),
    email: nz(detail?.email),
    kontak: nz(detail?.kontak),
    nama_kontak_darurat: nz(detail?.nama_kontak_darurat),
    kontak_darurat: nz(detail?.kontak_darurat),
    agama: nz(detail?.agama),
    tempat_lahir: nz(detail?.tempat_lahir),
    tanggal_lahir: detail?.tanggal_lahir ? dayjs(detail.tanggal_lahir) : undefined,
    jenis_kelamin: nz(detail?.jenis_kelamin),
    golongan_darah: nz(detail?.golongan_darah),
    status_perkawinan: nz(detail?.status_perkawinan),
    zona_waktu: nz(detail?.zona_waktu),
    jenjang_pendidikan: nz(detail?.jenjang_pendidikan),
    jurusan: nz(detail?.jurusan),
    nama_institusi_pendidikan: nz(detail?.nama_institusi_pendidikan),
    tahun_lulus: nz(detail?.tahun_lulus),
    nomor_induk_karyawan: nz(detail?.nomor_induk_karyawan),
    id_departement: nz(detail?.id_departement),
    id_jabatan: nz(detail?.id_jabatan),
    status_kerja: nz(detail?.status_kerja),
    tanggal_mulai_bekerja: detail?.tanggal_mulai_bekerja ? dayjs(detail.tanggal_mulai_bekerja) : undefined,
    id_location: nz(detail?.id_location),
    jenis_bank: nz(detail?.jenis_bank),
    nomor_rekening: nz(detail?.nomor_rekening),
    role: nz(detail?.role) || 'KARYAWAN',
    status_cuti: nz(detail?.status_cuti),
    alamat_ktp: nz(detail?.alamat_ktp),
    alamat_ktp_provinsi: nz(detail?.alamat_ktp_provinsi),
    alamat_ktp_kota: nz(detail?.alamat_ktp_kota),
    alamat_domisili: nz(detail?.alamat_domisili),
    alamat_domisili_provinsi: nz(detail?.alamat_domisili_provinsi),
    alamat_domisili_kota: nz(detail?.alamat_domisili_kota),
  };
}

const swrFetcher = (url) => crudService.get(url);

export default function KaryawanProfileForm({ mode = 'view', id, forceReadOnly = false, onSuccess }) {
  const router = useRouter();
  const readOnly = mode === 'view' || forceReadOnly;

  const { message, contextHolder } = useAppMessage();

  const [saving, setSaving] = useState(false);
  const [fileList, setFileList] = useState([]);
  const [previewImage, setPreviewImage] = useState('');
  const [formKey, setFormKey] = useState(0);
  const [initialValues, setInitialValues] = useState(() => (mode === 'add' ? { status_cuti: 'aktif' } : {}));

  const { data: deptRes } = useSWR(`${ApiEndpoints.GetDepartement}?page=1&pageSize=500`, swrFetcher);
  const { data: locRes } = useSWR(`${ApiEndpoints.GetLocation}?page=1&pageSize=500`, swrFetcher);
  const { data: jabRes } = useSWR(`${ApiEndpoints.GetJabatan}?page=1&pageSize=500`, swrFetcher);

  const deptOpts = useMemo(() => (deptRes?.data || []).map((d) => ({ value: d.id_departement, label: d.nama_departement })), [deptRes]);
  const locOpts = useMemo(() => (locRes?.data || []).map((l) => ({ value: l.id_location, label: l.nama_kantor || l.nama_location || l.nama })), [locRes]);
  const jabOpts = useMemo(() => (jabRes?.data || []).map((j) => ({ value: j.id_jabatan, label: j.nama_jabatan })), [jabRes]);

  const detailKey = mode !== 'add' && id ? ApiEndpoints.GetUserById(id) : null;
  const { data: detailRes, isLoading: loadingDetail } = useSWR(detailKey, swrFetcher);
  const detail = detailRes?.data;

  useEffect(() => {
    if (previewImage && String(previewImage).startsWith('blob:')) {
      try {
        URL.revokeObjectURL(previewImage);
      } catch {}
    }
    setPreviewImage('');
    setFileList([]);
  }, [mode, id]);

  useEffect(() => {
    if (mode === 'add') {
      setInitialValues({ status_cuti: 'aktif' });
      setFormKey((k) => k + 1);
    }
  }, [mode]);

  useEffect(() => {
    if (detail && (mode === 'edit' || mode === 'view')) {
      setInitialValues(mapDetailToInitialValues(detail));
      setFormKey((k) => k + 1);
    }
  }, [detail, mode]);

  useEffect(() => {
    return () => {
      if (previewImage && String(previewImage).startsWith('blob:')) {
        try {
          URL.revokeObjectURL(previewImage);
        } catch {}
      }
    };
  }, [previewImage]);

  const handleUploadChange = (info) => {
    const newList = info?.fileList || [];
    setFileList(newList);

    const nextFile = newList?.[0]?.originFileObj;
    if (!nextFile) {
      if (previewImage && String(previewImage).startsWith('blob:')) {
        try {
          URL.revokeObjectURL(previewImage);
        } catch {}
      }
      setPreviewImage('');
      return;
    }

    if (previewImage && String(previewImage).startsWith('blob:')) {
      try {
        URL.revokeObjectURL(previewImage);
      } catch {}
    }

    const url = URL.createObjectURL(nextFile);
    setPreviewImage(url);
  };

  const onFinish = async (values) => {
    if (readOnly) return;
    try {
      setSaving(true);
      const tanggalLahir = toDateOnly(values.tanggal_lahir);
      const tanggalMulai = toDateOnly(values.tanggal_mulai_bekerja);

      if (mode === 'add') {
        const registerPayload = {
          nama_pengguna: values.nama_pengguna,
          email: String(values.email).toLowerCase(),
          password: values.password,
          kontak: values.kontak || undefined,
          agama: values.agama || undefined,
          role: values.role || 'KARYAWAN',
          id_departement: values.id_departement || undefined,
          id_location: values.id_location || undefined,
          ...(tanggalLahir !== undefined && { tanggal_lahir: tanggalLahir }),
          tempat_lahir: values.tempat_lahir || undefined,
        };

        const reg = await crudService.post(ApiEndpoints.CreateUser, registerPayload);
        const newId = reg?.user?.id_user;

        if (!newId) {
          message.success(reg?.message || 'Registrasi berhasil.');
          onSuccess?.();
          return;
        }

        const hasFile = fileList?.length > 0;

        if (hasFile) {
          const fd = new FormData();

          append(fd, 'id_jabatan', values.id_jabatan);
          append(fd, 'jenis_kelamin', values.jenis_kelamin);
          append(fd, 'golongan_darah', values.golongan_darah);
          append(fd, 'status_perkawinan', values.status_perkawinan);
          append(fd, 'zona_waktu', values.zona_waktu);
          append(fd, 'jenjang_pendidikan', values.jenjang_pendidikan);
          append(fd, 'jurusan', values.jurusan);
          append(fd, 'nama_institusi_pendidikan', values.nama_institusi_pendidikan);
          append(fd, 'tahun_lulus', values.tahun_lulus);
          append(fd, 'nomor_induk_karyawan', values.nomor_induk_karyawan);
          append(fd, 'status_kerja', values.status_kerja);
          appendDateOnly(fd, 'tanggal_mulai_bekerja', values.tanggal_mulai_bekerja);
          append(fd, 'jenis_bank', values.jenis_bank);
          append(fd, 'nomor_rekening', values.nomor_rekening);
          append(fd, 'alamat_ktp', values.alamat_ktp);
          append(fd, 'alamat_ktp_provinsi', values.alamat_ktp_provinsi);
          append(fd, 'alamat_ktp_kota', values.alamat_ktp_kota);
          append(fd, 'alamat_domisili', values.alamat_domisili);
          append(fd, 'alamat_domisili_provinsi', values.alamat_domisili_provinsi);
          append(fd, 'alamat_domisili_kota', values.alamat_domisili_kota);
          append(fd, 'tempat_lahir', values.tempat_lahir);
          appendDateOnly(fd, 'tanggal_lahir', values.tanggal_lahir);
          append(fd, 'status_cuti', values.status_cuti);
          append(fd, 'nama_kontak_darurat', values.nama_kontak_darurat);
          append(fd, 'kontak_darurat', values.kontak_darurat);

          fd.append('file', fileList[0].originFileObj);

          await crudService.put(ApiEndpoints.UpdateUser(newId), fd);
        } else {
          const putPayload = {
            id_jabatan: values.id_jabatan ?? null,
            jenis_kelamin: values.jenis_kelamin ?? null,
            golongan_darah: values.golongan_darah ?? null,
            status_perkawinan: values.status_perkawinan ?? null,
            zona_waktu: values.zona_waktu ?? null,
            jenjang_pendidikan: values.jenjang_pendidikan ?? null,
            jurusan: values.jurusan ?? null,
            nama_institusi_pendidikan: values.nama_institusi_pendidikan ?? null,
            tahun_lulus: values.tahun_lulus ?? null,
            nomor_induk_karyawan: values.nomor_induk_karyawan ?? null,
            status_kerja: values.status_kerja ?? null,
            ...(tanggalMulai !== undefined && { tanggal_mulai_bekerja: tanggalMulai }),
            jenis_bank: values.jenis_bank ?? null,
            nomor_rekening: values.nomor_rekening ?? null,
            alamat_ktp: values.alamat_ktp ?? null,
            alamat_ktp_provinsi: values.alamat_ktp_provinsi ?? null,
            alamat_ktp_kota: values.alamat_ktp_kota ?? null,
            alamat_domisili: values.alamat_domisili ?? null,
            alamat_domisili_provinsi: values.alamat_domisili_provinsi ?? null,
            alamat_domisili_kota: values.alamat_domisili_kota ?? null,
            tempat_lahir: values.tempat_lahir ?? null,
            ...(tanggalLahir !== undefined && { tanggal_lahir: tanggalLahir }),
            status_cuti: values.status_cuti ?? null,
            nama_kontak_darurat: values.nama_kontak_darurat ?? null,
            kontak_darurat: values.kontak_darurat ?? null,
          };
          await crudService.put(ApiEndpoints.UpdateUser(newId), putPayload);
        }

        message.success('Karyawan berhasil ditambahkan.');
        onSuccess?.({ id_user: newId });
        return;
      }

      const hasFile = fileList?.length > 0;

      if (hasFile) {
        const fd = new FormData();
        append(fd, 'nama_pengguna', values.nama_pengguna);
        append(fd, 'email', String(values.email).toLowerCase());
        append(fd, 'kontak', values.kontak);
        append(fd, 'agama', values.agama);
        append(fd, 'id_departement', values.id_departement);
        append(fd, 'id_location', values.id_location);
        append(fd, 'id_jabatan', values.id_jabatan);
        append(fd, 'role', values.role || 'KARYAWAN');
        appendDateOnly(fd, 'tanggal_lahir', values.tanggal_lahir);
        append(fd, 'tempat_lahir', values.tempat_lahir);
        append(fd, 'jenis_kelamin', values.jenis_kelamin);
        append(fd, 'golongan_darah', values.golongan_darah);
        append(fd, 'status_perkawinan', values.status_perkawinan);
        append(fd, 'zona_waktu', values.zona_waktu);
        append(fd, 'jenjang_pendidikan', values.jenjang_pendidikan);
        append(fd, 'jurusan', values.jurusan);
        append(fd, 'nama_institusi_pendidikan', values.nama_institusi_pendidikan);
        append(fd, 'tahun_lulus', values.tahun_lulus);
        append(fd, 'nomor_induk_karyawan', values.nomor_induk_karyawan);
        append(fd, 'status_kerja', values.status_kerja);
        appendDateOnly(fd, 'tanggal_mulai_bekerja', values.tanggal_mulai_bekerja);
        append(fd, 'jenis_bank', values.jenis_bank);
        append(fd, 'nomor_rekening', values.nomor_rekening);
        append(fd, 'alamat_ktp', values.alamat_ktp);
        append(fd, 'alamat_ktp_provinsi', values.alamat_ktp_provinsi);
        append(fd, 'alamat_ktp_kota', values.alamat_ktp_kota);
        append(fd, 'alamat_domisili', values.alamat_domisili);
        append(fd, 'alamat_domisili_provinsi', values.alamat_domisili_provinsi);
        append(fd, 'alamat_domisili_kota', values.alamat_domisili_kota);
        append(fd, 'status_cuti', values.status_cuti);
        append(fd, 'nama_kontak_darurat', values.nama_kontak_darurat);
        append(fd, 'kontak_darurat', values.kontak_darurat);

        fd.append('file', fileList[0].originFileObj);

        const res = await crudService.put(ApiEndpoints.UpdateUser(id), fd);
        message.success(res?.message || 'Perubahan disimpan.');
        onSuccess?.(res?.data);
      } else {
        const put = {
          nama_pengguna: values.nama_pengguna,
          email: String(values.email).toLowerCase(),
          kontak: values.kontak ?? null,
          agama: values.agama ?? null,
          id_departement: values.id_departement ?? null,
          id_location: values.id_location ?? null,
          id_jabatan: values.id_jabatan ?? null,
          role: values.role ?? 'KARYAWAN',
          ...(tanggalLahir !== undefined && { tanggal_lahir: tanggalLahir }),
          tempat_lahir: values.tempat_lahir ?? null,
          jenis_kelamin: values.jenis_kelamin ?? null,
          golongan_darah: values.golongan_darah ?? null,
          status_perkawinan: values.status_perkawinan ?? null,
          zona_waktu: values.zona_waktu ?? null,
          jenjang_pendidikan: values.jenjang_pendidikan ?? null,
          jurusan: values.jurusan ?? null,
          nama_institusi_pendidikan: values.nama_institusi_pendidikan ?? null,
          tahun_lulus: values.tahun_lulus ?? null,
          nomor_induk_karyawan: values.nomor_induk_karyawan ?? null,
          status_kerja: values.status_kerja ?? null,
          ...(tanggalMulai !== undefined && { tanggal_mulai_bekerja: tanggalMulai }),
          jenis_bank: values.jenis_bank ?? null,
          nomor_rekening: values.nomor_rekening ?? null,
          alamat_ktp: values.alamat_ktp ?? null,
          alamat_ktp_provinsi: values.alamat_ktp_provinsi ?? null,
          alamat_ktp_kota: values.alamat_ktp_kota ?? null,
          alamat_domisili: values.alamat_domisili ?? null,
          alamat_domisili_provinsi: values.alamat_domisili_provinsi ?? null,
          alamat_domisili_kota: values.alamat_domisili_kota ?? null,
          status_cuti: values.status_cuti ?? null,
          nama_kontak_darurat: values.nama_kontak_darurat ?? null,
          kontak_darurat: values.kontak_darurat ?? null,
        };

        const res = await crudService.put(ApiEndpoints.UpdateUser(id), put);
        message.success(res?.message || 'Perubahan disimpan.');
        onSuccess?.(res?.data);
      }
    } catch (e) {
      message.error(e?.message || 'Gagal menyimpan.');
    } finally {
      setSaving(false);
    }
  };

  const photoUrl = previewImage || detail?.foto_profil_user || '/avatar-placeholder.png';

  const headerTitle = mode === 'add' ? 'Tambah Karyawan Baru' : 'Profil Karyawan';
  const headerSubtitle = mode === 'add' ? 'Lengkapi data karyawan baru' : readOnly ? 'Lihat detail informasi karyawan' : 'Edit data karyawan';

  const fields = useMemo(() => {
    const leftChildren = [
      {
        type: 'custom',
        noItem: true,
        component: () => (
          <div className='flex flex-col items-center text-center p-6'>
            <div className='relative mb-4'>
              <AppAvatar
                size={160}
                src={photoUrl}
                name={initialValues?.nama_pengguna || detail?.nama_pengguna}
                icon={<UserOutlined />}
                className='border-4 border-white shadow-lg'
              />
              <div className='absolute bottom-2 right-2'>
                <AppUpload
                  fileList={fileList}
                  maxCount={1}
                  onChange={handleUploadChange}
                  beforeUpload={() => false}
                  showUploadList={false}
                  accept='image/*'
                  maxSizeMB={5}
                >
                  <AppButton
                    variant='secondary'
                    shape='circle'
                    icon={<CameraOutlined />}
                    size='small'
                    className='shadow-lg'
                  />
                </AppUpload>
              </div>
            </div>
            <AppTypography.Text
              tone='muted'
              size={12}
              className='block'
            >
              Format: JPG, PNG (Maks. 5MB)
            </AppTypography.Text>
          </div>
        ),
      },
      {
        name: 'nama_pengguna',
        label: 'Nama Lengkap',
        type: 'text',
        placeholder: 'Masukkan nama lengkap',
        rules: [{ required: true, message: 'Nama wajib diisi' }],
        controlProps: { size: 'large' },
      },
      {
        name: 'email',
        label: 'Email',
        type: 'email',
        placeholder: 'email@perusahaan.com',
        rules: [
          { required: true, message: 'Email wajib diisi' },
          { type: 'email', message: 'Format email tidak valid' },
        ],
        controlProps: { size: 'large' },
      },
    ];

    if (mode === 'add') {
      leftChildren.push({
        name: 'password',
        label: 'Password',
        type: 'password',
        placeholder: 'Masukkan password',
        rules: [{ required: true, message: 'Password wajib diisi' }],
        controlProps: { size: 'large' },
      });
    }

    const rightChildren = [
      { type: 'title', text: 'Identitas Diri', level: 4, className: 'mb-2 text-slate-700' },
      {
        type: 'row',
        children: [
          { name: 'tempat_lahir', label: 'Tempat Lahir', type: 'text', placeholder: 'Masukkan tempat lahir', col: { xs: 24, md: 12 }, controlProps: { size: 'large' } },
          { name: 'tanggal_lahir', label: 'Tanggal Lahir', type: 'date', placeholder: 'Pilih tanggal', col: { xs: 24, md: 12 }, controlProps: { size: 'large', className: 'w-full', format: 'DD MMM YYYY' } },
          {
            name: 'jenis_kelamin',
            label: 'Jenis Kelamin',
            type: 'select',
            placeholder: 'Pilih jenis kelamin',
            col: { xs: 24, md: 12 },
            options: [
              { value: 'LAKI_LAKI', label: 'Laki-laki' },
              { value: 'PEREMPUAN', label: 'Perempuan' },
            ],
            controlProps: { size: 'large', allowClear: true, showSearch: false, optionFilterProp: 'label' },
          },
          {
            name: 'golongan_darah',
            label: 'Golongan Darah',
            type: 'select',
            placeholder: 'Pilih golongan darah',
            col: { xs: 24, md: 12 },
            options: OPSI_GOLONGAN_DARAH,
            controlProps: { size: 'large', allowClear: true, showSearch: false, optionFilterProp: 'label' },
          },
          {
            name: 'status_perkawinan',
            label: 'Status Perkawinan',
            type: 'select',
            placeholder: 'Pilih status perkawinan',
            col: { xs: 24, md: 12 },
            options: OPSI_STATUS_PERKAWINAN,
            controlProps: { size: 'large', allowClear: true, showSearch: false, optionFilterProp: 'label' },
          },
          {
            name: 'agama',
            label: 'Agama',
            type: 'select',
            placeholder: 'Pilih agama',
            col: { xs: 24, md: 12 },
            options: OPSI_AGAMA,
            controlProps: { size: 'large', allowClear: true, showSearch: true, optionFilterProp: 'label' },
          },
          { name: 'kontak', label: 'Nomor Telepon', type: 'text', placeholder: 'Masukkan nomor telepon', col: { xs: 24, md: 12 }, controlProps: { size: 'large' } },
          { name: 'zona_waktu', label: 'Zona Waktu', type: 'text', placeholder: 'WIB / WITA / WIT / UTC+7', col: { xs: 24, md: 12 }, controlProps: { size: 'large' } },
          { name: 'nama_kontak_darurat', label: 'Nama Kontak Darurat', type: 'text', placeholder: 'Masukkan nama kontak darurat', col: { xs: 24, md: 12 }, controlProps: { size: 'large' } },
          {
            name: 'kontak_darurat',
            label: 'Nomor Kontak Darurat',
            type: 'text',
            placeholder: 'Masukkan nomor kontak darurat',
            col: { xs: 24, md: 12 },
            rules: [{ pattern: /^[0-9+\-\s()]{6,20}$/, message: 'Nomor tidak valid' }],
            controlProps: { size: 'large' },
          },
        ],
      },
      { type: 'divider', text: null, props: { className: 'my-4' } },
      { type: 'title', text: 'Pendidikan Terakhir', level: 4, className: 'mb-2 text-slate-700' },
      {
        type: 'row',
        children: [
          {
            name: 'jenjang_pendidikan',
            label: 'Jenjang',
            type: 'select',
            placeholder: 'Pilih jenjang pendidikan',
            col: { xs: 24, md: 12 },
            options: OPSI_JENJANG,
            controlProps: { size: 'large', allowClear: true, showSearch: false, optionFilterProp: 'label' },
          },
          { name: 'jurusan', label: 'Jurusan', type: 'text', placeholder: 'Masukkan jurusan', col: { xs: 24, md: 12 }, controlProps: { size: 'large' } },
          { name: 'nama_institusi_pendidikan', label: 'Nama Institusi Pendidikan', type: 'text', placeholder: 'Masukkan nama institusi', col: { xs: 24, md: 12 }, controlProps: { size: 'large' } },
          { name: 'tahun_lulus', label: 'Tahun Lulus', type: 'number', placeholder: 'Masukkan tahun lulus', col: { xs: 24, md: 12 }, controlProps: { size: 'large', min: 1900, max: 3000, className: 'w-full' } },
        ],
      },
      { type: 'divider', text: null, props: { className: 'my-4' } },
      { type: 'title', text: 'Informasi Kepegawaian', level: 4, className: 'mb-2 text-slate-700' },
      {
        type: 'row',
        children: [
          { name: 'nomor_induk_karyawan', label: 'Nomor Induk Karyawan', type: 'text', placeholder: 'Masukkan NIK', col: { xs: 24, md: 12 }, controlProps: { size: 'large' } },
          { name: 'id_departement', label: 'Divisi', type: 'select', placeholder: 'Pilih divisi', col: { xs: 24, md: 12 }, options: deptOpts, controlProps: { size: 'large', allowClear: true, showSearch: true, optionFilterProp: 'label' } },
          { name: 'id_jabatan', label: 'Jabatan', type: 'select', placeholder: 'Pilih jabatan', col: { xs: 24, md: 12 }, options: jabOpts, controlProps: { size: 'large', allowClear: true, showSearch: true, optionFilterProp: 'label' } },
          {
            name: 'status_kerja',
            label: 'Status Kerja',
            type: 'select',
            placeholder: 'Pilih status kerja',
            col: { xs: 24, md: 12 },
            options: OPSI_STATUS_KERJA,
            controlProps: { size: 'large', allowClear: true, showSearch: false, optionFilterProp: 'label' },
          },
          { name: 'tanggal_mulai_bekerja', label: 'Tanggal Mulai Bekerja', type: 'date', placeholder: 'Pilih tanggal', col: { xs: 24, md: 12 }, controlProps: { size: 'large', className: 'w-full', format: 'DD MMM YYYY' } },
          {
            name: 'id_location',
            label: 'Lokasi Kantor',
            type: 'select',
            placeholder: 'Pilih lokasi',
            col: { xs: 24, md: 12 },
            options: locOpts,
            controlProps: { size: 'large', allowClear: true, showSearch: true, optionFilterProp: 'label' },
          },
          { name: 'jenis_bank', label: 'Jenis Bank', type: 'text', placeholder: 'Masukkan jenis bank', col: { xs: 24, md: 12 }, controlProps: { size: 'large' } },
          { name: 'nomor_rekening', label: 'Nomor Rekening', type: 'text', placeholder: 'Masukkan nomor rekening', col: { xs: 24, md: 12 }, controlProps: { size: 'large' } },
          {
            name: 'role',
            label: 'Role',
            type: 'select',
            placeholder: 'Pilih role',
            col: { xs: 24, md: 12 },
            options: [
              { value: 'KARYAWAN', label: 'Karyawan' },
              { value: 'HR', label: 'HR' },
              { value: 'OPERASIONAL', label: 'Operasional' },
              { value: 'DIREKTUR', label: 'Direktur' },
              { value: 'SUPERADMIN', label: 'Super-admin' },
            ],
            controlProps: { size: 'large', allowClear: true, showSearch: false, optionFilterProp: 'label' },
          },
          {
            name: 'status_cuti',
            label: 'Status Cuti',
            type: 'select',
            placeholder: 'Pilih status cuti',
            col: { xs: 24, md: 12 },
            options: OPSI_STATUS_CUTI,
            controlProps: { size: 'large', allowClear: true, showSearch: false, optionFilterProp: 'label' },
          },
          {
            type: 'custom',
            noItem: true,
            col: { xs: 24 },
            component: () => (
              <AppAlert
                type='info'
                showIcon
                title='Keterangan Status Cuti'
                description={
                  <div className='space-y-1'>
                    <AppTypography.Text className='block'>
                      <AppTypography.Text weight={700}>Status Cuti "Aktif": </AppTypography.Text>
                      Karyawan yang tidak menggunakan kuota cutinya akan mengaktifkan sistem cuti tabung.
                    </AppTypography.Text>
                    <AppTypography.Text className='block'>
                      <AppTypography.Text weight={700}>Status Cuti "Nonaktif": </AppTypography.Text>
                      Karyawan yang tidak menggunakan kuota cutinya akan hangus dan tidak ditabung.
                    </AppTypography.Text>
                  </div>
                }
              />
            ),
          },
        ],
      },
      { type: 'divider', text: null, props: { className: 'my-4' } },
      { type: 'title', text: 'Alamat', level: 4, className: 'mb-2 text-slate-700' },
      {
        type: 'row',
        children: [
          { name: 'alamat_ktp', label: 'Alamat KTP', type: 'textarea', placeholder: 'Masukkan alamat sesuai KTP', col: { xs: 24 }, controlProps: { rows: 3 } },
          { name: 'alamat_ktp_provinsi', label: 'Provinsi (KTP)', type: 'text', placeholder: 'Masukkan provinsi', col: { xs: 24, md: 12 }, controlProps: { size: 'large' } },
          { name: 'alamat_ktp_kota', label: 'Kota (KTP)', type: 'text', placeholder: 'Masukkan kota', col: { xs: 24, md: 12 }, controlProps: { size: 'large' } },
          { name: 'alamat_domisili', label: 'Alamat Domisili', type: 'textarea', placeholder: 'Masukkan alamat domisili saat ini', col: { xs: 24 }, controlProps: { rows: 3 } },
          { name: 'alamat_domisili_provinsi', label: 'Provinsi (Domisili)', type: 'text', placeholder: 'Masukkan provinsi', col: { xs: 24, md: 12 }, controlProps: { size: 'large' } },
          { name: 'alamat_domisili_kota', label: 'Kota (Domisili)', type: 'text', placeholder: 'Masukkan kota', col: { xs: 24, md: 12 }, controlProps: { size: 'large' } },
        ],
      },
    ];

    return [
      {
        type: 'row',
        gutter: [16, 16],
        children: [
          {
            type: 'section',
            showHeader: false,
            tone: 'transparent',
            className: 'bg-gradient-to-b from-blue-50 to-white border border-slate-200/70 overflow-hidden',
            noPadding: true,
            col: { xs: 24, lg: 8 },
            children: leftChildren,
          },
          {
            type: 'section',
            showHeader: false,
            tone: 'white',
            className: 'border border-slate-200/70',
            col: { xs: 24, lg: 16 },
            children: rightChildren,
          },
        ],
      },
    ];
  }, [deptOpts, jabOpts, locOpts, fileList, photoUrl, initialValues, detail, mode]);

  const ViewBox = ({ label, value, span = 8 }) => (
    <AppGrid.Col span={span}>
      <div className='bg-slate-50 p-3 rounded-xl border border-slate-200/70'>
        <AppTypography.Text
          tone='muted'
          size={12}
          className='block'
        >
          {label}
        </AppTypography.Text>
        <AppTypography.Text
          weight={700}
          className='block text-slate-800'
        >
          {value}
        </AppTypography.Text>
      </div>
    </AppGrid.Col>
  );

  return (
    <div className='p-6 bg-slate-50 min-h-screen'>
      {contextHolder}
      <div className='max-w-7xl mx-auto'>
        <div className='flex items-start justify-between gap-4 mb-6'>
          <div>
            <AppTypography.Title
              level={2}
              className='!mb-1 !text-slate-800'
            >
              {headerTitle}
            </AppTypography.Title>
            <AppTypography.Text tone='secondary'>{headerSubtitle}</AppTypography.Text>
          </div>

          {readOnly ? (
            detail && !forceReadOnly ? (
              <AppButton
                variant='primary'
                icon={<EditOutlined />}
                size='large'
                href={`/home/kelola_karyawan/karyawan/${id}/edit`}
              >
                Edit Profil
              </AppButton>
            ) : null
          ) : (
            <AppSpace size='sm'>
              <AppButton
                size='large'
                variant='outline'
                onClick={() => router.back()}
              >
                Batal
              </AppButton>
              <AppButton
                size='large'
                variant='primary'
                icon={<SaveOutlined />}
                loading={saving}
                htmlType='submit'
                form='karyawan-form'
              >
                {mode === 'add' ? 'Simpan Data' : 'Simpan Perubahan'}
              </AppButton>
            </AppSpace>
          )}
        </div>

        <AppCard
          shadow='md'
          ring={false}
          className='overflow-hidden'
          noPadding
        >
          {mode !== 'add' && (loadingDetail || !detail) ? (
            <div className='p-8'>
              <AppSkeleton
                active
                avatar
                paragraph={{ rows: 8 }}
              />
            </div>
          ) : readOnly ? (
            <div className='flex flex-col lg:flex-row'>
              <div className='lg:w-80 bg-gradient-to-b from-blue-50 to-white p-6 border-r border-slate-200/70'>
                <div className='flex flex-col items-center text-center'>
                  <div className='relative mb-4'>
                    <AppAvatar
                      size={160}
                      src={photoUrl}
                      name={detail?.nama_pengguna}
                      icon={<UserOutlined />}
                      className='border-4 border-white shadow-lg'
                    />
                  </div>

                  <AppTypography.Title
                    level={3}
                    className='!mb-1 !text-slate-800'
                  >
                    {displayOrDash(detail?.nama_pengguna)}
                  </AppTypography.Title>
                  <AppTypography.Text
                    tone='secondary'
                    className='block mb-2'
                  >
                    {displayOrDash(detail?.jabatan?.nama_jabatan)}
                  </AppTypography.Text>
                  <AppTypography.Text className='block mb-3 text-sm'>{displayOrDash(detail?.departement?.nama_departement ?? detail?.divisi)}</AppTypography.Text>

                  <AppSpace
                    direction='vertical'
                    className='w-full mb-4'
                    size='sm'
                  >
                    <div className='flex justify-between items-center bg-white p-3 rounded-xl border border-slate-200/70'>
                      <AppTypography.Text weight={700}>Status Kerja:</AppTypography.Text>
                      <AppTag tone={detail?.status_kerja === 'AKTIF' ? 'success' : 'danger'}>{displayOrDash(detail?.status_kerja)}</AppTag>
                    </div>
                    <div className='flex justify-between items-center bg-white p-3 rounded-xl border border-slate-200/70'>
                      <AppTypography.Text weight={700}>Status Cuti:</AppTypography.Text>
                      <AppTag tone={(detail?.status_cuti || '') === 'aktif' ? 'info' : 'warning'}>{displayOrDash(detail?.status_cuti)?.replace(/^./, (c) => c.toUpperCase())}</AppTag>
                    </div>
                  </AppSpace>

                  <div className='w-full text-left bg-white p-4 rounded-xl border border-slate-200/70'>
                    <AppTypography.Text
                      weight={800}
                      className='block mb-2'
                    >
                      Informasi Kontak
                    </AppTypography.Text>
                    <div className='space-y-1 text-sm'>
                      <div className='flex justify-between gap-3'>
                        <AppTypography.Text tone='muted'>Email:</AppTypography.Text>
                        <AppTypography.Text className='text-right'>{displayOrDash(detail?.email)}</AppTypography.Text>
                      </div>
                      <div className='flex justify-between gap-3'>
                        <AppTypography.Text tone='muted'>Telepon:</AppTypography.Text>
                        <AppTypography.Text className='text-right'>{displayOrDash(detail?.kontak)}</AppTypography.Text>
                      </div>
                      {detail?.kontak_darurat ? (
                        <div className='flex justify-between gap-3'>
                          <AppTypography.Text tone='muted'>Kontak Darurat:</AppTypography.Text>
                          <AppTypography.Text className='text-right'>{displayOrDash(detail?.kontak_darurat)}</AppTypography.Text>
                        </div>
                      ) : null}
                    </div>
                  </div>
                </div>
              </div>

              <div className='flex-1 p-6'>
                <div className='space-y-8'>
                  <div>
                    <AppTypography.Title
                      level={4}
                      className='!mb-4 !text-slate-700'
                    >
                      Identitas Diri
                    </AppTypography.Title>
                    <AppGrid.Row>
                      <ViewBox
                        label='Tempat Lahir'
                        value={displayOrDash(detail?.tempat_lahir)}
                      />
                      <ViewBox
                        label='Tanggal Lahir'
                        value={displayOrDash(detail?.tanggal_lahir) !== DASH ? dayjs(detail.tanggal_lahir).format('DD MMM YYYY') : DASH}
                      />
                      <ViewBox
                        label='Jenis Kelamin'
                        value={displayOrDash(detail?.jenis_kelamin)}
                      />
                      <ViewBox
                        label='Golongan Darah'
                        value={displayOrDash(detail?.golongan_darah)}
                      />
                      <ViewBox
                        label='Status Perkawinan'
                        value={displayOrDash(detail?.status_perkawinan)}
                      />
                      <ViewBox
                        label='Agama'
                        value={displayOrDash(detail?.agama)}
                      />
                    </AppGrid.Row>
                  </div>

                  <AppDivider />

                  <div>
                    <AppTypography.Title
                      level={4}
                      className='!mb-4 !text-slate-700'
                    >
                      Pendidikan Terakhir
                    </AppTypography.Title>
                    <AppGrid.Row>
                      <ViewBox
                        label='Jenjang'
                        value={displayOrDash(detail?.jenjang_pendidikan)}
                        span={12}
                      />
                      <ViewBox
                        label='Jurusan'
                        value={displayOrDash(detail?.jurusan)}
                        span={12}
                      />
                      <ViewBox
                        label='Institusi Pendidikan'
                        value={displayOrDash(detail?.nama_institusi_pendidikan)}
                        span={12}
                      />
                      <ViewBox
                        label='Tahun Lulus'
                        value={displayOrDash(detail?.tahun_lulus)}
                        span={12}
                      />
                    </AppGrid.Row>
                  </div>

                  <AppDivider />

                  <div>
                    <AppTypography.Title
                      level={4}
                      className='!mb-4 !text-slate-700'
                    >
                      Informasi Kepegawaian
                    </AppTypography.Title>
                    <AppGrid.Row>
                      <ViewBox
                        label='Nomor Induk Karyawan'
                        value={displayOrDash(detail?.nomor_induk_karyawan)}
                        span={12}
                      />
                      <ViewBox
                        label='Divisi'
                        value={displayOrDash(detail?.departement?.nama_departement ?? detail?.divisi)}
                        span={12}
                      />
                      <ViewBox
                        label='Jabatan'
                        value={displayOrDash(detail?.jabatan?.nama_jabatan)}
                        span={12}
                      />
                      <ViewBox
                        label='Lokasi Kantor'
                        value={displayOrDash(detail?.kantor?.nama_kantor)}
                        span={12}
                      />
                      <ViewBox
                        label='Tanggal Mulai Bekerja'
                        value={displayOrDash(detail?.tanggal_mulai_bekerja) !== DASH ? dayjs(detail.tanggal_mulai_bekerja).format('DD MMM YYYY') : DASH}
                        span={12}
                      />
                      <ViewBox
                        label='Bank & Rekening'
                        value={detail?.jenis_bank && detail?.nomor_rekening ? `${detail.jenis_bank} - ${detail.nomor_rekening}` : DASH}
                        span={12}
                      />
                    </AppGrid.Row>
                  </div>

                  <AppDivider />

                  <div>
                    <AppTypography.Title
                      level={4}
                      className='!mb-4 !text-slate-700'
                    >
                      Alamat
                    </AppTypography.Title>
                    <AppGrid.Row>
                      <AppGrid.Col span={24}>
                        <div className='bg-slate-50 p-4 rounded-xl border border-slate-200/70'>
                          <AppTypography.Text
                            weight={800}
                            className='block mb-2'
                          >
                            Alamat KTP
                          </AppTypography.Text>
                          <AppTypography.Text className='block'>{joinAlamat(detail?.alamat_ktp, detail?.alamat_ktp_kota, detail?.alamat_ktp_provinsi)}</AppTypography.Text>
                        </div>
                      </AppGrid.Col>
                      <AppGrid.Col span={24}>
                        <div className='bg-slate-50 p-4 rounded-xl border border-slate-200/70'>
                          <AppTypography.Text
                            weight={800}
                            className='block mb-2'
                          >
                            Alamat Domisili
                          </AppTypography.Text>
                          <AppTypography.Text className='block'>{joinAlamat(detail?.alamat_domisili, detail?.alamat_domisili_kota, detail?.alamat_domisili_provinsi)}</AppTypography.Text>
                        </div>
                      </AppGrid.Col>
                    </AppGrid.Row>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className='p-6'>
              <AppForm
                key={formKey}
                fields={fields}
                onFinish={onFinish}
                initialValues={initialValues}
                showSubmit={false}
                loading={saving}
                formProps={{ id: 'karyawan-form' }}
              />
            </div>
          )}
        </AppCard>
      </div>
    </div>
  );
}
