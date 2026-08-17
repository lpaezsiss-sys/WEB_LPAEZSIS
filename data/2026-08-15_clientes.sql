-- Migration: clientes (logos / confianza industrial)
-- Safe to re-run (IF NOT EXISTS)

CREATE TABLE IF NOT EXISTS `clientes` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `nombre` VARCHAR(150) NOT NULL,
  `logo_url` VARCHAR(255) NOT NULL,
  `orden` INT DEFAULT 0,
  `activo` TINYINT(1) DEFAULT 1,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
