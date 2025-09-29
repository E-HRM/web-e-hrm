"use client";

import { useCallback, useMemo, useState, useEffect } from "react";
import useSWR, { mutate as globalMutate } from "swr";
import { Form, message } from "antd";
import { ApiEndpoints } from "../../../../../constrainst/endpoints";
import { fetcher } from "../../../../utils/fetcher";

/** Helper POST/PUT/DELETE JSON */
async function jsonFetch(url, init) {
  const res = await fetch(url, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init && init.headers),
    },
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

  // ---- List SWR
  const listKey = useMemo(() => {
    const sp = new URLSearchParams();
    sp.set("page", String(page));
    sp.set("pageSize", String(pageSize));
    if (search.trim()) sp.set("search", search.trim());
    sp.set("includeDeleted", "0");
    return `${ApiEndpoints.GetJabatan}?${sp.toString()}`;
  }, [page, pageSize, search]);

  const { data: listRes, isLoading: loading } = useSWR(listKey, fetcher, {
    keepPreviousData: true,
  });
  const data = listRes?.data || [];
  const total = listRes?.pagination?.total || 0;

  // ---- Parent options SWR (opsi induk)
  const parentKey = `${ApiEndpoints.GetJabatan}?page=1&pageSize=1000&includeDeleted=0`;
  const { data: parentRes, isLoading: loadingAll } = useSWR(parentKey, fetcher);

  // Stabilkan array 'allForParent' & 'parentOptions' (tanpa logical expr di deps)
  const allForParent = useMemo(() => {
    return Array.isArray(parentRes?.data) ? parentRes.data : [];
  }, [parentRes]);

  const parentOptions = useMemo(() => {
    return allForParent.map((j) => ({
      value: j.id_jabatan,
      label: j.nama_jabatan,
    }));
  }, [allForParent]);

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
        id_induk_jabatan: d.id_induk_jabatan || undefined,
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

        const payload = {
          nama_jabatan: values.nama_jabatan,
          id_induk_jabatan: values.id_induk_jabatan || null,
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
      } catch (e) {
        message.error(e.message);
      } finally {
        setSaving(false);
      }
    },
    [closeModal, listKey, modal.id, modal.mode, parentKey]
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
        message.error(e.message);
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
    loadingAll,
    remove,
  };
}
