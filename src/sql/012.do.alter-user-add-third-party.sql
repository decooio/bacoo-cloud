ALTER TABLE `user`
ADD COLUMN `third_party` varchar(16) NOT NULL DEFAULT 'common' AFTER `role`,
ADD INDEX `idx_user_third_party`(`third_party`) USING BTREE;
