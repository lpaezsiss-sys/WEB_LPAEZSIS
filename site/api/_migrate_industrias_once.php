<?php
declare(strict_types=1);

// One-shot: create industrias + products.industria_id, then self-disable.
$srcDir = is_file(__DIR__ . '/../../src/bootstrap.php')
    ? (__DIR__ . '/../../src')
    : '/home/sistem29/public_html/src';

require $srcDir . '/bootstrap.php';

use Lpaezsis\Database;

header('Content-Type: application/json; charset=utf-8');

$seed = [
    ['alimentos-bebidas', 'Alimentos y bebidas', 1, 10],
    ['packaging-fin-de-linea', 'Packaging y fin de línea', 1, 20],
    ['farmaceutica-salas-limpias', 'Farmacéutica y salas limpias', 1, 30],
    ['mantencion-repuestos', 'Mantención y repuestos', 1, 40],
];

try {
    $pdo = Database::pdo();

    $pdo->exec(
        "CREATE TABLE IF NOT EXISTS `industrias` (
            `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
            `slug` VARCHAR(50) NOT NULL,
            `nombre` VARCHAR(100) NOT NULL,
            `activo` TINYINT(1) NOT NULL DEFAULT 1,
            `orden` INT NOT NULL DEFAULT 0,
            PRIMARY KEY (`id`),
            UNIQUE KEY `uq_industrias_slug` (`slug`)
         ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci"
    );

    $hasCol = (int) $pdo->query(
        "SELECT COUNT(*) FROM information_schema.COLUMNS
         WHERE TABLE_SCHEMA = DATABASE()
           AND TABLE_NAME = 'products'
           AND COLUMN_NAME = 'industria_id'"
    )->fetchColumn();

    $altered = false;
    if ($hasCol === 0) {
        $hasTipo = (int) $pdo->query(
            "SELECT COUNT(*) FROM information_schema.COLUMNS
             WHERE TABLE_SCHEMA = DATABASE()
               AND TABLE_NAME = 'products'
               AND COLUMN_NAME = 'tipo'"
        )->fetchColumn();
        $after = $hasTipo > 0 ? 'tipo' : 'id';
        $pdo->exec(
            "ALTER TABLE `products`
             ADD COLUMN `industria_id` INT UNSIGNED NULL AFTER `{$after}`"
        );
        $altered = true;
    }

    $hasFk = (int) $pdo->query(
        "SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS
         WHERE TABLE_SCHEMA = DATABASE()
           AND TABLE_NAME = 'products'
           AND CONSTRAINT_NAME = 'fk_products_industria'
           AND CONSTRAINT_TYPE = 'FOREIGN KEY'"
    )->fetchColumn();

    $fkAdded = false;
    if ($hasFk === 0) {
        $pdo->exec(
            "ALTER TABLE `products`
             ADD CONSTRAINT `fk_products_industria`
             FOREIGN KEY (`industria_id`) REFERENCES `industrias`(`id`) ON DELETE SET NULL"
        );
        $fkAdded = true;
    }

    $countBefore = (int) $pdo->query('SELECT COUNT(*) FROM industrias')->fetchColumn();
    $inserted = 0;
    if ($countBefore === 0) {
        $ins = $pdo->prepare(
            'INSERT INTO industrias (slug, nombre, activo, orden) VALUES (?, ?, ?, ?)'
        );
        foreach ($seed as $row) {
            $ins->execute($row);
            $inserted++;
        }
    }

    $rows = $pdo->query(
        'SELECT id, slug, nombre, activo, orden FROM industrias ORDER BY orden ASC, nombre ASC'
    )->fetchAll();

    @file_put_contents(
        __FILE__,
        "<?php\ndeclare(strict_types=1);\nhttp_response_code(404);\nheader('Content-Type: application/json; charset=utf-8');\necho json_encode(['error' => 'Not found']);\n"
    );

    echo json_encode([
        'ok' => true,
        'altered_products' => $altered,
        'fk_added' => $fkAdded,
        'seeded' => $inserted,
        'industrias' => $rows,
    ], JSON_UNESCAPED_UNICODE);
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode(['ok' => false, 'error' => $e->getMessage()], JSON_UNESCAPED_UNICODE);
}
