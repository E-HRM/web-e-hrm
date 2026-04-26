/*
  Warnings:

  - You are about to drop the column `ttd_approval_url` on the `approval_payroll_karyawan` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `approval_payroll_karyawan` DROP COLUMN `ttd_approval_url`,
    ADD COLUMN `kode_otp_hash` VARCHAR(255) NULL,
    ADD COLUMN `otp_attempts` INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN `otp_expires_at` DATETIME(0) NULL,
    ADD COLUMN `otp_requested_at` DATETIME(0) NULL,
    ADD COLUMN `otp_verified_at` DATETIME(0) NULL;

-- AlterTable
ALTER TABLE `user` ADD COLUMN `ttd_url` LONGTEXT NULL;

-- CreateIndex
CREATE INDEX `approval_payroll_karyawan_otp_verified_at_idx` ON `approval_payroll_karyawan`(`otp_verified_at`);
