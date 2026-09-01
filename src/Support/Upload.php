<?php
declare(strict_types=1);

namespace Lpaezsis\Support;

use Lpaezsis\Config;

final class Upload
{
    /** MIME types accepted for product/brand/banner images. */
    private const IMAGE_TYPES = [
        'image/jpeg',
        'image/png',
        'image/webp',
        'image/gif',
        'image/svg+xml',
    ];

    /** File extensions accepted for images (lowercase, no dot). */
    private const IMAGE_EXTS = [
        'jpg',
        'jpeg',
        'png',
        'webp',
        'gif',
        'svg',
    ];

    public static function storeImage(array $file, string $subdir = ''): array
    {
        return self::store($file, 'image', $subdir);
    }

    public static function storeVideo(array $file, string $subdir = ''): array
    {
        return self::store($file, 'video', $subdir);
    }

    /**
     * Sanitiza un nombre de PDF: minúsculas, sin caracteres especiales, espacios → guiones.
     * Ejemplo: "HL7200 Cutsheet Spanish Digital.pdf" → "hl7200-cutsheet-spanish-digital.pdf"
     */
    public static function sanitizePdfFilename(string $originalName): string
    {
        $stem = self::sanitizePdfStem($originalName);
        if ($stem === '') {
            return '';
        }
        return $stem . '.pdf';
    }

    /** Stem sanitizado sin extensión (.pdf). */
    public static function sanitizePdfStem(string $value): string
    {
        $value = basename(str_replace('\\', '/', $value));
        $value = (string) (preg_replace('/\.pdf$/i', '', $value) ?? '');
        $value = trim($value);
        if ($value === '') {
            return '';
        }

        if (class_exists(\Normalizer::class)) {
            $normalized = \Normalizer::normalize($value, \Normalizer::FORM_D);
            if (is_string($normalized) && $normalized !== '') {
                $value = $normalized;
            }
            $value = (string) (preg_replace('/\p{M}/u', '', $value) ?? $value);
        } elseif (function_exists('iconv')) {
            $translit = @iconv('UTF-8', 'ASCII//TRANSLIT//IGNORE', $value);
            if (is_string($translit) && $translit !== '') {
                $value = $translit;
            }
        }

        $value = strtolower($value);
        $value = (string) (preg_replace('/[^a-z0-9]+/', '-', $value) ?? '');
        return trim($value, '-');
    }

    /**
     * Guarda un PDF en img/fichas/ (hermana de img/uploads/).
     * El nombre final se deriva del archivo original sanitizado; $preferredBase es fallback (slug).
     * @param array $file $_FILES entry
     * @param string $preferredBase Nombre preferido sin extensión (slug del producto)
     */
    public static function storePdf(array $file, string $preferredBase = ''): array
    {
        try {
            if (($file['error'] ?? UPLOAD_ERR_NO_FILE) !== UPLOAD_ERR_OK) {
                return ['ok' => false, 'error' => 'No se pudo subir el archivo'];
            }
            $tmp = (string) ($file['tmp_name'] ?? '');
            if ($tmp === '' || !is_uploaded_file($tmp)) {
                return ['ok' => false, 'error' => 'Archivo inválido'];
            }

            $origName = (string) ($file['name'] ?? '');
            if (!preg_match('/\.pdf$/i', $origName)) {
                return ['ok' => false, 'error' => 'Solo se permiten archivos PDF'];
            }

            $mime = self::detectMime($tmp);
            $isPdfMime = in_array($mime, ['application/pdf', 'application/x-pdf'], true)
                || in_array($mime, ['application/octet-stream', 'binary/octet-stream', ''], true);
            if (!$isPdfMime) {
                return ['ok' => false, 'error' => 'Solo se permiten archivos PDF'];
            }
            if (($file['size'] ?? 0) > 15 * 1024 * 1024) {
                return ['ok' => false, 'error' => 'El PDF supera 15 MB'];
            }

            $uploadDir = self::resolveUploadDir();
            $imgRoot = dirname(rtrim($uploadDir, '/\\'));
            $dir = $imgRoot . DIRECTORY_SEPARATOR . 'fichas';
            if (!is_dir($dir) && !mkdir($dir, 0755, true) && !is_dir($dir)) {
                return ['ok' => false, 'error' => 'No se pudo crear carpeta img/fichas', 'dir' => $dir];
            }
            if (!is_writable($dir)) {
                return ['ok' => false, 'error' => 'Carpeta img/fichas sin permiso de escritura', 'dir' => $dir];
            }

            $base = self::sanitizePdfStem($origName);
            if ($base === '') {
                $base = self::sanitizePdfStem($preferredBase);
            }
            if ($base === '') {
                $base = 'ficha-' . bin2hex(random_bytes(6));
            }

            $name = $base . '.pdf';
            $dest = $dir . DIRECTORY_SEPARATOR . $name;

            if (!move_uploaded_file($tmp, $dest)) {
                return ['ok' => false, 'error' => 'Error al guardar el PDF', 'dir' => $dir];
            }

            return [
                'ok' => true,
                'url' => 'img/fichas/' . $name,
                'type' => 'pdf',
            ];
        } catch (\Throwable $e) {
            return ['ok' => false, 'error' => 'Error al subir PDF: ' . $e->getMessage()];
        }
    }

    /**
     * @param array $file $_FILES entry
     * @param string $kind "image"|"video"|"auto"
     * @param string $subdir Optional subdirectory under UPLOAD_DIR (e.g. "sectores")
     */
    public static function store(array $file, string $kind = 'auto', string $subdir = ''): array
    {
        try {
            if (($file['error'] ?? UPLOAD_ERR_NO_FILE) !== UPLOAD_ERR_OK) {
                return ['ok' => false, 'error' => self::uploadErrorMessage((int) ($file['error'] ?? UPLOAD_ERR_NO_FILE))];
            }
            $tmp = (string) ($file['tmp_name'] ?? '');
            if ($tmp === '' || !is_uploaded_file($tmp)) {
                return ['ok' => false, 'error' => 'Archivo inválido'];
            }

            $origName = strtolower((string) ($file['name'] ?? ''));
            $clientExt = strtolower(pathinfo($origName, PATHINFO_EXTENSION));
            $mime = self::detectMime($tmp);

            // Algunos hosts reportan SVG como text/html, text/xml, etc.
            $isSvgName = $clientExt === 'svg';
            if ($isSvgName && in_array($mime, ['image/svg+xml', 'text/plain', 'text/html', 'text/xml', 'application/xml', 'image/svg'], true)) {
                $mime = 'image/svg+xml';
            }

            // MIME vacío / genérico: confiar en extensión (incl. .webp).
            if ($mime === '' || $mime === 'application/octet-stream' || $mime === 'binary/octet-stream') {
                $byExt = [
                    'jpg' => 'image/jpeg',
                    'jpeg' => 'image/jpeg',
                    'png' => 'image/png',
                    'webp' => 'image/webp',
                    'gif' => 'image/gif',
                    'svg' => 'image/svg+xml',
                    'mp4' => 'video/mp4',
                    'webm' => 'video/webm',
                ];
                if (isset($byExt[$clientExt])) {
                    $mime = $byExt[$clientExt];
                }
            }

            $imageMap = [
                'image/jpeg' => 'jpg',
                'image/png' => 'png',
                'image/webp' => 'webp',
                'image/gif' => 'gif',
                'image/svg+xml' => 'svg',
            ];
            $videoMap = [
                'video/mp4' => 'mp4',
                'video/webm' => 'webm',
            ];

            $isImage = isset($imageMap[$mime]);
            $isVideo = isset($videoMap[$mime]);

            if ($kind === 'image' || ($kind === 'auto' && $isImage)) {
                if ($clientExt !== '' && !in_array($clientExt, self::IMAGE_EXTS, true) && !$isSvgName) {
                    // Allow jpeg alias already in IMAGE_EXTS.
                    if (!$isImage) {
                        return ['ok' => false, 'error' => 'Extensión no permitida. Use jpg, png, webp, gif o svg.'];
                    }
                }
            }

            if ($kind === 'image' && !$isImage) {
                return ['ok' => false, 'error' => 'Solo se permiten JPG, PNG, WEBP, GIF o SVG', 'mime' => $mime];
            }
            if ($kind === 'video' && !$isVideo) {
                return ['ok' => false, 'error' => 'Solo se permiten MP4 o WEBM', 'mime' => $mime];
            }
            if ($kind === 'auto' && !$isImage && !$isVideo) {
                return ['ok' => false, 'error' => 'Tipo de archivo no permitido', 'mime' => $mime];
            }

            $ext = $isVideo ? $videoMap[$mime] : $imageMap[$mime];
            // Prefer client .webp/.png when it matches detected MIME family.
            if ($clientExt === 'webp' && $mime === 'image/webp') {
                $ext = 'webp';
            } elseif ($clientExt === 'jpeg' && $mime === 'image/jpeg') {
                $ext = 'jpg';
            }

            $maxBytes = $isVideo ? 50 * 1024 * 1024 : 5 * 1024 * 1024;
            if (($file['size'] ?? 0) > $maxBytes) {
                return ['ok' => false, 'error' => $isVideo ? 'El video supera 50 MB' : 'La imagen supera 5 MB'];
            }

            $dir = self::resolveUploadDir();
            $subdir = trim(str_replace(['..', '\\'], '', $subdir), '/');
            if ($subdir !== '') {
                if (!preg_match('/^[a-z0-9_-]+$/i', $subdir)) {
                    return ['ok' => false, 'error' => 'Subcarpeta de upload inválida'];
                }
                $dir = rtrim($dir, '/\\') . DIRECTORY_SEPARATOR . $subdir;
            }
            if (!is_dir($dir) && !mkdir($dir, 0755, true) && !is_dir($dir)) {
                return ['ok' => false, 'error' => 'No se pudo crear carpeta de uploads', 'dir' => $dir];
            }
            if (!is_writable($dir)) {
                return ['ok' => false, 'error' => 'Carpeta de uploads sin permiso de escritura', 'dir' => $dir];
            }

            $prefixName = $isVideo ? 'v-' : 'p-';
            $name = $prefixName . bin2hex(random_bytes(8)) . '.' . $ext;
            $dest = rtrim($dir, '/\\') . DIRECTORY_SEPARATOR . $name;
            if (!move_uploaded_file($tmp, $dest)) {
                return ['ok' => false, 'error' => 'Error al guardar el archivo', 'dir' => $dir];
            }

            $prefix = rtrim((string) Config::get('UPLOAD_URL_PREFIX', '/img/uploads'), '/');
            $urlPath = $subdir !== '' ? ($prefix . '/' . $subdir . '/' . $name) : ($prefix . '/' . $name);
            return [
                'ok' => true,
                'url' => $urlPath,
                'type' => $isVideo ? 'video' : 'image',
                'dir' => $dir,
            ];
        } catch (\Throwable $e) {
            return ['ok' => false, 'error' => 'Error al subir archivo: ' . $e->getMessage()];
        }
    }

    /**
     * Resolve writable uploads directory for the current host.
     * Production front: public_html/lpaezsis.cl/img/uploads
     * Staging: public_html/prueba1.lpaezsis.cl/img/uploads
     * Local: site/img/uploads
     */
    public static function resolveUploadDir(): string
    {
        $configured = trim((string) Config::get('UPLOAD_DIR', ''));
        $host = strtolower((string) ($_SERVER['HTTP_HOST'] ?? ''));
        // Support/ → src/ → public_html (prod) or repo root (local)
        $root = dirname(__DIR__, 2);

        $candidates = [];
        if (strpos($host, 'prueba1') !== false) {
            $candidates[] = $root . '/prueba1.lpaezsis.cl/img/uploads';
        } else {
            // www / apex production
            $candidates[] = $root . '/lpaezsis.cl/img/uploads';
            $candidates[] = $root . '/img/uploads'; // optional public_html/img/uploads
        }
        $candidates[] = $root . '/site/img/uploads';
        if ($configured !== '') {
            // Prefer host-matched existing dir; otherwise keep configured.
            array_unshift($candidates, $configured);
        }

        foreach ($candidates as $cand) {
            if ($cand === '') {
                continue;
            }
            if (is_dir($cand)) {
                return $cand;
            }
            $parent = dirname($cand);
            if (is_dir($parent) && is_writable($parent)) {
                return $cand;
            }
        }

        return $configured !== '' ? $configured : ($root . '/lpaezsis.cl/img/uploads');
    }

    private static function detectMime(string $tmp): string
    {
        if (!class_exists(\finfo::class)) {
            return '';
        }
        $finfo = new \finfo(FILEINFO_MIME_TYPE);
        $mime = $finfo->file($tmp);
        return is_string($mime) ? $mime : '';
    }

    private static function uploadErrorMessage(int $code): string
    {
        switch ($code) {
            case UPLOAD_ERR_INI_SIZE:
            case UPLOAD_ERR_FORM_SIZE:
                return 'El archivo supera el tamaño máximo permitido';
            case UPLOAD_ERR_PARTIAL:
                return 'La subida se interrumpió (archivo parcial)';
            case UPLOAD_ERR_NO_FILE:
                return 'No se recibió ningún archivo';
            case UPLOAD_ERR_NO_TMP_DIR:
                return 'Falta carpeta temporal en el servidor';
            case UPLOAD_ERR_CANT_WRITE:
                return 'No se pudo escribir el archivo en disco';
            case UPLOAD_ERR_EXTENSION:
                return 'Una extensión de PHP bloqueó la subida';
            default:
                return 'No se pudo subir el archivo';
        }
    }
}
