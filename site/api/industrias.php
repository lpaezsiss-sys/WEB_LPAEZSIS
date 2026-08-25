<?php
declare(strict_types=1);

/**
 * Endpoint público plano: GET api/industrias.php
 * Respuesta: [{ id, slug, nombre, orden, imagen_random }, ...] (máx. 8 activos).
 */
$_GET['__path'] = '/api/industrias';
require __DIR__ . '/index.php';
