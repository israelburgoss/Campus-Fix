# Respaldo de la base de datos MySQL (campusfix)

Guía para respaldar la base de datos `campusfix` (MySQL 8+) que corre en el
servidor Linux, mediante `mysqldump`, con **respaldo programado automático**
vía `cron`.

> **Alcance**: solo la base de datos `campusfix` (MySQL). MongoDB queda fuera de
> este documento.
> **Datos de conexión** (desde `backend/.env`): usuario `campusfix`, base
> `campusfix`, host/puerto `100.94.80.14:3306`. Desde el propio servidor se usa
> `127.0.0.1` (o el socket local).

---

## 1. ¿Para qué sirve este respaldo?

Un respaldo (backup) es una **copia de seguridad** de los datos de la base de
datos en un momento dado. Su propósito es permitirte **recuperar la información**
si ocurre cualquiera de estos escenarios:

- **Pérdida de datos** por borrado accidental (un `DELETE`/`DROP` erróneo).
- **Fallo de hardware** en el disco donde vive MySQL.
- **Corrupción** de la base por un apagón o caída anómala del servicio.
- **Errores en despliegues/migraciones** que dañen la estructura o los datos.
- **Ransomware o acceso malintencionado** que destruya o cifre la información.

Sin un respaldo, un incidente de este tipo puede significar la **pérdida
irrecuperable** de todas las incidencias, usuarios, activos e historial del
campus. Por eso el respaldo debe ser **automático y periódico** (no depende de
que alguien se acuerde de hacerlo a mano) y **verificable** (comprobar que el
archivo sirve para restaurar).

Este documento cubre dos modos:

1. **Manual** — un comando bajo demanda cuando tú lo decidas.
2. **Programado** — un script ejecutado por `cron` todos los días, con rotación
   de archivos antiguos.

---

## 2. ¿Qué es y qué hace `mysqldump`?

`mysqldump` es la **herramienta cliente oficial** de MySQL para generar
respaldos. Su función es conectarse a la base de datos y producir un **archivo
de texto en lenguaje SQL** que contiene todo lo necesario para reconstruir la
base exactamente como estaba en el instante del volcado:

- Las sentencias de estructura: `CREATE DATABASE`, `CREATE TABLE`,
  `CREATE VIEW`, índices, etc.
- Los datos: sentencias `INSERT` con todas las filas.
- Los objetos de programación: **procedimientos almacenados**, **funciones**,
  **triggers** y **eventos** (cuando se indican los flags correspondientes).
- Las opciones de cada tabla (motor, charset, etc.).

Características clave:

- Es un respaldo **lógico** (SQL legible), no binario; por eso es portátil y
  puedes inspeccionarlo con un editor de texto.
- Se ejecuta mientras el servidor sigue en línea (no requiere detener MySQL).
- Con `--single-transaction` obtiene una **foto consistente** de las tablas
  InnoDB sin bloquear a otros usuarios.
- Su salida suele comprimirse con `gzip` para ocupar mucho menos espacio.

En resumen: `mysqldump` "vuelca" la base a un script SQL que, más adelante,
puedes "reproducir" con el cliente `mysql` para dejar la base idéntica al
momento del respaldo.

---

## 3. Requisitos

- Acceso SSH al servidor Linux donde corre MySQL.
- `mysqldump` instalado (paquete `mysql-client` en Debian/Ubuntu; `mariadb-client`
  en algunas distribuciones).
- Credenciales del usuario `campusfix` con permiso para volcar la base.
- Espacio en disco para los dumps comprimidos.

Verifica la versión:

```bash
mysqldump --version
```

---

## 4. Conectarse al servidor

```bash
ssh tu_usuario@100.94.80.14
```

Todo lo siguiente se ejecuta **dentro del servidor**, no en tu equipo local.

---

## 5. El archivo `~/.my.cnf` (credenciales seguras)

### ¿Qué es y por qué es importante?

`~/.my.cnf` es un **archivo de configuración de cliente de MySQL** que vive en
el directorio personal del usuario. MySQL y sus herramientas (`mysql`,
`mysqldump`) lo leen automáticamente al iniciar, de modo que pueden obtener
usuario y contraseña **sin que tengas que escribirlos en la línea de comandos**.

Es **super importante** por dos razones de seguridad:

1. **Evita exponer la contraseña en el historial del shell.** Si ejecutas
   `mysqldump -p ...`, la contraseña puede quedar en `~/.bash_history` o en el
   proceso visible (`ps`). Con `.my.cnf` no aparece en ningún lado.
2. **Permite la autenticación automática en tareas sin terminal.** Un trabajo
   `cron` no tiene una terminal interactiva ni te pedirá la contraseña; gracias
   a `.my.cnf`, el script se autentica solo y el respaldo ocurre sin
   intervención humana.

### Creación

```bash
nano ~/.my.cnf
```

Contenido (ajusta la contraseña real):

```ini
[mysqldump]
host=127.0.0.1
port=3306
user=campusfix
password=AQUI_TU_PASSWORD

[client]
user=campusfix
password=AQUI_TU_PASSWORD
```

### Explicación de cada línea

- `[mysqldump]` — sección de configuración que aplica específicamente a la
  herramienta `mysqldump`.
- `host=127.0.0.1` — dirección del servidor MySQL (localhost, dentro del mismo
  servidor). Si se rechaza, usa la IP real o el socket.
- `port=3306` — puerto donde escucha MySQL.
- `user=campusfix` — usuario con el que se conecta.
- `password=AQUI_TU_PASSWORD` — contraseña del usuario (nunca en la CLI).
- `[client]` — sección genérica para todas las herramientas cliente de MySQL
  (`mysql`, `mysqldump`, etc.). Se incluye para que también `mysql` (p.ej. al
  restaurar o crear la BD) use las mismas credenciales sin pedirlas.

### Permisos de este archivo (crítico)

```bash
chmod 600 ~/.my.cnf
```

`600` significa **solo el dueño puede leer y escribir** (`rw-------`); ni el
grupo ni otros usuarios tienen acceso. Esto es vital porque el archivo contiene
la **contraseña en texto plano**. Si cualquier otro usuario del sistema pudiera
leerlo, comprometería la base de datos. Por eso `600` es obligatorio.

---

## 6. Respaldo manual (bajo demanda)

```bash
mkdir -p ~/backups/mysql
mysqldump --single-transaction \
  --routines --triggers --events \
  --default-character-set=utf8mb4 --quick \
  campusfix | gzip > ~/backups/mysql/campusfix_$(date +%Y%m%d_%H%M%S).sql.gz
```

### Qué hace cada flag

- `--single-transaction` — inicia una transacción coherente (snapshot) para
  InnoDB; el dump es consistente sin bloquear las tablas.
- `--routines` — incluye procedimientos almacenados y funciones.
- `--triggers` — incluye los triggers (necesarios para el historial automático).
- `--events` — incluye los eventos del scheduler, si existen.
- `--default-character-set=utf8mb4` — asegura el charset correcto (emojis,
  acentos, etc.).
- `--quick` — vuelca fila por fila en lugar de cargar toda la tabla en memoria;
  seguro para tablas grandes.
- `campusfix` — la base de datos a volcar.
- `| gzip > ...sql.gz` — comprime la salida al vuelo y la guarda en un archivo
  con marca de tiempo (un dump distinto cada ejecución).

---

## 7. El script de respaldo en Bash

Crea el script en una ubicación del sistema:

```bash
sudo nano /usr/local/bin/backup_mysql.sh
```

Contenido:

```bash
#!/usr/bin/env bash
set -euo pipefail

BACKUP_DIR="/var/backups/mysql"
RETENTION_DAYS=7
LOG_FILE="/var/log/mysql-backup.log"

mkdir -p "$BACKUP_DIR"

TIMESTAMP=$(date +%Y%m%d_%H%M%S)
OUT="$BACKUP_DIR/campusfix_$TIMESTAMP.sql.gz"

mysqldump --single-transaction \
  --routines --triggers --events \
  --default-character-set=utf8mb4 --quick \
  campusfix | gzip > "$OUT"

chmod 600 "$OUT"

find "$BACKUP_DIR" -name 'campusfix_*.sql.gz' -type f -mtime +"$RETENTION_DAYS" -delete

echo "$(date '+%F %T') Backup creado: $OUT" >> "$LOG_FILE"
```

Dale permiso de ejecución:

```bash
sudo chmod +x /usr/local/bin/backup_mysql.sh
```

### Explicación línea por línea

- `#!/usr/bin/env bash` — *shebang*: indica que el sistema debe ejecutar este
  archivo con el intérprete `bash`. Sin esto, el sistema no sabría cómo
  interpretarlo.
- `set -euo pipefail` — activa tres protecciones:
  - `-e` (errexit): si un comando falla, el script se detiene en ese punto.
  - `-u` (nounset): si usas una variable no definida, el script error y sale.
  - `-o pipefail`: en una tubería (`|`), el script falla si **cualquiera** de los
    comandos de la cadena falla (no solo el último). Esto evita generar un dump
    vacío o roto sin que te des cuenta.
- `BACKUP_DIR="/var/backups/mysql"` — variable con la carpeta donde se guardan
  los respaldos.
- `RETENTION_DAYS=7` — variable con la antigüedad (en días) a partir de la cual
  se eliminan los dumps viejos.
- `LOG_FILE="/var/log/mysql-backup.log"` — archivo donde se registra cada
  ejecución.
- `mkdir -p "$BACKUP_DIR"` — crea la carpeta de respaldos si no existe (`-p`
  evita error si ya existe).
- `TIMESTAMP=$(date +%Y%m%d_%H%M%S)` — genera una marca de tiempo tipo
  `20260816_143005` para que cada archivo tenga nombre único.
- `OUT="$BACKUP_DIR/campusfix_$TIMESTAMP.sql.gz"` — ruta completa del archivo
  de salida.
- `mysqldump ... campusfix | gzip > "$OUT"` — ejecuta el volcado (lee credenciales
  desde `~/.my.cnf`) y lo comprime en `$OUT`.
- `chmod 600 "$OUT"` — deja el dump **solo legible/escribible por el dueño**,
  porque contiene datos sensibles (incluye los hashes de contraseñas de
  `usuarios`).
- `find "$BACKUP_DIR" -name 'campusfix_*.sql.gz' -type f -mtime +"$RETENTION_DAYS" -delete`
  — busca los dumps con más de `RETENTION_DAYS` días de antigüedad y los borra,
  implementando la **rotación** (evita llenar el disco con respaldos infinitos).
- `echo "$(date ...) Backup creado: $OUT" >> "$LOG_FILE"` — anexa una línea al
  log con la fecha/hora y el archivo generado, para auditar que el respaldo
  corrió correctamente.

Prueba manualmente antes de programarlo:

```bash
sudo /usr/local/bin/backup_mysql.sh
ls -lh /var/backups/mysql/
```

---

## 8. Programar con cron

### ¿Qué es `cron` y por qué lo usamos?

`cron` es el **programador de tareas** de los sistemas Linux/Unix. Ejecuta
comandos automáticamente en el **momento y la frecuencia** que le indiques,
incluso si nadie ha iniciado sesión. Lo usamos para que el respaldo ocurra
**todos los días a la misma hora sin que tengas que acordarte**, garantizando
que siempre exista una copia reciente.

Edita el crontab (como el usuario que tiene el `~/.my.cnf` correcto):

```bash
crontab -e
```

Agrega esta línea:

```cron
0 2 * * * /usr/local/bin/backup_mysql.sh >> /var/log/mysql-backup.log 2>&1
```

### Significado de cada campo de la línea cron

El formato es:

```
┌──────── minuto (0-59)
│ ┌────── hora (0-23)
│ │ ┌──── día del mes (1-31)
│ │ │ ┌── mes (1-12)
│ │ │ │ ┌ día de la semana (0-7, donde 0 y 7 = domingo)
│ │ │ │ │
0 2 * * *  /usr/local/bin/backup_mysql.sh >> /var/log/mysql-backup.log 2>&1
```

- `0` — **minuto**: se ejecuta en el minuto 0.
- `2` — **hora**: a las 02:00 (formato 24h).
- `*` — **día del mes**: cualquiera (todos los días).
- `*` — **mes**: cualquiera (todos los meses).
- `*` — **día de la semana**: cualquiera (todos los días de la semana).
- `/usr/local/bin/backup_mysql.sh` — el comando a ejecutar.
- `>> /var/log/mysql-backup.log` — **anexa** la salida estándar (`stdout`) al
  archivo de log (no la sobrescribe, `>>` concatena).
- `2>&1` — redirige la salida de error estándar (`stderr`, el `2`) hacia el
  mismo lugar que la salida estándar (`&1`), para que **errores y mensajes**
  queden juntos en el log y puedas depurar fallos.

Verifica que quedó registrado:

```bash
crontab -l
```

> Si lo ejecutas como `root`, asegúrate de que el `~/.my.cnf` usado sea el de
> `root` (`/root/.my.cnf`) o pasa las credenciales explícitamente en el script.

---

## 9. Verificar los respaldos

Listar archivos y tamaños:

```bash
ls -lh /var/backups/mysql/
```

Comprobar la **integridad** de un dump comprimido:

```bash
gunzip -t /var/backups/mysql/campusfix_*.sql.gz && echo "OK: archivo íntegro"
```

Revisar el log:

```bash
tail -n 20 /var/log/mysql-backup.log
```

---

## 10. Restaurar desde un respaldo

Si la base no existe, créala primero:

```bash
mysql -e "CREATE DATABASE campusfix CHARACTER SET utf8mb4;"
```

Restaura desde el dump comprimido:

```bash
gunzip -c /var/backups/mysql/campusfix_YYYYMMDD_HHMMSS.sql.gz | mysql campusfix
```

O desde un dump sin comprimir:

```bash
mysql campusfix < campusfix_YYYYMMDD_HHMMSS.sql
```

> La restauración ejecuta los `INSERT`, `CREATE TABLE`, triggers, procedimientos
> y funciones incluidos en el volcado. Verifica luego con la API
> (`GET /api/health` y un listado de incidencias).

---

## 11. Seguridad y permisos asignados a cada archivo

A lo largo de la guía creamos varios archivos y les asignamos permisos
concretos. Aquí se explica **qué permiso recibe cada uno y por qué**:

| Archivo | Permiso | Significado (`ls`) | ¿Por qué? |
|---------|---------|--------------------|-----------|
| `~/.my.cnf` | `600` | `rw-------` (solo dueño) | Contiene la **contraseña en texto plano**. Si otro usuario del servidor lo leyera, comprometería la BD. Solo el dueño debe poder leerlo/escribirlo. |
| `/usr/local/bin/backup_mysql.sh` | `+x` (ej. `755`) | `rwxr-xr-x` | Debe ser **ejecutable** para poder invocarlo (por `cron` o manualmente). El `+x` lo hace ejecutable; `755` además permite lectura/ejecución a todos pero escritura solo al dueño. |
| Dumps `campusfix_*.sql.gz` | `600` | `rw-------` (solo dueño) | Contienen **todos los datos** de la base (incluye los *hashes* de contraseñas de `usuarios`). Se restringen al dueño para evitar fugas de información. |

Notas de permisos:

- El formato `600` en octal se lee como `6` (dueño: lectura+escritura) `0`
  (grupo: nada) `0` (otros: nada) → `rw-------`.
- `chmod 600` en los dumps se aplica dentro del script (`chmod 600 "$OUT"`) para
  que **cada respaldo nuevo** nazca ya protegido, sin depender de que lo hagas a
  mano.
- Mantén los respaldos **fuera del directorio web** (p.ej. `/var/backups/mysql`,
  no `/var/www`) para que no sean servidos por el servidor web.
- **No los subas a Git**: el `.gitignore` del proyecto ya excluye `*.sql.gz`
  (línea 48) y `.env*`, así que un dump en el repo no se commitearía por
  accidente. De todos modos, guarda los respaldos en el servidor, no en el árbol
  del proyecto.
- **Copia offsite (recomendado)**: replica los dumps a otro host o a un objeto
  de almacenamiento (p.ej. `rsync` a otro servidor, o `aws s3 cp` / equivalente)
  para protegerte ante un fallo de disco.
- El dump **no contiene contraseñas en texto plano**, solo los *hashes* de
  `usuarios.contrasena_hash`. Aun así, trátalo como información sensible.

---

## 12. Resumen de comandos

| Acción | Comando |
|--------|---------|
| Respaldo manual | `mysqldump --single-transaction --routines --triggers --events campusfix \| gzip > archivo.sql.gz` |
| Respaldo programado | `sudo /usr/local/bin/backup_mysql.sh` (vía cron `0 2 * * *`) |
| Verificar integridad | `gunzip -t archivo.sql.gz` |
| Restaurar | `gunzip -c archivo.sql.gz \| mysql campusfix` |

---

## 13. Notas

- Este documento cubre **solo MySQL**. El proyecto también usa MongoDB
  (`campusfix`); si deseas respaldarlo, añade un paso equivalente con
  `mongodump --db campusfix` (y `mongorestore` para recuperar).
- Cambia la contraseña en `~/.my.cnf` si rotas las credenciales de la base.
- Revisa periódicamente el log (`/var/log/mysql-backup.log`) y haz una prueba
  de restauración ocasional para confirmar que los respaldos sirven.
