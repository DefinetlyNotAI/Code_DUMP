# Read-only checks. No BIOS, disk, or firmware settings are changed.
$ErrorActionPreference = 'Continue'
Write-Host '=== Tiny Snake OS: Host and Firmware ==='
Get-CimInstance Win32_ComputerSystem | Select-Object Manufacturer,Model,SystemType | Format-List
Get-CimInstance Win32_BIOS | Select-Object Manufacturer,SMBIOSBIOSVersion | Format-List
try { 'Secure Boot: ' + (Confirm-SecureBootUEFI) } catch { 'Secure Boot: unavailable (' + $_.Exception.Message + ')' }
Write-Host '=== Build Tools ==='
foreach ($name in @('python','py','clang','lld-link','qemu-system-x86_64')) {
    $tool = Get-Command $name -ErrorAction SilentlyContinue
    if ($tool) { Write-Host ("{0}: {1}" -f $name,$tool.Source) } else { Write-Host ("{0}: not found" -f $name) }
}
Write-Host '=== Removable Volumes (information only) ==='
Get-Volume | Where-Object { $_.DriveLetter -and $_.DriveType -eq 'Removable' } |
    Select-Object DriveLetter,FileSystem,FileSystemLabel,SizeRemaining,Size | Format-Table -AutoSize
Write-Host 'This build needs LLVM clang and lld-link. A prebuilt BOOTX64.EFI is also included.'
