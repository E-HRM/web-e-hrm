/*
  Warnings:

  - You are about to drop the column `deleted_at` on the `periode_payroll` table. All the data in the column will be lost.
  - You are about to drop the column `difinalkan_pada` on the `periode_payroll` table. All the data in the column will be lost.
  - You are about to drop the column `diproses_pada` on the `periode_payroll` table. All the data in the column will be lost.
  - You are about to drop the `persetujuan_periode_payroll` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE `persetujuan_periode_payroll` DROP FOREIGN KEY `persetujuan_periode_payroll_id_periode_payroll_fkey`;

-- DropForeignKey
ALTER TABLE `persetujuan_periode_payroll` DROP FOREIGN KEY `persetujuan_periode_payroll_id_user_penyetuju_fkey`;

-- DropIndex
DROP INDEX `periode_payroll_deleted_at_idx` ON `periode_payroll`;

-- DropIndex
DROP INDEX `periode_payroll_status_periode_idx` ON `periode_payroll`;

-- AlterTable
ALTER TABLE `payroll_karyawan` ADD COLUMN `current_level_approval` INTEGER NULL,
    ADD COLUMN `status_approval` ENUM('disetujui', 'ditolak', 'pending') NOT NULL DEFAULT 'pending';

-- AlterTable
ALTER TABLE `periode_payroll` DROP COLUMN `deleted_at`,
    DROP COLUMN `difinalkan_pada`,
    DROP COLUMN `diproses_pada`;

-- DropTable
DROP TABLE `persetujuan_periode_payroll`;

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
    `ttd_approval_url` LONGTEXT NULL,
    `created_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` DATETIME(0) NOT NULL,
    `deleted_at` DATETIME(0) NULL,

    INDEX `approval_payroll_karyawan_id_payroll_karyawan_idx`(`id_payroll_karyawan`),
    INDEX `approval_payroll_karyawan_approver_user_id_idx`(`approver_user_id`),
    INDEX `approval_payroll_karyawan_decision_idx`(`decision`),
    INDEX `approval_payroll_karyawan_deleted_at_idx`(`deleted_at`),
    UNIQUE INDEX `approval_payroll_karyawan_id_payroll_karyawan_level_key`(`id_payroll_karyawan`, `level`),
    PRIMARY KEY (`id_approval_payroll_karyawan`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE INDEX `payroll_karyawan_status_approval_idx` ON `payroll_karyawan`(`status_approval`);

-- CreateIndex
CREATE INDEX `payroll_karyawan_id_periode_payroll_status_approval_idx` ON `payroll_karyawan`(`id_periode_payroll`, `status_approval`);

-- AddForeignKey
ALTER TABLE `approval_payroll_karyawan` ADD CONSTRAINT `approval_payroll_karyawan_id_payroll_karyawan_fkey` FOREIGN KEY (`id_payroll_karyawan`) REFERENCES `payroll_karyawan`(`id_payroll_karyawan`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `approval_payroll_karyawan` ADD CONSTRAINT `approval_payroll_karyawan_approver_user_id_fkey` FOREIGN KEY (`approver_user_id`) REFERENCES `user`(`id_user`) ON DELETE RESTRICT ON UPDATE CASCADE;
