<?php
declare(strict_types=1);

namespace Lpaezsis\Support;

use Lpaezsis\Config;

final class Upload
{
    public static function storeImage(array $file): array
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
        $map = [
            'image/jpeg' => 'jpg',
            'image/png' => 'png',
            'image/webp' => 'webp',
            'image/gif' => 'gif',
        ];
        if (!isset($map[$mime])) {
            return ['ok' => false, 'error' => 'Solo se permiten JPG, PNG, WEBP o GIF'];
        }
        if (($file['size'] ?? 0) > 5 * 1024 * 1024) {
            return ['ok' => false, 'error' => 'La imagen supera 5 MB'];
        }

        $dir = (string) Config::get('UPLOAD_DIR');
        if (!is_dir($dir) && !mkdir($dir, 0755, true) && !is_dir($dir)) {
            return ['ok' => false, 'error' => 'No se pudo crear carpeta de uploads'];
        }

        $name = 'p-' . bin2hex(random_bytes(8)) . '.' . $map[$mime];
        $dest = rtrim($dir, '/\\') . DIRECTORY_SEPARATOR . $name;
        if (!move_uploaded_file($tmp, $dest)) {
            return ['ok' => false, 'error' => 'Error al guardar la imagen'];
        }

        $prefix = rtrim((string) Config::get('UPLOAD_URL_PREFIX', '/img/uploads'), '/');
        return ['ok' => true, 'url' => $prefix . '/' . $name];
    }
}
