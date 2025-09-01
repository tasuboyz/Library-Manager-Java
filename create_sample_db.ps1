# Script PowerShell per creare un file SQLite e popolare con seed.sql
# Richiede sqlite3 CLI. Se non disponibile, lo script mostra come usare il file seed.sql altrove.

param(
    [string]$DbFile = "$PSScriptRoot\sample_books.db",
    [string]$SeedSql = "$PSScriptRoot\data\seed.sql"
)

if (-not (Get-Command sqlite3 -ErrorAction SilentlyContinue)) {
    Write-Host "sqlite3 non trovato. Scarica sqlite3 o esegui il file SQL su un altro ambiente che ha sqlite3." -ForegroundColor Yellow
    Write-Host "Il file SQL si trova in: $SeedSql"
    exit 1
}

if (Test-Path $DbFile) { Remove-Item $DbFile -Force }

# Esegui seed
& sqlite3 $DbFile < $SeedSql

if (Test-Path $DbFile) {
    Write-Host "Database creato: $DbFile" -ForegroundColor Green
} else {
    Write-Host "Errore nella creazione del DB" -ForegroundColor Red
}
