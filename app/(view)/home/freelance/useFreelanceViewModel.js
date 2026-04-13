"use client";

import { useMemo, useState, useCallback } from "react";
import useSWR from "swr";
import dayjs from "dayjs";
import { ApiEndpoints } from "@/constrainst/endpoints";
import { fetcher } from "@/app/utils/fetcher";
import { crudService } from "@/app/utils/services/crudService";

const EMPTY = Object.freeze([]);
const FORM_PATH_PREFIX = "/freelance/form";

function getBrowserOrigin() {
  if (typeof window === "undefined") return "";
  return window.location?.origin || "";
}

async function fallbackCopyText(text) {
  if (typeof document === "undefined") {
    throw new Error("Clipboard tidak tersedia");
  }

  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.setAttribute("readonly", "readonly");
  textarea.style.position = "absolute";
  textarea.style.left = "-9999px";
  document.body.appendChild(textarea);
  textarea.select();
  document.execCommand("copy");
  document.body.removeChild(textarea);
}

export default function useFreelanceViewModel() {
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const listUrl = useMemo(
    () =>
      ApiEndpoints.GetFreelance({
        page,
        pageSize,
        search: q.trim() || undefined,
        orderBy: "created_at",
        sort: "desc",
      }),
    [page, pageSize, q]
  );

  const { data: res, isLoading, mutate } = useSWR(listUrl, fetcher, {
    revalidateOnFocus: false,
    keepPreviousData: true,
  });

  const supervisorUrl = useMemo(
    () => `${ApiEndpoints.GetUsers}?page=1&pageSize=200&orderBy=nama_pengguna&sort=asc`,
    []
  );

  const { data: usersRes, isLoading: usersLoading } = useSWR(supervisorUrl, fetcher, {
    revalidateOnFocus: false,
  });

  const rows = useMemo(() => (Array.isArray(res?.data) ? res.data : EMPTY), [res]);
  const pagination = useMemo(() => {
    const meta = res?.pagination || {};
    return {
      current: meta.page || page,
      pageSize: meta.pageSize || pageSize,
      total: meta.total || 0,
    };
  }, [page, pageSize, res]);

  const supervisorOptions = useMemo(() => {
    const users = Array.isArray(usersRes?.data) ? usersRes.data : EMPTY;
    return users
      .filter((item) => !item?.deleted_at)
      .map((item) => ({
        value: item.id_user,
        label: item.nama_pengguna || item.email || item.id_user,
      }));
  }, [usersRes]);

  const refresh = useCallback(async () => {
    await mutate();
  }, [mutate]);

  const create = useCallback(
    async (payload) => {
      const result = await crudService.postAuth(ApiEndpoints.CreateFreelance, payload);
      await mutate();
      return result;
    },
    [mutate]
  );

  const update = useCallback(
    async (id, payload) => {
      const result = await crudService.put(ApiEndpoints.UpdateFreelance(id), payload);
      await mutate();
      return result;
    },
    [mutate]
  );

  const remove = useCallback(
    async (id) => {
      const result = await crudService.delete(ApiEndpoints.DeleteFreelance(id));
      const total = Number(res?.pagination?.total || 0);
      const isLastItemOnPage = rows.length <= 1 && page > 1 && total > 0;
      if (isLastItemOnPage) {
        setPage((prev) => Math.max(prev - 1, 1));
      } else {
        await mutate();
      }
      return result;
    },
    [mutate, page, res, rows.length]
  );

  const onTableChange = useCallback((nextPagination) => {
    setPage(nextPagination?.current || 1);
    setPageSize(nextPagination?.pageSize || 10);
  }, []);

  const formatDateTime = useCallback((value) => {
    if (!value) return "—";
    const parsed = dayjs(value);
    return parsed.isValid() ? parsed.format("DD MMM YYYY HH:mm") : "—";
  }, []);

  const getFreelanceFormPath = useCallback((id) => `${FORM_PATH_PREFIX}/${id}`, []);

  const getFreelanceFormUrl = useCallback(
    (id) => {
      const path = getFreelanceFormPath(id);
      const origin = getBrowserOrigin();
      return origin ? `${origin}${path}` : path;
    },
    [getFreelanceFormPath]
  );

  const openFreelanceForm = useCallback(
    (id) => {
      const url = getFreelanceFormUrl(id);
      if (typeof window !== "undefined") {
        window.open(url, "_blank", "noopener,noreferrer");
      }
      return url;
    },
    [getFreelanceFormUrl]
  );

  const copyFreelanceFormLink = useCallback(
    async (id) => {
      const url = getFreelanceFormUrl(id);

      if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(url);
        return url;
      }

      await fallbackCopyText(url);
      return url;
    },
    [getFreelanceFormUrl]
  );

  return {
    loading: isLoading,
    supervisorLoading: usersLoading,
    rows,
    q,
    setQ,
    page,
    setPage,
    pageSize,
    setPageSize,
    pagination,
    supervisorOptions,
    refresh,
    create,
    update,
    remove,
    onTableChange,
    formatDateTime,
    getFreelanceFormPath,
    getFreelanceFormUrl,
    openFreelanceForm,
    copyFreelanceFormLink,
  };
}
