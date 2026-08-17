<?php
declare(strict_types=1);

// One-shot: backfill products.industria_id from category / tipo, then self-disable.
$srcDir = is_file(__DIR__ . '/../../src/bootstrap.php')
    ? (__DIR__ . '/../../src')
    : '/home/sistem29/public_html/src';

require $srcDir . '/bootstrap.php';

use Lpaezsis\Database;

header('Content-Type: application/json; charset=utf-8');

try {
    $pdo = Database::pdo();

    $map = [
        'secadores' => 'alimentos-bebidas',
        'turbinas-soplado' => 'alimentos-bebidas',
        'cuchillos-aire' => 'alimentos-bebidas',
        'fin-de-linea' => 'packaging-fin-de-linea',
        'salas-limpias' => 'farmaceutica-salas-limpias',
        'repuestos' => 'mantencion-repuestos',
    ];

    $updatedByCat = 0;
    $st = $pdo->prepare(
        'UPDATE products p
         INNER JOIN categories c ON c.id = p.category_id
         INNER JOIN industrias i ON i.slug = ?
         SET p.industria_id = i.id
         WHERE c.slug = ?'
    );
    foreach ($map as $catSlug => $indSlug) {
        $st->execute([$indSlug, $catSlug]);
        $updatedByCat += (int) $st->rowCount();
    }

    $stRep = $pdo->prepare(
        "UPDATE products p
         INNER JOIN industrias i ON i.slug = 'mantencion-repuestos'
         SET p.industria_id = i.id
         WHERE p.tipo = 'repuesto'"
    );
    $stRep->execute();
    $updatedRep = (int) $stRep->rowCount();

    $counts = $pdo->query(
        'SELECT i.slug, COUNT(p.id) AS n
         FROM industrias i
         LEFT JOIN products p ON p.industria_id = i.id
         GROUP BY i.id, i.slug
         ORDER BY i.orden'
    )->fetchAll();

    @file_put_contents(
        __FILE__,
        "<?php\ndeclare(strict_types=1);\nhttp_response_code(404);\nheader('Content-Type: application/json; charset=utf-8');\necho json_encode(['error' => 'Not found']);\n"
    );

    echo json_encode([
        'ok' => true,
        'updated_by_category' => $updatedByCat,
        'updated_repuestos' => $updatedRep,
        'counts' => $counts,
    ], JSON_UNESCAPED_UNICODE);
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode(['ok' => false, 'error' => $e->getMessage()], JSON_UNESCAPED_UNICODE);
}
