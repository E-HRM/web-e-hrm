/*
  Warnings:

  - You are about to drop the `jadwal_story_planer` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `shift_story_planer` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `story_planner` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE `shift_story_planer` DROP FOREIGN KEY `shift_story_planer_id_jadwal_story_planner_fkey`;

-- DropForeignKey
ALTER TABLE `shift_story_planer` DROP FOREIGN KEY `shift_story_planer_id_user_fkey`;

-- DropForeignKey
ALTER TABLE `story_planner` DROP FOREIGN KEY `story_planner_id_departement_fkey`;

-- DropForeignKey
ALTER TABLE `story_planner` DROP FOREIGN KEY `story_planner_id_user_fkey`;

-- AlterTable
ALTER TABLE `cuti_konfigurasi` ALTER COLUMN `cuti_tabung` DROP DEFAULT;

-- AlterTable
ALTER TABLE `user` MODIFY `status_cuti` ENUM('aktif', 'nonaktif') NOT NULL DEFAULT 'aktif';

-- DropTable
DROP TABLE `jadwal_story_planer`;

-- DropTable
DROP TABLE `shift_story_planer`;

-- DropTable
DROP TABLE `story_planner`;

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
CREATE TABLE `sop_karyawan` (
    `id_sop_karyawan` CHAR(36) NOT NULL,
    `nama_dokumen` VARCHAR(255) NOT NULL,
    `tanggal_terbit` DATE NOT NULL,
    `lampiran_sop_url` LONGTEXT NULL,
    `created_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` DATETIME(0) NOT NULL,
    `deleted_at` DATETIME(0) NULL,

    INDEX `sop_karyawan_tanggal_terbit_idx`(`tanggal_terbit`),
    PRIMARY KEY (`id_sop_karyawan`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `schedule_planner` (
    `id_schedule_planner` CHAR(36) NOT NULL,
    `id_user` CHAR(36) NOT NULL,
    `tahun` INTEGER NOT NULL,
    `bulan` ENUM('JANUARI', 'FEBRUARI', 'MARET', 'APRIL', 'MEI', 'JUNI', 'JULI', 'AGUSTUS', 'SEPTEMBER', 'OKTOBER', 'NOVEMBER', 'DESEMBER') NOT NULL,
    `is_scheduled` BOOLEAN NOT NULL DEFAULT false,
    `created_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` DATETIME(0) NOT NULL,
    `deleted_at` DATETIME(0) NULL,

    INDEX `schedule_planner_id_user_idx`(`id_user`),
    INDEX `schedule_planner_tahun_bulan_idx`(`tahun`, `bulan`),
    UNIQUE INDEX `schedule_planner_id_user_tahun_bulan_key`(`id_user`, `tahun`, `bulan`),
    PRIMARY KEY (`id_schedule_planner`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

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
ALTER TABLE `schedule_planner` ADD CONSTRAINT `schedule_planner_id_user_fkey` FOREIGN KEY (`id_user`) REFERENCES `user`(`id_user`) ON DELETE RESTRICT ON UPDATE CASCADE;
