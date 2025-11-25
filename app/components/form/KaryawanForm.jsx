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
  Avatar,
  Row,
  Col,
  Divider,
  Typography,
} from "antd";
import { 
  UploadOutlined, 
  UserOutlined, 
  CameraOutlined,
  EditOutlined,
  ArrowLeftOutlined,
  SaveOutlined
} from "@ant-design/icons";
import dayjs from "dayjs";
import useSWR from "swr";
import { ApiEndpoints } from "../../../constrainst/endpoints";
import { crudService } from "../../../app/utils/services/crudService";

dayjs.locale("id");

const { Title, Text } = Typography;

const LABEL_STYLE = { width: 240, fontWeight: 600 };
const BRAND = "#003A6F";
const SECONDARY_COLOR = "#1890ff";

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
  mode = "view",
  id,
  forceReadOnly = false,
  onSuccess,
}) {
  const readOnly = mode === "view" || forceReadOnly;
  const [form] = Form.useForm();
  const [saving, setSaving] = useState(false);
  const [fileList, setFileList] = useState([]);
  const [previewImage, setPreviewImage] = useState("");

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
      form.setFieldsValue({ status_cuti: "aktif" });
    }
  }, [mode, form]);

  useEffect(() => {
    if (detail && (mode === "edit" || mode === "view")) {
      form.setFieldsValue({
        nama_pengguna: nz(detail.nama_pengguna),
        email: nz(detail.email),
        kontak: nz(detail.kontak),
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

  /* ====== upload handler ====== */
  const handleUploadChange = ({ fileList: newFileList }) => {
    setFileList(newFileList);
    if (newFileList.length > 0 && newFileList[0].originFileObj) {
      setPreviewImage(URL.createObjectURL(newFileList[0].originFileObj));
    }
  };

  const uploadButton = (
    <div className="flex flex-col items-center justify-center p-4">
      <CameraOutlined className="text-2xl text-gray-400 mb-2" />
      <div className="text-sm text-gray-500">Upload Foto</div>
    </div>
  );

  /* ====== render ====== */
  const photoUrl = previewImage || 
    (detail && detail.foto_profil_user) || 
    "/avatar-placeholder.png";

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <div>
              <Title level={2} className="!mb-1 !text-gray-800">
                {mode === "add" ? "Tambah Karyawan Baru" : "Profil Karyawan"}
              </Title>
              <Text type="secondary">
                {mode === "add" 
                  ? "Lengkapi data karyawan baru" 
                  : readOnly 
                    ? "Lihat detail informasi karyawan" 
                    : "Edit data karyawan"
                }
              </Text>
            </div>
          </div>

          {readOnly ? (
            (detail && !forceReadOnly) ? (
              <Link href={`/home/kelola_karyawan/karyawan/${id}/edit`}>
                <Button 
                  type="primary" 
                  icon={<EditOutlined />}
                  size="large"
                  style={{ background: BRAND }}
                >
                  Edit Profil
                </Button>
              </Link>
            ) : null
          ) : (
            <Space>
              <Button 
                size="large" 
                onClick={() => window.history.back()}
                className="px-6"
              >
                Batal
              </Button>
              <Button
                type="primary"
                size="large"
                icon={<SaveOutlined />}
                onClick={() => form.submit()}
                loading={saving}
                style={{ background: BRAND }}
                className="px-6"
              >
                {mode === "add" ? "Simpan Data" : "Simpan Perubahan"}
              </Button>
            </Space>
          )}
        </div>

        <Card 
          bordered={false} 
          className="shadow-lg rounded-xl overflow-hidden border-0"
          bodyStyle={{ padding: 0 }}
        >
          {mode !== "add" && (loadingDetail || !detail) ? (
            <div className="p-8">
              <Skeleton active avatar paragraph={{ rows: 8 }} />
            </div>
          ) : (
            <div className="flex flex-col lg:flex-row">
              {/* Sidebar - Foto & Info Utama */}
              <div className="lg:w-80 bg-gradient-to-b from-blue-50 to-white p-6 border-r border-gray-200">
                <div className="flex flex-col items-center text-center">
                  {/* Foto Profil */}
                  <div className="relative mb-4">
                    <Avatar
                      size={160}
                      src={photoUrl}
                      icon={<UserOutlined />}
                      className="border-4 border-white shadow-lg"
                    />
                    {!readOnly && (
                      <div className="absolute bottom-2 right-2">
                        <Upload
                          fileList={fileList}
                          maxCount={1}
                          onChange={handleUploadChange}
                          beforeUpload={() => false}
                          showUploadList={false}
                        >
                          <Button 
                            type="primary" 
                            shape="circle" 
                            icon={<CameraOutlined />}
                            size="small"
                            style={{ background: SECONDARY_COLOR }}
                            className="shadow-lg"
                          />
                        </Upload>
                      </div>
                    )}
                  </div>

                  {readOnly ? (
                    <>
                      <Title level={3} className="!mb-1 !text-gray-800">
                        {displayOrDash(detail?.nama_pengguna)}
                      </Title>
                      <Text type="secondary" className="block mb-2">
                        {displayOrDash(detail?.jabatan?.nama_jabatan)}
                      </Text>
                      <Text className="block mb-3 text-sm">
                        {displayOrDash(detail?.departement?.nama_departement ?? detail?.divisi)}
                      </Text>
                      
                      {/* Status Badges */}
                      <Space direction="vertical" className="w-full mb-4">
                        <div className="flex justify-between items-center bg-white p-3 rounded-lg border">
                          <Text strong>Status Kerja:</Text>
                          <Tag 
                            color={detail?.status_kerja === "AKTIF" ? "green" : "red"}
                            className="m-0"
                          >
                            {displayOrDash(detail?.status_kerja)}
                          </Tag>
                        </div>
                        <div className="flex justify-between items-center bg-white p-3 rounded-lg border">
                          <Text strong>Status Cuti:</Text>
                          <Tag 
                            color={(detail?.status_cuti || "") === "aktif" ? "blue" : "orange"}
                            className="m-0"
                          >
                            {displayOrDash(detail?.status_cuti)?.replace(/^./, (c) => c.toUpperCase())}
                          </Tag>
                        </div>
                      </Space>

                      {/* Info Kontak */}
                      <div className="w-full text-left bg-white p-4 rounded-lg border">
                        <Text strong className="block mb-2">Informasi Kontak</Text>
                        <div className="space-y-1 text-sm">
                          <div className="flex justify-between">
                            <Text type="secondary">Email:</Text>
                            <Text>{displayOrDash(detail?.email)}</Text>
                          </div>
                          <div className="flex justify-between">
                            <Text type="secondary">Telepon:</Text>
                            <Text>{displayOrDash(detail?.kontak)}</Text>
                          </div>
                          {detail?.kontak_darurat && (
                            <div className="flex justify-between">
                              <Text type="secondary">Kontak Darurat:</Text>
                              <Text>{displayOrDash(detail?.kontak_darurat)}</Text>
                            </div>
                          )}
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="w-full space-y-4">
                      <Form
                        form={form}
                        layout="vertical"
                        className="w-full"
                        onFinish={onFinish}
                        initialValues={initialValues}
                      >
                        <Form.Item
                          name="nama_pengguna"
                          label="Nama Lengkap"
                          rules={[{ required: true, message: "Nama wajib diisi" }]}
                          className="mb-3"
                        >
                          <Input 
                            placeholder="Masukkan nama lengkap" 
                            size="large"
                            prefix={<UserOutlined className="text-gray-400" />}
                          />
                        </Form.Item>

                        <Form.Item
                          name="email"
                          label="Email"
                          rules={[
                            { required: true, message: "Email wajib diisi" },
                            { type: "email", message: "Format email tidak valid" },
                          ]}
                          className="mb-3"
                        >
                          <Input 
                            placeholder="email@perusahaan.com" 
                            size="large"
                          />
                        </Form.Item>

                        {mode === "add" && (
                          <Form.Item
                            name="password"
                            label="Password"
                            rules={[{ required: true, message: "Password wajib diisi" }]}
                            className="mb-3"
                          >
                            <Input.Password 
                              placeholder="Masukkan password" 
                              size="large"
                            />
                          </Form.Item>
                        )}

                        <div className="text-center">
                          <Upload
                            fileList={fileList}
                            maxCount={1}
                            onChange={handleUploadChange}
                            beforeUpload={() => false}
                            showUploadList={false}
                          >
                            <Button 
                              icon={<UploadOutlined />}
                              type="dashed"
                              className="w-full"
                            >
                              {fileList.length ? "Ganti Foto Profil" : "Upload Foto Profil"}
                            </Button>
                          </Upload>
                          <Text type="secondary" className="text-xs block mt-2">
                            Format: JPG, PNG (Maks. 5MB)
                          </Text>
                        </div>
                      </Form>
                    </div>
                  )}
                </div>
              </div>

              {/* Main Content */}
              <div className="flex-1 p-6">
                {readOnly ? (
                  <div className="space-y-8">
                    {/* Identitas */}
                    <div>
                      <Title level={4} className="!mb-4 !text-gray-700">Identitas Diri</Title>
                      <Row gutter={[16, 16]}>
                        <Col span={8}>
                          <div className="bg-gray-50 p-3 rounded-lg">
                            <Text type="secondary" className="text-sm">Tempat Lahir</Text>
                            <div className="font-medium">{displayOrDash(detail?.tempat_lahir)}</div>
                          </div>
                        </Col>
                        <Col span={8}>
                          <div className="bg-gray-50 p-3 rounded-lg">
                            <Text type="secondary" className="text-sm">Tanggal Lahir</Text>
                            <div className="font-medium">
                              {displayOrDash(detail?.tanggal_lahir) !== DASH
                                ? dayjs(detail.tanggal_lahir).format("DD MMM YYYY")
                                : DASH}
                            </div>
                          </div>
                        </Col>
                        <Col span={8}>
                          <div className="bg-gray-50 p-3 rounded-lg">
                            <Text type="secondary" className="text-sm">Jenis Kelamin</Text>
                            <div className="font-medium">{displayOrDash(detail?.jenis_kelamin)}</div>
                          </div>
                        </Col>
                        <Col span={8}>
                          <div className="bg-gray-50 p-3 rounded-lg">
                            <Text type="secondary" className="text-sm">Golongan Darah</Text>
                            <div className="font-medium">{displayOrDash(detail?.golongan_darah)}</div>
                          </div>
                        </Col>
                        <Col span={8}>
                          <div className="bg-gray-50 p-3 rounded-lg">
                            <Text type="secondary" className="text-sm">Status Perkawinan</Text>
                            <div className="font-medium">{displayOrDash(detail?.status_perkawinan)}</div>
                          </div>
                        </Col>
                        <Col span={8}>
                          <div className="bg-gray-50 p-3 rounded-lg">
                            <Text type="secondary" className="text-sm">Agama</Text>
                            <div className="font-medium">{displayOrDash(detail?.agama)}</div>
                          </div>
                        </Col>
                      </Row>
                    </div>

                    <Divider />

                    {/* Pendidikan */}
                    <div>
                      <Title level={4} className="!mb-4 !text-gray-700">Pendidikan Terakhir</Title>
                      <Row gutter={[16, 16]}>
                        <Col span={12}>
                          <div className="bg-gray-50 p-3 rounded-lg">
                            <Text type="secondary" className="text-sm">Jenjang</Text>
                            <div className="font-medium">{displayOrDash(detail?.jenjang_pendidikan)}</div>
                          </div>
                        </Col>
                        <Col span={12}>
                          <div className="bg-gray-50 p-3 rounded-lg">
                            <Text type="secondary" className="text-sm">Jurusan</Text>
                            <div className="font-medium">{displayOrDash(detail?.jurusan)}</div>
                          </div>
                        </Col>
                        <Col span={12}>
                          <div className="bg-gray-50 p-3 rounded-lg">
                            <Text type="secondary" className="text-sm">Institusi Pendidikan</Text>
                            <div className="font-medium">{displayOrDash(detail?.nama_institusi_pendidikan)}</div>
                          </div>
                        </Col>
                        <Col span={12}>
                          <div className="bg-gray-50 p-3 rounded-lg">
                            <Text type="secondary" className="text-sm">Tahun Lulus</Text>
                            <div className="font-medium">{displayOrDash(detail?.tahun_lulus)}</div>
                          </div>
                        </Col>
                      </Row>
                    </div>

                    <Divider />

                    {/* Kepegawaian */}
                    <div>
                      <Title level={4} className="!mb-4 !text-gray-700">Informasi Kepegawaian</Title>
                      <Row gutter={[16, 16]}>
                        <Col span={12}>
                          <div className="bg-gray-50 p-3 rounded-lg">
                            <Text type="secondary" className="text-sm">Nomor Induk Karyawan</Text>
                            <div className="font-medium">{displayOrDash(detail?.nomor_induk_karyawan)}</div>
                          </div>
                        </Col>
                        <Col span={12}>
                          <div className="bg-gray-50 p-3 rounded-lg">
                            <Text type="secondary" className="text-sm">Divisi</Text>
                            <div className="font-medium">
                              {displayOrDash(detail?.departement?.nama_departement ?? detail?.divisi)}
                            </div>
                          </div>
                        </Col>
                        <Col span={12}>
                          <div className="bg-gray-50 p-3 rounded-lg">
                            <Text type="secondary" className="text-sm">Jabatan</Text>
                            <div className="font-medium">{displayOrDash(detail?.jabatan?.nama_jabatan)}</div>
                          </div>
                        </Col>
                        <Col span={12}>
                          <div className="bg-gray-50 p-3 rounded-lg">
                            <Text type="secondary" className="text-sm">Lokasi Kantor</Text>
                            <div className="font-medium">{displayOrDash(detail?.kantor?.nama_kantor)}</div>
                          </div>
                        </Col>
                        <Col span={12}>
                          <div className="bg-gray-50 p-3 rounded-lg">
                            <Text type="secondary" className="text-sm">Tanggal Mulai Bekerja</Text>
                            <div className="font-medium">
                              {displayOrDash(detail?.tanggal_mulai_bekerja) !== DASH
                                ? dayjs(detail.tanggal_mulai_bekerja).format("DD MMM YYYY")
                                : DASH}
                            </div>
                          </div>
                        </Col>
                        <Col span={12}>
                          <div className="bg-gray-50 p-3 rounded-lg">
                            <Text type="secondary" className="text-sm">Bank & Rekening</Text>
                            <div className="font-medium">
                              {detail?.jenis_bank && detail?.nomor_rekening 
                                ? `${detail.jenis_bank} - ${detail.nomor_rekening}`
                                : DASH
                              }
                            </div>
                          </div>
                        </Col>
                      </Row>
                    </div>

                    <Divider />

                    {/* Alamat */}
                    <div>
                      <Title level={4} className="!mb-4 !text-gray-700">Alamat</Title>
                      <Row gutter={[16, 16]}>
                        <Col span={24}>
                          <div className="bg-gray-50 p-4 rounded-lg">
                            <Text strong className="block mb-2">Alamat KTP</Text>
                            <Text>
                              {joinAlamat(detail?.alamat_ktp, detail?.alamat_ktp_kota, detail?.alamat_ktp_provinsi)}
                            </Text>
                          </div>
                        </Col>
                        <Col span={24}>
                          <div className="bg-gray-50 p-4 rounded-lg">
                            <Text strong className="block mb-2">Alamat Domisili</Text>
                            <Text>
                              {joinAlamat(detail?.alamat_domisili, detail?.alamat_domisili_kota, detail?.alamat_domisili_provinsi)}
                            </Text>
                          </div>
                        </Col>
                      </Row>
                    </div>
                  </div>
                ) : (
                  <Form form={form} layout="vertical" onFinish={onFinish} initialValues={initialValues}>
                    {/* Identitas */}
                    <div className="mb-8">
                      <Title level={4} className="!mb-6 !text-gray-700 border-b pb-2">
                        Identitas Diri
                      </Title>
                      <Row gutter={[16, 16]}>
                        <Col xs={24} md={12}>
                          <Form.Item name="tempat_lahir" label="Tempat Lahir">
                            <Input placeholder="Masukkan tempat lahir" size="large" />
                          </Form.Item>
                        </Col>
                        <Col xs={24} md={12}>
                          <Form.Item name="tanggal_lahir" label="Tanggal Lahir">
                            <DatePicker 
                              className="w-full" 
                              format="DD MMM YYYY" 
                              placeholder="Pilih tanggal" 
                              size="large"
                            />
                          </Form.Item>
                        </Col>
                        <Col xs={24} md={12}>
                          <Form.Item name="jenis_kelamin" label="Jenis Kelamin">
                            <Select
                              options={[
                                { value: "LAKI_LAKI", label: "Laki-laki" },
                                { value: "PEREMPUAN", label: "Perempuan" },
                              ]}
                              allowClear
                              placeholder="Pilih jenis kelamin"
                              size="large"
                            />
                          </Form.Item>
                        </Col>
                        <Col xs={24} md={12}>
                          <Form.Item name="golongan_darah" label="Golongan Darah">
                            <Select 
                              options={OPSI_GOLONGAN_DARAH} 
                              allowClear 
                              placeholder="Pilih golongan darah"
                              size="large"
                            />
                          </Form.Item>
                        </Col>
                        <Col xs={24} md={12}>
                          <Form.Item name="status_perkawinan" label="Status Perkawinan">
                            <Select 
                              options={OPSI_STATUS_PERKAWINAN} 
                              allowClear 
                              placeholder="Pilih status perkawinan"
                              size="large"
                            />
                          </Form.Item>
                        </Col>
                        <Col xs={24} md={12}>
                          <Form.Item name="agama" label="Agama">
                            <Select 
                              options={OPSI_AGAMA} 
                              allowClear 
                              showSearch 
                              optionFilterProp="label" 
                              placeholder="Pilih agama"
                              size="large"
                            />
                          </Form.Item>
                        </Col>
                        <Col xs={24} md={12}>
                          <Form.Item name="kontak" label="Nomor Telepon">
                            <Input placeholder="Masukkan nomor telepon" size="large" />
                          </Form.Item>
                        </Col>
                        <Col xs={24} md={12}>
                          <Form.Item name="zona_waktu" label="Zona Waktu">
                            <Input placeholder="WIB / WITA / WIT / UTC+7" size="large" />
                          </Form.Item>
                        </Col>
                        <Col xs={24} md={12}>
                          <Form.Item name="nama_kontak_darurat" label="Nama Kontak Darurat">
                            <Input placeholder="Masukkan nama kontak darurat" size="large" />
                          </Form.Item>
                        </Col>
                        <Col xs={24} md={12}>
                          <Form.Item
                            name="kontak_darurat"
                            label="Nomor Kontak Darurat"
                            rules={[{ pattern: /^[0-9+\-\s()]{6,20}$/, message: "Nomor tidak valid" }]}
                          >
                            <Input placeholder="Masukkan nomor kontak darurat" size="large" />
                          </Form.Item>
                        </Col>
                      </Row>
                    </div>

                    <Divider />

                    {/* Pendidikan */}
                    <div className="mb-8">
                      <Title level={4} className="!mb-6 !text-gray-700 border-b pb-2">
                        Pendidikan Terakhir
                      </Title>
                      <Row gutter={[16, 16]}>
                        <Col xs={24} md={12}>
                          <Form.Item name="jenjang_pendidikan" label="Jenjang">
                            <Select 
                              options={OPSI_JENJANG} 
                              allowClear 
                              placeholder="Pilih jenjang pendidikan"
                              size="large"
                            />
                          </Form.Item>
                        </Col>
                        <Col xs={24} md={12}>
                          <Form.Item name="jurusan" label="Jurusan">
                            <Input placeholder="Masukkan jurusan" size="large" />
                          </Form.Item>
                        </Col>
                        <Col xs={24} md={12}>
                          <Form.Item name="nama_institusi_pendidikan" label="Nama Institusi Pendidikan">
                            <Input placeholder="Masukkan nama institusi" size="large" />
                          </Form.Item>
                        </Col>
                        <Col xs={24} md={12}>
                          <Form.Item name="tahun_lulus" label="Tahun Lulus">
                            <Input type="number" placeholder="Masukkan tahun lulus" size="large" />
                          </Form.Item>
                        </Col>
                      </Row>
                    </div>

                    <Divider />

                    {/* Kepegawaian */}
                    <div className="mb-8">
                      <Title level={4} className="!mb-6 !text-gray-700 border-b pb-2">
                        Informasi Kepegawaian
                      </Title>
                      <Row gutter={[16, 16]}>
                        <Col xs={24} md={12}>
                          <Form.Item name="nomor_induk_karyawan" label="Nomor Induk Karyawan">
                            <Input placeholder="Masukkan NIK" size="large" />
                          </Form.Item>
                        </Col>
                        <Col xs={24} md={12}>
                          <Form.Item name="id_departement" label="Divisi">
                            <Select 
                              options={deptOpts} 
                              allowClear 
                              showSearch 
                              optionFilterProp="label" 
                              placeholder="Pilih divisi"
                              size="large"
                            />
                          </Form.Item>
                        </Col>
                        <Col xs={24} md={12}>
                          <Form.Item name="id_jabatan" label="Jabatan">
                            <Select 
                              options={jabOpts} 
                              allowClear 
                              showSearch 
                              optionFilterProp="label" 
                              placeholder="Pilih jabatan"
                              size="large"
                            />
                          </Form.Item>
                        </Col>
                        <Col xs={24} md={12}>
                          <Form.Item name="status_kerja" label="Status Kerja">
                            <Select 
                              options={OPSI_STATUS_KERJA} 
                              allowClear 
                              placeholder="Pilih status kerja"
                              size="large"
                            />
                          </Form.Item>
                        </Col>
                        <Col xs={24} md={12}>
                          <Form.Item name="tanggal_mulai_bekerja" label="Tanggal Mulai Bekerja">
                            <DatePicker 
                              className="w-full" 
                              format="DD MMM YYYY" 
                              placeholder="Pilih tanggal"
                              size="large"
                            />
                          </Form.Item>
                        </Col>
                        <Col xs={24} md={12}>
                          <Form.Item name="id_location" label="Lokasi Kantor">
                            <Select 
                              options={locOpts} 
                              allowClear 
                              showSearch 
                              optionFilterProp="label" 
                              placeholder="Pilih lokasi"
                              size="large"
                            />
                          </Form.Item>
                        </Col>
                        <Col xs={24} md={12}>
                          <Form.Item name="jenis_bank" label="Jenis Bank">
                            <Input placeholder="Masukkan jenis bank" size="large" />
                          </Form.Item>
                        </Col>
                        <Col xs={24} md={12}>
                          <Form.Item name="nomor_rekening" label="Nomor Rekening">
                            <Input placeholder="Masukkan nomor rekening" size="large" />
                          </Form.Item>
                        </Col>
                        <Col xs={24} md={12}>
                          <Form.Item name="role" label="Role">
                            <Select
                              options={[
                                { value: "KARYAWAN", label: "Karyawan" },
                                { value: "HR", label: "HR" },
                                { value: "OPERASIONAL", label: "Operasional" },
                                { value: "DIREKTUR", label: "Direktur" },
                                { value: "SUPERADMIN", label: "Super-admin" },
                              ]}
                              placeholder="Pilih role"
                              size="large"
                            />
                          </Form.Item>
                        </Col>
                        <Col xs={24} md={12}>
                          <Form.Item name="status_cuti" label="Status Cuti">
                            <Select 
                              options={OPSI_STATUS_CUTI} 
                              allowClear 
                              placeholder="Pilih status cuti"
                              size="large"
                            />
                          </Form.Item>
                        </Col>
                      </Row>
                    </div>

                    <Divider />

                    {/* Alamat */}
                    <div>
                      <Title level={4} className="!mb-6 !text-gray-700 border-b pb-2">
                        Alamat
                      </Title>
                      <Row gutter={[16, 16]}>
                        <Col span={24}>
                          <Form.Item name="alamat_ktp" label="Alamat KTP">
                            <Input.TextArea 
                              rows={3} 
                              placeholder="Masukkan alamat sesuai KTP" 
                              size="large"
                            />
                          </Form.Item>
                        </Col>
                        <Col xs={24} md={12}>
                          <Form.Item name="alamat_ktp_provinsi" label="Provinsi (KTP)">
                            <Input placeholder="Masukkan provinsi" size="large" />
                          </Form.Item>
                        </Col>
                        <Col xs={24} md={12}>
                          <Form.Item name="alamat_ktp_kota" label="Kota (KTP)">
                            <Input placeholder="Masukkan kota" size="large" />
                          </Form.Item>
                        </Col>
                        <Col span={24}>
                          <Form.Item name="alamat_domisili" label="Alamat Domisili">
                            <Input.TextArea 
                              rows={3} 
                              placeholder="Masukkan alamat domisili saat ini" 
                              size="large"
                            />
                          </Form.Item>
                        </Col>
                        <Col xs={24} md={12}>
                          <Form.Item name="alamat_domisili_provinsi" label="Provinsi (Domisili)">
                            <Input placeholder="Masukkan provinsi" size="large" />
                          </Form.Item>
                        </Col>
                        <Col xs={24} md={12}>
                          <Form.Item name="alamat_domisili_kota" label="Kota (Domisili)">
                            <Input placeholder="Masukkan kota" size="large" />
                          </Form.Item>
                        </Col>
                      </Row>
                    </div>
                  </Form>
                )}
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}