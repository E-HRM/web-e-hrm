-- CreateTable
CREATE TABLE `profil_payroll` (
    `id_profil_payroll` CHAR(36) NOT NULL,
    `id_user` CHAR(36) NOT NULL,
    `jenis_hubungan_kerja` ENUM('FREELANCE', 'INTERNSHIP', 'PKWT', 'PKWTT') NOT NULL,
    `status_ptkp` ENUM('TK_0', 'TK_1', 'TK_2', 'TK_3', 'K_0', 'K_1', 'K_2', 'K_3') NOT NULL DEFAULT 'TK_0',
    `npwp` VARCHAR(50) NULL,
    `payroll_aktif` BOOLEAN NOT NULL DEFAULT true,
    `tanggal_mulai_payroll` DATE NULL,
    `catatan` LONGTEXT NULL,
    `created_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` DATETIME(0) NOT NULL,
    `deleted_at` DATETIME(0) NULL,

    UNIQUE INDEX `profil_payroll_id_user_key`(`id_user`),
    INDEX `profil_payroll_jenis_hubungan_kerja_idx`(`jenis_hubungan_kerja`),
    INDEX `profil_payroll_status_ptkp_idx`(`status_ptkp`),
    PRIMARY KEY (`id_profil_payroll`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `riwayat_kompensasi_karyawan` (
    `id_riwayat_kompensasi` CHAR(36) NOT NULL,
    `id_user` CHAR(36) NOT NULL,
    `gaji_pokok` DECIMAL(15, 2) NOT NULL DEFAULT 0,
    `tunjangan_jabatan` DECIMAL(15, 2) NOT NULL DEFAULT 0,
    `tunjangan_bpjsk` DECIMAL(15, 2) NOT NULL DEFAULT 0,
    `tunjangan_kesehatan` DECIMAL(15, 2) NOT NULL DEFAULT 0,
    `berlaku_mulai` DATE NOT NULL,
    `berlaku_sampai` DATE NULL,
    `catatan` LONGTEXT NULL,
    `created_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` DATETIME(0) NOT NULL,
    `deleted_at` DATETIME(0) NULL,

    INDEX `riwayat_kompensasi_karyawan_id_user_berlaku_mulai_idx`(`id_user`, `berlaku_mulai`),
    INDEX `riwayat_kompensasi_karyawan_berlaku_mulai_berlaku_sampai_idx`(`berlaku_mulai`, `berlaku_sampai`),
    PRIMARY KEY (`id_riwayat_kompensasi`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `tarif_pajak_ter` (
    `id_tarif_pajak_ter` CHAR(36) NOT NULL,
    `kategori_ter` ENUM('A', 'B', 'C') NOT NULL,
    `penghasilan_dari` DECIMAL(15, 2) NOT NULL,
    `penghasilan_sampai` DECIMAL(15, 2) NULL,
    `persen_tarif` DECIMAL(7, 4) NOT NULL,
    `berlaku_mulai` DATE NOT NULL,
    `berlaku_sampai` DATE NULL,
    `created_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` DATETIME(0) NOT NULL,
    `deleted_at` DATETIME(0) NULL,

    INDEX `tarif_pajak_ter_kategori_ter_penghasilan_dari_idx`(`kategori_ter`, `penghasilan_dari`),
    INDEX `tarif_pajak_ter_berlaku_mulai_berlaku_sampai_idx`(`berlaku_mulai`, `berlaku_sampai`),
    PRIMARY KEY (`id_tarif_pajak_ter`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `definisi_komponen_payroll` (
    `id_definisi_komponen_payroll` CHAR(36) NOT NULL,
    `kode_komponen` VARCHAR(100) NOT NULL,
    `nama_komponen` VARCHAR(255) NOT NULL,
    `tipe_komponen` ENUM('GAJI_POKOK', 'TUNJANGAN_JABATAN', 'TUNJANGAN_BPJSK', 'TUNJANGAN_KESEHATAN', 'BONUS', 'INSENTIF', 'THR', 'REWARD', 'LEMBUR', 'INSENTIF_KONSULTAN', 'PENYESUAIAN_MANUAL', 'CICILAN_PINJAMAN', 'POTONGAN_MANUAL', 'PAJAK', 'PENDAPATAN_LAIN', 'POTONGAN_LAIN') NOT NULL,
    `arah_komponen` ENUM('PEMASUKAN', 'POTONGAN') NOT NULL,
    `kena_pajak_default` BOOLEAN NOT NULL DEFAULT false,
    `berulang_default` BOOLEAN NOT NULL DEFAULT false,
    `aktif` BOOLEAN NOT NULL DEFAULT true,
    `catatan` LONGTEXT NULL,
    `created_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` DATETIME(0) NOT NULL,
    `deleted_at` DATETIME(0) NULL,

    UNIQUE INDEX `definisi_komponen_payroll_kode_komponen_key`(`kode_komponen`),
    INDEX `definisi_komponen_payroll_tipe_komponen_arah_komponen_idx`(`tipe_komponen`, `arah_komponen`),
    PRIMARY KEY (`id_definisi_komponen_payroll`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `periode_payroll` (
    `id_periode_payroll` CHAR(36) NOT NULL,
    `tahun` INTEGER NOT NULL,
    `bulan` ENUM('JANUARI', 'FEBRUARI', 'MARET', 'APRIL', 'MEI', 'JUNI', 'JULI', 'AGUSTUS', 'SEPTEMBER', 'OKTOBER', 'NOVEMBER', 'DESEMBER') NOT NULL,
    `tanggal_mulai` DATE NOT NULL,
    `tanggal_selesai` DATE NOT NULL,
    `status_periode` ENUM('DRAFT', 'DIPROSES', 'DIREVIEW', 'FINAL', 'TERKUNCI') NOT NULL DEFAULT 'DRAFT',
    `diproses_pada` DATETIME(0) NULL,
    `difinalkan_pada` DATETIME(0) NULL,
    `catatan` LONGTEXT NULL,
    `created_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` DATETIME(0) NOT NULL,
    `deleted_at` DATETIME(0) NULL,

    INDEX `periode_payroll_status_periode_idx`(`status_periode`),
    UNIQUE INDEX `periode_payroll_tahun_bulan_key`(`tahun`, `bulan`),
    PRIMARY KEY (`id_periode_payroll`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `payroll_karyawan` (
    `id_payroll_karyawan` CHAR(36) NOT NULL,
    `id_periode_payroll` CHAR(36) NOT NULL,
    `id_user` CHAR(36) NOT NULL,
    `nama_karyawan_snapshot` VARCHAR(255) NOT NULL,
    `jenis_hubungan_snapshot` VARCHAR(50) NOT NULL,
    `status_ptkp_snapshot` VARCHAR(20) NOT NULL,
    `nama_departement_snapshot` VARCHAR(255) NULL,
    `nama_jabatan_snapshot` VARCHAR(255) NULL,
    `nama_bank_snapshot` VARCHAR(50) NULL,
    `nomor_rekening_snapshot` VARCHAR(50) NULL,
    `total_pendapatan_tetap` DECIMAL(15, 2) NOT NULL DEFAULT 0,
    `total_pendapatan_variabel` DECIMAL(15, 2) NOT NULL DEFAULT 0,
    `total_bruto_kena_pajak` DECIMAL(15, 2) NOT NULL DEFAULT 0,
    `persen_pajak` DECIMAL(7, 4) NOT NULL DEFAULT 0,
    `total_pajak` DECIMAL(15, 2) NOT NULL DEFAULT 0,
    `total_potongan_lain` DECIMAL(15, 2) NOT NULL DEFAULT 0,
    `total_dibayarkan` DECIMAL(15, 2) NOT NULL DEFAULT 0,
    `status_payroll` ENUM('DRAFT', 'TERSIMPAN', 'DISETUJUI', 'DIBAYAR') NOT NULL DEFAULT 'DRAFT',
    `dibayar_pada` DATETIME(0) NULL,
    `catatan` LONGTEXT NULL,
    `created_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` DATETIME(0) NOT NULL,
    `deleted_at` DATETIME(0) NULL,

    INDEX `payroll_karyawan_id_user_idx`(`id_user`),
    INDEX `payroll_karyawan_status_payroll_idx`(`status_payroll`),
    INDEX `payroll_karyawan_id_periode_payroll_status_payroll_idx`(`id_periode_payroll`, `status_payroll`),
    UNIQUE INDEX `payroll_karyawan_id_periode_payroll_id_user_key`(`id_periode_payroll`, `id_user`),
    PRIMARY KEY (`id_payroll_karyawan`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `item_komponen_payroll` (
    `id_item_komponen_payroll` CHAR(36) NOT NULL,
    `id_payroll_karyawan` CHAR(36) NOT NULL,
    `id_definisi_komponen_payroll` CHAR(36) NULL,
    `tipe_komponen` ENUM('GAJI_POKOK', 'TUNJANGAN_JABATAN', 'TUNJANGAN_BPJSK', 'TUNJANGAN_KESEHATAN', 'BONUS', 'INSENTIF', 'THR', 'REWARD', 'LEMBUR', 'INSENTIF_KONSULTAN', 'PENYESUAIAN_MANUAL', 'CICILAN_PINJAMAN', 'POTONGAN_MANUAL', 'PAJAK', 'PENDAPATAN_LAIN', 'POTONGAN_LAIN') NOT NULL,
    `arah_komponen` ENUM('PEMASUKAN', 'POTONGAN') NOT NULL,
    `nama_komponen` VARCHAR(255) NOT NULL,
    `nominal` DECIMAL(15, 2) NOT NULL,
    `kena_pajak` BOOLEAN NOT NULL DEFAULT false,
    `modul_sumber` VARCHAR(100) NULL,
    `id_data_sumber` CHAR(36) NULL,
    `input_manual` BOOLEAN NOT NULL DEFAULT false,
    `catatan` LONGTEXT NULL,
    `urutan_tampil` INTEGER NULL DEFAULT 0,
    `created_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` DATETIME(0) NOT NULL,
    `deleted_at` DATETIME(0) NULL,

    INDEX `item_komponen_payroll_id_payroll_karyawan_idx`(`id_payroll_karyawan`),
    INDEX `item_komponen_payroll_tipe_komponen_arah_komponen_idx`(`tipe_komponen`, `arah_komponen`),
    INDEX `item_komponen_payroll_modul_sumber_id_data_sumber_idx`(`modul_sumber`, `id_data_sumber`),
    PRIMARY KEY (`id_item_komponen_payroll`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `slip_gaji_payroll` (
    `id_slip_gaji_payroll` CHAR(36) NOT NULL,
    `id_payroll_karyawan` CHAR(36) NOT NULL,
    `nomor_slip_gaji` VARCHAR(100) NULL,
    `url_file` LONGTEXT NULL,
    `dibuat_pada` DATETIME(0) NULL,
    `dikirim_pada` DATETIME(0) NULL,
    `created_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` DATETIME(0) NOT NULL,
    `deleted_at` DATETIME(0) NULL,

    UNIQUE INDEX `slip_gaji_payroll_id_payroll_karyawan_key`(`id_payroll_karyawan`),
    UNIQUE INDEX `slip_gaji_payroll_nomor_slip_gaji_key`(`nomor_slip_gaji`),
    PRIMARY KEY (`id_slip_gaji_payroll`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `persetujuan_periode_payroll` (
    `id_persetujuan_periode_payroll` CHAR(36) NOT NULL,
    `id_periode_payroll` CHAR(36) NOT NULL,
    `level` INTEGER NOT NULL,
    `id_user_penyetuju` CHAR(36) NULL,
    `role_penyetuju` ENUM('KARYAWAN', 'HR', 'OPERASIONAL', 'DIREKTUR', 'SUPERADMIN', 'SUBADMIN', 'SUPERVISI') NULL,
    `keputusan` ENUM('disetujui', 'ditolak', 'pending') NOT NULL DEFAULT 'pending',
    `diputuskan_pada` DATETIME(0) NULL,
    `catatan` LONGTEXT NULL,
    `created_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` DATETIME(0) NOT NULL,
    `deleted_at` DATETIME(0) NULL,

    INDEX `persetujuan_periode_payroll_id_periode_payroll_level_idx`(`id_periode_payroll`, `level`),
    INDEX `persetujuan_periode_payroll_id_user_penyetuju_idx`(`id_user_penyetuju`),
    PRIMARY KEY (`id_persetujuan_periode_payroll`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `pinjaman_karyawan` (
    `id_pinjaman_karyawan` CHAR(36) NOT NULL,
    `id_user` CHAR(36) NOT NULL,
    `nama_pinjaman` VARCHAR(255) NOT NULL,
    `nominal_pinjaman` DECIMAL(15, 2) NOT NULL,
    `nominal_cicilan` DECIMAL(15, 2) NOT NULL,
    `sisa_saldo` DECIMAL(15, 2) NOT NULL,
    `tanggal_mulai` DATE NOT NULL,
    `tanggal_selesai` DATE NULL,
    `status_pinjaman` ENUM('AKTIF', 'LUNAS', 'DIBATALKAN') NOT NULL DEFAULT 'AKTIF',
    `catatan` LONGTEXT NULL,
    `created_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` DATETIME(0) NOT NULL,
    `deleted_at` DATETIME(0) NULL,

    INDEX `pinjaman_karyawan_id_user_status_pinjaman_idx`(`id_user`, `status_pinjaman`),
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
    UNIQUE INDEX `periode_konsultan_tahun_bulan_key`(`tahun`, `bulan`),
    PRIMARY KEY (`id_periode_konsultan`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `jenis_produk_konsultan` (
    `id_jenis_produk_konsultan` CHAR(36) NOT NULL,
    `nama_produk` VARCHAR(255) NOT NULL,
    `kode_produk` VARCHAR(100) NULL,
    `persen_share_default` DECIMAL(7, 4) NULL,
    `aktif` BOOLEAN NOT NULL DEFAULT true,
    `catatan` LONGTEXT NULL,
    `created_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` DATETIME(0) NOT NULL,
    `deleted_at` DATETIME(0) NULL,

    UNIQUE INDEX `jenis_produk_konsultan_nama_produk_key`(`nama_produk`),
    UNIQUE INDEX `jenis_produk_konsultan_kode_produk_key`(`kode_produk`),
    INDEX `jenis_produk_konsultan_aktif_idx`(`aktif`),
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
    UNIQUE INDEX `payout_konsultan_id_periode_konsultan_id_user_key`(`id_periode_konsultan`, `id_user`),
    PRIMARY KEY (`id_payout_konsultan`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `profil_payroll` ADD CONSTRAINT `profil_payroll_id_user_fkey` FOREIGN KEY (`id_user`) REFERENCES `user`(`id_user`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `riwayat_kompensasi_karyawan` ADD CONSTRAINT `riwayat_kompensasi_karyawan_id_user_fkey` FOREIGN KEY (`id_user`) REFERENCES `user`(`id_user`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `payroll_karyawan` ADD CONSTRAINT `payroll_karyawan_id_periode_payroll_fkey` FOREIGN KEY (`id_periode_payroll`) REFERENCES `periode_payroll`(`id_periode_payroll`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `payroll_karyawan` ADD CONSTRAINT `payroll_karyawan_id_user_fkey` FOREIGN KEY (`id_user`) REFERENCES `user`(`id_user`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `item_komponen_payroll` ADD CONSTRAINT `item_komponen_payroll_id_payroll_karyawan_fkey` FOREIGN KEY (`id_payroll_karyawan`) REFERENCES `payroll_karyawan`(`id_payroll_karyawan`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `item_komponen_payroll` ADD CONSTRAINT `item_komponen_payroll_id_definisi_komponen_payroll_fkey` FOREIGN KEY (`id_definisi_komponen_payroll`) REFERENCES `definisi_komponen_payroll`(`id_definisi_komponen_payroll`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `slip_gaji_payroll` ADD CONSTRAINT `slip_gaji_payroll_id_payroll_karyawan_fkey` FOREIGN KEY (`id_payroll_karyawan`) REFERENCES `payroll_karyawan`(`id_payroll_karyawan`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `persetujuan_periode_payroll` ADD CONSTRAINT `persetujuan_periode_payroll_id_periode_payroll_fkey` FOREIGN KEY (`id_periode_payroll`) REFERENCES `periode_payroll`(`id_periode_payroll`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `persetujuan_periode_payroll` ADD CONSTRAINT `persetujuan_periode_payroll_id_user_penyetuju_fkey` FOREIGN KEY (`id_user_penyetuju`) REFERENCES `user`(`id_user`) ON DELETE RESTRICT ON UPDATE CASCADE;

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
