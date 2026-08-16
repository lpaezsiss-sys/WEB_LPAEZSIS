<?php
/**
 * CLI/one-shot: create `soluciones` table + seed inicial si está vacía.
 * Usage: php tools/migrate_soluciones.php
 */
declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');

$srcDir = is_file(__DIR__ . '/../src/bootstrap.php')
    ? (__DIR__ . '/../src')
    : '/home/sistem29/public_html/src';

require $srcDir . '/bootstrap.php';

use Lpaezsis\Database;

$seed = [
    [
        'secadores',
        'Secadores',
        'Secado de botellas y envases',
        'Túneles y cabinas de soplado',
        'Sistemas food & beverage',
        'Ver catálogo Secadores',
        'catalogo.html?category=secadores',
        '/img/hero/cans.jpg',
        10,
    ],
    [
        'turbinas-soplado',
        'Turbinas de soplado',
        'Sopladores centrífugos Sonic',
        'Portátiles y fijos',
        'Repuestos de transmisión',
        'Ver catálogo Turbinas de soplado',
        'catalogo.html?category=turbinas-soplado',
        '/img/products/vt-sonic.jpg',
        20,
    ],
    [
        'cuchillos-aire',
        'Cuchillos de aire',
        'Air knives industriales',
        'Manifolds y toberas',
        'Control de recubrimiento',
        'Ver catálogo Cuchillos de aire',
        'catalogo.html?category=cuchillos-aire',
        '/img/hero/conserves.jpg',
        30,
    ],
    [
        'repuestos',
        'Repuestos',
        'Correas y filtros',
        'Silenciadores y HEPA',
        'Piezas de mantención',
        'Ver catálogo Repuestos',
        'catalogo.html?category=repuestos',
        '/img/products/A07-10015.jpg',
        40,
    ],
    [
        'fin-de-linea',
        'Fin de línea',
        'Integración en conveyor',
        'Soplado post-llenado',
        'Soluciones a medida',
        'Ver catálogo Fin de línea',
        'catalogo.html?category=fin-de-linea',
        '/img/hero/line.jpg',
        50,
    ],
    [
        'salas-limpias',
        'Salas limpias',
        'Aire filtrado',
        'Aplicaciones sanitarias',
        'Sistemas de bajo particulado',
        'Ver catálogo Salas limpias',
        'catalogo.html?category=salas-limpias',
        '/img/hero/plant.jpg',
        60,
    ],
];

try {
    $pdo = Database::pdo();
    $pdo->exec(
        "CREATE TABLE IF NOT EXISTS `soluciones` (
          `id` INT AUTO_INCREMENT PRIMARY KEY,
          `slug` VARCHAR(50) NOT NULL UNIQUE,
          `titulo` VARCHAR(150) NOT NULL,
          `bullet_1` VARCHAR(255) DEFAULT NULL,
          `bullet_2` VARCHAR(255) DEFAULT NULL,
          `bullet_3` VARCHAR(255) DEFAULT NULL,
          `cta_texto` VARCHAR(100) DEFAULT NULL,
          `cta_url` VARCHAR(255) DEFAULT NULL,
          `imagen_url` VARCHAR(255) DEFAULT NULL,
          `orden` INT DEFAULT 0,
          `activo` TINYINT(1) DEFAULT 1,
          `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4"
    );

    $count = (int) $pdo->query('SELECT COUNT(*) FROM soluciones')->fetchColumn();
    $seeded = 0;
    if ($count === 0) {
        $stmt = $pdo->prepare(
            'INSERT INTO soluciones
              (slug, titulo, bullet_1, bullet_2, bullet_3, cta_texto, cta_url, imagen_url, orden, activo)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1)'
        );
        foreach ($seed as $row) {
            $stmt->execute($row);
            $seeded++;
        }
        $count = (int) $pdo->query('SELECT COUNT(*) FROM soluciones')->fetchColumn();
    }

    echo json_encode([
        'ok' => true,
        'table' => 'soluciones',
        'rows' => $count,
        'seeded' => $seeded,
    ], JSON_UNESCAPED_UNICODE) . PHP_EOL;
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode(['ok' => false, 'error' => $e->getMessage()], JSON_UNESCAPED_UNICODE) . PHP_EOL;
}
