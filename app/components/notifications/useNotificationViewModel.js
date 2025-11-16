"use client";

import { useMemo, useState, useCallback } from "react";
// nanti kalau sudah ada API, bisa pakai useSWR di sini

// Sementara: data dummy
const initialDummyItems = [
  {
    id: "n1",
    title: "Persetujuan Cuti",
    desc: "Segera hadir, nantikan V2.",
    time: new Date(Date.now() - 2 * 60 * 1000),
    read: false,
    type: "absensi",
  },
  {
    id: "n2",
    title: "Persetujuan Tukar Hari",
    desc: "Segera hadir.",
    time: new Date(Date.now() - 45 * 60 * 1000),
    read: false,
    type: "shift",
  },
  {
    id: "n3",
    title: "Pengumuman",
    desc: "Maintenance sistem Jumat 21:00–22:00.",
    time: new Date(Date.now() - 6 * 60 * 60 * 1000),
    read: true,
    type: "info",
  },
];

export default function useNotificationViewModel() {
  const [items, setItems] = useState(initialDummyItems);
  const [activeTabKey, setActiveTabKey] = useState("all"); // "all" | "unread"

  const unreadCount = useMemo(
    () => items.filter((i) => !i.read).length,
    [items]
  );

  const filteredItems = useMemo(() => {
    if (activeTabKey === "unread") {
      return items.filter((i) => !i.read);
    }
    return items;
  }, [items, activeTabKey]);

  const markAllRead = useCallback(() => {
    setItems((arr) => arr.map((it) => ({ ...it, read: true })));
    // TODO: nanti panggil API PATCH /notifications/mark-all
  }, []);

  const markOneRead = useCallback((id) => {
    setItems((arr) =>
      arr.map((it) => (it.id === id ? { ...it, read: true } : it))
    );
    // TODO: nanti panggil API PATCH /notifications/:id
  }, []);

  // Helper kecil untuk format waktu relatif
  const formatRelativeTime = useCallback((time) => {
    const d = time instanceof Date ? time : new Date(time);
    const diff = Math.floor((Date.now() - d.getTime()) / 1000);

    if (diff < 60) return `${diff}s lalu`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m lalu`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}j lalu`;
    return `${Math.floor(diff / 86400)}h lalu`;
  }, []);

  return {
    // data
    items,
    unreadCount,
    filteredItems,

    // tab
    activeTabKey,
    setActiveTabKey,

    // actions
    markAllRead,
    markOneRead,

    // helpers
    formatRelativeTime,
  };
}
