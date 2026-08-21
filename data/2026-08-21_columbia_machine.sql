-- Columbia Machine / Columbia-Okura catalog (idempotent by slug)
-- Import in phpMyAdmin or: mysql … < data/2026-08-21_columbia_machine.sql

INSERT INTO `brands` (`slug`, `name`, `description`, `logo_url`, `website_url`, `content_html`, `sort_order`, `is_active`)
SELECT
  'columbia-machine',
  'Columbia Machine',
  'Líder global en soluciones de automatización de embalaje, especializado en paletizadores convencionales de alto rendimiento y celdas robóticas de paletizado para diversas industrias.',
  '/img/brand/columbia-machine.png',
  'https://palletizing.com/',
  '<section class="brand-section"><h3>Columbia Machine</h3><p>Líder global en soluciones de automatización de embalaje, especializado en paletizadores convencionales de alto rendimiento y celdas robóticas de paletizado para diversas industrias.</p><p>LPAEZsis representa en Chile la línea de paletizado Columbia Machine y su división de paletizado robótico <strong>Columbia-Okura LLC</strong>.</p></section><section class="brand-section"><h3>Columbia-Okura LLC</h3><p>División de paletizado robótico de Columbia Machine: celdas articuladas de 4 ejes, cabezales adaptables y operación multilínea para sacos, cajas, charolas y baldes.</p></section>',
  15,
  1
WHERE NOT EXISTS (SELECT 1 FROM `brands` WHERE `slug` = 'columbia-machine');

INSERT INTO `categories` (`slug`, `name`, `description`, `seo_title`, `seo_description`, `sort_order`, `is_active`)
SELECT 'paletizado-convencional', 'Paletizado Convencional / Final de Línea', 'Paletizadores convencionales a nivel de piso para final de línea.', 'Paletizado convencional Columbia | LPAEZsis', 'Paletizadores de nivel inferior Columbia Machine para cajas, charolas y paquetes.', 70, 1
WHERE NOT EXISTS (SELECT 1 FROM `categories` WHERE `slug` = 'paletizado-convencional');

INSERT INTO `categories` (`slug`, `name`, `description`, `seo_title`, `seo_description`, `sort_order`, `is_active`)
SELECT 'paletizado-alta-velocidad', 'Paletizado de Alta Velocidad / Final de Línea', 'Paletizadores de alto nivel y alta cadencia para líneas masivas.', 'Paletizado de alta velocidad Columbia | LPAEZsis', 'Paletizadores Columbia de alto nivel hasta 120 CPM para embotellado y consumo masivo.', 71, 1
WHERE NOT EXISTS (SELECT 1 FROM `categories` WHERE `slug` = 'paletizado-alta-velocidad');

INSERT INTO `categories` (`slug`, `name`, `description`, `seo_title`, `seo_description`, `sort_order`, `is_active`)
SELECT 'paletizado-robotico', 'Paletizado Robótico / Células de Automatización', 'Celdas robóticas Columbia-Okura para paletizado flexible.', 'Paletizado robótico Columbia-Okura | LPAEZsis', 'Celdas de paletizado robótico Columbia-Okura Ai1800 para sacos, cajas y baldes.', 72, 1
WHERE NOT EXISTS (SELECT 1 FROM `categories` WHERE `slug` = 'paletizado-robotico');

INSERT INTO `categories` (`slug`, `name`, `description`, `seo_title`, `seo_description`, `sort_order`, `is_active`)
SELECT 'paletizado-integrado', 'Paletizado Integrado / Soluciones Compactas', 'Sistemas compactos que integran paletizado y envoltura stretch wrap.', 'Paletizado compacto con envolvedora | LPAEZsis', 'Paletizador Columbia FL1000-SW con envolvedora integrada y menor footprint.', 73, 1
WHERE NOT EXISTS (SELECT 1 FROM `categories` WHERE `slug` = 'paletizado-integrado');

INSERT INTO `products` (
  `category_id`, `brand_id`, `slug`, `name`, `description`, `sale_mode`, `stock_status`,
  `price_clp`, `image_url`, `is_featured`, `is_active`, `seo_title`, `seo_description`, `sort_order`
)
SELECT c.id, b.id,
  'paletizador-nivel-inferior-columbia-fl3000',
  'Paletizador de Nivel Inferior Columbia FL3000',
  'El Columbia FL3000 resuelve los cuellos de botella en el final de línea permitiendo un paletizado continuo a nivel de piso. Su diseño ergonómico facilita la inspección y mantenimiento sin necesidad de plataformas elevadas, optimizando el flujo de embalaje y garantizando patrones de estibado estables.\n\nEspecificaciones técnicas:\n• Velocidad: 30 a 40 CPM (Cajas/Paquetes por minuto)\n• Nivel de Entrada: Nivel de Piso (Floor Level)\n• Tipos de Empaque: Cajas de cartón, charolas (trays) y paquetes envueltos\n• Control: HMI Táctil intuitivo\n\nFicha técnica: /img/fichas/ficha_tecnica_fl3000_columbia.pdf',
  'quote', 'on_request', NULL, '/img/productos/fl3000.jpg', 1, 1,
  'Paletizador de Nivel Inferior Columbia FL3000 | Cotizar LPAEZsis',
  'Paletizador automático a nivel de piso de velocidad media-alta (30-40 CPM), diseñado para el manejo seguro y eficiente de cajas, charolas y paquetes.',
  6
FROM `categories` c
JOIN `brands` b ON b.slug = 'columbia-machine'
WHERE c.slug = 'paletizado-convencional'
  AND NOT EXISTS (SELECT 1 FROM `products` p WHERE p.slug = 'paletizador-nivel-inferior-columbia-fl3000');

INSERT INTO `products` (
  `category_id`, `brand_id`, `slug`, `name`, `description`, `sale_mode`, `stock_status`,
  `price_clp`, `image_url`, `is_featured`, `is_active`, `seo_title`, `seo_description`, `sort_order`
)
SELECT c.id, b.id,
  'paletizador-alto-nivel-columbia-hl7200',
  'Paletizador de Alto Nivel Columbia HL7200',
  'Diseñado para plantas de producción masiva con altos volúmenes de salida, el HL7200 recibe el producto desde líneas elevadas para formar pallets a velocidades de hasta 120 cajas por minuto. Maximiza la eficiencia operativa, reduce los tiempos de parada y garantiza un manejo ultra suave de productos.\n\nEspecificaciones técnicas:\n• Velocidad: Hasta 120 CPM\n• Nivel de Entrada: Alto Nivel (High Level)\n• Patrones: Formación multipatrón electrónica programable\n• Aplicaciones: Embotellado, enlatado, alimentos y consumo masivo\n\nFicha técnica: /img/fichas/ficha_tecnica_hl7200_columbia.pdf',
  'quote', 'on_request', NULL, '/img/productos/hl7200.jpg', 1, 1,
  'Paletizador de Alto Nivel Columbia HL7200 | Cotizar LPAEZsis',
  'Paletizador de alta velocidad (hasta 120 CPM) de entrada superior, ideal para líneas masivas de embotellado, alimentos y consumo masivo.',
  7
FROM `categories` c
JOIN `brands` b ON b.slug = 'columbia-machine'
WHERE c.slug = 'paletizado-alta-velocidad'
  AND NOT EXISTS (SELECT 1 FROM `products` p WHERE p.slug = 'paletizador-alto-nivel-columbia-hl7200');

INSERT INTO `products` (
  `category_id`, `brand_id`, `slug`, `name`, `description`, `sale_mode`, `stock_status`,
  `price_clp`, `image_url`, `is_featured`, `is_active`, `seo_title`, `seo_description`, `sort_order`
)
SELECT c.id, b.id,
  'celda-paletizado-robotico-columbia-ai1800',
  'Celda de Paletizado Robótico Columbia-Okura Ai1800',
  'Desarrollado bajo la alianza Columbia-Okura, el robot Ai1800 resuelve los desafíos de empaques complejos y variables en planta. Su brazo articulado de diseño propio permite manipular simultáneamente sacos, baldes, cajas o atados con mínima ocupación de espacio y máxima adaptabilidad.\n\nEspecificaciones técnicas:\n• Rendimiento: > 20 cajas/min o hasta 20 sacos/min\n• Tipos de Carga: Sacos, Cajas, Charolas, Baldes (Pails)\n• Arquitectura: Robot articulado de 4 ejes dedicado a paletizado\n• Configuración: Celda multilínea con cabezal/gripper adaptable\n\nFicha técnica: /img/fichas/ficha_tecnica_ai1800_columbia.pdf',
  'quote', 'on_request', NULL, '/img/productos/ai1800.jpg', 1, 1,
  'Celda de Paletizado Robótico Columbia-Okura Ai1800 | Cotizar LPAEZsis',
  'Robot industrial de paletizado de alta precisión para el manejo versátil de sacos, cajas, baldes y múltiples líneas simultáneas.',
  8
FROM `categories` c
JOIN `brands` b ON b.slug = 'columbia-machine'
WHERE c.slug = 'paletizado-robotico'
  AND NOT EXISTS (SELECT 1 FROM `products` p WHERE p.slug = 'celda-paletizado-robotico-columbia-ai1800');

INSERT INTO `products` (
  `category_id`, `brand_id`, `slug`, `name`, `description`, `sale_mode`, `stock_status`,
  `price_clp`, `image_url`, `is_featured`, `is_active`, `seo_title`, `seo_description`, `sort_order`
)
SELECT c.id, b.id,
  'paletizador-compacto-envolvedora-columbia-fl1000sw',
  'Paletizador Compacto con Envolvedora Integrada Columbia FL1000-SW',
  'El FL1000-SW combina en una sola máquina el apilado y el emplayado del pallet. Elimina transportadores de conexión adicionales, ahorra hasta un 40% de espacio en planta y entrega tarimas completamente aseguradas y listas para su almacenamiento.\n\nEspecificaciones técnicas:\n• Velocidad: Hasta 20 CPM\n• Integración: Paletizador a nivel de piso + Envolvedora Stretch Wrap\n• Ahorro de espacio: Reducción de footprint de hasta un 40%\n\nFicha técnica: /img/fichas/ficha_tecnica_fl1000sw_columbia.pdf',
  'quote', 'on_request', NULL, '/img/productos/fl1000sw.jpg', 1, 1,
  'Paletizador Compacto con Envolvedora Integrada Columbia FL1000-SW | Cotizar LPAEZsis',
  'Sistema híbrido que integra paletizado automático a nivel de piso y envoltura con película estirable (Stretch Wrap) en una sola huella reducida.',
  9
FROM `categories` c
JOIN `brands` b ON b.slug = 'columbia-machine'
WHERE c.slug = 'paletizado-integrado'
  AND NOT EXISTS (SELECT 1 FROM `products` p WHERE p.slug = 'paletizador-compacto-envolvedora-columbia-fl1000sw');

UPDATE `products` SET `image_url` = '/img/productos/fl3000.jpg' WHERE `slug` = 'paletizador-nivel-inferior-columbia-fl3000';
UPDATE `products` SET `image_url` = '/img/productos/hl7200.jpg' WHERE `slug` = 'paletizador-alto-nivel-columbia-hl7200';
UPDATE `products` SET `image_url` = '/img/productos/ai1800.jpg' WHERE `slug` = 'celda-paletizado-robotico-columbia-ai1800';
UPDATE `products` SET `image_url` = '/img/productos/fl1000sw.jpg' WHERE `slug` = 'paletizador-compacto-envolvedora-columbia-fl1000sw';
