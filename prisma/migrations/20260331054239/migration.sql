-- CreateTable
CREATE TABLE `kpi` (
    `id_kpi` CHAR(36) NOT NULL,
    `kode_kpi` VARCHAR(100) NULL,
    `nama_kpi` VARCHAR(255) NOT NULL,
    `deskripsi` LONGTEXT NULL,
    `default_satuan` VARCHAR(100) NULL,
    `value_type` ENUM('number', 'currency', 'percent') NOT NULL DEFAULT 'number',
    `created_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` DATETIME(0) NOT NULL,
    `deleted_at` DATETIME(0) NULL,

    UNIQUE INDEX `kpi_kode_kpi_key`(`kode_kpi`),
    INDEX `kpi_nama_kpi_idx`(`nama_kpi`),
    PRIMARY KEY (`id_kpi`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `kpi_jabatan` (
    `id_kpi_jabatan` CHAR(36) NOT NULL,
    `id_kpi` CHAR(36) NOT NULL,
    `id_jabatan` CHAR(36) NOT NULL,
    `urutan` INTEGER NOT NULL DEFAULT 0,
    `target_default` DECIMAL(18, 2) NULL,
    `satuan_override` VARCHAR(100) NULL,
    `bobot` DECIMAL(5, 2) NULL,
    `wajib` BOOLEAN NOT NULL DEFAULT true,
    `created_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` DATETIME(0) NOT NULL,
    `deleted_at` DATETIME(0) NULL,

    INDEX `kpi_jabatan_id_kpi_idx`(`id_kpi`),
    INDEX `kpi_jabatan_id_jabatan_idx`(`id_jabatan`),
    INDEX `kpi_jabatan_id_jabatan_urutan_idx`(`id_jabatan`, `urutan`),
    UNIQUE INDEX `kpi_jabatan_id_kpi_id_jabatan_key`(`id_kpi`, `id_jabatan`),
    PRIMARY KEY (`id_kpi_jabatan`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `kpi_plan` (
    `id_kpi_plan` CHAR(36) NOT NULL,
    `id_user` CHAR(36) NOT NULL,
    `id_jabatan` CHAR(36) NOT NULL,
    `id_location` CHAR(36) NULL,
    `tahun` INTEGER NOT NULL,
    `status` ENUM('draft', 'active', 'locked', 'archived') NOT NULL DEFAULT 'draft',
    `nama_user_snapshot` VARCHAR(255) NULL,
    `jabatan_snapshot` VARCHAR(255) NULL,
    `location_snapshot` VARCHAR(255) NULL,
    `created_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` DATETIME(0) NOT NULL,
    `deleted_at` DATETIME(0) NULL,

    INDEX `kpi_plan_id_user_idx`(`id_user`),
    INDEX `kpi_plan_id_jabatan_tahun_idx`(`id_jabatan`, `tahun`),
    INDEX `kpi_plan_id_location_tahun_idx`(`id_location`, `tahun`),
    INDEX `kpi_plan_tahun_status_idx`(`tahun`, `status`),
    UNIQUE INDEX `kpi_plan_id_user_tahun_key`(`id_user`, `tahun`),
    PRIMARY KEY (`id_kpi_plan`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `kpi_plan_item` (
    `id_kpi_plan_item` CHAR(36) NOT NULL,
    `id_kpi_plan` CHAR(36) NOT NULL,
    `id_kpi` CHAR(36) NOT NULL,
    `urutan` INTEGER NOT NULL DEFAULT 0,
    `nama_kpi_snapshot` VARCHAR(255) NOT NULL,
    `satuan_snapshot` VARCHAR(100) NULL,
    `target_tahunan` DECIMAL(18, 2) NOT NULL,
    `created_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` DATETIME(0) NOT NULL,
    `deleted_at` DATETIME(0) NULL,

    INDEX `kpi_plan_item_id_kpi_plan_idx`(`id_kpi_plan`),
    INDEX `kpi_plan_item_id_kpi_idx`(`id_kpi`),
    INDEX `kpi_plan_item_id_kpi_plan_urutan_idx`(`id_kpi_plan`, `urutan`),
    UNIQUE INDEX `kpi_plan_item_id_kpi_plan_id_kpi_key`(`id_kpi_plan`, `id_kpi`),
    PRIMARY KEY (`id_kpi_plan_item`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `kpi_plan_item_term` (
    `id_kpi_plan_term` CHAR(36) NOT NULL,
    `id_kpi_plan_item` CHAR(36) NOT NULL,
    `term` ENUM('term_1', 'term_2', 'term_3', 'term_4') NOT NULL,
    `target_term` DECIMAL(18, 2) NULL,
    `achievement` DECIMAL(18, 2) NULL,
    `catatan` LONGTEXT NULL,
    `created_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` DATETIME(0) NOT NULL,
    `deleted_at` DATETIME(0) NULL,

    INDEX `kpi_plan_item_term_id_kpi_plan_item_idx`(`id_kpi_plan_item`),
    UNIQUE INDEX `kpi_plan_item_term_id_kpi_plan_item_term_key`(`id_kpi_plan_item`, `term`),
    PRIMARY KEY (`id_kpi_plan_term`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `kpi_jabatan` ADD CONSTRAINT `kpi_jabatan_id_kpi_fkey` FOREIGN KEY (`id_kpi`) REFERENCES `kpi`(`id_kpi`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `kpi_jabatan` ADD CONSTRAINT `kpi_jabatan_id_jabatan_fkey` FOREIGN KEY (`id_jabatan`) REFERENCES `jabatan`(`id_jabatan`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `kpi_plan` ADD CONSTRAINT `kpi_plan_id_user_fkey` FOREIGN KEY (`id_user`) REFERENCES `user`(`id_user`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `kpi_plan` ADD CONSTRAINT `kpi_plan_id_jabatan_fkey` FOREIGN KEY (`id_jabatan`) REFERENCES `jabatan`(`id_jabatan`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `kpi_plan` ADD CONSTRAINT `kpi_plan_id_location_fkey` FOREIGN KEY (`id_location`) REFERENCES `location`(`id_location`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `kpi_plan_item` ADD CONSTRAINT `kpi_plan_item_id_kpi_plan_fkey` FOREIGN KEY (`id_kpi_plan`) REFERENCES `kpi_plan`(`id_kpi_plan`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `kpi_plan_item` ADD CONSTRAINT `kpi_plan_item_id_kpi_fkey` FOREIGN KEY (`id_kpi`) REFERENCES `kpi`(`id_kpi`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `kpi_plan_item_term` ADD CONSTRAINT `kpi_plan_item_term_id_kpi_plan_item_fkey` FOREIGN KEY (`id_kpi_plan_item`) REFERENCES `kpi_plan_item`(`id_kpi_plan_item`) ON DELETE CASCADE ON UPDATE CASCADE;
