/*
  Warnings:

  - You are about to alter the column `status_kunjungan` on the `kunjungan` table. The data in that column could be lost. The data in that column will be cast from `Enum(EnumId(28))` to `Enum(EnumId(2))`.

*/
-- AlterTable
ALTER TABLE `kunjungan` MODIFY `status_kunjungan` ENUM('diproses', 'berlangsung', 'selesai') NOT NULL DEFAULT 'diproses';
