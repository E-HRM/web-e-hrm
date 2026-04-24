/*
  Warnings:

  - You are about to drop the column `dibayar_pada` on the `payroll_karyawan` table. All the data in the column will be lost.
  - You are about to drop the column `locked_at` on the `payroll_karyawan` table. All the data in the column will be lost.
  - The values [TERSIMPAN] on the enum `payroll_karyawan_status_payroll` will be removed. If these variants are still used in the database, this will fail.
  - The values [DIREVIEW,FINAL] on the enum `periode_payroll_status_periode` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterTable
ALTER TABLE `payroll_karyawan` DROP COLUMN `dibayar_pada`,
    DROP COLUMN `locked_at`,
    ADD COLUMN `bukti_bayar_url` LONGTEXT NULL,
    MODIFY `status_payroll` ENUM('DRAFT', 'DISETUJUI', 'DIBAYAR') NOT NULL DEFAULT 'DRAFT';

-- AlterTable
ALTER TABLE `periode_payroll` MODIFY `status_periode` ENUM('DRAFT', 'DIPROSES', 'TERKUNCI') NOT NULL DEFAULT 'DRAFT';
