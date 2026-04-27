-- AlterTable
ALTER TABLE `payout_konsultan_detail` ADD COLUMN `ditahan` BOOLEAN NOT NULL DEFAULT false;

-- AddForeignKey
ALTER TABLE `item_komponen_payroll` ADD CONSTRAINT `item_komponen_payroll_id_payroll_karyawan_fkey` FOREIGN KEY (`id_payroll_karyawan`) REFERENCES `payroll_karyawan`(`id_payroll_karyawan`) ON DELETE CASCADE ON UPDATE CASCADE;
