"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { App as AntdApp } from "antd";
import Cookies from "js-cookie";
import useSWR from "swr";
import { ApiEndpoints } from "@/constrainst/endpoints";
import { fetcher } from "@/app/utils/fetcher";

const EMPTY = Object.freeze([]);

function makeItem(seed = {}) {
  return {
    id: seed.id || `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    kpiId: seed.kpiId || "",
    namaKpi: seed.namaKpi || "",
    satuan: seed.satuan || "",
    targetTahunan: seed.targetTahunan || "",
    term1: seed.term1 || "",
    term2: seed.term2 || "",
    term3: seed.term3 || "",
    term4: seed.term4 || "",
  };
}

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

function normalizePlan(row) {
  const id = String(row?.id ?? row?.id_kpi_plan ?? "").trim();
  if (!id) return null;

  return {
    id,
    userId: String(row?.userId ?? row?.id_user ?? "").trim(),
    tahun: String(row?.tahun ?? ""),
    status: String(row?.status ?? "draft").trim().toLowerCase() || "draft",
    namaKaryawan: row?.namaKaryawan ?? row?.nama_user_snapshot ?? "",
    namaJabatan: row?.namaJabatan ?? row?.jabatan_snapshot ?? "",
    namaLokasi: row?.namaLokasi ?? row?.location_snapshot ?? "",
    updatedAt: row?.updatedAt ?? row?.updated_at ?? null,
    items: (Array.isArray(row?.items) ? row.items : []).map((item) =>
      makeItem({
        id: item?.id,
        kpiId: item?.kpiId ?? item?.id_kpi ?? "",
        namaKpi: item?.namaKpi ?? item?.nama_kpi_snapshot ?? "",
        satuan: item?.satuan ?? item?.satuan_snapshot ?? "",
        targetTahunan: item?.targetTahunan ?? item?.target_tahunan ?? "",
        term1: item?.term1 ?? "",
        term2: item?.term2 ?? "",
        term3: item?.term3 ?? "",
        term4: item?.term4 ?? "",
      }),
    ),
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

async function requestJson(url, options = {}) {
  const response = await fetch(url, {
    method: options.method || "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${Cookies.get("token") || ""}`,
      ...(options.headers || {}),
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(payload?.message || `HTTP error! status: ${response.status}`);
  }

  return payload;
}

function toNumber(value) {
  const safe = Number(String(value ?? "").replace(/,/g, "").trim());
  return Number.isFinite(safe) ? safe : 0;
}

function buildEmptyForm(year = new Date().getFullYear()) {
  return {
    planId: "",
    userId: "",
    tahun: String(year),
    status: "draft",
    namaKaryawan: "",
    namaJabatan: "",
    namaLokasi: "",
    items: [],
  };
}

export default function useDetailViewModel(options = {}) {
  const initialUserId = String(options?.initialUserId || "").trim();
  const { notification } = AntdApp.useApp();
  const [form, setForm] = useState(() => ({
    ...buildEmptyForm(),
    userId: initialUserId,
  }));
  const [notice, setNotice] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const hydratedKeyRef = useRef("idle");

  const usersSwr = useSWR("kpi-form:users", fetchUsers, {
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
  });

  const users = useMemo(
    () => normalizeRows({ data: usersSwr.data }).map(normalizeUser).filter(Boolean),
    [usersSwr.data]
  );

  const selectedUser = useMemo(
    () => users.find((item) => item.id === form.userId) || null,
    [form.userId, users]
  );

  useEffect(() => {
    if (!initialUserId || users.length === 0) return;
    if (form.userId === initialUserId && form.namaKaryawan) return;

    const nextUser = users.find((item) => item.id === initialUserId) || null;
    hydratedKeyRef.current = "pending";
    setForm((prev) => ({
      ...buildEmptyForm(prev.tahun || new Date().getFullYear()),
      userId: initialUserId,
      tahun: prev.tahun || String(new Date().getFullYear()),
      namaKaryawan: nextUser?.nama || "",
      namaJabatan: nextUser?.jabatanNama || "",
      namaLokasi: nextUser?.locationNama || "",
    }));
  }, [form.namaKaryawan, form.userId, initialUserId, users]);

  const selectedPlanKey = useMemo(() => {
    const tahun = String(form.tahun || "").trim();
    if (!form.userId || !tahun) return null;

    return ApiEndpoints.GetKpiPlans({
      userId: form.userId,
      tahun,
      page: 1,
      pageSize: 1,
    });
  }, [form.tahun, form.userId]);

  const planSwr = useSWR(selectedPlanKey, fetcher, {
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
  });

  const currentPlan = useMemo(() => {
    const first = normalizeRows(planSwr.data)[0];
    return normalizePlan(first);
  }, [planSwr.data]);

  useEffect(() => {
    if (!selectedPlanKey || planSwr.isLoading) return;

    if (currentPlan) {
      const hydrateKey = `plan:${currentPlan.id}`;
      if (hydratedKeyRef.current === hydrateKey) return;

      hydratedKeyRef.current = hydrateKey;
      setForm({
        planId: currentPlan.id,
        userId: currentPlan.userId || form.userId,
        tahun: currentPlan.tahun || form.tahun,
        status: currentPlan.status || "draft",
        namaKaryawan: currentPlan.namaKaryawan || selectedUser?.nama || "",
        namaJabatan: currentPlan.namaJabatan || selectedUser?.jabatanNama || "",
        namaLokasi: currentPlan.namaLokasi || selectedUser?.locationNama || "",
        items: currentPlan.items.map((item) => makeItem(item)),
      });
      return;
    }

    const hydrateKey = `empty:${form.userId}:${form.tahun}`;
    if (hydratedKeyRef.current === hydrateKey) return;

    hydratedKeyRef.current = hydrateKey;
    setForm((prev) => ({
      ...prev,
      planId: "",
      status: "draft",
      items: [],
      namaKaryawan: selectedUser?.nama || prev.namaKaryawan,
      namaJabatan: selectedUser?.jabatanNama || prev.namaJabatan,
      namaLokasi: selectedUser?.locationNama || prev.namaLokasi,
    }));
  }, [currentPlan, form.tahun, form.userId, planSwr.isLoading, selectedPlanKey, selectedUser]);

  const computedItems = useMemo(
    () =>
      form.items.map((item, index) => ({
        ...item,
        nomor: index + 1,
        target: toNumber(item.targetTahunan),
      })),
    [form.items]
  );

  const summary = useMemo(() => {
    const totalTarget = computedItems.reduce((sum, item) => sum + item.target, 0);

    return {
      totalKpi: computedItems.length,
      totalTarget,
    };
  }, [computedItems]);

  const loading = usersSwr.isLoading || Boolean(selectedPlanKey && planSwr.isLoading);
  const error = usersSwr.error || planSwr.error || null;

  const setHeaderField = (field, value) => {
    setNotice("");
    hydratedKeyRef.current = "pending";

    setForm((prev) => {
      if (field === "tahun") {
        return {
          ...prev,
          planId: "",
          tahun: value,
          status: "draft",
          items: [],
        };
      }

      return {
        ...prev,
        [field]: value,
      };
    });
  };

  const updateItemField = (id, field, value) => {
    setForm((prev) => ({
      ...prev,
      items: prev.items.map((item) => (item.id === id ? { ...item, [field]: value } : item)),
    }));
  };

  const addItem = () => {
    setNotice("");
    setForm((prev) => ({
      ...prev,
      items: [...prev.items, makeItem()],
    }));
  };

  const removeItem = (id) => {
    setForm((prev) => ({
      ...prev,
      items: prev.items.filter((item) => item.id !== id),
    }));
  };

  const resetForm = () => {
    if (currentPlan) {
      hydratedKeyRef.current = `plan:${currentPlan.id}`;
      setForm({
        planId: currentPlan.id,
        userId: currentPlan.userId || "",
        tahun: currentPlan.tahun || String(new Date().getFullYear()),
        status: currentPlan.status || "draft",
        namaKaryawan: currentPlan.namaKaryawan || selectedUser?.nama || "",
        namaJabatan: currentPlan.namaJabatan || selectedUser?.jabatanNama || "",
        namaLokasi: currentPlan.namaLokasi || selectedUser?.locationNama || "",
        items: currentPlan.items.map((item) => makeItem(item)),
      });
      setNotice("Form KPI dikembalikan ke data tersimpan.");
      return;
    }

    if (selectedUser) {
      hydratedKeyRef.current = `empty:${selectedUser.id}:${form.tahun}`;
      setForm({
        ...buildEmptyForm(form.tahun || new Date().getFullYear()),
        userId: selectedUser.id,
        tahun: form.tahun || String(new Date().getFullYear()),
        namaKaryawan: selectedUser.nama || "",
        namaJabatan: selectedUser.jabatanNama || "",
        namaLokasi: selectedUser.locationNama || "",
      });
      setNotice("Form KPI direset untuk karyawan terpilih.");
      return;
    }

    hydratedKeyRef.current = "idle";
    setForm({
      ...buildEmptyForm(),
      userId: initialUserId,
    });
    setNotice("Form KPI direset ke kondisi awal.");
  };

  const refresh = async () => {
    await usersSwr.mutate();
    if (selectedPlanKey) {
      hydratedKeyRef.current = "pending";
      await planSwr.mutate();
    }
  };

  const savePlan = async () => {
    if (!form.userId) {
      setNotice("Karyawan tidak valid.");
      return;
    }

    if (computedItems.length === 0) {
      setNotice("Tambahkan minimal 1 item KPI sebelum menyimpan.");
      return;
    }

    setIsSaving(true);
    setNotice("");

    try {
      const isUpdate = Boolean(form.planId);
      const payload = {
        userId: form.userId,
        tahun: form.tahun,
        status: form.status,
        items: form.items.map((item) => ({
          kpiId: item.kpiId || undefined,
          namaKpi: item.namaKpi,
          satuan: item.satuan,
          targetTahunan: item.targetTahunan,
          term1: item.term1,
          term2: item.term2,
          term3: item.term3,
          term4: item.term4,
        })),
      };

      const result = await requestJson(
        form.planId ? ApiEndpoints.UpdateKpiPlan(form.planId) : ApiEndpoints.CreateKpiPlan,
        {
          method: form.planId ? "PUT" : "POST",
          body: payload,
        }
      );

      const savedPlan = normalizePlan(result?.data);
      hydratedKeyRef.current = savedPlan ? `plan:${savedPlan.id}` : "pending";

      if (savedPlan) {
        setForm({
          planId: savedPlan.id,
          userId: savedPlan.userId || form.userId,
          tahun: savedPlan.tahun || form.tahun,
          status: savedPlan.status || form.status,
          namaKaryawan: savedPlan.namaKaryawan || form.namaKaryawan,
          namaJabatan: savedPlan.namaJabatan || form.namaJabatan,
          namaLokasi: savedPlan.namaLokasi || form.namaLokasi,
          items: savedPlan.items.map((item) => makeItem(item)),
        });
      }

      setNotice(isUpdate ? "KPI plan berhasil diperbarui." : "KPI plan berhasil disimpan.");
      notification.success({
        message: isUpdate ? "KPI Berhasil Diperbarui" : "KPI Berhasil Disimpan",
        description: isUpdate
          ? "Perubahan KPI karyawan sudah tersimpan."
          : "KPI karyawan baru berhasil disimpan.",
        placement: "topRight",
      });
      if (selectedPlanKey) {
        await planSwr.mutate();
      }
    } catch (saveError) {
      setNotice(saveError.message || "Gagal menyimpan KPI plan.");
    } finally {
      setIsSaving(false);
    }
  };

  const deletePlan = async () => {
    if (!form.planId) return;

    setIsDeleting(true);
    setNotice("");

    try {
      await requestJson(ApiEndpoints.DeleteKpiPlan(form.planId), {
        method: "DELETE",
      });

      hydratedKeyRef.current = `empty:${form.userId}:${form.tahun}`;
      setForm((prev) => ({
        ...prev,
        planId: "",
        status: "draft",
        items: [],
      }));
      setNotice("KPI plan berhasil dihapus.");
      if (selectedPlanKey) {
        await planSwr.mutate();
      }
    } catch (deleteError) {
      setNotice(deleteError.message || "Gagal menghapus KPI plan.");
    } finally {
      setIsDeleting(false);
    }
  };

  return {
    form,
    setHeaderField,
    updateItemField,
    addItem,
    removeItem,
    resetForm,
    refresh,
    savePlan,
    deletePlan,
    loading,
    error,
    notice,
    isSaving,
    isDeleting,
    users,
    selectedUser,
    currentPlan,
    hasExistingPlan: Boolean(form.planId),
    computedItems,
    summary,
  };
}
