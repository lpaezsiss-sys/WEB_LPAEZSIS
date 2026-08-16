<?php
/**
 * Add products.tipo ENUM('equipo','repuesto') + backfill from sale_mode.
 */
declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');

$srcDir = is_file(__DIR__ . '/../src/bootstrap.php')
    ? (__DIR__ . '/../src')
    : '/home/sistem29/public_html/src';

require $srcDir . '/bootstrap.php';

use Lpaezsis\Database;

try {
    $pdo = Database::pdo();
    $exists = $pdo->query(
        "SELECT COUNT(*) FROM information_schema.COLUMNS
         WHERE TABLE_SCHEMA = DATABASE()
           AND TABLE_NAME = 'products'
           AND COLUMN_NAME = 'tipo'"
    )->fetchColumn();

    $altered = false;
    if ((int) $exists === 0) {
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
        'column' => 'tipo',
        'altered' => $altered,
        'updated_repuesto' => (int) $updatedRepuesto,
        'updated_equipo' => (int) $updatedEquipo,
        'counts' => $counts,
    ], JSON_UNESCAPED_UNICODE) . PHP_EOL;
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode(['ok' => false, 'error' => $e->getMessage()], JSON_UNESCAPED_UNICODE) . PHP_EOL;
}
