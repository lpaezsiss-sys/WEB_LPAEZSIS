<?php
declare(strict_types=1);

namespace Lpaezsis\Controllers;

use Lpaezsis\Auth;
use Lpaezsis\Database;
use Lpaezsis\Response;
use Lpaezsis\Support\BrandSeo;
use Lpaezsis\Support\Slug;
use Lpaezsis\Support\Upload;
use PDO;

final class AdminApi
{
    /** @var array<string, mixed>|null */
    private static $bodyCache = null;

    public static function handle(string $method, string $path): void
    {
        $sub = substr($path, strlen('/api/admin')) ?: '/';
        if ($sub === '') {
            $sub = '/';
        }

        if ($method === 'POST' && $sub === '/login') {
            self::login();
            return;
        }

        Auth::requireAdmin();

        if ($method === 'GET' && $sub === '/me') {
            Response::json(['ok' => true]);
            return;
        }
        if ($method === 'POST' && $sub === '/change-password') {
            self::changePassword();
            return;
        }
        if ($method === 'POST' && $sub === '/upload') {
            self::upload();
            return;
        }

        if ($method === 'GET' && $sub === '/settings') {
            $row = self::pdo()->query('SELECT * FROM site_settings WHERE id = 1')->fetch();
            Response::json($row ?: new \stdClass());
            return;
        }
        if ($method === 'PUT' && $sub === '/settings') {
            self::saveSettings();
            return;
        }

        if ($method === 'GET' && $sub === '/categories') {
            $rows = self::pdo()->query('SELECT * FROM categories ORDER BY sort_order, name')->fetchAll();
            Response::json(['categories' => $rows]);
            return;
        }
        if ($method === 'POST' && $sub === '/categories') {
            self::createCategory();
            return;
        }
        if ($method === 'PUT' && preg_match('#^/categories/(\d+)$#', $sub, $m)) {
            self::updateCategory((int) $m[1]);
            return;
        }
        if ($method === 'DELETE' && preg_match('#^/categories/(\d+)$#', $sub, $m)) {
            self::deleteCategory((int) $m[1]);
            return;
        }

        if ($method === 'GET' && $sub === '/brands') {
            try {
                BrandSeo::ensureColumns(self::pdo());
                $rows = BrandSeo::presentMany(
                    self::pdo()->query('SELECT * FROM brands ORDER BY sort_order, name')->fetchAll()
                );
                Response::json(BrandSeo::listResult($rows));
            } catch (\Throwable $e) {
                self::brandFail('No se pudieron listar las marcas', 500, [
                    'debug' => BrandSeo::exceptionDebug($e),
                ]);
            }
            return;
        }
        if ($method === 'POST' && $sub === '/brands') {
            self::createBrand();
            return;
        }
        if ($method === 'PUT' && $sub === '/brands') {
            $id = (int) (self::body()['id'] ?? 0);
            if ($id <= 0) {
                self::brandFail('id requerido');
                return;
            }
            self::updateBrand($id);
            return;
        }
        if ($method === 'PUT' && preg_match('#^/brands/(\d+)$#', $sub, $m)) {
            self::updateBrand((int) $m[1]);
            return;
        }
        if ($method === 'DELETE' && preg_match('#^/brands/(\d+)$#', $sub, $m)) {
            self::deleteBrand((int) $m[1]);
            return;
        }

        if ($method === 'GET' && $sub === '/products') {
            $rows = self::pdo()->query(
                'SELECT p.*, c.slug AS category_slug, c.name AS category_name,
                        b.slug AS brand_slug, b.name AS brand_name
                 FROM products p
                 LEFT JOIN categories c ON c.id = p.category_id
                 LEFT JOIN brands b ON b.id = p.brand_id
                 ORDER BY p.sort_order, p.name'
            )->fetchAll();
            Response::json(['products' => $rows]);
            return;
        }
        if ($method === 'GET' && preg_match('#^/products/(\d+)$#', $sub, $m)) {
            $stmt = self::pdo()->prepare('SELECT * FROM products WHERE id = ? LIMIT 1');
            $stmt->execute([(int) $m[1]]);
            $row = $stmt->fetch();
            if (!$row) {
                Response::error('Producto no encontrado', 404);
                return;
            }
            Response::json($row);
            return;
        }
        if ($method === 'POST' && $sub === '/products') {
            self::createProduct();
            return;
        }
        if ($method === 'PUT' && preg_match('#^/products/(\d+)$#', $sub, $m)) {
            self::updateProduct((int) $m[1]);
            return;
        }
        if ($method === 'DELETE' && preg_match('#^/products/(\d+)$#', $sub, $m)) {
            self::pdo()->prepare('DELETE FROM products WHERE id = ?')->execute([(int) $m[1]]);
            Response::json(['ok' => true]);
            return;
        }

        if ($method === 'GET' && $sub === '/orders') {
            $rows = self::pdo()->query('SELECT * FROM orders ORDER BY id DESC')->fetchAll();
            Response::json(['orders' => $rows]);
            return;
        }
        if ($method === 'PUT' && preg_match('#^/orders/(\d+)$#', $sub, $m)) {
            $b = self::body();
            $status = (string) ($b['status'] ?? '');
            self::pdo()->prepare('UPDATE orders SET status = ?, updated_at = NOW() WHERE id = ?')
                ->execute([$status, (int) $m[1]]);
            Response::json(['ok' => true]);
            return;
        }

        if ($method === 'GET' && $sub === '/quotes') {
            $rows = self::pdo()->query('SELECT * FROM quotes ORDER BY id DESC')->fetchAll();
            Response::json(['quotes' => $rows]);
            return;
        }
        if ($method === 'PUT' && preg_match('#^/quotes/(\d+)$#', $sub, $m)) {
            $b = self::body();
            $status = (string) ($b['status'] ?? '');
            self::pdo()->prepare('UPDATE quotes SET status = ?, updated_at = NOW() WHERE id = ?')
                ->execute([$status, (int) $m[1]]);
            Response::json(['ok' => true]);
            return;
        }

        if ($method === 'GET' && $sub === '/contacts') {
            $rows = self::pdo()->query('SELECT * FROM contact_messages ORDER BY id DESC')->fetchAll();
            Response::json(['contacts' => $rows, 'messages' => $rows]);
            return;
        }
        if ($method === 'PUT' && preg_match('#^/contacts/(\d+)$#', $sub, $m)) {
            $b = self::body();
            $status = (string) ($b['status'] ?? '');
            self::pdo()->prepare('UPDATE contact_messages SET status = ? WHERE id = ?')
                ->execute([$status, (int) $m[1]]);
            Response::json(['ok' => true]);
            return;
        }

        Response::error('Ruta admin no encontrada', 404, ['route' => '/api/admin' . $sub]);
    }

    private static function pdo(): PDO
    {
        return Database::pdo();
    }

    private static function body(): array
    {
        if (self::$bodyCache !== null) {
            return self::$bodyCache;
        }
        $raw = file_get_contents('php://input') ?: '';
        $data = json_decode($raw, true);
        self::$bodyCache = is_array($data) ? $data : [];
        return self::$bodyCache;
    }

    private static function login(): void
    {
        $b = self::body();
        $password = (string) ($b['password'] ?? '');
        if ($password === '') {
            Response::error('Contraseña requerida', 400);
            return;
        }
        $token = Auth::login($password);
        if (!$token) {
            Response::error('Contraseña incorrecta', 401);
            return;
        }
        Response::json(['token' => $token]);
    }

    private static function changePassword(): void
    {
        $token = Auth::bearerToken() ?? '';
        $b = self::body();
        $current = (string) ($b['current_password'] ?? $b['password'] ?? '');
        $next = (string) ($b['new_password'] ?? '');
        if ($current === '' || strlen($next) < 8) {
            Response::error('Contraseña actual y nueva (mín. 8) requeridas');
            return;
        }
        if (!Auth::changePassword($token, $current, $next)) {
            Response::error('Contraseña actual incorrecta', 400);
            return;
        }
        $newToken = Auth::login($next);
        Response::json(['ok' => true, 'token' => $newToken]);
    }

    private static function upload(): void
    {
        if (empty($_FILES['file']) || !is_array($_FILES['file'])) {
            // Some clients use "image"
            $file = $_FILES['image'] ?? null;
        } else {
            $file = $_FILES['file'];
        }
        if (!$file) {
            Response::error('Archivo requerido', 400, ['route' => '/api/admin/upload']);
            return;
        }
        try {
            $result = Upload::store($file, 'auto');
            if (!$result['ok']) {
                Response::error((string) $result['error'], 400, [
                    'route' => '/api/admin/upload',
                    'debug' => (string) $result['error'],
                ]);
                return;
            }
            Response::ok([
                'url' => $result['url'],
                'type' => $result['type'] ?? 'file',
                'converted' => !empty($result['converted']),
            ]);
        } catch (\Throwable $e) {
            Response::error('No se pudo completar la subida', 500, [
                'route' => '/api/admin/upload',
                'debug' => BrandSeo::exceptionDebug($e),
            ]);
        }
    }

    private static function saveSettings(): void
    {
        $b = self::body();
        $fields = [
            'business_name', 'tagline', 'phone_display', 'phone2_display', 'whatsapp_number',
            'email', 'seo_title', 'seo_description', 'linkedin_url', 'instagram_url', 'youtube_url',
        ];
        $sets = [];
        $vals = [];
        foreach ($fields as $f) {
            if (array_key_exists($f, $b)) {
                $sets[] = "$f = ?";
                $vals[] = $b[$f];
            }
        }
        if (!$sets) {
            Response::error('Sin cambios');
            return;
        }
        $sets[] = 'updated_at = NOW()';
        $sql = 'UPDATE site_settings SET ' . implode(', ', $sets) . ' WHERE id = 1';
        self::pdo()->prepare($sql)->execute($vals);
        $row = self::pdo()->query('SELECT * FROM site_settings WHERE id = 1')->fetch();
        Response::json($row ?: ['ok' => true]);
    }

    private static function createCategory(): void
    {
        $b = self::body();
        $name = trim((string) ($b['name'] ?? ''));
        if ($name === '') {
            Response::error('Nombre requerido');
            return;
        }
        $slug = trim((string) ($b['slug'] ?? '')) ?: Slug::unique($name, function (string $s): bool {
            $st = self::pdo()->prepare('SELECT 1 FROM categories WHERE slug = ?');
            $st->execute([$s]);
            return (bool) $st->fetchColumn();
        });
        self::pdo()->prepare(
            'INSERT INTO categories (slug, name, description, seo_title, seo_description, sort_order, is_active)
             VALUES (?, ?, ?, ?, ?, ?, ?)'
        )->execute([
            $slug,
            $name,
            $b['description'] ?? null,
            $b['seo_title'] ?? null,
            $b['seo_description'] ?? null,
            (int) ($b['sort_order'] ?? 100),
            !empty($b['is_active']) || !array_key_exists('is_active', $b) ? 1 : 0,
        ]);
        Response::json(['id' => (int) self::pdo()->lastInsertId(), 'slug' => $slug]);
    }

    private static function updateCategory(int $id): void
    {
        $b = self::body();
        $fields = ['slug', 'name', 'description', 'seo_title', 'seo_description', 'sort_order', 'is_active'];
        self::patch('categories', $id, $b, $fields);
    }

    private static function deleteCategory(int $id): void
    {
        self::pdo()->prepare('DELETE FROM categories WHERE id = ?')->execute([$id]);
        Response::json(['ok' => true]);
    }

    private static function createBrand(): void
    {
        try {
            BrandSeo::ensureColumns(self::pdo());
            $b = BrandSeo::aliasInput(self::body());
            $row = self::normalizeBrandPayload($b, true);
            if ($row === null) {
                return;
            }
            $existing = BrandSeo::existingColumns(self::pdo());
            $cols = [];
            $placeholders = [];
            $vals = [];
            foreach ($row as $key => $val) {
                if (!isset($existing[$key])) {
                    continue;
                }
                $cols[] = '`' . $key . '`';
                $placeholders[] = '?';
                $vals[] = $val;
            }
            self::pdo()->prepare(
                'INSERT INTO brands (' . implode(', ', $cols) . ') VALUES (' . implode(', ', $placeholders) . ')'
            )->execute($vals);
            self::respondBrand((int) self::pdo()->lastInsertId());
        } catch (\Throwable $e) {
            self::brandException($e, 'No se pudo guardar la marca');
        }
    }

    private static function updateBrand(int $id): void
    {
        try {
            BrandSeo::ensureColumns(self::pdo());
            $b = BrandSeo::aliasInput(self::body());
            if (isset($b['gallery']) && is_array($b['gallery'])) {
                $b['gallery_json'] = json_encode($b['gallery']);
            }
            $existing = BrandSeo::existingColumns(self::pdo());
            $writable = [
                'slug', 'name', 'description', 'short_description', 'long_description',
                'logo_url', 'website_url', 'content_html',
                'gallery_json', 'sort_order', 'is_active',
                'subtitle', 'origin_country', 'seo_title', 'seo_description', 'seo_keywords',
                'canonical_url', 'schema_json_ld', 'datasheet_url',
            ];
            $writable = array_values(array_filter($writable, static function (string $f) use ($existing): bool {
                return isset($existing[$f]);
            }));
            if (!array_key_exists('name', $b)) {
                $row = self::patch('brands', $id, $b, $writable, false);
                if ($row === null) {
                    self::brandFail('Sin cambios');
                    return;
                }
                self::respondBrand($id);
                return;
            }
            $b['id'] = $id;
            $row = self::normalizeBrandPayload($b, false);
            if ($row === null) {
                return;
            }
            $saved = self::patch('brands', $id, $row, $writable, false);
            if ($saved === null) {
                self::brandFail('Sin cambios');
                return;
            }
            self::respondBrand($id);
        } catch (\Throwable $e) {
            self::brandException($e, 'No se pudo actualizar la marca');
        }
    }

    private static function respondBrand(int $id): void
    {
        $stmt = self::pdo()->prepare('SELECT * FROM brands WHERE id = ? LIMIT 1');
        $stmt->execute([$id]);
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        if (!is_array($row)) {
            Response::json(BrandSeo::envelope(['id' => $id]));
            return;
        }
        Response::json(BrandSeo::actionResult(BrandSeo::present($row)));
    }

    /** @return array<string, mixed>|null */
    private static function normalizeBrandPayload(array $b, bool $creating): ?array
    {
        $name = trim((string) ($b['name'] ?? ''));
        if ($name === '') {
            self::brandFail('Nombre requerido');
            return null;
        }
        $excludeId = (int) ($b['id'] ?? 0);
        $slugExists = static function (string $s) use ($excludeId): bool {
            $sql = 'SELECT 1 FROM brands WHERE slug = ?';
            $args = [$s];
            if ($excludeId > 0) {
                $sql .= ' AND id <> ?';
                $args[] = $excludeId;
            }
            $st = self::pdo()->prepare($sql);
            $st->execute($args);
            return (bool) $st->fetchColumn();
        };
        $slugInput = trim((string) ($b['slug'] ?? ''));
        $base = $slugInput !== '' ? $slugInput : Slug::makeBrand($name);
        $slug = Slug::unique($base, $slugExists);

        $seoTitle = trim((string) ($b['seo_title'] ?? ''));
        if ($seoTitle === '') {
            $seoTitle = BrandSeo::suggestTitle($name);
        }
        $canonical = trim((string) ($b['canonical_url'] ?? ''));
        if ($canonical === '') {
            $canonical = BrandSeo::defaultCanonical($slug);
        }
        $short = self::nullableString($b, 'short_description');
        if ($short === null) {
            $short = self::nullableString($b, 'description');
        }
        $long = array_key_exists('long_description', $b)
            ? (trim((string) $b['long_description']) ?: null)
            : (array_key_exists('content_html', $b) ? (trim((string) $b['content_html']) ?: null) : null);
        $row = [
            'name' => $name,
            'slug' => $slug,
            'description' => $short,
            'short_description' => $short,
            'long_description' => $long,
            'logo_url' => self::nullableString($b, 'logo_url'),
            'website_url' => self::nullableString($b, 'website_url'),
            'content_html' => $long,
            'gallery_json' => isset($b['gallery'])
                ? json_encode($b['gallery'])
                : (array_key_exists('gallery_json', $b) ? $b['gallery_json'] : null),
            'sort_order' => array_key_exists('sort_order', $b) ? (int) $b['sort_order'] : 100,
            'is_active' => !empty($b['is_active']) || !array_key_exists('is_active', $b) ? 1 : 0,
            'subtitle' => self::nullableString($b, 'subtitle'),
            'origin_country' => self::nullableString($b, 'origin_country'),
            'seo_title' => $seoTitle,
            'seo_description' => self::nullableString($b, 'seo_description'),
            'seo_keywords' => self::nullableString($b, 'seo_keywords'),
            'canonical_url' => $canonical,
            'datasheet_url' => self::nullableString($b, 'datasheet_url'),
        ];
        if (!array_key_exists('content_html', $b) && !array_key_exists('long_description', $b) && !$creating) {
            unset($row['content_html'], $row['long_description']);
        }
        if (!array_key_exists('gallery_json', $b) && !isset($b['gallery'])) {
            unset($row['gallery_json']);
        }
        $schema = trim((string) ($b['schema_json_ld'] ?? ''));
        $row['schema_json_ld'] = $schema === ''
            ? BrandSeo::buildJson($row)
            : BrandSeo::normalizeJsonLd($schema);
        return $row;
    }

    private static function nullableString(array $b, string $key): ?string
    {
        if (!array_key_exists($key, $b) || $b[$key] === null) {
            return null;
        }
        $v = trim((string) $b[$key]);
        return $v === '' ? null : $v;
    }

    private static function deleteBrand(int $id): void
    {
        try {
            self::pdo()->prepare('DELETE FROM brands WHERE id = ?')->execute([$id]);
            Response::json(BrandSeo::envelope(['id' => $id]));
        } catch (\Throwable $e) {
            self::brandException($e, 'No se pudo eliminar la marca');
        }
    }

    private static function brandFail(string $message, int $status = 400, array $data = []): void
    {
        if (!isset($data['route'])) {
            $data['route'] = '/api/admin/brands';
        }
        Response::json(BrandSeo::failResult($message, $data), $status);
    }

    private static function brandException(\Throwable $e, string $userMessage): void
    {
        $status = ($e instanceof \PDOException && (string) $e->getCode() === '23000') ? 409 : 500;
        $error = $status === 409 ? 'El slug de marca ya existe' : $userMessage;
        self::brandFail($error, $status, [
            'debug' => BrandSeo::exceptionDebug($e),
        ]);
    }

    private static function createProduct(): void
    {
        $b = self::body();
        $name = trim((string) ($b['name'] ?? ''));
        $categoryId = (int) ($b['category_id'] ?? 0);
        if ($name === '' || $categoryId <= 0) {
            Response::error('Nombre y categoría requeridos');
            return;
        }
        $slug = trim((string) ($b['slug'] ?? '')) ?: Slug::unique($name, function (string $s): bool {
            $st = self::pdo()->prepare('SELECT 1 FROM products WHERE slug = ?');
            $st->execute([$s]);
            return (bool) $st->fetchColumn();
        });
        self::pdo()->prepare(
            'INSERT INTO products
             (category_id, brand_id, slug, name, description, sale_mode, stock_status, price_clp, image_url,
              is_featured, is_active, seo_title, seo_description, sort_order)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
        )->execute([
            $categoryId,
            isset($b['brand_id']) && $b['brand_id'] !== '' && $b['brand_id'] !== null ? (int) $b['brand_id'] : null,
            $slug,
            $name,
            $b['description'] ?? null,
            $b['sale_mode'] ?? 'quote',
            $b['stock_status'] ?? 'on_request',
            array_key_exists('price_clp', $b) && $b['price_clp'] !== null && $b['price_clp'] !== ''
                ? (int) $b['price_clp'] : null,
            $b['image_url'] ?? null,
            !empty($b['is_featured']) ? 1 : 0,
            !empty($b['is_active']) || !array_key_exists('is_active', $b) ? 1 : 0,
            $b['seo_title'] ?? null,
            $b['seo_description'] ?? null,
            (int) ($b['sort_order'] ?? 100),
        ]);
        Response::json(['id' => (int) self::pdo()->lastInsertId(), 'slug' => $slug]);
    }

    private static function updateProduct(int $id): void
    {
        $b = self::body();
        // Normalize booleans / empty brand
        if (array_key_exists('is_featured', $b)) {
            $b['is_featured'] = !empty($b['is_featured']) ? 1 : 0;
        }
        if (array_key_exists('is_active', $b)) {
            $b['is_active'] = !empty($b['is_active']) ? 1 : 0;
        }
        if (array_key_exists('brand_id', $b) && ($b['brand_id'] === '' || $b['brand_id'] === null)) {
            $b['brand_id'] = null;
        }
        if (array_key_exists('price_clp', $b) && $b['price_clp'] === '') {
            $b['price_clp'] = null;
        }
        $fields = [
            'category_id', 'brand_id', 'slug', 'name', 'description', 'sale_mode', 'stock_status',
            'price_clp', 'image_url', 'is_featured', 'is_active', 'seo_title', 'seo_description', 'sort_order',
        ];
        $sets = ['updated_at = NOW()'];
        $vals = [];
        foreach ($fields as $f) {
            if (array_key_exists($f, $b)) {
                $sets[] = "$f = ?";
                $vals[] = $b[$f];
            }
        }
        if (count($sets) === 1) {
            Response::error('Sin cambios');
            return;
        }
        $vals[] = $id;
        self::pdo()->prepare('UPDATE products SET ' . implode(', ', $sets) . ' WHERE id = ?')->execute($vals);
        $stmt = self::pdo()->prepare('SELECT * FROM products WHERE id = ?');
        $stmt->execute([$id]);
        Response::json($stmt->fetch() ?: ['ok' => true]);
    }

    private static function patch(string $table, int $id, array $body, array $fields, bool $respond = true): ?array
    {
        $sets = [];
        $vals = [];
        foreach ($fields as $f) {
            if (array_key_exists($f, $body)) {
                $val = $body[$f];
                if ($f === 'is_active') {
                    $val = !empty($val) ? 1 : 0;
                }
                $sets[] = "$f = ?";
                $vals[] = $val;
            }
        }
        if (!$sets) {
            if ($respond) {
                Response::error('Sin cambios');
            }
            return null;
        }
        $vals[] = $id;
        self::pdo()->prepare("UPDATE {$table} SET " . implode(', ', $sets) . ' WHERE id = ?')->execute($vals);
        $stmt = self::pdo()->prepare("SELECT * FROM {$table} WHERE id = ?");
        $stmt->execute([$id]);
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        $row = is_array($row) ? $row : null;
        if ($respond) {
            Response::json($row ?: ['ok' => true]);
        }
        return $row;
    }
}
