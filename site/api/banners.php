<?php
declare(strict_types=1);

/**
 * Endpoint público plano: GET api/banners.php
 * JSON: array de banners activos ordenados por `orden`.
 */
$_GET['__path'] = '/api/banners';
require __DIR__ . '/index.php';
