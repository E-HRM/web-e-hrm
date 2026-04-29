-- AlterTable
ALTER TABLE `freelance` ADD COLUMN `jenis_bank` VARCHAR(50) NULL,
    ADD COLUMN `nama_pemilik_rekening` VARCHAR(70) NULL,
    ADD COLUMN `nomor_rekening` VARCHAR(50) NULL;

-- AlterTable
ALTER TABLE `payroll_karyawan` ADD COLUMN `bank_account_holder` VARCHAR(70) NULL,
    ADD COLUMN `bca_transaction_id` VARCHAR(18) NULL;

-- AlterTable
ALTER TABLE `user` ADD COLUMN `nama_pemilik_rekening` VARCHAR(70) NULL;
