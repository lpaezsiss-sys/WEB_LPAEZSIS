<?php
declare(strict_types=1);

// One-shot: reposition products.tipo AFTER id, then self-disable.
$srcDir = is_file(__DIR__ . '/../../src/bootstrap.php')
    ? (__DIR__ . '/../../src')
    : '/home/sistem29/public_html/src';

require $srcDir . '/bootstrap.php';

use Lpaezsis\Database;

header('Content-Type: application/json; charset=utf-8');

try {
    $pdo = Database::pdo();
    $col = $pdo->query(
        "SELECT ORDINAL_POSITION
         FROM information_schema.COLUMNS
         WHERE TABLE_SCHEMA = DATABASE()
           AND TABLE_NAME = 'products'
           AND COLUMN_NAME = 'tipo'
         LIMIT 1"
    )->fetch();

    if (!$col) {
        http_response_code(500);
        echo json_encode(['ok' => false, 'error' => 'tipo missing']);
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

    // Self-disable after successful run.
    $self = __FILE__;
    @file_put_contents(
        $self,
        "<?php\ndeclare(strict_types=1);\nhttp_response_code(404);\nheader('Content-Type: application/json; charset=utf-8');\necho json_encode(['error' => 'Not found']);\n"
    );

    echo json_encode(['ok' => true, 'moved' => $moved, 'previous_column' => $prev], JSON_UNESCAPED_UNICODE);
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode(['ok' => false, 'error' => $e->getMessage()], JSON_UNESCAPED_UNICODE);
}
