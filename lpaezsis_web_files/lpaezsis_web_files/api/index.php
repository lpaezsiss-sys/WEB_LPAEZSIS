<?php
declare(strict_types=1);

require dirname(__DIR__, 2) . '/src/bootstrap.php';

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
    // When routed via /api/index.php/health or rewrite to /api/...
    if (preg_match('#/api(?:/index\.php)?(/.*)?$#', $uri, $m)) {
        $path = $m[1] ?? '/';
    } else {
        $path = $uri;
    }
}

if (!str_starts_with($path, '/api')) {
    $path = '/api' . ($path === '/' ? '' : $path);
}

Router::dispatch($_SERVER['REQUEST_METHOD'] ?? 'GET', $path);
