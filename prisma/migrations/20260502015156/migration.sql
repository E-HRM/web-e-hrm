-- CreateTable
CREATE TABLE `location` (
    `id_location` CHAR(36) NOT NULL,
    `nama_kantor` VARCHAR(255) NOT NULL,
    `latitude` DECIMAL(10, 6) NOT NULL,
    `longitude` DECIMAL(10, 6) NOT NULL,
    `radius` INTEGER NULL,
    `created_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` DATETIME(0) NOT NULL,
    `deleted_at` DATETIME(0) NULL,

    PRIMARY KEY (`id_location`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `broadcasts` (
    `id_broadcasts` CHAR(36) NOT NULL,
    `title` LONGTEXT NOT NULL,
    `message` LONGTEXT NOT NULL,
    `created_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` DATETIME(0) NOT NULL,
    `deleted_at` DATETIME(0) NULL,

    PRIMARY KEY (`id_broadcasts`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `broadcasts_recipients` (
    `id_broadcast_recipients` CHAR(36) NOT NULL,
    `id_broadcast` CHAR(36) NOT NULL,
    `id_user` CHAR(36) NOT NULL,
    `nama_karyawan_snapshot` VARCHAR(255) NOT NULL,
    `created_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` DATETIME(0) NOT NULL,
    `deleted_at` DATETIME(0) NULL,

    INDEX `broadcasts_recipients_id_broadcast_idx`(`id_broadcast`),
    INDEX `broadcasts_recipients_id_user_idx`(`id_user`),
    PRIMARY KEY (`id_broadcast_recipients`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `broadcast_attachments` (
    `id_broadcast_attachment` CHAR(36) NOT NULL,
    `id_broadcast` CHAR(36) NOT NULL,
    `lampiran_url` LONGTEXT NOT NULL,
    `created_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` DATETIME(0) NOT NULL,
    `deleted_at` DATETIME(0) NULL,

    INDEX `broadcast_attachments_id_broadcast_idx`(`id_broadcast`),
    PRIMARY KEY (`id_broadcast_attachment`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `pola_kerja` (
    `id_pola_kerja` CHAR(36) NOT NULL,
    `nama_pola_kerja` VARCHAR(255) NOT NULL,
    `jam_mulai` DATETIME(0) NOT NULL,
    `jam_selesai` DATETIME(0) NOT NULL,
    `jam_istirahat_mulai` DATETIME(0) NULL,
    `jam_istirahat_selesai` DATETIME(0) NULL,
    `maks_jam_istirahat` INTEGER NULL,
    `created_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` DATETIME(0) NOT NULL,
    `deleted_at` DATETIME(0) NULL,

    PRIMARY KEY (`id_pola_kerja`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `shift_kerja` (
    `id_shift_kerja` CHAR(36) NOT NULL,
    `id_user` CHAR(36) NOT NULL,
    `tanggal_mulai` DATE NOT NULL,
    `tanggal_selesai` DATE NOT NULL,
    `hari_kerja` VARCHAR(191) NOT NULL,
    `status` ENUM('KERJA', 'LIBUR') NOT NULL,
    `id_pola_kerja` CHAR(36) NULL,
    `created_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` DATETIME(0) NOT NULL,
    `deleted_at` DATETIME(0) NULL,

    INDEX `shift_kerja_id_user_tanggal_mulai_idx`(`id_user`, `tanggal_mulai`),
    INDEX `shift_kerja_id_pola_kerja_idx`(`id_pola_kerja`),
    UNIQUE INDEX `shift_kerja_id_user_tanggal_mulai_key`(`id_user`, `tanggal_mulai`),
    PRIMARY KEY (`id_shift_kerja`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `agenda` (
    `id_agenda` CHAR(36) NOT NULL,
    `nama_agenda` LONGTEXT NOT NULL,
    `created_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` DATETIME(0) NOT NULL,
    `deleted_at` DATETIME(0) NULL,

    PRIMARY KEY (`id_agenda`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `agenda_kerja` (
    `id_agenda_kerja` CHAR(36) NOT NULL,
    `id_absensi` CHAR(36) NULL,
    `id_agenda` CHAR(36) NOT NULL,
    `id_user` CHAR(36) NOT NULL,
    `deskripsi_kerja` LONGTEXT NOT NULL,
    `detail_penyelesaian` LONGTEXT NULL,
    `detail_ditunda` LONGTEXT NULL,
    `start_date` DATETIME(0) NULL,
    `end_date` DATETIME(0) NULL,
    `duration_seconds` INTEGER NULL,
    `status` ENUM('teragenda', 'diproses', 'ditunda', 'selesai') NOT NULL,
    `kebutuhan_agenda` VARCHAR(255) NULL,
    `created_by_snapshot` VARCHAR(255) NULL,
    `created_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` DATETIME(0) NOT NULL,
    `deleted_at` DATETIME(0) NULL,

    INDEX `agenda_kerja_id_user_start_date_idx`(`id_user`, `start_date`),
    INDEX `agenda_kerja_id_absensi_idx`(`id_absensi`),
    INDEX `agenda_kerja_id_agenda_idx`(`id_agenda`),
    PRIMARY KEY (`id_agenda_kerja`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `kategori_kunjungan` (
    `id_kategori_kunjungan` CHAR(36) NOT NULL,
    `kategori_kunjungan` VARCHAR(191) NOT NULL,
    `created_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` DATETIME(0) NOT NULL,
    `deleted_at` DATETIME(0) NULL,

    UNIQUE INDEX `kategori_kunjungan_kategori_kunjungan_key`(`kategori_kunjungan`),
    PRIMARY KEY (`id_kategori_kunjungan`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `kunjungan` (
    `id_kunjungan` CHAR(36) NOT NULL,
    `id_user` CHAR(36) NOT NULL,
    `id_kategori_kunjungan` CHAR(36) NULL,
    `tanggal` DATE NULL,
    `jam_mulai` DATETIME(0) NULL,
    `jam_selesai` DATETIME(0) NULL,
    `deskripsi` LONGTEXT NULL,
    `jam_checkin` DATETIME(0) NULL,
    `jam_checkout` DATETIME(0) NULL,
    `start_latitude` DECIMAL(10, 6) NULL,
    `start_longitude` DECIMAL(10, 6) NULL,
    `end_latitude` DECIMAL(10, 6) NULL,
    `end_longitude` DECIMAL(10, 6) NULL,
    `lampiran_kunjungan_url` LONGTEXT NULL,
    `status_kunjungan` ENUM('diproses', 'berlangsung', 'selesai') NOT NULL DEFAULT 'diproses',
    `duration` INTEGER NULL,
    `hand_over` LONGTEXT NULL,
    `created_by_snapshot` VARCHAR(255) NULL,
    `created_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` DATETIME(0) NOT NULL,
    `deleted_at` DATETIME(0) NULL,

    INDEX `kunjungan_id_user_tanggal_idx`(`id_user`, `tanggal`),
    INDEX `kunjungan_id_kategori_kunjungan_idx`(`id_kategori_kunjungan`),
    PRIMARY KEY (`id_kunjungan`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `kunjungan_report_recipients` (
    `id_kunjungan_report_recipient` CHAR(36) NOT NULL,
    `id_kunjungan` CHAR(36) NOT NULL,
    `id_user` CHAR(36) NOT NULL,
    `recipient_nama_snapshot` VARCHAR(255) NOT NULL,
    `recipient_role_snapshot` ENUM('HR', 'OPERASIONAL', 'DIREKTUR', 'SUPERADMIN') NULL,
    `catatan` LONGTEXT NULL,
    `status` ENUM('terkirim', 'disetujui', 'ditolak') NOT NULL DEFAULT 'terkirim',
    `notified_at` DATETIME(0) NULL,
    `read_at` DATETIME(0) NULL,
    `acted_at` DATETIME(0) NULL,
    `created_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` DATETIME(0) NOT NULL,
    `deleted_at` DATETIME(0) NULL,

    INDEX `kunjungan_report_recipients_id_kunjungan_idx`(`id_kunjungan`),
    INDEX `kunjungan_report_recipients_id_user_idx`(`id_user`),
    UNIQUE INDEX `kunjungan_report_recipients_id_kunjungan_id_user_key`(`id_kunjungan`, `id_user`),
    PRIMARY KEY (`id_kunjungan_report_recipient`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `user` (
    `id_user` CHAR(36) NOT NULL,
    `nama_pengguna` VARCHAR(255) NOT NULL,
    `email` VARCHAR(255) NOT NULL,
    `password_hash` VARCHAR(255) NOT NULL,
    `kontak` VARCHAR(32) NULL,
    `nama_kontak_darurat` VARCHAR(32) NULL,
    `kontak_darurat` VARCHAR(32) NULL,
    `password_updated_at` DATETIME(0) NULL,
    `agama` VARCHAR(32) NULL,
    `foto_profil_user` LONGTEXT NULL,
    `tanggal_lahir` DATE NULL,
    `role` ENUM('KARYAWAN', 'HR', 'OPERASIONAL', 'DIREKTUR', 'SUPERADMIN', 'SUBADMIN', 'SUPERVISI') NOT NULL,
    `id_departement` CHAR(36) NULL,
    `id_location` CHAR(36) NULL,
    `reset_password_token` VARCHAR(255) NULL,
    `reset_password_expires_at` DATETIME(0) NULL,
    `tempat_lahir` VARCHAR(255) NULL,
    `jenis_kelamin` ENUM('LAKI_LAKI', 'PEREMPUAN') NULL,
    `golongan_darah` VARCHAR(5) NULL,
    `status_perkawinan` VARCHAR(50) NULL,
    `alamat_ktp` LONGTEXT NULL,
    `alamat_ktp_provinsi` VARCHAR(255) NULL,
    `alamat_ktp_kota` VARCHAR(255) NULL,
    `alamat_domisili` LONGTEXT NULL,
    `alamat_domisili_provinsi` VARCHAR(255) NULL,
    `alamat_domisili_kota` VARCHAR(255) NULL,
    `zona_waktu` VARCHAR(50) NULL,
    `jenjang_pendidikan` VARCHAR(50) NULL,
    `jurusan` VARCHAR(100) NULL,
    `nama_institusi_pendidikan` VARCHAR(255) NULL,
    `tahun_lulus` INTEGER NULL,
    `nomor_induk_karyawan` VARCHAR(100) NULL,
    `divisi` VARCHAR(100) NULL,
    `id_jabatan` CHAR(36) NULL,
    `status_kerja` ENUM('AKTIF', 'TIDAK_AKTIF', 'CUTI') NULL,
    `status_cuti` ENUM('aktif', 'nonaktif') NOT NULL DEFAULT 'aktif',
    `tanggal_mulai_bekerja` DATE NULL,
    `nomor_rekening` VARCHAR(50) NULL,
    `jenis_bank` VARCHAR(50) NULL,
    `nama_pemilik_rekening` VARCHAR(70) NULL,
    `catatan_delete` LONGTEXT NULL,
    `ttd_url` LONGTEXT NULL,
    `created_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` DATETIME(0) NOT NULL,
    `deleted_at` DATETIME(0) NULL,

    UNIQUE INDEX `user_email_key`(`email`),
    UNIQUE INDEX `user_nomor_induk_karyawan_key`(`nomor_induk_karyawan`),
    INDEX `user_id_departement_idx`(`id_departement`),
    INDEX `user_id_location_idx`(`id_location`),
    INDEX `user_id_jabatan_idx`(`id_jabatan`),
    PRIMARY KEY (`id_user`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `freelance` (
    `id_freelance` CHAR(36) NOT NULL,
    `nama` VARCHAR(255) NOT NULL,
    `alamat` VARCHAR(255) NULL,
    `kontak` VARCHAR(32) NULL,
    `email` VARCHAR(255) NULL,
    `id_supervisor` CHAR(36) NULL,
    `nomor_rekening` VARCHAR(50) NULL,
    `jenis_bank` VARCHAR(50) NULL,
    `nama_pemilik_rekening` VARCHAR(70) NULL,
    `created_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` DATETIME(0) NOT NULL,
    `deleted_at` DATETIME(0) NULL,

    INDEX `freelance_id_supervisor_idx`(`id_supervisor`),
    PRIMARY KEY (`id_freelance`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `form_freelance` (
    `id_form_freelance` CHAR(36) NOT NULL,
    `id_freelance` CHAR(36) NOT NULL,
    `tanggal_kerja` DATE NULL,
    `status_hari_kerja` ENUM('FULL_DAY', 'HALF_DAY') NOT NULL,
    `todo_list` LONGTEXT NOT NULL,
    `decision` ENUM('disetujui', 'ditolak', 'pending') NOT NULL DEFAULT 'pending',
    `approver_user_id` CHAR(36) NULL,
    `approver_role` ENUM('KARYAWAN', 'HR', 'OPERASIONAL', 'DIREKTUR', 'SUPERADMIN', 'SUBADMIN', 'SUPERVISI') NULL,
    `decided_at` DATETIME(0) NULL,
    `note` LONGTEXT NULL,
    `created_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` DATETIME(0) NOT NULL,
    `deleted_at` DATETIME(0) NULL,

    INDEX `form_freelance_id_freelance_idx`(`id_freelance`),
    INDEX `form_freelance_tanggal_kerja_idx`(`tanggal_kerja`),
    INDEX `form_freelance_approver_user_id_idx`(`approver_user_id`),
    PRIMARY KEY (`id_form_freelance`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `departement` (
    `id_departement` CHAR(36) NOT NULL,
    `nama_departement` VARCHAR(256) NOT NULL,
    `id_supervisor` CHAR(36) NULL,
    `created_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` DATETIME(0) NOT NULL,
    `deleted_at` DATETIME(0) NULL,

    UNIQUE INDEX `departement_id_supervisor_key`(`id_supervisor`),
    PRIMARY KEY (`id_departement`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `jabatan` (
    `id_jabatan` CHAR(36) NOT NULL,
    `nama_jabatan` VARCHAR(256) NOT NULL,
    `id_departement` CHAR(36) NULL,
    `id_induk_jabatan` CHAR(36) NULL,
    `created_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` DATETIME(0) NOT NULL,
    `deleted_at` DATETIME(0) NULL,

    INDEX `jabatan_id_departement_idx`(`id_departement`),
    INDEX `jabatan_id_induk_jabatan_idx`(`id_induk_jabatan`),
    PRIMARY KEY (`id_jabatan`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `istirahat` (
    `id_istirahat` CHAR(36) NOT NULL,
    `id_user` CHAR(36) NOT NULL,
    `id_absensi` CHAR(36) NOT NULL,
    `tanggal_istirahat` DATE NOT NULL,
    `start_istirahat` DATETIME(0) NOT NULL,
    `end_istirahat` DATETIME(0) NULL,
    `start_istirahat_latitude` DECIMAL(10, 6) NULL,
    `start_istirahat_longitude` DECIMAL(10, 6) NULL,
    `end_istirahat_latitude` DECIMAL(10, 6) NULL,
    `end_istirahat_longitude` DECIMAL(10, 6) NULL,
    `created_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` DATETIME(0) NOT NULL,
    `deleted_at` DATETIME(0) NULL,

    INDEX `istirahat_id_user_tanggal_istirahat_idx`(`id_user`, `tanggal_istirahat`),
    INDEX `istirahat_id_absensi_idx`(`id_absensi`),
    PRIMARY KEY (`id_istirahat`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `face` (
    `id_face` CHAR(36) NOT NULL,
    `id_user` CHAR(36) NOT NULL,
    `image_face` LONGTEXT NOT NULL,
    `created_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` DATETIME(0) NOT NULL,
    `deleted_at` DATETIME(0) NULL,

    INDEX `face_id_user_idx`(`id_user`),
    PRIMARY KEY (`id_face`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `story_planner` (
    `id_story` CHAR(36) NOT NULL,
    `id_user` CHAR(36) NOT NULL,
    `id_departement` CHAR(36) NULL,
    `deskripsi_kerja` LONGTEXT NOT NULL,
    `count_time` DATETIME(0) NULL,
    `status` ENUM('berjalan', 'berhenti', 'selesai') NOT NULL,
    `created_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` DATETIME(0) NOT NULL,
    `deleted_at` DATETIME(0) NULL,

    INDEX `story_planner_id_user_idx`(`id_user`),
    INDEX `story_planner_id_departement_idx`(`id_departement`),
    PRIMARY KEY (`id_story`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `device` (
    `id_device` CHAR(36) NOT NULL,
    `id_user` CHAR(36) NOT NULL,
    `device_label` VARCHAR(255) NULL,
    `platform` VARCHAR(50) NULL,
    `os_version` VARCHAR(50) NULL,
    `app_version` VARCHAR(50) NULL,
    `device_identifier` VARCHAR(191) NULL,
    `last_seen` DATETIME(0) NULL,
    `fcm_token` VARCHAR(1024) NULL,
    `fcm_token_updated_at` DATETIME(0) NULL,
    `push_enabled` BOOLEAN NOT NULL DEFAULT true,
    `last_push_at` DATETIME(0) NULL,
    `failed_push_count` INTEGER NOT NULL DEFAULT 0,
    `created_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` DATETIME(0) NOT NULL,
    `deleted_at` DATETIME(0) NULL,

    INDEX `device_id_user_idx`(`id_user`),
    INDEX `device_device_identifier_idx`(`device_identifier`),
    INDEX `device_fcm_token_idx`(`fcm_token`(191)),
    PRIMARY KEY (`id_device`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Absensi` (
    `id_absensi` CHAR(36) NOT NULL,
    `id_user` CHAR(36) NOT NULL,
    `face_verified_masuk` BOOLEAN NOT NULL,
    `face_verified_pulang` BOOLEAN NOT NULL,
    `tanggal` DATE NULL,
    `id_lokasi_pulang` CHAR(36) NULL,
    `id_lokasi_datang` CHAR(36) NULL,
    `jam_masuk` DATETIME(0) NULL,
    `jam_pulang` DATETIME(0) NULL,
    `status_masuk` ENUM('tepat', 'terlambat') NULL,
    `status_pulang` ENUM('tepat', 'terlambat') NULL,
    `in_latitude` DECIMAL(10, 6) NULL,
    `in_longitude` DECIMAL(10, 6) NULL,
    `out_latitude` DECIMAL(10, 6) NULL,
    `out_longitude` DECIMAL(10, 6) NULL,
    `created_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` DATETIME(0) NOT NULL,
    `deleted_at` DATETIME(0) NULL,

    INDEX `Absensi_id_user_tanggal_idx`(`id_user`, `tanggal`),
    INDEX `Absensi_id_lokasi_datang_idx`(`id_lokasi_datang`),
    INDEX `Absensi_id_lokasi_pulang_idx`(`id_lokasi_pulang`),
    UNIQUE INDEX `Absensi_id_user_tanggal_key`(`id_user`, `tanggal`),
    PRIMARY KEY (`id_absensi`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `absensi_report_recipients` (
    `id_absensi_report_recipient` CHAR(36) NOT NULL,
    `id_absensi` CHAR(36) NOT NULL,
    `id_user` CHAR(36) NOT NULL,
    `recipient_nama_snapshot` VARCHAR(255) NOT NULL,
    `recipient_role_snapshot` ENUM('HR', 'OPERASIONAL', 'DIREKTUR', 'SUPERADMIN') NULL,
    `catatan` LONGTEXT NULL,
    `status` ENUM('terkirim', 'disetujui', 'ditolak') NOT NULL DEFAULT 'terkirim',
    `notified_at` DATETIME(0) NULL,
    `read_at` DATETIME(0) NULL,
    `acted_at` DATETIME(0) NULL,
    `created_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` DATETIME(0) NOT NULL,
    `deleted_at` DATETIME(0) NULL,

    INDEX `absensi_report_recipients_id_absensi_idx`(`id_absensi`),
    INDEX `absensi_report_recipients_id_user_idx`(`id_user`),
    UNIQUE INDEX `absensi_report_recipients_id_absensi_id_user_key`(`id_absensi`, `id_user`),
    PRIMARY KEY (`id_absensi_report_recipient`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `catatan` (
    `id_catatan` CHAR(36) NOT NULL,
    `id_absensi` CHAR(36) NOT NULL,
    `deskripsi_catatan` LONGTEXT NOT NULL,
    `lampiran_url` LONGTEXT NULL,
    `created_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` DATETIME(0) NOT NULL,
    `deleted_at` DATETIME(0) NULL,

    INDEX `catatan_id_absensi_idx`(`id_absensi`),
    PRIMARY KEY (`id_catatan`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `notifications` (
    `id_notification` CHAR(36) NOT NULL,
    `id_user` CHAR(36) NOT NULL,
    `title` VARCHAR(255) NOT NULL,
    `body` LONGTEXT NOT NULL,
    `data_json` LONGTEXT NULL,
    `related_table` VARCHAR(64) NULL,
    `related_id` CHAR(36) NULL,
    `status` ENUM('unread', 'read', 'archived') NOT NULL DEFAULT 'unread',
    `seen_at` DATETIME(0) NULL,
    `read_at` DATETIME(0) NULL,
    `created_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` DATETIME(0) NOT NULL,
    `deleted_at` DATETIME(0) NULL,

    INDEX `notifications_id_user_status_created_at_idx`(`id_user`, `status`, `created_at`),
    INDEX `notifications_related_table_related_id_idx`(`related_table`, `related_id`),
    PRIMARY KEY (`id_notification`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `notification_templates` (
    `id` VARCHAR(191) NOT NULL,
    `event_trigger` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NOT NULL,
    `title_template` VARCHAR(191) NOT NULL,
    `body_template` TEXT NOT NULL,
    `placeholders` VARCHAR(191) NULL,
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `notification_templates_event_trigger_key`(`event_trigger`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Lembur` (
    `id_lembur` CHAR(36) NOT NULL,
    `id_user` CHAR(36) NOT NULL,
    `tanggal` DATE NULL,
    `jam_mulai` DATETIME(0) NULL,
    `jam_selesai` DATETIME(0) NULL,
    `alasan` LONGTEXT NULL,
    `status` ENUM('pending', 'disetujui', 'ditolak') NOT NULL,
    `current_level` INTEGER NULL,
    `created_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` DATETIME(0) NOT NULL,
    `deleted_at` DATETIME(0) NULL,

    INDEX `Lembur_id_user_tanggal_idx`(`id_user`, `tanggal`),
    INDEX `Lembur_status_idx`(`status`),
    PRIMARY KEY (`id_lembur`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `lembur_approval` (
    `id_lembur_approval` CHAR(36) NOT NULL,
    `id_lembur` CHAR(36) NOT NULL,
    `level` INTEGER NOT NULL,
    `approver_user_id` CHAR(36) NULL,
    `approver_role` ENUM('KARYAWAN', 'HR', 'OPERASIONAL', 'DIREKTUR', 'SUPERADMIN', 'SUBADMIN', 'SUPERVISI') NULL,
    `decision` ENUM('disetujui', 'ditolak', 'pending') NOT NULL DEFAULT 'pending',
    `decided_at` DATETIME(0) NULL,
    `note` LONGTEXT NULL,
    `created_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` DATETIME(0) NOT NULL,
    `deleted_at` DATETIME(0) NULL,

    INDEX `lembur_approval_id_lembur_level_idx`(`id_lembur`, `level`),
    INDEX `lembur_approval_approver_user_id_idx`(`approver_user_id`),
    PRIMARY KEY (`id_lembur_approval`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `jadwal_story_planer` (
    `id_jadwal_story_planner` CHAR(36) NOT NULL,
    `Tahun` DATE NULL,
    `Bulan` ENUM('JANUARI', 'FEBRUARI', 'MARET', 'APRIL', 'MEI', 'JUNI', 'JULI', 'AGUSTUS', 'SEPTEMBER', 'OKTOBER', 'NOVEMBER', 'DESEMBER') NOT NULL,
    `keterangan` LONGTEXT NULL,
    `created_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` DATETIME(0) NOT NULL,
    `deleted_at` DATETIME(0) NULL,

    PRIMARY KEY (`id_jadwal_story_planner`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `shift_story_planer` (
    `id_shift_story_planner` CHAR(36) NOT NULL,
    `id_jadwal_story_planner` CHAR(36) NOT NULL,
    `id_user` CHAR(36) NOT NULL,
    `hari_story_planner` VARCHAR(191) NOT NULL,
    `created_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` DATETIME(0) NOT NULL,
    `deleted_at` DATETIME(0) NULL,

    INDEX `shift_story_planer_id_jadwal_story_planner_idx`(`id_jadwal_story_planner`),
    INDEX `shift_story_planer_id_user_idx`(`id_user`),
    PRIMARY KEY (`id_shift_story_planner`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `kategori_sakit` (
    `id_kategori_sakit` CHAR(36) NOT NULL,
    `nama_kategori` VARCHAR(255) NOT NULL,
    `created_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` DATETIME(0) NOT NULL,
    `deleted_at` DATETIME(0) NULL,

    PRIMARY KEY (`id_kategori_sakit`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `kategori_izin_jam` (
    `id_kategori_izin_jam` CHAR(36) NOT NULL,
    `nama_kategori` VARCHAR(255) NOT NULL,
    `created_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` DATETIME(0) NOT NULL,
    `deleted_at` DATETIME(0) NULL,

    PRIMARY KEY (`id_kategori_izin_jam`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `cuti_konfigurasi` (
    `id_cuti_konfigurasi` CHAR(36) NOT NULL,
    `id_user` CHAR(36) NOT NULL,
    `bulan` ENUM('JANUARI', 'FEBRUARI', 'MARET', 'APRIL', 'MEI', 'JUNI', 'JULI', 'AGUSTUS', 'SEPTEMBER', 'OKTOBER', 'NOVEMBER', 'DESEMBER') NOT NULL,
    `kouta_cuti` INTEGER NOT NULL,
    `cuti_tabung` INTEGER NOT NULL,
    `created_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` DATETIME(0) NOT NULL,
    `deleted_at` DATETIME(0) NULL,

    INDEX `cuti_konfigurasi_id_user_idx`(`id_user`),
    UNIQUE INDEX `cuti_konfigurasi_id_user_bulan_key`(`id_user`, `bulan`),
    PRIMARY KEY (`id_cuti_konfigurasi`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `kategori_cuti` (
    `id_kategori_cuti` CHAR(36) NOT NULL,
    `nama_kategori` VARCHAR(255) NOT NULL,
    `pengurangan_kouta` BOOLEAN NOT NULL DEFAULT true,
    `created_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` DATETIME(0) NOT NULL,
    `deleted_at` DATETIME(0) NULL,

    PRIMARY KEY (`id_kategori_cuti`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `kategori_keperluan` (
    `id_kategori_keperluan` CHAR(36) NOT NULL,
    `nama_keperluan` VARCHAR(255) NOT NULL,
    `created_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` DATETIME(0) NOT NULL,
    `deleted_at` DATETIME(0) NULL,

    PRIMARY KEY (`id_kategori_keperluan`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `pengajuan_cuti` (
    `id_pengajuan_cuti` CHAR(36) NOT NULL,
    `id_user` CHAR(36) NOT NULL,
    `id_kategori_cuti` CHAR(36) NOT NULL,
    `keperluan` LONGTEXT NULL,
    `tanggal_masuk_kerja` DATE NOT NULL,
    `handover` LONGTEXT NULL,
    `status` ENUM('disetujui', 'ditolak', 'pending') NOT NULL DEFAULT 'pending',
    `current_level` INTEGER NULL,
    `jenis_pengajuan` VARCHAR(32) NOT NULL,
    `lampiran_cuti_url` LONGTEXT NULL,
    `created_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` DATETIME(0) NOT NULL,
    `deleted_at` DATETIME(0) NULL,

    INDEX `pengajuan_cuti_id_user_idx`(`id_user`),
    INDEX `pengajuan_cuti_id_kategori_cuti_idx`(`id_kategori_cuti`),
    PRIMARY KEY (`id_pengajuan_cuti`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `pengajuan_cuti_tanggal` (
    `id_pengajuan_cuti_tanggal` CHAR(36) NOT NULL,
    `id_pengajuan_cuti` CHAR(36) NOT NULL,
    `tanggal_cuti` DATE NOT NULL,
    `created_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `pengajuan_cuti_tanggal_id_pengajuan_cuti_tanggal_cuti_idx`(`id_pengajuan_cuti`, `tanggal_cuti`),
    UNIQUE INDEX `pengajuan_cuti_tanggal_id_pengajuan_cuti_tanggal_cuti_key`(`id_pengajuan_cuti`, `tanggal_cuti`),
    PRIMARY KEY (`id_pengajuan_cuti_tanggal`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `approval_pengajuan_cuti` (
    `id_approval_pengajuan_cuti` CHAR(36) NOT NULL,
    `id_pengajuan_cuti` CHAR(36) NOT NULL,
    `level` INTEGER NOT NULL,
    `approver_user_id` CHAR(36) NULL,
    `approver_role` ENUM('KARYAWAN', 'HR', 'OPERASIONAL', 'DIREKTUR', 'SUPERADMIN', 'SUBADMIN', 'SUPERVISI') NULL,
    `decision` ENUM('disetujui', 'ditolak', 'pending') NOT NULL DEFAULT 'pending',
    `decided_at` DATETIME(0) NULL,
    `note` LONGTEXT NULL,
    `created_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` DATETIME(0) NOT NULL,
    `deleted_at` DATETIME(0) NULL,

    INDEX `approval_pengajuan_cuti_id_pengajuan_cuti_level_idx`(`id_pengajuan_cuti`, `level`),
    INDEX `approval_pengajuan_cuti_approver_user_id_idx`(`approver_user_id`),
    PRIMARY KEY (`id_approval_pengajuan_cuti`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `pengajuan_izin_sakit` (
    `id_pengajuan_izin_sakit` CHAR(36) NOT NULL,
    `id_user` CHAR(36) NOT NULL,
    `id_kategori_sakit` CHAR(36) NOT NULL,
    `handover` LONGTEXT NULL,
    `lampiran_izin_sakit_url` LONGTEXT NULL,
    `status` ENUM('disetujui', 'ditolak', 'pending') NOT NULL DEFAULT 'pending',
    `current_level` INTEGER NULL,
    `jenis_pengajuan` VARCHAR(32) NOT NULL,
    `tanggal_pengajuan` DATE NULL,
    `created_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` DATETIME(0) NOT NULL,
    `deleted_at` DATETIME(0) NULL,

    INDEX `pengajuan_izin_sakit_id_user_idx`(`id_user`),
    INDEX `pengajuan_izin_sakit_id_kategori_sakit_idx`(`id_kategori_sakit`),
    PRIMARY KEY (`id_pengajuan_izin_sakit`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `approval_izin_sakit` (
    `id_approval_izin_sakit` CHAR(36) NOT NULL,
    `id_pengajuan_izin_sakit` CHAR(36) NOT NULL,
    `level` INTEGER NOT NULL,
    `approver_user_id` CHAR(36) NULL,
    `approver_role` ENUM('KARYAWAN', 'HR', 'OPERASIONAL', 'DIREKTUR', 'SUPERADMIN', 'SUBADMIN', 'SUPERVISI') NULL,
    `decision` ENUM('disetujui', 'ditolak', 'pending') NOT NULL DEFAULT 'pending',
    `decided_at` DATETIME(0) NULL,
    `note` LONGTEXT NULL,
    `created_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` DATETIME(0) NOT NULL,
    `deleted_at` DATETIME(0) NULL,

    INDEX `approval_izin_sakit_id_pengajuan_izin_sakit_level_idx`(`id_pengajuan_izin_sakit`, `level`),
    INDEX `approval_izin_sakit_approver_user_id_idx`(`approver_user_id`),
    PRIMARY KEY (`id_approval_izin_sakit`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `pengajuan_izin_jam` (
    `id_pengajuan_izin_jam` CHAR(36) NOT NULL,
    `id_user` CHAR(36) NOT NULL,
    `id_kategori_izin_jam` CHAR(36) NOT NULL,
    `tanggal_izin` DATE NOT NULL,
    `jam_mulai` DATETIME(0) NOT NULL,
    `jam_selesai` DATETIME(0) NOT NULL,
    `tanggal_pengganti` DATE NULL,
    `jam_mulai_pengganti` DATETIME(0) NULL,
    `jam_selesai_pengganti` DATETIME(0) NULL,
    `keperluan` LONGTEXT NULL,
    `handover` LONGTEXT NULL,
    `lampiran_izin_jam_url` LONGTEXT NULL,
    `status` ENUM('disetujui', 'ditolak', 'pending') NOT NULL DEFAULT 'pending',
    `current_level` INTEGER NULL,
    `jenis_pengajuan` VARCHAR(32) NOT NULL,
    `created_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` DATETIME(0) NOT NULL,
    `deleted_at` DATETIME(0) NULL,

    INDEX `pengajuan_izin_jam_id_user_tanggal_izin_idx`(`id_user`, `tanggal_izin`),
    INDEX `pengajuan_izin_jam_id_kategori_izin_jam_idx`(`id_kategori_izin_jam`),
    PRIMARY KEY (`id_pengajuan_izin_jam`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `approval_pengajuan_izin_jam` (
    `id_approval_pengajuan_izin_jam` CHAR(36) NOT NULL,
    `id_pengajuan_izin_jam` CHAR(36) NOT NULL,
    `level` INTEGER NOT NULL,
    `approver_user_id` CHAR(36) NULL,
    `approver_role` ENUM('KARYAWAN', 'HR', 'OPERASIONAL', 'DIREKTUR', 'SUPERADMIN', 'SUBADMIN', 'SUPERVISI') NULL,
    `decision` ENUM('disetujui', 'ditolak', 'pending') NOT NULL DEFAULT 'pending',
    `decided_at` DATETIME(0) NULL,
    `note` LONGTEXT NULL,
    `created_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` DATETIME(0) NOT NULL,
    `deleted_at` DATETIME(0) NULL,

    INDEX `approval_pengajuan_izin_jam_id_pengajuan_izin_jam_level_idx`(`id_pengajuan_izin_jam`, `level`),
    INDEX `approval_pengajuan_izin_jam_approver_user_id_idx`(`approver_user_id`),
    PRIMARY KEY (`id_approval_pengajuan_izin_jam`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `izin_tukar_hari` (
    `id_izin_tukar_hari` CHAR(36) NOT NULL,
    `id_user` CHAR(36) NOT NULL,
    `kategori` VARCHAR(255) NOT NULL,
    `keperluan` LONGTEXT NULL,
    `handover` LONGTEXT NULL,
    `lampiran_izin_tukar_hari_url` LONGTEXT NULL,
    `status` ENUM('disetujui', 'ditolak', 'pending') NOT NULL DEFAULT 'pending',
    `current_level` INTEGER NULL,
    `jenis_pengajuan` VARCHAR(32) NOT NULL,
    `created_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` DATETIME(0) NOT NULL,
    `deleted_at` DATETIME(0) NULL,

    INDEX `izin_tukar_hari_id_user_created_at_idx`(`id_user`, `created_at`),
    PRIMARY KEY (`id_izin_tukar_hari`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `izin_tukar_hari_pair` (
    `id_izin_tukar_hari_pair` CHAR(36) NOT NULL,
    `id_izin_tukar_hari` CHAR(36) NOT NULL,
    `hari_izin` DATE NOT NULL,
    `hari_pengganti` DATE NOT NULL,
    `catatan_pair` LONGTEXT NULL,
    `created_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `izin_tukar_hari_pair_id_izin_tukar_hari_hari_izin_idx`(`id_izin_tukar_hari`, `hari_izin`),
    INDEX `izin_tukar_hari_pair_id_izin_tukar_hari_hari_pengganti_idx`(`id_izin_tukar_hari`, `hari_pengganti`),
    UNIQUE INDEX `izin_tukar_hari_pair_id_izin_tukar_hari_hari_izin_hari_pengg_key`(`id_izin_tukar_hari`, `hari_izin`, `hari_pengganti`),
    PRIMARY KEY (`id_izin_tukar_hari_pair`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `approval_izin_tukar_hari` (
    `id_approval_izin_tukar_hari` CHAR(36) NOT NULL,
    `id_izin_tukar_hari` CHAR(36) NOT NULL,
    `level` INTEGER NOT NULL,
    `approver_user_id` CHAR(36) NULL,
    `approver_role` ENUM('KARYAWAN', 'HR', 'OPERASIONAL', 'DIREKTUR', 'SUPERADMIN', 'SUBADMIN', 'SUPERVISI') NULL,
    `decision` ENUM('disetujui', 'ditolak', 'pending') NOT NULL DEFAULT 'pending',
    `decided_at` DATETIME(0) NULL,
    `note` LONGTEXT NULL,
    `created_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` DATETIME(0) NOT NULL,
    `deleted_at` DATETIME(0) NULL,

    INDEX `approval_izin_tukar_hari_id_izin_tukar_hari_level_idx`(`id_izin_tukar_hari`, `level`),
    INDEX `approval_izin_tukar_hari_approver_user_id_idx`(`approver_user_id`),
    PRIMARY KEY (`id_approval_izin_tukar_hari`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `handover_cuti` (
    `id_handover_cuti` CHAR(36) NOT NULL,
    `id_pengajuan_cuti` CHAR(36) NOT NULL,
    `id_user_tagged` CHAR(36) NOT NULL,
    `created_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `handover_cuti_id_pengajuan_cuti_idx`(`id_pengajuan_cuti`),
    INDEX `handover_cuti_id_user_tagged_idx`(`id_user_tagged`),
    UNIQUE INDEX `handover_cuti_id_pengajuan_cuti_id_user_tagged_key`(`id_pengajuan_cuti`, `id_user_tagged`),
    PRIMARY KEY (`id_handover_cuti`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `handover_izin_sakit` (
    `id_handover_sakit` CHAR(36) NOT NULL,
    `id_pengajuan_izin_sakit` CHAR(36) NOT NULL,
    `id_user_tagged` CHAR(36) NOT NULL,
    `created_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `handover_izin_sakit_id_pengajuan_izin_sakit_idx`(`id_pengajuan_izin_sakit`),
    INDEX `handover_izin_sakit_id_user_tagged_idx`(`id_user_tagged`),
    UNIQUE INDEX `handover_izin_sakit_id_pengajuan_izin_sakit_id_user_tagged_key`(`id_pengajuan_izin_sakit`, `id_user_tagged`),
    PRIMARY KEY (`id_handover_sakit`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `handover_izin_jam` (
    `id_handover_jam` CHAR(36) NOT NULL,
    `id_pengajuan_izin_jam` CHAR(36) NOT NULL,
    `id_user_tagged` CHAR(36) NOT NULL,
    `created_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `handover_izin_jam_id_pengajuan_izin_jam_idx`(`id_pengajuan_izin_jam`),
    INDEX `handover_izin_jam_id_user_tagged_idx`(`id_user_tagged`),
    UNIQUE INDEX `handover_izin_jam_id_pengajuan_izin_jam_id_user_tagged_key`(`id_pengajuan_izin_jam`, `id_user_tagged`),
    PRIMARY KEY (`id_handover_jam`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `handover_tukar_hari` (
    `id_handover_tukar_hari` CHAR(36) NOT NULL,
    `id_izin_tukar_hari` CHAR(36) NOT NULL,
    `id_user_tagged` CHAR(36) NOT NULL,
    `created_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `handover_tukar_hari_id_izin_tukar_hari_idx`(`id_izin_tukar_hari`),
    INDEX `handover_tukar_hari_id_user_tagged_idx`(`id_user_tagged`),
    UNIQUE INDEX `handover_tukar_hari_id_izin_tukar_hari_id_user_tagged_key`(`id_izin_tukar_hari`, `id_user_tagged`),
    PRIMARY KEY (`id_handover_tukar_hari`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `reimburse` (
    `id_reimburse` CHAR(36) NOT NULL,
    `id_user` CHAR(36) NOT NULL,
    `id_departement` CHAR(36) NOT NULL,
    `id_kategori_keperluan` CHAR(36) NULL,
    `tanggal` DATE NOT NULL,
    `keterangan` LONGTEXT NULL,
    `total_pengeluaran` DECIMAL(15, 2) NOT NULL DEFAULT 0,
    `metode_pembayaran` VARCHAR(50) NOT NULL,
    `nomor_rekening` VARCHAR(50) NULL,
    `nama_pemilik_rekening` VARCHAR(255) NULL,
    `jenis_bank` VARCHAR(50) NULL,
    `bukti_pembayaran_url` LONGTEXT NULL,
    `status` ENUM('disetujui', 'ditolak', 'pending') NOT NULL DEFAULT 'pending',
    `current_level` INTEGER NULL,
    `created_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` DATETIME(0) NOT NULL,
    `deleted_at` DATETIME(0) NULL,

    INDEX `reimburse_id_user_tanggal_idx`(`id_user`, `tanggal`),
    INDEX `reimburse_id_departement_tanggal_idx`(`id_departement`, `tanggal`),
    INDEX `reimburse_metode_pembayaran_idx`(`metode_pembayaran`),
    INDEX `reimburse_id_kategori_keperluan_idx`(`id_kategori_keperluan`),
    PRIMARY KEY (`id_reimburse`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `reimburse_items` (
    `id_reimburse_item` CHAR(36) NOT NULL,
    `id_reimburse` CHAR(36) NOT NULL,
    `nama_item_reimburse` LONGTEXT NOT NULL,
    `harga` DECIMAL(15, 2) NOT NULL,
    `created_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` DATETIME(0) NOT NULL,
    `deleted_at` DATETIME(0) NULL,

    INDEX `reimburse_items_id_reimburse_idx`(`id_reimburse`),
    PRIMARY KEY (`id_reimburse_item`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `pocket_money` (
    `id_pocket_money` CHAR(36) NOT NULL,
    `id_user` CHAR(36) NOT NULL,
    `id_departement` CHAR(36) NOT NULL,
    `id_kategori_keperluan` CHAR(36) NULL,
    `tanggal` DATE NOT NULL,
    `keterangan` LONGTEXT NULL,
    `total_pengeluaran` DECIMAL(15, 2) NOT NULL DEFAULT 0,
    `metode_pembayaran` VARCHAR(50) NOT NULL,
    `nomor_rekening` VARCHAR(50) NULL,
    `nama_pemilik_rekening` VARCHAR(255) NULL,
    `jenis_bank` VARCHAR(50) NULL,
    `bukti_pembayaran_url` LONGTEXT NULL,
    `status` ENUM('disetujui', 'ditolak', 'pending') NOT NULL DEFAULT 'pending',
    `current_level` INTEGER NULL,
    `created_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` DATETIME(0) NOT NULL,
    `deleted_at` DATETIME(0) NULL,

    INDEX `pocket_money_id_user_tanggal_idx`(`id_user`, `tanggal`),
    INDEX `pocket_money_id_departement_tanggal_idx`(`id_departement`, `tanggal`),
    INDEX `pocket_money_metode_pembayaran_idx`(`metode_pembayaran`),
    INDEX `pocket_money_id_kategori_keperluan_idx`(`id_kategori_keperluan`),
    PRIMARY KEY (`id_pocket_money`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `pocket_money_items` (
    `id_pocket_money_item` CHAR(36) NOT NULL,
    `id_pocket_money` CHAR(36) NOT NULL,
    `nama_item_pocket_money` LONGTEXT NOT NULL,
    `harga` DECIMAL(15, 2) NOT NULL,
    `created_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` DATETIME(0) NOT NULL,
    `deleted_at` DATETIME(0) NULL,

    INDEX `pocket_money_items_id_pocket_money_idx`(`id_pocket_money`),
    PRIMARY KEY (`id_pocket_money_item`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `payment` (
    `id_payment` CHAR(36) NOT NULL,
    `id_user` CHAR(36) NOT NULL,
    `id_departement` CHAR(36) NOT NULL,
    `id_kategori_keperluan` CHAR(36) NULL,
    `tanggal` DATE NOT NULL,
    `keterangan` LONGTEXT NULL,
    `nominal_pembayaran` DECIMAL(15, 2) NOT NULL DEFAULT 0,
    `metode_pembayaran` VARCHAR(50) NOT NULL,
    `nomor_rekening` VARCHAR(50) NULL,
    `nama_pemilik_rekening` VARCHAR(255) NULL,
    `jenis_bank` VARCHAR(50) NULL,
    `bukti_pembayaran_url` LONGTEXT NULL,
    `status` ENUM('disetujui', 'ditolak', 'pending') NOT NULL DEFAULT 'pending',
    `current_level` INTEGER NULL,
    `created_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` DATETIME(0) NOT NULL,
    `deleted_at` DATETIME(0) NULL,

    INDEX `payment_id_user_tanggal_idx`(`id_user`, `tanggal`),
    INDEX `payment_id_departement_tanggal_idx`(`id_departement`, `tanggal`),
    INDEX `payment_metode_pembayaran_idx`(`metode_pembayaran`),
    INDEX `payment_id_kategori_keperluan_idx`(`id_kategori_keperluan`),
    PRIMARY KEY (`id_payment`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `approval_reimburse` (
    `id_approval_reimburse` CHAR(36) NOT NULL,
    `id_reimburse` CHAR(36) NOT NULL,
    `level` INTEGER NOT NULL,
    `approver_user_id` CHAR(36) NULL,
    `approver_role` ENUM('KARYAWAN', 'HR', 'OPERASIONAL', 'DIREKTUR', 'SUPERADMIN', 'SUBADMIN', 'SUPERVISI') NULL,
    `decision` ENUM('disetujui', 'ditolak', 'pending') NOT NULL DEFAULT 'pending',
    `decided_at` DATETIME(0) NULL,
    `note` LONGTEXT NULL,
    `bukti_approval_reimburse_url` LONGTEXT NULL,
    `created_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` DATETIME(0) NOT NULL,
    `deleted_at` DATETIME(0) NULL,

    INDEX `approval_reimburse_id_reimburse_level_idx`(`id_reimburse`, `level`),
    INDEX `approval_reimburse_approver_user_id_idx`(`approver_user_id`),
    PRIMARY KEY (`id_approval_reimburse`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `approval_payment` (
    `id_approval_payment` CHAR(36) NOT NULL,
    `id_payment` CHAR(36) NOT NULL,
    `level` INTEGER NOT NULL,
    `approver_user_id` CHAR(36) NULL,
    `approver_role` ENUM('KARYAWAN', 'HR', 'OPERASIONAL', 'DIREKTUR', 'SUPERADMIN', 'SUBADMIN', 'SUPERVISI') NULL,
    `decision` ENUM('disetujui', 'ditolak', 'pending') NOT NULL DEFAULT 'pending',
    `decided_at` DATETIME(0) NULL,
    `note` LONGTEXT NULL,
    `bukti_approval_payment_url` LONGTEXT NULL,
    `created_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` DATETIME(0) NOT NULL,
    `deleted_at` DATETIME(0) NULL,

    INDEX `approval_payment_id_payment_level_idx`(`id_payment`, `level`),
    INDEX `approval_payment_approver_user_id_idx`(`approver_user_id`),
    PRIMARY KEY (`id_approval_payment`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `approval_pocket_money` (
    `id_approval_pocket_money` CHAR(36) NOT NULL,
    `id_pocket_money` CHAR(36) NOT NULL,
    `level` INTEGER NOT NULL,
    `approver_user_id` CHAR(36) NULL,
    `approver_role` ENUM('KARYAWAN', 'HR', 'OPERASIONAL', 'DIREKTUR', 'SUPERADMIN', 'SUBADMIN', 'SUPERVISI') NULL,
    `decision` ENUM('disetujui', 'ditolak', 'pending') NOT NULL DEFAULT 'pending',
    `decided_at` DATETIME(0) NULL,
    `note` LONGTEXT NULL,
    `bukti_approval_pocket_money_url` LONGTEXT NULL,
    `created_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` DATETIME(0) NOT NULL,
    `deleted_at` DATETIME(0) NULL,

    INDEX `approval_pocket_money_id_pocket_money_level_idx`(`id_pocket_money`, `level`),
    INDEX `approval_pocket_money_approver_user_id_idx`(`approver_user_id`),
    PRIMARY KEY (`id_approval_pocket_money`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `kategori_sop` (
    `id_kategori_sop` CHAR(36) NOT NULL,
    `nama_kategori` VARCHAR(255) NOT NULL,
    `created_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` DATETIME(0) NOT NULL,
    `deleted_at` DATETIME(0) NULL,

    INDEX `kategori_sop_nama_kategori_idx`(`nama_kategori`),
    PRIMARY KEY (`id_kategori_sop`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `sop_karyawan` (
    `id_sop_karyawan` CHAR(36) NOT NULL,
    `nama_dokumen` VARCHAR(255) NOT NULL,
    `lampiran_sop_url` LONGTEXT NULL,
    `deskripsi` LONGTEXT NULL,
    `id_kategori_sop` CHAR(36) NULL,
    `created_by_snapshot_nama_pengguna` VARCHAR(255) NULL,
    `created_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` DATETIME(0) NOT NULL,
    `deleted_at` DATETIME(0) NULL,

    INDEX `sop_karyawan_created_at_idx`(`created_at`),
    INDEX `sop_karyawan_id_kategori_sop_idx`(`id_kategori_sop`),
    PRIMARY KEY (`id_sop_karyawan`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `pinned_sops` (
    `id_pinned_sop` CHAR(36) NOT NULL,
    `id_user` CHAR(36) NOT NULL,
    `id_sop` CHAR(36) NOT NULL,
    `created_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `pinned_sops_id_user_idx`(`id_user`),
    INDEX `pinned_sops_id_sop_idx`(`id_sop`),
    UNIQUE INDEX `pinned_sops_id_user_id_sop_key`(`id_user`, `id_sop`),
    PRIMARY KEY (`id_pinned_sop`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `master_template` (
    `id_master_template` CHAR(36) NOT NULL,
    `nama_template` VARCHAR(255) NOT NULL,
    `file_template_url` LONGTEXT NOT NULL,
    `created_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` DATETIME(0) NOT NULL,
    `deleted_at` DATETIME(0) NULL,

    PRIMARY KEY (`id_master_template`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `profil_payroll` (
    `id_profil_payroll` CHAR(36) NOT NULL,
    `id_user` CHAR(36) NULL,
    `id_freelance` CHAR(36) NULL,
    `jenis_hubungan_kerja` ENUM('FREELANCE', 'INTERNSHIP', 'PKWT', 'PKWTT') NOT NULL,
    `gaji_pokok` DECIMAL(15, 2) NOT NULL DEFAULT 0,
    `tunjangan_bpjs` DECIMAL(15, 2) NOT NULL DEFAULT 0,
    `payroll_aktif` BOOLEAN NOT NULL DEFAULT true,
    `tanggal_mulai_payroll` DATE NULL,
    `catatan` LONGTEXT NULL,
    `created_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` DATETIME(0) NOT NULL,
    `deleted_at` DATETIME(0) NULL,

    INDEX `profil_payroll_jenis_hubungan_kerja_idx`(`jenis_hubungan_kerja`),
    INDEX `profil_payroll_id_freelance_idx`(`id_freelance`),
    INDEX `profil_payroll_deleted_at_idx`(`deleted_at`),
    UNIQUE INDEX `profil_payroll_id_user_key`(`id_user`),
    UNIQUE INDEX `profil_payroll_id_freelance_key`(`id_freelance`),
    PRIMARY KEY (`id_profil_payroll`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `tarif_pajak_ter` (
    `id_tarif_pajak_ter` CHAR(36) NOT NULL,
    `kode_kategori_pajak` VARCHAR(255) NOT NULL,
    `penghasilan_dari` DECIMAL(15, 2) NOT NULL,
    `penghasilan_sampai` DECIMAL(15, 2) NULL,
    `persen_tarif` DECIMAL(7, 4) NOT NULL,
    `berlaku_mulai` DATE NOT NULL,
    `berlaku_sampai` DATE NULL,
    `created_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` DATETIME(0) NOT NULL,
    `deleted_at` DATETIME(0) NULL,

    INDEX `tarif_pajak_ter_kode_kategori_pajak_penghasilan_dari_idx`(`kode_kategori_pajak`, `penghasilan_dari`),
    INDEX `tarif_pajak_ter_kode_kategori_pajak_berlaku_mulai_berlaku_sa_idx`(`kode_kategori_pajak`, `berlaku_mulai`, `berlaku_sampai`),
    INDEX `tarif_pajak_ter_deleted_at_idx`(`deleted_at`),
    PRIMARY KEY (`id_tarif_pajak_ter`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `tipe_komponen_payroll` (
    `id_tipe_komponen_payroll` CHAR(36) NOT NULL,
    `nama_tipe_komponen` VARCHAR(100) NOT NULL,
    `created_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` DATETIME(0) NOT NULL,
    `deleted_at` DATETIME(0) NULL,

    INDEX `tipe_komponen_payroll_deleted_at_idx`(`deleted_at`),
    UNIQUE INDEX `tipe_komponen_payroll_nama_tipe_komponen_key`(`nama_tipe_komponen`),
    PRIMARY KEY (`id_tipe_komponen_payroll`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `definisi_komponen_payroll` (
    `id_definisi_komponen_payroll` CHAR(36) NOT NULL,
    `id_tipe_komponen_payroll` CHAR(36) NOT NULL,
    `nama_komponen` VARCHAR(255) NOT NULL,
    `arah_komponen` ENUM('PEMASUKAN', 'POTONGAN') NOT NULL,
    `berulang_default` BOOLEAN NOT NULL DEFAULT false,
    `aktif` BOOLEAN NOT NULL DEFAULT true,
    `catatan` LONGTEXT NULL,
    `created_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` DATETIME(0) NOT NULL,
    `deleted_at` DATETIME(0) NULL,

    INDEX `definisi_komponen_payroll_id_tipe_komponen_payroll_arah_komp_idx`(`id_tipe_komponen_payroll`, `arah_komponen`),
    INDEX `definisi_komponen_payroll_deleted_at_idx`(`deleted_at`),
    UNIQUE INDEX `definisi_komponen_payroll_id_tipe_komponen_payroll_nama_komp_key`(`id_tipe_komponen_payroll`, `nama_komponen`, `arah_komponen`),
    PRIMARY KEY (`id_definisi_komponen_payroll`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `periode_payroll` (
    `id_periode_payroll` CHAR(36) NOT NULL,
    `tahun` INTEGER NOT NULL,
    `bulan` ENUM('JANUARI', 'FEBRUARI', 'MARET', 'APRIL', 'MEI', 'JUNI', 'JULI', 'AGUSTUS', 'SEPTEMBER', 'OKTOBER', 'NOVEMBER', 'DESEMBER') NOT NULL,
    `tanggal_mulai` DATE NOT NULL,
    `tanggal_selesai` DATE NOT NULL,
    `status_periode` ENUM('DRAFT', 'DIPROSES', 'TERKUNCI') NOT NULL DEFAULT 'DRAFT',
    `catatan` LONGTEXT NULL,
    `id_master_template` CHAR(36) NULL,
    `created_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` DATETIME(0) NOT NULL,

    INDEX `periode_payroll_id_master_template_idx`(`id_master_template`),
    UNIQUE INDEX `periode_payroll_tahun_bulan_key`(`tahun`, `bulan`),
    PRIMARY KEY (`id_periode_payroll`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `payroll_karyawan` (
    `id_payroll_karyawan` CHAR(36) NOT NULL,
    `id_periode_payroll` CHAR(36) NOT NULL,
    `id_user` CHAR(36) NULL,
    `id_freelance` CHAR(36) NULL,
    `id_profil_payroll` CHAR(36) NULL,
    `id_tarif_pajak_ter` CHAR(36) NULL,
    `nama_karyawan` VARCHAR(255) NOT NULL,
    `jenis_hubungan_kerja` ENUM('FREELANCE', 'INTERNSHIP', 'PKWT', 'PKWTT') NOT NULL,
    `kode_kategori_pajak_snapshot` VARCHAR(255) NOT NULL,
    `persen_tarif_snapshot` DECIMAL(7, 4) NOT NULL,
    `penghasilan_dari_snapshot` DECIMAL(15, 2) NOT NULL,
    `penghasilan_sampai_snapshot` DECIMAL(15, 2) NULL,
    `berlaku_mulai_tarif_snapshot` DATE NOT NULL,
    `berlaku_sampai_tarif_snapshot` DATE NULL,
    `gaji_pokok_snapshot` DECIMAL(15, 2) NOT NULL DEFAULT 0,
    `tunjangan_bpjs_snapshot` DECIMAL(15, 2) NOT NULL DEFAULT 0,
    `total_pendapatan_bruto` DECIMAL(15, 2) NOT NULL DEFAULT 0,
    `total_potongan` DECIMAL(15, 2) NOT NULL DEFAULT 0,
    `pph21_nominal` DECIMAL(15, 2) NOT NULL DEFAULT 0,
    `pendapatan_bersih` DECIMAL(15, 2) NOT NULL DEFAULT 0,
    `bank_name` VARCHAR(50) NULL,
    `bank_account` VARCHAR(50) NULL,
    `bank_account_holder` VARCHAR(70) NULL,
    `bca_transaction_id` VARCHAR(18) NULL,
    `status_payroll` ENUM('DRAFT', 'DISETUJUI', 'DIBAYAR') NOT NULL DEFAULT 'DRAFT',
    `status_approval` ENUM('disetujui', 'ditolak', 'pending') NOT NULL DEFAULT 'pending',
    `current_level_approval` INTEGER NULL,
    `bukti_bayar_url` LONGTEXT NULL,
    `finalized_at` DATETIME(0) NULL,
    `catatan` LONGTEXT NULL,
    `created_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` DATETIME(0) NOT NULL,
    `deleted_at` DATETIME(0) NULL,
    `issue_number` VARCHAR(100) NULL,
    `issued_at` DATETIME(0) NULL,
    `company_name_snapshot` VARCHAR(255) NULL,

    INDEX `payroll_karyawan_id_user_idx`(`id_user`),
    INDEX `payroll_karyawan_id_freelance_idx`(`id_freelance`),
    INDEX `payroll_karyawan_id_profil_payroll_idx`(`id_profil_payroll`),
    INDEX `payroll_karyawan_id_tarif_pajak_ter_idx`(`id_tarif_pajak_ter`),
    INDEX `payroll_karyawan_status_payroll_idx`(`status_payroll`),
    INDEX `payroll_karyawan_status_approval_idx`(`status_approval`),
    INDEX `payroll_karyawan_id_periode_payroll_status_payroll_idx`(`id_periode_payroll`, `status_payroll`),
    INDEX `payroll_karyawan_id_periode_payroll_status_approval_idx`(`id_periode_payroll`, `status_approval`),
    INDEX `payroll_karyawan_deleted_at_idx`(`deleted_at`),
    UNIQUE INDEX `payroll_karyawan_id_periode_payroll_id_user_key`(`id_periode_payroll`, `id_user`),
    UNIQUE INDEX `payroll_karyawan_id_periode_payroll_id_freelance_key`(`id_periode_payroll`, `id_freelance`),
    PRIMARY KEY (`id_payroll_karyawan`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `item_komponen_payroll` (
    `id_item_komponen_payroll` CHAR(36) NOT NULL,
    `id_payroll_karyawan` CHAR(36) NOT NULL,
    `id_definisi_komponen_payroll` CHAR(36) NULL,
    `id_user_pembuat` CHAR(36) NULL,
    `kunci_idempoten` VARCHAR(191) NOT NULL,
    `tipe_komponen` VARCHAR(100) NOT NULL,
    `arah_komponen` ENUM('PEMASUKAN', 'POTONGAN') NOT NULL,
    `nama_komponen` VARCHAR(255) NOT NULL,
    `nominal` DECIMAL(15, 2) NOT NULL,
    `urutan_tampil` INTEGER NULL DEFAULT 0,
    `catatan` LONGTEXT NULL,
    `created_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` DATETIME(0) NOT NULL,
    `deleted_at` DATETIME(0) NULL,

    INDEX `item_komponen_payroll_id_payroll_karyawan_idx`(`id_payroll_karyawan`),
    INDEX `item_komponen_payroll_id_definisi_komponen_payroll_idx`(`id_definisi_komponen_payroll`),
    INDEX `item_komponen_payroll_id_user_pembuat_idx`(`id_user_pembuat`),
    INDEX `item_komponen_payroll_tipe_komponen_arah_komponen_idx`(`tipe_komponen`, `arah_komponen`),
    INDEX `item_komponen_payroll_deleted_at_idx`(`deleted_at`),
    UNIQUE INDEX `item_komponen_payroll_kunci_idempoten_key`(`kunci_idempoten`),
    PRIMARY KEY (`id_item_komponen_payroll`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `approval_payroll_karyawan` (
    `id_approval_payroll_karyawan` CHAR(36) NOT NULL,
    `id_payroll_karyawan` CHAR(36) NOT NULL,
    `level` INTEGER NOT NULL,
    `approver_user_id` CHAR(36) NULL,
    `approver_role` ENUM('KARYAWAN', 'HR', 'OPERASIONAL', 'DIREKTUR', 'SUPERADMIN', 'SUBADMIN', 'SUPERVISI') NULL,
    `approver_nama_snapshot` VARCHAR(255) NULL,
    `decision` ENUM('disetujui', 'ditolak', 'pending') NOT NULL DEFAULT 'pending',
    `decided_at` DATETIME(0) NULL,
    `note` LONGTEXT NULL,
    `kode_otp_hash` VARCHAR(255) NULL,
    `otp_requested_at` DATETIME(0) NULL,
    `otp_expires_at` DATETIME(0) NULL,
    `otp_verified_at` DATETIME(0) NULL,
    `otp_attempts` INTEGER NOT NULL DEFAULT 0,
    `created_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` DATETIME(0) NOT NULL,
    `deleted_at` DATETIME(0) NULL,

    INDEX `approval_payroll_karyawan_id_payroll_karyawan_idx`(`id_payroll_karyawan`),
    INDEX `approval_payroll_karyawan_approver_user_id_idx`(`approver_user_id`),
    INDEX `approval_payroll_karyawan_decision_idx`(`decision`),
    INDEX `approval_payroll_karyawan_otp_verified_at_idx`(`otp_verified_at`),
    INDEX `approval_payroll_karyawan_deleted_at_idx`(`deleted_at`),
    UNIQUE INDEX `approval_payroll_karyawan_id_payroll_karyawan_level_key`(`id_payroll_karyawan`, `level`),
    PRIMARY KEY (`id_approval_payroll_karyawan`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `pinjaman_karyawan` (
    `id_pinjaman_karyawan` CHAR(36) NOT NULL,
    `id_user` CHAR(36) NOT NULL,
    `nama_pinjaman` VARCHAR(255) NOT NULL,
    `nominal_pinjaman` DECIMAL(15, 2) NOT NULL,
    `tenor_bulan` INTEGER NOT NULL,
    `sisa_saldo` DECIMAL(15, 2) NOT NULL,
    `tanggal_mulai` DATE NOT NULL,
    `tanggal_selesai` DATE NULL,
    `status_pinjaman` ENUM('DRAFT', 'AKTIF', 'LUNAS', 'DIBATALKAN') NOT NULL DEFAULT 'AKTIF',
    `catatan` LONGTEXT NULL,
    `created_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` DATETIME(0) NOT NULL,
    `deleted_at` DATETIME(0) NULL,

    INDEX `pinjaman_karyawan_id_user_status_pinjaman_idx`(`id_user`, `status_pinjaman`),
    INDEX `pinjaman_karyawan_deleted_at_idx`(`deleted_at`),
    PRIMARY KEY (`id_pinjaman_karyawan`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `cicilan_pinjaman_karyawan` (
    `id_cicilan_pinjaman_karyawan` CHAR(36) NOT NULL,
    `id_pinjaman_karyawan` CHAR(36) NOT NULL,
    `id_payroll_karyawan` CHAR(36) NULL,
    `jatuh_tempo` DATE NOT NULL,
    `nominal_tagihan` DECIMAL(15, 2) NOT NULL,
    `nominal_terbayar` DECIMAL(15, 2) NOT NULL DEFAULT 0,
    `status_cicilan` ENUM('MENUNGGU', 'DIPOSTING', 'DIBAYAR', 'DILEWATI') NOT NULL DEFAULT 'MENUNGGU',
    `diposting_pada` DATETIME(0) NULL,
    `dibayar_pada` DATETIME(0) NULL,
    `catatan` LONGTEXT NULL,
    `created_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` DATETIME(0) NOT NULL,
    `deleted_at` DATETIME(0) NULL,

    INDEX `cicilan_pinjaman_karyawan_id_pinjaman_karyawan_jatuh_tempo_idx`(`id_pinjaman_karyawan`, `jatuh_tempo`),
    INDEX `cicilan_pinjaman_karyawan_id_payroll_karyawan_idx`(`id_payroll_karyawan`),
    INDEX `cicilan_pinjaman_karyawan_status_cicilan_idx`(`status_cicilan`),
    INDEX `cicilan_pinjaman_karyawan_deleted_at_idx`(`deleted_at`),
    PRIMARY KEY (`id_cicilan_pinjaman_karyawan`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `periode_konsultan` (
    `id_periode_konsultan` CHAR(36) NOT NULL,
    `tahun` INTEGER NOT NULL,
    `bulan` ENUM('JANUARI', 'FEBRUARI', 'MARET', 'APRIL', 'MEI', 'JUNI', 'JULI', 'AGUSTUS', 'SEPTEMBER', 'OKTOBER', 'NOVEMBER', 'DESEMBER') NOT NULL,
    `tanggal_mulai` DATE NOT NULL,
    `tanggal_selesai` DATE NOT NULL,
    `status_periode` ENUM('DRAFT', 'DIREVIEW', 'DISETUJUI', 'TERKUNCI') NOT NULL DEFAULT 'DRAFT',
    `catatan` LONGTEXT NULL,
    `created_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` DATETIME(0) NOT NULL,
    `deleted_at` DATETIME(0) NULL,

    INDEX `periode_konsultan_status_periode_idx`(`status_periode`),
    INDEX `periode_konsultan_deleted_at_idx`(`deleted_at`),
    UNIQUE INDEX `periode_konsultan_tahun_bulan_key`(`tahun`, `bulan`),
    PRIMARY KEY (`id_periode_konsultan`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `jenis_produk_konsultan` (
    `id_jenis_produk_konsultan` CHAR(36) NOT NULL,
    `nama_produk` VARCHAR(255) NOT NULL,
    `persen_share_default` DECIMAL(7, 4) NULL,
    `aktif` BOOLEAN NOT NULL DEFAULT true,
    `catatan` LONGTEXT NULL,
    `created_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` DATETIME(0) NOT NULL,
    `deleted_at` DATETIME(0) NULL,

    INDEX `jenis_produk_konsultan_aktif_idx`(`aktif`),
    INDEX `jenis_produk_konsultan_deleted_at_idx`(`deleted_at`),
    UNIQUE INDEX `jenis_produk_konsultan_nama_produk_key`(`nama_produk`),
    PRIMARY KEY (`id_jenis_produk_konsultan`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `transaksi_konsultan` (
    `id_transaksi_konsultan` CHAR(36) NOT NULL,
    `id_periode_konsultan` CHAR(36) NOT NULL,
    `id_user_konsultan` CHAR(36) NULL,
    `id_jenis_produk_konsultan` CHAR(36) NULL,
    `tanggal_transaksi` DATE NOT NULL,
    `nama_klien` VARCHAR(255) NULL,
    `deskripsi` LONGTEXT NULL,
    `nominal_debit` DECIMAL(15, 2) NOT NULL DEFAULT 0,
    `nominal_kredit` DECIMAL(15, 2) NOT NULL DEFAULT 0,
    `total_income` DECIMAL(15, 2) NOT NULL DEFAULT 0,
    `persen_share_default` DECIMAL(7, 4) NULL,
    `persen_share_override` DECIMAL(7, 4) NULL,
    `nominal_share` DECIMAL(15, 2) NOT NULL DEFAULT 0,
    `nominal_oss` DECIMAL(15, 2) NOT NULL DEFAULT 0,
    `override_manual` BOOLEAN NOT NULL DEFAULT false,
    `sudah_posting_payroll` BOOLEAN NOT NULL DEFAULT false,
    `catatan` LONGTEXT NULL,
    `created_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` DATETIME(0) NOT NULL,
    `deleted_at` DATETIME(0) NULL,

    INDEX `transaksi_konsultan_id_periode_konsultan_tanggal_transaksi_idx`(`id_periode_konsultan`, `tanggal_transaksi`),
    INDEX `transaksi_konsultan_id_user_konsultan_tanggal_transaksi_idx`(`id_user_konsultan`, `tanggal_transaksi`),
    INDEX `transaksi_konsultan_id_jenis_produk_konsultan_idx`(`id_jenis_produk_konsultan`),
    INDEX `transaksi_konsultan_deleted_at_idx`(`deleted_at`),
    PRIMARY KEY (`id_transaksi_konsultan`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `payout_konsultan` (
    `id_payout_konsultan` CHAR(36) NOT NULL,
    `id_periode_konsultan` CHAR(36) NOT NULL,
    `id_user` CHAR(36) NOT NULL,
    `id_periode_payroll` CHAR(36) NULL,
    `total_share` DECIMAL(15, 2) NOT NULL,
    `nominal_ditahan` DECIMAL(15, 2) NOT NULL DEFAULT 0,
    `nominal_penyesuaian` DECIMAL(15, 2) NOT NULL DEFAULT 0,
    `nominal_dibayarkan` DECIMAL(15, 2) NOT NULL,
    `status_payout` ENUM('DRAFT', 'DISETUJUI', 'DIPOSTING_KE_PAYROLL', 'DITAHAN') NOT NULL DEFAULT 'DRAFT',
    `disetujui_pada` DATETIME(0) NULL,
    `diposting_pada` DATETIME(0) NULL,
    `catatan` LONGTEXT NULL,
    `created_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` DATETIME(0) NOT NULL,
    `deleted_at` DATETIME(0) NULL,

    INDEX `payout_konsultan_id_periode_payroll_idx`(`id_periode_payroll`),
    INDEX `payout_konsultan_status_payout_idx`(`status_payout`),
    INDEX `payout_konsultan_deleted_at_idx`(`deleted_at`),
    UNIQUE INDEX `payout_konsultan_id_periode_konsultan_id_user_key`(`id_periode_konsultan`, `id_user`),
    PRIMARY KEY (`id_payout_konsultan`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `payout_konsultan_detail` (
    `id_payout_konsultan_detail` CHAR(36) NOT NULL,
    `id_payout_konsultan` CHAR(36) NOT NULL,
    `id_transaksi_konsultan` CHAR(36) NOT NULL,
    `nominal_share` DECIMAL(15, 2) NOT NULL DEFAULT 0,
    `nominal_oss` DECIMAL(15, 2) NOT NULL DEFAULT 0,
    `ditahan` BOOLEAN NOT NULL DEFAULT false,
    `catatan` LONGTEXT NULL,
    `created_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` DATETIME(0) NOT NULL,
    `deleted_at` DATETIME(0) NULL,

    INDEX `payout_konsultan_detail_id_transaksi_konsultan_idx`(`id_transaksi_konsultan`),
    INDEX `payout_konsultan_detail_deleted_at_idx`(`deleted_at`),
    UNIQUE INDEX `payout_konsultan_detail_id_payout_konsultan_id_transaksi_kon_key`(`id_payout_konsultan`, `id_transaksi_konsultan`),
    PRIMARY KEY (`id_payout_konsultan_detail`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `kpi` (
    `id_kpi` CHAR(36) NOT NULL,
    `kode_kpi` VARCHAR(100) NULL,
    `nama_kpi` VARCHAR(255) NOT NULL,
    `deskripsi` LONGTEXT NULL,
    `default_satuan` VARCHAR(100) NULL,
    `value_type` ENUM('number', 'currency', 'percent') NOT NULL DEFAULT 'number',
    `created_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` DATETIME(0) NOT NULL,
    `deleted_at` DATETIME(0) NULL,

    UNIQUE INDEX `kpi_kode_kpi_key`(`kode_kpi`),
    INDEX `kpi_nama_kpi_idx`(`nama_kpi`),
    PRIMARY KEY (`id_kpi`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `kpi_jabatan` (
    `id_kpi_jabatan` CHAR(36) NOT NULL,
    `id_kpi` CHAR(36) NOT NULL,
    `id_jabatan` CHAR(36) NOT NULL,
    `urutan` INTEGER NOT NULL DEFAULT 0,
    `target_default` DECIMAL(18, 2) NULL,
    `satuan_override` VARCHAR(100) NULL,
    `bobot` DECIMAL(5, 2) NULL,
    `wajib` BOOLEAN NOT NULL DEFAULT true,
    `created_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` DATETIME(0) NOT NULL,
    `deleted_at` DATETIME(0) NULL,

    INDEX `kpi_jabatan_id_kpi_idx`(`id_kpi`),
    INDEX `kpi_jabatan_id_jabatan_idx`(`id_jabatan`),
    INDEX `kpi_jabatan_id_jabatan_urutan_idx`(`id_jabatan`, `urutan`),
    UNIQUE INDEX `kpi_jabatan_id_kpi_id_jabatan_key`(`id_kpi`, `id_jabatan`),
    PRIMARY KEY (`id_kpi_jabatan`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `kpi_plan` (
    `id_kpi_plan` CHAR(36) NOT NULL,
    `id_user` CHAR(36) NOT NULL,
    `id_jabatan` CHAR(36) NOT NULL,
    `id_location` CHAR(36) NULL,
    `tahun` INTEGER NOT NULL,
    `status` ENUM('draft', 'active', 'locked', 'archived') NOT NULL DEFAULT 'draft',
    `nama_user_snapshot` VARCHAR(255) NULL,
    `jabatan_snapshot` VARCHAR(255) NULL,
    `location_snapshot` VARCHAR(255) NULL,
    `created_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` DATETIME(0) NOT NULL,
    `deleted_at` DATETIME(0) NULL,

    INDEX `kpi_plan_id_user_idx`(`id_user`),
    INDEX `kpi_plan_id_jabatan_tahun_idx`(`id_jabatan`, `tahun`),
    INDEX `kpi_plan_id_location_tahun_idx`(`id_location`, `tahun`),
    INDEX `kpi_plan_tahun_status_idx`(`tahun`, `status`),
    UNIQUE INDEX `kpi_plan_id_user_tahun_key`(`id_user`, `tahun`),
    PRIMARY KEY (`id_kpi_plan`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `kpi_plan_item` (
    `id_kpi_plan_item` CHAR(36) NOT NULL,
    `id_kpi_plan` CHAR(36) NOT NULL,
    `id_kpi` CHAR(36) NOT NULL,
    `urutan` INTEGER NOT NULL DEFAULT 0,
    `nama_kpi_snapshot` VARCHAR(255) NOT NULL,
    `satuan_snapshot` VARCHAR(100) NULL,
    `target_tahunan` DECIMAL(18, 2) NOT NULL,
    `created_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` DATETIME(0) NOT NULL,
    `deleted_at` DATETIME(0) NULL,

    INDEX `kpi_plan_item_id_kpi_plan_idx`(`id_kpi_plan`),
    INDEX `kpi_plan_item_id_kpi_idx`(`id_kpi`),
    INDEX `kpi_plan_item_id_kpi_plan_urutan_idx`(`id_kpi_plan`, `urutan`),
    UNIQUE INDEX `kpi_plan_item_id_kpi_plan_id_kpi_key`(`id_kpi_plan`, `id_kpi`),
    PRIMARY KEY (`id_kpi_plan_item`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `kpi_plan_item_term` (
    `id_kpi_plan_term` CHAR(36) NOT NULL,
    `id_kpi_plan_item` CHAR(36) NOT NULL,
    `term` ENUM('term_1', 'term_2', 'term_3', 'term_4') NOT NULL,
    `target_term` DECIMAL(18, 2) NULL,
    `achievement` DECIMAL(18, 2) NULL,
    `catatan` LONGTEXT NULL,
    `created_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` DATETIME(0) NOT NULL,
    `deleted_at` DATETIME(0) NULL,

    INDEX `kpi_plan_item_term_id_kpi_plan_item_idx`(`id_kpi_plan_item`),
    UNIQUE INDEX `kpi_plan_item_term_id_kpi_plan_item_term_key`(`id_kpi_plan_item`, `term`),
    PRIMARY KEY (`id_kpi_plan_term`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `kpi_plan_item_week_progress` (
    `id_kpi_plan_item_week_progress` CHAR(36) NOT NULL,
    `id_kpi_plan_item` CHAR(36) NOT NULL,
    `tahun` INTEGER NOT NULL,
    `week_start` DATE NOT NULL,
    `week_end` DATE NOT NULL,
    `completed_count` INTEGER NOT NULL DEFAULT 0,
    `created_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` DATETIME(0) NOT NULL,

    INDEX `kpi_plan_item_week_progress_id_kpi_plan_item_idx`(`id_kpi_plan_item`),
    INDEX `kpi_plan_item_week_progress_tahun_week_start_idx`(`tahun`, `week_start`),
    UNIQUE INDEX `kpi_plan_item_week_progress_id_kpi_plan_item_week_start_key`(`id_kpi_plan_item`, `week_start`),
    PRIMARY KEY (`id_kpi_plan_item_week_progress`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `broadcasts_recipients` ADD CONSTRAINT `broadcasts_recipients_id_broadcast_fkey` FOREIGN KEY (`id_broadcast`) REFERENCES `broadcasts`(`id_broadcasts`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `broadcasts_recipients` ADD CONSTRAINT `broadcasts_recipients_id_user_fkey` FOREIGN KEY (`id_user`) REFERENCES `user`(`id_user`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `broadcast_attachments` ADD CONSTRAINT `broadcast_attachments_id_broadcast_fkey` FOREIGN KEY (`id_broadcast`) REFERENCES `broadcasts`(`id_broadcasts`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `shift_kerja` ADD CONSTRAINT `shift_kerja_id_user_fkey` FOREIGN KEY (`id_user`) REFERENCES `user`(`id_user`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `shift_kerja` ADD CONSTRAINT `shift_kerja_id_pola_kerja_fkey` FOREIGN KEY (`id_pola_kerja`) REFERENCES `pola_kerja`(`id_pola_kerja`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `agenda_kerja` ADD CONSTRAINT `agenda_kerja_id_user_fkey` FOREIGN KEY (`id_user`) REFERENCES `user`(`id_user`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `agenda_kerja` ADD CONSTRAINT `agenda_kerja_id_absensi_fkey` FOREIGN KEY (`id_absensi`) REFERENCES `Absensi`(`id_absensi`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `agenda_kerja` ADD CONSTRAINT `agenda_kerja_id_agenda_fkey` FOREIGN KEY (`id_agenda`) REFERENCES `agenda`(`id_agenda`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `kunjungan` ADD CONSTRAINT `kunjungan_id_user_fkey` FOREIGN KEY (`id_user`) REFERENCES `user`(`id_user`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `kunjungan` ADD CONSTRAINT `kunjungan_id_kategori_kunjungan_fkey` FOREIGN KEY (`id_kategori_kunjungan`) REFERENCES `kategori_kunjungan`(`id_kategori_kunjungan`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `kunjungan_report_recipients` ADD CONSTRAINT `kunjungan_report_recipients_id_kunjungan_fkey` FOREIGN KEY (`id_kunjungan`) REFERENCES `kunjungan`(`id_kunjungan`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `kunjungan_report_recipients` ADD CONSTRAINT `kunjungan_report_recipients_id_user_fkey` FOREIGN KEY (`id_user`) REFERENCES `user`(`id_user`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `user` ADD CONSTRAINT `user_id_departement_fkey` FOREIGN KEY (`id_departement`) REFERENCES `departement`(`id_departement`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `user` ADD CONSTRAINT `user_id_location_fkey` FOREIGN KEY (`id_location`) REFERENCES `location`(`id_location`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `user` ADD CONSTRAINT `user_id_jabatan_fkey` FOREIGN KEY (`id_jabatan`) REFERENCES `jabatan`(`id_jabatan`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `freelance` ADD CONSTRAINT `freelance_id_supervisor_fkey` FOREIGN KEY (`id_supervisor`) REFERENCES `user`(`id_user`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `form_freelance` ADD CONSTRAINT `form_freelance_id_freelance_fkey` FOREIGN KEY (`id_freelance`) REFERENCES `freelance`(`id_freelance`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `form_freelance` ADD CONSTRAINT `form_freelance_approver_user_id_fkey` FOREIGN KEY (`approver_user_id`) REFERENCES `user`(`id_user`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `departement` ADD CONSTRAINT `departement_id_supervisor_fkey` FOREIGN KEY (`id_supervisor`) REFERENCES `user`(`id_user`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `jabatan` ADD CONSTRAINT `jabatan_id_departement_fkey` FOREIGN KEY (`id_departement`) REFERENCES `departement`(`id_departement`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `jabatan` ADD CONSTRAINT `jabatan_id_induk_jabatan_fkey` FOREIGN KEY (`id_induk_jabatan`) REFERENCES `jabatan`(`id_jabatan`) ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `istirahat` ADD CONSTRAINT `istirahat_id_user_fkey` FOREIGN KEY (`id_user`) REFERENCES `user`(`id_user`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `istirahat` ADD CONSTRAINT `istirahat_id_absensi_fkey` FOREIGN KEY (`id_absensi`) REFERENCES `Absensi`(`id_absensi`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `face` ADD CONSTRAINT `face_id_user_fkey` FOREIGN KEY (`id_user`) REFERENCES `user`(`id_user`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `story_planner` ADD CONSTRAINT `story_planner_id_user_fkey` FOREIGN KEY (`id_user`) REFERENCES `user`(`id_user`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `story_planner` ADD CONSTRAINT `story_planner_id_departement_fkey` FOREIGN KEY (`id_departement`) REFERENCES `departement`(`id_departement`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `device` ADD CONSTRAINT `device_id_user_fkey` FOREIGN KEY (`id_user`) REFERENCES `user`(`id_user`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Absensi` ADD CONSTRAINT `Absensi_id_user_fkey` FOREIGN KEY (`id_user`) REFERENCES `user`(`id_user`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Absensi` ADD CONSTRAINT `Absensi_id_lokasi_datang_fkey` FOREIGN KEY (`id_lokasi_datang`) REFERENCES `location`(`id_location`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Absensi` ADD CONSTRAINT `Absensi_id_lokasi_pulang_fkey` FOREIGN KEY (`id_lokasi_pulang`) REFERENCES `location`(`id_location`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `absensi_report_recipients` ADD CONSTRAINT `absensi_report_recipients_id_absensi_fkey` FOREIGN KEY (`id_absensi`) REFERENCES `Absensi`(`id_absensi`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `absensi_report_recipients` ADD CONSTRAINT `absensi_report_recipients_id_user_fkey` FOREIGN KEY (`id_user`) REFERENCES `user`(`id_user`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `catatan` ADD CONSTRAINT `catatan_id_absensi_fkey` FOREIGN KEY (`id_absensi`) REFERENCES `Absensi`(`id_absensi`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `notifications` ADD CONSTRAINT `notifications_id_user_fkey` FOREIGN KEY (`id_user`) REFERENCES `user`(`id_user`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Lembur` ADD CONSTRAINT `Lembur_id_user_fkey` FOREIGN KEY (`id_user`) REFERENCES `user`(`id_user`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `lembur_approval` ADD CONSTRAINT `lembur_approval_id_lembur_fkey` FOREIGN KEY (`id_lembur`) REFERENCES `Lembur`(`id_lembur`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `lembur_approval` ADD CONSTRAINT `lembur_approval_approver_user_id_fkey` FOREIGN KEY (`approver_user_id`) REFERENCES `user`(`id_user`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `shift_story_planer` ADD CONSTRAINT `shift_story_planer_id_jadwal_story_planner_fkey` FOREIGN KEY (`id_jadwal_story_planner`) REFERENCES `jadwal_story_planer`(`id_jadwal_story_planner`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `shift_story_planer` ADD CONSTRAINT `shift_story_planer_id_user_fkey` FOREIGN KEY (`id_user`) REFERENCES `user`(`id_user`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `cuti_konfigurasi` ADD CONSTRAINT `cuti_konfigurasi_id_user_fkey` FOREIGN KEY (`id_user`) REFERENCES `user`(`id_user`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `pengajuan_cuti` ADD CONSTRAINT `pengajuan_cuti_id_user_fkey` FOREIGN KEY (`id_user`) REFERENCES `user`(`id_user`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `pengajuan_cuti` ADD CONSTRAINT `pengajuan_cuti_id_kategori_cuti_fkey` FOREIGN KEY (`id_kategori_cuti`) REFERENCES `kategori_cuti`(`id_kategori_cuti`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `pengajuan_cuti_tanggal` ADD CONSTRAINT `pengajuan_cuti_tanggal_id_pengajuan_cuti_fkey` FOREIGN KEY (`id_pengajuan_cuti`) REFERENCES `pengajuan_cuti`(`id_pengajuan_cuti`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `approval_pengajuan_cuti` ADD CONSTRAINT `approval_pengajuan_cuti_id_pengajuan_cuti_fkey` FOREIGN KEY (`id_pengajuan_cuti`) REFERENCES `pengajuan_cuti`(`id_pengajuan_cuti`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `approval_pengajuan_cuti` ADD CONSTRAINT `approval_pengajuan_cuti_approver_user_id_fkey` FOREIGN KEY (`approver_user_id`) REFERENCES `user`(`id_user`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `pengajuan_izin_sakit` ADD CONSTRAINT `pengajuan_izin_sakit_id_user_fkey` FOREIGN KEY (`id_user`) REFERENCES `user`(`id_user`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `pengajuan_izin_sakit` ADD CONSTRAINT `pengajuan_izin_sakit_id_kategori_sakit_fkey` FOREIGN KEY (`id_kategori_sakit`) REFERENCES `kategori_sakit`(`id_kategori_sakit`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `approval_izin_sakit` ADD CONSTRAINT `approval_izin_sakit_id_pengajuan_izin_sakit_fkey` FOREIGN KEY (`id_pengajuan_izin_sakit`) REFERENCES `pengajuan_izin_sakit`(`id_pengajuan_izin_sakit`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `approval_izin_sakit` ADD CONSTRAINT `approval_izin_sakit_approver_user_id_fkey` FOREIGN KEY (`approver_user_id`) REFERENCES `user`(`id_user`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `pengajuan_izin_jam` ADD CONSTRAINT `pengajuan_izin_jam_id_user_fkey` FOREIGN KEY (`id_user`) REFERENCES `user`(`id_user`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `pengajuan_izin_jam` ADD CONSTRAINT `pengajuan_izin_jam_id_kategori_izin_jam_fkey` FOREIGN KEY (`id_kategori_izin_jam`) REFERENCES `kategori_izin_jam`(`id_kategori_izin_jam`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `approval_pengajuan_izin_jam` ADD CONSTRAINT `approval_pengajuan_izin_jam_id_pengajuan_izin_jam_fkey` FOREIGN KEY (`id_pengajuan_izin_jam`) REFERENCES `pengajuan_izin_jam`(`id_pengajuan_izin_jam`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `approval_pengajuan_izin_jam` ADD CONSTRAINT `approval_pengajuan_izin_jam_approver_user_id_fkey` FOREIGN KEY (`approver_user_id`) REFERENCES `user`(`id_user`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `izin_tukar_hari` ADD CONSTRAINT `izin_tukar_hari_id_user_fkey` FOREIGN KEY (`id_user`) REFERENCES `user`(`id_user`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `izin_tukar_hari_pair` ADD CONSTRAINT `izin_tukar_hari_pair_id_izin_tukar_hari_fkey` FOREIGN KEY (`id_izin_tukar_hari`) REFERENCES `izin_tukar_hari`(`id_izin_tukar_hari`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `approval_izin_tukar_hari` ADD CONSTRAINT `approval_izin_tukar_hari_id_izin_tukar_hari_fkey` FOREIGN KEY (`id_izin_tukar_hari`) REFERENCES `izin_tukar_hari`(`id_izin_tukar_hari`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `approval_izin_tukar_hari` ADD CONSTRAINT `approval_izin_tukar_hari_approver_user_id_fkey` FOREIGN KEY (`approver_user_id`) REFERENCES `user`(`id_user`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `handover_cuti` ADD CONSTRAINT `handover_cuti_id_pengajuan_cuti_fkey` FOREIGN KEY (`id_pengajuan_cuti`) REFERENCES `pengajuan_cuti`(`id_pengajuan_cuti`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `handover_cuti` ADD CONSTRAINT `handover_cuti_id_user_tagged_fkey` FOREIGN KEY (`id_user_tagged`) REFERENCES `user`(`id_user`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `handover_izin_sakit` ADD CONSTRAINT `handover_izin_sakit_id_pengajuan_izin_sakit_fkey` FOREIGN KEY (`id_pengajuan_izin_sakit`) REFERENCES `pengajuan_izin_sakit`(`id_pengajuan_izin_sakit`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `handover_izin_sakit` ADD CONSTRAINT `handover_izin_sakit_id_user_tagged_fkey` FOREIGN KEY (`id_user_tagged`) REFERENCES `user`(`id_user`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `handover_izin_jam` ADD CONSTRAINT `handover_izin_jam_id_pengajuan_izin_jam_fkey` FOREIGN KEY (`id_pengajuan_izin_jam`) REFERENCES `pengajuan_izin_jam`(`id_pengajuan_izin_jam`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `handover_izin_jam` ADD CONSTRAINT `handover_izin_jam_id_user_tagged_fkey` FOREIGN KEY (`id_user_tagged`) REFERENCES `user`(`id_user`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `handover_tukar_hari` ADD CONSTRAINT `handover_tukar_hari_id_izin_tukar_hari_fkey` FOREIGN KEY (`id_izin_tukar_hari`) REFERENCES `izin_tukar_hari`(`id_izin_tukar_hari`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `handover_tukar_hari` ADD CONSTRAINT `handover_tukar_hari_id_user_tagged_fkey` FOREIGN KEY (`id_user_tagged`) REFERENCES `user`(`id_user`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `reimburse` ADD CONSTRAINT `reimburse_id_user_fkey` FOREIGN KEY (`id_user`) REFERENCES `user`(`id_user`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `reimburse` ADD CONSTRAINT `reimburse_id_departement_fkey` FOREIGN KEY (`id_departement`) REFERENCES `departement`(`id_departement`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `reimburse` ADD CONSTRAINT `reimburse_id_kategori_keperluan_fkey` FOREIGN KEY (`id_kategori_keperluan`) REFERENCES `kategori_keperluan`(`id_kategori_keperluan`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `reimburse_items` ADD CONSTRAINT `reimburse_items_id_reimburse_fkey` FOREIGN KEY (`id_reimburse`) REFERENCES `reimburse`(`id_reimburse`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `pocket_money` ADD CONSTRAINT `pocket_money_id_user_fkey` FOREIGN KEY (`id_user`) REFERENCES `user`(`id_user`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `pocket_money` ADD CONSTRAINT `pocket_money_id_departement_fkey` FOREIGN KEY (`id_departement`) REFERENCES `departement`(`id_departement`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `pocket_money` ADD CONSTRAINT `pocket_money_id_kategori_keperluan_fkey` FOREIGN KEY (`id_kategori_keperluan`) REFERENCES `kategori_keperluan`(`id_kategori_keperluan`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `pocket_money_items` ADD CONSTRAINT `pocket_money_items_id_pocket_money_fkey` FOREIGN KEY (`id_pocket_money`) REFERENCES `pocket_money`(`id_pocket_money`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `payment` ADD CONSTRAINT `payment_id_user_fkey` FOREIGN KEY (`id_user`) REFERENCES `user`(`id_user`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `payment` ADD CONSTRAINT `payment_id_departement_fkey` FOREIGN KEY (`id_departement`) REFERENCES `departement`(`id_departement`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `payment` ADD CONSTRAINT `payment_id_kategori_keperluan_fkey` FOREIGN KEY (`id_kategori_keperluan`) REFERENCES `kategori_keperluan`(`id_kategori_keperluan`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `approval_reimburse` ADD CONSTRAINT `approval_reimburse_id_reimburse_fkey` FOREIGN KEY (`id_reimburse`) REFERENCES `reimburse`(`id_reimburse`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `approval_reimburse` ADD CONSTRAINT `approval_reimburse_approver_user_id_fkey` FOREIGN KEY (`approver_user_id`) REFERENCES `user`(`id_user`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `approval_payment` ADD CONSTRAINT `approval_payment_id_payment_fkey` FOREIGN KEY (`id_payment`) REFERENCES `payment`(`id_payment`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `approval_payment` ADD CONSTRAINT `approval_payment_approver_user_id_fkey` FOREIGN KEY (`approver_user_id`) REFERENCES `user`(`id_user`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `approval_pocket_money` ADD CONSTRAINT `approval_pocket_money_id_pocket_money_fkey` FOREIGN KEY (`id_pocket_money`) REFERENCES `pocket_money`(`id_pocket_money`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `approval_pocket_money` ADD CONSTRAINT `approval_pocket_money_approver_user_id_fkey` FOREIGN KEY (`approver_user_id`) REFERENCES `user`(`id_user`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `sop_karyawan` ADD CONSTRAINT `sop_karyawan_id_kategori_sop_fkey` FOREIGN KEY (`id_kategori_sop`) REFERENCES `kategori_sop`(`id_kategori_sop`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `pinned_sops` ADD CONSTRAINT `pinned_sops_id_user_fkey` FOREIGN KEY (`id_user`) REFERENCES `user`(`id_user`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `pinned_sops` ADD CONSTRAINT `pinned_sops_id_sop_fkey` FOREIGN KEY (`id_sop`) REFERENCES `sop_karyawan`(`id_sop_karyawan`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `profil_payroll` ADD CONSTRAINT `profil_payroll_id_user_fkey` FOREIGN KEY (`id_user`) REFERENCES `user`(`id_user`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `profil_payroll` ADD CONSTRAINT `profil_payroll_id_freelance_fkey` FOREIGN KEY (`id_freelance`) REFERENCES `freelance`(`id_freelance`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `definisi_komponen_payroll` ADD CONSTRAINT `definisi_komponen_payroll_id_tipe_komponen_payroll_fkey` FOREIGN KEY (`id_tipe_komponen_payroll`) REFERENCES `tipe_komponen_payroll`(`id_tipe_komponen_payroll`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `periode_payroll` ADD CONSTRAINT `periode_payroll_id_master_template_fkey` FOREIGN KEY (`id_master_template`) REFERENCES `master_template`(`id_master_template`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `payroll_karyawan` ADD CONSTRAINT `payroll_karyawan_id_periode_payroll_fkey` FOREIGN KEY (`id_periode_payroll`) REFERENCES `periode_payroll`(`id_periode_payroll`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `payroll_karyawan` ADD CONSTRAINT `payroll_karyawan_id_user_fkey` FOREIGN KEY (`id_user`) REFERENCES `user`(`id_user`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `payroll_karyawan` ADD CONSTRAINT `payroll_karyawan_id_freelance_fkey` FOREIGN KEY (`id_freelance`) REFERENCES `freelance`(`id_freelance`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `payroll_karyawan` ADD CONSTRAINT `payroll_karyawan_id_profil_payroll_fkey` FOREIGN KEY (`id_profil_payroll`) REFERENCES `profil_payroll`(`id_profil_payroll`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `payroll_karyawan` ADD CONSTRAINT `payroll_karyawan_id_tarif_pajak_ter_fkey` FOREIGN KEY (`id_tarif_pajak_ter`) REFERENCES `tarif_pajak_ter`(`id_tarif_pajak_ter`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `item_komponen_payroll` ADD CONSTRAINT `item_komponen_payroll_id_payroll_karyawan_fkey` FOREIGN KEY (`id_payroll_karyawan`) REFERENCES `payroll_karyawan`(`id_payroll_karyawan`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `item_komponen_payroll` ADD CONSTRAINT `item_komponen_payroll_id_definisi_komponen_payroll_fkey` FOREIGN KEY (`id_definisi_komponen_payroll`) REFERENCES `definisi_komponen_payroll`(`id_definisi_komponen_payroll`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `item_komponen_payroll` ADD CONSTRAINT `item_komponen_payroll_id_user_pembuat_fkey` FOREIGN KEY (`id_user_pembuat`) REFERENCES `user`(`id_user`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `approval_payroll_karyawan` ADD CONSTRAINT `approval_payroll_karyawan_id_payroll_karyawan_fkey` FOREIGN KEY (`id_payroll_karyawan`) REFERENCES `payroll_karyawan`(`id_payroll_karyawan`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `approval_payroll_karyawan` ADD CONSTRAINT `approval_payroll_karyawan_approver_user_id_fkey` FOREIGN KEY (`approver_user_id`) REFERENCES `user`(`id_user`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `pinjaman_karyawan` ADD CONSTRAINT `pinjaman_karyawan_id_user_fkey` FOREIGN KEY (`id_user`) REFERENCES `user`(`id_user`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `cicilan_pinjaman_karyawan` ADD CONSTRAINT `cicilan_pinjaman_karyawan_id_pinjaman_karyawan_fkey` FOREIGN KEY (`id_pinjaman_karyawan`) REFERENCES `pinjaman_karyawan`(`id_pinjaman_karyawan`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `cicilan_pinjaman_karyawan` ADD CONSTRAINT `cicilan_pinjaman_karyawan_id_payroll_karyawan_fkey` FOREIGN KEY (`id_payroll_karyawan`) REFERENCES `payroll_karyawan`(`id_payroll_karyawan`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `transaksi_konsultan` ADD CONSTRAINT `transaksi_konsultan_id_periode_konsultan_fkey` FOREIGN KEY (`id_periode_konsultan`) REFERENCES `periode_konsultan`(`id_periode_konsultan`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `transaksi_konsultan` ADD CONSTRAINT `transaksi_konsultan_id_user_konsultan_fkey` FOREIGN KEY (`id_user_konsultan`) REFERENCES `user`(`id_user`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `transaksi_konsultan` ADD CONSTRAINT `transaksi_konsultan_id_jenis_produk_konsultan_fkey` FOREIGN KEY (`id_jenis_produk_konsultan`) REFERENCES `jenis_produk_konsultan`(`id_jenis_produk_konsultan`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `payout_konsultan` ADD CONSTRAINT `payout_konsultan_id_periode_konsultan_fkey` FOREIGN KEY (`id_periode_konsultan`) REFERENCES `periode_konsultan`(`id_periode_konsultan`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `payout_konsultan` ADD CONSTRAINT `payout_konsultan_id_periode_payroll_fkey` FOREIGN KEY (`id_periode_payroll`) REFERENCES `periode_payroll`(`id_periode_payroll`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `payout_konsultan` ADD CONSTRAINT `payout_konsultan_id_user_fkey` FOREIGN KEY (`id_user`) REFERENCES `user`(`id_user`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `payout_konsultan_detail` ADD CONSTRAINT `payout_konsultan_detail_id_payout_konsultan_fkey` FOREIGN KEY (`id_payout_konsultan`) REFERENCES `payout_konsultan`(`id_payout_konsultan`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `payout_konsultan_detail` ADD CONSTRAINT `payout_konsultan_detail_id_transaksi_konsultan_fkey` FOREIGN KEY (`id_transaksi_konsultan`) REFERENCES `transaksi_konsultan`(`id_transaksi_konsultan`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `kpi_jabatan` ADD CONSTRAINT `kpi_jabatan_id_kpi_fkey` FOREIGN KEY (`id_kpi`) REFERENCES `kpi`(`id_kpi`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `kpi_jabatan` ADD CONSTRAINT `kpi_jabatan_id_jabatan_fkey` FOREIGN KEY (`id_jabatan`) REFERENCES `jabatan`(`id_jabatan`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `kpi_plan` ADD CONSTRAINT `kpi_plan_id_user_fkey` FOREIGN KEY (`id_user`) REFERENCES `user`(`id_user`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `kpi_plan` ADD CONSTRAINT `kpi_plan_id_jabatan_fkey` FOREIGN KEY (`id_jabatan`) REFERENCES `jabatan`(`id_jabatan`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `kpi_plan` ADD CONSTRAINT `kpi_plan_id_location_fkey` FOREIGN KEY (`id_location`) REFERENCES `location`(`id_location`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `kpi_plan_item` ADD CONSTRAINT `kpi_plan_item_id_kpi_plan_fkey` FOREIGN KEY (`id_kpi_plan`) REFERENCES `kpi_plan`(`id_kpi_plan`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `kpi_plan_item` ADD CONSTRAINT `kpi_plan_item_id_kpi_fkey` FOREIGN KEY (`id_kpi`) REFERENCES `kpi`(`id_kpi`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `kpi_plan_item_term` ADD CONSTRAINT `kpi_plan_item_term_id_kpi_plan_item_fkey` FOREIGN KEY (`id_kpi_plan_item`) REFERENCES `kpi_plan_item`(`id_kpi_plan_item`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `kpi_plan_item_week_progress` ADD CONSTRAINT `kpi_plan_item_week_progress_id_kpi_plan_item_fkey` FOREIGN KEY (`id_kpi_plan_item`) REFERENCES `kpi_plan_item`(`id_kpi_plan_item`) ON DELETE CASCADE ON UPDATE CASCADE;
