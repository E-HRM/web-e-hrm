'use client';

import { useMemo } from 'react';
import useSWR from 'swr';
import { ApiEndpoints } from '@/constrainst/endpoints';
import { fetcher } from '@/app/utils/fetcher';

const ROLE_CAN_SEE = ['HR', 'DIREKTUR', 'OPERASIONAL', 'SUPERADMIN'];

function totalOf(json) {
  if (!json) return 0;
  const r = json;
  return r.pagination?.total ?? r.total ?? r.meta?.total ?? (Array.isArray(r.data) ? r.data.length : 0) ?? 0;
}

/**
 * ViewModel untuk badge di sidebar (pengajuan cuti/izin).
 *
 * @param {string} role - role user, ex: 'HR', 'OPERASIONAL'
 */
export default function useSidebarBadgesViewModel(role) {
  const canSee = ROLE_CAN_SEE.includes(role);

  const keyCuti = canSee ? ApiEndpoints.GetPengajuanCutiMobile({ status: 'pending', page: 1, perPage: 1 }) : null;

  const keyIzinJam = canSee ? ApiEndpoints.GetPengajuanIzinJamMobile({ status: 'pending', page: 1, perPage: 1 }) : null;

  const keyTukarHari = canSee ? ApiEndpoints.GetPengajuanTukarHariMobile({ status: 'pending', page: 1, perPage: 1 }) : null;

  const keyIzinSakit = canSee ? ApiEndpoints.GetPengajuanIzinSakitMobile({ status: 'pending', page: 1, perPage: 1 }) : null;

  const { data: resCuti } = useSWR(keyCuti, fetcher, {
    revalidateOnFocus: true,
    refreshInterval: 60000,
  });

  const { data: resIzinJam } = useSWR(keyIzinJam, fetcher, {
    revalidateOnFocus: true,
    refreshInterval: 60000,
  });

  const { data: resTukarHari } = useSWR(keyTukarHari, fetcher, {
    revalidateOnFocus: true,
    refreshInterval: 60000,
  });

  const { data: resIzinSakit } = useSWR(keyIzinSakit, fetcher, {
    revalidateOnFocus: true,
    refreshInterval: 60000,
  });

  const counts = useMemo(() => {
    if (!canSee) {
      return { cuti: 0, izinJam: 0, tukarHari: 0, sakit: 0, total: 0 };
    }

    const cuti = totalOf(resCuti);
    const izinJam = totalOf(resIzinJam);
    const tukarHari = totalOf(resTukarHari);
    const sakit = totalOf(resIzinSakit);

    return {
      cuti,
      izinJam,
      tukarHari,
      sakit,
      total: cuti + izinJam + tukarHari + sakit,
    };
  }, [canSee, resCuti, resIzinJam, resTukarHari, resIzinSakit]);

  return {
    counts,
    hasAnyPending: counts.total > 0,
  };
}
