from __future__ import annotations

import hashlib
import json
import os
import platform
import shutil
import subprocess
import ctypes
from dataclasses import asdict

from .types import DeviceComponent, DeviceProfile


def _run_powershell(command: str) -> str:
    try:
        output = subprocess.check_output(
            ["powershell", "-NoProfile", "-Command", f"{command} | Out-String"],
            stderr=subprocess.DEVNULL,
            text=True,
            timeout=5,
        )
        return output.strip()
    except Exception:
        return ""


def _detect_gpu_label() -> str:
    output = _run_powershell(
        "(Get-CimInstance Win32_VideoController | Select-Object -First 1 -ExpandProperty Name)"
    )
    return output or "Unknown GPU"


def _detect_storage_gb() -> int:
    total, _, _ = shutil.disk_usage(os.path.abspath(os.sep))
    return round(total / (1024**3))


def build_device_profile() -> DeviceProfile:
    ram_gb = _detect_ram_gb()
    cpu_label = platform.processor() or platform.uname().processor or "Unknown CPU"
    gpu_label = _detect_gpu_label()
    storage_gb = _detect_storage_gb()
    components = [
        DeviceComponent("cpu", cpu_label, "compute", 1.0, "Main arithmetic heart"),
        DeviceComponent("ram", f"{ram_gb} GB RAM", "memory", min(ram_gb / 32.0, 2.0), "Volatile memory plains"),
        DeviceComponent("gpu", gpu_label, "graphics", 1.2, "Parallel rendering furnaces"),
        DeviceComponent("storage", f"{storage_gb} GB Storage", "storage", min(storage_gb / 1024.0, 2.0), "Persistent vaults"),
        DeviceComponent("motherboard", "Motherboard", "fabric", 1.0, "Interconnect basin"),
        DeviceComponent("network", "Network Interfaces", "network", 0.8, "Signal coast"),
        DeviceComponent("audio", "Audio Stack", "io", 0.4, "Resonance fields"),
        DeviceComponent("usb", "USB Bus", "io", 0.5, "Peripheral roads"),
        DeviceComponent("firmware", "Firmware / BIOS", "firmware", 0.6, "Ancient root sanctum"),
        DeviceComponent("filesystem", "Filesystem", "software", 0.9, "Archive maze"),
        DeviceComponent("drivers", "Device Drivers", "software", 0.8, "Translator marches"),
        DeviceComponent("cooling", "Cooling", "thermal", 0.7, "Wind corridors"),
        DeviceComponent("power", "Power Delivery", "power", 0.8, "Storm spine"),
        DeviceComponent("display", "Display Chain", "graphics", 0.5, "Light terraces"),
        DeviceComponent("input", "Input Devices", "io", 0.5, "Gesture commons"),
    ]
    profile = DeviceProfile(
        machine_name=platform.node() or "Simulated Host",
        os_name=f"{platform.system()} {platform.release()}",
        architecture=platform.machine() or "unknown",
        cpu_label=cpu_label,
        ram_gb=ram_gb,
        gpu_label=gpu_label,
        storage_gb=storage_gb,
        components=components,
    )
    digest = hashlib.sha256(json.dumps(asdict(profile), sort_keys=True).encode("utf-8")).hexdigest()
    profile.signature = digest[:16]
    return profile


def _detect_ram_gb() -> int:
    if os.name == "nt":
        class MemoryStatus(ctypes.Structure):
            _fields_ = [
                ("length", ctypes.c_ulong),
                ("memory_load", ctypes.c_ulong),
                ("total_phys", ctypes.c_ulonglong),
                ("avail_phys", ctypes.c_ulonglong),
                ("total_page_file", ctypes.c_ulonglong),
                ("avail_page_file", ctypes.c_ulonglong),
                ("total_virtual", ctypes.c_ulonglong),
                ("avail_virtual", ctypes.c_ulonglong),
                ("avail_extended_virtual", ctypes.c_ulonglong),
            ]

        status = MemoryStatus()
        status.length = ctypes.sizeof(MemoryStatus)
        if ctypes.windll.kernel32.GlobalMemoryStatusEx(ctypes.byref(status)):
            return round(status.total_phys / (1024**3))
    if hasattr(os, "sysconf"):
        try:
            return round(os.sysconf("SC_PAGE_SIZE") * os.sysconf("SC_PHYS_PAGES") / (1024**3))
        except (ValueError, OSError):
            pass
    return 16
