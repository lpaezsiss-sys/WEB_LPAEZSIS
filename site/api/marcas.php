<?php
declare(strict_types=1);

/**
 * Endpoint público plano: GET api/marcas.php
 * Respuesta: { marcas: [...], brands: [...] } con aliases ES (nombre, descripcion, activo).
 */
$_GET['__path'] = '/api/marcas';
require __DIR__ . '/index.php';
