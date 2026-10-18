param(
    [Parameter(Mandatory=$true)]
    [ValidatePattern('^[A-Za-z]$')]
    [string]$DriveLetter
)
$ErrorActionPreference = 'Stop'
$letter = $DriveLetter.ToUpperInvariant()
$volume = Get-Volume -DriveLetter $letter -ErrorAction Stop
if ($volume.DriveType -ne 'Removable') {
    throw 'Refusing to write to a volume that Windows does not identify as removable.'
}
if ($volume.FileSystem -ne 'FAT32') {
    throw 'The selected drive must already use FAT32. No drives are formatted by this script.'
}
$root = Split-Path $PSScriptRoot -Parent
$source = Join-Path $root 'dist/BOOTX64.EFI'
if (-not (Test-Path -LiteralPath $source)) { throw 'Missing dist/BOOTX64.EFI. Run scripts/build.ps1.' }
$targetDir = "${letter}:\EFI\BOOT"
$target = Join-Path $targetDir 'BOOTX64.EFI'
Write-Host "Selected $letter`: ($($volume.FileSystemLabel)), FAT32, removable"
Write-Host "Will install: $target"
if (Test-Path -LiteralPath $target) {
    $existingHash = (Get-FileHash -LiteralPath $target -Algorithm SHA256).Hash
    $newHash = (Get-FileHash -LiteralPath $source -Algorithm SHA256).Hash
    if ($existingHash -eq $newHash) {
        Write-Host 'The USB already contains this exact executable. No changes needed.'
        exit 0
    }
    Write-Host 'An existing UEFI boot file was detected. It will be backed up before replacement.'
}
$answer = Read-Host "Type INSTALL-$letter to confirm"
if ($answer -cne "INSTALL-$letter") { throw 'Cancelled without changing the drive.' }
New-Item -ItemType Directory -Path $targetDir -Force | Out-Null
if (Test-Path -LiteralPath $target) {
    $stamp = Get-Date -Format 'yyyyMMdd-HHmmss'
    $backup = Join-Path $targetDir "BOOTX64.backup-$stamp.EFI"
    if (Test-Path -LiteralPath $backup) { throw "Backup file already exists: $backup" }
    Copy-Item -LiteralPath $target -Destination $backup -ErrorAction Stop
    Write-Host "Existing EFI backed up to: $backup"
}
Copy-Item -LiteralPath $source -Destination $target -Force -ErrorAction Stop
$sourceHash = (Get-FileHash -LiteralPath $source -Algorithm SHA256).Hash
$targetHash = (Get-FileHash -LiteralPath $target -Algorithm SHA256).Hash
if ($sourceHash -ne $targetHash) { throw 'USB copy failed SHA256 verification.' }
Write-Host "Installed and verified SHA256: $sourceHash"
