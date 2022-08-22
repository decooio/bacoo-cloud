CREATE TABLE `gateway` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(64) COLLATE utf8mb4_general_ci NOT NULL,
  `host` varchar(255) COLLATE utf8mb4_general_ci NOT NULL,
  `node_type` tinyint NOT NULL DEFAULT '0' COMMENT '0: free, 1: premium',
  `valid` tinyint NOT NULL COMMENT '0: valid, 1: invalid',
  `http_password` varchar(64) COLLATE utf8mb4_general_ci NOT NULL COMMENT 'node call cloud API',
  `create_time` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `update_time` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
);

CREATE TABLE `gateway_user` (
  `id` int NOT NULL AUTO_INCREMENT,
  `gateway_id` int NOT NULL,
  `user_id` int NOT NULL,
  `create_time` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `update_time` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uniq_gateway_user_id` (`gateway_id`,`user_id`) USING BTREE,
  KEY `fk_gateway_user_user_id` (`user_id`),
  CONSTRAINT `fk_gateway_user_gateway_id` FOREIGN KEY (`gateway_id`) REFERENCES `gateway` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT,
  CONSTRAINT `fk_gateway_user_user_id` FOREIGN KEY (`user_id`) REFERENCES `user` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT
);
