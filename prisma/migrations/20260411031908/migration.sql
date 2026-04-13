-- CreateTable
CREATE TABLE `freelance` (
    `id_freelance` CHAR(36) NOT NULL,
    `nama` VARCHAR(255) NOT NULL,
    `alamat` VARCHAR(255) NULL,
    `kontak` VARCHAR(32) NULL,
    `email` VARCHAR(255) NULL,
    `id_supervisor` CHAR(36) NULL,
    `created_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` DATETIME(0) NOT NULL,
    `deleted_at` DATETIME(0) NULL,

    INDEX `freelance_id_supervisor_idx`(`id_supervisor`),
    PRIMARY KEY (`id_freelance`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `freelance` ADD CONSTRAINT `freelance_id_supervisor_fkey` FOREIGN KEY (`id_supervisor`) REFERENCES `user`(`id_user`) ON DELETE SET NULL ON UPDATE CASCADE;
