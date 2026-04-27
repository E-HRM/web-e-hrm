/*
  Warnings:

  - You are about to drop the column `kena_pajak_default` on the `definisi_komponen_payroll` table. All the data in the column will be lost.
  - You are about to drop the column `kena_pajak` on the `item_komponen_payroll` table. All the data in the column will be lost.
  - You are about to drop the column `id_tarif_pajak_ter` on the `profil_payroll` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE `profil_payroll` DROP FOREIGN KEY `profil_payroll_id_tarif_pajak_ter_fkey`;

-- DropIndex
DROP INDEX `profil_payroll_id_tarif_pajak_ter_idx` ON `profil_payroll`;

-- AlterTable
ALTER TABLE `definisi_komponen_payroll` DROP COLUMN `kena_pajak_default`;

-- AlterTable
ALTER TABLE `item_komponen_payroll` DROP COLUMN `kena_pajak`;

-- AlterTable
ALTER TABLE `payroll_karyawan` ADD COLUMN `tunjangan_bpjs_snapshot` DECIMAL(15, 2) NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE `profil_payroll` DROP COLUMN `id_tarif_pajak_ter`,
    ADD COLUMN `tunjangan_bpjs` DECIMAL(15, 2) NOT NULL DEFAULT 0;
