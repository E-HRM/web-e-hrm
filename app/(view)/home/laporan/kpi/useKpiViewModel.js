"use client";

import { useMemo, useState } from "react";
import useSWR from "swr";
import { ApiEndpoints } from "@/constrainst/endpoints";
import { fetcher } from "@/app/utils/fetcher";

const EMPTY = Object.freeze([]);

function normalizeRows(payload) {
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.items)) return payload.items;
  return EMPTY;
}

function normalizeUser(row) {
  const id = String(row?.id_user ?? row?.id ?? "").trim();
  if (!id) return null;

  return {
    id,
    nama: row?.nama_pengguna ?? row?.nama ?? row?.email ?? id,
    jabatanNama:
      row?.jabatan?.nama_jabatan ??
      row?.jabatan?.nama ??
      row?.jabatan ??
      "-",
    locationNama:
      row?.kantor?.nama_kantor ??
      row?.location?.nama_kantor ??
      row?.location?.name ??
      "-",
  };
}

async function fetchUsers() {
  const params = new URLSearchParams({
    page: "1",
    pageSize: "500",
    includeDeleted: "0",
    orderBy: "nama_pengguna",
    sort: "asc",
  });
  const json = await fetcher(`${ApiEndpoints.GetUsers}?${params.toString()}`);
  return normalizeRows(json);
}

export default function useKpiViewModel() {
  const [notice] = useState("");
  const [form] = useState(() => ({
    tahun: String(new Date().getFullYear()),
    status: "draft",
  }));

  const usersSwr = useSWR("kpi-form:users", fetchUsers, {
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
  });

  const users = useMemo(
    () => normalizeRows({ data: usersSwr.data }).map(normalizeUser).filter(Boolean),
    [usersSwr.data]
  );

  const refresh = async () => {
    await usersSwr.mutate();
  };

  return {
    form,
    notice,
    users,
    refresh,
    loading: usersSwr.isLoading,
    error: usersSwr.error || null,
  };
}
