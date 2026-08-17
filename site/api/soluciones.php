<?php
declare(strict_types=1);

/**
 * Endpoint público plano: GET api/soluciones.php
 * Respuesta: [{ id, slug, titulo, bullet_*, cta_*, imagen_url, orden }, ...] (máx. 8 activos).
 */
$_GET['__path'] = '/api/soluciones';
require __DIR__ . '/index.php';
