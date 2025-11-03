"use client";

import { useMemo, useState, useCallback } from "react";
import useSWR from "swr";
import dayjs from "dayjs";
import { Modal, Tabs, Form, DatePicker, Select, message } from "antd";
import { fetcher } from "../../utils/fetcher";
import { ApiEndpoints } from "@/constrainst/endpoints";

/* ========= Helpers ========= */
const safeName = (name) =>
  (name || "semua-karyawan").trim().replace(/[\/\\?%*:|"<>]/g, "-");

const fmtDateForFilename = (d) =>
  dayjs(d).format("YYYY/MM/DD").replaceAll("/", "／"); // full-width slash agar aman di filename

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

/** —— Normalisasi 1 record absensi jadi shape seragam (sinkron dengan VM) —— */
function normalizePhotoUrl(url) {
  if (!url) return null;
  if (/^https?:\/\//i.test(url)) return url.replace(/^http:\/\//i, "https://");
  if (typeof window !== "undefined" && url.startsWith("/")) {
    return `${window.location.origin}${url}`;
  }
  return "/" + String(url).replace(/^\.?\//, "");
}
function minStartMaxEnd(istirahatArr) {
  if (!Array.isArray(istirahatArr) || istirahatArr.length === 0) return { start: null, end: null };
  let min = null, max = null;
  for (const it of istirahatArr) {
    const s = it.start_istirahat ?? it.start ?? it.mulai ?? null;
    const e = it.end_istirahat ?? it.end ?? it.selesai ?? null;
    if (s) {
      const ds = dayjs(s);
      if (ds.isValid() && (!min || ds.isBefore(min))) min = ds;
    }
    if (e) {
      const de = dayjs(e);
      if (de.isValid() && (!max || de.isAfter(max))) max = de;
    }
  }
  return { start: min?.toISOString() ?? null, end: max?.toISOString() ?? null };
}
function pickCoord(obj) {
  if (!obj) return null;
  const lat = Number(obj.latitude ?? obj.lat ?? obj.geo_lat ?? obj.lat_start ?? obj.lat_end);
  const lon = Number(obj.longitude ?? obj.lon ?? obj.geo_lon ?? obj.lon_start ?? obj.lon_end);
  if (Number.isFinite(lat) && Number.isFinite(lon)) {
    return { lat, lon, name: obj.nama_kantor || obj.name || null };
  }
  return null;
}
function flatten(rec) {
  const a = rec?.absensi ?? rec ?? {};
  const user = a.user ?? rec?.user ?? null;

  const tanggal = a.tanggal || a.tgl || a.created_at || rec?.created_at || null;

  const jam_masuk = a.jam_masuk ?? a.jamIn ?? a.checkin_time ?? a.masuk_at ?? null;
  const jam_pulang = a.jam_pulang ?? a.jamOut ?? a.checkout_time ?? a.pulang_at ?? null;

  const istirahat_list = Array.isArray(a.istirahat) ? a.istirahat : [];
  const istirahat_mulai_raw =
    a.jam_istirahat_mulai ?? a.mulai_istirahat ?? a.break_start ?? a.istirahat_in ?? null;
  const istirahat_selesai_raw =
    a.jam_istirahat_selesai ?? a.selesai_istirahat ?? a.break_end ?? a.istirahat_out ?? null;
  const { start: istirahat_mulai_list, end: istirahat_selesai_list } = minStartMaxEnd(istirahat_list);
  const istirahat_mulai = istirahat_mulai_raw || istirahat_mulai_list || null;
  const istirahat_selesai = istirahat_selesai_raw || istirahat_selesai_list || null;

  const status_masuk = a.status_masuk ?? a.status_in ?? a.status_masuk_label ?? a.status ?? null;
  const status_pulang = a.status_pulang ?? a.status_out ?? a.status_pulang_label ?? null;

  const lokasiIn  = a.lokasiIn  ?? a.lokasi_in  ?? a.lokasi_absen_masuk  ?? null;
  const lokasiOut = a.lokasiOut ?? a.lokasi_out ?? a.lokasi_absen_pulang ?? null;

  const photo_in  = normalizePhotoUrl(a.foto_masuk  ?? a.photo_in  ?? a.bukti_foto_masuk  ?? a.attachment_in  ?? null);
  const photo_out = normalizePhotoUrl(a.foto_pulang ?? a.photo_out ?? a.bukti_foto_pulang ?? a.attachment_out ?? null);

  const departemenRaw = user?.departement ?? user?.departemen ?? user?.department ?? null;
  const jabatanRaw =
    user?.jabatan ?? user?.posisi ?? user?.position ?? user?.role_jabatan ?? user?.nama_jabatan ?? null;

  const departement =
    typeof departemenRaw === "string" ? { nama_departement: departemenRaw } : (departemenRaw || null);
  const jabatan =
    typeof jabatanRaw === "string" ? { nama_jabatan: jabatanRaw } : (jabatanRaw || null);

  const fotoUser = normalizePhotoUrl(
    user?.foto_profil_user ?? user?.foto ?? user?.avatarUrl ?? user?.avatar ?? user?.photoUrl ?? user?.photo ?? null
  );

  return {
    id_absensi: a.id_absensi ?? rec?.id_absensi ?? rec?.id ?? null,
    user: user
      ? {
          id_user: user.id_user ?? user.id ?? user.uuid,
          nama_pengguna: user.nama_pengguna ?? user.name ?? user.email,
          email: user.email,
          role: user.role,
          foto_profil_user: fotoUser,
          departement,
          jabatan,
        }
      : null,
    tanggal,
    jam_masuk,
    jam_pulang,
    istirahat_mulai,
    istirahat_selesai,
    istirahat_list,
    status_masuk,
    status_pulang,
    lokasiIn: pickCoord(lokasiIn),
    lokasiOut: pickCoord(lokasiOut),
    photo_in,
    photo_out,
  };
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

  // Hanya fetch ketika modal dibuka
  const shouldFetch = !!open;

  /** ================== AMBIL SEMUA USER (paginate 1..N) ================== */
  const fetchAllUsers = useCallback(async () => {
    const perPage = 100; // kecil & aman: banyak server ngebatesin (10/100)
    let page = 1;
    let all = [];

    while (true) {
      // Robust terhadap ApiEndpoints.GetUsers berbentuk string atau function
      const url =
        typeof ApiEndpoints.GetUsers === "function"
          ? ApiEndpoints.GetUsers({ page, perPage, orderBy: "nama_pengguna", sort: "asc" })
          : `${ApiEndpoints.GetUsers}?page=${page}&perPage=${perPage}&orderBy=nama_pengguna&sort=asc`;

      const json = await fetcher(url);

      const items = Array.isArray(json?.data)
        ? json.data
        : Array.isArray(json?.items)
        ? json.items
        : [];

      all.push(...items);

      const totalPages =
        json?.pagination?.totalPages ?? json?.meta?.totalPages ?? null;

      if (totalPages) {
        if (page >= totalPages) break;
        page += 1;
      } else {
        // fallback: kalau server tak kirim totalPages, hentikan saat batch < perPage
        if (items.length < perPage) break;
        page += 1;
      }
    }

    return all;
  }, []);

  const { data: usersAll, isLoading: usersLoading } = useSWR(
    shouldFetch ? "export:users:allpages" : null,
    fetchAllUsers,
    { revalidateOnFocus: false }
  );

  const apiEmployeeOptions = useMemo(
    () =>
      (Array.isArray(usersAll) ? usersAll : []).map((u) => ({
        value: String(u.id_user ?? u.id ?? u.uuid),
        label: u.nama_pengguna || u.name || u.email || String(u.id_user ?? u.id ?? u.uuid),
      })),
    [usersAll]
  );

  /** ================== LOKASI (boleh single page dulu) ================== */
  const { data: locRes, isLoading: locsLoading } = useSWR(
    shouldFetch
      ? (typeof ApiEndpoints.GetLocation === "function"
          ? ApiEndpoints.GetLocation({ perPage: 1000 })
          : `${ApiEndpoints.GetLocation}?perPage=1000`)
      : null,
    fetcher
  );

  const apiLokasiOptions = useMemo(
    () =>
      (locRes?.data || locRes?.items || []).map((l) => ({
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
      if (uid && name && !empMap.has(uid)) empMap.set(uid, { value: String(uid), label: name });

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

  /* ====== Pilih sumber opsi secara berurutan: props → API(all pages) → fallback rows ====== */
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

  // Map id -> label untuk nama di filename
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

  /* ====== Submit: ambil SEMUA halaman dalam rentang (pagination), filter, generate Excel ====== */
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

      // Tarik SEMUA halaman dari API records agar lintas bulan tidak kepotong
      const pageSize = 5000; // sesuai cap server route /records
      let page = 1;
      let pool = [];
      try {
        while (true) {
          const url =
            typeof ApiEndpoints.GetAbsensiRecords === "function"
              ? ApiEndpoints.GetAbsensiRecords({
                  from: start.format("YYYY-MM-DD"),
                  to: end.format("YYYY-MM-DD"),
                  perPage: pageSize,
                  page,
                })
              : `${ApiEndpoints.GetAbsensiRecords}?from=${start.format(
                  "YYYY-MM-DD"
                )}&to=${end.format("YYYY-MM-DD")}&perPage=${pageSize}&page=${page}`;

          const api = await fetcher(url);
          const batch = Array.isArray(api?.data)
            ? api.data
            : Array.isArray(api?.items)
            ? api.items
            : [];
          pool.push(...batch);

          const totalPages =
            api?.pagination?.totalPages ?? api?.meta?.totalPages ?? null;
          if (totalPages) {
            if (page >= totalPages) break;
            page += 1;
          } else {
            if (batch.length < pageSize) break;
            page += 1;
          }
        }
      } catch (_) {
        // fallback ke rowsAll bila fetch gagal
        pool = rowsAll || [];
      }
      if (!pool?.length && rowsAll?.length) pool = rowsAll;

      // Normalisasi & filter sesuai pilihan user
      const normalized = pool.map(flatten);
      const filtered = normalized.filter((r) => {
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

      // Susun data untuk Excel
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

      // Nama file ramah
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
        if (uniq.size === 1) employeeName = Array.from(uniq)[0];
      }

      const sameDay = start.isSame(end, "day");
      const datePart = sameDay
        ? fmtDateForFilename(start)
        : `${fmtDateForFilename(start)} - ${fmtDateForFilename(end)}`;

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
  }, [form, tab, rowsAll, onClose, employeeOptions]);

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
            optionFilterProp="label"
            filterOption={(input, opt) =>
              (opt?.label ?? "").toLowerCase().includes(input.toLowerCase())
            }
            virtual
            listHeight={360}
            dropdownMatchSelectWidth
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
            optionFilterProp="label"
            filterOption={(input, opt) =>
              (opt?.label ?? "").toLowerCase().includes(input.toLowerCase())
            }
            options={employeeOptions}
            virtual
            listHeight={360}
            dropdownMatchSelectWidth
          />
        </Form.Item>

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
            File dibuat dari data sesuai rentang tanggal yang dipilih (bukan hanya bulan yang sedang ditampilkan).
          </div>
        </div>
      </Form>
    </Modal>
  );
}
