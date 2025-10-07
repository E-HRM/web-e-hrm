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
} from "antd";
import { UploadOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import useSWR from "swr";
import { ApiEndpoints } from "../../../constrainst/endpoints";
import { crudService } from "../../../app/utils/services/crudService"; 

dayjs.locale("id");

const LABEL_STYLE = { width: 240, fontWeight: 600 };
const BRAND = "#003A6F";

/* ---------------- helpers ---------------- */
function toDateOnly(d) {
  return d ? dayjs(d).format("YYYY-MM-DD") : undefined;
}

/** Append helper: selalu append string (server sering ekspektasi key exist) */
function append(fd, key, val) {
  // Konversi undefined/null → '' agar key tetap terkirim
  const v =
    val === undefined || val === null
      ? ""
      : typeof val === "number"
      ? String(val)
      : String(val);
  fd.append(key, v);
}

/** SWR fetcher pakai crudService.get */
const swrFetcher = (url) => crudService.get(url);

/* ---------------- main component ---------------- */
export default function KaryawanProfileForm({
  /** "view" | "edit" | "add" */
  mode = "view",
  /** id user untuk view/edit */
  id,
  /** bila perlu, forceReadOnly (mis. role bukan HR) */
  forceReadOnly = false,
  /** callback setelah sukses simpan/add */
  onSuccess,
}) {
  const readOnly = mode === "view" || forceReadOnly;
  const [form] = Form.useForm();
  const [saving, setSaving] = useState(false);
  const [fileList, setFileList] = useState([]);

  /* ====== data master (select) ====== */
  const { data: deptRes } = useSWR(
    `${ApiEndpoints.GetDepartement}?page=1&pageSize=500`,
    swrFetcher
  );
  const { data: locRes } = useSWR(
    `${ApiEndpoints.GetLocation}?page=1&pageSize=500`,
    swrFetcher
  );
  const { data: jabRes } = useSWR(
    `${ApiEndpoints.GetJabatan}?page=1&pageSize=500`,
    swrFetcher
  );

  const deptOpts = useMemo(
    () =>
      (deptRes?.data || []).map((d) => ({
        value: d.id_departement,
        label: d.nama_departement,
      })),
    [deptRes]
  );

  const locOpts = useMemo(
    () =>
      (locRes?.data || []).map((l) => ({
        value: l.id_location,
        label: l.nama_kantor || l.nama_location || l.nama,
      })),
    [locRes]
  );

  const jabOpts = useMemo(
    () =>
      (jabRes?.data || []).map((j) => ({
        value: j.id_jabatan,
        label: j.nama_jabatan,
      })),
    [jabRes]
  );

  /* ====== GET detail (view/edit) ====== */
  const detailKey =
    mode !== "add" && id ? ApiEndpoints.GetUserById(id) : null;
  const { data: detailRes, isLoading: loadingDetail } = useSWR(
    detailKey,
    swrFetcher
  );
  const detail = detailRes?.data;

  /* ====== initial form values ====== */
  useEffect(() => {
    if (detail && (mode === "edit" || mode === "view")) {
      form.setFieldsValue({
        nama_pengguna: detail.nama_pengguna || "",
        email: detail.email || "",
        kontak: detail.kontak || "",
        agama: detail.agama || undefined,
        tanggal_lahir: detail.tanggal_lahir ? dayjs(detail.tanggal_lahir) : undefined,
        jenis_kelamin: detail.jenis_kelamin || undefined,
        golongan_darah: detail.golongan_darah || undefined,
        status_perkawinan: detail.status_perkawinan || undefined,
        zona_waktu: detail.zona_waktu || undefined,

        jenjang_pendidikan: detail.jenjang_pendidikan || undefined,
        jurusan: detail.jurusan || undefined,
        nama_institusi_pendidikan: detail.nama_institusi_pendidikan || undefined,
        tahun_lulus: detail.tahun_lulus || undefined,

        nomor_induk_karyawan: detail.nomor_induk_karyawan || undefined,
        id_departement: detail.id_departement || undefined,
        id_jabatan: detail.id_jabatan || undefined,
        status_kerja: detail.status_kerja || undefined,
        tanggal_mulai_bekerja: detail.tanggal_mulai_bekerja
          ? dayjs(detail.tanggal_mulai_bekerja)
          : undefined,
        id_location: detail.id_location || undefined,
        jenis_bank: detail.jenis_bank || undefined,
        nomor_rekening: detail.nomor_rekening || undefined,
        role: detail.role || "KARYAWAN",

        alamat_ktp: detail.alamat_ktp || "",
        alamat_ktp_provinsi: detail.alamat_ktp_provinsi || "",
        alamat_ktp_kota: detail.alamat_ktp_kota || "",
        alamat_domisili: detail.alamat_domisili || "",
        alamat_domisili_provinsi: detail.alamat_domisili_provinsi || "",
        alamat_domisili_kota: detail.alamat_domisili_kota || "",
      });
    }
  }, [detail, form, mode]);

  /* ====== submit (ADD / EDIT) ====== */
  const onFinish = async (values) => {
    if (readOnly) return;
    try {
      setSaving(true);

      if (mode === "add") {
        // ——— 1) REGISTER minimal fields (POST TANPA token) ———
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
        };
        const reg = await crudService.post(ApiEndpoints.CreateUser, registerPayload);
        const newId = reg?.user?.id_user;

        // Kalau API belum mengembalikan objek user lengkap
        if (!newId) {
          message.success(reg?.message || "Registrasi berhasil.");
          onSuccess?.();
          return;
        }

        // ——— 2) Lengkapi via PUT (pakai token). Jika ada file → FormData ———
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

          // File
          fd.append("file", fileList[0].originFileObj);

          await crudService.put(ApiEndpoints.UpdateUser(newId), fd);
        } else {
          // Tanpa file → JSON body
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
          };
          await crudService.put(ApiEndpoints.UpdateUser(newId), putPayload);
        }

        message.success("Karyawan berhasil ditambahkan.");
        onSuccess?.({ id_user: newId });
        return;
      }

      // ——— EDIT ———
      const hasFile = fileList?.length > 0;

      if (hasFile) {
        const fd = new FormData();
        // Base profile
        append(fd, "nama_pengguna", values.nama_pengguna);
        append(fd, "email", String(values.email).toLowerCase());
        append(fd, "kontak", values.kontak);
        append(fd, "agama", values.agama);
        append(fd, "id_departement", values.id_departement);
        append(fd, "id_location", values.id_location);
        append(fd, "id_jabatan", values.id_jabatan);
        append(fd, "role", values.role || "KARYAWAN");
        append(fd, "tanggal_lahir", toDateOnly(values.tanggal_lahir));

        // Detail
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

        // File
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
            {/* KIRI: foto & nama/jabatan/divisi */}
            <div className="flex flex-col items-center">
              <div className="relative w-[200px] h-[260px] rounded-xl overflow-hidden ring-1 ring-gray-200 mb-3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={photoUrl}
                  alt="Foto"
                  className="object-cover w-full h-full"
                />
              </div>

              {readOnly ? (
                <>
                  <div className="font-semibold text-lg">
                    {detail?.nama_pengguna || "-"}
                  </div>
                  <div className="text-sm text-slate-600">
                    {detail?.jabatan?.nama_jabatan || "—"}
                  </div>
                  <div className="text-sm text-slate-600">
                    {detail?.departement?.nama_departement || detail?.divisi || "—"}
                  </div>
                </>
              ) : (
                <Form
                  form={form}
                  layout="vertical"
                  className="w-full"
                  onFinish={onFinish}
                >
                  <Form.Item
                    name="nama_pengguna"
                    label="Nama*"
                    rules={[{ required: true, message: "Nama wajib diisi" }]}
                  >
                    <Input />
                  </Form.Item>

                  <Form.Item
                    name="email"
                    label="Email*"
                    rules={[
                      { required: true, message: "Email wajib diisi" },
                      { type: "email", message: "Format email tidak valid" },
                    ]}
                  >
                    <Input />
                  </Form.Item>

                  {mode === "add" && (
                    <Form.Item
                      name="password"
                      label="Password*"
                      rules={[{ required: true, message: "Password wajib diisi" }]}
                    >
                      <Input.Password />
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

            {/* KANAN: deskripsi panjang / form */}
            {readOnly ? (
              <div className="space-y-8">
                <Descriptions bordered column={1} labelStyle={LABEL_STYLE}>
                  <Descriptions.Item label="Tempat Lahir">
                    {detail?.tempat_lahir || "—"}
                  </Descriptions.Item>
                  <Descriptions.Item label="Tanggal Lahir">
                    {detail?.tanggal_lahir
                      ? dayjs(detail.tanggal_lahir).format("DD MMM YYYY")
                      : "—"}
                  </Descriptions.Item>
                  <Descriptions.Item label="Jenis Kelamin">
                    {detail?.jenis_kelamin || "—"}
                  </Descriptions.Item>
                  <Descriptions.Item label="Golongan Darah">
                    {detail?.golongan_darah || "—"}
                  </Descriptions.Item>
                  <Descriptions.Item label="Status Perkawinan">
                    {detail?.status_perkawinan || "—"}
                  </Descriptions.Item>
                  <Descriptions.Item label="Agama">
                    {detail?.agama || "—"}
                  </Descriptions.Item>
                  <Descriptions.Item label="Nomor Telepon">
                    {detail?.kontak || "—"}
                  </Descriptions.Item>
                  <Descriptions.Item label="Zona Waktu">
                    {detail?.zona_waktu || "—"}
                  </Descriptions.Item>
                  <Descriptions.Item label="Email">
                    {detail?.email || "—"}
                  </Descriptions.Item>
                </Descriptions>

                <h3 className="text-xl font-semibold">Pendidikan Terakhir</h3>
                <Descriptions bordered column={1} labelStyle={LABEL_STYLE}>
                  <Descriptions.Item label="Jenjang">
                    {detail?.jenjang_pendidikan || "—"}
                  </Descriptions.Item>
                  <Descriptions.Item label="Jurusan">
                    {detail?.jurusan || "—"}
                  </Descriptions.Item>
                  <Descriptions.Item label="Nama Institusi Pendidikan">
                    {detail?.nama_institusi_pendidikan || "—"}
                  </Descriptions.Item>
                  <Descriptions.Item label="Tahun Lulus">
                    {detail?.tahun_lulus || "—"}
                  </Descriptions.Item>
                </Descriptions>

                <h3 className="text-xl font-semibold">Kepegawaian</h3>
                <Descriptions bordered column={1} labelStyle={LABEL_STYLE}>
                  <Descriptions.Item label="Nomor Induk Karyawan">
                    {detail?.nomor_induk_karyawan || "—"}
                  </Descriptions.Item>
                  <Descriptions.Item label="Divisi">
                    {detail?.departement?.nama_departement || detail?.divisi || "—"}
                  </Descriptions.Item>
                  <Descriptions.Item label="Jabatan">
                    {detail?.jabatan?.nama_jabatan || "—"}
                  </Descriptions.Item>
                  <Descriptions.Item label="Status Kerja">
                    {detail?.status_kerja || "—"}
                  </Descriptions.Item>
                  <Descriptions.Item label="Tgl. Mulai Bekerja">
                    {detail?.tanggal_mulai_bekerja
                      ? dayjs(detail.tanggal_mulai_bekerja).format("DD MMM YYYY")
                      : "—"}
                  </Descriptions.Item>
                  <Descriptions.Item label="Lokasi Kantor">
                    {detail?.kantor?.nama_kantor || "—"}
                  </Descriptions.Item>
                  <Descriptions.Item label="Jenis Bank">
                    {detail?.jenis_bank || "—"}
                  </Descriptions.Item>
                  <Descriptions.Item label="Nomor Rekening">
                    {detail?.nomor_rekening || "—"}
                  </Descriptions.Item>
                </Descriptions>

                <h3 className="text-xl font-semibold">Alamat</h3>
                <Descriptions bordered column={1} labelStyle={LABEL_STYLE}>
                  <Descriptions.Item label="Alamat KTP">
                    {(detail?.alamat_ktp || "—") +
                      (detail?.alamat_ktp_kota ? ` — ${detail.alamat_ktp_kota}` : "") +
                      (detail?.alamat_ktp_provinsi ? `, ${detail.alamat_ktp_provinsi}` : "")}
                  </Descriptions.Item>
                  <Descriptions.Item label="Alamat Domisili">
                    {(detail?.alamat_domisili || "—") +
                      (detail?.alamat_domisili_kota ? ` — ${detail.alamat_domisili_kota}` : "") +
                      (detail?.alamat_domisili_provinsi ? `, ${detail.alamat_domisili_provinsi}` : "")}
                  </Descriptions.Item>
                </Descriptions>
              </div>
            ) : (
              <Form form={form} layout="vertical" onFinish={onFinish}>
                {/* Identitas */}
                <Descriptions
                  title="Identitas"
                  bordered
                  column={1}
                  labelStyle={LABEL_STYLE}
                  items={[]}
                />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                  <Form.Item name="tempat_lahir" label="Tempat Lahir">
                    <Input />
                  </Form.Item>
                  <Form.Item name="tanggal_lahir" label="Tanggal Lahir">
                    <DatePicker className="w-full" format="DD MMM YYYY" />
                  </Form.Item>
                  <Form.Item name="jenis_kelamin" label="Jenis Kelamin">
                    <Select
                      options={[
                        { value: "LAKI-LAKI", label: "Laki-laki" },
                        { value: "PEREMPUAN", label: "Perempuan" },
                      ]}
                      allowClear
                    />
                  </Form.Item>
                  <Form.Item name="golongan_darah" label="Golongan Darah">
                    <Input placeholder="A/B/AB/O" />
                  </Form.Item>
                  <Form.Item name="status_perkawinan" label="Status Perkawinan">
                    <Input />
                  </Form.Item>
                  <Form.Item name="agama" label="Agama">
                    <Input />
                  </Form.Item>
                  <Form.Item name="kontak" label="Nomor Telepon">
                    <Input />
                  </Form.Item>
                  <Form.Item name="zona_waktu" label="Zona Waktu">
                    <Input placeholder="mis. WIB / WITA / WIT / UTC+7" />
                  </Form.Item>
                </div>

                {/* Pendidikan */}
                <h3 className="text-xl font-semibold mt-6">Pendidikan Terakhir</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                  <Form.Item name="jenjang_pendidikan" label="Jenjang">
                    <Input />
                  </Form.Item>
                  <Form.Item name="jurusan" label="Jurusan">
                    <Input />
                  </Form.Item>
                  <Form.Item name="nama_institusi_pendidikan" label="Nama Institusi Pendidikan">
                    <Input />
                  </Form.Item>
                  <Form.Item name="tahun_lulus" label="Tahun Lulus">
                    <Input type="number" />
                  </Form.Item>
                </div>

                {/* Kepegawaian */}
                <h3 className="text-xl font-semibold mt-6">Kepegawaian</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                  <Form.Item name="nomor_induk_karyawan" label="Nomor Induk Karyawan">
                    <Input />
                  </Form.Item>
                  <Form.Item name="id_departement" label="Divisi">
                    <Select options={deptOpts} allowClear showSearch optionFilterProp="label" />
                  </Form.Item>
                  <Form.Item name="id_jabatan" label="Jabatan">
                    <Select options={jabOpts} allowClear showSearch optionFilterProp="label" />
                  </Form.Item>
                  <Form.Item name="status_kerja" label="Status Kerja">
                    <Input placeholder="Tetap/Kontrak/Magang ..." />
                  </Form.Item>
                  <Form.Item name="tanggal_mulai_bekerja" label="Tgl. Mulai Bekerja">
                    <DatePicker className="w-full" format="DD MMM YYYY" />
                  </Form.Item>
                  <Form.Item name="id_location" label="Lokasi Kantor">
                    <Select options={locOpts} allowClear showSearch optionFilterProp="label" />
                  </Form.Item>
                  <Form.Item name="jenis_bank" label="Jenis Bank">
                    <Input />
                  </Form.Item>
                  <Form.Item name="nomor_rekening" label="Nomor Rekening">
                    <Input />
                  </Form.Item>
                  <Form.Item name="role" label="Role">
                    <Select
                      options={[
                        { value: "KARYAWAN", label: "Karyawan" },
                        { value: "HR", label: "HR" },
                        { value: "OPERASIONAL", label: "Operasional" },
                        { value: "DIREKTUR", label: "Direktur" },
                      ]}
                    />
                  </Form.Item>
                </div>

                {/* Alamat */}
                <h3 className="text-xl font-semibold mt-6">Alamat</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                  <Form.Item name="alamat_ktp" label="Alamat KTP">
                    <Input.TextArea rows={2} />
                  </Form.Item>
                  <div className="grid grid-cols-2 gap-4">
                    <Form.Item name="alamat_ktp_provinsi" label="Provinsi (KTP)">
                      <Input />
                    </Form.Item>
                    <Form.Item name="alamat_ktp_kota" label="Kota (KTP)">
                      <Input />
                    </Form.Item>
                  </div>

                  <Form.Item name="alamat_domisili" label="Alamat Domisili">
                    <Input.TextArea rows={2} />
                  </Form.Item>
                  <div className="grid grid-cols-2 gap-4">
                    <Form.Item name="alamat_domisili_provinsi" label="Provinsi (Domisili)">
                      <Input />
                    </Form.Item>
                    <Form.Item name="alamat_domisili_kota" label="Kota (Domisili)">
                      <Input />
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
