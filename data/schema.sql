-- Schema reference — LPAEZsis
-- Tabla real de ítems: `products` (a veces referida como "productos").

-- Diferenciación Equipo vs Repuesto:
-- ALTER TABLE `products`
--   ADD COLUMN `tipo` ENUM('equipo', 'repuesto') NOT NULL DEFAULT 'equipo' AFTER `id`;
-- (Si la columna ya existe en otra posición:)
-- ALTER TABLE `products`
--   MODIFY COLUMN `tipo` ENUM('equipo', 'repuesto') NOT NULL DEFAULT 'equipo' AFTER `id`;

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
