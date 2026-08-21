-- MOVEX Blueline® brand refresh + modular belt quote product (idempotent by slug)
-- Live: ADMIN_PASSWORD='…' python3 tools/import_movex_blueline.py

UPDATE `brands`
SET
  `name` = 'MOVEX',
  `description` = 'Línea Blueline® de bandas modulares plásticas para higiene alimentaria, con bisagras autolimpiantes, material BluLub® de baja fricción y transferencia activa Zero ATP® Pro.',
  `logo_url` = '/img/brand/movex.png',
  `website_url` = 'https://www.movexii.com/',
  `content_html` = '<style>
.blueline-kicker{margin:0 0 .35rem;color:#0a5ea8;font-size:.78rem;font-weight:800;letter-spacing:.08em;text-transform:uppercase}
.blueline-hero{margin:1rem 0 1.35rem}
.blueline-hero__img{display:block;width:100%;max-width:100%;height:min(420px,58vw);object-fit:cover;border-radius:.75rem;box-shadow:0 8px 24px rgba(10,46,92,.18);border:0;margin:0}
.blueline-hero figcaption{margin-top:.45rem;font-size:.82rem;color:#5f5f5f}
.blueline-grid,.blueline-innov{display:flex;flex-wrap:wrap;gap:1rem}
.blueline-card,.blueline-innov__card{flex:1 1 240px;background:#f3f8fc;border:1px solid #d4e4f2;border-radius:.75rem;padding:1.05rem 1.15rem;box-shadow:0 4px 14px rgba(10,46,92,.06)}
.blueline-card h4,.blueline-innov__card h4{margin:0 0 .45rem;color:#0a2f5c;font-size:1.02rem;font-weight:800}
.blueline-card p,.blueline-innov__card p{margin:0}
</style>
<section class="brand-section blueline-line">
<p class="blueline-kicker">Movex · Fabricado en Italia</p>
<h3>Línea Blueline® de Movex</h3>
<p>Después de consolidarse en beverage, Movex desarrolló <strong>Blueline®</strong>: bandas modulares plásticas y sprockets para sectores con alto estándar higiénico. El concepto combina <strong>higiene alimentaria</strong>, <strong>durabilidad</strong> y un <strong>sistema de bisagras autolimpiantes</strong> que limpia el espacio entre módulos en cada rotación, con intercambiabilidad frente a los principales fabricantes de bandas food.</p>
<figure class="blueline-hero">
<img class="blueline-hero__img" src="/img/productos/movex-blueline.jpg" data-fallback="https://images.unsplash.com/photo-1553413077-190dd305871c?auto=format&fit=crop&w=1600&q=80" alt="Banda modular plástica azul Blueline operando en una línea industrial de procesamiento y empaque" width="1600" height="900" loading="lazy" decoding="async">
<figcaption>Aplicación tipo Blueline® en línea de proceso/empaque. Si la imagen local no carga, se usa Unsplash (industrial conveyor / food processing).</figcaption>
</figure>
<div class="blueline-grid">
<article class="blueline-card">
<h4>Procesamiento de alimentos</h4>
<p>Carnes, aves y pescado: superficies abiertas, drenaje y ciclos de lavado más cortos gracias a la bisagra autolimpiante y materiales de contacto alimentario.</p>
</article>
<article class="blueline-card">
<h4>Panadería, repostería y frutas/verduras</h4>
<p>Masas, horneados, blanqueado y líneas de lavado: perfiles non-stick, nub top y accesorios (flights, guiados) según el producto húmedo o pegajoso.</p>
</article>
<article class="blueline-card">
<h4>Empaque, logística y automotriz</h4>
<p>Manejo de materiales, packaging y automoción: la misma plataforma modular con sprockets, curvas y transferencias compactas para integrar en líneas existentes.</p>
</article>
</div>
<div class="blueline-innov">
<article class="blueline-innov__card">
<h4>Material BluLub®</h4>
<p>UHMW-PE de alto desempeño con lubricante sólido integrado. Baja fricción y ruido, menor consumo energético y vida útil extendida bajo carga y alta velocidad, en guías y componentes de transporte.</p>
</article>
<article class="blueline-innov__card">
<h4>Zero ATP® Pro</h4>
<p>Placa de transferencia activa más compacta del mercado (micropitch 7870 / 510). Libre de mantenimiento y tensado, con mini-motor o eje chavetero. Sustituye transferencias tradicionales con mínimo trabajo estructural.</p>
</article>
</div>
</section>
<section class="brand-section">
<h3>Otras soluciones Movex</h3>
<p><strong>ZERO Contacto</strong> — transportador curvo de banda modular con eslabones cortos, transferencias reducidas y radio interior compacto para packs y envases termorretráctiles.</p>
<p><strong>553 Flex Top</strong> — banda recta con esferas autobloqueantes para rotar, desviar o acelerar paquetes ligeros (cartón, latas, botellas y bolsas) con precisión.</p>
</section>',
  `sort_order` = 30,
  `is_active` = 1,
  `subtitle` = 'Blueline® · Bandas modulares higiénicas',
  `origin_country` = 'Italia',
  `short_description` = 'Línea Blueline® de bandas modulares plásticas para higiene alimentaria, con bisagras autolimpiantes, material BluLub® de baja fricción y transferencia activa Zero ATP® Pro.',
  `long_description` = '<style>
.blueline-kicker{margin:0 0 .35rem;color:#0a5ea8;font-size:.78rem;font-weight:800;letter-spacing:.08em;text-transform:uppercase}
.blueline-hero{margin:1rem 0 1.35rem}
.blueline-hero__img{display:block;width:100%;max-width:100%;height:min(420px,58vw);object-fit:cover;border-radius:.75rem;box-shadow:0 8px 24px rgba(10,46,92,.18);border:0;margin:0}
.blueline-hero figcaption{margin-top:.45rem;font-size:.82rem;color:#5f5f5f}
.blueline-grid,.blueline-innov{display:flex;flex-wrap:wrap;gap:1rem}
.blueline-card,.blueline-innov__card{flex:1 1 240px;background:#f3f8fc;border:1px solid #d4e4f2;border-radius:.75rem;padding:1.05rem 1.15rem;box-shadow:0 4px 14px rgba(10,46,92,.06)}
.blueline-card h4,.blueline-innov__card h4{margin:0 0 .45rem;color:#0a2f5c;font-size:1.02rem;font-weight:800}
.blueline-card p,.blueline-innov__card p{margin:0}
</style>
<section class="brand-section blueline-line">
<p class="blueline-kicker">Movex · Fabricado en Italia</p>
<h3>Línea Blueline® de Movex</h3>
<p>Después de consolidarse en beverage, Movex desarrolló <strong>Blueline®</strong>: bandas modulares plásticas y sprockets para sectores con alto estándar higiénico. El concepto combina <strong>higiene alimentaria</strong>, <strong>durabilidad</strong> y un <strong>sistema de bisagras autolimpiantes</strong> que limpia el espacio entre módulos en cada rotación, con intercambiabilidad frente a los principales fabricantes de bandas food.</p>
<figure class="blueline-hero">
<img class="blueline-hero__img" src="/img/productos/movex-blueline.jpg" data-fallback="https://images.unsplash.com/photo-1553413077-190dd305871c?auto=format&fit=crop&w=1600&q=80" alt="Banda modular plástica azul Blueline operando en una línea industrial de procesamiento y empaque" width="1600" height="900" loading="lazy" decoding="async">
<figcaption>Aplicación tipo Blueline® en línea de proceso/empaque. Si la imagen local no carga, se usa Unsplash (industrial conveyor / food processing).</figcaption>
</figure>
<div class="blueline-grid">
<article class="blueline-card">
<h4>Procesamiento de alimentos</h4>
<p>Carnes, aves y pescado: superficies abiertas, drenaje y ciclos de lavado más cortos gracias a la bisagra autolimpiante y materiales de contacto alimentario.</p>
</article>
<article class="blueline-card">
<h4>Panadería, repostería y frutas/verduras</h4>
<p>Masas, horneados, blanqueado y líneas de lavado: perfiles non-stick, nub top y accesorios (flights, guiados) según el producto húmedo o pegajoso.</p>
</article>
<article class="blueline-card">
<h4>Empaque, logística y automotriz</h4>
<p>Manejo de materiales, packaging y automoción: la misma plataforma modular con sprockets, curvas y transferencias compactas para integrar en líneas existentes.</p>
</article>
</div>
<div class="blueline-innov">
<article class="blueline-innov__card">
<h4>Material BluLub®</h4>
<p>UHMW-PE de alto desempeño con lubricante sólido integrado. Baja fricción y ruido, menor consumo energético y vida útil extendida bajo carga y alta velocidad, en guías y componentes de transporte.</p>
</article>
<article class="blueline-innov__card">
<h4>Zero ATP® Pro</h4>
<p>Placa de transferencia activa más compacta del mercado (micropitch 7870 / 510). Libre de mantenimiento y tensado, con mini-motor o eje chavetero. Sustituye transferencias tradicionales con mínimo trabajo estructural.</p>
</article>
</div>
</section>
<section class="brand-section">
<h3>Otras soluciones Movex</h3>
<p><strong>ZERO Contacto</strong> — transportador curvo de banda modular con eslabones cortos, transferencias reducidas y radio interior compacto para packs y envases termorretráctiles.</p>
<p><strong>553 Flex Top</strong> — banda recta con esferas autobloqueantes para rotar, desviar o acelerar paquetes ligeros (cartón, latas, botellas y bolsas) con precisión.</p>
</section>',
  `seo_title` = 'MOVEX Blueline® Chile | Bandas Modulares Higiénicas - LPAEZSIS',
  `seo_description` = 'Distribución Movex Blueline® en Chile: bandas modulares para carne, panadería y empaque, BluLub® y Zero ATP® Pro. Cotiza con LPAEZSIS.',
  `seo_keywords` = 'Movex, Blueline, bandas modulares, higiene alimentaria, BluLub, Zero ATP Pro, bisagras autolimpiantes, LPAEZSIS',
  `canonical_url` = '/marcas.html?slug=movex',
  `schema_json_ld` = '{
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Brand",
      "@id": "https://prueba1.lpaezsis.cl/marcas.html?slug=movex#brand",
      "name": "MOVEX",
      "alternateName": "Blueline® · Bandas modulares higiénicas",
      "slogan": "Blueline® · Bandas modulares higiénicas",
      "url": "https://prueba1.lpaezsis.cl/marcas.html?slug=movex",
      "description": "Distribución Movex Blueline® en Chile: bandas modulares para carne, panadería y empaque, BluLub® y Zero ATP® Pro. Cotiza con LPAEZSIS.",
      "logo": {
        "@type": "ImageObject",
        "url": "https://prueba1.lpaezsis.cl/img/brand/movex.png"
      },
      "sameAs": [
        "https://www.movexii.com/"
      ],
      "additionalProperty": {
        "@type": "PropertyValue",
        "name": "País de origen",
        "value": "Italia"
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
        "@id": "https://prueba1.lpaezsis.cl/marcas.html?slug=movex#brand"
      }
    }
  ]
}'
WHERE `slug` = 'movex';

INSERT INTO `categories` (
  `slug`, `name`, `description`, `seo_title`, `seo_description`, `sort_order`, `is_active`
)
SELECT
  'bandas-modulares-higiene', 'Bandas Modulares / Higiene Alimentaria', 'Bandas modulares plásticas Blueline® para proceso de alimentos, panadería, empaque y transferencias higiénicas.',
  'Bandas modulares Blueline Movex | LPAEZsis', 'Bandas modulares higiénicas Movex Blueline® con bisagra autolimpiante, BluLub® y Zero ATP® Pro.', 58, 1
WHERE NOT EXISTS (SELECT 1 FROM `categories` WHERE `slug` = 'bandas-modulares-higiene');

INSERT INTO `products` (
  `category_id`, `brand_id`, `slug`, `name`, `description`, `sale_mode`, `stock_status`,
  `price_clp`, `image_url`, `is_featured`, `is_active`, `seo_title`, `seo_description`, `sort_order`
)
SELECT c.id, b.id,
  'linea-blueline-movex-bandas-modulares', 'Línea Blueline® Movex — Bandas Modulares Higiénicas', 'Plataforma Blueline® de Movex (Italia) para proceso de alimentos, panadería, frutas/verduras, empaque, logística y automotriz. Bisagra autolimpiante, intercambiabilidad con principales productores food y accesorios (flights, guiados, sprockets).

Especificaciones técnicas:
• Higiene: Bisagra autolimpiante (self-cleaning hinge)
• Material BluLub®: UHMW-PE con lubricante sólido integrado
• Transferencia: Zero ATP® Pro micropitch 7870 / 510, sin tensado
• Sectores: Carne, aves, pescado, panadería, frutas/verduras, empaque, logística, automotriz
• Origen: Italia

Ficha técnica: /img/productos/movex-blueline.jpg',
  'quote', 'on_request', NULL, '/img/productos/movex-blueline.jpg', 1, 1,
  'Línea Blueline® Movex — Bandas Modulares Higiénicas | Cotizar LPAEZsis', 'Bandas modulares plásticas Blueline® para higiene alimentaria, con bisagras autolimpiantes, material BluLub® y transferencia Zero ATP® Pro.', 14
FROM `categories` c
JOIN `brands` b ON b.slug = 'movex'
WHERE c.slug = 'bandas-modulares-higiene'
  AND NOT EXISTS (SELECT 1 FROM `products` p2 WHERE p2.slug = 'linea-blueline-movex-bandas-modulares');

UPDATE `products`
SET
  `name` = 'Línea Blueline® Movex — Bandas Modulares Higiénicas',
  `description` = 'Plataforma Blueline® de Movex (Italia) para proceso de alimentos, panadería, frutas/verduras, empaque, logística y automotriz. Bisagra autolimpiante, intercambiabilidad con principales productores food y accesorios (flights, guiados, sprockets).

Especificaciones técnicas:
• Higiene: Bisagra autolimpiante (self-cleaning hinge)
• Material BluLub®: UHMW-PE con lubricante sólido integrado
• Transferencia: Zero ATP® Pro micropitch 7870 / 510, sin tensado
• Sectores: Carne, aves, pescado, panadería, frutas/verduras, empaque, logística, automotriz
• Origen: Italia

Ficha técnica: /img/productos/movex-blueline.jpg',
  `image_url` = '/img/productos/movex-blueline.jpg',
  `sale_mode` = 'quote',
  `stock_status` = 'on_request',
  `price_clp` = NULL,
  `is_featured` = 1,
  `is_active` = 1,
  `seo_title` = 'Línea Blueline® Movex — Bandas Modulares Higiénicas | Cotizar LPAEZsis',
  `seo_description` = 'Bandas modulares plásticas Blueline® para higiene alimentaria, con bisagras autolimpiantes, material BluLub® y transferencia Zero ATP® Pro.',
  `sort_order` = 14,
  `brand_id` = (SELECT id FROM `brands` WHERE slug = 'movex' LIMIT 1),
  `category_id` = (SELECT id FROM `categories` WHERE slug = 'bandas-modulares-higiene' LIMIT 1)
WHERE `slug` = 'linea-blueline-movex-bandas-modulares';
