-- Migration: products.tipo (equipo | repuesto)
-- Tabla real en el proyecto: `products` (equivalente a "productos").
-- Safe to re-run: checks information_schema before ALTER.

-- MySQL 5.7+/MariaDB compatible one-shot (run via tools/migrate_products_tipo.php):
-- ALTER TABLE `products`
--   ADD COLUMN `tipo` ENUM('equipo', 'repuesto') NOT NULL DEFAULT 'equipo'
--   AFTER `sale_mode`;

-- Backfill sugerido tras el ALTER:
-- UPDATE `products` SET `tipo` = 'repuesto' WHERE `sale_mode` = 'buy';
-- UPDATE `products` SET `tipo` = 'equipo'   WHERE `sale_mode` = 'quote';
