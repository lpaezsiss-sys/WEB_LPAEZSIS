<?php
declare(strict_types=1);

/**
 * Endpoint público plano: GET api/marcas.php[?slug=]
 * Respuesta: { marcas: [...], brands: [...] } o con slug { marca, todas, marcas, brands }.
 */
$_GET['__path'] = '/api/marcas';
require __DIR__ . '/index.php';
