DROP TABLE IF EXISTS `bacoo_cloud`.`intention`;
CREATE TABLE `bacoo_cloud`.`intention` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `storage_type` tinyint NOT NULL COMMENT '0 <10TB 1: 100TB 2: 1PB',
  `gateway_type` tinyint NOT NULL COMMENT '0 公共网关 1 专用网关',
  `requirement` text CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL COMMENT '需求',
  `deleted` int NOT NULL DEFAULT '0' COMMENT '1:deleted, 0:undeleted',
  `create_time` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `update_time` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;