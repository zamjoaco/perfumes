# Restaura un backup hecho con backup.ps1. PISA todo lo que haya en la base.
# Uso: .\scripts\restore.ps1 .\backups\perfumes-2026-09-15_2330.sql   (-Force para no pedir confirmación)
#
# Para la app, restaura con psql dentro del contenedor y vuelve a levantar la app.

param([Parameter(Mandatory = $true)][string]$File, [switch]$Force)

$ErrorActionPreference = 'Stop'
Set-Location (Join-Path $PSScriptRoot '..')

if (-not (Test-Path $File)) { throw "No existe el archivo $File" }
$name = Split-Path $File -Leaf

if (-not $Force) {
    Write-Host "Se va a reemplazar TODA la base con $name."
    $answer = Read-Host 'Escribí SI para continuar'
    if ($answer -ne 'SI') { Write-Host 'Cancelado.'; exit 1 }
}

docker compose stop app | Out-Null
docker compose up -d db | Out-Null
docker cp $File "perfumes-db:/tmp/$name"
if ($LASTEXITCODE -ne 0) { throw 'No se pudo copiar el dump al contenedor.' }

# --clean --if-exists en el dump borra y recrea las tablas; -v ON_ERROR_STOP corta ante el primer error.
docker compose exec -T db psql -U postgres -d perfumes -v ON_ERROR_STOP=1 -q -f "/tmp/$name"
if ($LASTEXITCODE -ne 0) { throw 'psql falló al restaurar. La base puede haber quedado a medias: revisá el mensaje de arriba.' }
docker compose exec -T db rm -f "/tmp/$name" | Out-Null

docker compose up -d app | Out-Null
Write-Host "Restaurado $name. La app vuelve a estar en http://localhost:8080"
