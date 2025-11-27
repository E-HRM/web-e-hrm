import { NextResponse } from 'next/server';
import db from '@/lib/prisma';
import { verifyAuthToken } from '@/lib/jwt';
import { authenticateRequest } from '@/app/utils/auth/authUtils';
import { endOfUTCDay, parseDateTimeToUTC, startOfUTCDay } from '@/helpers/date-helper';
import { resolveTargetUserAccess } from './access-control';
import { buildCutiCalendarItem, endOfDay, formatISO, startOfDay } from './calendar-utils';

// Helper sederhana untuk mengambil Jam:Menit dari DateTime UTC
function formatTimeOnly(dateObj) {
  if (!dateObj) return '';
  try {
    const d = new Date(dateObj);
    // Mengambil jam:menit dalam format lokal/UTC string pendek (HH:MM)
    return d.toISOString().substring(11, 16);
  } catch (e) {
    return '';
  }
}

async function ensureAuth(req) {
  const auth = req.headers.get('authorization') || '';
  if (auth.startsWith('Bearer ')) {
    try {
      const payload = verifyAuthToken(auth.slice(7));
      const id = payload?.sub || payload?.id_user || payload?.userId;
      if (id) return { actor: { id, role: payload?.role, source: 'bearer' } };
    } catch {}
  }
  const sessionOrRes = await authenticateRequest();
  if (sessionOrRes instanceof NextResponse) return sessionOrRes;
  const id = sessionOrRes?.user?.id || sessionOrRes?.user?.id_user;
  if (!id) return NextResponse.json({ message: 'Unauthorized.' }, { status: 401 });
  return { actor: { id, role: sessionOrRes?.user?.role, source: 'session', session: sessionOrRes } };
}

function toDateOrNull(value) {
  if (!value) return null;
  const parsed = parseDateTimeToUTC(value);
  return parsed ?? null;
}

function normalizeDateRange(fromRaw, toRaw) {
  const MIN_RANGE_DATE = startOfUTCDay('1970-01-01') ?? new Date(Date.UTC(1970, 0, 1));
  const MAX_RANGE_DATE = endOfUTCDay('2999-12-31') ?? new Date(Date.UTC(2999, 11, 31, 23, 59, 59, 999));

  const fromParsed = toDateOrNull(fromRaw);
  const toParsed = toDateOrNull(toRaw);

  return {
    from: fromParsed ? startOfDay(fromParsed) : MIN_RANGE_DATE,
    to: toParsed ? endOfDay(toParsed) : MAX_RANGE_DATE,
  };
}

function sortByStartAsc(items) {
  return items.sort((a, b) => {
    const aTime = a.start ? new Date(a.start).getTime() : 0;
    const bTime = b.start ? new Date(b.start).getTime() : 0;
    if (aTime === bTime) return (a.end ? new Date(a.end).getTime() : 0) - (b.end ? new Date(b.end).getTime() : 0);
    return aTime - bTime;
  });
}

export async function GET(request) {
  const auth = await ensureAuth(request);
  if (auth instanceof NextResponse) return auth;

  const actorId = String(auth.actor.id);

  try {
    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const perPage = Math.min(100, Math.max(1, parseInt(searchParams.get('perPage') || '20', 10)));

    const userIdFilter = (searchParams.get('user_id') || '').trim();
    const statusFilter = (searchParams.get('status') || '').trim().toLowerCase();
    const modeFilter = (searchParams.get('mode') || '').trim().toLowerCase();
    const wantsApprovedOnly = ['disetujui', 'approved'].includes(statusFilter) || ['approved', 'readonly', 'read'].includes(modeFilter);

    const { targetUserId, allowed, approvedOnly, crossUser } = resolveTargetUserAccess(auth.actor, userIdFilter, {
      allowApprovedRead: true,
      isApprovedOnly: wantsApprovedOnly,
    });

    if (!allowed && userIdFilter && userIdFilter !== actorId) {
      return NextResponse.json({ ok: false, message: 'Forbidden: tidak boleh mengakses detail tugas pengguna lain.' }, { status: 403 });
    }

    const fromRaw = searchParams.get('from');
    const toRaw = searchParams.get('to');
    const { from: rangeFrom, to: rangeTo } = normalizeDateRange(fromRaw, toRaw);

    // 1. STORY PLANNER: Tetap PERSONAL (Filter by targetUserId)
    const fetchStoryPlanners = approvedOnly
      ? Promise.resolve([])
      : db.storyPlanner.findMany({
          where: {
            deleted_at: null,
            id_user: targetUserId,
            count_time: {
              gte: rangeFrom,
              lte: rangeTo,
            },
          },
          select: {
            id_story: true,
            id_user: true,
            deskripsi_kerja: true,
            count_time: true,
            status: true,
            user: { select: { nama_pengguna: true } },
          },
        });

    // 2. SHIFT KERJA: GLOBAL (Semua User) & Include Pola Kerja
    const fetchShiftKerja = approvedOnly
      ? Promise.resolve([])
      : db.shiftKerja.findMany({
          where: {
            deleted_at: null,
            // id_user dihapus agar global
            tanggal_mulai: { lte: rangeTo },
            tanggal_selesai: { gte: rangeFrom },
          },
          select: {
            id_shift_kerja: true,
            id_user: true,
            hari_kerja: true,
            tanggal_mulai: true,
            tanggal_selesai: true,
            status: true,
            // Ambil nama user
            user: { select: { nama_pengguna: true } },
            // AMBIL POLA KERJA
            polaKerja: {
              select: {
                nama_pola_kerja: true,
                jam_mulai: true,
                jam_selesai: true,
              },
            },
          },
        });

    // Jalankan semua query secara paralel
    const results = await Promise.all([
      fetchStoryPlanners, // Index 0

      // 1. Cuti Approved ONLY (Draft DIHAPUS)
      db.pengajuanCuti.findMany({
        where: {
          deleted_at: null,
          status: 'disetujui',
          jenis_pengajuan: 'cuti',
          // id_user dihapus agar global
          tanggal_list: { some: { tanggal_cuti: { gte: rangeFrom, lte: rangeTo } } },
        },
        select: {
          id_pengajuan_cuti: true,
          id_user: true,
          keperluan: true,
          tanggal_list: { select: { tanggal_cuti: true } },
          user: { select: { nama_pengguna: true } },
        },
      }),

      // 2. Izin Sakit (Disetujui Only)
      db.pengajuanIzinSakit.findMany({
        where: {
          deleted_at: null,
          status: 'disetujui',
          jenis_pengajuan: 'sakit',
          // id_user dihapus agar global
          OR: [{ tanggal_pengajuan: { gte: rangeFrom, lte: rangeTo } }, { AND: [{ tanggal_pengajuan: null }, { created_at: { gte: rangeFrom, lte: rangeTo } }] }],
        },
        select: {
          id_pengajuan_izin_sakit: true,
          id_user: true,
          handover: true,
          tanggal_pengajuan: true,
          created_at: true,
          user: { select: { nama_pengguna: true } },
        },
      }),

      // 3. Izin Jam (Disetujui Only)
      db.pengajuanIzinJam.findMany({
        where: {
          deleted_at: null,
          status: 'disetujui',
          jenis_pengajuan: 'jam',
          // id_user dihapus agar global
          jam_mulai: { lte: rangeTo },
          jam_selesai: { gte: rangeFrom },
        },
        select: {
          id_pengajuan_izin_jam: true,
          id_user: true,
          keperluan: true,
          tanggal_izin: true,
          jam_mulai: true,
          jam_selesai: true,
          user: { select: { nama_pengguna: true } },
        },
      }),

      fetchShiftKerja, // Index 4
    ]);

    const _storyPlanners = results[0];
    const _cutiApproved = results[1];
    const _sakit = results[2];
    const _jam = results[3];
    const _shifts = results[4];

    const calendarItems = [];

    // --- MAPPING ---

    // Story Planner
    for (const item of _storyPlanners) {
      const dateVal = item.count_time || new Date();
      const when = dateVal instanceof Date ? dateVal : new Date(dateVal);

      calendarItems.push({
        type: 'story_planner',
        id: item.id_story,
        user_id: item.id_user,
        user_name: item.user?.nama_pengguna,
        title: item.deskripsi_kerja || 'Story Planner',
        description: item.deskripsi_kerja || null,
        status: item.status,
        start: formatISO(when),
        end: formatISO(when),
      });
    }

    // Cuti Approved
    for (const item of _cutiApproved) {
      const cutiItem = buildCutiCalendarItem(item, rangeFrom, rangeTo);
      if (cutiItem) {
        cutiItem.user_name = item.user?.nama_pengguna;
        cutiItem.title = `${item.user?.nama_pengguna ? item.user.nama_pengguna + ' - ' : ''}Cuti`;
        calendarItems.push(cutiItem);
      }
    }

    // Izin Sakit
    for (const item of _sakit) {
      const startDate = item.tanggal_pengajuan || item.created_at;
      calendarItems.push({
        type: 'izin_sakit',
        id: item.id_pengajuan_izin_sakit,
        user_id: item.id_user,
        user_name: item.user?.nama_pengguna,
        title: `${item.user?.nama_pengguna ? item.user.nama_pengguna + ' - ' : ''}Sakit`,
        description: item.handover || null,
        start: formatISO(startOfDay(startDate)),
        end: formatISO(endOfDay(startDate)),
      });
    }

    // Izin Jam
    for (const item of _jam) {
      const startDate = item.jam_mulai;
      const endDate = item.jam_selesai;
      calendarItems.push({
        type: 'izin_jam',
        id: item.id_pengajuan_izin_jam,
        user_id: item.id_user,
        user_name: item.user?.nama_pengguna,
        title: `${item.user?.nama_pengguna ? item.user.nama_pengguna + ' - ' : ''}Izin Jam`,
        description: item.keperluan || null,
        start: formatISO(startDate),
        end: formatISO(endDate),
      });
    }

    // Shift Kerja (DENGAN POLA KERJA)
    for (const shift of _shifts) {
      const namaUser = shift.user?.nama_pengguna || 'Karyawan';
      const pola = shift.polaKerja;

      // Buat deskripsi jam kerja
      let shiftDesc = shift.status || '';
      if (pola) {
        const jamMasuk = formatTimeOnly(pola.jam_mulai);
        const jamPulang = formatTimeOnly(pola.jam_selesai);
        shiftDesc += ` (${pola.nama_pola_kerja}: ${jamMasuk}-${jamPulang})`;
      }

      calendarItems.push({
        type: 'shift_kerja',
        id: shift.id_shift_kerja,
        user_id: shift.id_user,
        user_name: namaUser,
        title: `${namaUser} - ${shift.hari_kerja || 'Shift'}`,
        description: shiftDesc,
        start: formatISO(startOfDay(shift.tanggal_mulai)),
        end: formatISO(endOfDay(shift.tanggal_selesai)),
        pola_kerja: pola
          ? {
              name: pola.nama_pola_kerja,
              start_time: formatISO(pola.jam_mulai),
              end_time: formatISO(pola.jam_selesai),
            }
          : null,
      });
    }

    if (approvedOnly && crossUser) {
      const approvedStatus = ['disetujui', 'approved'];
      const filtered = calendarItems.filter((item) => {
        if (item.status) return approvedStatus.includes(String(item.status).toLowerCase());
        return ['izin_jam', 'izin_sakit', 'cuti', 'shift_kerja'].includes(item.type);
      });
      calendarItems.length = 0;
      calendarItems.push(...filtered);
    }

    sortByStartAsc(calendarItems);

    const total = calendarItems.length;
    const startIndex = (page - 1) * perPage;
    const data = calendarItems.slice(startIndex, startIndex + perPage);

    return NextResponse.json({
      ok: true,
      data,
      meta: {
        page,
        perPage,
        total,
        totalPages: Math.ceil(total / perPage),
      },
    });
  } catch (err) {
    console.error('GET /mobile/calendar error:', err);
    return NextResponse.json({ ok: false, message: 'Failed to fetch calendar data.' }, { status: 500 });
  }
}
