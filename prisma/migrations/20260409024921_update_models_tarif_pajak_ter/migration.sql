/*
  Warnings:

  - You are about to drop the column `status_ptkp` on the `payroll_karyawan` table. All the data in the column will be lost.
  - You are about to drop the column `status_ptkp` on the `profil_payroll` table. All the data in the column will be lost.
  - You are about to drop the column `status_ptkp` on the `slip_gaji_payroll` table. All the data in the column will be lost.
  - You are about to drop the column `kategori_ter` on the `tarif_pajak_ter` table. All the data in the column will be lost.
  - Added the required column `berlaku_mulai_tarif_snapshot` to the `payroll_karyawan` table without a default value. This is not possible if the table is not empty.
  - Added the required column `kode_kategori_pajak_snapshot` to the `payroll_karyawan` table without a default value. This is not possible if the table is not empty.
  - Added the required column `penghasilan_dari_snapshot` to the `payroll_karyawan` table without a default value. This is not possible if the table is not empty.
  - Added the required column `persen_tarif_snapshot` to the `payroll_karyawan` table without a default value. This is not possible if the table is not empty.
  - Added the required column `id_tarif_pajak_ter` to the `profil_payroll` table without a default value. This is not possible if the table is not empty.
  - Added the required column `berlaku_mulai_tarif_snapshot` to the `slip_gaji_payroll` table without a default value. This is not possible if the table is not empty.
  - Added the required column `kode_kategori_pajak_snapshot` to the `slip_gaji_payroll` table without a default value. This is not possible if the table is not empty.
  - Added the required column `penghasilan_dari_snapshot` to the `slip_gaji_payroll` table without a default value. This is not possible if the table is not empty.
  - Added the required column `persen_tarif_snapshot` to the `slip_gaji_payroll` table without a default value. This is not possible if the table is not empty.
  - Added the required column `kode_kategori_pajak` to the `tarif_pajak_ter` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX `profil_payroll_status_ptkp_idx` ON `profil_payroll`;

-- DropIndex
DROP INDEX `tarif_pajak_ter_kategori_ter_berlaku_mulai_berlaku_sampai_idx` ON `tarif_pajak_ter`;

-- DropIndex
DROP INDEX `tarif_pajak_ter_kategori_ter_penghasilan_dari_idx` ON `tarif_pajak_ter`;

-- AlterTable
ALTER TABLE `payroll_karyawan` DROP COLUMN `status_ptkp`,
    ADD COLUMN `berlaku_mulai_tarif_snapshot` DATE NOT NULL,
    ADD COLUMN `berlaku_sampai_tarif_snapshot` DATE NULL,
    ADD COLUMN `id_tarif_pajak_ter` CHAR(36) NULL,
    ADD COLUMN `kode_kategori_pajak_snapshot` VARCHAR(255) NOT NULL,
    ADD COLUMN `penghasilan_dari_snapshot` DECIMAL(15, 2) NOT NULL,
    ADD COLUMN `penghasilan_sampai_snapshot` DECIMAL(15, 2) NULL,
    ADD COLUMN `persen_tarif_snapshot` DECIMAL(7, 4) NOT NULL;

-- AlterTable
ALTER TABLE `profil_payroll` DROP COLUMN `status_ptkp`,
    ADD COLUMN `id_tarif_pajak_ter` CHAR(36) NOT NULL;

-- AlterTable
ALTER TABLE `slip_gaji_payroll` DROP COLUMN `status_ptkp`,
    ADD COLUMN `berlaku_mulai_tarif_snapshot` DATE NOT NULL,
    ADD COLUMN `berlaku_sampai_tarif_snapshot` DATE NULL,
    ADD COLUMN `id_tarif_pajak_ter` CHAR(36) NULL,
    ADD COLUMN `kode_kategori_pajak_snapshot` VARCHAR(255) NOT NULL,
    ADD COLUMN `penghasilan_dari_snapshot` DECIMAL(15, 2) NOT NULL,
    ADD COLUMN `penghasilan_sampai_snapshot` DECIMAL(15, 2) NULL,
    ADD COLUMN `persen_tarif_snapshot` DECIMAL(7, 4) NOT NULL;

-- AlterTable
ALTER TABLE `tarif_pajak_ter` DROP COLUMN `kategori_ter`,
    ADD COLUMN `kode_kategori_pajak` VARCHAR(255) NOT NULL;

-- CreateIndex
CREATE INDEX `payroll_karyawan_id_tarif_pajak_ter_idx` ON `payroll_karyawan`(`id_tarif_pajak_ter`);

-- CreateIndex
CREATE INDEX `profil_payroll_id_tarif_pajak_ter_idx` ON `profil_payroll`(`id_tarif_pajak_ter`);

-- CreateIndex
CREATE INDEX `slip_gaji_payroll_id_tarif_pajak_ter_idx` ON `slip_gaji_payroll`(`id_tarif_pajak_ter`);

-- CreateIndex
CREATE INDEX `tarif_pajak_ter_kode_kategori_pajak_penghasilan_dari_idx` ON `tarif_pajak_ter`(`kode_kategori_pajak`, `penghasilan_dari`);

-- CreateIndex
CREATE INDEX `tarif_pajak_ter_kode_kategori_pajak_berlaku_mulai_berlaku_sa_idx` ON `tarif_pajak_ter`(`kode_kategori_pajak`, `berlaku_mulai`, `berlaku_sampai`);

-- AddForeignKey
ALTER TABLE `profil_payroll` ADD CONSTRAINT `profil_payroll_id_tarif_pajak_ter_fkey` FOREIGN KEY (`id_tarif_pajak_ter`) REFERENCES `tarif_pajak_ter`(`id_tarif_pajak_ter`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `payroll_karyawan` ADD CONSTRAINT `payroll_karyawan_id_tarif_pajak_ter_fkey` FOREIGN KEY (`id_tarif_pajak_ter`) REFERENCES `tarif_pajak_ter`(`id_tarif_pajak_ter`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `slip_gaji_payroll` ADD CONSTRAINT `slip_gaji_payroll_id_tarif_pajak_ter_fkey` FOREIGN KEY (`id_tarif_pajak_ter`) REFERENCES `tarif_pajak_ter`(`id_tarif_pajak_ter`) ON DELETE SET NULL ON UPDATE CASCADE;
