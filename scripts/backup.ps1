# Backup de la base de Pefumes a .\backups\perfumes-AAAA-MM-DD_HHmm.sql
# Uso: .\scripts\backup.ps1            (desde la raíz del repo, con la db corriendo)
#
# El dump se escribe DENTRO del contenedor y se copia con docker cp: redirigir con ">" en
# PowerShell 5.1 escribe UTF-16 y psql no lo puede leer al restaurar.
# Respaldá también el .env: sin DB_PASSWORD no se abre el volumen ni el backup sirve de mucho.

$ErrorActionPreference = 'Stop'
Set-Location (Join-Path $PSScriptRoot '..')

$stamp = Get-Date -Format 'yyyy-MM-dd_HHmm'
$file = "perfumes-$stamp.sql"
$dir = 'backups'
if (-not (Test-Path $dir)) { New-Item -ItemType Directory -Path $dir | Out-Null }

docker compose exec -T db pg_dump -U postgres --clean --if-exists --file "/tmp/$file" perfumes
if ($LASTEXITCODE -ne 0) { throw 'pg_dump falló. ¿Está corriendo la base? (docker compose up -d db)' }

docker cp "perfumes-db:/tmp/$file" (Join-Path $dir $file)
if ($LASTEXITCODE -ne 0) { throw 'No se pudo copiar el dump desde el contenedor.' }
docker compose exec -T db rm -f "/tmp/$file" | Out-Null

$size = [math]::Round((Get-Item (Join-Path $dir $file)).Length / 1KB)
Write-Host "Backup listo: $dir\$file ($size KB). Guardalo junto con el .env."
