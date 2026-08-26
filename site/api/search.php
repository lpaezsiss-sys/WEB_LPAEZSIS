<?php
declare(strict_types=1);

/**
 * Endpoint público: GET api/search.php?q=
 * Respuesta: [{ id, titulo, slug, tipo, imagen, categoria }, ...]
 */
$_GET['__path'] = '/api/search';
require __DIR__ . '/index.php';
