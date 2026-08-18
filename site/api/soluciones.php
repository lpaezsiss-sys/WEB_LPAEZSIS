<?php
declare(strict_types=1);

/**
 * Endpoint público plano: GET api/soluciones.php
 * Respuesta JSON directa: array de soluciones activas ordenadas por `orden`.
 * Campos: id, titulo, slug, descripcion, imagen, imagen_url, bullet_*, cta_*, orden, activo.
 */
$_GET['__path'] = '/api/soluciones';
require __DIR__ . '/index.php';
