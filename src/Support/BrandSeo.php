<?php
declare(strict_types=1);

namespace Lpaezsis\Support;

use PDO;

/**
 * SEO de marcas (admin + catálogo público).
 *
 * Brand: id, name, slug, subtitle, origin_country, description, logo_url,
 *        datasheet_url, website_url, content_html, sort_order, is_active
 * SEOData: seo_title, seo_description, seo_keywords, canonical_url, schema_json_ld
 * BrandActionResult: ok, id?, slug?, error?
 */
final class BrandSeo
{
    public const TITLE_SUFFIX = ' Chile | Soluciones Industriales - LPAEZSIS';
    public const DESC_IDEAL_MIN = 155;
    public const DESC_IDEAL_MAX = 160;

    /** @var array<string, bool>|null */
    private static $columns = null;

    public static function suggestTitle(string $name): string
    {
        $name = trim($name);
        if ($name === '') {
            return 'Marcas' . self::TITLE_SUFFIX;
        }
        return $name . self::TITLE_SUFFIX;
    }

    public static function defaultCanonical(string $slug): string
    {
        $slug = trim($slug);
        if ($slug === '') {
            return '/marcas.html';
        }
        return '/marcas.html?slug=' . rawurlencode($slug);
    }

    /**
     * @param array<string, mixed> $brand
     * @return array<string, mixed>
     */
    public static function buildGraph(array $brand, string $origin = 'https://prueba1.lpaezsis.cl'): array
    {
        $origin = rtrim($origin, '/');
        $name = trim((string) ($brand['name'] ?? ''));
        $slug = trim((string) ($brand['slug'] ?? ''));
        $pagePath = self::defaultCanonical($slug);
        $url = $origin . $pagePath;
        $logo = trim((string) ($brand['logo_url'] ?? ''));
        if ($logo !== '' && !preg_match('#^https?://#i', $logo)) {
            $logo = $origin . '/' . ltrim($logo, '/');
        }
        $desc = trim((string) ($brand['seo_description'] ?? $brand['description'] ?? ''));

        $brandNode = [
            '@type' => 'Brand',
            '@id' => $url . '#brand',
            'name' => $name !== '' ? $name : 'Marca',
            'url' => $url,
        ];
        if ($desc !== '') {
            $brandNode['description'] = $desc;
        }
        $subtitle = trim((string) ($brand['subtitle'] ?? ''));
        if ($subtitle !== '') {
            $brandNode['alternateName'] = $subtitle;
        }
        if ($logo !== '') {
            $brandNode['logo'] = $logo;
        }
        $country = trim((string) ($brand['origin_country'] ?? ''));
        if ($country !== '') {
            $brandNode['countryOfOrigin'] = [
                '@type' => 'Country',
                'name' => $country,
            ];
        }
        $website = trim((string) ($brand['website_url'] ?? ''));
        if ($website !== '') {
            $brandNode['sameAs'] = [$website];
        }

        $org = [
            '@type' => 'Organization',
            '@id' => $origin . '/#organization',
            'name' => 'LPAEZ SOLUCIONES INDUSTRIALES SPA',
            'alternateName' => 'LPAEZSIS',
            'url' => $origin . '/',
            'brand' => ['@id' => $url . '#brand'],
        ];

        return [
            '@context' => 'https://schema.org',
            '@graph' => [$brandNode, $org],
        ];
    }

    /**
     * @param array<string, mixed> $brand
     */
    public static function buildJson(array $brand, string $origin = 'https://prueba1.lpaezsis.cl'): string
    {
        $json = json_encode(
            self::buildGraph($brand, $origin),
            JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT
        );
        return is_string($json) ? $json : '{}';
    }

    public static function normalizeJsonLd(string $raw): string
    {
        $raw = trim($raw);
        if ($raw === '') {
            return '';
        }
        $decoded = json_decode($raw, true);
        if (!is_array($decoded)) {
            return $raw;
        }
        $json = json_encode($decoded, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
        return is_string($json) ? $json : $raw;
    }

    public static function ensureColumns(PDO $pdo): void
    {
        if (self::$columns !== null) {
            return;
        }
        self::$columns = [];
        try {
            $rows = $pdo->query('SHOW COLUMNS FROM brands')->fetchAll(PDO::FETCH_ASSOC);
        } catch (\Throwable $e) {
            return;
        }
        foreach ($rows as $row) {
            $field = strtolower((string) ($row['Field'] ?? ''));
            if ($field !== '') {
                self::$columns[$field] = true;
            }
        }
        $needed = [
            'subtitle' => 'VARCHAR(200) NULL DEFAULT NULL',
            'origin_country' => 'VARCHAR(80) NULL DEFAULT NULL',
            'seo_title' => 'VARCHAR(200) NULL DEFAULT NULL',
            'seo_description' => 'VARCHAR(320) NULL DEFAULT NULL',
            'seo_keywords' => 'VARCHAR(500) NULL DEFAULT NULL',
            'canonical_url' => 'VARCHAR(500) NULL DEFAULT NULL',
            'schema_json_ld' => 'MEDIUMTEXT NULL',
            'datasheet_url' => 'VARCHAR(500) NULL DEFAULT NULL',
        ];
        foreach ($needed as $name => $def) {
            if (isset(self::$columns[$name])) {
                continue;
            }
            try {
                $pdo->exec('ALTER TABLE brands ADD COLUMN `' . $name . '` ' . $def);
                self::$columns[$name] = true;
            } catch (\Throwable $e) {
                // Sin privilegio ALTER o columna ya creada en paralelo.
            }
        }
    }

    /**
     * @return array<string, bool>
     */
    public static function existingColumns(PDO $pdo): array
    {
        self::ensureColumns($pdo);
        return self::$columns ?? [];
    }
}
