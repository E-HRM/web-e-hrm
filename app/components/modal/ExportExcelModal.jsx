// components/modal/ExportExcelModal.jsx
"use client";

import { useMemo, useState, useCallback } from "react";
import useSWR from "swr";
import dayjs from "dayjs";
import { Modal, Tabs, Form, DatePicker, Select, Input, message } from "antd";
import { MailOutlined } from "@ant-design/icons";
import { fetcher } from "../../utils/fetcher";
import { ApiEndpoints } from "@/constrainst/endpoints";

/* ========= Helpers ========= */
const safeName = (name) =>
  (name || "semua-karyawan").trim().replace(/[\/\\?%*:|"<>]/g, "-");

const fmtDateForFilename = (d) =>
  dayjs(d).format("YYYY/MM/DD").replaceAll("/", "／"); // gunakan full-width slash biar “tampak” seperti 2025/10/01 tapi aman

/* util format jam */
function hhmmss(v) {
  if (!v) return "";
  if (typeof v === "string") {
    const m = v.match(/(?:T|\s)?(\d{2}):(\d{2})(?::(\d{2}))?/);
    if (m) return `${m[1]}:${m[2]}:${m[3] ?? "00"}`;
    const d = dayjs(v);
    return d.isValid() ? d.format("HH:mm:ss") : "";
  }
  const d = dayjs(v);
  return d.isValid() ? d.format("HH:mm:ss") : "";
}

export default function ExportExcelModal({
  open,
  onClose,
  rowsAll = [],
  employeeOptions: employeeOptionsProp,
  lokasiOptions: lokasiOptionsProp,
}) {
  const [tab, setTab] = useState("single");
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);

  /* ====== Ambil master Users & Locations saat modal terbuka ====== */
  const shouldFetch = !!open;

  const { data: userRes, isLoading: usersLoading } = useSWR(
    shouldFetch ? `${ApiEndpoints.GetUsers}?page=1&pageSize=500` : null,
    fetcher
  );
  const { data: locRes, isLoading: locsLoading } = useSWR(
    shouldFetch ? `${ApiEndpoints.GetLocation}?page=1&pageSize=500` : null,
    fetcher
  );

  const apiEmployeeOptions = useMemo(
    () =>
      (userRes?.data || []).map((u) => ({
        value: u.id_user || u.id || u.uuid,
        label: u.nama_pengguna || u.name || u.email,
      })),
    [userRes]
  );

  // Gunakan nama_kantor sebagai value agar cocok dengan r.lokasiIn/Out.name saat filter
  const apiLokasiOptions = useMemo(
    () =>
      (locRes?.data || []).map((l) => ({
        value: l.nama_kantor,
        label: l.nama_kantor,
      })),
    [locRes]
  );

  /* ====== Fallback dari rowsAll jika props & API kosong ====== */
  const fallbackFromRows = useMemo(() => {
    const empMap = new Map();
    const locSet = new Set();
    rowsAll.forEach((r) => {
      const u = r?.user;
      const uid = u?.id_user ?? u?.id ?? u?.uuid;
      const name = u?.nama_pengguna ?? u?.name ?? u?.email;
      if (uid && name && !empMap.has(uid)) empMap.set(uid, { value: uid, label: name });

      const addLoc = (loc) => {
        if (!loc) return;
        const label =
          loc.name ||
          (Number.isFinite(loc.lat) && Number.isFinite(loc.lon)
            ? `Lat ${loc.lat.toFixed(5)}, Lon ${loc.lon.toFixed(5)}`
            : "");
        if (label) locSet.add(label);
      };
      addLoc(r?.lokasiIn);
      addLoc(r?.lokasiOut);
    });
    return {
      employeeOptions: Array.from(empMap.values()),
      lokasiOptions: Array.from(locSet).map((l) => ({ value: l, label: l })),
    };
  }, [rowsAll]);

  /* ====== Pilih sumber opsi secara berurutan: props → API → fallback rows ====== */
  const { employeeOptions, lokasiOptions } = useMemo(() => {
    const finalEmp =
      (employeeOptionsProp && employeeOptionsProp.length && employeeOptionsProp) ||
      (apiEmployeeOptions.length && apiEmployeeOptions) ||
      fallbackFromRows.employeeOptions;

    const finalLoc =
      (lokasiOptionsProp && lokasiOptionsProp.length && lokasiOptionsProp) ||
      (apiLokasiOptions.length && apiLokasiOptions) ||
      fallbackFromRows.lokasiOptions;

    return { employeeOptions: finalEmp, lokasiOptions: finalLoc };
  }, [
    employeeOptionsProp,
    lokasiOptionsProp,
    apiEmployeeOptions,
    apiLokasiOptions,
    fallbackFromRows,
  ]);

  // Map id -> label untuk cepat ambil nama
  const employeeLabelById = useMemo(() => {
    const m = new Map();
    (employeeOptions || []).forEach((o) => m.set(String(o.value), o.label));
    return m;
  }, [employeeOptions]);

  /* ====== Nilai awal form ====== */
  const initial = useMemo(
    () => ({
      singleDate: dayjs(),
      range: [dayjs().startOf("month"), dayjs().endOf("month")],
      users: [],
      locations: [],
      format: "lengkap",
      emails: "",
    }),
    []
  );

  /* ====== Submit: filter rows + generate Excel ====== */
  const onSubmit = useCallback(async () => {
    try {
      const v = await form.validateFields();
      setSubmitting(true);

      let start, end;
      if (tab === "single") {
        start = dayjs(v.singleDate).startOf("day");
        end = dayjs(v.singleDate).endOf("day");
      } else {
        const [d1, d2] = v.range || [];
        start = dayjs(d1).startOf("day");
        end = dayjs(d2).endOf("day");
      }

      const users = v.users || [];
      const locations = v.locations || [];
      const format = v.format || "lengkap";

      const filtered = (rowsAll || []).filter((r) => {
        const t = dayjs(r?.tanggal);
        if (!t.isValid()) return false;
        if (t.isBefore(start) || t.isAfter(end)) return false;

        if (users.length) {
          const uid = r?.user?.id_user || r?.user?.id || r?.user?.uuid;
          if (!uid || !users.map(String).includes(String(uid))) return false;
        }
        if (locations.length) {
          const inName = r?.lokasiIn?.name || "";
          const outName = r?.lokasiOut?.name || "";
          const has = locations.includes(inName) || locations.includes(outName);
          if (!has) return false;
        }
        return true;
      });

      if (!filtered.length) {
        message.warning("Tidak ada data pada rentang & filter yang dipilih.");
        setSubmitting(false);
        return;
      }

      const rows = filtered.map((r) => {
        const nama = r?.user?.nama_pengguna || r?.user?.email || "-";
        const departemen = r?.user?.departement?.nama_departement || "-";
        const jabatan = r?.user?.jabatan?.nama_jabatan || "-";
        const tanggal = dayjs(r?.tanggal).format("YYYY-MM-DD");
        const jamMasuk = hhmmss(r?.jam_masuk);
        const jamIstMulai = hhmmss(r?.istirahat_mulai);
        const jamIstSelesai = hhmmss(r?.istirahat_selesai);
        const jamPulang = hhmmss(r?.jam_pulang);
        const stIn = r?.status_masuk || "";
        const stOut = r?.status_pulang || "";
        const locIn = r?.lokasiIn?.name || "";
        const locOut = r?.lokasiOut?.name || "";

        if (format === "ringkas") {
          return {
            Nama: nama,
            Departemen: departemen,
            Tanggal: tanggal,
            Masuk: jamMasuk,
            Pulang: jamPulang,
            "Status Datang": stIn,
            "Status Pulang": stOut,
          };
        }

        return {
          Nama: nama,
          Departemen: departemen,
          Jabatan: jabatan,
          Tanggal: tanggal,
          Masuk: jamMasuk,
          "Mulai Istirahat": jamIstMulai,
          "Selesai Istirahat": jamIstSelesai,
          Pulang: jamPulang,
          "Status Datang": stIn,
          "Status Pulang": stOut,
          "Lokasi Masuk": locIn,
          "Lokasi Pulang": locOut,
          "Foto Masuk": r?.photo_in || "",
          "Foto Pulang": r?.photo_out || "",
        };
      });

      const XLSX = await import("xlsx");
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(rows);
      XLSX.utils.book_append_sheet(wb, ws, "Absensi");

      // ====== Tentukan nama untuk file ======
      // 1) Nama karyawan:
      //    - jika user terpilih 1 → gunakan labelnya
      //    - jika >1 → "multi-<n>-karyawan"
      //    - jika tidak pilih, tapi hasil filtered hanya 1 orang → pakai nama orang tsb
      //    - else → "semua-karyawan"
      let employeeName = "semua-karyawan";
      if ((users || []).length === 1) {
        employeeName =
          employeeLabelById.get(String(users[0])) || "karyawan";
      } else if ((users || []).length > 1) {
        employeeName = `multi-${users.length}-karyawan`;
      } else {
        const uniq = new Set(
          filtered
            .map((r) => r?.user?.nama_pengguna || r?.user?.name || r?.user?.email)
            .filter(Boolean)
        );
        if (uniq.size === 1) {
          employeeName = Array.from(uniq)[0];
        }
      }

      // 2) Bagian tanggal (pakai full-width slash agar “2025／10／01” aman)
      const sameDay = start.isSame(end, "day");
      const datePart = sameDay
        ? fmtDateForFilename(start)
        : `${fmtDateForFilename(start)} - ${fmtDateForFilename(end)}`;

      // 3) Final filename
      const fname = `absensi-${safeName(employeeName)}-${datePart}.xlsx`;

      const wbout = XLSX.write(wb, { bookType: "xlsx", type: "array" });
      const blob = new Blob([wbout], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });

      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = fname;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);

      message.success("File Excel berhasil dibuat.");
      setSubmitting(false);
      onClose?.();
    } catch (e) {
      setSubmitting(false);
      if (e?.errorFields) return; // error validasi form
      console.error(e);
      message.error("Gagal mengekspor data.");
    }
  }, [form, tab, rowsAll, onClose, employeeLabelById]);

  return (
    <Modal
      title="Ekspor Excel"
      open={open}
      onCancel={onClose}
      onOk={onSubmit}
      okText="Proses"
      cancelText="Tutup"
      width={720}
      confirmLoading={submitting}
      destroyOnClose
    >
      <Tabs
        activeKey={tab}
        onChange={setTab}
        items={[
          { key: "single", label: "Tanggal Tertentu" },
          { key: "range", label: "Rentang Waktu" },
        ]}
      />
      <Form form={form} layout="vertical" initialValues={initial}>
        {tab === "single" ? (
          <Form.Item
            label="Tanggal"
            name="singleDate"
            rules={[{ required: true, message: "Silakan pilih tanggal" }]}
          >
            <DatePicker className="w-full" format="DD/MM/YYYY" />
          </Form.Item>
        ) : (
          <Form.Item
            label="Tanggal"
            name="range"
            rules={[{ required: true, message: "Silakan pilih rentang tanggal" }]}
          >
            <DatePicker.RangePicker className="w-full" format="DD/MM/YYYY" />
          </Form.Item>
        )}

        <Form.Item
          label="Lokasi Kehadiran"
          name="locations"
          tooltip="Bisa pilih lebih dari satu"
        >
          <Select
            mode="multiple"
            allowClear
            options={lokasiOptions}
            placeholder={locsLoading ? "Memuat lokasi..." : "Pilih lokasi"}
            showSearch
            filterOption={(input, opt) =>
              (opt?.label ?? "").toLowerCase().includes(input.toLowerCase())
            }
          />
        </Form.Item>

        <Form.Item
          label="Spesifik Karyawan"
          name="users"
          tooltip="Bisa pilih lebih dari satu"
        >
          <Select
            mode="multiple"
            allowClear
            showSearch
            placeholder={usersLoading ? "Memuat karyawan..." : "Pilih karyawan"}
            filterOption={(input, opt) =>
              (opt?.label ?? "").toLowerCase().includes(input.toLowerCase())
            }
            options={employeeOptions}
          />
        </Form.Item>

        {/* <Form.Item
          label="Kirimkan File ke Email"
          name="emails"
          tooltip="Pisah dengan koma (opsional, saat ini file langsung diunduh)"
          rules={[
            {
              validator: (_, v) => {
                if (!v) return Promise.resolve();
                const emails = String(v)
                  .split(",")
                  .map((s) => s.trim())
                  .filter(Boolean);
                const bad = emails.find(
                  (e) => !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(e)
                );
                return bad
                  ? Promise.reject(new Error(`Email tidak valid: ${bad}`))
                  : Promise.resolve();
              },
            },
          ]}
        >
          <Input
            prefix={<MailOutlined className="text-gray-400" />}
            placeholder="hr@perusahaan.com, admin@..."
          />
        </Form.Item> */}

        <Form.Item label="Format" name="format">
          <Select
            options={[
              { value: "lengkap", label: "Lengkap" },
              { value: "ringkas", label: "Ringkas" },
            ]}
          />
        </Form.Item>

        <div
          className="rounded-md px-4 py-3"
          style={{ background: "#E6F0FA", border: "1px solid #003A6F1A" }}
        >
          <div className="text-sm" style={{ color: "#003A6F" }}>
            Waktu proses bergantung pada jumlah data. Saat ini hasil langsung
            diunduh; field email disiapkan untuk pengiriman file via server di
            tahap berikutnya.
          </div>

        </div>
      </Form>
    </Modal>
  );
}
