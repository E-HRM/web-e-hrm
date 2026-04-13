'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import useSWR from 'swr';
import dayjs from 'dayjs';
import { ApiEndpoints } from '@/constrainst/endpoints';
import { fetcher } from '@/app/utils/fetcher';
import { crudService } from '@/app/utils/services/crudService';

const EMPTY = Object.freeze([]);
const EMPTY_SUMMARY = Object.freeze({
  total_forms: 0,
  full_day: 0,
  half_day: 0,
  pending: 0,
  disetujui: 0,
  ditolak: 0,
});

function summarizeForms(rows) {
  return rows.reduce(
    (acc, item) => {
      acc.total_forms += 1;
      if (item?.status_hari_kerja === 'FULL_DAY') acc.full_day += 1;
      if (item?.status_hari_kerja === 'HALF_DAY') acc.half_day += 1;

      const decision = String(item?.decision || 'pending').toLowerCase();
      if (decision === 'disetujui') acc.disetujui += 1;
      else if (decision === 'ditolak') acc.ditolak += 1;
      else acc.pending += 1;

      return acc;
    },
    {
      total_forms: 0,
      full_day: 0,
      half_day: 0,
      pending: 0,
      disetujui: 0,
      ditolak: 0,
    }
  );
}

export default function useDetailFreelanceViewModel(freelanceId) {
  const endpoint = useMemo(() => (freelanceId ? ApiEndpoints.GetFreelanceById(freelanceId) : null), [freelanceId]);
  const { data, error, isLoading, mutate } = useSWR(endpoint, fetcher, {
    revalidateOnFocus: false,
  });

  const detail = data?.data || null;
  const freelance = detail
    ? {
        id_freelance: detail.id_freelance,
        nama: detail.nama,
        alamat: detail.alamat,
        kontak: detail.kontak,
        email: detail.email,
        supervisor: detail.supervisor || null,
        created_at: detail.created_at,
        updated_at: detail.updated_at,
      }
    : null;

  const forms = useMemo(() => (Array.isArray(detail?.form_freelance) ? detail.form_freelance : EMPTY), [detail]);
  const summary = useMemo(() => detail?.summary || EMPTY_SUMMARY, [detail]);

  const [noteDrafts, setNoteDrafts] = useState({});
  const [savingId, setSavingId] = useState('');
  const [dateRange, setDateRange] = useState([]);

  useEffect(() => {
    if (!forms.length) {
      setNoteDrafts({});
      return;
    }

    setNoteDrafts((prev) => {
      const next = {};
      forms.forEach((item) => {
        next[item.id_form_freelance] = Object.prototype.hasOwnProperty.call(prev, item.id_form_freelance)
          ? prev[item.id_form_freelance]
          : item.note || '';
      });
      return next;
    });
  }, [forms]);

  const filteredForms = useMemo(() => {
    if (!Array.isArray(dateRange) || !dateRange.length) return forms;

    const [start, end] = dateRange;
    const startDate = start && dayjs(start).isValid() ? dayjs(start).startOf('day') : null;
    const endDate = end && dayjs(end).isValid() ? dayjs(end).endOf('day') : null;

    if (!startDate && !endDate) return forms;

    return forms.filter((item) => {
      const current = dayjs(item?.tanggal_kerja);
      if (!current.isValid()) return false;
      if (startDate && current.isBefore(startDate)) return false;
      if (endDate && current.isAfter(endDate)) return false;
      return true;
    });
  }, [dateRange, forms]);

  const filteredSummary = useMemo(() => summarizeForms(filteredForms), [filteredForms]);

  const setNoteDraft = useCallback((formId, value) => {
    setNoteDrafts((prev) => ({
      ...prev,
      [formId]: value,
    }));
  }, []);

  const decide = useCallback(
    async (formId, decision) => {
      setSavingId(formId);
      try {
        const note = String(noteDrafts[formId] || '').trim();
        const result = await crudService.patch(ApiEndpoints.UpdateFreelanceFormApproval(formId), {
          decision,
          note: note || null,
        });
        await mutate();
        return result;
      } finally {
        setSavingId('');
      }
    },
    [mutate, noteDrafts]
  );

  const clearDateRange = useCallback(() => {
    setDateRange([]);
  }, []);

  const formatDate = useCallback((value, pattern = 'DD MMM YYYY') => {
    if (!value) return '—';
    const parsed = dayjs(value);
    return parsed.isValid() ? parsed.format(pattern) : '—';
  }, []);

  const formatDateTime = useCallback((value) => {
    if (!value) return '—';
    const parsed = dayjs(value);
    return parsed.isValid() ? parsed.format('DD MMM YYYY HH:mm') : '—';
  }, []);

  return {
    loading: isLoading,
    error,
    freelance,
    forms,
    filteredForms,
    summary,
    filteredSummary,
    dateRange,
    setDateRange,
    clearDateRange,
    hasDateFilter: Array.isArray(dateRange) && dateRange.some((item) => item && dayjs(item).isValid()),
    noteDrafts,
    savingId,
    setNoteDraft,
    decide,
    formatDate,
    formatDateTime,
    refresh: mutate,
  };
}
