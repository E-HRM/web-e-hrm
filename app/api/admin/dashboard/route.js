import { NextResponse } from 'next/server';
import db from '@/lib/prisma';
import { verifyAuthToken } from '@/lib/jwt';
import { authenticateRequest } from '@/app/utils/auth/authUtils';

// --- UTILITIES & HELPERS ---

/**
 * Memastikan permintaan diautentikasi.
 * @param {Request} req - Objek permintaan.
 * @returns {Promise<boolean|NextResponse>} - True jika terautentikasi, atau NextResponse jika gagal.
 */
async function ensureAuth(req) {
  // Coba validasi token Bearer kustom terlebih dahulu
  const auth = req.headers.get('authorization') || '';
  if (auth.startsWith('Bearer ')) {
    try {
      verifyAuthToken(auth.slice(7));
      return true;
    } catch (_) {
      // Jika gagal, lanjutkan ke autentikasi NextAuth
    }
  }
  // Fallback ke metode autentikasi sesi NextAuth
  const sessionOrRes = await authenticateRequest();
  if (sessionOrRes instanceof NextResponse) return sessionOrRes;
  return true;
}

// Konstanta untuk memetakan hari dan metadata kalender
const DAY_LABELS = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
const PERFORMANCE_TABS = [
  { key: 'onTime', label: 'Tepat Waktu' },
  { key: 'late', label: 'Terlambat' },
  { key: 'absent', label: 'Tidak/belum hadir' },
  { key: 'autoOut', label: 'Presensi Keluar Otomatis' },
  { key: 'leave', label: 'Cuti' },
  { key: 'permit', label: 'Izin' },
];
const CALENDAR_TYPE_META = {
  cuti: { color: 'bg-emerald-500', label: 'Cuti' },
  sakit: { color: 'bg-rose-500', label: 'Sakit' },
  izin: { color: 'bg-amber-500', label: 'Izin' },
};
const ONE_DAY_MS = 24 * 60 * 60 * 1000;

// --- FUNGSI LOGIKA BISNIS ---

/**
 * Mengonversi tanggal ke UTC awal hari (00:00:00.000).
 * @param {Date|string} date - Tanggal input.
 * @returns {Date} - Objek Date di UTC awal hari.
 */
function toUtcStart(date) {
  const d = new Date(date);
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}

/**
 * Mengonversi tanggal ke UTC akhir hari (23:59:59.999).
 * @param {Date|string} date - Tanggal input.
 * @returns {Date} - Objek Date di UTC akhir hari.
 */
function toUtcEnd(date) {
  const end = toUtcStart(date);
  end.setUTCHours(23, 59, 59, 999);
  return end;
}

/**
 * Menggabungkan tanggal dan waktu menjadi satu objek Date UTC.
 * @param {Date} date - Tanggal dasar.
 * @param {Date|string} timeValue - Nilai waktu.
 * @returns {Date|null} - Objek Date gabungan atau null.
 */
function combineDateTime(date, timeValue) {
  if (!date || !timeValue) return null;
  const base = new Date(date);
  const time = new Date(timeValue);
  return new Date(Date.UTC(base.getUTCFullYear(), base.getUTCMonth(), base.getUTCDate(), time.getUTCHours(), time.getUTCMinutes(), time.getUTCSeconds()));
}

/**
 * Mencari shift kerja yang aktif untuk seorang user pada tanggal tertentu.
 * @param {Array} shifts - Daftar shift milik user.
 * @param {Date} date - Tanggal target.
 * @returns {Object|null} - Objek shift yang aktif atau null.
 */
function findShiftForDate(shifts, date) {
  if (!Array.isArray(shifts)) return null;
  const target = toUtcStart(date);
  // Cari shift yang paling spesifik (dengan tanggal mulai) terlebih dahulu
  for (const shift of shifts) {
    const start = shift.tanggal_mulai ? toUtcStart(shift.tanggal_mulai) : null;
    if (start && start <= target) {
      const end = shift.tanggal_selesai ? toUtcStart(shift.tanggal_selesai) : null;
      if (!end || end >= target) {
        return shift;
      }
    }
  }
  // Fallback ke shift umum (tanpa tanggal mulai)
  for (const shift of shifts) {
    if (!shift.tanggal_mulai) {
      return shift;
    }
  }
  return null;
}

/**
 * Memformat durasi dari total menit menjadi string "X jam Y menit".
 * @param {number} totalMinutes - Total menit.
 * @returns {string} - String yang diformat.
 */
function formatDurationFromMinutes(totalMinutes) {
  const minutes = Math.max(0, Math.round(totalMinutes || 0));
  if (minutes === 0) return '0 menit';
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  const parts = [];
  if (hours > 0) parts.push(`${hours} jam`);
  if (mins > 0) parts.push(`${mins} menit`);
  return parts.join(' ');
}

/**
 * Membangun objek event untuk kalender mini dari data cuti.
 * @param {Array} leaves - Daftar data cuti.
 * @param {number} year - Tahun.
 * @param {number} monthIndex - Indeks bulan.
 * @returns {Object} - Objek event yang dipetakan per hari.
 */
function buildCalendarEvents(leaves, year, monthIndex) {
  const events = {};
  if (!Array.isArray(leaves)) return events;

  const monthStart = new Date(Date.UTC(year, monthIndex, 1));
  const monthEnd = new Date(Date.UTC(year, monthIndex + 1, 0));

  for (const leave of leaves) {
    const start = toUtcStart(leave.tanggal_mulai);
    const end = toUtcStart(leave.tanggal_selesai);

    for (let d = new Date(start); d <= end; d.setUTCDate(d.getUTCDate() + 1)) {
      if (d >= monthStart && d <= monthEnd) {
        const day = d.getUTCDate();
        if (!events[day]) {
          events[day] = { names: [], counts: {} };
        }
        const type = leave.keterangan || 'cuti';
        events[day].names.push(leave.user.nama_pengguna);
        events[day].counts[type] = (events[day].counts[type] || 0) + 1;
      }
    }
  }

  // Proses data agregat menjadi format UI
  for (const day in events) {
    const info = events[day];
    const dominantType = Object.keys(info.counts).reduce((a, b) => (info.counts[a] > info.counts[b] ? a : b));
    const meta = CALENDAR_TYPE_META[dominantType] || { color: 'bg-slate-400' };

    const tipParts = Object.entries(info.counts).map(([type, count]) => {
      const label = CALENDAR_TYPE_META[type]?.label || type;
      return `${count} ${label}`;
    });

    events[day] = {
      color: meta.color,
      tip: tipParts.join(', '),
    };
  }

  return events;
}

/**
 * Membangun data peringkat keterlambatan dan kedisiplinan.
 * @param {Array} attendanceRecords - Catatan absensi.
 * @param {Map} shiftsByUser - Peta shift per user.
 * @returns {Object} - Objek berisi `topLate` dan `topDiscipline`.
 */
function buildTopRankings(attendanceRecords, shiftsByUser) {
  const metrics = new Map();

  for (const record of attendanceRecords) {
    const { user } = record;
    if (!user) continue;

    if (!metrics.has(user.id_user)) {
      metrics.set(user.id_user, {
        userId: user.id_user,
        name: user.nama_pengguna,
        division: user.departement?.nama_departement || '-',
        lateCount: 0,
        totalLateMinutes: 0,
        attendanceCount: 0,
      });
    }

    const userMetric = metrics.get(user.id_user);
    userMetric.attendanceCount++;

    const shift = findShiftForDate(shiftsByUser.get(user.id_user) || [], record.tanggal);
    if (record.status_masuk === 'terlambat' && shift?.polaKerja) {
      userMetric.lateCount++;
      const scheduledStart = combineDateTime(record.tanggal, shift.polaKerja.jam_mulai);
      const actualStart = new Date(record.jam_masuk);
      if (scheduledStart && actualStart > scheduledStart) {
        const lateMillis = actualStart.getTime() - scheduledStart.getTime();
        userMetric.totalLateMinutes += Math.round(lateMillis / 60000);
      }
    }
  }

  const allUsers = Array.from(metrics.values());

  const topLate = allUsers
    .filter((u) => u.lateCount > 0)
    .sort((a, b) => b.lateCount - a.lateCount || b.totalLateMinutes - a.totalLateMinutes)
    .slice(0, 5)
    .map((item, i) => ({
      rank: i + 1,
      userId: item.userId,
      name: item.name,
      division: item.division,
      count: `${item.lateCount} kali`,
      duration: formatDurationFromMinutes(item.totalLateMinutes),
    }));

  const topDiscipline = allUsers
    .map((item) => ({
      ...item,
      score: item.attendanceCount > 0 ? ((item.attendanceCount - item.lateCount) / item.attendanceCount) * 100 : 0,
    }))
    .sort((a, b) => b.score - a.score || b.attendanceCount - a.attendanceCount)
    .slice(0, 5)
    .map((item, i) => ({
      rank: i + 1,
      userId: item.userId,
      name: item.name,
      division: item.division,
      score: `${item.score.toFixed(0)}%`,
    }));

  return { topLate, topDiscipline };
}

// --- API HANDLER ---

export async function GET(req) {
  const auth = await ensureAuth(req);
  if (auth instanceof NextResponse) return auth;

  try {
    const { searchParams } = new URL(req.url);
    const now = new Date();

    // --- Pengambilan Parameter & Penentuan Rentang Tanggal ---
    const divisionId = searchParams.get('divisionId') || null;
    const calendarYear = parseInt(searchParams.get('calendarYear') || now.getFullYear(), 10);
    const calendarMonth = parseInt(searchParams.get('calendarMonth') || now.getMonth(), 10);

    // Rentang tanggal untuk berbagai keperluan
    const todayStart = toUtcStart(now);
    const todayEnd = toUtcEnd(now);
    const chartRangeStart = toUtcStart(new Date(now.getTime() - 6 * ONE_DAY_MS));
    const calendarRangeStart = new Date(Date.UTC(calendarYear, calendarMonth, 1));
    const calendarRangeEnd = toUtcEnd(new Date(Date.UTC(calendarYear, calendarMonth + 1, 0)));
    const thisMonthStart = toUtcStart(new Date(now.getFullYear(), now.getMonth(), 1));
    const lastMonthStart = toUtcStart(new Date(now.getFullYear(), now.getMonth() - 1, 1));
    const lastMonthEnd = toUtcEnd(new Date(now.getFullYear(), now.getMonth(), 0));

    // --- Query Database Paralel ---
    const [
      // Statistik utama
      totalKaryawan,
      totalDivisi,
      totalLokasi,
      totalPolaKerja,
      totalAdmin,
      // Data untuk grafik & list
      divisions,
      miniBarRaw,
      chartAttendance,
      leaveToday,
      // Data untuk peringkat Top 5
      topThisMonthAttendance,
      topLastMonthAttendance,
      // Data Kalender
      calendarLeaves,
      // Statistik Izin
      permitStats,
    ] = await db.$transaction([
      // Menghitung data untuk kartu statistik
      db.user.count({ where: { status_kerja: 'AKTIF', deleted_at: null } }),
      db.departement.count({ where: { deleted_at: null } }),
      db.location.count({ where: { deleted_at: null } }),
      db.polaKerja.count({ where: { deleted_at: null } }),
      db.user.count({ where: { role: { in: ['HR', 'SUPERADMIN', 'DIREKTUR'] }, deleted_at: null } }),

      // Mengambil daftar divisi untuk filter
      db.departement.findMany({
        where: { deleted_at: null },
        select: { id_departement: true, nama_departement: true },
        orderBy: { nama_departement: 'asc' },
      }),
      // Data untuk grafik mini (total karyawan per divisi)
      db.user.groupBy({
        by: ['id_departement'],
        where: { status_kerja: 'AKTIF', deleted_at: null },
        _count: { id_user: true },
        orderBy: { _count: { id_user: 'desc' } },
        take: 5,
      }),
      // Absensi untuk grafik utama (7 hari terakhir)
      db.absensi.findMany({
        where: {
          tanggal: { gte: chartRangeStart, lte: todayEnd },
          deleted_at: null,
          ...(divisionId && { user: { id_departement: divisionId } }),
        },
        select: { id_user: true, tanggal: true, jam_masuk: true, jam_pulang: true },
      }),
      // Karyawan yang cuti/izin hari ini
      db.cuti.findMany({
        where: {
          status: 'disetujui',
          tanggal_mulai: { lte: todayEnd },
          tanggal_selesai: { gte: todayStart },
          deleted_at: null,
        },
        include: { user: { select: { nama_pengguna: true } } },
      }),
      // Absensi untuk peringkat bulan ini
      db.absensi.findMany({
        where: { tanggal: { gte: thisMonthStart, lte: todayEnd }, deleted_at: null },
        include: { user: { select: { id_user: true, nama_pengguna: true, departement: { select: { nama_departement: true } } } } },
      }),
      // Absensi untuk peringkat bulan lalu
      db.absensi.findMany({
        where: { tanggal: { gte: lastMonthStart, lte: lastMonthEnd }, deleted_at: null },
        include: { user: { select: { id_user: true, nama_pengguna: true, departement: { select: { nama_departement: true } } } } },
      }),
      // Data cuti/izin untuk kalender
      db.cuti.findMany({
        where: {
          status: 'disetujui',
          tanggal_mulai: { lte: calendarRangeEnd },
          tanggal_selesai: { gte: calendarRangeStart },
          deleted_at: null,
        },
        select: { tanggal_mulai: true, tanggal_selesai: true, keterangan: true, user: { select: { nama_pengguna: true } } },
      }),
      // Menghitung total izin yang disetujui
      db.cuti.count({ where: { keterangan: 'izin', status: 'disetujui', deleted_at: null } }),
    ]);

    // --- Pengolahan Data ---

    // Mengumpulkan semua ID user untuk mengambil data shift kerja secara efisien
    const userIdSet = new Set();
    [...chartAttendance, ...topThisMonthAttendance, ...topLastMonthAttendance].forEach((rec) => {
      if (rec.id_user) userIdSet.add(rec.id_user);
    });

    // Mengambil semua shift yang relevan untuk user yang terkumpul
    const shiftRecords =
      userIdSet.size > 0
        ? await db.shiftKerja.findMany({
            where: {
              id_user: { in: [...userIdSet] },
              status: 'KERJA',
              deleted_at: null,
            },
            include: { polaKerja: { select: { jam_mulai: true, jam_selesai: true } } },
            orderBy: { tanggal_mulai: 'desc' },
          })
        : [];

    const shiftsByUser = new Map();
    shiftRecords.forEach((shift) => {
      if (!shiftsByUser.has(shift.id_user)) shiftsByUser.set(shift.id_user, []);
      shiftsByUser.get(shift.id_user).push(shift);
    });

    // Memproses data untuk grafik mini
    const departementNameMap = new Map(divisions.map((d) => [d.id_departement, d.nama_departement]));
    const miniBars = miniBarRaw.map((item) => ({
      label: departementNameMap.get(item.id_departement) || 'Lainnya',
      value: item._count.id_user,
    }));

    // Memproses data untuk grafik utama (akumulasi keterlambatan)
    const chartDayBuckets = new Map();
    for (let i = 0; i < 7; i++) {
      const date = new Date(chartRangeStart.getTime() + i * ONE_DAY_MS);
      chartDayBuckets.set(date.toISOString().slice(0, 10), {
        name: DAY_LABELS[date.getUTCDay()],
        Kedatangan: 0,
        Kepulangan: 0,
      });
    }

    for (const record of chartAttendance) {
      const key = record.tanggal.toISOString().slice(0, 10);
      if (chartDayBuckets.has(key)) {
        const bucket = chartDayBuckets.get(key);
        const shift = findShiftForDate(shiftsByUser.get(record.id_user) || [], record.tanggal);
        if (shift?.polaKerja) {
          const scheduledStart = combineDateTime(record.tanggal, shift.polaKerja.jam_mulai);
          const scheduledEnd = combineDateTime(record.tanggal, shift.polaKerja.jam_selesai);
          if (scheduledStart && record.jam_masuk > scheduledStart) {
            bucket.Kedatangan += Math.round((record.jam_masuk.getTime() - scheduledStart.getTime()) / 60000);
          }
          if (scheduledEnd && record.jam_pulang && record.jam_pulang < scheduledEnd) {
            bucket.Kepulangan += Math.round((scheduledEnd.getTime() - record.jam_pulang.getTime()) / 60000);
          }
        }
      }
    }
    const chartData = Array.from(chartDayBuckets.values());

    // Memproses data peringkat Top 5
    const top5ThisMonth = buildTopRankings(topThisMonthAttendance, shiftsByUser);
    const top5LastMonth = buildTopRankings(topLastMonthAttendance, shiftsByUser);

    // --- Membangun Respons Akhir ---
    const divisionOptions = divisions.map((d) => ({ label: d.nama_departement, value: d.id_departement }));

    return NextResponse.json({
      // Data Header & Statistik
      tanggalTampilan: now.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }),
      totalKaryawan,
      totalDivisi,
      statCards: {
        // Data untuk kartu statistik yang sebelumnya hardcoded
        lokasi: totalLokasi,
        presensi: await db.absensi.count({ where: { deleted_at: null } }), // Dihitung ulang untuk akurasi
        admin: totalAdmin,
        polaKerja: totalPolaKerja,
        izin: permitStats,
      },
      // Grafik Mini & Utama
      miniBars,
      chartData,
      // Daftar Karyawan Cuti
      onLeaveCount: leaveToday.length,
      leaveList: leaveToday.map((l) => ({ name: l.user.nama_pengguna })), // Disederhanakan sesuai UI
      // Filter Divisi
      divisionOptions,
      // Peringkat Top 5
      top5Late: { this: top5ThisMonth.topLate, last: top5LastMonth.topLate },
      top5Discipline: { this: top5ThisMonth.topDiscipline, last: top5LastMonth.topDiscipline },
      // Kalender
      calendar: {
        year: calendarYear,
        month: calendarMonth,
        eventsByDay: buildCalendarEvents(calendarLeaves, calendarYear, calendarMonth),
      },
      // Data untuk halaman Performa (bisa di-fetch terpisah atau digabung jika diperlukan)
      perfTabs: PERFORMANCE_TABS,
      perfDivisionOptions: [{ label: '--Semua Divisi--', value: '' }, ...divisionOptions],
    });
  } catch (err) {
    console.error('GET /api/admin/dashboard error:', err);
    // Memberikan pesan error yang lebih informatif saat development
    const errorMessage = process.env.NODE_ENV === 'development' ? err.message : 'Terjadi kesalahan pada server.';
    return NextResponse.json({ message: errorMessage }, { status: 500 });
  }
}
