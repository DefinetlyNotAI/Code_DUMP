#!/usr/bin/env python3
"""Rebuild, verify and package a portable release archive."""
from pathlib import Path
import hashlib
import subprocess
import sys
import zipfile
root = Path(__file__).resolve().parents[1]
subprocess.run([sys.executable, str(root/'scripts/build.py')], check=True)
efi = root/'dist/BOOTX64.EFI'
sha = hashlib.sha256(efi.read_bytes()).hexdigest()
(root/'dist/SHA256SUMS.txt').write_text(f'{sha}  BOOTX64.EFI\n',encoding='utf-8')
(root/'dist/EFI/BOOT').mkdir(parents=True, exist_ok=True)
(root/'dist/EFI/BOOT/BOOTX64.EFI').write_bytes(efi.read_bytes())
zip_path = root/'dist/tiny-snake-os-uefi-release.zip'
with zipfile.ZipFile(zip_path,'w',zipfile.ZIP_DEFLATED) as archive:
    for path in [root/'dist/EFI/BOOT/BOOTX64.EFI',root/'dist/SHA256SUMS.txt',root/'README.md']:
        archive.write(path,path.relative_to(root/'dist') if path.is_relative_to(root/'dist') else path.name)
print('Release:',zip_path)
print('SHA256:',sha)

subprocess.run([sys.executable, str(root/'scripts/verify.py')], check=True)
