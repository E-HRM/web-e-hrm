"use client";

import { useCallback, useMemo, useState } from "react";
import Cookies from "js-cookie";
import useSWR from "swr";
import { ApiEndpoints } from "../../../../../constrainst/endpoints";

function normUpper(s) {
  return String(s || "").trim().toUpperCase();
}

function mapApiStatusToUI(apiStatus) {
  const s = String(apiStatus || "").toLowerCase();
  if (s === "pending") return { key: "PENDING", label: "Pending", tone: "warning" };
  if (s === "disetujui" || s === "approved") return { key: "APPROVED", label: "Approved", tone: "success" };
  if (s === "ditolak" || s === "rejected") return { key: "REJECTED", label: "Rejected", tone: "danger" };
  return { key: "IN_REVIEW", label: "In Review", tone: "info" };
}

function applyClientFilters(rows, filters) {
  const q = String(filters?.search || "").trim().toLowerCase();
  const st = normUpper(filters?.status);

  let xs = rows;

  if (q) {
    xs = xs.filter((r) => {
      return (
        String(r?.title || "").toLowerCase().includes(q) ||
        String(r?.number || "").toLowerCase().includes(q) ||
        String(r?.employeeName || "").toLowerCase().includes(q) ||
        String(r?.department || "").toLowerCase().includes(q) ||
        String(r?.category || "").toLowerCase().includes(q)
      );
    });
  }

  if (st && st !== "ALL" && st !== "SEMUA") {
    xs = xs.filter((r) => normUpper(r?.status) === st);
  }

  return xs;
}

async function apiJson(url, { method = "GET", body } = {}) {
  const token = Cookies.get("token");
  const headers = {};
  if (token) headers.authorization = `Bearer ${token}`;
  if (body !== undefined) headers["content-type"] = "application/json";

  const res = await fetch(url, {
    method,
    headers,
    credentials: "include",
    body: body ? JSON.stringify(body) : undefined,
  });

  const ct = res.headers.get("content-type") || "";
  const data = ct.includes("application/json") ? await res.json() : await res.text();
  if (!res.ok) throw new Error(data?.message || `Request gagal (${res.status})`);
  return data;
}
//export function sync
async function apiForm(url, { method = "POST", formData }) {
  const token = Cookies.get("token");
  const headers = {};
  if (token) headers.authorization = `Bearer ${token}`;

  const res = await fetch(url, {
    method,
    headers,
    credentials: "include",
    body: formData,
  });

  const ct = res.headers.get("content-type") || "";
  const data = ct.includes("application/json") ? await res.json() : await res.text();
  if (!res.ok) throw new Error(data?.message || `Request gagal (${res.status})`);
  return data;
}

function safeNum(v) {
  if (v === null || v === undefined) return 0;
  if (typeof v === "number") return Number.isFinite(v) ? v : 0;
  const n = Number(String(v).replace(/,/g, ""));
  return Number.isFinite(n) ? n : 0;
}

function pickApproval(item) {
  const approvals = Array.isArray(item?.approvals) ? item.approvals : [];
  const pending = approvals.find((a) => String(a?.decision || "").toLowerCase() === "pending");
  return pending || approvals[0] || null;
}

function pickRejectNote(item) {
  const approvals = Array.isArray(item?.approvals) ? item.approvals : [];
  const rejected = approvals.find((a) => String(a?.decision || "").toLowerCase() === "ditolak" && a?.note);
  return rejected?.note || null;
}

function pickEmployeeName(item) {
  const u = item?.user;
  return u?.nama_pengguna || u?.name || u?.email || "—";
}

function pickDepartment(item) {
  return item?.departement?.nama_departement || item?.user?.departement?.nama_departement || "—";
}

function pickAvatarUrl(item) {
  return item?.user?.foto_profil_user || null;
}

function buildNumber(id) {
  const s = String(id || "").trim();
  if (!s) return "-";
  return `RB-${s.slice(0, 8).toUpperCase()}`;
}

/* =========================
   REKENING (Reimburse)
========================= */
function pickBankName(item) {
  return (
    item?.jenis_bank ||
    item?.bank ||
    item?.nama_bank ||
    item?.bank_name ||
    "-"
  );
}
function pickAccountName(item) {
  return (
    item?.nama_pemilik_rekening ||
    item?.nama_rekening ||
    item?.account_name ||
    "-"
  );
}
function pickAccountNumber(item) {
  return (
    item?.nomor_rekening ||
    item?.account_number ||
    "-"
  );
}

export default function useReimbursesViewModel(filters) {
  const [selected, setSelected] = useState(null);

  const qs = useMemo(
    () => ApiEndpoints.GetReimburseMobile({ page: 1, perPage: 5000, all: true }),
    []
  );

  const { data, error, isLoading, mutate } = useSWR(qs, (u) => apiJson(u), {
    revalidateOnFocus: false,
  });

  const raw = useMemo(() => {
    if (Array.isArray(data?.data)) return data.data;
    if (Array.isArray(data?.items)) return data.items;
    if (Array.isArray(data)) return data;
    return [];
  }, [data]);

  const rows = useMemo(() => {
    return raw.map((it) => {
      const approval = pickApproval(it);
      const st = mapApiStatusToUI(it?.status);

      const approvalId = approval?.id_approval_reimburse || approval?.id;
      const reimburseId = it?.id_reimburse || it?.id;

      const userProofUrl = it?.bukti_pembayaran_url || null;
      const adminProofUrl =
        approval?.bukti_approval_reimburse_url ||
        approval?.bukti_approval_url ||
        null;

      const itemsArr = Array.isArray(it?.items) ? it.items : [];

      const bankName = pickBankName(it);
      const accountName = pickAccountName(it);
      const accountNumber = pickAccountNumber(it);

      return {
        id: approvalId || reimburseId || null,
        requestId: reimburseId || null,

        type: "Reimburse",
        title: it?.keterangan || "Reimburse",
        number: buildNumber(reimburseId),

        status: st.key,
        statusLabel: st.label,
        statusTone: st.tone,

        employeeName: pickEmployeeName(it),
        department: pickDepartment(it),
        avatarUrl: pickAvatarUrl(it),

        dateLabel: it?.tanggal ? new Date(it.tanggal).toLocaleDateString("id-ID") : "-",
        dateISO: it?.tanggal || it?.created_at || null,

        method: it?.metode_pembayaran || "-",
        category: it?.kategori_keperluan?.nama_keperluan || "-",

        // ✅ rekening
        bankName,
        accountName,
        accountNumber,
        rekening: { bankName, accountName, accountNumber },

        itemsCount: itemsArr.length,
        items: itemsArr,
        totalAmount: safeNum(it?.total_pengeluaran),

        note: it?.keterangan || "",
        rejectReason: pickRejectNote(it),

        // ✅ bukti user/admin → bentuk object {url,label}
        receipts: userProofUrl
          ? [{ url: userProofUrl, label: "Bukti Pembayaran (User)" }]
          : [],
        adminProof: adminProofUrl
          ? { url: adminProofUrl, label: "Bukti Transfer (Admin)" }
          : null,
      };
    });
  }, [raw]);

  const filteredRows = useMemo(() => applyClientFilters(rows, filters), [rows, filters]);

  const openDetail = useCallback((row) => setSelected(row), []);
  const closeDetail = useCallback(() => setSelected(null), []);

  const approve = useCallback(
    async ({ id, proofFiles }) => {
      const fd = new FormData();
      fd.append("decision", "disetujui");

      const fileObj = proofFiles?.[0]?.originFileObj;
      if (fileObj) fd.append("bukti_approval_reimburse", fileObj);

      await apiForm(ApiEndpoints.DecideReimburseMobile(id), { method: "PATCH", formData: fd });
      await mutate();
    },
    [mutate]
  );

  const reject = useCallback(
    async ({ id, reason }) => {
      const fd = new FormData();
      fd.append("decision", "ditolak");
      if (reason) fd.append("note", String(reason));

      await apiForm(ApiEndpoints.DecideReimburseMobile(id), { method: "PATCH", formData: fd });
      await mutate();
    },
    [mutate]
  );

  return {
    loading: isLoading,
    error,

    rows: filteredRows,
    selected,

    openDetail,
    closeDetail,

    approve,
    reject,
  };
}
