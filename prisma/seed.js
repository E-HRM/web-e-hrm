const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Daftar template notifikasi default
const notificationTemplates = [
  // --- Notifikasi Wajah (BARU) ---
  {
    eventTrigger: 'FACE_REGISTRATION_SUCCESS',
    description: 'Konfirmasi saat karyawan berhasil mendaftarkan wajah',
    titleTemplate: '✅ Wajah Berhasil Terdaftar',
    bodyTemplate: 'Halo {nama_karyawan}, wajah Anda telah berhasil terdaftar pada sistem E-HRM. Anda kini dapat menggunakan fitur absensi wajah.',
    placeholders: '{nama_karyawan}',
  },

  // --- Shift Kerja ---
  {
    eventTrigger: 'NEW_SHIFT_PUBLISHED',
    description: 'Info saat jadwal shift baru diterbitkan untuk karyawan',
    titleTemplate: '📄 Jadwal Shift Baru Telah Terbit',
    bodyTemplate: 'Jadwal shift kerja Anda untuk periode {periode_mulai} - {periode_selesai} telah tersedia. Silakan periksa.',
    placeholders: '{nama_karyawan}, {periode_mulai}, {periode_selesai}',
  },
  {
    eventTrigger: 'SHIFT_UPDATED',
    description: 'Info saat ada perubahan pada jadwal shift karyawan',
    titleTemplate: '🔄 Perubahan Jadwal Shift',
    bodyTemplate: 'Perhatian, shift Anda pada tanggal {tanggal_shift} diubah menjadi {nama_shift} ({jam_masuk} - {jam_pulang}).',
    placeholders: '{nama_karyawan}, {tanggal_shift}, {nama_shift}, {jam_masuk}, {jam_pulang}',
  },
  {
    eventTrigger: 'SHIFT_REMINDER_H1',
    description: 'Pengingat H-1 sebelum jadwal shift karyawan',
    titleTemplate: '📢 Pengingat Shift Besok',
    bodyTemplate: 'Jangan lupa, besok Anda masuk kerja pada shift {nama_shift} pukul {jam_masuk}.',
    placeholders: '{nama_karyawan}, {nama_shift}, {jam_masuk}',
  },

  // --- Absensi (BARU) ---
  {
    eventTrigger: 'SUCCESS_CHECK_IN',
    description: 'Konfirmasi saat karyawan berhasil melakukan check-in, menyertakan status (tepat/terlambat)',
    titleTemplate: '✅ Check-in Berhasil',
    bodyTemplate: 'Absensi masuk Anda telah tercatat pada {jam_masuk} dengan status: {status_absensi}.',
    placeholders: '{jam_masuk}, {status_absensi}, {nama_karyawan}',
  },
  {
    eventTrigger: 'SUCCESS_CHECK_OUT',
    description: 'Konfirmasi saat karyawan berhasil melakukan check-out',
    titleTemplate: '👋 Sampai Jumpa!',
    bodyTemplate: 'Absensi pulang Anda telah tercatat pada {jam_pulang}. Total durasi kerja Anda: {total_jam_kerja}.',
    placeholders: '{jam_pulang}, {total_jam_kerja}, {nama_karyawan}',
  },

  // --- Agenda Kerja ---
  {
    eventTrigger: 'NEW_AGENDA_ASSIGNED',
    description: 'Notifikasi saat karyawan diberikan agenda kerja baru',
    titleTemplate: '✍️ Agenda Kerja Baru',
    bodyTemplate: 'Anda mendapatkan tugas baru: "{judul_agenda}". Batas waktu pengerjaan hingga {tanggal_deadline}.',
    placeholders: '{nama_karyawan}, {judul_agenda}, {tanggal_deadline}, {pemberi_tugas}',
  },
  {
    eventTrigger: 'AGENDA_REMINDER_H1',
    description: 'Pengingat H-1 sebelum deadline agenda kerja',
    titleTemplate: '🔔 Pengingat Agenda Kerja',
    bodyTemplate: 'Jangan lupa, agenda "{judul_agenda}" akan jatuh tempo besok. Segera perbarui statusnya.',
    placeholders: '{nama_karyawan}, {judul_agenda}',
  },
  {
    eventTrigger: 'AGENDA_OVERDUE',
    description: 'Notifikasi saat agenda kerja melewati batas waktu',
    titleTemplate: '⏰ Agenda Melewati Batas Waktu',
    bodyTemplate: 'Perhatian, agenda kerja "{judul_agenda}" telah melewati batas waktu pengerjaan.',
    placeholders: '{nama_karyawan}, {judul_agenda}',
  },
  {
    eventTrigger: 'AGENDA_COMMENTED',
    description: 'Notifikasi saat atasan/rekan memberi komentar pada agenda',
    titleTemplate: '💬 Komentar Baru pada Agenda',
    bodyTemplate: '{nama_komentator} memberikan komentar pada agenda "{judul_agenda}". Silakan periksa detailnya.',
    placeholders: '{nama_karyawan}, {judul_agenda}, {nama_komentator}',
  },

  {
    eventTrigger: 'LEAVE_HANDOVER_TAGGED',
    description: 'Notifikasi saat user ditandai sebagai handover pengajuan cuti',
    titleTemplate: '📆 Pengalihan Cuti dari {nama_pemohon}',
    bodyTemplate: '{nama_penerima}, {nama_pemohon} menandai Anda sebagai handover cuti {kategori_cuti} mulai {tanggal_mulai_display} hingga masuk kembali {tanggal_masuk_kerja_display}.',
    placeholders: '{nama_penerima}, {nama_pemohon}, {kategori_cuti}, {tanggal_mulai}, {tanggal_mulai_display}, {tanggal_masuk_kerja}, {tanggal_masuk_kerja_display}, {keperluan}, {handover}',
  },

  {
    eventTrigger: 'IZIN_SAKIT_HANDOVER_TAGGED',
    description: 'Notifikasi saat pengajuan izin sakit dibuat dan handover/pihak terkait perlu diberi tahu',
    titleTemplate: '🩺 Pengajuan Izin Sakit {nama_pemohon}',
    bodyTemplate: 'Halo {nama_penerima}, {pesan_penerima} Pengajuan izin sakit {kategori_sakit} dari {nama_pemohon}. Status saat ini: {status_display}. Catatan handover: {catatan_handover}.',
    placeholders: '{nama_penerima}, {pesan_penerima}, {nama_pemohon}, {kategori_sakit}, {catatan_handover}, {status}, {status_display}, {current_level}, {lampiran_izin_sakit_url}',
  },

  {
    eventTrigger: 'IZIN_JAM_HANDOVER_TAGGED',
    description: 'Notifikasi saat user ditandai terkait pengajuan izin jam',
    titleTemplate: '⏱️ Pengalihan Izin Jam dari {nama_pemohon}',
    bodyTemplate: '{nama_penerima}, {nama_pemohon} menandai Anda sebagai handover izin jam {kategori_izin} pada {tanggal_izin_display} pukul {jam_mulai_display} - {jam_selesai_display}.',
    placeholders: '{nama_penerima}, {nama_pemohon}, {kategori_izin}, {tanggal_izin}, {tanggal_izin_display}, {jam_mulai}, {jam_mulai_display}, {jam_selesai}, {jam_selesai_display}, {keperluan}, {handover}',
  },

  // --- Kunjungan Klien (Dipertahankan dari List Awal karena Unik) ---
  {
    eventTrigger: 'NEW_CLIENT_VISIT_ASSIGNED',
    description: 'Notifikasi saat karyawan mendapatkan jadwal kunjungan klien baru',
    titleTemplate: '🗓️ Kunjungan Klien Baru',
    bodyTemplate: 'Anda dijadwalkan untuk kunjungan {kategori_kunjungan} pada {tanggal_kunjungan_display} {rentang_waktu_display}. Mohon persiapkan kebutuhan kunjungan.',
    placeholders: '{nama_karyawan}, {kategori_kunjungan}, {tanggal_kunjungan}, {tanggal_kunjungan_display}, {rentang_waktu_display}',
  },
  {
    eventTrigger: 'CLIENT_VISIT_UPDATED',
    description: 'Notifikasi saat detail kunjungan klien diperbarui',
    titleTemplate: 'ℹ️ Pembaruan Kunjungan Klien',
    bodyTemplate: 'Detail kunjungan {kategori_kunjungan} pada {tanggal_kunjungan_display} telah diperbarui. Status terbaru: {status_kunjungan_display}.',
    placeholders: '{nama_karyawan}, {kategori_kunjungan}, {tanggal_kunjungan_display}, {status_kunjungan_display}',
  },
  {
    eventTrigger: 'CLIENT_VISIT_REMINDER_END',
    description: 'Pengingat saat kunjungan klien mendekati waktu selesai',
    titleTemplate: '⏳ Kunjungan Klien Hampir Selesai',
    bodyTemplate: 'Kunjungan {kategori_kunjungan} pada {tanggal_kunjungan_display} akan berakhir pada {waktu_selesai_display}. Mohon lengkapi laporan kunjungan.',
    placeholders: '{nama_karyawan}, {kategori_kunjungan}, {tanggal_kunjungan_display}, {waktu_selesai_display}',
  },
  {
    eventTrigger: 'CLIENT_VISIT_CANCELLED',
    description: 'Notifikasi saat kunjungan klien dibatalkan atau diarsipkan',
    titleTemplate: '❌ Kunjungan Klien Dibatalkan',
    bodyTemplate: 'Kunjungan {kategori_kunjungan} pada {tanggal_kunjungan_display} telah dibatalkan. Silakan hubungi admin bila membutuhkan informasi lanjutan.',
    placeholders: '{nama_karyawan}, {kategori_kunjungan}, {tanggal_kunjungan_display}',
  },
  {
    eventTrigger: 'CLIENT_VISIT_DELETED',
    description: 'Notifikasi saat kunjungan klien dihapus permanen',
    titleTemplate: '🗑️ Kunjungan Klien Dihapus',
    bodyTemplate: 'Kunjungan {kategori_kunjungan} pada {tanggal_kunjungan_display} telah dihapus oleh admin.',
    placeholders: '{nama_karyawan}, {kategori_kunjungan}, {tanggal_kunjungan_display}',
  },

  // --- Istirahat ---
  {
    eventTrigger: 'SUCCESS_START_BREAK',
    description: 'Konfirmasi saat karyawan memulai istirahat',
    titleTemplate: '☕ Istirahat Dimulai',
    bodyTemplate: 'Anda memulai istirahat pada pukul {waktu_mulai_istirahat}. Selamat menikmati waktu istirahat Anda!',
    placeholders: '{nama_karyawan}, {waktu_mulai_istirahat}',
  },
  {
    eventTrigger: 'SUCCESS_END_BREAK',
    description: 'Konfirmasi saat karyawan mengakhiri istirahat',
    titleTemplate: '✅ Istirahat Selesai',
    bodyTemplate: 'Anda telah mengakhiri istirahat pada pukul {waktu_selesai_istirahat}. Selamat melanjutkan pekerjaan!',
    placeholders: '{nama_karyawan}, {waktu_selesai_istirahat}',
  },
  {
    eventTrigger: 'BREAK_TIME_EXCEEDED',
    description: 'Notifikasi jika durasi istirahat melebihi batas',
    titleTemplate: '❗ Waktu Istirahat Berlebih',
    bodyTemplate: 'Perhatian, durasi istirahat Anda telah melebihi batas maksimal {maks_jam_istirahat} menit yang ditentukan.',
    placeholders: '{nama_karyawan}, {maks_jam_istirahat}',
  },
];

const makeId = (n) => `00000000-0000-0000-0000-${String(n).padStart(12, '0')}`;

const IDS = {
  locationHq: makeId(1),
  departementHr: makeId(2),
  departementOps: makeId(3),
  jabatanManager: makeId(4),
  jabatanStaff: makeId(5),
  userSuperadmin: makeId(6),
  userHr: makeId(7),
  userKaryawan: makeId(8),
  polaKerjaReguler: makeId(9),
  shiftKerja1: makeId(10),
  agenda1: makeId(11),
  agendaKerja1: makeId(12),
  kategoriKunjungan1: makeId(13),
  kunjungan1: makeId(14),
  kunjunganReport1: makeId(15),
  broadcast1: makeId(16),
  broadcastRecipient1: makeId(17),
  broadcastAttachment1: makeId(18),
  face1: makeId(19),
  storyPlanner1: makeId(20),
  device1: makeId(21),
  absensi1: makeId(22),
  absensiReport1: makeId(23),
  catatan1: makeId(24),
  notification1: makeId(25),
  lembur1: makeId(26),
  lemburApproval1: makeId(27),
  jadwalStory1: makeId(28),
  shiftStory1: makeId(29),
  kategoriSakit1: makeId(30),
  kategoriIzinJam1: makeId(31),
  cutiKonfig1: makeId(32),
  kategoriCuti1: makeId(33),
  kategoriKeperluan1: makeId(34),
  pengajuanCuti1: makeId(35),
  pengajuanCutiTanggal1: makeId(36),
  approvalCuti1: makeId(37),
  pengajuanSakit1: makeId(38),
  approvalSakit1: makeId(39),
  pengajuanIzinJam1: makeId(40),
  approvalIzinJam1: makeId(41),
  izinTukarHari1: makeId(42),
  izinTukarHariPair1: makeId(43),
  approvalTukarHari1: makeId(44),
  handoverCuti1: makeId(45),
  handoverSakit1: makeId(46),
  handoverIzinJam1: makeId(47),
  handoverTukarHari1: makeId(48),
  reimburse1: makeId(49),
  reimburseItem1: makeId(50),
  pocketMoney1: makeId(51),
  pocketMoneyItem1: makeId(52),
  payment1: makeId(53),
  approvalReimburse1: makeId(54),
  approvalPayment1: makeId(55),
  approvalPocketMoney1: makeId(56),
  kategoriSop1: makeId(57),
  sop1: makeId(58),
  pinnedSop1: makeId(59),
  istirahat1: makeId(60),
  userKaryawan2: makeId(61),
  userKaryawan3: makeId(62),
  agenda2: makeId(63),
  agenda3: makeId(64),
  agenda4: makeId(65),
  kategoriKunjungan2: makeId(66),
  agendaKerjaWeek1: makeId(67),
  agendaKerjaWeek2: makeId(68),
  agendaKerjaWeek3: makeId(69),
  agendaKerjaWeek4: makeId(70),
  agendaKerjaWeek5: makeId(71),
  agendaKerjaWeek6: makeId(72),
  agendaKerjaWeek7: makeId(73),
  agendaKerjaWeek8: makeId(74),
  kunjunganWeek1: makeId(75),
  kunjunganWeek2: makeId(76),
  kunjunganWeek3: makeId(77),
  kunjunganWeek4: makeId(78),
  kunjunganWeek5: makeId(79),
  absensiWeek1: makeId(80),
  absensiWeek2: makeId(81),
  absensiWeek3: makeId(82),
  absensiWeek4: makeId(83),
  absensiWeek5: makeId(84),
  absensiWeek6: makeId(85),
  absensiWeek7: makeId(86),
  istirahatWeek1: makeId(87),
  istirahatWeek2: makeId(88),
  istirahatWeek3: makeId(89),
  istirahatWeek4: makeId(90),
  istirahatWeek5: makeId(91),
  istirahatWeek6: makeId(92),
  istirahatWeek7: makeId(93),
};

const dates = {
  day1: new Date('2026-02-01T00:00:00.000Z'),
  day1Start: new Date('2026-02-01T08:00:00.000Z'),
  day1End: new Date('2026-02-01T17:00:00.000Z'),
  day1BreakStart: new Date('2026-02-01T12:00:00.000Z'),
  day1BreakEnd: new Date('2026-02-01T12:30:00.000Z'),
  day2: new Date('2026-02-02T00:00:00.000Z'),
  day2Start: new Date('2026-02-02T09:00:00.000Z'),
  day2End: new Date('2026-02-02T18:00:00.000Z'),
  day3: new Date('2026-02-03T00:00:00.000Z'),
  day3Start: new Date('2026-02-03T09:00:00.000Z'),
  day3End: new Date('2026-02-03T12:00:00.000Z'),
  year2026: new Date('2026-01-01T00:00:00.000Z'),
};

const weeklyReportAgendaSeeds = [
  {
    id: IDS.agendaKerjaWeek1,
    userId: IDS.userKaryawan,
    agendaId: IDS.agenda2,
    description: 'Follow up prospek hotel untuk penawaran HRIS.',
    start: new Date('2026-03-30T08:00:00.000Z'),
    end: new Date('2026-03-30T10:00:00.000Z'),
    durationSeconds: 7200,
    status: 'selesai',
    kebutuhan: 'Call script',
  },
  {
    id: IDS.agendaKerjaWeek2,
    userId: IDS.userKaryawan,
    agendaId: IDS.agenda3,
    description: 'Menyiapkan demo produk untuk calon klien F&B.',
    start: new Date('2026-03-31T13:00:00.000Z'),
    end: new Date('2026-03-31T16:00:00.000Z'),
    durationSeconds: 10800,
    status: 'diproses',
    kebutuhan: 'Laptop presentasi',
  },
  {
    id: IDS.agendaKerjaWeek3,
    userId: IDS.userKaryawan,
    agendaId: IDS.agenda4,
    description: 'Rekap kebutuhan implementasi dan checklist onboarding klien.',
    start: new Date('2026-04-02T09:00:00.000Z'),
    end: new Date('2026-04-02T10:30:00.000Z'),
    durationSeconds: 5400,
    status: 'teragenda',
    kebutuhan: 'Template onboarding',
  },
  {
    id: IDS.agendaKerjaWeek4,
    userId: IDS.userKaryawan2,
    agendaId: IDS.agenda3,
    description: 'Demo dashboard absensi untuk cabang Denpasar.',
    start: new Date('2026-03-30T09:00:00.000Z'),
    end: new Date('2026-03-30T12:00:00.000Z'),
    durationSeconds: 10800,
    status: 'selesai',
    kebutuhan: 'Materi demo',
  },
  {
    id: IDS.agendaKerjaWeek5,
    userId: IDS.userKaryawan2,
    agendaId: IDS.agenda2,
    description: 'Follow up revisi proposal harga enterprise.',
    start: new Date('2026-04-01T13:00:00.000Z'),
    end: new Date('2026-04-01T15:00:00.000Z'),
    durationSeconds: 7200,
    status: 'ditunda',
    kebutuhan: 'Draft proposal',
  },
  {
    id: IDS.agendaKerjaWeek6,
    userId: IDS.userKaryawan2,
    agendaId: IDS.agenda4,
    description: 'Sinkronisasi data kebutuhan training user baru.',
    start: new Date('2026-04-03T10:00:00.000Z'),
    end: new Date('2026-04-03T12:00:00.000Z'),
    durationSeconds: 7200,
    status: 'selesai',
    kebutuhan: 'Spreadsheet training',
  },
  {
    id: IDS.agendaKerjaWeek7,
    userId: IDS.userKaryawan3,
    agendaId: IDS.agenda2,
    description: 'Follow up jadwal meeting dengan prospek retail.',
    start: new Date('2026-04-01T08:00:00.000Z'),
    end: new Date('2026-04-01T11:00:00.000Z'),
    durationSeconds: 10800,
    status: 'diproses',
    kebutuhan: 'Daftar prospek',
  },
  {
    id: IDS.agendaKerjaWeek8,
    userId: IDS.userKaryawan3,
    agendaId: IDS.agenda3,
    description: 'Persiapan demo mobile attendance untuk calon partner.',
    start: new Date('2026-04-04T09:00:00.000Z'),
    end: new Date('2026-04-04T10:00:00.000Z'),
    durationSeconds: 3600,
    status: 'teragenda',
    kebutuhan: 'Device testing',
  },
];

const weeklyReportVisitSeeds = [
  {
    id: IDS.kunjunganWeek1,
    userId: IDS.userKaryawan,
    kategoriId: IDS.kategoriKunjungan1,
    tanggal: new Date('2026-03-31T00:00:00.000Z'),
    jamMulai: new Date('2026-03-31T10:00:00.000Z'),
    jamSelesai: new Date('2026-03-31T12:00:00.000Z'),
    deskripsi: 'Kunjungan presentasi solusi HRIS ke klien hospitality.',
    status: 'selesai',
    handOver: 'Tindak lanjut proposal oleh tim sales.',
  },
  {
    id: IDS.kunjunganWeek2,
    userId: IDS.userKaryawan,
    kategoriId: IDS.kategoriKunjungan2,
    tanggal: new Date('2026-04-03T00:00:00.000Z'),
    jamMulai: new Date('2026-04-03T14:00:00.000Z'),
    jamSelesai: new Date('2026-04-03T16:00:00.000Z'),
    deskripsi: 'Pendampingan implementasi awal dan pengecekan kebutuhan user.',
    status: 'berlangsung',
    handOver: 'Koordinasi jadwal training lanjutan.',
  },
  {
    id: IDS.kunjunganWeek3,
    userId: IDS.userKaryawan2,
    kategoriId: IDS.kategoriKunjungan1,
    tanggal: new Date('2026-04-01T00:00:00.000Z'),
    jamMulai: new Date('2026-04-01T09:00:00.000Z'),
    jamSelesai: new Date('2026-04-01T11:00:00.000Z'),
    deskripsi: 'Survey proses absensi dan kebutuhan approval klien manufaktur.',
    status: 'diproses',
    handOver: 'Tim produk menyiapkan catatan gap analysis.',
  },
  {
    id: IDS.kunjunganWeek4,
    userId: IDS.userKaryawan3,
    kategoriId: IDS.kategoriKunjungan2,
    tanggal: new Date('2026-04-02T00:00:00.000Z'),
    jamMulai: new Date('2026-04-02T13:00:00.000Z'),
    jamSelesai: new Date('2026-04-02T15:00:00.000Z'),
    deskripsi: 'Jadwal demo dibatalkan karena pihak klien meminta reschedule.',
    status: 'diproses',
    handOver: 'Buat jadwal ulang untuk minggu berikutnya.',
  },
  {
    id: IDS.kunjunganWeek5,
    userId: IDS.userKaryawan3,
    kategoriId: IDS.kategoriKunjungan1,
    tanggal: new Date('2026-04-05T00:00:00.000Z'),
    jamMulai: new Date('2026-04-05T08:00:00.000Z'),
    jamSelesai: new Date('2026-04-05T10:00:00.000Z'),
    deskripsi: 'Kunjungan finalisasi penawaran dan pengumpulan requirement akhir.',
    status: 'selesai',
    handOver: 'Masukkan hasil meeting ke CRM.',
  },
];

const weeklyReportAbsensiSeeds = [
  {
    id: IDS.absensiWeek1,
    userId: IDS.userKaryawan,
    tanggal: new Date('2026-03-27T00:00:00.000Z'),
    jamMasuk: new Date('2026-03-27T08:00:00.000Z'),
    jamPulang: new Date('2026-03-27T17:05:00.000Z'),
    statusMasuk: 'tepat',
    statusPulang: 'tepat',
    inLatitude: -8.650000,
    inLongitude: 115.216667,
    outLatitude: -8.650000,
    outLongitude: 115.216667,
  },
  {
    id: IDS.absensiWeek2,
    userId: IDS.userKaryawan2,
    tanggal: new Date('2026-03-27T00:00:00.000Z'),
    jamMasuk: new Date('2026-03-27T08:12:00.000Z'),
    jamPulang: new Date('2026-03-27T17:14:00.000Z'),
    statusMasuk: 'terlambat',
    statusPulang: 'tepat',
    inLatitude: -8.650000,
    inLongitude: 115.216667,
    outLatitude: -8.650000,
    outLongitude: 115.216667,
  },
  {
    id: IDS.absensiWeek3,
    userId: IDS.userKaryawan,
    tanggal: new Date('2026-03-30T00:00:00.000Z'),
    jamMasuk: new Date('2026-03-30T08:03:00.000Z'),
    jamPulang: new Date('2026-03-30T17:02:00.000Z'),
    statusMasuk: 'tepat',
    statusPulang: 'tepat',
    inLatitude: -8.650000,
    inLongitude: 115.216667,
    outLatitude: -8.650000,
    outLongitude: 115.216667,
  },
  {
    id: IDS.absensiWeek4,
    userId: IDS.userKaryawan2,
    tanggal: new Date('2026-03-30T00:00:00.000Z'),
    jamMasuk: new Date('2026-03-30T09:05:00.000Z'),
    jamPulang: new Date('2026-03-30T18:00:00.000Z'),
    statusMasuk: 'terlambat',
    statusPulang: 'tepat',
    inLatitude: -8.650000,
    inLongitude: 115.216667,
    outLatitude: -8.652500,
    outLongitude: 115.221500,
  },
  {
    id: IDS.absensiWeek5,
    userId: IDS.userKaryawan3,
    tanggal: new Date('2026-03-31T00:00:00.000Z'),
    jamMasuk: new Date('2026-03-31T08:00:00.000Z'),
    jamPulang: new Date('2026-03-31T17:00:00.000Z'),
    statusMasuk: 'tepat',
    statusPulang: 'tepat',
    inLatitude: -8.650000,
    inLongitude: 115.216667,
    outLatitude: -8.650000,
    outLongitude: 115.216667,
  },
  {
    id: IDS.absensiWeek6,
    userId: IDS.userKaryawan3,
    tanggal: new Date('2026-04-01T00:00:00.000Z'),
    jamMasuk: new Date('2026-04-01T08:20:00.000Z'),
    jamPulang: new Date('2026-04-01T17:15:00.000Z'),
    statusMasuk: 'terlambat',
    statusPulang: 'terlambat',
    inLatitude: -8.653000,
    inLongitude: 115.220500,
    outLatitude: -8.650000,
    outLongitude: 115.216667,
  },
  {
    id: IDS.absensiWeek7,
    userId: IDS.userKaryawan2,
    tanggal: new Date('2026-04-02T00:00:00.000Z'),
    jamMasuk: new Date('2026-04-02T08:00:00.000Z'),
    jamPulang: new Date('2026-04-02T16:40:00.000Z'),
    statusMasuk: 'tepat',
    statusPulang: 'tepat',
    inLatitude: -8.650000,
    inLongitude: 115.216667,
    outLatitude: -8.650000,
    outLongitude: 115.216667,
  },
];

const weeklyReportIstirahatSeeds = [
  {
    id: IDS.istirahatWeek1,
    absensiId: IDS.absensiWeek1,
    userId: IDS.userKaryawan,
    tanggal: new Date('2026-03-27T00:00:00.000Z'),
    start: new Date('2026-03-27T12:00:00.000Z'),
    end: new Date('2026-03-27T12:30:00.000Z'),
  },
  {
    id: IDS.istirahatWeek2,
    absensiId: IDS.absensiWeek2,
    userId: IDS.userKaryawan2,
    tanggal: new Date('2026-03-27T00:00:00.000Z'),
    start: new Date('2026-03-27T12:10:00.000Z'),
    end: new Date('2026-03-27T13:15:00.000Z'),
  },
  {
    id: IDS.istirahatWeek3,
    absensiId: IDS.absensiWeek3,
    userId: IDS.userKaryawan,
    tanggal: new Date('2026-03-30T00:00:00.000Z'),
    start: new Date('2026-03-30T12:05:00.000Z'),
    end: new Date('2026-03-30T12:40:00.000Z'),
  },
  {
    id: IDS.istirahatWeek4,
    absensiId: IDS.absensiWeek4,
    userId: IDS.userKaryawan2,
    tanggal: new Date('2026-03-30T00:00:00.000Z'),
    start: new Date('2026-03-30T12:30:00.000Z'),
    end: new Date('2026-03-30T13:00:00.000Z'),
  },
  {
    id: IDS.istirahatWeek5,
    absensiId: IDS.absensiWeek5,
    userId: IDS.userKaryawan3,
    tanggal: new Date('2026-03-31T00:00:00.000Z'),
    start: new Date('2026-03-31T11:55:00.000Z'),
    end: new Date('2026-03-31T12:25:00.000Z'),
  },
  {
    id: IDS.istirahatWeek6,
    absensiId: IDS.absensiWeek6,
    userId: IDS.userKaryawan3,
    tanggal: new Date('2026-04-01T00:00:00.000Z'),
    start: new Date('2026-04-01T12:15:00.000Z'),
    end: new Date('2026-04-01T12:55:00.000Z'),
  },
  {
    id: IDS.istirahatWeek7,
    absensiId: IDS.absensiWeek7,
    userId: IDS.userKaryawan2,
    tanggal: new Date('2026-04-02T00:00:00.000Z'),
    start: new Date('2026-04-02T12:00:00.000Z'),
    end: new Date('2026-04-02T12:50:00.000Z'),
  },
];

async function main() {
  console.log('Mulai proses seeding...');

  await prisma.location.upsert({
    where: { id_location: IDS.locationHq },
    update: {},
    create: {
      id_location: IDS.locationHq,
      nama_kantor: 'Kantor Pusat',
      latitude: -8.650000,
      longitude: 115.216667,
      radius: 100,
    },
  });

  await prisma.departement.upsert({
    where: { id_departement: IDS.departementHr },
    update: {},
    create: {
      id_departement: IDS.departementHr,
      nama_departement: 'HR',
      id_supervisor: null,
    },
  });

  await prisma.departement.upsert({
    where: { id_departement: IDS.departementOps },
    update: {},
    create: {
      id_departement: IDS.departementOps,
      nama_departement: 'Operasional',
      id_supervisor: null,
    },
  });

  await prisma.jabatan.upsert({
    where: { id_jabatan: IDS.jabatanManager },
    update: {},
    create: {
      id_jabatan: IDS.jabatanManager,
      nama_jabatan: 'Manager HR',
      id_departement: IDS.departementHr,
      id_induk_jabatan: null,
    },
  });

  await prisma.jabatan.upsert({
    where: { id_jabatan: IDS.jabatanStaff },
    update: {},
    create: {
      id_jabatan: IDS.jabatanStaff,
      nama_jabatan: 'Staff HR',
      id_departement: IDS.departementHr,
      id_induk_jabatan: IDS.jabatanManager,
    },
  });

  await prisma.user.upsert({
    where: { id_user: IDS.userSuperadmin },
    update: {},
    create: {
      id_user: IDS.userSuperadmin,
      nama_pengguna: 'Super Admin',
      email: 'superadmin@ehrm.local',
      password_hash: 'password_hash_placeholder',
      role: 'SUPERADMIN',
      status_kerja: 'AKTIF',
      status_cuti: 'aktif',
      id_departement: IDS.departementHr,
      id_location: IDS.locationHq,
      id_jabatan: IDS.jabatanManager,
      nomor_induk_karyawan: 'EMP-0001',
    },
  });

  await prisma.user.upsert({
    where: { id_user: IDS.userHr },
    update: {},
    create: {
      id_user: IDS.userHr,
      nama_pengguna: 'Admin HR',
      email: 'hr@ehrm.local',
      password_hash: 'password_hash_placeholder',
      role: 'HR',
      status_kerja: 'AKTIF',
      status_cuti: 'aktif',
      id_departement: IDS.departementHr,
      id_location: IDS.locationHq,
      id_jabatan: IDS.jabatanManager,
      nomor_induk_karyawan: 'EMP-0002',
    },
  });

  await prisma.user.upsert({
    where: { id_user: IDS.userKaryawan },
    update: {},
    create: {
      id_user: IDS.userKaryawan,
      nama_pengguna: 'Karyawan Demo',
      email: 'karyawan@ehrm.local',
      password_hash: 'password_hash_placeholder',
      role: 'KARYAWAN',
      status_kerja: 'AKTIF',
      status_cuti: 'aktif',
      id_departement: IDS.departementOps,
      id_location: IDS.locationHq,
      id_jabatan: IDS.jabatanStaff,
      nomor_induk_karyawan: 'EMP-0003',
    },
  });

  await prisma.user.upsert({
    where: { id_user: IDS.userKaryawan2 },
    update: {},
    create: {
      id_user: IDS.userKaryawan2,
      nama_pengguna: 'Ayu Sales',
      email: 'ayu.sales@ehrm.local',
      password_hash: 'password_hash_placeholder',
      role: 'KARYAWAN',
      status_kerja: 'AKTIF',
      status_cuti: 'aktif',
      id_departement: IDS.departementOps,
      id_location: IDS.locationHq,
      id_jabatan: IDS.jabatanStaff,
      nomor_induk_karyawan: 'EMP-0004',
    },
  });

  await prisma.user.upsert({
    where: { id_user: IDS.userKaryawan3 },
    update: {},
    create: {
      id_user: IDS.userKaryawan3,
      nama_pengguna: 'Budi Operasional',
      email: 'budi.operasional@ehrm.local',
      password_hash: 'password_hash_placeholder',
      role: 'KARYAWAN',
      status_kerja: 'AKTIF',
      status_cuti: 'aktif',
      id_departement: IDS.departementOps,
      id_location: IDS.locationHq,
      id_jabatan: IDS.jabatanStaff,
      nomor_induk_karyawan: 'EMP-0005',
    },
  });

  await prisma.departement.update({
    where: { id_departement: IDS.departementHr },
    data: { id_supervisor: IDS.userHr },
  });

  await prisma.polaKerja.upsert({
    where: { id_pola_kerja: IDS.polaKerjaReguler },
    update: {},
    create: {
      id_pola_kerja: IDS.polaKerjaReguler,
      nama_pola_kerja: 'Reguler',
      jam_mulai: dates.day1Start,
      jam_selesai: dates.day1End,
      jam_istirahat_mulai: dates.day1BreakStart,
      jam_istirahat_selesai: dates.day1BreakEnd,
      maks_jam_istirahat: 60,
    },
  });

  await prisma.shiftKerja.upsert({
    where: { id_shift_kerja: IDS.shiftKerja1 },
    update: {},
    create: {
      id_shift_kerja: IDS.shiftKerja1,
      id_user: IDS.userKaryawan,
      tanggal_mulai: dates.day1,
      tanggal_selesai: dates.day1,
      hari_kerja: 'Senin',
      status: 'KERJA',
      id_pola_kerja: IDS.polaKerjaReguler,
    },
  });

  await prisma.agenda.upsert({
    where: { id_agenda: IDS.agenda1 },
    update: {},
    create: {
      id_agenda: IDS.agenda1,
      nama_agenda: 'Agenda Harian',
    },
  });

  await prisma.agenda.upsert({
    where: { id_agenda: IDS.agenda2 },
    update: {},
    create: {
      id_agenda: IDS.agenda2,
      nama_agenda: 'Follow Up Prospek',
    },
  });

  await prisma.agenda.upsert({
    where: { id_agenda: IDS.agenda3 },
    update: {},
    create: {
      id_agenda: IDS.agenda3,
      nama_agenda: 'Demo Produk',
    },
  });

  await prisma.agenda.upsert({
    where: { id_agenda: IDS.agenda4 },
    update: {},
    create: {
      id_agenda: IDS.agenda4,
      nama_agenda: 'Administrasi Implementasi',
    },
  });

  await prisma.absensi.upsert({
    where: { id_absensi: IDS.absensi1 },
    update: {},
    create: {
      id_absensi: IDS.absensi1,
      id_user: IDS.userKaryawan,
      face_verified_masuk: true,
      face_verified_pulang: true,
      tanggal: dates.day1,
      id_lokasi_datang: IDS.locationHq,
      id_lokasi_pulang: IDS.locationHq,
      jam_masuk: dates.day1Start,
      jam_pulang: dates.day1End,
      status_masuk: 'tepat',
      status_pulang: 'tepat',
      in_latitude: -8.650000,
      in_longitude: 115.216667,
      out_latitude: -8.650000,
      out_longitude: 115.216667,
    },
  });

  await prisma.agendaKerja.upsert({
    where: { id_agenda_kerja: IDS.agendaKerja1 },
    update: {},
    create: {
      id_agenda_kerja: IDS.agendaKerja1,
      id_absensi: IDS.absensi1,
      id_agenda: IDS.agenda1,
      id_user: IDS.userKaryawan,
      deskripsi_kerja: 'Menyusun laporan harian.',
      start_date: dates.day1Start,
      end_date: dates.day1End,
      duration_seconds: 28800,
      status: 'teragenda',
      kebutuhan_agenda: 'Laptop',
      created_by_snapshot: 'Admin HR',
    },
  });

  await prisma.istirahat.upsert({
    where: { id_istirahat: IDS.istirahat1 },
    update: {},
    create: {
      id_istirahat: IDS.istirahat1,
      id_user: IDS.userKaryawan,
      id_absensi: IDS.absensi1,
      tanggal_istirahat: dates.day1,
      start_istirahat: dates.day1BreakStart,
      end_istirahat: dates.day1BreakEnd,
      start_istirahat_latitude: -8.650000,
      start_istirahat_longitude: 115.216667,
      end_istirahat_latitude: -8.650000,
      end_istirahat_longitude: 115.216667,
    },
  });

  await prisma.absensiReportRecipient.upsert({
    where: { id_absensi_report_recipient: IDS.absensiReport1 },
    update: {},
    create: {
      id_absensi_report_recipient: IDS.absensiReport1,
      id_absensi: IDS.absensi1,
      id_user: IDS.userHr,
      recipient_nama_snapshot: 'Admin HR',
      recipient_role_snapshot: 'HR',
      status: 'terkirim',
    },
  });

  await prisma.catatan.upsert({
    where: { id_catatan: IDS.catatan1 },
    update: {},
    create: {
      id_catatan: IDS.catatan1,
      id_absensi: IDS.absensi1,
      deskripsi_catatan: 'Catatan singkat absensi.',
      lampiran_url: null,
    },
  });

  await prisma.face.upsert({
    where: { id_face: IDS.face1 },
    update: {},
    create: {
      id_face: IDS.face1,
      id_user: IDS.userKaryawan,
      image_face: 'https://example.com/face.jpg',
    },
  });

  await prisma.storyPlanner.upsert({
    where: { id_story: IDS.storyPlanner1 },
    update: {},
    create: {
      id_story: IDS.storyPlanner1,
      id_user: IDS.userKaryawan,
      id_departement: IDS.departementOps,
      deskripsi_kerja: 'Menyusun rencana kerja minggu ini.',
      count_time: dates.day1Start,
      status: 'berjalan',
    },
  });

  await prisma.device.upsert({
    where: { id_device: IDS.device1 },
    update: {},
    create: {
      id_device: IDS.device1,
      id_user: IDS.userKaryawan,
      device_label: 'iPhone 14',
      platform: 'ios',
      os_version: '17.0',
      app_version: '1.0.0',
      device_identifier: 'device-demo-001',
      last_seen: dates.day1End,
      fcm_token: 'fcm-token-demo',
      fcm_token_updated_at: dates.day1End,
      push_enabled: true,
      last_push_at: dates.day1End,
      failed_push_count: 0,
    },
  });

  await prisma.notification.upsert({
    where: { id_notification: IDS.notification1 },
    update: {},
    create: {
      id_notification: IDS.notification1,
      id_user: IDS.userKaryawan,
      title: 'Selamat Datang',
      body: 'Akun Anda telah aktif di sistem E-HRM.',
      data_json: '{"type":"welcome"}',
      related_table: 'user',
      related_id: IDS.userKaryawan,
      status: 'unread',
    },
  });

  await prisma.kategoriKunjungan.upsert({
    where: { id_kategori_kunjungan: IDS.kategoriKunjungan1 },
    update: {},
    create: {
      id_kategori_kunjungan: IDS.kategoriKunjungan1,
      kategori_kunjungan: 'Kunjungan Klien',
    },
  });

  await prisma.kategoriKunjungan.upsert({
    where: { id_kategori_kunjungan: IDS.kategoriKunjungan2 },
    update: {},
    create: {
      id_kategori_kunjungan: IDS.kategoriKunjungan2,
      kategori_kunjungan: 'Presentasi Produk',
    },
  });

  await prisma.kunjungan.upsert({
    where: { id_kunjungan: IDS.kunjungan1 },
    update: {},
    create: {
      id_kunjungan: IDS.kunjungan1,
      id_user: IDS.userKaryawan,
      id_kategori_kunjungan: IDS.kategoriKunjungan1,
      tanggal: dates.day2,
      jam_mulai: dates.day2Start,
      jam_selesai: dates.day2End,
      deskripsi: 'Kunjungan ke klien utama.',
      jam_checkin: dates.day2Start,
      jam_checkout: dates.day2End,
      start_latitude: -8.650000,
      start_longitude: 115.216667,
      end_latitude: -8.650000,
      end_longitude: 115.216667,
      lampiran_kunjungan_url: 'https://example.com/kunjungan.pdf',
      status_kunjungan: 'diproses',
      duration: 32400,
      hand_over: 'Handover singkat',
      created_by_snapshot: 'Admin HR',
    },
  });

  await prisma.kunjunganReportRecipient.upsert({
    where: { id_kunjungan_report_recipient: IDS.kunjunganReport1 },
    update: {},
    create: {
      id_kunjungan_report_recipient: IDS.kunjunganReport1,
      id_kunjungan: IDS.kunjungan1,
      id_user: IDS.userHr,
      recipient_nama_snapshot: 'Admin HR',
      recipient_role_snapshot: 'HR',
      catatan: 'Laporan awal kunjungan.',
      status: 'terkirim',
    },
  });

  for (const item of weeklyReportAgendaSeeds) {
    await prisma.agendaKerja.upsert({
      where: { id_agenda_kerja: item.id },
      update: {},
      create: {
        id_agenda_kerja: item.id,
        id_agenda: item.agendaId,
        id_user: item.userId,
        deskripsi_kerja: item.description,
        start_date: item.start,
        end_date: item.end,
        duration_seconds: item.durationSeconds,
        status: item.status,
        kebutuhan_agenda: item.kebutuhan,
        created_by_snapshot: 'Admin HR',
      },
    });
  }

  for (const item of weeklyReportVisitSeeds) {
    await prisma.kunjungan.upsert({
      where: { id_kunjungan: item.id },
      update: {},
      create: {
        id_kunjungan: item.id,
        id_user: item.userId,
        id_kategori_kunjungan: item.kategoriId,
        tanggal: item.tanggal,
        jam_mulai: item.jamMulai,
        jam_selesai: item.jamSelesai,
        deskripsi: item.deskripsi,
        jam_checkin: item.jamMulai,
        jam_checkout: item.jamSelesai,
        start_latitude: -8.650000,
        start_longitude: 115.216667,
        end_latitude: -8.650000,
        end_longitude: 115.216667,
        lampiran_kunjungan_url: 'https://example.com/kunjungan-laporan-mingguan.pdf',
        status_kunjungan: item.status,
        duration: Math.floor((item.jamSelesai - item.jamMulai) / 1000),
        hand_over: item.handOver,
        created_by_snapshot: 'Admin HR',
      },
    });
  }

  for (const item of weeklyReportAbsensiSeeds) {
    await prisma.absensi.upsert({
      where: { id_absensi: item.id },
      update: {},
      create: {
        id_absensi: item.id,
        id_user: item.userId,
        face_verified_masuk: true,
        face_verified_pulang: true,
        tanggal: item.tanggal,
        id_lokasi_datang: IDS.locationHq,
        id_lokasi_pulang: IDS.locationHq,
        jam_masuk: item.jamMasuk,
        jam_pulang: item.jamPulang,
        status_masuk: item.statusMasuk,
        status_pulang: item.statusPulang,
        in_latitude: item.inLatitude,
        in_longitude: item.inLongitude,
        out_latitude: item.outLatitude,
        out_longitude: item.outLongitude,
      },
    });
  }

  for (const item of weeklyReportIstirahatSeeds) {
    await prisma.istirahat.upsert({
      where: { id_istirahat: item.id },
      update: {},
      create: {
        id_istirahat: item.id,
        id_user: item.userId,
        id_absensi: item.absensiId,
        tanggal_istirahat: item.tanggal,
        start_istirahat: item.start,
        end_istirahat: item.end,
        start_istirahat_latitude: -8.650000,
        start_istirahat_longitude: 115.216667,
        end_istirahat_latitude: -8.650000,
        end_istirahat_longitude: 115.216667,
      },
    });
  }

  await prisma.broadcast.upsert({
    where: { id_broadcasts: IDS.broadcast1 },
    update: {},
    create: {
      id_broadcasts: IDS.broadcast1,
      title: 'Pengumuman Internal',
      message: 'Mohon cek kebijakan terbaru.',
    },
  });

  await prisma.broadcastRecipient.upsert({
    where: { id_broadcast_recipients: IDS.broadcastRecipient1 },
    update: {},
    create: {
      id_broadcast_recipients: IDS.broadcastRecipient1,
      id_broadcast: IDS.broadcast1,
      id_user: IDS.userKaryawan,
      nama_karyawan_snapshot: 'Karyawan Demo',
    },
  });

  await prisma.broadcastAttachment.upsert({
    where: { id_broadcast_attachment: IDS.broadcastAttachment1 },
    update: {},
    create: {
      id_broadcast_attachment: IDS.broadcastAttachment1,
      id_broadcast: IDS.broadcast1,
      lampiran_url: 'https://example.com/pengumuman.pdf',
    },
  });

  await prisma.lembur.upsert({
    where: { id_lembur: IDS.lembur1 },
    update: {},
    create: {
      id_lembur: IDS.lembur1,
      id_user: IDS.userKaryawan,
      tanggal: dates.day2,
      jam_mulai: dates.day2Start,
      jam_selesai: dates.day2End,
      alasan: 'Penyelesaian proyek.',
      status: 'pending',
      current_level: 1,
    },
  });

  await prisma.lemburApproval.upsert({
    where: { id_lembur_approval: IDS.lemburApproval1 },
    update: {},
    create: {
      id_lembur_approval: IDS.lemburApproval1,
      id_lembur: IDS.lembur1,
      level: 1,
      approver_user_id: IDS.userHr,
      approver_role: 'HR',
      decision: 'pending',
    },
  });

  await prisma.jadwalStoryPlanner.upsert({
    where: { id_jadwal_story_planner: IDS.jadwalStory1 },
    update: {},
    create: {
      id_jadwal_story_planner: IDS.jadwalStory1,
      Tahun: dates.year2026,
      Bulan: 'JANUARI',
      keterangan: 'Jadwal story planner awal tahun.',
    },
  });

  await prisma.shiftStoryPlanner.upsert({
    where: { id_shift_story_planner: IDS.shiftStory1 },
    update: {},
    create: {
      id_shift_story_planner: IDS.shiftStory1,
      id_jadwal_story_planner: IDS.jadwalStory1,
      id_user: IDS.userKaryawan,
      hari_story_planner: 'Senin',
    },
  });

  await prisma.kategoriSakit.upsert({
    where: { id_kategori_sakit: IDS.kategoriSakit1 },
    update: {},
    create: {
      id_kategori_sakit: IDS.kategoriSakit1,
      nama_kategori: 'Flu',
    },
  });

  await prisma.kategoriIzinJam.upsert({
    where: { id_kategori_izin_jam: IDS.kategoriIzinJam1 },
    update: {},
    create: {
      id_kategori_izin_jam: IDS.kategoriIzinJam1,
      nama_kategori: 'Izin Pribadi',
    },
  });

  await prisma.kategoriCuti.upsert({
    where: { id_kategori_cuti: IDS.kategoriCuti1 },
    update: {},
    create: {
      id_kategori_cuti: IDS.kategoriCuti1,
      nama_kategori: 'Cuti Tahunan',
      pengurangan_kouta: true,
    },
  });

  await prisma.kategoriKeperluan.upsert({
    where: { id_kategori_keperluan: IDS.kategoriKeperluan1 },
    update: {},
    create: {
      id_kategori_keperluan: IDS.kategoriKeperluan1,
      nama_keperluan: 'Operasional',
    },
  });

  await prisma.cutiKonfigurasi.upsert({
    where: { id_cuti_konfigurasi: IDS.cutiKonfig1 },
    update: {},
    create: {
      id_cuti_konfigurasi: IDS.cutiKonfig1,
      id_user: IDS.userKaryawan,
      bulan: 'JANUARI',
      kouta_cuti: 12,
      cuti_tabung: 0,
    },
  });

  await prisma.pengajuanCuti.upsert({
    where: { id_pengajuan_cuti: IDS.pengajuanCuti1 },
    update: {},
    create: {
      id_pengajuan_cuti: IDS.pengajuanCuti1,
      id_user: IDS.userKaryawan,
      id_kategori_cuti: IDS.kategoriCuti1,
      keperluan: 'Liburan keluarga.',
      tanggal_masuk_kerja: dates.day3,
      handover: 'Serah tugas ke Admin HR.',
      status: 'pending',
      current_level: 1,
      jenis_pengajuan: 'cuti',
      lampiran_cuti_url: 'https://example.com/cuti.pdf',
    },
  });

  await prisma.pengajuanCutiTanggal.upsert({
    where: { id_pengajuan_cuti_tanggal: IDS.pengajuanCutiTanggal1 },
    update: {},
    create: {
      id_pengajuan_cuti_tanggal: IDS.pengajuanCutiTanggal1,
      id_pengajuan_cuti: IDS.pengajuanCuti1,
      tanggal_cuti: dates.day2,
    },
  });

  await prisma.approvalPengajuanCuti.upsert({
    where: { id_approval_pengajuan_cuti: IDS.approvalCuti1 },
    update: {},
    create: {
      id_approval_pengajuan_cuti: IDS.approvalCuti1,
      id_pengajuan_cuti: IDS.pengajuanCuti1,
      level: 1,
      approver_user_id: IDS.userHr,
      approver_role: 'HR',
      decision: 'pending',
      note: 'Menunggu verifikasi.',
    },
  });

  await prisma.pengajuanIzinSakit.upsert({
    where: { id_pengajuan_izin_sakit: IDS.pengajuanSakit1 },
    update: {},
    create: {
      id_pengajuan_izin_sakit: IDS.pengajuanSakit1,
      id_user: IDS.userKaryawan,
      id_kategori_sakit: IDS.kategoriSakit1,
      handover: 'Koordinasi dengan tim.',
      lampiran_izin_sakit_url: 'https://example.com/surat-sakit.pdf',
      status: 'pending',
      current_level: 1,
      jenis_pengajuan: 'sakit',
      tanggal_pengajuan: dates.day2,
    },
  });

  await prisma.approvalIzinSakit.upsert({
    where: { id_approval_izin_sakit: IDS.approvalSakit1 },
    update: {},
    create: {
      id_approval_izin_sakit: IDS.approvalSakit1,
      id_pengajuan_izin_sakit: IDS.pengajuanSakit1,
      level: 1,
      approver_user_id: IDS.userHr,
      approver_role: 'HR',
      decision: 'pending',
      note: 'Menunggu dokumen lengkap.',
    },
  });

  await prisma.pengajuanIzinJam.upsert({
    where: { id_pengajuan_izin_jam: IDS.pengajuanIzinJam1 },
    update: {},
    create: {
      id_pengajuan_izin_jam: IDS.pengajuanIzinJam1,
      id_user: IDS.userKaryawan,
      id_kategori_izin_jam: IDS.kategoriIzinJam1,
      tanggal_izin: dates.day2,
      jam_mulai: dates.day2Start,
      jam_selesai: dates.day2End,
      tanggal_pengganti: dates.day3,
      jam_mulai_pengganti: dates.day3Start,
      jam_selesai_pengganti: dates.day3End,
      keperluan: 'Keperluan keluarga.',
      handover: 'Serah tugas ke rekan kerja.',
      lampiran_izin_jam_url: 'https://example.com/izin-jam.pdf',
      status: 'pending',
      current_level: 1,
      jenis_pengajuan: 'izin_jam',
    },
  });

  await prisma.approvalPengajuanIzinJam.upsert({
    where: { id_approval_pengajuan_izin_jam: IDS.approvalIzinJam1 },
    update: {},
    create: {
      id_approval_pengajuan_izin_jam: IDS.approvalIzinJam1,
      id_pengajuan_izin_jam: IDS.pengajuanIzinJam1,
      level: 1,
      approver_user_id: IDS.userHr,
      approver_role: 'HR',
      decision: 'pending',
      note: 'Menunggu konfirmasi.',
    },
  });

  await prisma.izinTukarHari.upsert({
    where: { id_izin_tukar_hari: IDS.izinTukarHari1 },
    update: {},
    create: {
      id_izin_tukar_hari: IDS.izinTukarHari1,
      id_user: IDS.userKaryawan,
      kategori: 'Tukar Hari',
      keperluan: 'Kegiatan keluarga.',
      handover: 'Koordinasi dengan Admin HR.',
      lampiran_izin_tukar_hari_url: 'https://example.com/tukar-hari.pdf',
      status: 'pending',
      current_level: 1,
      jenis_pengajuan: 'tukar_hari',
    },
  });

  await prisma.izinTukarHariPair.upsert({
    where: { id_izin_tukar_hari_pair: IDS.izinTukarHariPair1 },
    update: {},
    create: {
      id_izin_tukar_hari_pair: IDS.izinTukarHariPair1,
      id_izin_tukar_hari: IDS.izinTukarHari1,
      hari_izin: dates.day2,
      hari_pengganti: dates.day3,
      catatan_pair: 'Penukaran dengan jadwal berikutnya.',
    },
  });

  await prisma.approvalIzinTukarHari.upsert({
    where: { id_approval_izin_tukar_hari: IDS.approvalTukarHari1 },
    update: {},
    create: {
      id_approval_izin_tukar_hari: IDS.approvalTukarHari1,
      id_izin_tukar_hari: IDS.izinTukarHari1,
      level: 1,
      approver_user_id: IDS.userHr,
      approver_role: 'HR',
      decision: 'pending',
      note: 'Menunggu persetujuan.',
    },
  });

  await prisma.handoverCuti.upsert({
    where: { id_handover_cuti: IDS.handoverCuti1 },
    update: {},
    create: {
      id_handover_cuti: IDS.handoverCuti1,
      id_pengajuan_cuti: IDS.pengajuanCuti1,
      id_user_tagged: IDS.userHr,
    },
  });

  await prisma.handoverIzinSakit.upsert({
    where: { id_handover_sakit: IDS.handoverSakit1 },
    update: {},
    create: {
      id_handover_sakit: IDS.handoverSakit1,
      id_pengajuan_izin_sakit: IDS.pengajuanSakit1,
      id_user_tagged: IDS.userHr,
    },
  });

  await prisma.handoverIzinJam.upsert({
    where: { id_handover_jam: IDS.handoverIzinJam1 },
    update: {},
    create: {
      id_handover_jam: IDS.handoverIzinJam1,
      id_pengajuan_izin_jam: IDS.pengajuanIzinJam1,
      id_user_tagged: IDS.userHr,
    },
  });

  await prisma.handoverTukarHari.upsert({
    where: { id_handover_tukar_hari: IDS.handoverTukarHari1 },
    update: {},
    create: {
      id_handover_tukar_hari: IDS.handoverTukarHari1,
      id_izin_tukar_hari: IDS.izinTukarHari1,
      id_user_tagged: IDS.userHr,
    },
  });

  await prisma.reimburse.upsert({
    where: { id_reimburse: IDS.reimburse1 },
    update: {},
    create: {
      id_reimburse: IDS.reimburse1,
      id_user: IDS.userKaryawan,
      id_departement: IDS.departementOps,
      id_kategori_keperluan: IDS.kategoriKeperluan1,
      tanggal: dates.day2,
      keterangan: 'Reimburse perjalanan dinas.',
      total_pengeluaran: 150000,
      metode_pembayaran: 'transfer',
      nomor_rekening: '1234567890',
      nama_pemilik_rekening: 'Karyawan Demo',
      jenis_bank: 'BCA',
      bukti_pembayaran_url: 'https://example.com/bukti-reimburse.jpg',
      status: 'pending',
      current_level: 1,
    },
  });

  await prisma.reimburseItem.upsert({
    where: { id_reimburse_item: IDS.reimburseItem1 },
    update: {},
    create: {
      id_reimburse_item: IDS.reimburseItem1,
      id_reimburse: IDS.reimburse1,
      nama_item_reimburse: 'Transportasi',
      harga: 150000,
    },
  });

  await prisma.approvalReimburse.upsert({
    where: { id_approval_reimburse: IDS.approvalReimburse1 },
    update: {},
    create: {
      id_approval_reimburse: IDS.approvalReimburse1,
      id_reimburse: IDS.reimburse1,
      level: 1,
      approver_user_id: IDS.userHr,
      approver_role: 'HR',
      decision: 'pending',
      note: 'Menunggu bukti pembayaran.',
      bukti_approval_reimburse_url: null,
    },
  });

  await prisma.pocketMoney.upsert({
    where: { id_pocket_money: IDS.pocketMoney1 },
    update: {},
    create: {
      id_pocket_money: IDS.pocketMoney1,
      id_user: IDS.userKaryawan,
      id_departement: IDS.departementOps,
      id_kategori_keperluan: IDS.kategoriKeperluan1,
      tanggal: dates.day2,
      keterangan: 'Uang saku perjalanan.',
      total_pengeluaran: 50000,
      metode_pembayaran: 'cash',
      nomor_rekening: '1234567890',
      nama_pemilik_rekening: 'Karyawan Demo',
      jenis_bank: 'BCA',
      bukti_pembayaran_url: 'https://example.com/bukti-pocket-money.jpg',
      status: 'pending',
      current_level: 1,
    },
  });

  await prisma.pocketMoneyItem.upsert({
    where: { id_pocket_money_item: IDS.pocketMoneyItem1 },
    update: {},
    create: {
      id_pocket_money_item: IDS.pocketMoneyItem1,
      id_pocket_money: IDS.pocketMoney1,
      nama_item_pocket_money: 'Makan siang',
      harga: 50000,
    },
  });

  await prisma.approvalPocketMoney.upsert({
    where: { id_approval_pocket_money: IDS.approvalPocketMoney1 },
    update: {},
    create: {
      id_approval_pocket_money: IDS.approvalPocketMoney1,
      id_pocket_money: IDS.pocketMoney1,
      level: 1,
      approver_user_id: IDS.userHr,
      approver_role: 'HR',
      decision: 'pending',
      note: 'Menunggu verifikasi.',
      bukti_approval_pocket_money_url: null,
    },
  });

  await prisma.payment.upsert({
    where: { id_payment: IDS.payment1 },
    update: {},
    create: {
      id_payment: IDS.payment1,
      id_user: IDS.userKaryawan,
      id_departement: IDS.departementOps,
      id_kategori_keperluan: IDS.kategoriKeperluan1,
      tanggal: dates.day2,
      keterangan: 'Pembayaran vendor.',
      nominal_pembayaran: 250000,
      metode_pembayaran: 'transfer',
      nomor_rekening: '1234567890',
      nama_pemilik_rekening: 'Vendor Demo',
      jenis_bank: 'BCA',
      bukti_pembayaran_url: 'https://example.com/bukti-payment.jpg',
      status: 'pending',
      current_level: 1,
    },
  });

  await prisma.approvalPayment.upsert({
    where: { id_approval_payment: IDS.approvalPayment1 },
    update: {},
    create: {
      id_approval_payment: IDS.approvalPayment1,
      id_payment: IDS.payment1,
      level: 1,
      approver_user_id: IDS.userHr,
      approver_role: 'HR',
      decision: 'pending',
      note: 'Menunggu verifikasi.',
      bukti_approval_payment_url: null,
    },
  });

  await prisma.kategori_sop.upsert({
    where: { id_kategori_sop: IDS.kategoriSop1 },
    update: {},
    create: {
      id_kategori_sop: IDS.kategoriSop1,
      nama_kategori: 'Kebijakan Umum',
    },
  });

  await prisma.sop_karyawan.upsert({
    where: { id_sop_karyawan: IDS.sop1 },
    update: {},
    create: {
      id_sop_karyawan: IDS.sop1,
      nama_dokumen: 'SOP Kehadiran',
      lampiran_sop_url: 'https://example.com/sop-kehadiran.pdf',
      deskripsi: 'Dokumen SOP kehadiran karyawan.',
      id_kategori_sop: IDS.kategoriSop1,
      created_by_snapshot_nama_pengguna: 'Admin HR',
    },
  });

  await prisma.pinnedSop.upsert({
    where: { id_pinned_sop: IDS.pinnedSop1 },
    update: {},
    create: {
      id_pinned_sop: IDS.pinnedSop1,
      id_user: IDS.userKaryawan,
      id_sop: IDS.sop1,
    },
  });

  for (const template of notificationTemplates) {
    await prisma.notificationTemplate.upsert({
      where: { eventTrigger: template.eventTrigger },
      update: template.eventTrigger === 'AGENDA_OVERDUE' ? { titleTemplate: template.titleTemplate } : {},
      create: template,
    });
  }

  console.log('Seeding selesai.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
