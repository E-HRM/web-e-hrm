"use client";

import React, { useEffect, useMemo, useState } from "react";

import AppModal from "@/app/(view)/component_shared/AppModal";
import AppTypography from "@/app/(view)/component_shared/AppTypography";
import AppDivider from "@/app/(view)/component_shared/AppDivider";
import AppButton from "@/app/(view)/component_shared/AppButton";
import AppSpace from "@/app/(view)/component_shared/AppSpace";
import AppInput from "@/app/(view)/component_shared/AppInput";

import FinanceStatusTag from "../../component_finance/FinanceStatusTag";
import FinanceActionModal from "../../component_finance/FinanceActionModal";

function formatIDR(num) {
  const n = Number(num || 0);
  return new Intl.NumberFormat("id-ID").format(Number.isFinite(n) ? n : 0);
}

function InfoRow({ label, value }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <AppTypography.Text size={12} tone="muted" className="text-slate-500">
        {label}
      </AppTypography.Text>
      <AppTypography.Text className="text-slate-800 text-right">
        {value ?? "—"}
      </AppTypography.Text>
    </div>
  );
}

/* =========================
   MEDIA PREVIEW (force)
========================= */
function getUrlFromFileLike(f) {
  if (!f) return null;
  if (typeof f === "string") return f;
  if (f.url) return f.url;
  if (f.publicUrl) return f.publicUrl;
  if (f.href) return f.href;
  if (typeof f.name === "string" && f.name.startsWith("http")) return f.name;
  return null;
}

function getFileNameFromUrl(url) {
  try {
    const u = new URL(url);
    const last = u.pathname.split("/").filter(Boolean).pop();
    return last || "file";
  } catch {
    const clean = String(url || "").split("?")[0];
    const last = clean.split("/").filter(Boolean).pop();
    return last || "file";
  }
}

function getLabelFromFileLike(file, url) {
  if (file && typeof file === "object") {
    return (
      file.label ||
      file.filename ||
      (file.name && !String(file.name).startsWith("http") ? file.name : null) ||
      null
    );
  }
  return getFileNameFromUrl(url);
}

function isImageByExt(url) {
  const u = String(url || "").split("?")[0].toLowerCase();
  return /\.(png|jpg|jpeg|gif|webp|bmp|svg)$/i.test(u);
}

async function probeIsImage(url) {
  if (!url) return false;
  if (isImageByExt(url)) return true;
  try {
    const res = await fetch(url, { method: "HEAD" });
    const ct = res.headers.get("content-type") || "";
    return ct.toLowerCase().startsWith("image/");
  } catch {
    return false;
  }
}

function MediaPreview({ file, forceImagePreview = true }) {
  const url = getUrlFromFileLike(file);
  const [isImg, setIsImg] = useState(() => (url ? isImageByExt(url) : false));
  const [imgFailed, setImgFailed] = useState(false);

  useEffect(() => {
    let alive = true;
    (async () => {
      if (!url) return;
      const ok = await probeIsImage(url);
      if (!alive) return;
      if (ok) setIsImg(true);
    })();
    return () => {
      alive = false;
    };
  }, [url]);

  if (!url) {
    return (
      <AppTypography.Text size={12} tone="muted" className="text-slate-500">
        Belum ada
      </AppTypography.Text>
    );
  }

  const label = getLabelFromFileLike(file, url);
  const shouldTryImage = forceImagePreview || isImg;

  return (
    <div className="mt-2">
      {shouldTryImage && !imgFailed ? (
        <a href={url} target="_blank" rel="noreferrer">
          <div className="rounded-xl overflow-hidden ring-1 ring-slate-100 bg-slate-50">
            <img
              src={url}
              alt={label}
              className="w-full h-[220px] object-contain bg-white"
              loading="lazy"
              referrerPolicy="no-referrer"
              onError={() => setImgFailed(true)}
            />
          </div>
          <AppTypography.Text size={12} tone="muted" className="mt-2 text-slate-500">
            Klik gambar untuk membuka ukuran penuh
          </AppTypography.Text>
        </a>
      ) : (
        <div className="mt-2">
          <AppTypography.Text size={12} tone="muted" className="text-slate-500">
            Preview tidak tersedia. Buka dokumen:
          </AppTypography.Text>
          <a href={url} target="_blank" rel="noreferrer">
            <AppTypography.Text className="text-slate-700 underline">{label}</AppTypography.Text>
          </a>
        </div>
      )}
    </div>
  );
}

export default function PaymentDetailModal({ open, onClose, data, onApprove, onReject, onMarkReceiptUploaded }) {
  const [action, setAction] = useState(null);
  const [receiptName, setReceiptName] = useState("");

  const title = useMemo(() => (!data ? "Detail Payment" : "Payment"), [data]);
  const items = useMemo(() => data?.items || [], [data]);

  const footer = useMemo(() => {
    if (!data) return null;

    const isFinalReject = data.status === "REJECTED";
    const canApprove = data.status === "PENDING" || data.status === "IN_REVIEW";

    return (
      <div className="w-full flex flex-col gap-3">
        <div className="w-full flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FinanceStatusTag status={data.status} />
            {data?.rejectReason ? (
              <AppTypography.Text size={12} tone="muted" className="text-slate-500">
                • {data.rejectReason}
              </AppTypography.Text>
            ) : null}
          </div>

          <AppSpace size="sm">
            {!isFinalReject ? (
              <>
                <AppButton variant="danger" disabled={data.status === "APPROVED"} onClick={() => setAction("reject")}>
                  Reject
                </AppButton>

                <AppButton variant="primary" disabled={!canApprove} onClick={() => setAction("approve")}>
                  Bayar
                </AppButton>
              </>
            ) : null}
          </AppSpace>
        </div>
      </div>
    );
  }, [data, receiptName, onMarkReceiptUploaded]);

  return (
    <>
      <AppModal
        open={open}
        onClose={onClose}
        onCancel={onClose}
        title={title}
        subtitle="Detail pengajuan payment"
        footer={() => footer}
        width={900}
      >
        {!data ? null : (
          <div className="flex flex-col gap-4">
            {/* Row 1: Ringkasan + Rekening */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="rounded-2xl ring-1 ring-slate-100 bg-white p-4">
                <AppTypography.Text weight={800} className="block text-slate-900">
                  Ringkasan
                </AppTypography.Text>
                <AppDivider className="my-3" />

                <div className="flex flex-col gap-2">
                  <InfoRow label="Karyawan" value={`${data.employeeName} • ${data.department}`} />
                  <InfoRow label="Tanggal" value={data.dateLabel} />
                  <InfoRow label="Kategori" value={data.category} />
                  <InfoRow label="Metode" value={data.method} />
                </div>

                {data.note ? (
                  <>
                    <AppDivider className="my-3" />
                    <AppTypography.Text size={12} tone="muted" className="block text-slate-500">
                      Catatan
                    </AppTypography.Text>
                    <AppTypography.Text className="text-slate-700">{data.note}</AppTypography.Text>
                  </>
                ) : null}
              </div>

              <div className="rounded-2xl ring-1 ring-slate-100 bg-white p-4">
                <AppTypography.Text weight={800} className="block text-slate-900">
                  Rekening
                </AppTypography.Text>
                <AppDivider className="my-3" />

                <div className="flex flex-col gap-2">
                  <InfoRow label="Bank" value={data.bankName || "-"} />
                  <InfoRow label="Nama" value={data.accountName || "-"} />
                  <InfoRow label="No. Rekening" value={data.accountNumber || "-"} />
                </div>
              </div>
            </div>

            {/* Row 2: Bukti user (kiri) + bukti admin (kanan) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="rounded-2xl ring-1 ring-slate-100 bg-white p-4">
                <AppTypography.Text weight={800} className="block text-slate-900">
                  Bukti / Nota (User)
                </AppTypography.Text>
                <AppDivider className="my-3" />

                {(Array.isArray(data.proposalFiles) ? data.proposalFiles : []).length ? (
                  data.proposalFiles.map((f, idx) => (
                    <MediaPreview key={`${getUrlFromFileLike(f) || "file"}-${idx}`} file={f} forceImagePreview />
                  ))
                ) : (
                  <AppTypography.Text size={12} tone="muted" className="text-slate-500">
                    Belum ada
                  </AppTypography.Text>
                )}
              </div>

              <div className="rounded-2xl ring-1 ring-slate-100 bg-white p-4">
                <AppTypography.Text weight={800} className="block text-slate-900">
                  Bukti Transfer (Admin)
                </AppTypography.Text>
                <AppDivider className="my-3" />

                <MediaPreview file={data.adminProof} forceImagePreview />
              </div>
            </div>

            {/* Row 3: Rincian biaya */}
            <div className="rounded-2xl ring-1 ring-slate-100 bg-white p-4">
              <AppTypography.Text weight={800} className="block text-slate-900">
                Rincian Biaya
              </AppTypography.Text>
              <AppDivider className="my-3" />

              <div className="flex flex-col gap-2">
                {items.map((it, idx) => (
                  <div key={idx} className="flex items-center justify-between gap-3">
                    <AppTypography.Text className="text-slate-700">{it.name}</AppTypography.Text>
                    <AppTypography.Text weight={800} className="text-slate-900">
                      Rp {formatIDR(it.amount)}
                    </AppTypography.Text>
                  </div>
                ))}

                <AppDivider className="!my-2" />

                <div className="flex items-center justify-between gap-3">
                  <AppTypography.Text weight={900} className="text-slate-900">
                    Total
                  </AppTypography.Text>
                  <AppTypography.Text weight={900} className="text-slate-900">
                    Rp {formatIDR(data.totalAmount)}
                  </AppTypography.Text>
                </div>
              </div>
            </div>
          </div>
        )}
      </AppModal>

      <FinanceActionModal
        open={open && action === "approve"}
        onClose={() => setAction(null)}
        mode="approve"
        requireProof
        request={{
          number: data?.number,
          onSubmit: async ({ proofFiles }) => {
            await onApprove?.({ id: data?.id, proofFiles });
            setAction(null);
          },
        }}
      />

      <FinanceActionModal
        open={open && action === "reject"}
        onClose={() => setAction(null)}
        mode="reject"
        request={{
          number: data?.number,
          onSubmit: async ({ reason }) => {
            await onReject?.({ id: data?.id, reason });
            setAction(null);
          },
        }}
      />
    </>
  );
}
