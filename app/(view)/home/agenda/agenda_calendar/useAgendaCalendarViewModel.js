"use client";

import { useCallback, useMemo, useState } from "react";
import useSWR from "swr";
import dayjs from "dayjs";
import { fetcher } from "../../../../utils/fetcher";
import { crudService } from "../../../../utils/services/crudService";
import { ApiEndpoints } from "../../../../../constrainst/endpoints";

/**
 * Asumsi endpoint REST:
 *  GET    ApiEndpoints.GetAgendaKerja?start=YYYY-MM-DD&end=YYYY-MM-DD
 *  POST   ApiEndpoints.CreateAgendaKerja
 *  PUT    ApiEndpoints.UpdateAgendaKerja(id)
 *  DELETE ApiEndpoints.DeleteAgendaKerja(id)
 *
 * Kalau nama endpoint mu beda, cukup ganti di sini saja.
 */

const mapServerToFC = (row) => {
  const status = row.status || row.status_agenda || row.status_kerja || "diproses";
  const title = row.nama_agenda || row.deskripsi_kerja || row.title || "Agenda";
  const start = row.start_date || row.tanggal_mulai || row.start || row.mulai;
  const end = row.end_date || row.tanggal_selesai || row.end || row.selesai || start;

  // warna status
  let backgroundColor;
  if (status === "selesai") backgroundColor = "#22c55e";
  else if (status === "ditunda") backgroundColor = "#f59e0b";
  else backgroundColor = "#3b82f6";

  return {
    id: row.id_agenda_kerja || row.id || row._id,
    title,
    start,
    end,
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

  const events = useMemo(() => (data?.data || []).map(mapServerToFC), [data]);

  const setRange = useCallback((start, end) => {
    setRangeState({ start, end });
  }, []);

  // CREATE
  const createEvent = useCallback(
    async ({ title, start, end, status, deskripsi }) => {
      const payload = {
        // sesuaikan dengan API kamu:
        deskripsi_kerja: title,
        start_date: dayjs(start).toISOString(),
        end_date: dayjs(end || start).toISOString(),
        status: status || "diproses",
        // id_user bisa diisi user login; disederhanakan di sini
      };
      await crudService.post(ApiEndpoints.CreateAgendaKerja, payload);
      await mutate();
    },
    [mutate]
  );

  // UPDATE
  const updateEvent = useCallback(
    async (id, { title, start, end, status, deskripsi }) => {
      const payload = {
        deskripsi_kerja: title,
        start_date: dayjs(start).toISOString(),
        end_date: dayjs(end || start).toISOString(),
        status: status || "diproses",
      };
      await crudService.put(ApiEndpoints.UpdateAgendaKerja(id), payload);
      await mutate();
    },
    [mutate]
  );

  // DELETE
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
