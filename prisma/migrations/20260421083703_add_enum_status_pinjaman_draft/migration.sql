-- AlterTable
ALTER TABLE `agenda_kerja` ADD COLUMN `detail_ditunda` LONGTEXT NULL;

-- AlterTable
ALTER TABLE `pinjaman_karyawan` MODIFY `status_pinjaman` ENUM('DRAFT', 'AKTIF', 'LUNAS', 'DIBATALKAN') NOT NULL DEFAULT 'AKTIF';

-- RenameIndex
ALTER TABLE `kpi_plan_item_week_progress` RENAME INDEX `unique_week_progress_per_kpi_item` TO `kpi_plan_item_week_progress_id_kpi_plan_item_week_start_key`;
