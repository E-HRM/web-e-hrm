/*
  Warnings:

  - You are about to drop the column `kategori` on the `pengajuan_izin_jam` table. All the data in the column will be lost.
  - Added the required column `id_kategori_izin_jam` to the `pengajuan_izin_jam` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `pengajuan_izin_jam` DROP COLUMN `kategori`,
    ADD COLUMN `id_kategori_izin_jam` CHAR(36) NOT NULL,
    ADD COLUMN `jam_mulai_pengganti` DATETIME(0) NULL,
    ADD COLUMN `jam_selesai_pengganti` DATETIME(0) NULL,
    ADD COLUMN `tanggal_pengganti` DATE NULL;

-- AlterTable
ALTER TABLE `user` ADD COLUMN `nama_kontak_darurat` VARCHAR(32) NULL;

-- CreateTable
CREATE TABLE `kategori_izin_jam` (
    `id_kategori_izin_jam` CHAR(36) NOT NULL,
    `nama_kategori` VARCHAR(255) NOT NULL,
    `created_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` DATETIME(0) NOT NULL,
    `deleted_at` DATETIME(0) NULL,

    PRIMARY KEY (`id_kategori_izin_jam`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE INDEX `pengajuan_izin_jam_id_kategori_izin_jam_idx` ON `pengajuan_izin_jam`(`id_kategori_izin_jam`);

-- AddForeignKey
ALTER TABLE `pengajuan_izin_jam` ADD CONSTRAINT `pengajuan_izin_jam_id_kategori_izin_jam_fkey` FOREIGN KEY (`id_kategori_izin_jam`) REFERENCES `kategori_izin_jam`(`id_kategori_izin_jam`) ON DELETE RESTRICT ON UPDATE CASCADE;
