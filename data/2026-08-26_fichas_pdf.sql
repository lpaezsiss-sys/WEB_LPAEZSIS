-- Fichas técnicas PDF por producto
ALTER TABLE products
  ADD COLUMN IF NOT EXISTS ficha_pdf_url VARCHAR(500) NULL DEFAULT NULL AFTER image_url;

UPDATE products
SET ficha_pdf_url = 'img/fichas/paletizador-alto-nivel-columbia-hl7200.pdf'
WHERE slug = 'paletizador-alto-nivel-columbia-hl7200'
  AND (ficha_pdf_url IS NULL OR ficha_pdf_url = '');
