-- Sectores donde trabajamos (home)
CREATE TABLE IF NOT EXISTS sectores (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  nombre VARCHAR(150) NOT NULL,
  slug VARCHAR(80) NOT NULL,
  imagen_url VARCHAR(500) NOT NULL DEFAULT '',
  link_url VARCHAR(500) NOT NULL DEFAULT '',
  orden INT NOT NULL DEFAULT 0,
  activo TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_sectores_slug (slug),
  KEY idx_sectores_orden (orden, activo)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO sectores (nombre, slug, imagen_url, link_url, orden, activo)
SELECT * FROM (
  SELECT 'Alimentos y bebidas' AS nombre, 'alimentos-bebidas' AS slug,
         'img/hero/cans.jpg' AS imagen_url, 'catalogo.html?category=secado' AS link_url,
         10 AS orden, 1 AS activo
  UNION ALL SELECT 'Packaging y fin de línea', 'packaging-fin-de-linea',
         'img/hero/line.jpg', 'catalogo.html?category=packaging', 20, 1
  UNION ALL SELECT 'Farmacéutica y salas limpias', 'farmaceutica-salas-limpias',
         'img/hero/plant.jpg', 'catalogo.html?category=limpieza', 30, 1
  UNION ALL SELECT 'Mantención y repuestos', 'mantencion-repuestos',
         'img/products/A07-10015.jpg', 'repuestos.html', 40, 1
) AS seed
WHERE NOT EXISTS (SELECT 1 FROM sectores LIMIT 1);
