CREATE TABLE `bacoo_cloud`.`download_record`  (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `cid` varchar(64) NOT NULL,
  `user_id` int NOT NULL,
  `request_host` text NOT NULL,
  `create_time` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_download_record_cid`(`cid`) USING BTREE,
  CONSTRAINT `fk_download_record_user_id` FOREIGN KEY (`user_id`) REFERENCES `bacoo_cloud`.`user` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT
);
