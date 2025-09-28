ALTER TABLE `sales`
ADD COLUMN `sale_time` TIME NULL AFTER `sale_date`,
ADD INDEX `sales_sale_time_index` (`sale_time`);