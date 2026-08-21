<?php
declare(strict_types=1);

namespace Lpaezsis\Controllers;

use Lpaezsis\Database;
use Lpaezsis\Response;
use Lpaezsis\Support\BrandSeo;
use PDO;

final class PublicApi
{
    public static function handle(string $method, string $path): void
    {
        if ($method === 'GET' && ($path === '/api' || $path === '/api/health')) {
            // Controllers live in src/Controllers → parent is src/
            $envPath = dirname(__DIR__) . '/.env';
            $hasEnv = is_file($envPath);
            $dbOk = false;
            $dbError = null;
            try {
                self::pdo()->query('SELECT 1')->fetchColumn();
                $dbOk = true;
            } catch (\Throwable $e) {
                $dbError = $e->getMessage();
            }
            Response::json([
                'ok' => true,
                'service' => 'lpaezsis-api',
                'php' => PHP_VERSION,
                'compat' => '7.4+',
                'env_file' => $hasEnv ? 'found' : 'missing',
                'db' => $dbOk ? 'ok' : 'error',
                'db_error' => $dbOk ? null : $dbError,
            ]);
            return;
        }
        if ($method === 'GET' && $path === '/api/settings') {
            self::settings();
            return;
        }
        if ($method === 'GET' && $path === '/api/categories') {
            self::categories();
            return;
        }
        if ($method === 'GET' && $path === '/api/brands') {
            self::brands();
            return;
        }
        if ($method === 'GET' && preg_match('#^/api/brands/([^/]+)$#', $path, $m)) {
            self::brandDetail(urldecode($m[1]));
            return;
        }
        if ($method === 'GET' && $path === '/api/products') {
            self::products();
            return;
        }
        if ($method === 'GET' && preg_match('#^/api/products/([^/]+)$#', $path, $m)) {
            self::productDetail(urldecode($m[1]));
            return;
        }
        if ($method === 'POST' && $path === '/api/contact') {
            self::contact();
            return;
        }
        if ($method === 'POST' && $path === '/api/quotes') {
            self::quote();
            return;
        }
        if ($method === 'POST' && $path === '/api/orders') {
            self::order();
            return;
        }
        if ($method === 'GET' && ($path === '/api/sitemap.xml' || $path === '/robots.txt')) {
            // Served via .htaccess rewrite; keep simple JSON fallback.
            Response::json(['ok' => true]);
            return;
        }

        Response::error('Ruta no encontrada', 404, ['path' => $path]);
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

    private static function settings(): void
    {
        $row = self::pdo()->query('SELECT * FROM site_settings WHERE id = 1 LIMIT 1')->fetch();
        Response::json($row ?: new \stdClass());
    }

    private static function categories(): void
    {
        $rows = self::pdo()->query(
            'SELECT * FROM categories WHERE is_active = 1 ORDER BY sort_order, name'
        )->fetchAll();
        Response::json(['categories' => $rows]);
    }

    private static function brands(): void
    {
        BrandSeo::ensureColumns(self::pdo());
        $rows = BrandSeo::presentMany(
            self::pdo()->query(
                'SELECT * FROM brands WHERE is_active = 1 ORDER BY sort_order, name'
            )->fetchAll()
        );
        Response::json(BrandSeo::listResult($rows));
    }

    private static function brandDetail(string $slug): void
    {
        BrandSeo::ensureColumns(self::pdo());
        $stmt = self::pdo()->prepare(
            'SELECT * FROM brands WHERE slug = ? AND is_active = 1 LIMIT 1'
        );
        $stmt->execute([$slug]);
        $brand = $stmt->fetch();
        if (!$brand) {
            Response::error('Marca no encontrada', 404);
            return;
        }
        $gallery = [];
        if (!empty($brand['gallery_json'])) {
            $parsed = json_decode((string) $brand['gallery_json'], true);
            if (is_array($parsed)) {
                $gallery = array_values(array_filter(array_map('strval', $parsed)));
            }
        }
        $brand['gallery'] = $gallery;
        $brand = BrandSeo::present($brand);

        $p = self::pdo()->prepare(
            'SELECT p.*, c.slug AS category_slug, c.name AS category_name,
                    b.slug AS brand_slug, b.name AS brand_name
             FROM products p
             LEFT JOIN categories c ON c.id = p.category_id
             LEFT JOIN brands b ON b.id = p.brand_id
             WHERE p.brand_id = ? AND p.is_active = 1
             ORDER BY p.sort_order, p.name'
        );
        $p->execute([(int) $brand['id']]);
        $products = $p->fetchAll();
        Response::json([
            'success' => true,
            'ok' => true,
            'brand' => $brand,
            'products' => $products,
            'data' => ['brand' => $brand, 'products' => $products],
        ]);
    }

    private static function products(): void
    {
        $featured = isset($_GET['featured']) && (string) $_GET['featured'] === '1';
        $sql = 'SELECT p.*, c.slug AS category_slug, c.name AS category_name,
                       b.slug AS brand_slug, b.name AS brand_name
                FROM products p
                LEFT JOIN categories c ON c.id = p.category_id
                LEFT JOIN brands b ON b.id = p.brand_id
                WHERE p.is_active = 1';
        if ($featured) {
            $sql .= ' AND p.is_featured = 1';
        }
        $sql .= ' ORDER BY p.sort_order, p.name';
        $rows = self::pdo()->query($sql)->fetchAll();
        Response::json(['products' => $rows]);
    }

    private static function productDetail(string $slug): void
    {
        $stmt = self::pdo()->prepare(
            'SELECT p.*, c.slug AS category_slug, c.name AS category_name,
                    b.slug AS brand_slug, b.name AS brand_name
             FROM products p
             LEFT JOIN categories c ON c.id = p.category_id
             LEFT JOIN brands b ON b.id = p.brand_id
             WHERE p.slug = ? AND p.is_active = 1
             LIMIT 1'
        );
        $stmt->execute([$slug]);
        $row = $stmt->fetch();
        if (!$row) {
            Response::error('Producto no encontrado', 404);
            return;
        }
        Response::json($row);
    }

    private static function contact(): void
    {
        $b = self::body();
        // Honeypot
        if (!empty($b['website'])) {
            Response::json(['message' => 'Mensaje enviado.']);
            return;
        }
        $name = trim((string) ($b['name'] ?? ''));
        $email = trim((string) ($b['email'] ?? ''));
        $message = trim((string) ($b['message'] ?? ''));
        if ($name === '' || $email === '' || $message === '') {
            Response::error('Completa nombre, email y mensaje');
            return;
        }
        $stmt = self::pdo()->prepare(
            'INSERT INTO contact_messages (name, email, phone, subject, message, status)
             VALUES (?, ?, ?, ?, ?, \'new\')'
        );
        $stmt->execute([
            $name,
            $email,
            trim((string) ($b['phone'] ?? '')) ?: null,
            trim((string) ($b['subject'] ?? '')) ?: null,
            $message,
        ]);
        Response::json(['message' => 'Mensaje enviado.']);
    }

    private static function publicCode(string $prefix): string
    {
        return $prefix . strtoupper(bin2hex(random_bytes(3)));
    }

    private static function quote(): void
    {
        $b = self::body();
        if (!empty($b['website'])) {
            Response::json(['public_code' => self::publicCode('Q')]);
            return;
        }
        $name = trim((string) ($b['customer_name'] ?? ''));
        $email = trim((string) ($b['customer_email'] ?? ''));
        $phone = trim((string) ($b['customer_phone'] ?? ''));
        $items = $b['items'] ?? [];
        if ($name === '' || $email === '' || $phone === '' || !is_array($items) || !$items) {
            Response::error('Datos de cotización incompletos');
            return;
        }

        $pdo = self::pdo();
        $pdo->beginTransaction();
        try {
            $code = self::publicCode('Q');
            $stmt = $pdo->prepare(
                'INSERT INTO quotes (public_code, status, customer_name, customer_email, customer_phone, company_name, message)
                 VALUES (?, \'new\', ?, ?, ?, ?, ?)'
            );
            $stmt->execute([
                $code,
                $name,
                $email,
                $phone,
                trim((string) ($b['company_name'] ?? '')) ?: null,
                trim((string) ($b['message'] ?? '')) ?: null,
            ]);
            $quoteId = (int) $pdo->lastInsertId();
            $itemStmt = $pdo->prepare(
                'INSERT INTO quote_items (quote_id, product_id, product_name, sale_mode, qty)
                 VALUES (?, ?, ?, ?, ?)'
            );
            $prod = $pdo->prepare('SELECT id, name, sale_mode FROM products WHERE id = ? LIMIT 1');
            foreach ($items as $item) {
                $pid = isset($item['product_id']) ? (int) $item['product_id'] : 0;
                $qty = max(1, (int) ($item['qty'] ?? 1));
                $prod->execute([$pid]);
                $p = $prod->fetch();
                if (!$p) {
                    continue;
                }
                $itemStmt->execute([
                    $quoteId,
                    (int) $p['id'],
                    $p['name'],
                    $p['sale_mode'] ?: 'quote',
                    $qty,
                ]);
            }
            $pdo->commit();
            Response::json(['public_code' => $code]);
        } catch (\Throwable $e) {
            $pdo->rollBack();
            throw $e;
        }
    }

    private static function order(): void
    {
        $b = self::body();
        if (!empty($b['website'])) {
            Response::json(['public_code' => self::publicCode('O')]);
            return;
        }
        $name = trim((string) ($b['customer_name'] ?? ''));
        $email = trim((string) ($b['customer_email'] ?? ''));
        $phone = trim((string) ($b['customer_phone'] ?? ''));
        $items = $b['items'] ?? [];
        if ($name === '' || $email === '' || $phone === '' || !is_array($items) || !$items) {
            Response::error('Datos del pedido incompletos');
            return;
        }

        $pdo = self::pdo();
        $pdo->beginTransaction();
        try {
            $code = self::publicCode('O');
            $subtotal = 0;
            $lines = [];
            $prod = $pdo->prepare(
                'SELECT id, name, price_clp, sale_mode FROM products WHERE id = ? AND is_active = 1 LIMIT 1'
            );
            foreach ($items as $item) {
                $pid = isset($item['product_id']) ? (int) $item['product_id'] : 0;
                $qty = max(1, (int) ($item['qty'] ?? 1));
                $prod->execute([$pid]);
                $p = $prod->fetch();
                if (!$p || ($p['sale_mode'] ?? '') !== 'buy') {
                    continue;
                }
                $unit = (int) ($p['price_clp'] ?? 0);
                $line = $unit * $qty;
                $subtotal += $line;
                $lines[] = [
                    'product_id' => (int) $p['id'],
                    'product_name' => $p['name'],
                    'unit_price_clp' => $unit,
                    'qty' => $qty,
                    'line_total_clp' => $line,
                ];
            }
            if (!$lines) {
                $pdo->rollBack();
                Response::error('No hay ítems comprables en el pedido');
                return;
            }

            $stmt = $pdo->prepare(
                'INSERT INTO orders (public_code, status, customer_name, customer_email, customer_phone, company_name, address, notes, subtotal_clp)
                 VALUES (?, \'new\', ?, ?, ?, ?, ?, ?, ?)'
            );
            $stmt->execute([
                $code,
                $name,
                $email,
                $phone,
                trim((string) ($b['company_name'] ?? '')) ?: null,
                trim((string) ($b['address'] ?? '')) ?: null,
                trim((string) ($b['notes'] ?? '')) ?: null,
                $subtotal,
            ]);
            $orderId = (int) $pdo->lastInsertId();
            $itemStmt = $pdo->prepare(
                'INSERT INTO order_items (order_id, product_id, product_name, unit_price_clp, qty, line_total_clp)
                 VALUES (?, ?, ?, ?, ?, ?)'
            );
            foreach ($lines as $line) {
                $itemStmt->execute([
                    $orderId,
                    $line['product_id'],
                    $line['product_name'],
                    $line['unit_price_clp'],
                    $line['qty'],
                    $line['line_total_clp'],
                ]);
            }
            $pdo->commit();
            Response::json(['public_code' => $code]);
        } catch (\Throwable $e) {
            $pdo->rollBack();
            throw $e;
        }
    }
}
