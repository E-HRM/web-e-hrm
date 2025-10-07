"use client";

import useSWR from "swr";
import { useMemo, useState } from "react";
import { Form, message } from "antd";
import { ApiEndpoints } from "../../../../../../constrainst/endpoints";
import { fetcher } from "../../../../../utils/fetcher";

// immutable empty array to keep stable reference
const EMPTY = Object.freeze([]);

/** kirim JSON (POST/PUT/DELETE) */
async function jsonSend(url, method, body) {
  const res = await fetch(url, {
    method,
    headers: { "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.message || `Error ${res.status}`);
  return data;
}

/** build forest (non-mutating terhadap input) */
function toForest(inputRows) {
  // copy nodes agar sort & children tidak memutasi input
  const nodes = inputRows.map((r) => ({ ...r, children: [] }));
  const map = new Map(nodes.map((n) => [n.id_jabatan, n]));

  const roots = [];
  for (const n of nodes) {
    const pid = n.id_induk_jabatan ?? null;
    if (pid && map.has(pid)) map.get(pid).children.push(n);
    else roots.push(n);
  }

  const sortRec = (node) => {
    node.children.sort((a, b) =>
      (a.nama_jabatan || "").localeCompare(b.nama_jabatan || "")
    );
    node.children.forEach(sortRec);
  };
  roots.forEach(sortRec);

  return roots;
}

export default function useJabatanGraphViewModel() {
  const [form] = Form.useForm();
  const [modal, setModal] = useState({ open: false, parent: null });
  const [saving, setSaving] = useState(false);
  const [seeding, setSeeding] = useState(false);

  // SWR key: rakit URL manual (base path + QS)
  const key = useMemo(() => {
    const sp = new URLSearchParams();
    sp.set("page", "1");
    sp.set("pageSize", "1000");
    sp.set("includeDeleted", "0");
    sp.set("orderBy", "nama_jabatan");
    sp.set("sort", "asc");
    return `${ApiEndpoints.GetJabatan}?${sp.toString()}`;
  }, []);

  const { data, isLoading: loading, mutate } = useSWR(key, fetcher, {
    revalidateOnFocus: false,
  });

  // rows stabil (hindari array baru tiap render)
  const rows = useMemo(
    () => (Array.isArray(data?.data) ? data.data : EMPTY),
    [data?.data]
  );

  // forest dari rows (dependensi stabil)
  const roots = useMemo(() => toForest(rows), [rows]);

  // actions
  const openCreateChild = (parent) => {
    setModal({ open: true, parent });
    form.resetFields();
  };
  const closeModal = () => setModal({ open: false, parent: null });

  const submit = async (values) => {
    setSaving(true);
    try {
      await jsonSend(ApiEndpoints.CreateJabatan, "POST", {
        nama_jabatan: values.nama_jabatan,
        id_induk_jabatan: modal.parent?.id_jabatan ?? null,
      });
      closeModal();
      await mutate();
      message.success("Anak jabatan ditambahkan.");
    } catch (e) {
      message.error(e.message);
    } finally {
      setSaving(false);
    }
  };

  /** contoh seeding default minimal (opsional) */
  const seedDefault = async () => {
    if (rows.length > 0) return message.info("Data sudah ada.");
    setSeeding(true);
    try {
      const payloads = [
        { nama_jabatan: "Konsultan" },
        { nama_jabatan: "Sosial Media" },
        { nama_jabatan: "Design" },
        { nama_jabatan: "Manager" },
        { nama_jabatan: "Staff Regional" },
        { nama_jabatan: "Admission" },
      ];
      const created = [];
      for (const p of payloads) {
        const r = await jsonSend(ApiEndpoints.CreateJabatan, "POST", p);
        created.push(r.data);
      }
      const mgr = created.find((x) => x.nama_jabatan === "Manager");
      if (mgr) {
        await jsonSend(ApiEndpoints.CreateJabatan, "POST", {
          nama_jabatan: "IT",
          id_induk_jabatan: mgr.id_jabatan,
        });
      }
      const kons = created.find((x) => x.nama_jabatan === "Konsultan");
      if (kons) {
        await jsonSend(ApiEndpoints.CreateJabatan, "POST", {
          nama_jabatan: "Marketing",
          id_induk_jabatan: kons.id_jabatan,
        });
      }
      await mutate();
      message.success("Jabatan default ditambahkan.");
    } catch (e) {
      message.error(e.message);
    } finally {
      setSeeding(false);
    }
  };

  return {
    loading,
    roots,
    openCreateChild,
    modal,
    closeModal,
    form,
    submit,
    saving,
    seedDefault,
    seeding,
  };
}
