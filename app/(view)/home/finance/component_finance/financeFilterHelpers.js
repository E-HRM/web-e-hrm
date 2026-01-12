'use client';

// Helpers kecil agar filter Finance konsisten & tidak duplikasi logic di tiap view model.

export function normUpper(s) {
  return String(s || '').trim().toUpperCase();
}

export function mapApiStatusToUI(apiStatus) {
  const s = String(apiStatus || '').trim().toLowerCase();

  // Backend bisa mengirim status dalam berbagai bentuk.
  if (s === 'pending') return { key: 'PENDING', label: 'Pending', tone: 'warning' };
  if (s === 'disetujui' || s === 'approved') return { key: 'APPROVED', label: 'Approved', tone: 'success' };
  if (s === 'ditolak' || s === 'rejected') return { key: 'REJECTED', label: 'Rejected', tone: 'danger' };

  // ✅ Tidak pakai “In Review” lagi. Kalau status aneh/baru, jatuhkan ke Pending.
  return { key: 'PENDING', label: 'Pending', tone: 'warning' };
}

function dateOnlyFromISO(iso) {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;

  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/**
 * dateMode:
 * - 'ALL'  => tidak filter
 * - 'DATE' => filter 1 tanggal atau range (kalau dateTo ada)
 *
 * dateFrom/dateTo format: 'YYYY-MM-DD'
 */
export function matchDateFilter(dateISO, { dateMode, dateFrom, dateTo } = {}) {
  const mode = normUpper(dateMode);
  if (!mode || mode === 'ALL') return true;

  const from = String(dateFrom || '').trim();
  const to = String(dateTo || '').trim();
  if (!from) return true;

  const d = dateOnlyFromISO(dateISO);
  if (!d) return false;

  // 1 tanggal
  if (!to) return d === from;

  // range (swap kalau kebalik)
  const a = from <= to ? from : to;
  const b = from <= to ? to : from;
  return d >= a && d <= b;
}
