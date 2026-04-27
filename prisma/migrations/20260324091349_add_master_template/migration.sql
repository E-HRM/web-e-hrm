-- CreateTable
CREATE TABLE `master_template` (
    `id_master_template` CHAR(36) NOT NULL,
    `nama_template` VARCHAR(255) NOT NULL,
    `file_template_url` LONGTEXT NOT NULL,
    `created_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` DATETIME(0) NOT NULL,
    `deleted_at` DATETIME(0) NULL,

    PRIMARY KEY (`id_master_template`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
