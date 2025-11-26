-- AlterTable
ALTER TABLE `cuti_konfigurasi` MODIFY `cuti_tabung` INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE `user` MODIFY `status_cuti` ENUM('aktif', 'nonaktif') NOT NULL DEFAULT 'nonaktif';
