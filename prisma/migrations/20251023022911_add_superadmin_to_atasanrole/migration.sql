-- AlterTable
ALTER TABLE `absensi_report_recipients` MODIFY `recipient_role_snapshot` ENUM('HR', 'OPERASIONAL', 'DIREKTUR', 'SUPERADMIN') NULL;

-- AlterTable
ALTER TABLE `kunjungan_report_recipients` MODIFY `recipient_role_snapshot` ENUM('HR', 'OPERASIONAL', 'DIREKTUR', 'SUPERADMIN') NULL;
