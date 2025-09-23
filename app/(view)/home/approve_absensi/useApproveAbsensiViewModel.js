"use client";

import useSWR from "swr";
import dayjs from "dayjs";
import { useCallback, useMemo, useState } from "react";
import { App as AntdApp } from "antd";
import { fetcher } from "../../../utils/fetcher";
import { crudService } from "../../../utils/services/crudService";
import { ApiEndpoints } from "../../../../constrainst/endpoints";

// === util: jam HH:mm ===
const onlyHHmm = (v) => {
  if (!v) return "-";
  if (typeof v === "string") {
    const m = v.match(/^(\d{2}):(\d{2})/);
    if (m) return `${m[1]}:${m[2]}`;
    const d = dayjs(v);
    return d.isValid() ? d.format("HH:mm") : v;
  }
  const d = dayjs(v);
  return d.isValid() ? d.format("HH:mm") : "-";
};

// === util: flatten recipient + absensi ===
function flattenRecipient(rec) {
  const a = rec?.absensi ?? {};
  const user = a.user ?? rec.user ?? null;
  const depart = user?.departement ?? null;

  const tanggal = a.tanggal || a.tgl || a.created_at || rec.created_at || null;
  const jam_masuk = a.jam_masuk ?? a.jamIn ?? a.checkin_time ?? null;
  const jam_pulang = a.jam_pulang ?? a.jamOut ?? a.checkout_time ?? null;

  return {
    id_recipient:
      rec.id_absensi_report_recipient ?? rec.id ?? a.id_absensi ?? null,
    status_recipient: rec.status || "-", // 'terkirim' | 'disetujui' | 'ditolak'
    catatan: rec.catatan ?? null,

    user: user ? { ...user, departement: depart || null } : null,

    tanggal,
    jam_masuk,
    jam_pulang,

    jamMasukView: onlyHHmm(jam_masuk),
    jamPulangView: onlyHHmm(jam_pulang),
  };
}

const EMPTY = Object.freeze([]);

export default function useApproveAbsensiViewModel() {
  const { notification } = AntdApp.useApp();

  // filters & pagination
  const [status, setStatus] = useState("terkirim"); // 'terkirim' | 'disetujui' | 'ditolak'
  const [q, setQ] = useState("");
  const [date, setDate] = useState(null); // dayjs | null

  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);

  // SWR key
  const listKey = useMemo(() => {
    return ApiEndpoints.GetAbsensiApprovals({ page, perPage, status });
  }, [page, perPage, status]);

  const { data: resp, isLoading, mutate } = useSWR(listKey, fetcher, {
    keepPreviousData: true,
  });

  // meta distabilkan dalam useMemo untuk menghindari re-render tak perlu
  const meta = useMemo(
    () => resp?.meta ?? { page, perPage, total: 0 },
    [resp?.meta, page, perPage]
  );

  // rows: inisialisasi serverItems DIPINDAH KE DALAM callback useMemo (fix lint)
  const rows = useMemo(() => {
    const serverItems = Array.isArray(resp?.data) ? resp.data : EMPTY;
    const flat = serverItems.map(flattenRecipient);

    const filtered = flat
      .filter((r) =>
        date ? (r.tanggal ? dayjs(r.tanggal).isSame(date, "day") : false) : true
      )
      .filter((r) => {
        const term = q.trim().toLowerCase();
        if (!term) return true;
        const hay = [
          r.user?.nama_pengguna,
          r.user?.email,
          r.user?.departement?.nama_departement,
        ]
          .map((s) => String(s || "").toLowerCase())
          .join(" ");
        return hay.includes(term);
      });

    return filtered;
  }, [resp?.data, q, date]);

  // simple counts untuk tab aktif (gunakan total server bila ada)
  const totalForTab = resp?.meta?.total;
  const counts = useMemo(
    () => ({
      [status]:
        typeof totalForTab === "number" ? totalForTab : rows.length,
    }),
    [status, totalForTab, rows.length]
  );

  const onTableChange = useCallback((pg) => {
    setPage(pg.current);
    setPerPage(pg.pageSize);
  }, []);

  const refresh = useCallback(() => mutate(), [mutate]);

  // actions
  const approve = useCallback(
    async (id, note) => {
      try {
        await crudService.put(ApiEndpoints.UpdateAbsensiApproval(id), {
          status: "disetujui",
          catatan: note ?? null,
        });
        notification.success({
          message: "Disetujui",
          description: "Persetujuan absensi telah disetujui.",
        });
        await mutate();
      } catch (e) {
        notification.error({
          message: "Gagal menyetujui",
          description: e?.message || "Tidak dapat menyetujui data.",
        });
        throw e;
      }
    },
    [mutate, notification]
  );

  const reject = useCallback(
    async (id, note) => {
      try {
        await crudService.put(ApiEndpoints.UpdateAbsensiApproval(id), {
          status: "ditolak",
          catatan: note ?? null,
        });
        notification.success({
          message: "Ditolak",
          description: "Persetujuan absensi telah ditolak.",
        });
        await mutate();
      } catch (e) {
        notification.error({
          message: "Gagal menolak",
          description: e?.message || "Tidak dapat menolak data.",
        });
        throw e;
      }
    },
    [mutate, notification]
  );

  const markRead = useCallback(
    async (id) => {
      try {
        await crudService.put(ApiEndpoints.UpdateAbsensiApproval(id), {
          mark_read: true,
        });
        await mutate();
      } catch {
        // silent
      }
    },
    [mutate]
  );

  return {
    // data
    rows,
    loading: isLoading,
    meta,

    // filters
    status,
    setStatus,
    q,
    setQ,
    date,
    setDate,

    // table
    onTableChange,

    // actions
    approve,
    reject,
    markRead,
    refresh,

    // counts
    counts,
  };
}
