<?php
/**
 * Compatibility shim: some bookmarks hit /admin/index.php.
 * The admin UI is a static SPA (index.html). Prefer Apache rewrite;
 * this file is a fallback redirect if PHP is allowed to run.
 */
declare(strict_types=1);
header('Location: ./', true, 301);
exit;
