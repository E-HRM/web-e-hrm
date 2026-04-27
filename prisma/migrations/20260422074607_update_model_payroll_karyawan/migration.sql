-- AlterTable
ALTER TABLE `payroll_karyawan` ADD COLUMN `company_name_snapshot` VARCHAR(255) NULL,
    ADD COLUMN `issue_number` VARCHAR(100) NULL,
    ADD COLUMN `issued_at` DATETIME(0) NULL;
