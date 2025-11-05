"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Card,
  Button,
  Descriptions,
  Skeleton,
  Form,
  Input,
  DatePicker,
  Select,
  Upload,
  message,
  Space,
  Tag,
} from "antd";
import { UploadOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import useSWR from "swr";
import { ApiEndpoints } from "../../../constrainst/endpoints";
import { crudService } from "../../../app/utils/services/crudService";

dayjs.locale("id");

const LABEL_STYLE = { width: 240, fontWeight: 600 };
const BRAND = "#003A6F";

/* ======== Opsi Select ======== */
const OPSI_STATUS_PERKAWINAN = [
  { value: "Belum Kawin", label: "Belum Kawin" },
  { value: "Kawin", label: "Kawin" },
  { value: "Janda", label: "Janda" },
  { value: "Duda", label: "Duda" },
];

const OPSI_GOLONGAN_DARAH = [
  { value: "A", label: "A" },
  { value: "B", label: "B" },
  { value: "AB", label: "AB" },
  { value: "O", label: "O" },
];

const OPSI_AGAMA = [
  { value: "Islam", label: "Islam" },
  { value: "Kristen Protestan", label: "Kristen Protestan" },
  { value: "Katolik", label: "Katolik" },
  { value: "Hindu", label: "Hindu" },
  { value: "Buddha", label: "Buddha" },
  { value: "Konghucu", label: "Konghucu" },
];

const OPSI_JENJANG = [
  { value: "SMA/MA", label: "SMA/MA" },
  { value: "SMK", label: "SMK" },
  { value: "Diploma", label: "Diploma" },
  { value: "Sarjana/S1", label: "Sarjana/S1" },
  { value: "Magister/S2", label: "Magister/S2" },
  { value: "Doktor/S3", label: "Doktor/S3" },
];

const OPSI_STATUS_KERJA = [
  { value: "AKTIF", label: "AKTIF" },
  { value: "TIDAK_AKTIF", label: "TIDAK AKTIF" },
  { value: "CUTI", label: "CUTI" },
];

// NEW: Status Cuti
const OPSI_STATUS_CUTI = [
  { value: "aktif", label: "Aktif" },
  { value: "nonaktif", label: "Nonaktif" },
];

/* ---------------- helpers ---------------- */
const DASH = "—";

function displayOrDash(v) {
  if (v === 0) return 0;
  if (v == null) return DASH;
  const s = String(v).trim();
  return (!s || s.toLowerCase() === "null" || s.toLowerCase() === "undefined") ? DASH : s;
}

function nz(v) {
  if (v == null) return undefined;
  const s = String(v).trim();
  if (!s || s.toLowerCase() === "null" || s.toLowerCase() === "undefined") return undefined;
  return v;
}

function toDateOnly(d) {
  return d ? dayjs(d).format("YYYY-MM-DD") : undefined;
}

function joinAlamat(base, kota, prov) {
  const b = displayOrDash(base);
  const k = displayOrDash(kota);
  const p = displayOrDash(prov);
  if (b === DASH) {
    const segs = [k, p].filter((x) => x !== DASH);
    return segs.length ? segs.join(", ") : DASH;
    }
  return b + (k !== DASH ? ` — ${k}` : "") + (p !== DASH ? `, ${p}` : "");
}

function append(fd, key, val) {
  const v = val === undefined || val === null ? "" : typeof val === "number" ? String(val) : String(val);
  fd.append(key, v);
}

const swrFetcher = (url) => crudService.get(url);

/* ---------------- main component ---------------- */
export default function KaryawanProfileForm({
  mode = "view",        // "view" | "edit" | "add"
  id,                   // user id (view/edit)
  forceReadOnly = false,
  onSuccess,
}) {
  const readOnly = mode === "view" || forceReadOnly;
  const [form] = Form.useForm();
  const [saving, setSaving] = useState(false);
  const [fileList, setFileList] = useState([]);

  // Default initial values → status_cuti = "aktif" saat ADD
  const initialValues = useMemo(() => (
    mode === "add" ? { status_cuti: "aktif" } : {}
  ), [mode]);

  /* ====== data master ====== */
  const { data: deptRes } = useSWR(`${ApiEndpoints.GetDepartement}?page=1&pageSize=500`, swrFetcher);
  const { data: locRes } = useSWR(`${ApiEndpoints.GetLocation}?page=1&pageSize=500`, swrFetcher);
  const { data: jabRes } = useSWR(`${ApiEndpoints.GetJabatan}?page=1&pageSize=500`, swrFetcher);

  const deptOpts = useMemo(
    () => (deptRes?.data || []).map((d) => ({ value: d.id_departement, label: d.nama_departement })),
    [deptRes]
  );
  const locOpts = useMemo(
    () => (locRes?.data || []).map((l) => ({ value: l.id_location, label: l.nama_kantor || l.nama_location || l.nama })),
    [locRes]
  );
  const jabOpts = useMemo(
    () => (jabRes?.data || []).map((j) => ({ value: j.id_jabatan, label: j.nama_jabatan })),
    [jabRes]
  );

  /* ====== GET detail (view/edit) ====== */
  const detailKey = mode !== "add" && id ? ApiEndpoints.GetUserById(id) : null;
  const { data: detailRes, isLoading: loadingDetail } = useSWR(detailKey, swrFetcher);
  const detail = detailRes?.data;

  /* ====== initial form values ====== */
  useEffect(() => {
    if (mode === "add") {
      // Pastikan default status_cuti = aktif saat ADD
      form.setFieldsValue({ status_cuti: "aktif" });
    }
  }, [mode, form]);

  useEffect(() => {
    if (detail && (mode === "edit" || mode === "view")) {
      form.setFieldsValue({
        nama_pengguna: nz(detail.nama_pengguna),
        email: nz(detail.email),
        kontak: nz(detail.kontak),

        // NEW: kontak darurat
        nama_kontak_darurat: nz(detail.nama_kontak_darurat),
        kontak_darurat: nz(detail.kontak_darurat),

        agama: nz(detail.agama),
        tempat_lahir: nz(detail.tempat_lahir),
        tanggal_lahir: detail.tanggal_lahir ? dayjs(detail.tanggal_lahir) : undefined,
        jenis_kelamin: nz(detail.jenis_kelamin),
        golongan_darah: nz(detail.golongan_darah),
        status_perkawinan: nz(detail.status_perkawinan),
        zona_waktu: nz(detail.zona_waktu),

        jenjang_pendidikan: nz(detail.jenjang_pendidikan),
        jurusan: nz(detail.jurusan),
        nama_institusi_pendidikan: nz(detail.nama_institusi_pendidikan),
        tahun_lulus: nz(detail.tahun_lulus),

        nomor_induk_karyawan: nz(detail.nomor_induk_karyawan),
        id_departement: nz(detail.id_departement),
        id_jabatan: nz(detail.id_jabatan),
        status_kerja: nz(detail.status_kerja),
        tanggal_mulai_bekerja: detail.tanggal_mulai_bekerja ? dayjs(detail.tanggal_mulai_bekerja) : undefined,
        id_location: nz(detail.id_location),
        jenis_bank: nz(detail.jenis_bank),
        nomor_rekening: nz(detail.nomor_rekening),
        role: nz(detail.role) || "KARYAWAN",

        // NEW: status_cuti (biarkan apa adanya dari DB; default hanya untuk ADD)
        status_cuti: nz(detail.status_cuti),

        alamat_ktp: nz(detail.alamat_ktp),
        alamat_ktp_provinsi: nz(detail.alamat_ktp_provinsi),
        alamat_ktp_kota: nz(detail.alamat_ktp_kota),
        alamat_domisili: nz(detail.alamat_domisili),
        alamat_domisili_provinsi: nz(detail.alamat_domisili_provinsi),
        alamat_domisili_kota: nz(detail.alamat_domisili_kota),
      });
    }
  }, [detail, form, mode]);

  /* ====== submit (ADD / EDIT) ====== */
  const onFinish = async (values) => {
    if (readOnly) return;
    try {
      setSaving(true);

      if (mode === "add") {
        // 1) REGISTER minimal
        const registerPayload = {
          nama_pengguna: values.nama_pengguna,
          email: String(values.email).toLowerCase(),
          password: values.password,
          kontak: values.kontak || undefined,
          agama: values.agama || undefined,
          role: values.role || "KARYAWAN",
          id_departement: values.id_departement || undefined,
          id_location: values.id_location || undefined,
          tanggal_lahir: toDateOnly(values.tanggal_lahir),
          tempat_lahir: values.tempat_lahir || undefined,
        };
        const reg = await crudService.post(ApiEndpoints.CreateUser, registerPayload);
        const newId = reg?.user?.id_user;

        if (!newId) {
          message.success(reg?.message || "Registrasi berhasil.");
          onSuccess?.();
          return;
        }

        // 2) Lengkapi via PUT
        const hasFile = fileList?.length > 0;
        if (hasFile) {
          const fd = new FormData();

          append(fd, "id_jabatan", values.id_jabatan);
          append(fd, "jenis_kelamin", values.jenis_kelamin);
          append(fd, "golongan_darah", values.golongan_darah);
          append(fd, "status_perkawinan", values.status_perkawinan);
          append(fd, "zona_waktu", values.zona_waktu);

          append(fd, "jenjang_pendidikan", values.jenjang_pendidikan);
          append(fd, "jurusan", values.jurusan);
          append(fd, "nama_institusi_pendidikan", values.nama_institusi_pendidikan);
          append(fd, "tahun_lulus", values.tahun_lulus);

          append(fd, "nomor_induk_karyawan", values.nomor_induk_karyawan);
          append(fd, "status_kerja", values.status_kerja);
          append(fd, "tanggal_mulai_bekerja", toDateOnly(values.tanggal_mulai_bekerja));

          append(fd, "jenis_bank", values.jenis_bank);
          append(fd, "nomor_rekening", values.nomor_rekening);

          append(fd, "alamat_ktp", values.alamat_ktp);
          append(fd, "alamat_ktp_provinsi", values.alamat_ktp_provinsi);
          append(fd, "alamat_ktp_kota", values.alamat_ktp_kota);
          append(fd, "alamat_domisili", values.alamat_domisili);
          append(fd, "alamat_domisili_provinsi", values.alamat_domisili_provinsi);
          append(fd, "alamat_domisili_kota", values.alamat_domisili_kota);

          append(fd, "tempat_lahir", values.tempat_lahir);
          append(fd, "tanggal_lahir", toDateOnly(values.tanggal_lahir));

          // NEW: status_cuti & kontak darurat
          append(fd, "status_cuti", values.status_cuti);
          append(fd, "nama_kontak_darurat", values.nama_kontak_darurat);
          append(fd, "kontak_darurat", values.kontak_darurat);

          fd.append("file", fileList[0].originFileObj);

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
            tanggal_mulai_bekerja: toDateOnly(values.tanggal_mulai_bekerja) ?? null,

            jenis_bank: values.jenis_bank ?? null,
            nomor_rekening: values.nomor_rekening ?? null,

            alamat_ktp: values.alamat_ktp ?? null,
            alamat_ktp_provinsi: values.alamat_ktp_provinsi ?? null,
            alamat_ktp_kota: values.alamat_ktp_kota ?? null,
            alamat_domisili: values.alamat_domisili ?? null,
            alamat_domisili_provinsi: values.alamat_domisili_provinsi ?? null,
            alamat_domisili_kota: values.alamat_domisili_kota ?? null,

            tempat_lahir: values.tempat_lahir ?? null,
            tanggal_lahir: toDateOnly(values.tanggal_lahir) ?? null,

            // NEW
            status_cuti: values.status_cuti ?? null,
            nama_kontak_darurat: values.nama_kontak_darurat ?? null,
            kontak_darurat: values.kontak_darurat ?? null,
          };
          await crudService.put(ApiEndpoints.UpdateUser(newId), putPayload);
        }

        message.success("Karyawan berhasil ditambahkan.");
        onSuccess?.({ id_user: newId });
        return;
      }

      // EDIT
      const hasFile = fileList?.length > 0;

      if (hasFile) {
        const fd = new FormData();
        append(fd, "nama_pengguna", values.nama_pengguna);
        append(fd, "email", String(values.email).toLowerCase());
        append(fd, "kontak", values.kontak);
        append(fd, "agama", values.agama);
        append(fd, "id_departement", values.id_departement);
        append(fd, "id_location", values.id_location);
        append(fd, "id_jabatan", values.id_jabatan);
        append(fd, "role", values.role || "KARYAWAN");
        append(fd, "tanggal_lahir", toDateOnly(values.tanggal_lahir));
        append(fd, "tempat_lahir", values.tempat_lahir);

        append(fd, "jenis_kelamin", values.jenis_kelamin);
        append(fd, "golongan_darah", values.golongan_darah);
        append(fd, "status_perkawinan", values.status_perkawinan);
        append(fd, "zona_waktu", values.zona_waktu);

        append(fd, "jenjang_pendidikan", values.jenjang_pendidikan);
        append(fd, "jurusan", values.jurusan);
        append(fd, "nama_institusi_pendidikan", values.nama_institusi_pendidikan);
        append(fd, "tahun_lulus", values.tahun_lulus);

        append(fd, "nomor_induk_karyawan", values.nomor_induk_karyawan);
        append(fd, "status_kerja", values.status_kerja);
        append(fd, "tanggal_mulai_bekerja", toDateOnly(values.tanggal_mulai_bekerja));
        append(fd, "jenis_bank", values.jenis_bank);
        append(fd, "nomor_rekening", values.nomor_rekening);

        append(fd, "alamat_ktp", values.alamat_ktp);
        append(fd, "alamat_ktp_provinsi", values.alamat_ktp_provinsi);
        append(fd, "alamat_ktp_kota", values.alamat_ktp_kota);
        append(fd, "alamat_domisili", values.alamat_domisili);
        append(fd, "alamat_domisili_provinsi", values.alamat_domisili_provinsi);
        append(fd, "alamat_domisili_kota", values.alamat_domisili_kota);

        // NEW: status_cuti & kontak darurat
        append(fd, "status_cuti", values.status_cuti);
        append(fd, "nama_kontak_darurat", values.nama_kontak_darurat);
        append(fd, "kontak_darurat", values.kontak_darurat);

        fd.append("file", fileList[0].originFileObj);

        const res = await crudService.put(ApiEndpoints.UpdateUser(id), fd);
        message.success(res?.message || "Perubahan disimpan.");
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
          role: values.role ?? "KARYAWAN",
          tanggal_lahir: toDateOnly(values.tanggal_lahir) ?? null,
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
          tanggal_mulai_bekerja: toDateOnly(values.tanggal_mulai_bekerja) ?? null,
          jenis_bank: values.jenis_bank ?? null,
          nomor_rekening: values.nomor_rekening ?? null,

          alamat_ktp: values.alamat_ktp ?? null,
          alamat_ktp_provinsi: values.alamat_ktp_provinsi ?? null,
          alamat_ktp_kota: values.alamat_ktp_kota ?? null,
          alamat_domisili: values.alamat_domisili ?? null,
          alamat_domisili_provinsi: values.alamat_domisili_provinsi ?? null,
          alamat_domisili_kota: values.alamat_domisili_kota ?? null,

          // NEW
          status_cuti: values.status_cuti ?? null,
          nama_kontak_darurat: values.nama_kontak_darurat ?? null,
          kontak_darurat: values.kontak_darurat ?? null,
        };

        const res = await crudService.put(ApiEndpoints.UpdateUser(id), put);
        message.success(res?.message || "Perubahan disimpan.");
        onSuccess?.(res?.data);
      }
    } catch (e) {
      message.error(e.message || "Gagal menyimpan.");
    } finally {
      setSaving(false);
    }
  };

  /* ====== render ====== */
  const photoUrl =
    (detail && detail.foto_profil_user) ||
    (fileList[0]?.originFileObj ? URL.createObjectURL(fileList[0].originFileObj) : null) ||
    "/avatar-placeholder.png";

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-semibold">Profil</h2>

        {readOnly ? (
          (detail && !forceReadOnly) ? (
            <Link href={`/home/kelola_karyawan/karyawan/${id}/edit`}>
              <Button type="default" icon={<span className="ri-pencil-line" />}>
                Ubah
              </Button>
            </Link>
          ) : null
        ) : (
          <Space>
            <Button onClick={() => window.history.back()}>Batal</Button>
            <Button
              type="primary"
              onClick={() => form.submit()}
              loading={saving}
              style={{ background: BRAND }}
            >
              {mode === "add" ? "Simpan" : "Simpan Perubahan"}
            </Button>
          </Space>
        )}
      </div>

      <Card bordered style={{ borderRadius: 16 }}>
        {mode !== "add" && (loadingDetail || !detail) ? (
          <Skeleton active avatar paragraph={{ rows: 6 }} />
        ) : (
          <div className="grid lg:grid-cols-[240px,1fr] gap-8">
            {/* KIRI: foto & identitas ringkas */}
            <div className="flex flex-col items-center">
              <div className="relative w-[200px] h-[260px] rounded-xl overflow-hidden ring-1 ring-gray-200 mb-3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={photoUrl} alt="Foto" className="object-cover w-full h-full" />
              </div>

              {readOnly ? (
                <>
                  <div className="font-semibold text-lg">
                    {displayOrDash(detail?.nama_pengguna)}
                  </div>
                  <div className="text-sm text-slate-600">
                    {displayOrDash(detail?.jabatan?.nama_jabatan)}
                  </div>
                  <div className="text-sm text-slate-600">
                    {displayOrDash(detail?.departement?.nama_departement ?? detail?.divisi)}
                  </div>
                  {/* NEW: Status Cuti badge */}
                  <div className="mt-2">
                    <span className="mr-2">Status Cuti:</span>
                    <Tag color={(detail?.status_cuti || "") === "aktif" ? "green" : "red"}>
                      {displayOrDash(detail?.status_cuti)?.replace(/^./, (c) => c.toUpperCase())}
                    </Tag>
                  </div>
                </>
              ) : (
                <Form
                  form={form}
                  layout="vertical"
                  className="w-full"
                  onFinish={onFinish}
                  initialValues={initialValues}
                >
                  <Form.Item
                    name="nama_pengguna"
                    label="Nama*"
                    rules={[{ required: true, message: "Nama wajib diisi" }]}
                  >
                    <Input placeholder={DASH} />
                  </Form.Item>

                  <Form.Item
                    name="email"
                    label="Email*"
                    rules={[
                      { required: true, message: "Email wajib diisi" },
                      { type: "email", message: "Format email tidak valid" },
                    ]}
                  >
                    <Input placeholder={DASH} />
                  </Form.Item>

                  {mode === "add" && (
                    <Form.Item
                      name="password"
                      label="Password*"
                      rules={[{ required: true, message: "Password wajib diisi" }]}
                    >
                      <Input.Password placeholder={DASH} />
                    </Form.Item>
                  )}

                  <Upload
                    fileList={fileList}
                    maxCount={1}
                    onChange={({ fileList }) => setFileList(fileList)}
                    beforeUpload={() => false}
                  >
                    <Button icon={<UploadOutlined />}>
                      {fileList.length ? "Ganti Foto" : "Pilih Foto"}
                    </Button>
                  </Upload>
                </Form>
              )}
            </div>

            {/* KANAN */}
            {readOnly ? (
              <div className="space-y-8">
                <Descriptions bordered column={1} labelStyle={LABEL_STYLE}>
                  <Descriptions.Item label="Tempat Lahir">
                    {displayOrDash(detail?.tempat_lahir)}
                  </Descriptions.Item>
                  <Descriptions.Item label="Tanggal Lahir">
                    {displayOrDash(detail?.tanggal_lahir) !== DASH
                      ? dayjs(detail.tanggal_lahir).format("DD MMM YYYY")
                      : DASH}
                  </Descriptions.Item>
                  <Descriptions.Item label="Jenis Kelamin">
                    {displayOrDash(detail?.jenis_kelamin)}
                  </Descriptions.Item>
                  <Descriptions.Item label="Golongan Darah">
                    {displayOrDash(detail?.golongan_darah)}
                  </Descriptions.Item>
                  <Descriptions.Item label="Status Perkawinan">
                    {displayOrDash(detail?.status_perkawinan)}
                  </Descriptions.Item>
                  <Descriptions.Item label="Agama">
                    {displayOrDash(detail?.agama)}
                  </Descriptions.Item>
                  <Descriptions.Item label="Nomor Telepon">
                    {displayOrDash(detail?.kontak)}
                  </Descriptions.Item>
                  <Descriptions.Item label="Zona Waktu">
                    {displayOrDash(detail?.zona_waktu)}
                  </Descriptions.Item>
                  <Descriptions.Item label="Email">
                    {displayOrDash(detail?.email)}
                  </Descriptions.Item>
                  {/* NEW: Kontak darurat */}
                  <Descriptions.Item label="Nama Kontak Darurat">
                    {displayOrDash(detail?.nama_kontak_darurat)}
                  </Descriptions.Item>
                  <Descriptions.Item label="Nomor Kontak Darurat">
                    {displayOrDash(detail?.kontak_darurat)}
                  </Descriptions.Item>
                </Descriptions>

                <h3 className="text-xl font-semibold">Pendidikan Terakhir</h3>
                <Descriptions bordered column={1} labelStyle={LABEL_STYLE}>
                  <Descriptions.Item label="Jenjang">
                    {displayOrDash(detail?.jenjang_pendidikan)}
                  </Descriptions.Item>
                  <Descriptions.Item label="Jurusan">
                    {displayOrDash(detail?.jurusan)}
                  </Descriptions.Item>
                  <Descriptions.Item label="Nama Institusi Pendidikan">
                    {displayOrDash(detail?.nama_institusi_pendidikan)}
                  </Descriptions.Item>
                  <Descriptions.Item label="Tahun Lulus">
                    {displayOrDash(detail?.tahun_lulus)}
                  </Descriptions.Item>
                </Descriptions>

                <h3 className="text-xl font-semibold">Kepegawaian</h3>
                <Descriptions bordered column={1} labelStyle={LABEL_STYLE}>
                  <Descriptions.Item label="Nomor Induk Karyawan">
                    {displayOrDash(detail?.nomor_induk_karyawan)}
                  </Descriptions.Item>
                  <Descriptions.Item label="Divisi">
                    {displayOrDash(detail?.departement?.nama_departement ?? detail?.divisi)}
                  </Descriptions.Item>
                  <Descriptions.Item label="Jabatan">
                    {displayOrDash(detail?.jabatan?.nama_jabatan)}
                  </Descriptions.Item>
                  <Descriptions.Item label="Status Kerja">
                    {displayOrDash(detail?.status_kerja)}
                  </Descriptions.Item>
                  <Descriptions.Item label="Tgl. Mulai Bekerja">
                    {displayOrDash(detail?.tanggal_mulai_bekerja) !== DASH
                      ? dayjs(detail.tanggal_mulai_bekerja).format("DD MMM YYYY")
                      : DASH}
                  </Descriptions.Item>
                  <Descriptions.Item label="Lokasi Kantor">
                    {displayOrDash(detail?.kantor?.nama_kantor)}
                  </Descriptions.Item>
                  <Descriptions.Item label="Jenis Bank">
                    {displayOrDash(detail?.jenis_bank)}
                  </Descriptions.Item>
                  <Descriptions.Item label="Nomor Rekening">
                    {displayOrDash(detail?.nomor_rekening)}
                  </Descriptions.Item>
                </Descriptions>

                <h3 className="text-xl font-semibold">Alamat</h3>
                <Descriptions bordered column={1} labelStyle={LABEL_STYLE}>
                  <Descriptions.Item label="Alamat KTP">
                    {joinAlamat(detail?.alamat_ktp, detail?.alamat_ktp_kota, detail?.alamat_ktp_provinsi)}
                  </Descriptions.Item>
                  <Descriptions.Item label="Alamat Domisili">
                    {joinAlamat(detail?.alamat_domisili, detail?.alamat_domisili_kota, detail?.alamat_domisili_provinsi)}
                  </Descriptions.Item>
                </Descriptions>
              </div>
            ) : (
              <Form form={form} layout="vertical" onFinish={onFinish} initialValues={initialValues}>
                {/* Identitas */}
                <Descriptions title="Identitas" bordered column={1} labelStyle={LABEL_STYLE} items={[]} />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                  <Form.Item name="tempat_lahir" label="Tempat Lahir">
                    <Input placeholder={DASH} />
                  </Form.Item>
                  <Form.Item name="tanggal_lahir" label="Tanggal Lahir">
                    <DatePicker className="w-full" format="DD MMM YYYY" placeholder={DASH} />
                  </Form.Item>
                  <Form.Item name="jenis_kelamin" label="Jenis Kelamin">
                    <Select
                      options={[
                        { value: "LAKI_LAKI", label: "Laki-laki" },
                        { value: "PEREMPUAN", label: "Perempuan" },
                      ]}
                      allowClear
                      placeholder={DASH}
                    />
                  </Form.Item>
                  <Form.Item name="golongan_darah" label="Golongan Darah">
                    <Select options={OPSI_GOLONGAN_DARAH} allowClear placeholder={DASH} />
                  </Form.Item>
                  <Form.Item name="status_perkawinan" label="Status Perkawinan">
                    <Select options={OPSI_STATUS_PERKAWINAN} allowClear placeholder={DASH} />
                  </Form.Item>
                  <Form.Item name="agama" label="Agama">
                    <Select options={OPSI_AGAMA} allowClear showSearch optionFilterProp="label" placeholder={DASH} />
                  </Form.Item>
                  <Form.Item name="kontak" label="Nomor Telepon">
                    <Input placeholder={DASH} />
                  </Form.Item>
                  <Form.Item name="zona_waktu" label="Zona Waktu">
                    <Input placeholder="mis. WIB / WITA / WIT / UTC+7" />
                  </Form.Item>

                  {/* NEW: Kontak Darurat */}
                  <Form.Item name="nama_kontak_darurat" label="Nama Kontak Darurat">
                    <Input placeholder={DASH} />
                  </Form.Item>
                  <Form.Item
                    name="kontak_darurat"
                    label="Nomor Kontak Darurat"
                    rules={[{ pattern: /^[0-9+\-\s()]{6,20}$/, message: "Nomor tidak valid" }]}
                  >
                    <Input placeholder={DASH} />
                  </Form.Item>
                </div>

                {/* Pendidikan */}
                <h3 className="text-xl font-semibold mt-6">Pendidikan Terakhir</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                  <Form.Item name="jenjang_pendidikan" label="Jenjang">
                    <Select options={OPSI_JENJANG} allowClear placeholder={DASH} />
                  </Form.Item>
                  <Form.Item name="jurusan" label="Jurusan">
                    <Input placeholder={DASH} />
                  </Form.Item>
                  <Form.Item name="nama_institusi_pendidikan" label="Nama Institusi Pendidikan">
                    <Input placeholder={DASH} />
                  </Form.Item>
                  <Form.Item name="tahun_lulus" label="Tahun Lulus">
                    <Input type="number" placeholder={DASH} />
                  </Form.Item>
                </div>

                {/* Kepegawaian */}
                <h3 className="text-xl font-semibold mt-6">Kepegawaian</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                  <Form.Item name="nomor_induk_karyawan" label="Nomor Induk Karyawan">
                    <Input placeholder={DASH} />
                  </Form.Item>
                  <Form.Item name="id_departement" label="Divisi">
                    <Select options={deptOpts} allowClear showSearch optionFilterProp="label" placeholder={DASH} />
                  </Form.Item>
                  <Form.Item name="id_jabatan" label="Jabatan">
                    <Select options={jabOpts} allowClear showSearch optionFilterProp="label" placeholder={DASH} />
                  </Form.Item>
                  <Form.Item name="status_kerja" label="Status Kerja">
                    <Select options={OPSI_STATUS_KERJA} allowClear placeholder={DASH} />
                  </Form.Item>
                  <Form.Item name="tanggal_mulai_bekerja" label="Tgl. Mulai Bekerja">
                    <DatePicker className="w-full" format="DD MMM YYYY" placeholder={DASH} />
                  </Form.Item>
                  <Form.Item name="id_location" label="Lokasi Kantor">
                    <Select options={locOpts} allowClear showSearch optionFilterProp="label" placeholder={DASH} />
                  </Form.Item>
                  <Form.Item name="jenis_bank" label="Jenis Bank">
                    <Input placeholder={DASH} />
                  </Form.Item>
                  <Form.Item name="nomor_rekening" label="Nomor Rekening">
                    <Input placeholder={DASH} />
                  </Form.Item>
                  <Form.Item name="role" label="Role">
                    <Select
                      options={[
                        { value: "KARYAWAN", label: "Karyawan" },
                        { value: "HR", label: "HR" },
                        { value: "OPERASIONAL", label: "Operasional" },
                        { value: "DIREKTUR", label: "Direktur" },
                        { value: "SUPERADMIN", label: "Super-admin" },
                      ]}
                      placeholder={DASH}
                    />
                  </Form.Item>

                  {/* NEW: Status Cuti */}
                  <Form.Item name="status_cuti" label="Status Cuti">
                    <Select options={OPSI_STATUS_CUTI} allowClear placeholder={DASH} />
                  </Form.Item>
                </div>

                {/* Alamat */}
                <h3 className="text-xl font-semibold mt-6">Alamat</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                  <Form.Item name="alamat_ktp" label="Alamat KTP">
                    <Input.TextArea rows={2} placeholder={DASH} />
                  </Form.Item>
                  <div className="grid grid-cols-2 gap-4">
                    <Form.Item name="alamat_ktp_provinsi" label="Provinsi (KTP)">
                      <Input placeholder={DASH} />
                    </Form.Item>
                    <Form.Item name="alamat_ktp_kota" label="Kota (KTP)">
                      <Input placeholder={DASH} />
                    </Form.Item>
                  </div>

                  <Form.Item name="alamat_domisili" label="Alamat Domisili">
                    <Input.TextArea rows={2} placeholder={DASH} />
                  </Form.Item>
                  <div className="grid grid-cols-2 gap-4">
                    <Form.Item name="alamat_domisili_provinsi" label="Provinsi (Domisili)">
                      <Input placeholder={DASH} />
                    </Form.Item>
                    <Form.Item name="alamat_domisili_kota" label="Kota (Domisili)">
                      <Input placeholder={DASH} />
                    </Form.Item>
                  </div>
                </div>
              </Form>
            )}
          </div>
        )}
      </Card>
    </div>
  );
}
