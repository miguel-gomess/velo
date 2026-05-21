# Script de instalación limpia para Velo (Windows)
$ErrorActionPreference = "Stop"
$root = $PSScriptRoot

Write-Host "=== Velo: instalación ===" -ForegroundColor Cyan

Write-Host "`n[1/3] Backend..." -ForegroundColor Yellow
Set-Location "$root\backend"
if (-not (Test-Path ".env")) {
  Copy-Item ".env.example" ".env"
  Write-Host "  Creado backend/.env — edítalo antes de producción." -ForegroundColor DarkYellow
}
npm install
npm run db:incidencias

Write-Host "`n[2/3] Frontend..." -ForegroundColor Yellow
Set-Location "$root\frontend"
npm install

Write-Host "`n[3/3] Raíz (solo concurrently)..." -ForegroundColor Yellow
Set-Location $root
npm install

Set-Location $root
Write-Host "`n=== Listo. Arranca con: npm run dev ===" -ForegroundColor Green
