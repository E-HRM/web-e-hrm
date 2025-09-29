/*
  Warnings:

  - You are about to drop the column `lokasi` on the `kunjungan` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[id_supervisor]` on the table `departement` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE `departement` ADD COLUMN `id_supervisor` CHAR(36) NULL;

-- AlterTable
ALTER TABLE `device` ADD COLUMN `failed_push_count` INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN `fcm_token` VARCHAR(1024) NULL,
    ADD COLUMN `fcm_token_updated_at` DATETIME(0) NULL,
    ADD COLUMN `last_push_at` DATETIME(0) NULL,
    ADD COLUMN `push_enabled` BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE `kunjungan` DROP COLUMN `lokasi`,
    ADD COLUMN `duration` INTEGER NULL,
    ADD COLUMN `end_latitude` DECIMAL(10, 6) NULL,
    ADD COLUMN `end_longitude` DECIMAL(10, 6) NULL,
    ADD COLUMN `hand_over` LONGTEXT NULL,
    ADD COLUMN `id_master_data_kunjungan` CHAR(36) NULL,
    ADD COLUMN `lampiran_kunjungan_url` LONGTEXT NULL,
    ADD COLUMN `start_latitude` DECIMAL(10, 6) NULL,
    ADD COLUMN `start_longitude` DECIMAL(10, 6) NULL;

-- CreateTable
CREATE TABLE `master_data_kunjungan` (
    `id_master_data_kunjungan` CHAR(36) NOT NULL,
    `kategori_kunjungan` VARCHAR(191) NOT NULL,
    `created_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` DATETIME(0) NOT NULL,
    `deleted_at` DATETIME(0) NULL,

    UNIQUE INDEX `master_data_kunjungan_kategori_kunjungan_key`(`kategori_kunjungan`),
    PRIMARY KEY (`id_master_data_kunjungan`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE UNIQUE INDEX `departement_id_supervisor_key` ON `departement`(`id_supervisor`);

-- CreateIndex
CREATE INDEX `device_device_identifier_idx` ON `device`(`device_identifier`);

-- CreateIndex
CREATE INDEX `device_fcm_token_idx` ON `device`(`fcm_token`(191));

-- CreateIndex
CREATE INDEX `kunjungan_id_master_data_kunjungan_idx` ON `kunjungan`(`id_master_data_kunjungan`);

-- AddForeignKey
ALTER TABLE `kunjungan` ADD CONSTRAINT `kunjungan_id_master_data_kunjungan_fkey` FOREIGN KEY (`id_master_data_kunjungan`) REFERENCES `master_data_kunjungan`(`id_master_data_kunjungan`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `departement` ADD CONSTRAINT `departement_id_supervisor_fkey` FOREIGN KEY (`id_supervisor`) REFERENCES `user`(`id_user`) ON DELETE SET NULL ON UPDATE CASCADE;
