#!/usr/bin/env python3
"""Build a freestanding x64 UEFI executable with Clang and LLD."""
from pathlib import Path
import shutil
import subprocess
import sys
ROOT = Path(__file__).resolve().parents[1]
DIST = ROOT / 'dist'

def tool(name, override=None):
    import os
    found = os.environ.get(override, '') if override else ''
    return found or shutil.which(name)

def main():
    clang, link = tool('clang', 'CLANG'), tool('lld-link', 'LLD_LINK')
    if not clang or not link:
        print('Missing clang or lld-link. Install LLVM and add it to PATH.', file=sys.stderr)
        return 1
    DIST.mkdir(exist_ok=True)
    obj = DIST/'main.obj'
    cmd = [clang, '-target', 'x86_64-pc-windows-msvc', '-ffreestanding', '-fshort-wchar',
           '-fno-stack-protector', '-fno-builtin', '-mno-red-zone', '-O2',
           '-Wall', '-Wextra', '-Werror', '-c', str(ROOT/'src/main.c'), '-o', str(obj)]
    print('Compile:', ' '.join(cmd), flush=True)
    subprocess.run(cmd, check=True)
    out = DIST/'BOOTX64.EFI'
    cmd = [link, '/nologo', '/subsystem:efi_application', '/entry:efi_main', '/nodefaultlib',
           '/machine:x64', f'/out:{out}', str(obj)]
    print('Link:', ' '.join(cmd), flush=True)
    subprocess.run(cmd, check=True)
    data = out.read_bytes()
    pe_offset = int.from_bytes(data[0x3c:0x40],'little')
    assert data[:2]==b'MZ' and data[pe_offset:pe_offset+4]==b'PE\0\0'
    subsystem = int.from_bytes(data[pe_offset+24+68:pe_offset+24+70], 'little')
    assert subsystem==10, f'Expected EFI application subsystem (10), got {subsystem}'
    print(f'Built {out} ({len(data)} bytes), PE/COFF EFI subsystem verified.')
    return 0

if __name__=='__main__':
    try: sys.exit(main())
    except (OSError, subprocess.CalledProcessError, AssertionError) as error:
        print(error, file=sys.stderr)
        sys.exit(1)
