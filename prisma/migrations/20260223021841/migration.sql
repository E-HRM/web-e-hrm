/*
  Warnings:

  - You are about to drop the column `tanggal_terbit` on the `sop_karyawan` table. All the data in the column will be lost.
  - You are about to drop the `schedule_planner` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE `schedule_planner` DROP FOREIGN KEY `schedule_planner_id_user_fkey`;

-- DropIndex
DROP INDEX `sop_karyawan_tanggal_terbit_idx` ON `sop_karyawan`;

-- AlterTable
ALTER TABLE `sop_karyawan` DROP COLUMN `tanggal_terbit`,
    ADD COLUMN `created_by_snapshot_nama_pengguna` VARCHAR(255) NULL,
    ADD COLUMN `deskripsi` LONGTEXT NULL,
    ADD COLUMN `id_kategori_sop` CHAR(36) NULL;

-- DropTable
DROP TABLE `schedule_planner`;

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

-- CreateIndex
CREATE INDEX `sop_karyawan_created_at_idx` ON `sop_karyawan`(`created_at`);

-- CreateIndex
CREATE INDEX `sop_karyawan_id_kategori_sop_idx` ON `sop_karyawan`(`id_kategori_sop`);

-- AddForeignKey
ALTER TABLE `story_planner` ADD CONSTRAINT `story_planner_id_user_fkey` FOREIGN KEY (`id_user`) REFERENCES `user`(`id_user`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `story_planner` ADD CONSTRAINT `story_planner_id_departement_fkey` FOREIGN KEY (`id_departement`) REFERENCES `departement`(`id_departement`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `shift_story_planer` ADD CONSTRAINT `shift_story_planer_id_jadwal_story_planner_fkey` FOREIGN KEY (`id_jadwal_story_planner`) REFERENCES `jadwal_story_planer`(`id_jadwal_story_planner`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `shift_story_planer` ADD CONSTRAINT `shift_story_planer_id_user_fkey` FOREIGN KEY (`id_user`) REFERENCES `user`(`id_user`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `sop_karyawan` ADD CONSTRAINT `sop_karyawan_id_kategori_sop_fkey` FOREIGN KEY (`id_kategori_sop`) REFERENCES `kategori_sop`(`id_kategori_sop`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `pinned_sops` ADD CONSTRAINT `pinned_sops_id_user_fkey` FOREIGN KEY (`id_user`) REFERENCES `user`(`id_user`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `pinned_sops` ADD CONSTRAINT `pinned_sops_id_sop_fkey` FOREIGN KEY (`id_sop`) REFERENCES `sop_karyawan`(`id_sop_karyawan`) ON DELETE CASCADE ON UPDATE CASCADE;
