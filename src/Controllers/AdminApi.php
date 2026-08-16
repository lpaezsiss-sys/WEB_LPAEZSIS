<?php
declare(strict_types=1);

namespace Lpaezsis\Controllers;

use Lpaezsis\Auth;
use Lpaezsis\Database;
use Lpaezsis\Response;
use Lpaezsis\Support\Slug;
use Lpaezsis\Support\Upload;
use PDO;

final class AdminApi
{
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
            $rows = self::pdo()->query('SELECT * FROM brands ORDER BY sort_order, name')->fetchAll();
            Response::json(['brands' => $rows]);
            return;
        }
        if ($method === 'POST' && $sub === '/brands') {
            self::createBrand();
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

        if ($method === 'GET' && $sub === '/clientes') {
            $rows = self::pdo()->query(
                'SELECT * FROM clientes ORDER BY orden ASC, nombre ASC'
            )->fetchAll();
            Response::json(['clientes' => $rows]);
            return;
        }
        if ($method === 'POST' && $sub === '/clientes') {
            self::createCliente();
            return;
        }
        if ($method === 'PUT' && preg_match('#^/clientes/(\d+)$#', $sub, $m)) {
            self::updateCliente((int) $m[1]);
            return;
        }
        if ($method === 'DELETE' && preg_match('#^/clientes/(\d+)$#', $sub, $m)) {
            self::deleteCliente((int) $m[1]);
            return;
        }

        if ($method === 'GET' && $sub === '/soluciones') {
            $rows = self::pdo()->query(
                'SELECT * FROM soluciones ORDER BY orden ASC, titulo ASC'
            )->fetchAll();
            Response::json(['soluciones' => $rows]);
            return;
        }
        if ($method === 'POST' && $sub === '/soluciones') {
            self::createSolucion();
            return;
        }
        if ($method === 'PUT' && preg_match('#^/soluciones/(\d+)$#', $sub, $m)) {
            self::updateSolucion((int) $m[1]);
            return;
        }
        if ($method === 'DELETE' && preg_match('#^/soluciones/(\d+)$#', $sub, $m)) {
            self::deleteSolucion((int) $m[1]);
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

        Response::error('Ruta admin no encontrada', 404, ['path' => $sub]);
    }

    private static function pdo(): PDO
    {
        return Database::pdo();
    }

    private static function body(): array
    {
        $raw = file_get_contents('php://input') ?: '';
        $data = json_decode($raw, true);
        return is_array($data) ? $data : [];
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
            Response::error('Archivo requerido');
            return;
        }
        $kind = strtolower((string) ($_POST['kind'] ?? 'auto'));
        if ($kind !== 'image' && $kind !== 'video') {
            $kind = 'auto';
        }
        $result = $kind === 'video'
            ? Upload::storeVideo($file)
            : ($kind === 'image' ? Upload::storeImage($file) : Upload::store($file, 'auto'));
        if (!$result['ok']) {
            Response::error((string) $result['error']);
            return;
        }
        Response::json([
            'url' => $result['url'],
            'type' => $result['type'] ?? ($kind === 'video' ? 'video' : 'image'),
        ]);
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
        $b = self::body();
        $name = trim((string) ($b['name'] ?? ''));
        if ($name === '') {
            Response::error('Nombre requerido');
            return;
        }
        $slug = trim((string) ($b['slug'] ?? '')) ?: Slug::unique($name, function (string $s): bool {
            $st = self::pdo()->prepare('SELECT 1 FROM brands WHERE slug = ?');
            $st->execute([$s]);
            return (bool) $st->fetchColumn();
        });
        self::pdo()->prepare(
            'INSERT INTO brands (slug, name, description, logo_url, website_url, content_html, gallery_json, sort_order, is_active)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'
        )->execute([
            $slug,
            $name,
            $b['description'] ?? null,
            $b['logo_url'] ?? null,
            $b['website_url'] ?? null,
            $b['content_html'] ?? null,
            isset($b['gallery']) ? json_encode($b['gallery']) : ($b['gallery_json'] ?? null),
            (int) ($b['sort_order'] ?? 100),
            !empty($b['is_active']) || !array_key_exists('is_active', $b) ? 1 : 0,
        ]);
        Response::json(['id' => (int) self::pdo()->lastInsertId(), 'slug' => $slug]);
    }

    private static function updateBrand(int $id): void
    {
        $b = self::body();
        if (isset($b['gallery']) && is_array($b['gallery'])) {
            $b['gallery_json'] = json_encode($b['gallery']);
        }
        $fields = ['slug', 'name', 'description', 'logo_url', 'website_url', 'content_html', 'gallery_json', 'sort_order', 'is_active'];
        self::patch('brands', $id, $b, $fields);
    }

    private static function deleteBrand(int $id): void
    {
        self::pdo()->prepare('DELETE FROM brands WHERE id = ?')->execute([$id]);
        Response::json(['ok' => true]);
    }

    private static function createCliente(): void
    {
        $b = self::body();
        $nombre = trim((string) ($b['nombre'] ?? $b['name'] ?? ''));
        $logo = trim((string) ($b['logo_url'] ?? ''));
        if ($nombre === '' || $logo === '') {
            Response::error('nombre y logo_url son requeridos');
            return;
        }
        self::pdo()->prepare(
            'INSERT INTO clientes (nombre, logo_url, orden, activo) VALUES (?, ?, ?, ?)'
        )->execute([
            $nombre,
            $logo,
            (int) ($b['orden'] ?? $b['sort_order'] ?? 0),
            array_key_exists('activo', $b)
                ? (!empty($b['activo']) ? 1 : 0)
                : (array_key_exists('is_active', $b) ? (!empty($b['is_active']) ? 1 : 0) : 1),
        ]);
        Response::json(['id' => (int) self::pdo()->lastInsertId()]);
    }

    private static function updateCliente(int $id): void
    {
        $b = self::body();
        if (isset($b['name']) && !isset($b['nombre'])) {
            $b['nombre'] = $b['name'];
        }
        if (isset($b['sort_order']) && !isset($b['orden'])) {
            $b['orden'] = $b['sort_order'];
        }
        if (array_key_exists('is_active', $b) && !array_key_exists('activo', $b)) {
            $b['activo'] = !empty($b['is_active']) ? 1 : 0;
        }
        if (array_key_exists('activo', $b)) {
            $b['activo'] = !empty($b['activo']) ? 1 : 0;
        }
        $fields = ['nombre', 'logo_url', 'orden', 'activo'];
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
        $vals[] = $id;
        self::pdo()->prepare('UPDATE clientes SET ' . implode(', ', $sets) . ' WHERE id = ?')->execute($vals);
        $stmt = self::pdo()->prepare('SELECT * FROM clientes WHERE id = ?');
        $stmt->execute([$id]);
        Response::json($stmt->fetch() ?: ['ok' => true]);
    }

    private static function deleteCliente(int $id): void
    {
        self::pdo()->prepare('DELETE FROM clientes WHERE id = ?')->execute([$id]);
        Response::json(['ok' => true]);
    }

    private const SOLUCIONES_MAX_ACTIVAS = 8;

    private static function countSolucionesActivas(?int $excludeId = null): int
    {
        if ($excludeId) {
            $stmt = self::pdo()->prepare(
                'SELECT COUNT(*) FROM soluciones WHERE activo = 1 AND id <> ?'
            );
            $stmt->execute([$excludeId]);
            return (int) $stmt->fetchColumn();
        }
        return (int) self::pdo()->query(
            'SELECT COUNT(*) FROM soluciones WHERE activo = 1'
        )->fetchColumn();
    }

    private static function normalizeSolucionPayload(array $b, ?int $id = null): array
    {
        $titulo = trim((string) ($b['titulo'] ?? $b['title'] ?? $b['name'] ?? ''));
        $slugIn = trim((string) ($b['slug'] ?? ''));
        $slug = $slugIn !== ''
            ? Slug::make($slugIn)
            : ($titulo !== ''
                ? Slug::unique($titulo, function (string $candidate) use ($id): bool {
                    $sql = 'SELECT id FROM soluciones WHERE slug = ?';
                    $params = [$candidate];
                    if ($id) {
                        $sql .= ' AND id <> ?';
                        $params[] = $id;
                    }
                    $sql .= ' LIMIT 1';
                    $stmt = self::pdo()->prepare($sql);
                    $stmt->execute($params);
                    return (bool) $stmt->fetch();
                })
                : '');

        $activo = array_key_exists('activo', $b)
            ? (!empty($b['activo']) ? 1 : 0)
            : (array_key_exists('is_active', $b) ? (!empty($b['is_active']) ? 1 : 0) : null);

        return [
            'slug' => $slug,
            'titulo' => $titulo,
            'bullet_1' => self::nullableString($b['bullet_1'] ?? null),
            'bullet_2' => self::nullableString($b['bullet_2'] ?? null),
            'bullet_3' => self::nullableString($b['bullet_3'] ?? null),
            'cta_texto' => self::nullableString($b['cta_texto'] ?? null),
            'cta_url' => self::nullableString($b['cta_url'] ?? null),
            'imagen_url' => self::nullableString($b['imagen_url'] ?? $b['image_url'] ?? null),
            'orden' => (int) ($b['orden'] ?? $b['sort_order'] ?? 0),
            'activo' => $activo,
        ];
    }

    private static function nullableString($value): ?string
    {
        if ($value === null) {
            return null;
        }
        $s = trim((string) $value);
        return $s === '' ? null : $s;
    }

    private static function createSolucion(): void
    {
        $raw = self::body();
        $b = self::normalizeSolucionPayload($raw);
        if ($b['titulo'] === '' || $b['slug'] === '') {
            Response::error('titulo (y slug) son requeridos');
            return;
        }
        $activo = $b['activo'] === null ? 1 : $b['activo'];
        if ($activo === 1 && self::countSolucionesActivas() >= self::SOLUCIONES_MAX_ACTIVAS) {
            Response::error('Máximo ' . self::SOLUCIONES_MAX_ACTIVAS . ' soluciones activas');
            return;
        }
        try {
            self::pdo()->prepare(
                'INSERT INTO soluciones
                  (slug, titulo, bullet_1, bullet_2, bullet_3, cta_texto, cta_url, imagen_url, orden, activo)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
            )->execute([
                $b['slug'],
                $b['titulo'],
                $b['bullet_1'],
                $b['bullet_2'],
                $b['bullet_3'],
                $b['cta_texto'],
                $b['cta_url'],
                $b['imagen_url'],
                $b['orden'],
                $activo,
            ]);
        } catch (\PDOException $e) {
            if ((int) $e->getCode() === 23000 || strpos($e->getMessage(), 'Duplicate') !== false) {
                Response::error('El slug ya existe', 409);
                return;
            }
            throw $e;
        }
        Response::json(['id' => (int) self::pdo()->lastInsertId()]);
    }

    private static function updateSolucion(int $id): void
    {
        $raw = self::body();
        $existing = self::pdo()->prepare('SELECT * FROM soluciones WHERE id = ? LIMIT 1');
        $existing->execute([$id]);
        $row = $existing->fetch();
        if (!$row) {
            Response::error('Solución no encontrada', 404);
            return;
        }

        $merged = array_merge($row, $raw);
        if (isset($raw['title']) && !isset($raw['titulo'])) {
            $merged['titulo'] = $raw['title'];
        }
        if (isset($raw['name']) && !isset($raw['titulo'])) {
            $merged['titulo'] = $raw['name'];
        }
        if (isset($raw['image_url']) && !isset($raw['imagen_url'])) {
            $merged['imagen_url'] = $raw['image_url'];
        }
        if (isset($raw['sort_order']) && !isset($raw['orden'])) {
            $merged['orden'] = $raw['sort_order'];
        }
        if (array_key_exists('is_active', $raw) && !array_key_exists('activo', $raw)) {
            $merged['activo'] = !empty($raw['is_active']) ? 1 : 0;
        }

        $b = self::normalizeSolucionPayload($merged, $id);
        if ($b['titulo'] === '' || $b['slug'] === '') {
            Response::error('titulo (y slug) son requeridos');
            return;
        }

        $activo = $b['activo'] === null ? (int) $row['activo'] : $b['activo'];
        if ($activo === 1 && self::countSolucionesActivas($id) >= self::SOLUCIONES_MAX_ACTIVAS) {
            Response::error('Máximo ' . self::SOLUCIONES_MAX_ACTIVAS . ' soluciones activas');
            return;
        }

        try {
            self::pdo()->prepare(
                'UPDATE soluciones SET
                  slug = ?, titulo = ?, bullet_1 = ?, bullet_2 = ?, bullet_3 = ?,
                  cta_texto = ?, cta_url = ?, imagen_url = ?, orden = ?, activo = ?
                 WHERE id = ?'
            )->execute([
                $b['slug'],
                $b['titulo'],
                $b['bullet_1'],
                $b['bullet_2'],
                $b['bullet_3'],
                $b['cta_texto'],
                $b['cta_url'],
                $b['imagen_url'],
                $b['orden'],
                $activo,
                $id,
            ]);
        } catch (\PDOException $e) {
            if ((int) $e->getCode() === 23000 || strpos($e->getMessage(), 'Duplicate') !== false) {
                Response::error('El slug ya existe', 409);
                return;
            }
            throw $e;
        }

        // Partial toggle-only updates (activo alone) already covered by merge above.
        // If only activo/orden sent without titulo, normalize still has titulo from row.
        $stmt = self::pdo()->prepare('SELECT * FROM soluciones WHERE id = ?');
        $stmt->execute([$id]);
        Response::json($stmt->fetch() ?: ['ok' => true]);
    }

    private static function deleteSolucion(int $id): void
    {
        self::pdo()->prepare('DELETE FROM soluciones WHERE id = ?')->execute([$id]);
        Response::json(['ok' => true]);
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
             (category_id, brand_id, slug, name, description, sale_mode, tipo, stock_status, price_clp, image_url,
              is_featured, is_active, seo_title, seo_description, sort_order)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
        )->execute([
            $categoryId,
            isset($b['brand_id']) && $b['brand_id'] !== '' && $b['brand_id'] !== null ? (int) $b['brand_id'] : null,
            $slug,
            $name,
            $b['description'] ?? null,
            $b['sale_mode'] ?? 'quote',
            self::normalizeProductTipo($b),
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

    private static function normalizeProductTipo(array $b): string
    {
        $tipo = strtolower(trim((string) ($b['tipo'] ?? '')));
        if ($tipo === 'repuesto' || $tipo === 'equipo') {
            return $tipo;
        }
        // Inferencia desde sale_mode si no viene tipo.
        $mode = (string) ($b['sale_mode'] ?? 'quote');
        return $mode === 'buy' ? 'repuesto' : 'equipo';
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
        if (array_key_exists('tipo', $b) || array_key_exists('sale_mode', $b)) {
            $b['tipo'] = self::normalizeProductTipo($b);
        }
        $fields = [
            'category_id', 'brand_id', 'slug', 'name', 'description', 'sale_mode', 'tipo', 'stock_status',
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

    private static function patch(string $table, int $id, array $body, array $fields): void
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
            Response::error('Sin cambios');
            return;
        }
        $vals[] = $id;
        self::pdo()->prepare("UPDATE {$table} SET " . implode(', ', $sets) . ' WHERE id = ?')->execute($vals);
        $stmt = self::pdo()->prepare("SELECT * FROM {$table} WHERE id = ?");
        $stmt->execute([$id]);
        Response::json($stmt->fetch() ?: ['ok' => true]);
    }
}
