/*
  Warnings:

  - You are about to drop the column `nominal_cicilan` on the `pinjaman_karyawan` table. All the data in the column will be lost.
  - Added the required column `tenor_bulan` to the `pinjaman_karyawan` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `pinjaman_karyawan` DROP COLUMN `nominal_cicilan`,
    ADD COLUMN `tenor_bulan` INTEGER NOT NULL;
