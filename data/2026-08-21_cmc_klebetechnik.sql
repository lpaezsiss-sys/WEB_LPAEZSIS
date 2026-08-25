-- CMC Klebetechnik GmbH + CMC 10730 (idempotent by slug)
-- Requiere columnas SEO de brands (data/2026-08-21_brands_seo.sql o BrandSeo::ensureColumns).
-- Import: mysql … < data/2026-08-21_cmc_klebetechnik.sql
-- Live API: ADMIN_PASSWORD='…' python3 tools/import_cmc_catalog.py

INSERT INTO `brands` (
  `slug`, `name`, `description`, `logo_url`, `website_url`, `content_html`,
  `sort_order`, `is_active`,
  `subtitle`, `origin_country`, `short_description`, `long_description`,
  `seo_title`, `seo_description`, `seo_keywords`, `canonical_url`,
  `schema_json_ld`, `datasheet_url`
)
SELECT
  'cmc-klebetechnik',
  'CMC Klebetechnik GmbH',
  'Fabricante especialista en recubrimientos de películas, cintas adhesivas técnicas de alta precisión, piezas troqueladas y aislantes eléctricos para la industria global.',
  '/img/logo-cmc-klebetechnik.webp',
  'https://www.cmc.de/',
  '<section class="brand-section"><h3>CMC Klebetechnik GmbH</h3><p><strong>Cintas Adhesivas Técnicas y Aislantes Eléctricos</strong></p><p>CMC Klebetechnik GmbH (Frankenthal, Alemania) cuenta con certificaciones ISO 9001 e ISO 14001, cumpliendo con estándares UL, IEC, RoHS e IMDS. A través de LPAEZSIS, ponemos a disposición del mercado nacional la línea completa de cintas técnicas para aplicaciones eléctricas, electrónicas, automotrices y conversión de etiquetas (empalmes siliconados).</p></section>',
  25,
  1,
  'Cintas Adhesivas Técnicas y Aislantes Eléctricos',
  'Alemania',
  'Fabricante especialista en recubrimientos de películas, cintas adhesivas técnicas de alta precisión, piezas troqueladas y aislantes eléctricos para la industria global.',
  '<section class="brand-section"><h3>CMC Klebetechnik GmbH</h3><p><strong>Cintas Adhesivas Técnicas y Aislantes Eléctricos</strong></p><p>CMC Klebetechnik GmbH (Frankenthal, Alemania) cuenta con certificaciones ISO 9001 e ISO 14001, cumpliendo con estándares UL, IEC, RoHS e IMDS. A través de LPAEZSIS, ponemos a disposición del mercado nacional la línea completa de cintas técnicas para aplicaciones eléctricas, electrónicas, automotrices y conversión de etiquetas (empalmes siliconados).</p></section>',
  'CMC Klebetechnik Chile | Cintas Adhesivas Industriales - LPAEZSIS',
  'Distribución autorizada de cintas adhesivas técnicas CMC Klebetechnik en Chile. Soluciones para empalme de etiquetas siliconadas y aislamiento eléctrico.',
  'CMC Klebetechnik, cintas adhesivas industriales, empalme de etiquetas, release liner, aislantes electricos, CMC 10730, LPAEZSIS',
  '/marcas.html?slug=cmc-klebetechnik',
  '{
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Brand",
      "@id": "https://prueba1.lpaezsis.cl/marcas.html?slug=cmc-klebetechnik#brand",
      "name": "CMC Klebetechnik GmbH",
      "url": "https://prueba1.lpaezsis.cl/marcas.html?slug=cmc-klebetechnik",
      "description": "Distribución autorizada de cintas adhesivas técnicas CMC Klebetechnik en Chile. Soluciones para empalme de etiquetas siliconadas y aislamiento eléctrico.",
      "alternateName": "Cintas Adhesivas Técnicas y Aislantes Eléctricos",
      "slogan": "Cintas Adhesivas Técnicas y Aislantes Eléctricos",
      "logo": {
        "@type": "ImageObject",
        "url": "https://prueba1.lpaezsis.cl/img/logo-cmc-klebetechnik.webp"
      },
      "sameAs": [
        "https://www.cmc.de/"
      ],
      "additionalProperty": {
        "@type": "PropertyValue",
        "name": "País de origen",
        "value": "Alemania"
      }
    },
    {
      "@type": "Organization",
      "@id": "https://prueba1.lpaezsis.cl/#organization",
      "name": "LPAEZ SOLUCIONES INDUSTRIALES SPA",
      "alternateName": "LPAEZSIS",
      "url": "https://prueba1.lpaezsis.cl/",
      "logo": {
        "@type": "ImageObject",
        "url": "https://prueba1.lpaezsis.cl/img/brand/logo.png"
      },
      "brand": {
        "@id": "https://prueba1.lpaezsis.cl/marcas.html?slug=cmc-klebetechnik#brand"
      }
    }
  ]
}',
  '/img/fichas/Cinta_Doble_Contacto_Union_Etiquetas_Siliconadas_CMC_LPAEZSIS.pdf'
WHERE NOT EXISTS (
  SELECT 1 FROM `brands` WHERE `slug` = 'cmc-klebetechnik'
);

UPDATE `brands`
SET
  `name` = 'CMC Klebetechnik GmbH',
  `description` = 'Fabricante especialista en recubrimientos de películas, cintas adhesivas técnicas de alta precisión, piezas troqueladas y aislantes eléctricos para la industria global.',
  `logo_url` = '/img/logo-cmc-klebetechnik.webp',
  `website_url` = 'https://www.cmc.de/',
  `content_html` = '<section class="brand-section"><h3>CMC Klebetechnik GmbH</h3><p><strong>Cintas Adhesivas Técnicas y Aislantes Eléctricos</strong></p><p>CMC Klebetechnik GmbH (Frankenthal, Alemania) cuenta con certificaciones ISO 9001 e ISO 14001, cumpliendo con estándares UL, IEC, RoHS e IMDS. A través de LPAEZSIS, ponemos a disposición del mercado nacional la línea completa de cintas técnicas para aplicaciones eléctricas, electrónicas, automotrices y conversión de etiquetas (empalmes siliconados).</p></section>',
  `sort_order` = 25,
  `is_active` = 1,
  `subtitle` = 'Cintas Adhesivas Técnicas y Aislantes Eléctricos',
  `origin_country` = 'Alemania',
  `short_description` = 'Fabricante especialista en recubrimientos de películas, cintas adhesivas técnicas de alta precisión, piezas troqueladas y aislantes eléctricos para la industria global.',
  `long_description` = '<section class="brand-section"><h3>CMC Klebetechnik GmbH</h3><p><strong>Cintas Adhesivas Técnicas y Aislantes Eléctricos</strong></p><p>CMC Klebetechnik GmbH (Frankenthal, Alemania) cuenta con certificaciones ISO 9001 e ISO 14001, cumpliendo con estándares UL, IEC, RoHS e IMDS. A través de LPAEZSIS, ponemos a disposición del mercado nacional la línea completa de cintas técnicas para aplicaciones eléctricas, electrónicas, automotrices y conversión de etiquetas (empalmes siliconados).</p></section>',
  `seo_title` = 'CMC Klebetechnik Chile | Cintas Adhesivas Industriales - LPAEZSIS',
  `seo_description` = 'Distribución autorizada de cintas adhesivas técnicas CMC Klebetechnik en Chile. Soluciones para empalme de etiquetas siliconadas y aislamiento eléctrico.',
  `seo_keywords` = 'CMC Klebetechnik, cintas adhesivas industriales, empalme de etiquetas, release liner, aislantes electricos, CMC 10730, LPAEZSIS',
  `canonical_url` = '/marcas.html?slug=cmc-klebetechnik',
  `schema_json_ld` = '{
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Brand",
      "@id": "https://prueba1.lpaezsis.cl/marcas.html?slug=cmc-klebetechnik#brand",
      "name": "CMC Klebetechnik GmbH",
      "url": "https://prueba1.lpaezsis.cl/marcas.html?slug=cmc-klebetechnik",
      "description": "Distribución autorizada de cintas adhesivas técnicas CMC Klebetechnik en Chile. Soluciones para empalme de etiquetas siliconadas y aislamiento eléctrico.",
      "alternateName": "Cintas Adhesivas Técnicas y Aislantes Eléctricos",
      "slogan": "Cintas Adhesivas Técnicas y Aislantes Eléctricos",
      "logo": {
        "@type": "ImageObject",
        "url": "https://prueba1.lpaezsis.cl/img/logo-cmc-klebetechnik.webp"
      },
      "sameAs": [
        "https://www.cmc.de/"
      ],
      "additionalProperty": {
        "@type": "PropertyValue",
        "name": "País de origen",
        "value": "Alemania"
      }
    },
    {
      "@type": "Organization",
      "@id": "https://prueba1.lpaezsis.cl/#organization",
      "name": "LPAEZ SOLUCIONES INDUSTRIALES SPA",
      "alternateName": "LPAEZSIS",
      "url": "https://prueba1.lpaezsis.cl/",
      "logo": {
        "@type": "ImageObject",
        "url": "https://prueba1.lpaezsis.cl/img/brand/logo.png"
      },
      "brand": {
        "@id": "https://prueba1.lpaezsis.cl/marcas.html?slug=cmc-klebetechnik#brand"
      }
    }
  ]
}',
  `datasheet_url` = '/img/fichas/Cinta_Doble_Contacto_Union_Etiquetas_Siliconadas_CMC_LPAEZSIS.pdf'
WHERE `slug` = 'cmc-klebetechnik';

INSERT INTO `categories` (
  `slug`, `name`, `description`, `seo_title`, `seo_description`, `sort_order`, `is_active`
)
SELECT
  'cintas-adhesivas-tecnicas',
  'Cintas Adhesivas Técnicas / Empalme Siliconado',
  'Cintas adhesivas técnicas de alta precisión para empalme de materiales siliconados, release liners y aislamiento eléctrico.',
  'Cintas adhesivas técnicas CMC | LPAEZsis',
  'Cintas de doble contacto CMC Klebetechnik para empalme siliconado y aislamiento eléctrico. Distribución LPAEZSIS en Chile.',
  56,
  1
WHERE NOT EXISTS (
  SELECT 1 FROM `categories` WHERE `slug` = 'cintas-adhesivas-tecnicas'
);

INSERT INTO `products` (
  `category_id`, `brand_id`, `slug`, `name`, `description`, `sale_mode`, `stock_status`,
  `price_clp`, `image_url`, `is_featured`, `is_active`, `seo_title`, `seo_description`, `sort_order`
)
SELECT c.id, b.id,
  'cinta-doble-contacto-cmc-10730',
  'Cinta Doble Contacto CMC 10730',
  'Cinta adhesiva de doble contacto con soporte de poliéster (PET) y adhesivo de polisiloxano (silicona) en ambas caras. Especialmente concebida para el empalme superpuesto (splicing) de materiales siliconados y release liners.

Especificaciones técnicas:
• Material de soporte: Película de Poliéster (PET)
• Tipo de adhesivo: Polisiloxano (Silicona) en ambos lados (PS/PS)
• Espesor base: 0.023 mm (23 µm)
• Espesor total: 0.170 mm (170 µm)
• Color: Incoloro / Transparente
• Clase térmica: Clase B (130 °C)
• Formato estándar: 25 mm x 33 m

Ficha técnica: /img/fichas/Cinta_Doble_Contacto_Union_Etiquetas_Siliconadas_CMC_LPAEZSIS.pdf',
  'quote', 'on_request', NULL, '/img/productos/cmc-10730.jpg', 1, 1,
  'Cinta Doble Contacto CMC 10730 | Cotizar LPAEZsis',
  'Cinta adhesiva de doble contacto con soporte de poliéster (PET) y adhesivo de polisiloxano (silicona) en ambas caras. Especialmente concebida para el empalme superpuesto (splicing) de materiales siliconados y release liners.',
  13
FROM `categories` c
JOIN `brands` b ON b.slug = 'cmc-klebetechnik'
WHERE c.slug = 'cintas-adhesivas-tecnicas'
  AND NOT EXISTS (
    SELECT 1 FROM `products` p
    WHERE p.slug = 'cinta-doble-contacto-cmc-10730'
  );

UPDATE `products`
SET
  `name` = 'Cinta Doble Contacto CMC 10730',
  `description` = 'Cinta adhesiva de doble contacto con soporte de poliéster (PET) y adhesivo de polisiloxano (silicona) en ambas caras. Especialmente concebida para el empalme superpuesto (splicing) de materiales siliconados y release liners.

Especificaciones técnicas:
• Material de soporte: Película de Poliéster (PET)
• Tipo de adhesivo: Polisiloxano (Silicona) en ambos lados (PS/PS)
• Espesor base: 0.023 mm (23 µm)
• Espesor total: 0.170 mm (170 µm)
• Color: Incoloro / Transparente
• Clase térmica: Clase B (130 °C)
• Formato estándar: 25 mm x 33 m

Ficha técnica: /img/fichas/Cinta_Doble_Contacto_Union_Etiquetas_Siliconadas_CMC_LPAEZSIS.pdf',
  `image_url` = '/img/productos/cmc-10730.jpg',
  `sale_mode` = 'quote',
  `stock_status` = 'on_request',
  `price_clp` = NULL,
  `is_featured` = 1,
  `is_active` = 1,
  `seo_title` = 'Cinta Doble Contacto CMC 10730 | Cotizar LPAEZsis',
  `seo_description` = 'Cinta adhesiva de doble contacto con soporte de poliéster (PET) y adhesivo de polisiloxano (silicona) en ambas caras. Especialmente concebida para el empalme superpuesto (splicing) de materiales siliconados y release liners.',
  `sort_order` = 13,
  `brand_id` = (SELECT id FROM `brands` WHERE slug = 'cmc-klebetechnik' LIMIT 1),
  `category_id` = (SELECT id FROM `categories` WHERE slug = 'cintas-adhesivas-tecnicas' LIMIT 1)
WHERE `slug` = 'cinta-doble-contacto-cmc-10730';
