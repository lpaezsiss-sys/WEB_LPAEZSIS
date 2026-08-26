<?php
declare(strict_types=1);

/**
 * Endpoint público plano: GET api/sectores.php
 * JSON: array de sectores activos ordenados por `orden`.
 * Campos: id, nombre, slug, imagen_url, link_url, orden.
 */
$_GET['__path'] = '/api/sectores';
require __DIR__ . '/index.php';
