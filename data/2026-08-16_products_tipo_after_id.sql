-- Reposition products.tipo AFTER id (tabla real: products).
-- Safe via tools/migrate_products_tipo_position.php
-- or site/api/_migrate_products_tipo_pos_once.php (one-shot).

ALTER TABLE `products`
  MODIFY COLUMN `tipo` ENUM('equipo', 'repuesto') NOT NULL DEFAULT 'equipo' AFTER `id`;
