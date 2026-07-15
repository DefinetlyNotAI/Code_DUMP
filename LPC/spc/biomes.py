from __future__ import annotations

from .types import BiomeArchetype, DeviceProfile


PALETTE = {
    "compute": (214, 98, 61),
    "memory": (116, 166, 99),
    "graphics": (84, 147, 197),
    "storage": (161, 140, 97),
    "fabric": (130, 104, 168),
    "network": (68, 175, 163),
    "io": (212, 184, 78),
    "firmware": (96, 93, 117),
    "software": (74, 124, 92),
    "thermal": (201, 105, 87),
    "power": (198, 80, 95),
}


def build_biome_catalog(profile: DeviceProfile) -> dict[str, BiomeArchetype]:
    biomes: dict[str, BiomeArchetype] = {}
    for component in profile.components:
        color = PALETTE.get(component.category, (140, 140, 140))
        hazard = 0.1 + component.magnitude * (0.25 if component.category in {"thermal", "power"} else 0.1)
        fertility = max(0.05, 0.8 - hazard + (0.15 if component.category in {"memory", "software"} else 0.0))
        climate = {
            "compute": "arid heatfront",
            "memory": "lush bufferland",
            "graphics": "prismatic uplands",
            "storage": "sedimentary vaults",
            "fabric": "braided plains",
            "network": "tidal signal coast",
            "io": "trade crossroads",
            "firmware": "sacred bedrock",
            "software": "scripted canopy",
            "thermal": "vent stormland",
            "power": "charged badlands",
        }.get(component.category, "tempered wilds")
        resource = {
            "compute": "ember cores",
            "memory": "echo moss",
            "graphics": "glass reeds",
            "storage": "archive stone",
            "fabric": "copper reeds",
            "network": "signal shells",
            "io": "relay fruit",
            "firmware": "origin crystals",
            "software": "glyph bark",
            "thermal": "steam salts",
            "power": "storm ore",
        }.get(component.category, "common grain")
        biome_id = f"{component.key}_biome"
        biomes[biome_id] = BiomeArchetype(
            biome_id=biome_id,
            lore_name=f"{component.label} Expanse",
            component_key=component.key,
            component_label=component.label,
            component_detail=component.detail,
            category=component.category,
            color=color,
            hazard=hazard,
            fertility=fertility,
            resource=resource,
            climate=climate,
        )
    return biomes
