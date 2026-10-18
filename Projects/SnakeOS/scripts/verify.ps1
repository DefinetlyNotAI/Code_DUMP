$ErrorActionPreference = 'Stop'
if (Get-Command py -ErrorAction SilentlyContinue) {
    & py -3 "$PSScriptRoot/verify.py"
} elseif (Get-Command python -ErrorAction SilentlyContinue) {
    & python "$PSScriptRoot/verify.py"
} else { throw 'Python 3 is required.' }
if ($LASTEXITCODE -ne 0) { throw 'Release verification failed.' }
