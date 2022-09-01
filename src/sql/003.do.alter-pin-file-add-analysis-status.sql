ALTER TABLE `bacoo_cloud`.`pin_file`
ADD INDEX `idx_pin_file_deleted_analysis_status`(`analysis_status`, `deleted`) USING BTREE;
