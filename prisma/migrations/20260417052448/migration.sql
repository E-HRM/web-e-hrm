-- RedefineIndex
CREATE UNIQUE INDEX `kpi_plan_item_week_progress_id_kpi_plan_item_week_start_key` ON `kpi_plan_item_week_progress`(`id_kpi_plan_item`, `week_start`);
DROP INDEX `unique_week_progress_per_kpi_item` ON `kpi_plan_item_week_progress`;
