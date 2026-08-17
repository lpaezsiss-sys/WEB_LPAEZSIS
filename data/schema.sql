-- Schema reference — LPAEZsis
-- Tabla real de ítems: `products` (a veces referida como "productos").

-- Diferenciación Equipo vs Repuesto:
-- ALTER TABLE `products`
--   ADD COLUMN `tipo` ENUM('equipo', 'repuesto') NOT NULL DEFAULT 'equipo' AFTER `id`;
-- (Si la columna ya existe en otra posición:)
-- ALTER TABLE `products`
--   MODIFY COLUMN `tipo` ENUM('equipo', 'repuesto') NOT NULL DEFAULT 'equipo' AFTER `id`;

-- Industrias (sectores de portada / filtro):
CREATE TABLE IF NOT EXISTS `industrias` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `slug` VARCHAR(50) NOT NULL,
  `nombre` VARCHAR(100) NOT NULL,
  `activo` TINYINT(1) NOT NULL DEFAULT 1,
  `orden` INT NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_industrias_slug` (`slug`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Relación en products:
-- ALTER TABLE `products`
--   ADD COLUMN `industria_id` INT UNSIGNED NULL AFTER `category_id`,
--   ADD CONSTRAINT `fk_products_industria`
--     FOREIGN KEY (`industria_id`) REFERENCES `industrias`(`id`) ON DELETE SET NULL;

CREATE TABLE IF NOT EXISTS `soluciones` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `slug` VARCHAR(50) NOT NULL UNIQUE,
  `titulo` VARCHAR(150) NOT NULL,
  `bullet_1` VARCHAR(255) DEFAULT NULL,
  `bullet_2` VARCHAR(255) DEFAULT NULL,
  `bullet_3` VARCHAR(255) DEFAULT NULL,
  `cta_texto` VARCHAR(100) DEFAULT NULL,
  `cta_url` VARCHAR(255) DEFAULT NULL,
  `imagen_url` VARCHAR(255) DEFAULT NULL,
  `orden` INT DEFAULT 0,
  `activo` TINYINT(1) DEFAULT 1,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
