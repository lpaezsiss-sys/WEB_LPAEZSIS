-- Columnas SEO / ficha de marca (idempotente vía AdminApi::BrandSeo::ensureColumns).
-- Ejecutar en MySQL/MariaDB si ALTER automático no está disponible.

ALTER TABLE `brands`
  ADD COLUMN `subtitle` VARCHAR(200) NULL DEFAULT NULL,
  ADD COLUMN `origin_country` VARCHAR(80) NULL DEFAULT NULL,
  ADD COLUMN `seo_title` VARCHAR(200) NULL DEFAULT NULL,
  ADD COLUMN `seo_description` VARCHAR(320) NULL DEFAULT NULL,
  ADD COLUMN `seo_keywords` VARCHAR(500) NULL DEFAULT NULL,
  ADD COLUMN `canonical_url` VARCHAR(500) NULL DEFAULT NULL,
  ADD COLUMN `schema_json_ld` MEDIUMTEXT NULL,
  ADD COLUMN `datasheet_url` VARCHAR(500) NULL DEFAULT NULL;
