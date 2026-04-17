CREATE TABLE `kpi_plan_item_week_progress` (
  `id_kpi_plan_item_week_progress` CHAR(36) NOT NULL,
  `id_kpi_plan_item` CHAR(36) NOT NULL,
  `tahun` INTEGER NOT NULL,
  `week_start` DATE NOT NULL,
  `week_end` DATE NOT NULL,
  `completed_count` INTEGER NOT NULL DEFAULT 0,
  `created_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
  `updated_at` DATETIME(0) NOT NULL,

  UNIQUE INDEX `unique_week_progress_per_kpi_item`(`id_kpi_plan_item`, `week_start`),
  INDEX `kpi_plan_item_week_progress_id_kpi_plan_item_idx`(`id_kpi_plan_item`),
  INDEX `kpi_plan_item_week_progress_tahun_week_start_idx`(`tahun`, `week_start`),
  PRIMARY KEY (`id_kpi_plan_item_week_progress`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `kpi_plan_item_week_progress`
  ADD CONSTRAINT `kpi_plan_item_week_progress_id_kpi_plan_item_fkey`
  FOREIGN KEY (`id_kpi_plan_item`) REFERENCES `kpi_plan_item`(`id_kpi_plan_item`)
  ON DELETE CASCADE
  ON UPDATE CASCADE;
