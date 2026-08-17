<?php
/**
 * Reposition products.tipo AFTER id (idempotent).
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
    $col = $pdo->query(
        "SELECT COLUMN_NAME, COLUMN_TYPE, IS_NULLABLE, COLUMN_DEFAULT, ORDINAL_POSITION
         FROM information_schema.COLUMNS
         WHERE TABLE_SCHEMA = DATABASE()
           AND TABLE_NAME = 'products'
           AND COLUMN_NAME = 'tipo'
         LIMIT 1"
    )->fetch();

    if (!$col) {
        echo json_encode(['ok' => false, 'error' => 'column tipo missing'], JSON_UNESCAPED_UNICODE) . PHP_EOL;
        exit;
    }

    $prev = $pdo->query(
        "SELECT COLUMN_NAME
         FROM information_schema.COLUMNS
         WHERE TABLE_SCHEMA = DATABASE()
           AND TABLE_NAME = 'products'
           AND ORDINAL_POSITION = " . ((int) $col['ORDINAL_POSITION'] - 1) . "
         LIMIT 1"
    )->fetchColumn();

    $moved = false;
    if ($prev !== 'id') {
        $pdo->exec(
            "ALTER TABLE `products`
             MODIFY COLUMN `tipo` ENUM('equipo', 'repuesto') NOT NULL DEFAULT 'equipo'
             AFTER `id`"
        );
        $moved = true;
    }

    $order = $pdo->query(
        "SELECT COLUMN_NAME, ORDINAL_POSITION
         FROM information_schema.COLUMNS
         WHERE TABLE_SCHEMA = DATABASE()
           AND TABLE_NAME = 'products'
         ORDER BY ORDINAL_POSITION"
    )->fetchAll();

    echo json_encode([
        'ok' => true,
        'moved' => $moved,
        'previous_column' => $prev,
        'columns' => $order,
    ], JSON_UNESCAPED_UNICODE) . PHP_EOL;
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode(['ok' => false, 'error' => $e->getMessage()], JSON_UNESCAPED_UNICODE) . PHP_EOL;
}
