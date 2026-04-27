/*
  Warnings:

  - You are about to drop the column `kode_komponen` on the `definisi_komponen_payroll` table. All the data in the column will be lost.
  - You are about to drop the column `tipe_komponen` on the `definisi_komponen_payroll` table. All the data in the column will be lost.
  - You are about to drop the column `input_manual` on the `item_komponen_payroll` table. All the data in the column will be lost.
  - You are about to alter the column `tipe_komponen` on the `item_komponen_payroll` table. The data in that column could be lost. The data in that column will be cast from `Enum(EnumId(7))` to `VarChar(100)`.
  - You are about to alter the column `modul_sumber` on the `item_komponen_payroll` table. The data in that column could be lost. The data in that column will be cast from `VarChar(100)` to `Enum(EnumId(58))`.
  - You are about to drop the column `jenis_hubungan_snapshot` on the `payroll_karyawan` table. All the data in the column will be lost.
  - You are about to drop the column `nama_bank_snapshot` on the `payroll_karyawan` table. All the data in the column will be lost.
  - You are about to drop the column `nama_departement_snapshot` on the `payroll_karyawan` table. All the data in the column will be lost.
  - You are about to drop the column `nama_jabatan_snapshot` on the `payroll_karyawan` table. All the data in the column will be lost.
  - You are about to drop the column `nama_karyawan_snapshot` on the `payroll_karyawan` table. All the data in the column will be lost.
  - You are about to drop the column `nomor_rekening_snapshot` on the `payroll_karyawan` table. All the data in the column will be lost.
  - You are about to drop the column `persen_pajak` on the `payroll_karyawan` table. All the data in the column will be lost.
  - You are about to drop the column `status_ptkp_snapshot` on the `payroll_karyawan` table. All the data in the column will be lost.
  - You are about to drop the column `total_bruto_kena_pajak` on the `payroll_karyawan` table. All the data in the column will be lost.
  - You are about to drop the column `total_dibayarkan` on the `payroll_karyawan` table. All the data in the column will be lost.
  - You are about to drop the column `total_pajak` on the `payroll_karyawan` table. All the data in the column will be lost.
  - You are about to drop the column `total_pendapatan_tetap` on the `payroll_karyawan` table. All the data in the column will be lost.
  - You are about to drop the column `total_pendapatan_variabel` on the `payroll_karyawan` table. All the data in the column will be lost.
  - You are about to drop the column `total_potongan_lain` on the `payroll_karyawan` table. All the data in the column will be lost.
  - You are about to drop the column `npwp` on the `profil_payroll` table. All the data in the column will be lost.
  - You are about to drop the column `dibuat_pada` on the `slip_gaji_payroll` table. All the data in the column will be lost.
  - You are about to drop the column `url_file` on the `slip_gaji_payroll` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[id_tipe_komponen_payroll,nama_komponen,arah_komponen]` on the table `definisi_komponen_payroll` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[kunci_idempoten]` on the table `item_komponen_payroll` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[id_periode_payroll,level]` on the table `persetujuan_periode_payroll` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `id_tipe_komponen_payroll` to the `definisi_komponen_payroll` table without a default value. This is not possible if the table is not empty.
  - Added the required column `kunci_idempoten` to the `item_komponen_payroll` table without a default value. This is not possible if the table is not empty.
  - Added the required column `jenis_hubungan_kerja` to the `payroll_karyawan` table without a default value. This is not possible if the table is not empty.
  - Added the required column `nama_karyawan` to the `payroll_karyawan` table without a default value. This is not possible if the table is not empty.
  - Added the required column `jenis_hubungan_kerja` to the `slip_gaji_payroll` table without a default value. This is not possible if the table is not empty.
  - Added the required column `nama_karyawan` to the `slip_gaji_payroll` table without a default value. This is not possible if the table is not empty.
  - Added the required column `periode_bulan` to the `slip_gaji_payroll` table without a default value. This is not possible if the table is not empty.
  - Added the required column `periode_tahun` to the `slip_gaji_payroll` table without a default value. This is not possible if the table is not empty.
  - Added the required column `status_ptkp` to the `slip_gaji_payroll` table without a default value. This is not possible if the table is not empty.
  - Added the required column `tanggal_mulai` to the `slip_gaji_payroll` table without a default value. This is not possible if the table is not empty.
  - Added the required column `tanggal_selesai` to the `slip_gaji_payroll` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE `persetujuan_periode_payroll` DROP FOREIGN KEY `persetujuan_periode_payroll_id_periode_payroll_fkey`;

-- DropForeignKey
ALTER TABLE `slip_gaji_payroll` DROP FOREIGN KEY `slip_gaji_payroll_id_payroll_karyawan_fkey`;

-- DropIndex
DROP INDEX `definisi_komponen_payroll_kode_komponen_key` ON `definisi_komponen_payroll`;

-- DropIndex
DROP INDEX `definisi_komponen_payroll_tipe_komponen_arah_komponen_idx` ON `definisi_komponen_payroll`;

-- DropIndex
DROP INDEX `persetujuan_periode_payroll_id_periode_payroll_level_idx` ON `persetujuan_periode_payroll`;

-- DropIndex
DROP INDEX `tarif_pajak_ter_berlaku_mulai_berlaku_sampai_idx` ON `tarif_pajak_ter`;

-- AlterTable
ALTER TABLE `definisi_komponen_payroll` DROP COLUMN `kode_komponen`,
    DROP COLUMN `tipe_komponen`,
    ADD COLUMN `id_tipe_komponen_payroll` CHAR(36) NOT NULL;

-- AlterTable
ALTER TABLE `item_komponen_payroll` DROP COLUMN `input_manual`,
    ADD COLUMN `diproses_pada` DATETIME(0) NULL,
    ADD COLUMN `id_user_pembuat` CHAR(36) NULL,
    ADD COLUMN `is_locked` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `kode_proses_massal` VARCHAR(100) NULL,
    ADD COLUMN `kunci_idempoten` VARCHAR(191) NOT NULL,
    ADD COLUMN `nama_proses_massal` VARCHAR(255) NULL,
    ADD COLUMN `sumber_input` ENUM('MANUAL', 'MASSAL', 'SISTEM') NOT NULL DEFAULT 'SISTEM',
    MODIFY `tipe_komponen` VARCHAR(100) NOT NULL,
    MODIFY `modul_sumber` ENUM('MANUAL', 'KOMPENSASI', 'PINJAMAN', 'KONSULTAN', 'PAJAK', 'SISTEM') NULL;

-- AlterTable
ALTER TABLE `payroll_karyawan` DROP COLUMN `jenis_hubungan_snapshot`,
    DROP COLUMN `nama_bank_snapshot`,
    DROP COLUMN `nama_departement_snapshot`,
    DROP COLUMN `nama_jabatan_snapshot`,
    DROP COLUMN `nama_karyawan_snapshot`,
    DROP COLUMN `nomor_rekening_snapshot`,
    DROP COLUMN `persen_pajak`,
    DROP COLUMN `status_ptkp_snapshot`,
    DROP COLUMN `total_bruto_kena_pajak`,
    DROP COLUMN `total_dibayarkan`,
    DROP COLUMN `total_pajak`,
    DROP COLUMN `total_pendapatan_tetap`,
    DROP COLUMN `total_pendapatan_variabel`,
    DROP COLUMN `total_potongan_lain`,
    ADD COLUMN `bank_account` VARCHAR(50) NULL,
    ADD COLUMN `bank_name` VARCHAR(50) NULL,
    ADD COLUMN `finalized_at` DATETIME(0) NULL,
    ADD COLUMN `jenis_hubungan_kerja` ENUM('FREELANCE', 'INTERNSHIP', 'PKWT', 'PKWTT') NOT NULL,
    ADD COLUMN `locked_at` DATETIME(0) NULL,
    ADD COLUMN `nama_karyawan` VARCHAR(255) NOT NULL,
    ADD COLUMN `pendapatan_bersih` DECIMAL(15, 2) NOT NULL DEFAULT 0,
    ADD COLUMN `pph21_nominal` DECIMAL(15, 2) NOT NULL DEFAULT 0,
    ADD COLUMN `status_ptkp` ENUM('TK_0', 'TK_1', 'TK_2', 'TK_3', 'K_0', 'K_1', 'K_2', 'K_3') NOT NULL DEFAULT 'TK_0',
    ADD COLUMN `total_pendapatan_bruto` DECIMAL(15, 2) NOT NULL DEFAULT 0,
    ADD COLUMN `total_potongan` DECIMAL(15, 2) NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE `profil_payroll` DROP COLUMN `npwp`;

-- AlterTable
ALTER TABLE `slip_gaji_payroll` DROP COLUMN `dibuat_pada`,
    DROP COLUMN `url_file`,
    ADD COLUMN `bank_account` VARCHAR(50) NULL,
    ADD COLUMN `bank_name` VARCHAR(50) NULL,
    ADD COLUMN `catatan` LONGTEXT NULL,
    ADD COLUMN `file_pdf` LONGTEXT NULL,
    ADD COLUMN `file_pdf_hash` VARCHAR(255) NULL,
    ADD COLUMN `jenis_hubungan_kerja` ENUM('FREELANCE', 'INTERNSHIP', 'PKWT', 'PKWTT') NOT NULL,
    ADD COLUMN `nama_karyawan` VARCHAR(255) NOT NULL,
    ADD COLUMN `pdf_dibuat_pada` DATETIME(0) NULL,
    ADD COLUMN `pendapatan_bersih` DECIMAL(15, 2) NOT NULL DEFAULT 0,
    ADD COLUMN `periode_bulan` ENUM('JANUARI', 'FEBRUARI', 'MARET', 'APRIL', 'MEI', 'JUNI', 'JULI', 'AGUSTUS', 'SEPTEMBER', 'OKTOBER', 'NOVEMBER', 'DESEMBER') NOT NULL,
    ADD COLUMN `periode_tahun` INTEGER NOT NULL,
    ADD COLUMN `pph21_nominal` DECIMAL(15, 2) NOT NULL DEFAULT 0,
    ADD COLUMN `snapshot_dibuat_pada` DATETIME(0) NULL,
    ADD COLUMN `status_ptkp` ENUM('TK_0', 'TK_1', 'TK_2', 'TK_3', 'K_0', 'K_1', 'K_2', 'K_3') NOT NULL,
    ADD COLUMN `status_slip` ENUM('DRAFT', 'SNAPSHOT_TERSIMPAN', 'PDF_DIGENERATE', 'DIKIRIM', 'DIBATALKAN') NOT NULL DEFAULT 'DRAFT',
    ADD COLUMN `tanggal_mulai` DATE NOT NULL,
    ADD COLUMN `tanggal_selesai` DATE NOT NULL,
    ADD COLUMN `total_pendapatan_bruto` DECIMAL(15, 2) NOT NULL DEFAULT 0,
    ADD COLUMN `total_potongan` DECIMAL(15, 2) NOT NULL DEFAULT 0,
    ADD COLUMN `versi_template` INTEGER NOT NULL DEFAULT 1;

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
CREATE TABLE `slip_gaji_payroll_item` (
    `id_slip_gaji_payroll_item` CHAR(36) NOT NULL,
    `id_slip_gaji_payroll` CHAR(36) NOT NULL,
    `tipe_komponen` VARCHAR(100) NOT NULL,
    `arah_komponen` ENUM('PEMASUKAN', 'POTONGAN') NOT NULL,
    `nama_komponen` VARCHAR(255) NOT NULL,
    `nominal` DECIMAL(15, 2) NOT NULL,
    `kena_pajak` BOOLEAN NOT NULL DEFAULT false,
    `modul_sumber` ENUM('MANUAL', 'KOMPENSASI', 'PINJAMAN', 'KONSULTAN', 'PAJAK', 'SISTEM') NULL,
    `id_data_sumber` CHAR(36) NULL,
    `sumber_input` ENUM('MANUAL', 'MASSAL', 'SISTEM') NOT NULL DEFAULT 'SISTEM',
    `kode_proses_massal` VARCHAR(100) NULL,
    `urutan_tampil` INTEGER NULL DEFAULT 0,
    `catatan` LONGTEXT NULL,
    `created_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` DATETIME(0) NOT NULL,
    `deleted_at` DATETIME(0) NULL,

    INDEX `slip_gaji_payroll_item_id_slip_gaji_payroll_idx`(`id_slip_gaji_payroll`),
    INDEX `slip_gaji_payroll_item_tipe_komponen_arah_komponen_idx`(`tipe_komponen`, `arah_komponen`),
    INDEX `slip_gaji_payroll_item_sumber_input_kode_proses_massal_idx`(`sumber_input`, `kode_proses_massal`),
    INDEX `slip_gaji_payroll_item_deleted_at_idx`(`deleted_at`),
    PRIMARY KEY (`id_slip_gaji_payroll_item`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `payout_konsultan_detail` (
    `id_payout_konsultan_detail` CHAR(36) NOT NULL,
    `id_payout_konsultan` CHAR(36) NOT NULL,
    `id_transaksi_konsultan` CHAR(36) NOT NULL,
    `nominal_share` DECIMAL(15, 2) NOT NULL DEFAULT 0,
    `nominal_oss` DECIMAL(15, 2) NOT NULL DEFAULT 0,
    `catatan` LONGTEXT NULL,
    `created_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` DATETIME(0) NOT NULL,
    `deleted_at` DATETIME(0) NULL,

    INDEX `payout_konsultan_detail_id_transaksi_konsultan_idx`(`id_transaksi_konsultan`),
    INDEX `payout_konsultan_detail_deleted_at_idx`(`deleted_at`),
    UNIQUE INDEX `payout_konsultan_detail_id_payout_konsultan_id_transaksi_kon_key`(`id_payout_konsultan`, `id_transaksi_konsultan`),
    PRIMARY KEY (`id_payout_konsultan_detail`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE INDEX `cicilan_pinjaman_karyawan_deleted_at_idx` ON `cicilan_pinjaman_karyawan`(`deleted_at`);

-- CreateIndex
CREATE INDEX `definisi_komponen_payroll_id_tipe_komponen_payroll_arah_komp_idx` ON `definisi_komponen_payroll`(`id_tipe_komponen_payroll`, `arah_komponen`);

-- CreateIndex
CREATE INDEX `definisi_komponen_payroll_deleted_at_idx` ON `definisi_komponen_payroll`(`deleted_at`);

-- CreateIndex
CREATE UNIQUE INDEX `definisi_komponen_payroll_id_tipe_komponen_payroll_nama_komp_key` ON `definisi_komponen_payroll`(`id_tipe_komponen_payroll`, `nama_komponen`, `arah_komponen`);

-- CreateIndex
CREATE INDEX `item_komponen_payroll_id_user_pembuat_idx` ON `item_komponen_payroll`(`id_user_pembuat`);

-- CreateIndex
CREATE INDEX `item_komponen_payroll_sumber_input_kode_proses_massal_idx` ON `item_komponen_payroll`(`sumber_input`, `kode_proses_massal`);

-- CreateIndex
CREATE INDEX `item_komponen_payroll_id_payroll_karyawan_kode_proses_massal_idx` ON `item_komponen_payroll`(`id_payroll_karyawan`, `kode_proses_massal`);

-- CreateIndex
CREATE INDEX `item_komponen_payroll_deleted_at_idx` ON `item_komponen_payroll`(`deleted_at`);

-- CreateIndex
CREATE UNIQUE INDEX `item_komponen_payroll_kunci_idempoten_key` ON `item_komponen_payroll`(`kunci_idempoten`);

-- CreateIndex
CREATE INDEX `jenis_produk_konsultan_deleted_at_idx` ON `jenis_produk_konsultan`(`deleted_at`);

-- CreateIndex
CREATE INDEX `payout_konsultan_deleted_at_idx` ON `payout_konsultan`(`deleted_at`);

-- CreateIndex
CREATE INDEX `payroll_karyawan_deleted_at_idx` ON `payroll_karyawan`(`deleted_at`);

-- CreateIndex
CREATE INDEX `periode_konsultan_deleted_at_idx` ON `periode_konsultan`(`deleted_at`);

-- CreateIndex
CREATE INDEX `periode_payroll_deleted_at_idx` ON `periode_payroll`(`deleted_at`);

-- CreateIndex
CREATE INDEX `persetujuan_periode_payroll_deleted_at_idx` ON `persetujuan_periode_payroll`(`deleted_at`);

-- CreateIndex
CREATE UNIQUE INDEX `persetujuan_periode_payroll_id_periode_payroll_level_key` ON `persetujuan_periode_payroll`(`id_periode_payroll`, `level`);

-- CreateIndex
CREATE INDEX `pinjaman_karyawan_deleted_at_idx` ON `pinjaman_karyawan`(`deleted_at`);

-- CreateIndex
CREATE INDEX `profil_payroll_deleted_at_idx` ON `profil_payroll`(`deleted_at`);

-- CreateIndex
CREATE INDEX `riwayat_kompensasi_karyawan_id_user_berlaku_sampai_idx` ON `riwayat_kompensasi_karyawan`(`id_user`, `berlaku_sampai`);

-- CreateIndex
CREATE INDEX `riwayat_kompensasi_karyawan_deleted_at_idx` ON `riwayat_kompensasi_karyawan`(`deleted_at`);

-- CreateIndex
CREATE INDEX `slip_gaji_payroll_status_slip_idx` ON `slip_gaji_payroll`(`status_slip`);

-- CreateIndex
CREATE INDEX `slip_gaji_payroll_periode_tahun_periode_bulan_idx` ON `slip_gaji_payroll`(`periode_tahun`, `periode_bulan`);

-- CreateIndex
CREATE INDEX `slip_gaji_payroll_deleted_at_idx` ON `slip_gaji_payroll`(`deleted_at`);

-- CreateIndex
CREATE INDEX `tarif_pajak_ter_kategori_ter_berlaku_mulai_berlaku_sampai_idx` ON `tarif_pajak_ter`(`kategori_ter`, `berlaku_mulai`, `berlaku_sampai`);

-- CreateIndex
CREATE INDEX `tarif_pajak_ter_deleted_at_idx` ON `tarif_pajak_ter`(`deleted_at`);

-- CreateIndex
CREATE INDEX `transaksi_konsultan_deleted_at_idx` ON `transaksi_konsultan`(`deleted_at`);

-- AddForeignKey
ALTER TABLE `definisi_komponen_payroll` ADD CONSTRAINT `definisi_komponen_payroll_id_tipe_komponen_payroll_fkey` FOREIGN KEY (`id_tipe_komponen_payroll`) REFERENCES `tipe_komponen_payroll`(`id_tipe_komponen_payroll`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `item_komponen_payroll` ADD CONSTRAINT `item_komponen_payroll_id_user_pembuat_fkey` FOREIGN KEY (`id_user_pembuat`) REFERENCES `user`(`id_user`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `slip_gaji_payroll` ADD CONSTRAINT `slip_gaji_payroll_id_payroll_karyawan_fkey` FOREIGN KEY (`id_payroll_karyawan`) REFERENCES `payroll_karyawan`(`id_payroll_karyawan`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `slip_gaji_payroll_item` ADD CONSTRAINT `slip_gaji_payroll_item_id_slip_gaji_payroll_fkey` FOREIGN KEY (`id_slip_gaji_payroll`) REFERENCES `slip_gaji_payroll`(`id_slip_gaji_payroll`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `payout_konsultan_detail` ADD CONSTRAINT `payout_konsultan_detail_id_payout_konsultan_fkey` FOREIGN KEY (`id_payout_konsultan`) REFERENCES `payout_konsultan`(`id_payout_konsultan`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `payout_konsultan_detail` ADD CONSTRAINT `payout_konsultan_detail_id_transaksi_konsultan_fkey` FOREIGN KEY (`id_transaksi_konsultan`) REFERENCES `transaksi_konsultan`(`id_transaksi_konsultan`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- RenameIndex
ALTER TABLE `item_komponen_payroll` RENAME INDEX `item_komponen_payroll_id_definisi_komponen_payroll_fkey` TO `item_komponen_payroll_id_definisi_komponen_payroll_idx`;
