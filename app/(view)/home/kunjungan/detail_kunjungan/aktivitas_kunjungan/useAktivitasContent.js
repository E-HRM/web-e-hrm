"use client";

import { useMemo, useState, useRef, useCallback } from "react";
import dayjs from "dayjs";

/**
 * Hook dummy untuk aktivitas kunjungan per karyawan.
 * Nanti tinggal ganti `events` dengan data API-mu.
 */
export default function useAktivitasContent({ userId, userName }) {
  const calendarRef = useRef(null);

  // Buat minggu berjalan (Senin–Minggu)
  const monday = useMemo(() => {
    const d = dayjs();
    const isoDow = d.isoWeekday ? d.isoWeekday() : (d.day() === 0 ? 7 : d.day());
    return d.subtract(isoDow - 1, "day").startOf("day");
  }, []);

  const events = useMemo(() => {
    const base = monday; // Senin minggu ini
    return [
      {
        id: "mtg-1",
        title: "Meet dengan Client",
        start: base.hour(9).minute(0).second(0).toISOString(),      // Senin 09.00
        end: base.hour(10).minute(0).second(0).toISOString(),        // Senin 10.00
        extendedProps: {
          status: "Selesai",
          location: "Ruang Rapat A",
          attendees: [
            { name: "Ayu", avatar: "/avatar.png" },
            { name: "Budi", avatar: "/avatar.png" },
            { name: "Wira", avatar: "/avatar.png" },
          ],
          notes: "Follow-up kontrak & jadwal implementasi.",
        },
      },
      {
        id: "work-1",
        title: "Penyusunan Proposal",
        start: base.hour(15).minute(0).second(0).toISOString(),      // Senin 15.00
        end: base.hour(16).minute(0).second(0).toISOString(),        // Senin 16.00
        extendedProps: {
          status: "Sedang Jalan",
          location: "Kantor OSS",
          attendees: [
            { name: "Rani", avatar: "/avatar.png" },
            { name: "Dewa", avatar: "/avatar.png" },
          ],
          notes: "Revisi ringkasan eksekutif & estimasi biaya.",
        },
      },
      {
        id: "break-1",
        title: "Sedang Jeda",
        start: base.hour(12).minute(0).second(0).toISOString(),      // Senin 12.00
        end: base.hour(12).minute(30).second(0).toISOString(),       // Senin 12.30
        extendedProps: {
          status: "Istirahat",
          location: "Pantry",
          attendees: [],
          notes: "Waktu istirahat siang.",
        },
      },
    ];
  }, [monday]);

  const [selected, setSelected] = useState(null); // event yang dipilih
  const onEventClick = useCallback((info) => {
    const e = info.event;
    setSelected({
      id: e.id,
      title: e.title,
      start: e.start,
      end: e.end,
      ...e.extendedProps,
    });
  }, []);

  const closeDetail = useCallback(() => setSelected(null), []);
  const goToday = useCallback(() => {
    calendarRef.current?.getApi().today();
  }, []);

  return {
    calendarRef,
    userId,
    userName,
    events,
    selected,
    onEventClick,
    closeDetail,
    goToday,
  };
}
