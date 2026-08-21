-- LYC brand refresh + conveyor systems quote product
UPDATE `brands`
SET
  `name` = 'LYC',
  `description` = 'Ingeniería, diseño, fabricación, montaje y mantenimiento de cintas transportadoras y sistemas de transporte para líneas de envasado.',
  `logo_url` = '/img/brand/lyc.png',
  `content_html` = '<section class="brand-section"><h3>LYC</h3><p><strong>Logistics &amp; Conveyors (L&amp;C Ltda.)</strong></p><p>Ingeniería, diseño, fabricación, montaje y mantenimiento de cintas transportadoras y sistemas de transporte para líneas de envasado.</p></section><section class="brand-section"><h3>Ingeniería y fabricación</h3><p>Más de 20 años de experiencia en el área industrial. Diseños bajo estándar europeo en 2D y 3D, construidos en acero inoxidable AISI 304/316 con integración de componentes de primer nivel (Movex, System Plast, Interroll, Intralox).</p></section>',
  `sort_order` = 20,
  `is_active` = 1
WHERE `slug` = 'lyc';

INSERT INTO `categories` (
  `slug`, `name`, `description`, `seo_title`, `seo_description`, `sort_order`, `is_active`
)
SELECT
  'transportadores-manejo-materiales',
  'Transportadores y Manejo de Materiales / Soluciones de Envasado',
  'Cintas y sistemas transportadores para envases, cajas y pallets en líneas de envasado estándar o asépticas.',
  'Transportadores industriales LYC | LPAEZsis',
  'Fabricación e integración de cintas y sistemas transportadores LYC en acero inoxidable para líneas de envasado.',
  55, 1
WHERE NOT EXISTS (
  SELECT 1 FROM `categories` WHERE `slug` = 'transportadores-manejo-materiales'
);

INSERT INTO `products` (
  `category_id`, `brand_id`, `slug`, `name`, `description`, `sale_mode`, `stock_status`,
  `price_clp`, `image_url`, `is_featured`, `is_active`, `seo_title`, `seo_description`, `sort_order`
)
SELECT c.id, b.id,
  'fabricacion-e-integracion-de-cintas-y-sistemas-transportadores-lyc',
  'Fabricación e Integración de Cintas y Sistemas Transportadores LYC',
  'Diseño y fabricación modular de transportadores industriales adaptados a la estabilidad, cuidado y protección del producto (envases, cajas y pallets). Construidos en estructuras robustas de acero inoxidable AISI 304/316 con acabados 2B o esmerilado. Incluye soluciones de etiquetado, giro, detención y acumulación con motricidad por cadenas o rodillos motorizados, además de servicios de montaje, traslado de líneas y mantenimiento preventivo.\n\nEspecificaciones técnicas:\n• Materiales: Acero Inoxidable AISI 304 / 316 (Acabado 2B / Esmerilado)\n• Estándar de Diseño: Modular y escalable con dimensiones de diseño europeo (2D/3D)\n• Tipos de Transportadores: Banda modular, cadenas de tablillas, rodillos y cadenas de arrastre\n• Integración de Componentes: Movex, System Plast, Interroll, Intralox (EE. UU., Italia, Alemania)\n• Aplicaciones: Envases, cajas, frascos, latas y pallets (líneas estándar y áreas asépticas)\n\nFicha técnica: /img/fichas/PRESENTACION_L&C_Ltda_Tx.pdf',
  'quote', 'on_request', NULL, '/img/productos/lyc-transportadores.jpg', 1, 1,
  'Fabricación e Integración de Cintas y Sistemas Transportadores LYC | Cotizar LPAEZsis',
  'Sistemas de transporte industrial a la medida (unilineales, acumulación, elevadores, banda modular, cadenas y pallets) diseñados para áreas estándar o asépticas.',
  12
FROM `categories` c
JOIN `brands` b ON b.slug = 'lyc'
WHERE c.slug = 'transportadores-manejo-materiales'
  AND NOT EXISTS (
    SELECT 1 FROM `products` p
    WHERE p.slug = 'fabricacion-e-integracion-de-cintas-y-sistemas-transportadores-lyc'
  );

UPDATE `products`
SET `image_url` = '/img/productos/lyc-transportadores.jpg',
    `sale_mode` = 'quote',
    `stock_status` = 'on_request',
    `price_clp` = NULL,
    `is_featured` = 1,
    `is_active` = 1
WHERE `slug` = 'fabricacion-e-integracion-de-cintas-y-sistemas-transportadores-lyc';
