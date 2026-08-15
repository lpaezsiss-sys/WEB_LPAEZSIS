<?php
declare(strict_types=1);

namespace Lpaezsis\Support;

use Lpaezsis\Config;

final class Upload
{
    public static function storeImage(array $file): array
    {
        return self::store($file, 'image');
    }

    public static function storeVideo(array $file): array
    {
        return self::store($file, 'video');
    }

    /**
     * @param array $file $_FILES entry
     * @param string $kind "image"|"video"|"auto"
     */
    public static function store(array $file, string $kind = 'auto'): array
    {
        if (($file['error'] ?? UPLOAD_ERR_NO_FILE) !== UPLOAD_ERR_OK) {
            return ['ok' => false, 'error' => 'No se pudo subir el archivo'];
        }
        $tmp = (string) ($file['tmp_name'] ?? '');
        if ($tmp === '' || !is_uploaded_file($tmp)) {
            return ['ok' => false, 'error' => 'Archivo inválido'];
        }

        $finfo = new \finfo(FILEINFO_MIME_TYPE);
        $mime = $finfo->file($tmp) ?: '';

        $imageMap = [
            'image/jpeg' => 'jpg',
            'image/png' => 'png',
            'image/webp' => 'webp',
            'image/gif' => 'gif',
        ];
        $videoMap = [
            'video/mp4' => 'mp4',
            'video/webm' => 'webm',
        ];

        $isImage = isset($imageMap[$mime]);
        $isVideo = isset($videoMap[$mime]);

        if ($kind === 'image' && !$isImage) {
            return ['ok' => false, 'error' => 'Solo se permiten JPG, PNG, WEBP o GIF'];
        }
        if ($kind === 'video' && !$isVideo) {
            return ['ok' => false, 'error' => 'Solo se permiten MP4 o WEBM'];
        }
        if ($kind === 'auto' && !$isImage && !$isVideo) {
            return ['ok' => false, 'error' => 'Tipo de archivo no permitido'];
        }

        $ext = $isVideo ? $videoMap[$mime] : $imageMap[$mime];
        $maxBytes = $isVideo ? 50 * 1024 * 1024 : 5 * 1024 * 1024;
        if (($file['size'] ?? 0) > $maxBytes) {
            return ['ok' => false, 'error' => $isVideo ? 'El video supera 50 MB' : 'La imagen supera 5 MB'];
        }

        $dir = (string) Config::get('UPLOAD_DIR');
        if (!is_dir($dir) && !mkdir($dir, 0755, true) && !is_dir($dir)) {
            return ['ok' => false, 'error' => 'No se pudo crear carpeta de uploads'];
        }

        $prefixName = $isVideo ? 'v-' : 'p-';
        $name = $prefixName . bin2hex(random_bytes(8)) . '.' . $ext;
        $dest = rtrim($dir, '/\\') . DIRECTORY_SEPARATOR . $name;
        if (!move_uploaded_file($tmp, $dest)) {
            return ['ok' => false, 'error' => 'Error al guardar el archivo'];
        }

        $prefix = rtrim((string) Config::get('UPLOAD_URL_PREFIX', '/img/uploads'), '/');
        return [
            'ok' => true,
            'url' => $prefix . '/' . $name,
            'type' => $isVideo ? 'video' : 'image',
        ];
    }
}
