<?php
declare(strict_types=1);

namespace Lpaezsis\Support;

use PDO;

/**
 * SEO y normalización de marcas (admin + catálogo público).
 *
 * Columnas canónicas (además de las legacy `description` / `content_html`):
 * id, name, slug, subtitle, origin_country, short_description, long_description,
 * logo_url, datasheet_url, website_url,
 * seo_title, seo_description, seo_keywords, canonical_url, schema_json_ld.
 *
 * Canonical por defecto: `/marcas.html?slug={slug}`.
 * JSON-LD: grafo `Brand` + `Organization` (schema.org).
 *
 * @phpstan-type Brand array{
 *   id?: int,
 *   name: string,
 *   slug: string,
 *   subtitle?: ?string,
 *   origin_country?: ?string,
 *   short_description?: ?string,
 *   long_description?: ?string,
 *   description?: ?string,
 *   content_html?: ?string,
 *   logo_url?: ?string,
 *   datasheet_url?: ?string,
 *   website_url?: ?string,
 *   seo_title?: ?string,
 *   seo_description?: ?string,
 *   seo_keywords?: ?string,
 *   canonical_url?: ?string,
 *   schema_json_ld?: ?string,
 *   sort_order?: int,
 *   is_active?: int|bool
 * }
 * @phpstan-type SEOData array{
 *   seo_title: string,
 *   seo_description: ?string,
 *   seo_keywords: ?string,
 *   canonical_url: string,
 *   schema_json_ld: string
 * }
 * @phpstan-type BrandActionResult array{
 *   success: bool,
 *   ok: bool,
 *   id?: int,
 *   slug?: string,
 *   brand?: Brand,
 *   url?: string,
 *   data?: array{id?: int, slug?: string, brand?: Brand, brands?: list<Brand>, url?: string},
 *   error?: string
 * }
 */
final class BrandSeo
{
    public const TITLE_SUFFIX = ' Chile | Soluciones Industriales - LPAEZSIS';
    public const DESC_IDEAL_MIN = 155;
    public const DESC_IDEAL_MAX = 160;
    public const DEFAULT_ORIGIN = 'https://prueba1.lpaezsis.cl';
    public const ORG_NAME = 'LPAEZ SOLUCIONES INDUSTRIALES SPA';
    public const ORG_ALT = 'LPAEZSIS';

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

    /**
     * Ruta canónica relativa. Siempre `/marcas.html?slug={slug}` (o `/marcas.html` sin slug).
     */
    public static function defaultCanonical(string $slug): string
    {
        $slug = trim($slug);
        if ($slug === '') {
            return '/marcas.html';
        }
        return '/marcas.html?slug=' . rawurlencode($slug);
    }

    /**
     * Acepta short_description / long_description y alias legacy description / content_html.
     *
     * @param array<string, mixed> $input
     * @return array<string, mixed>
     */
    public static function aliasInput(array $input): array
    {
        if (!array_key_exists('description', $input) && array_key_exists('short_description', $input)) {
            $input['description'] = $input['short_description'];
        }
        if (!array_key_exists('short_description', $input) && array_key_exists('description', $input)) {
            $input['short_description'] = $input['description'];
        }
        if (!array_key_exists('content_html', $input) && array_key_exists('long_description', $input)) {
            $input['content_html'] = $input['long_description'];
        }
        if (!array_key_exists('long_description', $input) && array_key_exists('content_html', $input)) {
            $input['long_description'] = $input['content_html'];
        }
        return $input;
    }

    /**
     * Hidrata alias para que el admin y `marcas.html` reciban ambos nombres.
     *
     * @param array<string, mixed> $row
     * @return Brand
     */
    public static function present(array $row): array
    {
        $short = trim((string) ($row['short_description'] ?? $row['description'] ?? ''));
        $long = trim((string) ($row['long_description'] ?? $row['content_html'] ?? ''));
        $row['short_description'] = $short !== '' ? $short : null;
        $row['description'] = $row['short_description'];
        $row['long_description'] = $long !== '' ? $long : null;
        $row['content_html'] = $row['long_description'];
        $slug = trim((string) ($row['slug'] ?? ''));
        if (trim((string) ($row['canonical_url'] ?? '')) === '' && $slug !== '') {
            $row['canonical_url'] = self::defaultCanonical($slug);
        }
        return $row;
    }

    /**
     * @param list<array<string, mixed>> $rows
     * @return list<Brand>
     */
    public static function presentMany(array $rows): array
    {
        $out = [];
        foreach ($rows as $row) {
            if (is_array($row)) {
                $out[] = self::present($row);
            }
        }
        return $out;
    }

    /**
     * @param Brand|array<string, mixed> $brand
     * @return array<string, mixed>
     */
    public static function buildGraph(array $brand, string $origin = self::DEFAULT_ORIGIN): array
    {
        $origin = rtrim($origin, '/');
        $name = trim((string) ($brand['name'] ?? ''));
        $slug = trim((string) ($brand['slug'] ?? ''));
        $customCanon = trim((string) ($brand['canonical_url'] ?? ''));
        if ($customCanon !== '' && preg_match('#^https?://#i', $customCanon)) {
            $url = $customCanon;
        } else {
            $path = $customCanon !== '' ? $customCanon : self::defaultCanonical($slug);
            $url = $origin . (strpos($path, '/') === 0 ? $path : '/' . $path);
        }
        $logo = trim((string) ($brand['logo_url'] ?? ''));
        if ($logo !== '' && !preg_match('#^https?://#i', $logo)) {
            $logo = $origin . '/' . ltrim($logo, '/');
        }
        $desc = trim((string) (
            $brand['seo_description']
            ?? $brand['short_description']
            ?? $brand['description']
            ?? ''
        ));

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
            $brandNode['slogan'] = $subtitle;
        }
        if ($logo !== '') {
            $brandNode['logo'] = [
                '@type' => 'ImageObject',
                'url' => $logo,
            ];
        }
        $website = trim((string) ($brand['website_url'] ?? ''));
        if ($website !== '') {
            $brandNode['sameAs'] = [$website];
        }

        $orgLogo = $origin . '/img/brand/logo.png';
        $org = [
            '@type' => 'Organization',
            '@id' => $origin . '/#organization',
            'name' => self::ORG_NAME,
            'alternateName' => self::ORG_ALT,
            'url' => $origin . '/',
            'logo' => [
                '@type' => 'ImageObject',
                'url' => $orgLogo,
            ],
            'brand' => ['@id' => $url . '#brand'],
        ];
        $country = trim((string) ($brand['origin_country'] ?? ''));
        if ($country !== '') {
            $brandNode['additionalProperty'] = [
                '@type' => 'PropertyValue',
                'name' => 'País de origen',
                'value' => $country,
            ];
        }

        return [
            '@context' => 'https://schema.org',
            '@graph' => [$brandNode, $org],
        ];
    }

    /**
     * @param Brand|array<string, mixed> $brand
     */
    public static function buildJson(array $brand, string $origin = self::DEFAULT_ORIGIN): string
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

    /**
     * Sobre {success:true, ok:true, data} y replica cada clave de $payload en la raíz.
     *
     * @param array<string, mixed> $payload
     * @return array<string, mixed>
     */
    public static function envelope(array $payload): array
    {
        return array_merge(['success' => true, 'ok' => true, 'data' => $payload], $payload);
    }

    /**
     * @param Brand $brand
     * @return BrandActionResult
     */
    public static function actionResult(array $brand): array
    {
        $id = isset($brand['id']) ? (int) $brand['id'] : 0;
        $slug = (string) ($brand['slug'] ?? '');
        $url = trim((string) ($brand['canonical_url'] ?? ''));
        if ($url === '') {
            $url = self::defaultCanonical($slug);
        }
        return self::envelope([
            'id' => $id,
            'slug' => $slug,
            'brand' => $brand,
            'url' => $url,
        ]);
    }

    /**
     * @param list<Brand> $brands
     * @return array<string, mixed>
     */
    public static function listResult(array $brands): array
    {
        return self::envelope(['brands' => $brands]);
    }

    /**
     * @return array{success: false, ok: false, error: string}
     */
    public static function failResult(string $message): array
    {
        return [
            'success' => false,
            'ok' => false,
            'error' => $message,
        ];
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
            'short_description' => 'TEXT NULL DEFAULT NULL',
            'long_description' => 'MEDIUMTEXT NULL',
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
