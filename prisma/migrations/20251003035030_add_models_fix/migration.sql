/*
  Warnings:

  - You are about to drop the column `id_master_data_kunjungan` on the `kunjungan` table. All the data in the column will be lost.
  - You are about to drop the `master_data_kunjungan` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `recipient_nama_snapshot` to the `absensi_report_recipients` table without a default value. This is not possible if the table is not empty.
  - Added the required column `recipient_nama_snapshot` to the `kunjungan_report_recipients` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE `kunjungan` DROP FOREIGN KEY `kunjungan_id_master_data_kunjungan_fkey`;

-- DropIndex
DROP INDEX `kunjungan_id_master_data_kunjungan_idx` ON `kunjungan`;

-- AlterTable
ALTER TABLE `absensi_report_recipients` ADD COLUMN `recipient_nama_snapshot` VARCHAR(255) NOT NULL;

-- AlterTable
ALTER TABLE `agenda_kerja` ADD COLUMN `kebutuhan_agenda` VARCHAR(255) NULL;

-- AlterTable
ALTER TABLE `kunjungan` DROP COLUMN `id_master_data_kunjungan`,
    ADD COLUMN `id_kategori_kunjungan` CHAR(36) NULL,
    ADD COLUMN `jam_checkin` DATETIME(0) NULL,
    ADD COLUMN `jam_checkout` DATETIME(0) NULL,
    ADD COLUMN `status_kunjungan` ENUM('diproses', 'berlangsung', 'selesai') NOT NULL DEFAULT 'diproses';

-- AlterTable
ALTER TABLE `kunjungan_report_recipients` ADD COLUMN `recipient_nama_snapshot` VARCHAR(255) NOT NULL;

-- AlterTable
ALTER TABLE `user` ADD COLUMN `kontak_darurat` VARCHAR(32) NULL;

-- DropTable
DROP TABLE `master_data_kunjungan`;

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

-- CreateIndex
CREATE INDEX `kunjungan_id_kategori_kunjungan_idx` ON `kunjungan`(`id_kategori_kunjungan`);

-- AddForeignKey
ALTER TABLE `kunjungan` ADD CONSTRAINT `kunjungan_id_kategori_kunjungan_fkey` FOREIGN KEY (`id_kategori_kunjungan`) REFERENCES `kategori_kunjungan`(`id_kategori_kunjungan`) ON DELETE SET NULL ON UPDATE CASCADE;
