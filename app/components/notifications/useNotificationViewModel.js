// app/components/notifications/useNotificationViewModel.js
"use client";

import { useMemo, useState, useCallback } from "react";
import useSWR from "swr";
import Cookies from "js-cookie";
import { message } from "antd";
// import { fetcher } from "@/app/utils/fetcher"; // sudah tidak dipakai
import { ApiEndpoints } from "@/constrainst/endpoints";

export default function useNotificationViewModel() {
  // ambil 7 hari terakhir untuk 4 jenis pengajuan
  const swrKey = ApiEndpoints.GetNotificationsRecent({
    days: 7,
    types: [
      "pengajuan_cuti",
      "izin_tukar_hari",
      "pengajuan_izin_sakit",
      "pengajuan_izin_jam",
    ].join(","),
  });

  // === SWR dengan Authorization header ===
  const {
    data: apiResponse,
    error: apiError,
    isLoading,
    mutate,
  } = useSWR(
    swrKey,
    async (url) => {
      const token = Cookies.get("token");
      const res = await fetch(url, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      let data = null;
      try {
        data = await res.json();
      } catch (_) {}

      if (!res.ok) {
        const err = new Error(data?.message || `Error ${res.status}`);
        err.status = res.status;
        throw err;
      }
      return data;
    },
    {
      refreshInterval: 30000, // polling tiap 30 detik
    }
  );

  const items = useMemo(
    () => (Array.isArray(apiResponse?.data) ? apiResponse.data : []),
    [apiResponse]
  );

  const [activeTabKey, setActiveTabKey] = useState("all");

  const unreadCount = useMemo(
    () => items.filter((it) => it.status === "unread").length,
    [items]
  );

  const filteredItems = useMemo(() => {
    if (activeTabKey === "unread") {
      return items.filter((it) => it.status === "unread");
    }
    return items;
  }, [items, activeTabKey]);

  // ==== mark all read ====
  const markAllRead = useCallback(async () => {
    try {
      const token = Cookies.get("token");
      const res = await fetch(ApiEndpoints.MarkAllNotificationsRead, {
        method: "PUT",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.message || `Error ${res.status}`);
      }

      const nowIso = new Date().toISOString();
      mutate(
        (current) => {
          if (!current || !Array.isArray(current.data)) return current;
          const updated = current.data.map((it) => ({
            ...it,
            status: "read",
            read_at: it.read_at || nowIso,
            seen_at: it.seen_at || nowIso,
          }));
          return { ...current, data: updated };
        },
        false
      );
      mutate();
    } catch (err) {
      console.error("Failed to mark all notifications as read", err);
      message.error("Gagal menandai semua notifikasi");
    }
  }, [mutate]);

  // ==== mark one read ====
  const markOneRead = useCallback(
    async (id) => {
      if (!id) return;
      try {
        const token = Cookies.get("token");
        const res = await fetch(ApiEndpoints.MarkNotificationRead(id), {
          method: "PUT",
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data?.message || `Error ${res.status}`);
        }
        const nowIso = new Date().toISOString();
        mutate(
          (current) => {
            if (!current || !Array.isArray(current.data)) return current;
            const updated = current.data.map((it) => {
              const key = it.id_notification || it.id;
              if (key === id) {
                return {
                  ...it,
                  status: "read",
                  read_at: nowIso,
                  seen_at: nowIso,
                };
              }
              return it;
            });
            return { ...current, data: updated };
          },
          false
        );
        mutate();
      } catch (err) {
        console.error("Failed to mark notification as read", err);
        message.error("Gagal menandai notifikasi");
      }
    },
    [mutate]
  );

  const formatRelativeTime = useCallback((time) => {
    const d = time instanceof Date ? time : new Date(time);
    const diff = Math.floor((Date.now() - d.getTime()) / 1000);
    if (diff < 60) return `${diff}s lalu`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m lalu`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}j lalu`;
    return `${Math.floor(diff / 86400)}h lalu`;
  }, []);

  return {
    items,
    unreadCount,
    filteredItems,
    isLoading,
    apiError,
    activeTabKey,
    setActiveTabKey,
    markAllRead,
    markOneRead,
    formatRelativeTime,
  };
}
