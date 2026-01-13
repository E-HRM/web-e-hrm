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
        String(r?.category || "").toLowerCase().includes(q) ||
        String(r?.vendorName || "").toLowerCase().includes(q) ||
        String(r?.eventName || "").toLowerCase().includes(q)
      );
    });
  }

  if (st && st !== "ALL") xs = xs.filter((r) => normUpper(r?.status) === st);

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
  const data = ct.includes("application/json") ? await res.json() : await res.text();

  if (!res.ok) {
    const msg =
      (typeof data === "object" && data?.message) ? data.message :
      (typeof data === "string" && data.trim()) ? data :
      `Request gagal (${res.status})`;
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
  const data = ct.includes("application/json") ? await res.json() : await res.text();

  if (!res.ok) {
    const msg =
      (typeof data === "object" && data?.message) ? data.message :
      (typeof data === "string" && data.trim()) ? data :
      `Request gagal (${res.status})`;
    throw new Error(`[${res.status}] ${msg}`);
  }
  return data;
}

function withAllParam(url) {
  try {
    const base = typeof window !== "undefined" ? window.location.origin : "http://localhost";
    const u = new URL(url, base);
    if (!u.searchParams.get("all")) u.searchParams.set("all", "1");
    return u.pathname + u.search;
  } catch {
    if (url.includes("?")) return url + "&all=1";
    return url + "?all=1";
  }
}

async function fetchAllPages(initialUrl, { perPage = 100, maxPages = 300 } = {}) {
  const base = typeof window !== "undefined" ? window.location.origin : "http://localhost";
  const u = new URL(initialUrl, base);

  const all = [];
  let page = Number(u.searchParams.get("page") || 1);
  const wantedPerPage = Math.min(100, Number(u.searchParams.get("perPage") || perPage) || perPage);

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

    const meta = resp?.meta || resp?.pagination || resp?.paginate || resp?.pageInfo || {};
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
  return approvals.find((a) => String(a?.decision || "").toLowerCase() === "pending") || approvals[0] || null;
}

function pickEmployeeName(item) {
  const u = item?.user;
  return u?.nama_pengguna || u?.name || u?.email || "—";
}

function pickEmployeePhoto(item) {
  const u = item?.user;
  return u?.foto_profil_user || u?.photoURL || u?.photo_url || u?.avatar_url || null;
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

function pickPaymentId(item) {
  return item?.id_payment || item?.id || null;
}

function pickApprovalId(approval) {
  return approval?.id_approval_payment || approval?.id || null;
}

function pickDateValue(item) {
  return item?.tanggal || item?.tanggal_payment || item?.created_at || null;
}

function pickStatusRaw(item, approval) {
  return item?.status || item?.status_persetujuan_payment || approval?.decision || "pending";
}

function pickCategory(item) {
  return item?.kategori_keperluan?.nama_keperluan || item?.kategori_keperluan?.nama_kategori_keperluan || item?.kategori || "-";
}

function pickMethod(item) {
  return item?.metode_pembayaran || item?.payment_method || "-";
}

function pickNominal(item) {
  return toNumberSafe(item?.nominal_pembayaran ?? item?.nominal ?? item?.amount ?? 0);
}

function fallbackNumber(paymentId) {
  if (!paymentId) return "-";
  const s = String(paymentId);
  return `PAY-${s.slice(0, 8)}`;
}

function pickVendorName(item) {
  return item?.nama_vendor || item?.vendor || item?.vendor_name || "-";
}

function pickEventName(item) {
  return item?.nama_event || item?.event || item?.event_name || "-";
}

/* =========================
   REKENING (Payment)
========================= */
function pickBankName(item) {
  return item?.jenis_bank || item?.bank || item?.nama_bank || item?.bank_name || "-";
}
function pickAccountName(item) {
  return item?.nama_pemilik_rekening || item?.nama_rekening || item?.account_name || "-";
}
function pickAccountNumber(item) {
  return item?.nomor_rekening || item?.account_number || "-";
}

/* =========================
   VIEW MODEL
========================= */
export default function usePaymentViewModel(filters) {
  const [selected, setSelected] = useState(null);

  const baseUrl = useMemo(() => {
    const u = ApiEndpoints.GetPaymentMobile({ page: 1, perPage: 100 });
    return withAllParam(u);
  }, []);

  const { data, error, isLoading, mutate } = useSWR(
    baseUrl,
    (u) => fetchAllPages(u, { perPage: 100 }),
    { revalidateOnFocus: false }
  );

  const raw = useMemo(() => (Array.isArray(data?.data) ? data.data : []), [data]);

  const rows = useMemo(() => {
    return raw.map((it, idx) => {
      const approval = pickApproval(it);

      const paymentId = pickPaymentId(it);
      const approvalId = pickApprovalId(approval);
      const rowId = approvalId || paymentId || `PAY:${idx}`;

      const statusRaw = pickStatusRaw(it, approval);
      const st = mapApiStatusToUI(statusRaw);

      const dateValue = pickDateValue(it);
      const nominal = pickNominal(it);

      const employeeName = pickEmployeeName(it);
      const employeePhotoUrl = pickEmployeePhoto(it);
      const department = pickDepartment(it);

      const nomor = it?.nomor_payment || it?.nomor || fallbackNumber(paymentId);

      const itemsFromApi = Array.isArray(it?.items) ? it.items : null;
      const items = itemsFromApi
        ? itemsFromApi.map((x) => ({
            name: x?.name || x?.nama_item || x?.keterangan || "Item",
            amount: toNumberSafe(x?.amount ?? x?.nominal ?? x?.harga ?? 0),
          }))
        : [{ name: "Nominal Pembayaran", amount: nominal }];

      const bankName = pickBankName(it);
      const accountName = pickAccountName(it);
      const accountNumber = pickAccountNumber(it);

      // user proof (nota/proposal)
      const proposalUrl = it?.bukti_pembayaran_url || it?.proposal_url || null;

      // admin proof
      const adminProofUrl =
        approval?.bukti_approval_payment_url ||
        approval?.bukti_approval_url ||
        null;

      return {
        id: rowId,

        requestId: paymentId,
        approvalId: approvalId,

        type: "Payment",
        title: it?.keterangan || "Payment",
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

        employee: { name: employeeName, department, photoUrl: employeePhotoUrl },

        dateLabel: dateValue ? new Date(dateValue).toLocaleDateString("id-ID") : "-",
        dateISO: dateValue,

        method: pickMethod(it),
        category: pickCategory(it),

        vendorName: pickVendorName(it),
        eventName: pickEventName(it),

        amount: nominal,
        totalAmount: items.reduce((sum, x) => sum + toNumberSafe(x.amount), 0),
        items,

        note: it?.keterangan || "",

        // ✅ rekening
        bankName,
        accountName,
        accountNumber,
        rekening: { bankName, accountName, accountNumber },

        // ✅ file shape rapih
        proposalFiles: proposalUrl ? [{ url: proposalUrl, label: "Bukti / Nota (User)" }] : [],
        adminProof: adminProofUrl ? { url: adminProofUrl, label: "Bukti Transfer (Admin)" } : null,

        requesterReceipt: null,

        rejectReason: approval?.note || it?.note || null,
      };
    });
  }, [raw]);

  const filteredRows = useMemo(() => applyClientFilters(rows, filters), [rows, filters]);

  const openDetail = useCallback((row) => setSelected(row), []);
  const closeDetail = useCallback(() => setSelected(null), []);

  const approve = useCallback(
    async ({ id, proofFiles }) => {
      const approvalId = selected?.approvalId || selected?.id || id;
      if (!approvalId) throw new Error("Approval ID tidak ditemukan.");

      const fd = new FormData();
      fd.append("decision", "disetujui");

      const fileObj = proofFiles?.[0]?.originFileObj;
      if (fileObj) fd.append("bukti_approval_payment", fileObj);

      await apiForm(ApiEndpoints.DecidePaymentMobile(approvalId), { method: "PATCH", formData: fd });
      await mutate();
      closeDetail();
    },
    [mutate, selected, closeDetail]
  );

  const reject = useCallback(
    async ({ id, reason }) => {
      const approvalId = selected?.approvalId || selected?.id || id;
      if (!approvalId) throw new Error("Approval ID tidak ditemukan.");

      const fd = new FormData();
      fd.append("decision", "ditolak");
      if (reason) fd.append("note", String(reason));

      await apiForm(ApiEndpoints.DecidePaymentMobile(approvalId), { method: "PATCH", formData: fd });
      await mutate();
      closeDetail();
    },
    [mutate, selected, closeDetail]
  );

  const markReceiptUploaded = useCallback(async ({ id, receiptName }) => {
    setSelected((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        requesterReceipt: { url: null, label: receiptName || "kuitansi.pdf", name: receiptName || "kuitansi.pdf" },
      };
    });
  }, []);

  return {
    loading: isLoading,
    error,

    rows: filteredRows,
    selected,

    openDetail,
    closeDetail,

    approve,
    reject,
    markReceiptUploaded,
  };
}
