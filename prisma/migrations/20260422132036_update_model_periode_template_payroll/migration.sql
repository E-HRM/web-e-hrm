-- AlterTable
ALTER TABLE `periode_payroll` ADD COLUMN `id_master_template` CHAR(36) NULL;

-- CreateIndex
CREATE INDEX `periode_payroll_id_master_template_idx` ON `periode_payroll`(`id_master_template`);

-- AddForeignKey
ALTER TABLE `periode_payroll` ADD CONSTRAINT `periode_payroll_id_master_template_fkey` FOREIGN KEY (`id_master_template`) REFERENCES `master_template`(`id_master_template`) ON DELETE SET NULL ON UPDATE CASCADE;
