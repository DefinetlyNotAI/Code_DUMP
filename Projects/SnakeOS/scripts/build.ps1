$ErrorActionPreference = 'Stop'
$root = Split-Path $PSScriptRoot -Parent
if (Get-Command py -ErrorAction SilentlyContinue) {
    & py -3 "$PSScriptRoot/build.py"
} elseif (Get-Command python -ErrorAction SilentlyContinue) {
    & python "$PSScriptRoot/build.py"
} else { throw 'Python 3 is required to run the build script.' }
if ($LASTEXITCODE -ne 0) { throw 'Build failed.' }
