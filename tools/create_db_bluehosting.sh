#!/bin/bash
# Crear BD MySQL LPAEZsis en cPanel / BlueHosting (SSH o Terminal de cPanel).
# Uso:
#   bash create_db_bluehosting.sh
#   DB_PASS='TuClaveSegura' bash create_db_bluehosting.sh
#
# Luego importa:
#   mysql -u "$DB_USER" -p"$DB_PASS" "$DB_NAME" < lpaezsis_bluehosting.sql

set -euo pipefail

# Sufijos sin el prefijo de cPanel (cPanel agrega sistem29_ solo).
DB_SUFFIX="${DB_SUFFIX:-lpaezsis}"
USER_SUFFIX="${USER_SUFFIX:-lpaezsis}"
DB_PASS="${DB_PASS:-}"

if [[ -z "$DB_PASS" ]]; then
  # Genera una clave aleatoria si no pasaste DB_PASS=
  DB_PASS="$(openssl rand -base64 18 | tr -d '/+=' | cut -c1-20)"
  echo "Clave generada automáticamente (guárdala): $DB_PASS"
fi

if ! command -v uapi >/dev/null 2>&1; then
  echo "ERROR: no está 'uapi'. Ejecuta esto en SSH/Terminal de cPanel del hosting."
  exit 1
fi

echo "==> Creando base de datos: ${DB_SUFFIX}"
uapi Mysql create_database name="$DB_SUFFIX"

echo "==> Creando usuario MySQL: ${USER_SUFFIX}"
uapi Mysql create_user name="$USER_SUFFIX" password="$DB_PASS"

echo "==> Asignando privilegios ALL"
uapi Mysql set_privileges_on_database \
  user="$USER_SUFFIX" \
  database="$DB_SUFFIX" \
  privileges='ALL PRIVILEGES'

# Resolver nombres reales con prefijo (sistem29_...)
CPUSER="$(whoami)"
DB_NAME="${CPUSER}_${DB_SUFFIX}"
DB_USER="${CPUSER}_${USER_SUFFIX}"

echo
echo "OK. Credenciales para public_html/src/.env :"
echo "-------------------------------------------"
echo "DB_HOST=localhost"
echo "DB_PORT=3306"
echo "DB_NAME=${DB_NAME}"
echo "DB_USER=${DB_USER}"
echo "DB_PASS=${DB_PASS}"
echo "DB_CHARSET=utf8mb4"
echo "UPLOAD_DIR=/home/${CPUSER}/public_html/prueba1.lpaezsis.cl/img/uploads"
echo "UPLOAD_URL_PREFIX=/img/uploads"
echo "APP_DEBUG=0"
echo "-------------------------------------------"
echo
echo "Importar SQL (sube data/lpaezsis_bluehosting.sql al home y ejecuta):"
echo "mysql -u \"${DB_USER}\" -p'${DB_PASS}' \"${DB_NAME}\" < ~/lpaezsis_bluehosting.sql"
echo
echo "Probar:"
echo "mysql -u \"${DB_USER}\" -p'${DB_PASS}' \"${DB_NAME}\" -e 'SHOW TABLES;'"
