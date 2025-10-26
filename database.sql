CREATE TABLE IF NOT EXISTS `charges` (
  `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(255) NOT NULL UNIQUE,
  `charge_type` VARCHAR(255) NOT NULL DEFAULT 'custom' COMMENT 'tax, service_charge, delivery_fee, discount, gratuity, custom, etc',
  `rate_value` DECIMAL(10,2) NOT NULL COMMENT 'Default percentage or fixed amount',
  `rate_type` VARCHAR(255) NOT NULL DEFAULT 'fixed' COMMENT 'percentage or fixed',
  `description` TEXT NULL,
  `is_active` TINYINT(1) NOT NULL DEFAULT 1,
  `is_default` TINYINT(1) NOT NULL DEFAULT 0 COMMENT 'Auto-apply this charge to all sales',
  `created_at` TIMESTAMP NULL DEFAULT NULL,
  `updated_at` TIMESTAMP NULL DEFAULT NULL,
  INDEX `charges_charge_type_index` (`charge_type`),
  INDEX `charges_is_active_index` (`is_active`),
  INDEX `charges_is_default_index` (`is_default`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

ALTER TABLE `sale_items`
  ADD COLUMN `item_type` VARCHAR(255) NOT NULL DEFAULT 'product' COMMENT 'product or charge' AFTER `id`,
  ADD COLUMN `charge_id` BIGINT UNSIGNED NULL COMMENT 'Reference to charges table' AFTER `item_type`,
  ADD COLUMN `charge_type` VARCHAR(255) NULL COMMENT 'tax, service_charge, delivery_fee, discount, gratuity, custom' AFTER `charge_id`,
  ADD COLUMN `rate_value` DECIMAL(10,2) NULL COMMENT 'Percentage or fixed amount value' AFTER `charge_type`,
  ADD COLUMN `rate_type` VARCHAR(255) NULL COMMENT 'percentage or fixed' AFTER `rate_value`,
  ADD COLUMN `base_amount` DECIMAL(12,2) NULL COMMENT 'Amount this charge is calculated on' AFTER `rate_type`,
  ADD COLUMN `notes` TEXT NULL AFTER `base_amount`,
  ADD INDEX `sale_items_item_type_index` (`item_type`),
  ADD INDEX `sale_items_charge_type_index` (`charge_type`),
  ADD CONSTRAINT `sale_items_charge_id_foreign` FOREIGN KEY (`charge_id`) REFERENCES `charges` (`id`) ON DELETE SET NULL;

ALTER TABLE `sales`
  ADD COLUMN `total_charge_amount` DECIMAL(12,2) NOT NULL DEFAULT 0 COMMENT 'Sum of all charges (taxes, fees, etc)' AFTER `total_amount`,
  ADD INDEX `sales_total_charge_amount_index` (`total_charge_amount`);