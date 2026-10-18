$ErrorActionPreference = 'Stop'
if (Get-Command py -ErrorAction SilentlyContinue) {
  & py -3 "$PSScriptRoot/release.py"
} elseif (Get-Command python -ErrorAction SilentlyContinue) {
  & python "$PSScriptRoot/release.py"
} else { throw 'Python 3 is required.' }
if ($LASTEXITCODE -ne 0) { throw 'Release failed.' }
