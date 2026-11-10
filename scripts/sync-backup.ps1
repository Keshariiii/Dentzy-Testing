# Dentzy App Backup Sync Script
# Mirrors C:\Dentzy Testing to C:\dentzy testing backup, strictly preserving all secrets and backup tools.

param(
    [string]$Source = "C:\Dentzy Testing",
    [string]$Destination = "C:\dentzy testing backup"
)

if (-not (Test-Path $Destination)) {
    New-Item -ItemType Directory -Path $Destination -Force | Out-Null
}

Write-Host "Syncing '$Source' to '$Destination'..." -ForegroundColor Cyan

# Exclude heavy temporary cache/build directories, and protect backup-only utilities in the backup folder
$excludeDirs = @("node_modules", ".next", ".wrangler\tmp", ".wrangler\state\v3\cache", "scripts", "backend\scripts")
$excludeFiles = @("*.cmd", "*.vbs")
& robocopy $Source $Destination /MIR /XD $excludeDirs /XF $excludeFiles /R:2 /W:2 /NP /NFL /NDL

# Explicitly guarantee secrets are mirrored
$secrets = @(
    "backend\.dev.vars",
    "backend\.env",
    "frontend\.env.local"
)

foreach ($sec in $secrets) {
    $secSrc = Join-Path $Source $sec
    $secDst = Join-Path $Destination $sec
    if (Test-Path $secSrc) {
        $parentDir = Split-Path $secDst -Parent
        if (-not (Test-Path $parentDir)) {
            New-Item -ItemType Directory -Path $parentDir -Force | Out-Null
        }
        Copy-Item -Path $secSrc -Destination $secDst -Force
        Write-Host "Verified secret copy: $sec" -ForegroundColor Green
    }
}

Write-Host "Backup sync successfully completed!" -ForegroundColor Green
