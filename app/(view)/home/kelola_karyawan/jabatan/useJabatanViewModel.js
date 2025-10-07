"use client";

import { useCallback, useMemo, useState, useEffect } from "react";
import useSWR, { mutate as globalMutate } from "swr";
import { Form, message } from "antd";
import Cookies from "js-cookie";
import { ApiEndpoints } from "../../../../../constrainst/endpoints";
import { fetcher } from "../../../../utils/fetcher";

/** Helper POST/PUT/DELETE JSON + token */
async function jsonFetch(url, init) {
  const token = Cookies.get("token");
  const headers = {
    "Content-Type": "application/json",
    ...(init && init.headers),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };

  const res = await fetch(url, {
    ...init,
    credentials: "same-origin",
    headers,
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.message || `Error ${res.status}`);
  return data;
}

export default function useJabatanViewModel() {
  const [form] = Form.useForm();

  // table state
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [search, setSearch] = useState("");

  // modal state
  const [modal, setModal] = useState({ open: false, mode: "create", id: null });
  const [saving, setSaving] = useState(false);

  // ---- List SWR (pakai base path + QS)
  const listKey = useMemo(() => {
    const sp = new URLSearchParams();
    sp.set("page", String(page));
    sp.set("pageSize", String(pageSize));
    if (search.trim()) sp.set("search", search.trim());
    sp.set("includeDeleted", "0");
    // opsional order
    sp.set("orderBy", "created_at");
    sp.set("sort", "desc");
    return `${ApiEndpoints.GetJabatan}?${sp.toString()}`;
  }, [page, pageSize, search]);

  const { data: listRes, isLoading: loading } = useSWR(listKey, fetcher, {
    keepPreviousData: true,
  });
  const data = listRes?.data || [];
  const total = listRes?.pagination?.total || 0;

  // ---- Parent options SWR (opsi induk)
  const parentKey = `${ApiEndpoints.GetJabatan}?page=1&pageSize=1000&includeDeleted=0&orderBy=nama_jabatan&sort=asc`;
  const { data: parentRes } = useSWR(parentKey, fetcher);

  const parentOptions = useMemo(() => {
    const arr = Array.isArray(parentRes?.data) ? parentRes.data : [];
    return arr.map((j) => ({
      value: j.id_jabatan,
      label: j.nama_jabatan,
    }));
  }, [parentRes]);

  // ---- Detail by id (saat modal edit)
  const detailKey =
    modal.open && modal.mode === "edit" && modal.id
      ? ApiEndpoints.GetJabatanById(modal.id)
      : null;
  const { data: detailRes } = useSWR(detailKey, fetcher);

  // set form values ketika detail masuk
  useEffect(() => {
    if (detailRes?.data && modal.mode === "edit") {
      const d = detailRes.data;
      form.setFieldsValue({
        nama_jabatan: d.nama_jabatan || "",
        id_induk_jabatan: d.id_induk_jabatan ?? undefined, // null → undefined untuk tampil "Tanpa Induk"
      });
    }
  }, [detailRes, form, modal.mode]);

  const reload = useCallback(() => {
    setPage(1);
    globalMutate(listKey);
  }, [listKey]);

  const changePage = useCallback((p, ps) => {
    setPage(p);
    setPageSize(ps);
  }, []);

  const openCreate = useCallback(() => {
    setModal({ open: true, mode: "create", id: null });
    form.resetFields();
  }, [form]);

  const openEdit = useCallback(
    (id) => {
      setModal({ open: true, mode: "edit", id });
      form.resetFields(); // diisi setelah detailRes datang
    },
    [form]
  );

  const closeModal = useCallback(() => {
    setModal({ open: false, mode: "create", id: null });
  }, []);

  const submit = useCallback(
    async (values) => {
      setSaving(true);
      try {
        // validasi client: induk ≠ diri sendiri saat edit
        if (
          modal.mode === "edit" &&
          values.id_induk_jabatan &&
          values.id_induk_jabatan === modal.id
        ) {
          throw new Error(
            "Induk jabatan tidak boleh sama dengan jabatan itu sendiri."
          );
        }

        // Kirim "" untuk Tanpa Induk → backend normalisasikan ke NULL
        const payload = {
          nama_jabatan: values.nama_jabatan,
          id_induk_jabatan: values.id_induk_jabatan ?? "",
        };

        if (modal.mode === "create") {
          await jsonFetch(ApiEndpoints.CreateJabatan, {
            method: "POST",
            body: JSON.stringify(payload),
          });
          message.success("Jabatan dibuat.");
        } else {
          await jsonFetch(ApiEndpoints.UpdateJabatan(modal.id), {
            method: "PUT",
            body: JSON.stringify(payload),
          });
          message.success("Jabatan diperbarui.");
        }

        closeModal();
        await Promise.all([globalMutate(listKey), globalMutate(parentKey)]);
        // kalau halaman kosong setelah ubah filter/search, bawa balik ke 1
        const after = await fetcher(listKey);
        if ((after?.data?.length || 0) === 0 && page > 1) {
          setPage(1);
        }
      } catch (e) {
        message.error(e.message || "Gagal menyimpan jabatan.");
      } finally {
        setSaving(false);
      }
    },
    [closeModal, listKey, modal.id, modal.mode, page, parentKey]
  );

  const remove = useCallback(
    async (id) => {
      try {
        await jsonFetch(ApiEndpoints.DeleteJabatan(id), { method: "DELETE" });
        message.success("Jabatan dihapus.");
        await Promise.all([globalMutate(listKey), globalMutate(parentKey)]);
        // jika halaman kosong setelah hapus, geser balik
        const after = await fetcher(listKey);
        if ((after?.data?.length || 0) === 0 && page > 1) {
          setPage(page - 1);
        }
      } catch (e) {
        message.error(e.message || "Gagal menghapus jabatan.");
      }
    },
    [listKey, page, parentKey]
  );

  return {
    form,
    // table state
    data,
    total,
    page,
    pageSize,
    loading,
    search,
    setSearch,
    changePage,
    reload,

    // modal
    modal,
    openCreate,
    openEdit,
    closeModal,
    submit,
    saving,

    // parent options
    parentOptions,
    remove,
  };
}
