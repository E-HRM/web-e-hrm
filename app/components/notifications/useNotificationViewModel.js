// app/components/notifications/useNotificationViewModel.js
"use client";

import { useMemo, useState, useCallback } from "react";
import useSWR from "swr";
import Cookies from "js-cookie";
import { message } from "antd";
import { ApiEndpoints } from "@/constrainst/endpoints";

export default function useNotificationViewModel() {
  // ambil 7 hari terakhir untuk 4 jenis pengajuan
const swrKey = ApiEndpoints.GetAdminNotificationsRecent({
  days: 7,
  types: [
    "pengajuan_cuti",
    "izin_tukar_hari",
    "pengajuan_izin_sakit",
    "pengajuan_izin_jam",
  ].join(","),
});


  const { data: apiResponse, error: apiError, isLoading, mutate } = useSWR(
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
      refreshInterval: 30000,
    }
  );

  const items = useMemo(
    () => (Array.isArray(apiResponse?.data) ? apiResponse.data : []),
    [apiResponse]
  );

  const [activeTabKey, setActiveTabKey] = useState("unread");

  const unreadCount = useMemo(
    () => items.filter((it) => it.status === "unread").length,
    [items]
  );

  const filteredItems = useMemo(() => {
    if (!Array.isArray(items)) return [];

    // Tab "Belum Dibaca" -> hanya unread
    if (activeTabKey === "unread") {
      return items.filter((it) => it.status === "unread");
    }

    // Tab "Semua" -> unread dulu, lalu read
    const sorted = [...items].sort((a, b) => {
      const aUnread = a.status === "unread";
      const bUnread = b.status === "unread";
      if (aUnread !== bUnread) {
        return aUnread ? -1 : 1; // unread dulu
      }

      // urutkan berdasarkan created_at desc (paling baru di atas)
      const at = a.created_at ? new Date(a.created_at).getTime() : 0;
      const bt = b.created_at ? new Date(b.created_at).getTime() : 0;
      return bt - at;
    });

    return sorted;
  }, [items, activeTabKey]);


  const markAllRead = useCallback(async () => {
    try {
      const token = Cookies.get("token");
      const res = await fetch(ApiEndpoints.MarkAllAdminNotificationsRead, {
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

  const markOneRead = useCallback(
    async (id) => {
      if (!id) return;
      try {
        const token = Cookies.get("token");
        const res = await fetch(
          ApiEndpoints.MarkAdminNotificationRead(id),
          {
            method: "PUT",
            headers: token ? { Authorization: `Bearer ${token}` } : {},
          }
        );
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
