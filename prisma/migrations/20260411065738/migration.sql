-- CreateTable
CREATE TABLE `form_freelance` (
    `id_form_freelance` CHAR(36) NOT NULL,
    `id_freelance` CHAR(36) NOT NULL,
    `tanggal_kerja` DATE NULL,
    `status_hari_kerja` ENUM('FULL_DAY', 'HALF_DAY') NOT NULL,
    `todo_list` LONGTEXT NOT NULL,
    `created_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` DATETIME(0) NOT NULL,
    `deleted_at` DATETIME(0) NULL,

    INDEX `form_freelance_id_freelance_idx`(`id_freelance`),
    INDEX `form_freelance_tanggal_kerja_idx`(`tanggal_kerja`),
    PRIMARY KEY (`id_form_freelance`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `form_freelance` ADD CONSTRAINT `form_freelance_id_freelance_fkey` FOREIGN KEY (`id_freelance`) REFERENCES `freelance`(`id_freelance`) ON DELETE CASCADE ON UPDATE CASCADE;
