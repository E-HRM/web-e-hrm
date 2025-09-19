-- AlterTable
ALTER TABLE `pola_kerja` ADD COLUMN `jam_istirahat_mulai` DATETIME(0) NULL,
    ADD COLUMN `jam_istirahat_selesai` DATETIME(0) NULL,
    ADD COLUMN `maks_jam_istirahat` INTEGER NULL;
