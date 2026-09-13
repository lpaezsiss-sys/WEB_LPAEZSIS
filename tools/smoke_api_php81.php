#!/usr/bin/env php
<?php
declare(strict_types=1);

/**
 * Smoke de corte PHP 8.1 para la API LPAEZsis.
 *
 * Uso:
 *   php tools/smoke_api_php81.php
 *   php tools/smoke_api_php81.php https://www.lpaezsis.cl
 */

$base = isset($argv[1]) ? rtrim($argv[1], '/') : 'https://www.lpaezsis.cl';

$paths = [
    '/api/health',
    '/api/settings',
    '/api/categories',
    '/api/brands',
    '/api/marcas.php',
    '/api/productos.php?brand=sonic-air-systems',
    '/api/clientes',
    '/api/soluciones',
    '/api/sectores',
    '/api/sectores.php',
    '/api/banners',
    '/api/banners.php',
    '/api/industrias',
    '/api/industrias.php',
    '/api/search.php?q=sonic',
    '/api/repuestos.php',
    '/api/brands/sonic-air-systems',
];

$failed = 0;
echo "Smoke PHP 8.1 @ {$base}\n";

foreach ($paths as $path) {
    $url = $base . $path;
    $ctx = stream_context_create([
        'http' => [
            'method' => 'GET',
            'timeout' => 20,
            'ignore_errors' => true,
            'header' => "Accept: */*\r\n",
        ],
    ]);
    $body = @file_get_contents($url, false, $ctx);
    $status = 0;
    if (isset($http_response_header[0]) && preg_match('/\s(\d{3})\s/', $http_response_header[0], $m)) {
        $status = (int) $m[1];
    }
    $ok = $status >= 200 && $status < 300 && is_string($body) && $body !== '';
    $json = $ok ? json_decode($body, true) : null;
    if ($path === '/api/health' && is_array($json)) {
        $php = $json['php'] ?? '?';
        $active = array_key_exists('php81_active', $json)
            ? (!empty($json['php81_active']) ? 'yes' : 'no')
            : 'n/a';
        $db = $json['db'] ?? '?';
        echo sprintf("[%s] %s  php=%s php81_active=%s db=%s\n", $ok ? 'OK' : 'FAIL', $path, $php, $active, $db);
        // php81_active solo falla si el campo existe y es false (pre-deploy = n/a OK)
        if (array_key_exists('php81_active', $json) && empty($json['php81_active'])) {
            $failed++;
            echo "      !! PHP runtime < 8.1 (recomendado)\n";
        }
        continue;
    }
    if (!$ok || $json === null) {
        $failed++;
        echo sprintf("[FAIL] %s  status=%s\n", $path, $status);
        continue;
    }
    echo sprintf("[OK]   %s  status=%d\n", $path, $status);
}

if ($failed > 0) {
    fwrite(STDERR, "FAILED checks: {$failed}\n");
    exit(1);
}

echo "All checks passed.\n";
exit(0);
