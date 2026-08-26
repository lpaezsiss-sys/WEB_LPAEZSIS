<?php
declare(strict_types=1);

/**
 * Endpoint público plano: GET api/repuestos.php[?q=&brand=&marca=]
 * Solo productos con tipo=repuesto.
 */
$_GET['tipo'] = 'repuesto';
$_GET['__path'] = '/api/repuestos';
require __DIR__ . '/index.php';
