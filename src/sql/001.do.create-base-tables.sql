DROP TABLE IF EXISTS `bacoo_cloud`.`user`;
CREATE TABLE `bacoo_cloud`.`user`  (
  `id` int NOT NULL AUTO_INCREMENT,
  `nick_name` varchar(32) NULL,
  `mobile` varchar(32) NULL,
  `email` varchar(128) NULL,
  `password` varchar(64) NOT NULL,
  `role` tinyint NOT NULL DEFAULT 0 COMMENT '0: user, 1: admin',
  `create_time` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `update_time` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uniq_user_nick_name` (`nick_name`) USING BTREE,
  UNIQUE INDEX `uniq_user_mobile`(`mobile`) USING BTREE,
  UNIQUE INDEX `uniq_user_email`(`email`) USING BTREE,
  INDEX `idx_user_role`(`role`) USING BTREE
) COMMENT = 'User';

DROP TABLE IF EXISTS `bacoo_cloud`.`user_api_key`;
CREATE TABLE `user_api_key` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `valid` tinyint NOT NULL DEFAULT '0' COMMENT '0: valid, 1: invalid',
  `seed` varchar(128) COLLATE utf8mb4_general_ci NOT NULL COMMENT 'chain user seed(base64)',
  `signature` varchar(300) COLLATE utf8mb4_general_ci NOT NULL COMMENT 'base64(substrate-address:sign(address))',
  `address` varchar(50) COLLATE utf8mb4_general_ci NOT NULL COMMENT 'chain user address',
  `create_time` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `update_time` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uniq_user_api_key_address` (`address`) USING BTREE,
  KEY `fk_user_api_key_user_id` (`user_id`),
  CONSTRAINT `fk_user_api_key_user_id` FOREIGN KEY (`user_id`) REFERENCES `user` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT
) COMMENT='User api key';

DROP TABLE IF EXISTS `bacoo_cloud`.`billing_plan`;
CREATE TABLE `bacoo_cloud`.`billing_plan`  (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `used_storage_size` bigint NOT NULL DEFAULT 0,
  `max_storage_size` bigint NOT NULL,
  `storage_expire_time` timestamp NOT NULL,
  `used_download_size` bigint NOT NULL DEFAULT 0,
  `max_download_size` bigint NOT NULL,
  `download_expire_time` timestamp NOT NULL,
  `create_time` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `update_time` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE INDEX `uniq_billing_plan_user_id`(`user_id`) USING BTREE,
  CONSTRAINT `fk_billing_plan_user_id` FOREIGN KEY (`user_id`) REFERENCES `bacoo_cloud`.`user` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT
) COMMENT = 'Billing plan for api key';

DROP TABLE IF EXISTS `bacoo_cloud`.`billing_order`;
CREATE TABLE `bacoo_cloud`.`billing_order`  (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `storage_size` bigint NOT NULL DEFAULT 0,
  `download_size` bigint NOT NULL DEFAULT 0,
  `expire_time` timestamp NOT NULL,
  `order_type` tinyint NOT NULL DEFAULT 0 COMMENT 'free: 0, premium: 1',
  `create_time` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `update_time` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_billing_order_order_type`(`order_type`) USING BTREE,
  CONSTRAINT `fk_billing_order_user_id` FOREIGN KEY (`user_id`) REFERENCES `bacoo_cloud`.`user` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT
) COMMENT = 'Billing order for api key';

DROP TABLE IF EXISTS `bacoo_cloud`.`pin_file`;
CREATE TABLE `pin_file` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `cid` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
  `pin_status` tinyint NOT NULL DEFAULT '0' COMMENT '0: queued, 1: pinning, 2: pinned, 3: failed',
  `retry_times` tinyint NOT NULL DEFAULT '0' COMMENT 'retry times',
  `file_size` bigint NOT NULL DEFAULT '0',
  `calculated_at` bigint NOT NULL DEFAULT '0',
  `expired_at` bigint NOT NULL DEFAULT '0',
  `replica_count` int NOT NULL DEFAULT '0',
  `block_hash` varchar(128) NULL,
  `transaction_hash` varchar(128) NULL,
  `file_info` json NULL,
  `deleted` tinyint NOT NULL DEFAULT '0' COMMENT '0: undeleted, 1: deleted',
  `create_time` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `update_time` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uniq_pin_file_cid` (`cid`) USING BTREE,
  KEY `idx_pin_file_deleted_pin_status` (`deleted`,`pin_status`,`expired_at`) USING BTREE
) COMMENT = 'Pin files';

DROP TABLE IF EXISTS `bacoo_cloud`.`pin_object`;
CREATE TABLE `pin_object` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `name` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL COMMENT 'name default:cid',
  `request_id` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL COMMENT 'request_id',
  `user_id` int NOT NULL COMMENT 'user.id',
  `cid` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL COMMENT 'ipfs cid',
  `info` json DEFAULT NULL COMMENT 'info',
  `meta` json DEFAULT NULL COMMENT 'meta',
  `delegates` text CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci COMMENT 'delegates (join with ,)',
  `origins` text CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci COMMENT 'origins (join with ,)',
  `deleted` int NOT NULL DEFAULT '0' COMMENT '1:deleted, 0:undeleted',
  `create_time` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'create time',
  `update_time` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'update time',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uniq_pin_object_request_id` (`request_id`) USING BTREE,
  UNIQUE KEY `uniq_pin_object_user_id_cid` (`user_id`,`cid`) USING BTREE,
  KEY `idx_pin_object_cid_deleted` (`cid`,`deleted`) USING BTREE,
  CONSTRAINT `fk_pin_object_user_id` FOREIGN KEY (`user_id`) REFERENCES `user` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT
) COMMENT = 'Pin object for api key';

DROP TABLE IF EXISTS `bacoo_cloud`.`config`;
CREATE TABLE `config` (
  `id` int NOT NULL AUTO_INCREMENT,
  `config_key` varchar(64) COLLATE utf8mb4_general_ci NOT NULL,
  `config_value` varchar(255) COLLATE utf8mb4_general_ci NOT NULL,
  `create_time` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `update_time` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uniq_configs_key` (`config_key`) USING BTREE
);
