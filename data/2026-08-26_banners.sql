-- Hero banners / slides
CREATE TABLE IF NOT EXISTS banners (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  titulo VARCHAR(255) NOT NULL DEFAULT '',
  subtitulo TEXT NULL,
  imagen_url VARCHAR(500) NOT NULL DEFAULT '',
  texto_btn_1 VARCHAR(120) NOT NULL DEFAULT '',
  link_btn_1 VARCHAR(500) NOT NULL DEFAULT '',
  texto_btn_2 VARCHAR(120) NOT NULL DEFAULT '',
  link_btn_2 VARCHAR(500) NOT NULL DEFAULT '',
  orden INT NOT NULL DEFAULT 0,
  activo TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_banners_orden (orden, activo)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO banners (titulo, subtitulo, imagen_url, texto_btn_1, link_btn_1, texto_btn_2, link_btn_2, orden, activo)
SELECT * FROM (
  SELECT
    'Soluciones industriales para optimizar tu línea de producción' AS titulo,
    'Secado · Soplado · Limpieza · Packaging · Fin de línea. Tecnología especializada, ingeniería y soporte técnico local en Chile.' AS subtitulo,
    'img/hero/line.jpg' AS imagen_url,
    'Pedir Cotización' AS texto_btn_1,
    'contacto.html' AS link_btn_1,
    'Evaluar Mi Aplicación' AS texto_btn_2,
    'catalogo.html?tipo=equipo' AS link_btn_2,
    10 AS orden,
    1 AS activo
  UNION ALL SELECT
    'Tecnología especializada para plantas en Chile',
    'Secado, soplado y fin de línea con soporte técnico local. Representantes Sonic Air Systems.',
    'img/hero/3piece_cans.jpg',
    'Pedir Cotización',
    'contacto.html',
    'Ver Catálogo',
    'catalogo.html?tipo=equipo',
    20,
    1
) AS seed
WHERE NOT EXISTS (SELECT 1 FROM banners LIMIT 1);
