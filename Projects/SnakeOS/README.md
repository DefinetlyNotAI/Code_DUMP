# Tiny Snake OS: Native x86-64 UEFI edition

A freestanding UEFI program that boots directly on x86-64 UEFI hardware, draws its own framebuffer UI, plays Snake, and requests firmware shutdown. It does **not** run under Windows, Linux, or a hypervisor when started from a USB drive on a physical PC.

## Architecture and limitations

The included binary is an **EFI application with a tiny game kernel**, not a fully autonomous post-`ExitBootServices()` operating-system kernel. It intentionally keeps UEFI Boot Services active to receive keyboard events and periodic timer events. Graphics use UEFI GOP's mapped framebuffer directly. Shutdown uses `ResetSystem(EfiResetShutdown)`. Because firmware services remain active, this is closer to a bare-metal firmware-hosted micro-OS than a fully independent kernel. Implementing native xHCI/PS2, interrupts, memory management, ACPI parsing and `ExitBootServices()` would be a separate next phase.

UEFI GOP supports only 32-bit RGB/BGR pixel formats in this release. UEFI text keyboard support and GOP display mode availability are firmware dependent. The UI requires at least 640x480. The firmware may not power off in all environments. Mouse buttons are not supported, only keyboard menu buttons. The application does not access the internal SSD.

## Intended hardware

HP Victus 15-fa1xxx, Intel Core i7-13700H, AMI UEFI F.20, Intel Iris Xe (graphics via GOP), PS/2 built-in keyboard (input via UEFI firmware). Secure Boot disabled. The same binary may boot on other x86-64 UEFI systems.

## What is in the ZIP

- `src/main.c`: framebuffer UI, Snake gameplay, EFI entry point
- `src/uefi.h`: minimal UEFI ABI and protocol types
- `src/font.h`: simple 5x7 bitmap font
- `dist/BOOTX64.EFI`: prebuilt native x64 UEFI binary
- `scripts/check.ps1`: read-only Windows hardware, Secure Boot, and tool checks
- `scripts/build.ps1` and `scripts/build.py`: reproducible LLVM-based build
- `scripts/install-usb.ps1`: guarded EFI copy to explicitly selected removable FAT32 USB
- `scripts/release.ps1` and `scripts/release.py`: checksum and release ZIP

## Run natively, without another OS

1. Take a spare USB stick with no data you need. It must already have a FAT32 partition and a drive letter. **The installer does not format or repartition anything**. Format the stick through Windows first if needed, making sure to select the correct removable drive. No installation to your internal SSD is needed.
2. Extract this ZIP. Open PowerShell in the extracted folder.
3. Run `./scripts/check.ps1` to inspect firmware and drives.
4. Run `./scripts/install-usb.ps1 -DriveLetter E` replacing `E` with your USB's actual drive letter. The script verifies it is removable and FAT32, asks you to type INSTALL, and copies `dist/BOOTX64.EFI` to `EFI/BOOT/BOOTX64.EFI`.
5. Shut Windows down, leaving the USB inserted. Power on and use HP's startup menu (commonly Esc, then F9 Boot Device Options). Select the UEFI USB entry.
6. Arrow Up/Down selects menu entries. Enter launches Snake or requests shutdown. In Snake, arrow keys or WASD change direction, Esc returns to the menu, and Enter restarts after losing.

If the drive does not show up as a boot option, check that the USB is FAT32, has `EFI/BOOT/BOOTX64.EFI`, and that UEFI USB boot is enabled.

## Rebuild on Windows

Install LLVM for Windows (both `clang` and `lld-link` on PATH) and Python 3. From project root:

```powershell
./scripts/check.ps1
./scripts/build.ps1
./scripts/release.ps1
```

Outputs: `dist/BOOTX64.EFI`, `dist/SHA256SUMS.txt`, `dist/EFI/BOOT/BOOTX64.EFI`, and `dist/tiny-snake-os-uefi-release.zip`.

The builder uses `clang -target x86_64-pc-windows-msvc`, freestanding mode and `lld-link /subsystem:efi_application`. Neither the Windows SDK nor EDK2 is required.

## Limitations and safety

- This boot option only works with UEFI x64 and Secure Boot disabled, unless the binary is signed/trusted by your firmware.
- A firmware-managed USB boot is not the same as a kernel implementing its own drivers after `ExitBootServices()`.
- The package does not flash firmware, install boot entries, modify partitions, or touch the Windows disk. Do not overwrite an existing EFI bootloader on a USB you use for another purpose.
- The ELF/Mach-O/Linux boot path from the previous legacy-BIOS image is not used here.
- Compiled and validated as PE32+ EFI application. **Real hardware boot has not been verified.**
