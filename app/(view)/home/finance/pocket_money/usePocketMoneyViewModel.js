"use client";

import { useCallback, useMemo, useState } from "react";
import Cookies from "js-cookie";
import useSWR from "swr";
import { ApiEndpoints } from "../../../../../constrainst/endpoints";

import {
  mapApiStatusToUI,
  matchDateFilter,
  normUpper,
} from "../component_finance/financeFilterHelpers";

/* =========================
   CLIENT FILTERS
========================= */
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

  if (st && st !== "ALL") {
    xs = xs.filter((r) => normUpper(r?.status) === st);
  }

  xs = xs.filter((r) => matchDateFilter(r?.dateISO, filters));
  return xs;
}

/* =========================
   FETCH HELPERS
========================= */
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
  const data = ct.includes("application/json")
    ? await res.json()
    : await res.text();

  if (!res.ok) {
    const msg =
      typeof data === "object" && data?.message
        ? data.message
        : typeof data === "string" && data.trim()
        ? data
        : `Request gagal (${res.status})`;
    throw new Error(`[${res.status}] ${msg}`);
  }

  return data;
}

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
  const data = ct.includes("application/json")
    ? await res.json()
    : await res.text();

  if (!res.ok) {
    const msg =
      typeof data === "object" && data?.message
        ? data.message
        : typeof data === "string" && data.trim()
        ? data
        : `Request gagal (${res.status})`;
    throw new Error(`[${res.status}] ${msg}`);
  }

  return data;
}

/** Tambahin all=1 tanpa ngerusak query existing */
function withAllParam(url) {
  try {
    const base =
      typeof window !== "undefined"
        ? window.location.origin
        : "http://localhost";
    const u = new URL(url, base);
    if (!u.searchParams.get("all")) u.searchParams.set("all", "1");
    return u.pathname + u.search;
  } catch {
    if (url.includes("?")) return url + "&all=1";
    return url + "?all=1";
  }
}

/**
 * Fetch ALL pages sampai habis.
 * NOTE: server nge-cap perPage max 100.
 */
async function fetchAllPages(
  initialUrl,
  { perPage = 100, maxPages = 300 } = {}
) {
  const base =
    typeof window !== "undefined" ? window.location.origin : "http://localhost";
  const u = new URL(initialUrl, base);

  const all = [];
  let page = Number(u.searchParams.get("page") || 1);
  const wantedPerPage = Math.min(
    100,
    Number(u.searchParams.get("perPage") || perPage) || perPage
  );

  let guard = 0;
  while (guard < maxPages) {
    guard += 1;

    u.searchParams.set("page", String(page));
    u.searchParams.set("perPage", String(wantedPerPage));

    const url = u.pathname + u.search;
    const resp = await apiJson(url);

    const items = Array.isArray(resp?.data)
      ? resp.data
      : Array.isArray(resp)
      ? resp
      : [];

    all.push(...items);

    const meta =
      resp?.meta || resp?.pagination || resp?.paginate || resp?.pageInfo || {};
    const totalPages =
      Number(meta?.totalPages) ||
      Number(meta?.total_pages) ||
      Number(meta?.last_page) ||
      Number(meta?.pages) ||
      0;

    const currentPage =
      Number(meta?.page) ||
      Number(meta?.currentPage) ||
      Number(meta?.current_page) ||
      page;

    if (totalPages > 0 && currentPage >= totalPages) break;
    if (items.length < wantedPerPage) break;
    if (items.length === 0) break;

    page += 1;
  }

  return { data: all };
}

/* =========================
   SAFE PARSERS
========================= */
function toNumberSafe(v) {
  if (v === null || v === undefined) return 0;
  if (typeof v === "number") return Number.isFinite(v) ? v : 0;
  const s = String(v).replace(/,/g, "").trim();
  const n = Number.parseFloat(s);
  return Number.isFinite(n) ? n : 0;
}

function pickApproval(item) {
  const approvals = Array.isArray(item?.approvals) ? item.approvals : [];
  return (
    approvals.find((a) => !a?.decision || a?.decision === "pending") ||
    approvals[0] ||
    null
  );
}

function pickEmployeeName(item) {
  const u = item?.user;
  return u?.nama_pengguna || u?.name || u?.email || "—";
}

function pickEmployeePhoto(item) {
  const u = item?.user;
  return (
    u?.foto_profil_user ||
    u?.photoURL ||
    u?.photo_url ||
    u?.avatar_url ||
    null
  );
}

function pickDepartment(item) {
  return (
    item?.departement?.nama_departement ||
    item?.user?.departement?.nama_departement ||
    item?.departement?.name ||
    item?.user?.departement?.name ||
    "—"
  );
}

function pickPocketMoneyId(item) {
  return item?.id_pocket_money || item?.id || null;
}

function pickApprovalId(approval) {
  return approval?.id_approval_pocket_money || approval?.id || null;
}

function pickDateValue(item) {
  return item?.tanggal || item?.tanggal_pocket_money || item?.created_at || null;
}

function pickTotal(item) {
  const v =
    item?.total_pengeluaran ?? item?.nominal_pocket_money ?? item?.total ?? 0;
  return toNumberSafe(v);
}

function pickCategory(item) {
  return (
    item?.kategori_keperluan?.nama_keperluan ||
    item?.kategori_pocket_money?.nama_kategori_pocket_money ||
    item?.kategori ||
    "-"
  );
}

function pickMethod(item) {
  return item?.metode_pembayaran || item?.payment_method || "-";
}

function pickBankName(item) {
  return item?.jenis_bank || item?.bank || item?.nama_bank || "-";
}

function pickAccountName(item) {
  return item?.nama_pemilik_rekening || item?.nama_rekening || "-";
}

function pickAccountNumber(item) {
  return item?.nomor_rekening || "-";
}

function pickStatusRaw(item, approval) {
  return (
    item?.status ||
    item?.status_persetujuan_pocket_money ||
    item?.status_persetujuan ||
    approval?.decision ||
    "pending"
  );
}

function fallbackNumber(pocketMoneyId) {
  if (!pocketMoneyId) return "-";
  const s = String(pocketMoneyId);
  return `PM-${s.slice(0, 8)}`;
}

/* =========================
   VIEW MODEL
========================= */
export default function usePocketMoneyViewModel(filters) {
  const [selected, setSelected] = useState(null);

  const baseUrl = useMemo(() => {
    const u = ApiEndpoints.GetPocketMoneyMobile({ page: 1, perPage: 100 });
    return withAllParam(u);
  }, []);

  const { data, error, isLoading, mutate } = useSWR(
    baseUrl,
    (u) => fetchAllPages(u, { perPage: 100 }),
    { revalidateOnFocus: false }
  );

  const raw = useMemo(
    () => (Array.isArray(data?.data) ? data.data : []),
    [data]
  );

  const rows = useMemo(() => {
    return raw.map((it, idx) => {
      const approval = pickApproval(it);

      const pocketMoneyId = pickPocketMoneyId(it);
      const approvalId = pickApprovalId(approval);
      const rowId = approvalId || pocketMoneyId || `PM:${idx}`;

      const employeeName = pickEmployeeName(it);
      const employeePhotoUrl = pickEmployeePhoto(it);
      const department = pickDepartment(it);

      const statusRaw = pickStatusRaw(it, approval);
      const st = mapApiStatusToUI(statusRaw);

      const dateValue = pickDateValue(it);

      const itemsArr = Array.isArray(it?.items) ? it.items : [];
      const itemCount = itemsArr.length;

      const bankName = pickBankName(it);
      const accountName = pickAccountName(it);
      const accountNumber = pickAccountNumber(it);

      const nomor =
        it?.nomor_pocket_money || it?.nomor || fallbackNumber(pocketMoneyId);

      // ✅ Bukti dari user
      const userProofUrl = it?.bukti_pembayaran_url || null;

      // ✅ Bukti admin (dari approval)
      const adminProofUrl =
        approval?.bukti_approval_pocket_money_url ||
        approval?.bukti_approval_url ||
        null;

      return {
        id: rowId,

        requestId: pocketMoneyId,
        approvalId: approvalId,

        type: "Pocket Money",
        title: it?.keterangan || "Pocket Money",
        number: nomor,

        status: st.key,
        statusLabel: st.label,
        statusTone: st.tone,

        employeeName,
        department,

        employeePhotoUrl,
        employeeAvatar: employeePhotoUrl,
        photoUrl: employeePhotoUrl,
        avatarUrl: employeePhotoUrl,

        employee: {
          name: employeeName,
          department,
          photoUrl: employeePhotoUrl,
        },

        dateLabel: dateValue
          ? new Date(dateValue).toLocaleDateString("id-ID")
          : "-",
        dateISO: dateValue,

        method: pickMethod(it),
        category: pickCategory(it),

        items: itemsArr,
        itemCount,

        totalAmount: pickTotal(it),
        note: it?.keterangan || "",

        bankName,
        accountName,
        accountNumber,
        rekening: { bankName, accountName, accountNumber },

        // ✅ Bentuk object agar modal bisa preview langsung
        paymentProofUrl: userProofUrl,
        paymentProof: userProofUrl
          ? { url: userProofUrl, label: "Bukti Pembayaran (User)" }
          : null,

        rejectReason: approval?.note || it?.note || null,

        adminProof: adminProofUrl
          ? { url: adminProofUrl, label: "Bukti Pembayaran (Admin)" }
          : null,
      };
    });
  }, [raw]);

  const filteredRows = useMemo(
    () => applyClientFilters(rows, filters),
    [rows, filters]
  );

  const openDetail = useCallback((row) => setSelected(row), []);
  const closeDetail = useCallback(() => setSelected(null), []);

  const approve = useCallback(
    async ({ id, proofFiles }) => {
      const approvalId = selected?.approvalId || selected?.id;
      if (!approvalId) {
        throw new Error(
          "Approval ID tidak ditemukan pada data ini. Pastikan record approvals sudah dibuat untuk pocket money ini."
        );
      }

      const fd = new FormData();
      fd.append("decision", "disetujui");

      const fileObj = proofFiles?.[0]?.originFileObj;
      if (fileObj) fd.append("bukti_approval_pocket_money", fileObj);

      await apiForm(ApiEndpoints.DecidePocketMoneyMobile(approvalId), {
        method: "PATCH",
        formData: fd,
      });

      await mutate();
      closeDetail();
    },
    [mutate, selected, closeDetail]
  );

  const reject = useCallback(
    async ({ id, reason }) => {
      const approvalId = selected?.approvalId || selected?.id;
      if (!approvalId) {
        throw new Error(
          "Approval ID tidak ditemukan pada data ini. Pastikan record approvals sudah dibuat untuk pocket money ini."
        );
      }

      const fd = new FormData();
      fd.append("decision", "ditolak");
      if (reason) fd.append("note", String(reason));

      await apiForm(ApiEndpoints.DecidePocketMoneyMobile(approvalId), {
        method: "PATCH",
        formData: fd,
      });

      await mutate();
      closeDetail();
    },
    [mutate, selected, closeDetail]
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
