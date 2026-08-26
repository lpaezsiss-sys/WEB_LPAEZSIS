<?php
declare(strict_types=1);

$candidates = [
    dirname(__DIR__, 2) . '/src/bootstrap.php', // repo root or public_html/src
    dirname(__DIR__) . '/src/bootstrap.php',    // site/src (alternate)
    __DIR__ . '/../../src/bootstrap.php',
];
$bootstrap = null;
foreach ($candidates as $path) {
    if (is_file($path)) {
        $bootstrap = $path;
        break;
    }
}
if ($bootstrap === null) {
    http_response_code(500);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode([
        'error' => 'Falta el backend PHP (src/bootstrap.php)',
        'hint' => 'Sube la carpeta src/ a public_html/src/ en BlueHosting',
        'looked_in' => $candidates,
    ], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

// Polyfills before bootstrap (PHP 7.4 hosts without str_starts_with / str_contains).
require_once dirname($bootstrap) . '/polyfills.php';
require $bootstrap;

use Lpaezsis\Router;

header('X-Content-Type-Options: nosniff');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

$path = $_GET['__path'] ?? ($_SERVER['PATH_INFO'] ?? '');
if ($path === '' || $path === null) {
    $uri = parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH) ?: '/';
    if (preg_match('#/api(?:/index\.php)?(/.*)?$#', $uri, $m)) {
        $path = $m[1] ?? '/';
    } else {
        $path = $uri;
    }
}

if (strncmp((string) $path, '/api', 4) !== 0) {
    $path = '/api' . ($path === '/' ? '' : $path);
}

try {
    Router::dispatch($_SERVER['REQUEST_METHOD'] ?? 'GET', $path);
} catch (Throwable $e) {
    http_response_code(500);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode([
        'error' => 'Error interno del API',
        'detail' => $e->getMessage(),
    ], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
}
