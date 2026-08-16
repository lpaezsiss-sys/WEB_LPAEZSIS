<?php
declare(strict_types=1);

/**
 * One-shot: ADD products.tipo. Delete / stub after use.
 */
header('Content-Type: application/json; charset=utf-8');

$candidates = [
    dirname(__DIR__, 2) . '/src/bootstrap.php',
    '/home/sistem29/public_html/src/bootstrap.php',
];
$bootstrap = null;
foreach ($candidates as $path) {
    if (is_file($path)) {
        $bootstrap = $path;
        break;
    }
}
if ($bootstrap === null) {
    http_response_code(500);
    echo json_encode(['ok' => false, 'error' => 'bootstrap no encontrado']);
    exit;
}

require_once dirname($bootstrap) . '/polyfills.php';
require $bootstrap;

use Lpaezsis\Database;

try {
    $pdo = Database::pdo();
    $exists = (int) $pdo->query(
        "SELECT COUNT(*) FROM information_schema.COLUMNS
         WHERE TABLE_SCHEMA = DATABASE()
           AND TABLE_NAME = 'products'
           AND COLUMN_NAME = 'tipo'"
    )->fetchColumn();

    $altered = false;
    if ($exists === 0) {
        $pdo->exec(
            "ALTER TABLE `products`
             ADD COLUMN `tipo` ENUM('equipo', 'repuesto') NOT NULL DEFAULT 'equipo'
             AFTER `sale_mode`"
        );
        $altered = true;
    }

    $updatedRepuesto = $pdo->exec(
        "UPDATE `products` SET `tipo` = 'repuesto' WHERE `sale_mode` = 'buy' AND `tipo` <> 'repuesto'"
    );
    $updatedEquipo = $pdo->exec(
        "UPDATE `products` SET `tipo` = 'equipo' WHERE `sale_mode` = 'quote' AND `tipo` <> 'equipo'"
    );

    $counts = $pdo->query(
        "SELECT tipo, COUNT(*) AS n FROM products GROUP BY tipo"
    )->fetchAll();

    echo json_encode([
        'ok' => true,
        'table' => 'products',
        'altered' => $altered,
        'updated_repuesto' => (int) $updatedRepuesto,
        'updated_equipo' => (int) $updatedEquipo,
        'counts' => $counts,
    ], JSON_UNESCAPED_UNICODE);
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode(['ok' => false, 'error' => $e->getMessage()], JSON_UNESCAPED_UNICODE);
}
