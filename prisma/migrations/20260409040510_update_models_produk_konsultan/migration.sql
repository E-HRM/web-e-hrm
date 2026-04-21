/*
  Warnings:

  - You are about to drop the column `kode_produk` on the `jenis_produk_konsultan` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX `jenis_produk_konsultan_kode_produk_key` ON `jenis_produk_konsultan`;

-- AlterTable
ALTER TABLE `jenis_produk_konsultan` DROP COLUMN `kode_produk`;
