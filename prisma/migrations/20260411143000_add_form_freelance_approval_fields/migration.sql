ALTER TABLE `form_freelance`
  ADD COLUMN `decision` ENUM('disetujui', 'ditolak', 'pending') NOT NULL DEFAULT 'pending' AFTER `todo_list`,
  ADD COLUMN `approver_user_id` CHAR(36) NULL AFTER `decision`,
  ADD COLUMN `approver_role` ENUM('KARYAWAN', 'HR', 'OPERASIONAL', 'DIREKTUR', 'SUPERADMIN', 'SUBADMIN', 'SUPERVISI') NULL AFTER `approver_user_id`,
  ADD COLUMN `decided_at` DATETIME(0) NULL AFTER `approver_role`,
  ADD COLUMN `note` LONGTEXT NULL AFTER `decided_at`;

CREATE INDEX `form_freelance_approver_user_id_idx` ON `form_freelance`(`approver_user_id`);

ALTER TABLE `form_freelance`
  ADD CONSTRAINT `form_freelance_approver_user_id_fkey`
  FOREIGN KEY (`approver_user_id`) REFERENCES `user`(`id_user`)
  ON DELETE RESTRICT
  ON UPDATE CASCADE;
