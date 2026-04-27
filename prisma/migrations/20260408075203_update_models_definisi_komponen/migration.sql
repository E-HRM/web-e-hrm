-- AddForeignKey
ALTER TABLE `persetujuan_periode_payroll` ADD CONSTRAINT `persetujuan_periode_payroll_id_periode_payroll_fkey` FOREIGN KEY (`id_periode_payroll`) REFERENCES `periode_payroll`(`id_periode_payroll`) ON DELETE CASCADE ON UPDATE CASCADE;
