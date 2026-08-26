<?php
declare(strict_types=1);

/**
 * Endpoint público plano: GET api/clientes.php
 * Respuesta: [{ id, nombre, logo_url }, ...] (solo activos).
 */
$_GET['__path'] = '/api/clientes';
require __DIR__ . '/index.php';
