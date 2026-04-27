/*
  Warnings:

  - You are about to drop the column `diproses_pada` on the `item_komponen_payroll` table. All the data in the column will be lost.
  - You are about to drop the column `id_data_sumber` on the `item_komponen_payroll` table. All the data in the column will be lost.
  - You are about to drop the column `is_locked` on the `item_komponen_payroll` table. All the data in the column will be lost.
  - You are about to drop the column `kode_proses_massal` on the `item_komponen_payroll` table. All the data in the column will be lost.
  - You are about to drop the column `modul_sumber` on the `item_komponen_payroll` table. All the data in the column will be lost.
  - You are about to drop the column `nama_proses_massal` on the `item_komponen_payroll` table. All the data in the column will be lost.
  - You are about to drop the column `sumber_input` on the `item_komponen_payroll` table. All the data in the column will be lost.
  - You are about to drop the `riwayat_kompensasi_karyawan` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `slip_gaji_payroll` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `slip_gaji_payroll_item` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE `item_komponen_payroll` DROP FOREIGN KEY `item_komponen_payroll_id_payroll_karyawan_fkey`;

-- DropForeignKey
ALTER TABLE `riwayat_kompensasi_karyawan` DROP FOREIGN KEY `riwayat_kompensasi_karyawan_id_user_fkey`;

-- DropForeignKey
ALTER TABLE `slip_gaji_payroll` DROP FOREIGN KEY `slip_gaji_payroll_id_payroll_karyawan_fkey`;

-- DropForeignKey
ALTER TABLE `slip_gaji_payroll` DROP FOREIGN KEY `slip_gaji_payroll_id_tarif_pajak_ter_fkey`;

-- DropForeignKey
ALTER TABLE `slip_gaji_payroll_item` DROP FOREIGN KEY `slip_gaji_payroll_item_id_slip_gaji_payroll_fkey`;

-- DropIndex
DROP INDEX `item_komponen_payroll_id_payroll_karyawan_kode_proses_massal_idx` ON `item_komponen_payroll`;

-- DropIndex
DROP INDEX `item_komponen_payroll_modul_sumber_id_data_sumber_idx` ON `item_komponen_payroll`;

-- DropIndex
DROP INDEX `item_komponen_payroll_sumber_input_kode_proses_massal_idx` ON `item_komponen_payroll`;

-- AlterTable
ALTER TABLE `item_komponen_payroll` DROP COLUMN `diproses_pada`,
    DROP COLUMN `id_data_sumber`,
    DROP COLUMN `is_locked`,
    DROP COLUMN `kode_proses_massal`,
    DROP COLUMN `modul_sumber`,
    DROP COLUMN `nama_proses_massal`,
    DROP COLUMN `sumber_input`;

-- AlterTable
ALTER TABLE `payroll_karyawan` ADD COLUMN `gaji_pokok_snapshot` DECIMAL(15, 2) NOT NULL DEFAULT 0,
    ADD COLUMN `id_profil_payroll` CHAR(36) NULL;

-- AlterTable
ALTER TABLE `profil_payroll` ADD COLUMN `gaji_pokok` DECIMAL(15, 2) NOT NULL DEFAULT 0;

-- DropTable
DROP TABLE `riwayat_kompensasi_karyawan`;

-- DropTable
DROP TABLE `slip_gaji_payroll`;

-- DropTable
DROP TABLE `slip_gaji_payroll_item`;

-- CreateIndex
CREATE INDEX `payroll_karyawan_id_profil_payroll_idx` ON `payroll_karyawan`(`id_profil_payroll`);

-- AddForeignKey
ALTER TABLE `payroll_karyawan` ADD CONSTRAINT `payroll_karyawan_id_profil_payroll_fkey` FOREIGN KEY (`id_profil_payroll`) REFERENCES `profil_payroll`(`id_profil_payroll`) ON DELETE SET NULL ON UPDATE CASCADE;
