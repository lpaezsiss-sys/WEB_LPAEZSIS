-- Migration: industrias + products.industria_id
-- Tabla real de ítems: `products` (equivalente a "productos").

CREATE TABLE IF NOT EXISTS `industrias` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `slug` VARCHAR(50) NOT NULL,
  `nombre` VARCHAR(100) NOT NULL,
  `activo` TINYINT(1) NOT NULL DEFAULT 1,
  `orden` INT NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_industrias_slug` (`slug`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Relación en products (si no existe):
-- ALTER TABLE `products`
--   ADD COLUMN `industria_id` INT UNSIGNED NULL AFTER `tipo` -- o AFTER category_id si tipo ya está;
-- En staging tipo está AFTER id, así que industria_id va AFTER tipo:
-- ALTER TABLE `products`
--   ADD COLUMN `industria_id` INT UNSIGNED NULL AFTER `category_id`,
--   ADD CONSTRAINT `fk_products_industria`
--     FOREIGN KEY (`industria_id`) REFERENCES `industrias`(`id`) ON DELETE SET NULL;

-- Seed sugerido (home "Sectores donde trabajamos"):
-- INSERT IGNORE INTO `industrias` (`slug`, `nombre`, `activo`, `orden`) VALUES
--   ('alimentos-bebidas', 'Alimentos y bebidas', 1, 10),
--   ('packaging-fin-de-linea', 'Packaging y fin de línea', 1, 20),
--   ('farmaceutica-salas-limpias', 'Farmacéutica y salas limpias', 1, 30),
--   ('mantencion-repuestos', 'Mantención y repuestos', 1, 40);
