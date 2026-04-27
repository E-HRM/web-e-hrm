/*
  Warnings:

  - A unique constraint covering the columns `[id_periode_payroll,id_freelance]` on the table `payroll_karyawan` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[id_freelance]` on the table `profil_payroll` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE `payroll_karyawan` ADD COLUMN `id_freelance` CHAR(36) NULL,
    MODIFY `id_user` CHAR(36) NULL;

-- AlterTable
ALTER TABLE `profil_payroll` ADD COLUMN `id_freelance` CHAR(36) NULL,
    MODIFY `id_user` CHAR(36) NULL;

-- CreateIndex
CREATE INDEX `payroll_karyawan_id_freelance_idx` ON `payroll_karyawan`(`id_freelance`);

-- CreateIndex
CREATE UNIQUE INDEX `payroll_karyawan_id_periode_payroll_id_freelance_key` ON `payroll_karyawan`(`id_periode_payroll`, `id_freelance`);

-- CreateIndex
CREATE INDEX `profil_payroll_id_freelance_idx` ON `profil_payroll`(`id_freelance`);

-- CreateIndex
CREATE UNIQUE INDEX `profil_payroll_id_freelance_key` ON `profil_payroll`(`id_freelance`);

-- AddForeignKey
ALTER TABLE `profil_payroll` ADD CONSTRAINT `profil_payroll_id_freelance_fkey` FOREIGN KEY (`id_freelance`) REFERENCES `freelance`(`id_freelance`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `payroll_karyawan` ADD CONSTRAINT `payroll_karyawan_id_freelance_fkey` FOREIGN KEY (`id_freelance`) REFERENCES `freelance`(`id_freelance`) ON DELETE RESTRICT ON UPDATE CASCADE;
