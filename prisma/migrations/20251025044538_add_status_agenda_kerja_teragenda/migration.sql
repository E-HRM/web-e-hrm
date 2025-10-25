/*
  Warnings:

  - You are about to alter the column `status_kunjungan` on the `kunjungan` table. The data in that column could be lost. The data in that column will be cast from `Enum(EnumId(22))` to `Enum(EnumId(2))`.
  - You are about to drop the `cuti` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `cuti_approval` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `jadwal_piket` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `shift_piket` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[id_user,bulan]` on the table `cuti_konfigurasi` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `id_user` to the `cuti_konfigurasi` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE `cuti` DROP FOREIGN KEY `Cuti_id_user_fkey`;

-- DropForeignKey
ALTER TABLE `cuti_approval` DROP FOREIGN KEY `cuti_approval_approver_user_id_fkey`;

-- DropForeignKey
ALTER TABLE `cuti_approval` DROP FOREIGN KEY `cuti_approval_id_cuti_fkey`;

-- DropForeignKey
ALTER TABLE `shift_piket` DROP FOREIGN KEY `shift_piket_id_jadwal_piket_fkey`;

-- DropForeignKey
ALTER TABLE `shift_piket` DROP FOREIGN KEY `shift_piket_id_user_fkey`;

-- AlterTable
ALTER TABLE `agenda_kerja` MODIFY `status` ENUM('teragenda', 'diproses', 'ditunda', 'selesai') NOT NULL;

-- AlterTable
ALTER TABLE `cuti_konfigurasi` ADD COLUMN `id_user` CHAR(36) NOT NULL;

-- AlterTable
ALTER TABLE `kunjungan` MODIFY `status_kunjungan` ENUM('teragenda', 'berlangsung', 'selesai') NOT NULL DEFAULT 'teragenda';

-- AlterTable
ALTER TABLE `user` ADD COLUMN `catatan_delete` LONGTEXT NULL;

-- DropTable
DROP TABLE `cuti`;

-- DropTable
DROP TABLE `cuti_approval`;

-- DropTable
DROP TABLE `jadwal_piket`;

-- DropTable
DROP TABLE `shift_piket`;

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
CREATE TABLE `kategori_cuti` (
    `id_kategori_cuti` CHAR(36) NOT NULL,
    `nama_kategori` VARCHAR(255) NOT NULL,
    `created_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` DATETIME(0) NOT NULL,
    `deleted_at` DATETIME(0) NULL,

    PRIMARY KEY (`id_kategori_cuti`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `pengajuan_cuti` (
    `id_pengajuan_cuti` CHAR(36) NOT NULL,
    `id_user` CHAR(36) NOT NULL,
    `id_kategori_cuti` CHAR(36) NOT NULL,
    `keperluan` LONGTEXT NULL,
    `tanggal_mulai` DATE NOT NULL,
    `tanggal_masuk_kerja` DATE NOT NULL,
    `handover` LONGTEXT NULL,
    `status` ENUM('disetujui', 'ditolak', 'pending', 'menunggu') NOT NULL DEFAULT 'pending',
    `current_level` INTEGER NULL,
    `created_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` DATETIME(0) NOT NULL,
    `deleted_at` DATETIME(0) NULL,

    INDEX `pengajuan_cuti_id_user_idx`(`id_user`),
    INDEX `pengajuan_cuti_id_kategori_cuti_idx`(`id_kategori_cuti`),
    PRIMARY KEY (`id_pengajuan_cuti`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `approval_pengajuan_cuti` (
    `id_approval_pengajuan_cuti` CHAR(36) NOT NULL,
    `id_pengajuan_cuti` CHAR(36) NOT NULL,
    `level` INTEGER NOT NULL,
    `approver_user_id` CHAR(36) NULL,
    `approver_role` ENUM('KARYAWAN', 'HR', 'OPERASIONAL', 'DIREKTUR', 'SUPERADMIN', 'SUBADMIN', 'SUPERVISI') NULL,
    `decision` ENUM('disetujui', 'ditolak', 'pending', 'menunggu') NOT NULL DEFAULT 'pending',
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
    `status` ENUM('disetujui', 'ditolak', 'pending', 'menunggu') NOT NULL DEFAULT 'pending',
    `current_level` INTEGER NULL,
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
    `decision` ENUM('disetujui', 'ditolak', 'pending', 'menunggu') NOT NULL DEFAULT 'pending',
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
    `tanggal_izin` DATE NOT NULL,
    `jam_mulai` DATETIME(0) NOT NULL,
    `jam_selesai` DATETIME(0) NOT NULL,
    `kategori` VARCHAR(255) NOT NULL,
    `keperluan` LONGTEXT NULL,
    `handover` LONGTEXT NULL,
    `lampiran_izin_jam_url` LONGTEXT NULL,
    `status` ENUM('disetujui', 'ditolak', 'pending', 'menunggu') NOT NULL DEFAULT 'pending',
    `current_level` INTEGER NULL,
    `created_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` DATETIME(0) NOT NULL,
    `deleted_at` DATETIME(0) NULL,

    INDEX `pengajuan_izin_jam_id_user_tanggal_izin_idx`(`id_user`, `tanggal_izin`),
    PRIMARY KEY (`id_pengajuan_izin_jam`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `approval_pengajuan_izin_jam` (
    `id_approval_pengajuan_izin_jam` CHAR(36) NOT NULL,
    `id_pengajuan_izin_jam` CHAR(36) NOT NULL,
    `level` INTEGER NOT NULL,
    `approver_user_id` CHAR(36) NULL,
    `approver_role` ENUM('KARYAWAN', 'HR', 'OPERASIONAL', 'DIREKTUR', 'SUPERADMIN', 'SUBADMIN', 'SUPERVISI') NULL,
    `decision` ENUM('disetujui', 'ditolak', 'pending', 'menunggu') NOT NULL DEFAULT 'pending',
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
    `hari_izin` DATE NOT NULL,
    `hari_pengganti` DATE NOT NULL,
    `kategori` VARCHAR(255) NOT NULL,
    `keperluan` LONGTEXT NULL,
    `handover` LONGTEXT NULL,
    `status` ENUM('disetujui', 'ditolak', 'pending', 'menunggu') NOT NULL DEFAULT 'pending',
    `current_level` INTEGER NULL,
    `created_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` DATETIME(0) NOT NULL,
    `deleted_at` DATETIME(0) NULL,

    INDEX `izin_tukar_hari_id_user_hari_izin_idx`(`id_user`, `hari_izin`),
    PRIMARY KEY (`id_izin_tukar_hari`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `approval_izin_tukar_hari` (
    `id_approval_izin_tukar_hari` CHAR(36) NOT NULL,
    `id_izin_tukar_hari` CHAR(36) NOT NULL,
    `level` INTEGER NOT NULL,
    `approver_user_id` CHAR(36) NULL,
    `approver_role` ENUM('KARYAWAN', 'HR', 'OPERASIONAL', 'DIREKTUR', 'SUPERADMIN', 'SUBADMIN', 'SUPERVISI') NULL,
    `decision` ENUM('disetujui', 'ditolak', 'pending', 'menunggu') NOT NULL DEFAULT 'pending',
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

-- CreateIndex
CREATE INDEX `cuti_konfigurasi_id_user_idx` ON `cuti_konfigurasi`(`id_user`);

-- CreateIndex
CREATE UNIQUE INDEX `cuti_konfigurasi_id_user_bulan_key` ON `cuti_konfigurasi`(`id_user`, `bulan`);

-- AddForeignKey
ALTER TABLE `cuti_konfigurasi` ADD CONSTRAINT `cuti_konfigurasi_id_user_fkey` FOREIGN KEY (`id_user`) REFERENCES `user`(`id_user`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `pengajuan_cuti` ADD CONSTRAINT `pengajuan_cuti_id_user_fkey` FOREIGN KEY (`id_user`) REFERENCES `user`(`id_user`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `pengajuan_cuti` ADD CONSTRAINT `pengajuan_cuti_id_kategori_cuti_fkey` FOREIGN KEY (`id_kategori_cuti`) REFERENCES `kategori_cuti`(`id_kategori_cuti`) ON DELETE RESTRICT ON UPDATE CASCADE;

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
ALTER TABLE `approval_pengajuan_izin_jam` ADD CONSTRAINT `approval_pengajuan_izin_jam_id_pengajuan_izin_jam_fkey` FOREIGN KEY (`id_pengajuan_izin_jam`) REFERENCES `pengajuan_izin_jam`(`id_pengajuan_izin_jam`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `approval_pengajuan_izin_jam` ADD CONSTRAINT `approval_pengajuan_izin_jam_approver_user_id_fkey` FOREIGN KEY (`approver_user_id`) REFERENCES `user`(`id_user`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `izin_tukar_hari` ADD CONSTRAINT `izin_tukar_hari_id_user_fkey` FOREIGN KEY (`id_user`) REFERENCES `user`(`id_user`) ON DELETE RESTRICT ON UPDATE CASCADE;

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
