# Save SSH private keys into text files named by the key's SHA256 fingerprint.
# WARNING: this writes private key material to disk. Only run if you own the keys.
# Files are created in $env:USERPROFILE\ssh_priv_exports by default.

$sshDir = Join-Path $env:USERPROFILE ".ssh"
$outDir = Join-Path $env:USERPROFILE "ssh_priv_exports"

if (-not (Test-Path $sshDir)) {
    Write-Error "No SSH folder found at $sshDir"
    exit 1
}

if (-not (Test-Path $outDir)) {
    New-Item -ItemType Directory -Path $outDir | Out-Null
}

# files to ignore
$ignore = @("known_hosts","authorized_keys","config")

# candidate private files (non .pub)
$candidates = Get-ChildItem -Path $sshDir -File -ErrorAction SilentlyContinue |
    Where-Object {
        ($_.Extension -ne ".pub") -and
        (-not ($ignore -contains $_.Name))
    }

if ($candidates.Count -eq 0) {
    Write-Host "No candidate private key files found in $sshDir"
    exit 0
}

foreach ($f in $candidates) {
    try {
        $raw = Get-Content -Raw -Path $f.FullName -ErrorAction Stop
    } catch {
        Write-Warning "Cannot read $($f.FullName): $_"
        continue
    }

    # quick header check for likely private key formats
    if (-not ($raw -match "-----BEGIN .*PRIVATE KEY-----")) {
        Write-Host "Skipping likely non-key file: $($f.Name)"
        continue
    }

    # attempt to derive public key from the private key
    $pub = $null
    try {
        $pub = & ssh-keygen -y -f $f.FullName 2>&1
        if ($LASTEXITCODE -ne 0) {
            throw "ssh-keygen returned exit code $LASTEXITCODE"
        }
    } catch {
        Write-Warning "Could not extract public key from $($f.Name). It may be passphrase protected. Skipping."
        continue
    }

    # compute fingerprint from the public key text
    $fingerprintLine = $null
    try {
        $fingerprintLine = ($pub | ssh-keygen -lf - -E sha256 2>$null)
        if (-not $fingerprintLine) {
            throw "Failed to compute fingerprint"
        }
    } catch {
        Write-Warning "Failed to compute fingerprint for $($f.Name): $_"
        continue
    }

    # extract the fingerprint token, e.g. "SHA256:abcd..."
    if ($fingerprintLine -match "SHA256:([A-Za-z0-9+/=]+)") {
        $fp = "SHA256:$($matches[1])"
    } else {
        $fp = $fingerprintLine.Trim()
    }

    # sanitize filename: replace characters not allowed in filenames
    $safeName = $fp -replace "[:\\/]", "_"
    $safeName = $safeName -replace "\s+", "_"
    $outFile = Join-Path $outDir ("$safeName.txt")

    # construct output content
    $outContent = @()
    $outContent += "### Exported private key file"
    $outContent += "Source file: $($f.FullName)"
    $outContent += "Fingerprint: $fp"
    $outContent += "Public key (derived):"
    $outContent += $pub.Trim()
    $outContent += ""
    $outContent += "----- BEGIN PRIVATE KEY CONTENT -----"
    $outContent += $raw.TrimEnd()
    $outContent += "----- END PRIVATE KEY CONTENT -----"
    $outContent = $outContent -join "`n"

    try {
        $outContent | Out-File -FilePath $outFile -Encoding ascii -Force
        Write-Host "Wrote $outFile"
    } catch {
        Write-Warning "Failed to write $outFile : $_"
    }
}

Write-Host ""
Write-Host "Done. Move the files in $outDir to a secure vault and remove local copies when finished."
Write-Host "Clear clipboard and remove temp files as needed."
