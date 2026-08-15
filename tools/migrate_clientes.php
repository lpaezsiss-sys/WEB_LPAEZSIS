<?php
/**
 * CLI/one-shot: create `clientes` table.
 * Usage on server (from public_html/src): php ../tools/migrate_clientes.php
 * Or hit once via temporary web wrapper then delete.
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
    $pdo->exec(
        "CREATE TABLE IF NOT EXISTS `clientes` (
          `id` INT AUTO_INCREMENT PRIMARY KEY,
          `nombre` VARCHAR(150) NOT NULL,
          `logo_url` VARCHAR(255) NOT NULL,
          `orden` INT DEFAULT 0,
          `activo` TINYINT(1) DEFAULT 1,
          `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4"
    );
    $count = (int) $pdo->query('SELECT COUNT(*) FROM clientes')->fetchColumn();
    echo json_encode(['ok' => true, 'table' => 'clientes', 'rows' => $count], JSON_UNESCAPED_UNICODE) . PHP_EOL;
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode(['ok' => false, 'error' => $e->getMessage()], JSON_UNESCAPED_UNICODE) . PHP_EOL;
}
