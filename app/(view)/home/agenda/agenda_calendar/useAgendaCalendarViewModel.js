"use client";

import { useCallback, useMemo, useState } from "react";
import useSWR from "swr";
import dayjs from "dayjs";
import { fetcher } from "../../../../utils/fetcher";
import { crudService } from "../../../../utils/services/crudService";
import { ApiEndpoints } from "../../../../../constrainst/endpoints";

/**
 * Normalisasi nilai tanggal dari server menjadi "YYYY-MM-DD HH:mm:ss"
 * TANPA zona waktu. Ini juga "mengupas" ISO dengan 'Z' atau offset.
 * Contoh:
 *  - "2025-10-04T13:25:00.000Z" -> "2025-10-04 13:25:00"
 *  - "2025-10-04 13:25"         -> "2025-10-04 13:25:00"
 */
const toLocalWallTime = (v) => {
  if (!v) return null;
  const s = String(v).trim();

  // Ambil bagian tanggal & waktu saja, abaikan ms/offset/Z
  const m1 = s.match(/^(\d{4}-\d{2}-\d{2})[ T](\d{2}:\d{2}:\d{2})/);
  if (m1) return `${m1[1]} ${m1[2]}`;

  const m2 = s.match(/^(\d{4}-\d{2}-\d{2})[ T](\d{2}:\d{2})$/);
  if (m2) return `${m2[1]} ${m2[2]}:00`;

  // Sudah "YYYY-MM-DD HH:mm:ss"?
  if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(s)) return s;

  // Fallback: parse lalu format lokal (tanpa offset)
  const d = dayjs(s);
  return d.isValid() ? d.format("YYYY-MM-DD HH:mm:ss") : s;
};

/**
 * Serialisasi tanggal untuk dikirim ke API sebagai "YYYY-MM-DD HH:mm:ss"
 * tanpa zona waktu.
 */
const serializeLocalWallTime = (d) =>
  d ? dayjs(d).format("YYYY-MM-DD HH:mm:ss") : null;

/* ===================== Mapping FC ===================== */

const mapServerToFC = (row) => {
  const status =
    row.status || row.status_agenda || row.status_kerja || "diproses";
  const title =
    row.nama_agenda || row.deskripsi_kerja || row.title || "Agenda";
  const startRaw =
    row.start_date || row.tanggal_mulai || row.start || row.mulai;
  const endRaw =
    row.end_date || row.tanggal_selesai || row.end || row.selesai || startRaw;

  const start = toLocalWallTime(startRaw);
  const end = toLocalWallTime(endRaw);

  // warna status
  let backgroundColor = "#3b82f6";
  if (status === "selesai") backgroundColor = "#22c55e";
  else if (status === "ditunda") backgroundColor = "#f59e0b";

  return {
    id: row.id_agenda_kerja || row.id || row._id,
    title,
    // Kunci: kirim string lokal TANPA TZ ke FullCalendar
    start, // "YYYY-MM-DD HH:mm:ss"
    end,   // "YYYY-MM-DD HH:mm:ss"
    backgroundColor,
    borderColor: backgroundColor,
    extendedProps: {
      status,
      deskripsi: row.deskripsi_kerja || row.deskripsi || "",
      raw: row,
    },
  };
};

export default function useAgendaCalendarViewModel() {
  const [range, setRangeState] = useState(() => ({
    start: dayjs().startOf("month").startOf("week").toDate(),
    end: dayjs().endOf("month").endOf("week").toDate(),
  }));

  const qs = useMemo(() => {
    const p = new URLSearchParams();
    p.set("start", dayjs(range.start).format("YYYY-MM-DD"));
    p.set("end", dayjs(range.end).format("YYYY-MM-DD"));
    return p.toString();
  }, [range]);

  const { data, mutate } = useSWR(
    `${ApiEndpoints.GetAgendaKerja}?${qs}`,
    fetcher,
    { revalidateOnFocus: false }
  );

  const events = useMemo(
    () => (data?.data || []).map(mapServerToFC),
    [data]
  );

  const setRange = useCallback((start, end) => {
    setRangeState({ start, end });
  }, []);

  // CREATE (kirim string lokal, bukan ISO)
  const createEvent = useCallback(
    async ({ title, start, end, status }) => {
      const payload = {
        deskripsi_kerja: title,
        start_date: serializeLocalWallTime(start),
        end_date: serializeLocalWallTime(end || start),
        status: status || "diproses",
      };
      await crudService.post(ApiEndpoints.CreateAgendaKerja, payload);
      await mutate();
    },
    [mutate]
  );

  // UPDATE (kirim string lokal, bukan ISO)
  const updateEvent = useCallback(
    async (id, { title, start, end, status }) => {
      const payload = {
        deskripsi_kerja: title,
        start_date: serializeLocalWallTime(start),
        end_date: serializeLocalWallTime(end || start),
        status: status || "diproses",
      };
      await crudService.put(ApiEndpoints.UpdateAgendaKerja(id), payload);
      await mutate();
    },
    [mutate]
  );

  const deleteEvent = useCallback(
    async (id) => {
      await crudService.delete(ApiEndpoints.DeleteAgendaKerja(id));
      await mutate();
    },
    [mutate]
  );

  return {
    events,
    setRange,
    createEvent,
    updateEvent,
    deleteEvent,
  };
}
