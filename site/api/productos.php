<?php
declare(strict_types=1);

/**
 * Endpoint público plano: GET api/productos.php?brand={id|slug}
 * Respuesta: array de productos (también acepta ?marca= y ?tipo=equipo|repuesto).
 */
if (!isset($_GET['brand']) && isset($_GET['marca'])) {
    $_GET['brand'] = $_GET['marca'];
}
$_GET['__path'] = '/api/productos';
require __DIR__ . '/index.php';
