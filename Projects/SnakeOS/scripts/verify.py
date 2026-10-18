#!/usr/bin/env python3
"""Validate the generated EFI PE/COFF structure and release archive."""
from pathlib import Path
import hashlib
import struct
import sys
import zipfile

ROOT = Path(__file__).resolve().parents[1]
DIST = ROOT / 'dist'


def verify_efi(data: bytes):
    assert len(data) >= 256 and data[:2] == b'MZ', 'Missing DOS/PE header'
    offset = struct.unpack_from('<I', data, 0x3c)[0]
    assert data[offset:offset + 4] == b'PE\0\0', 'Missing PE signature'
    assert struct.unpack_from('<H', data, offset + 4)[0] == 0x8664, 'Expected AMD64'
    optional = offset + 24
    assert struct.unpack_from('<H', data, optional)[0] == 0x20b, 'Expected PE32+'
    assert struct.unpack_from('<H', data, optional + 68)[0] == 10, 'Expected EFI application subsystem'
    assert struct.unpack_from('<I', data, optional + 16)[0] != 0, 'Missing entry point'
    return hashlib.sha256(data).hexdigest()


def main():
    data = (DIST / 'BOOTX64.EFI').read_bytes()
    digest = verify_efi(data)
    release = DIST / 'tiny-snake-os-uefi-release.zip'
    with zipfile.ZipFile(release) as archive:
        assert archive.testzip() is None, 'Corrupt ZIP contents'
        paths = set(archive.namelist())
        assert {'EFI/BOOT/BOOTX64.EFI', 'SHA256SUMS.txt', 'README.md'} <= paths, 'Missing release files'
        assert archive.read('EFI/BOOT/BOOTX64.EFI') == data, 'EFI build and release differ'
        assert f'{digest}  BOOTX64.EFI' in archive.read('SHA256SUMS.txt').decode(), 'Checksum mismatch'
    print(f'PASS: PE32+ AMD64 EFI application, {len(data)} bytes')
    print(f'PASS: Release ZIP contents and SHA256 ({digest})')
    print('Physical UEFI boot, input and shutdown still require testing on target hardware.')

if __name__ == '__main__':
    try:
        main()
    except (OSError, AssertionError, zipfile.BadZipFile) as exc:
        print(f'FAIL: {exc}', file=sys.stderr)
        sys.exit(1)
