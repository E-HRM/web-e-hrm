/*
  Warnings:

  - A unique constraint covering the columns `[id_user,tanggal_mulai]` on the table `shift_kerja` will be added. If there are existing duplicate values, this will fail.
  - Made the column `tanggal_mulai` on table `shift_kerja` required. This step will fail if there are existing NULL values in that column.
  - Made the column `tanggal_selesai` on table `shift_kerja` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE `shift_kerja` MODIFY `tanggal_mulai` DATE NOT NULL,
    MODIFY `tanggal_selesai` DATE NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX `shift_kerja_id_user_tanggal_mulai_key` ON `shift_kerja`(`id_user`, `tanggal_mulai`);
