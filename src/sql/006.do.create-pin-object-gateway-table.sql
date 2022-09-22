DROP TABLE IF EXISTS `bacoo_cloud`.`pin_object_gateway`;
CREATE TABLE `bacoo_cloud`.`pin_object_gateway`  (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `pin_object_id` bigint NOT NULL,
  `gateway_id` int NOT NULL,
  `create_time` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `update_time` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE INDEX `uniq_pin_object_gateway_id`(`pin_object_id`) USING BTREE,
  CONSTRAINT `fk_pin_object_gateway_object_id` FOREIGN KEY (`pin_object_id`) REFERENCES `bacoo_cloud`.`pin_object` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT,
  CONSTRAINT `fk_pin_object_gateway_gateway_id` FOREIGN KEY (`gateway_id`) REFERENCES `bacoo_cloud`.`gateway` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT
);
