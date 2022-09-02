DROP TABLE IF EXISTS `bacoo_cloud`.`tickets`;
CREATE TABLE `bacoo_cloud`.`tickets` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `ticket_no` varchar(32) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL COMMENT 'ticket no',
  `type` tinyint NOT NULL COMMENT '0:技术支持 1用户意向',
  `status` tinyint NOT NULL COMMENT '0 已提交 1 已回复 2已解决',
  `description` text CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL COMMENT '描述',
  `feedback` text CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL COMMENT '反馈',
  `deleted` int NOT NULL DEFAULT '0' COMMENT '1:deleted, 0:undeleted',
  `create_time` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `update_time` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uniq_ticket_no` (`ticket_no`,`type`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;


DROP TABLE IF EXISTS `bacoo_cloud`.`cid_blacklist`;
CREATE TABLE `bacoo_cloud`.`cid_blacklist` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `cid` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL COMMENT 'cid',
  `deleted` int NOT NULL DEFAULT '0' COMMENT '1:deleted, 0:undeleted',
  `create_time` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `update_time` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uniq_cid` (`cid`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;