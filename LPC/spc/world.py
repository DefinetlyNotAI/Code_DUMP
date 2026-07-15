from __future__ import annotations

import hashlib
import math
import random
from dataclasses import dataclass, field

from .biomes import build_biome_catalog
from .config import GameConfig
from .types import BiomeArchetype, ChunkState, DeviceProfile, TileState


def stable_hash(value: str) -> int:
    return int(hashlib.sha256(value.encode("utf-8")).hexdigest()[:16], 16)


@dataclass(slots=True)
class World:
    config: GameConfig
    device_profile: DeviceProfile
    biomes: dict[str, BiomeArchetype] = field(init=False)
    biome_list: list[BiomeArchetype] = field(init=False)
    chunk_cache: dict[tuple[int, int], ChunkState] = field(init=False)

    def __post_init__(self) -> None:
        self.biomes = build_biome_catalog(self.device_profile)
        self.biome_list = list(self.biomes.values())
        self.chunk_cache: dict[tuple[int, int], ChunkState] = {}

    def world_seed_for_chunk(self, chunk_x: int, chunk_y: int) -> int:
        return stable_hash(f"{self.config.world_seed}:{self.device_profile.signature}:{chunk_x}:{chunk_y}")

    def chunk_coords_for_tile(self, x: int, y: int) -> tuple[int, int]:
        return x // self.config.chunk_size, y // self.config.chunk_size

    def generate_chunk(self, chunk_x: int, chunk_y: int) -> ChunkState:
        chunk_seed = self.world_seed_for_chunk(chunk_x, chunk_y)
        rng = random.Random(chunk_seed)
        biome = self.choose_biome(chunk_x, chunk_y)
        tiles: list[list[TileState]] = []
        for local_y in range(self.config.chunk_size):
            row: list[TileState] = []
            for local_x in range(self.config.chunk_size):
                global_x = chunk_x * self.config.chunk_size + local_x
                global_y = chunk_y * self.config.chunk_size + local_y
                tile_biome = self.choose_tile_biome(global_x, global_y, biome)
                noise = (
                    math.sin(global_x * 0.08)
                    + math.cos(global_y * 0.08)
                    + rng.uniform(-0.15, 0.15)
                )
                elevation = max(0.0, min(1.0, 0.5 + noise * 0.25 + rng.uniform(-0.08, 0.08)))
                moisture = max(0.0, min(1.0, tile_biome.fertility * 0.7 + math.cos(global_x * 0.19 + global_y * 0.031) * 0.12 + rng.uniform(-0.06, 0.06)))
                hazard = max(0.0, min(1.0, tile_biome.hazard + noise * 0.05))
                fertility = max(0.0, min(1.0, tile_biome.fertility - noise * 0.04))
                walkable = hazard < 0.92
                feature = self.classify_tile_feature(tile_biome.category, elevation, moisture, hazard, fertility)
                row.append(
                    TileState(
                        biome_id=tile_biome.biome_id,
                        fertility=fertility,
                        hazard=hazard,
                        walkable=walkable,
                        elevation=elevation,
                        moisture=moisture,
                        feature=feature,
                    )
                )
            tiles.append(row)
        structures = self.generate_structures(chunk_x, chunk_y, biome, tiles, rng)
        chunk = ChunkState(
            chunk_x=chunk_x,
            chunk_y=chunk_y,
            seed=chunk_seed,
            biome_id=biome.biome_id,
            lore_name=biome.lore_name,
            component_key=biome.component_key,
            tiles=tiles,
            structures=structures,
            regional_summary={
                "population_pressure": rng.uniform(0.1, 0.8),
                "faith_charge": rng.uniform(0.0, 1.0),
                "wealth": rng.uniform(0.1, 1.0),
                "component_label": biome.component_label,
                "component_detail": biome.component_detail,
                "avg_hazard": round(biome.hazard, 3),
                "avg_fertility": round(biome.fertility, 3),
            },
        )
        self.chunk_cache[(chunk_x, chunk_y)] = chunk
        return chunk

    def generate_structures(
        self,
        chunk_x: int,
        chunk_y: int,
        biome: BiomeArchetype,
        tiles: list[list[TileState]],
        rng: random.Random,
    ) -> list[dict]:
        structures: list[dict] = []
        house_target = 1 if biome.fertility > 0.45 and biome.hazard < 0.42 and rng.random() < 0.5 else 0
        bush_target = rng.randint(4, 10) if biome.fertility > 0.5 else rng.randint(1, 4)
        for _ in range(house_target):
            local_x = rng.randint(4, self.config.chunk_size - 5)
            local_y = rng.randint(4, self.config.chunk_size - 5)
            tile = tiles[local_y][local_x]
            if tile.walkable and tile.feature in {"plain", "grove", "vault"}:
                structures.append(
                    {
                        "type": "house",
                        "x": chunk_x * self.config.chunk_size + local_x,
                        "y": chunk_y * self.config.chunk_size + local_y,
                        "label": f"{biome.component_label} dwelling",
                    }
                )
        for _ in range(bush_target):
            local_x = rng.randint(2, self.config.chunk_size - 3)
            local_y = rng.randint(2, self.config.chunk_size - 3)
            tile = tiles[local_y][local_x]
            if tile.walkable and tile.fertility > 0.45:
                structures.append(
                    {
                        "type": "food_bush",
                        "x": chunk_x * self.config.chunk_size + local_x,
                        "y": chunk_y * self.config.chunk_size + local_y,
                        "label": f"{biome.resource} bush",
                        "food": round(rng.uniform(2.0, 5.0), 2),
                        "max_food": 5.0,
                        "regrow_rate": round(rng.uniform(0.12, 0.28), 3),
                    }
                )
        return structures

    def get_chunk(self, chunk_x: int, chunk_y: int) -> ChunkState:
        if (chunk_x, chunk_y) not in self.chunk_cache:
            return self.generate_chunk(chunk_x, chunk_y)
        return self.chunk_cache[(chunk_x, chunk_y)]

    def choose_biome(self, chunk_x: int, chunk_y: int) -> BiomeArchetype:
        ridge = stable_hash(f"ridge:{self.device_profile.signature}:{chunk_x // 3}:{chunk_y // 3}")
        idx = ridge % len(self.biome_list)
        return self.biome_list[idx]

    def choose_tile_biome(self, x: int, y: int, fallback: BiomeArchetype) -> BiomeArchetype:
        if len(self.biome_list) <= 1:
            return fallback
        phase_a = (stable_hash(f"phase-a:{self.device_profile.signature}") % 10_000) / 10_000.0 * math.tau
        phase_b = (stable_hash(f"phase-b:{self.device_profile.signature}") % 10_000) / 10_000.0 * math.tau
        phase_c = (stable_hash(f"phase-c:{self.device_profile.signature}") % 10_000) / 10_000.0 * math.tau
        field = (
            math.sin(x * 0.0047 + phase_a)
            + math.cos(y * 0.0053 + phase_b)
            + math.sin((x + y) * 0.0029 + phase_c)
            + math.cos((x - y) * 0.0037 + phase_a * 0.5)
        )
        if abs(field) < 0.18:
            return fallback
        idx = int(abs(field) * 997 + stable_hash(f"tile-biome:{self.device_profile.signature}:{x // 17}:{y // 19}")) % len(self.biome_list)
        return self.biome_list[idx]

    def classify_tile_feature(
        self,
        category: str,
        elevation: float,
        moisture: float,
        hazard: float,
        fertility: float,
    ) -> str:
        if hazard > 0.72:
            return "fault"
        if elevation > 0.76:
            return "ridge"
        if moisture > 0.74 and fertility > 0.55:
            return "grove"
        if moisture < 0.24:
            return "dust"
        if category in {"network", "io"} and moisture > 0.58:
            return "channel"
        if category in {"storage", "firmware"}:
            return "vault"
        if category in {"compute", "power", "thermal"}:
            return "forge"
        return "plain"

    def inspect_tile(self, x: int, y: int) -> dict:
        chunk_x, chunk_y = self.chunk_coords_for_tile(x, y)
        chunk = self.get_chunk(chunk_x, chunk_y)
        local_x = x % self.config.chunk_size
        local_y = y % self.config.chunk_size
        tile = chunk.tiles[local_y][local_x]
        biome = self.biomes[tile.biome_id]
        return {
            "world": (x, y),
            "chunk": (chunk_x, chunk_y),
            "biome": biome.lore_name,
            "component_key": biome.component_key,
            "component_label": biome.component_label,
            "component_detail": biome.component_detail,
            "category": biome.category,
            "resource": biome.resource,
            "climate": biome.climate,
            "feature": tile.feature,
            "hazard": round(tile.hazard, 3),
            "fertility": round(tile.fertility, 3),
            "elevation": round(tile.elevation, 3),
            "moisture": round(tile.moisture, 3),
            "walkable": tile.walkable,
            "structures": [item for item in chunk.structures if item["x"] == x and item["y"] == y],
        }

    def find_structure_at_or_near(self, x: int, y: int, structure_type: str, radius: int = 0) -> dict | None:
        chunk_x, chunk_y = self.chunk_coords_for_tile(x, y)
        for scan_chunk_x in range(chunk_x - 1, chunk_x + 2):
            for scan_chunk_y in range(chunk_y - 1, chunk_y + 2):
                if scan_chunk_x < 0 or scan_chunk_y < 0:
                    continue
                chunk = self.get_chunk(scan_chunk_x, scan_chunk_y)
                for structure in chunk.structures:
                    if structure["type"] != structure_type:
                        continue
                    if abs(structure["x"] - x) <= radius and abs(structure["y"] - y) <= radius:
                        return structure
        return None

    def find_nearest_structure(self, x: int, y: int, structure_type: str, max_chunk_radius: int = 1) -> dict | None:
        chunk_x, chunk_y = self.chunk_coords_for_tile(x, y)
        best: dict | None = None
        best_dist = float("inf")
        for dx in range(-max_chunk_radius, max_chunk_radius + 1):
            for dy in range(-max_chunk_radius, max_chunk_radius + 1):
                scan_x = chunk_x + dx
                scan_y = chunk_y + dy
                if scan_x < 0 or scan_y < 0:
                    continue
                chunk = self.get_chunk(scan_x, scan_y)
                for structure in chunk.structures:
                    if structure["type"] != structure_type:
                        continue
                    dist = math.dist((x, y), (structure["x"], structure["y"]))
                    if dist < best_dist:
                        best = structure
                        best_dist = dist
        return best

    def add_structure_near(self, x: int, y: int, structure_type: str, label: str) -> bool:
        chunk_x, chunk_y = self.chunk_coords_for_tile(x, y)
        chunk = self.get_chunk(chunk_x, chunk_y)
        for offset in range(0, 8):
            local_x = (x + offset) % self.config.chunk_size
            local_y = (y + offset * 2) % self.config.chunk_size
            tile = chunk.tiles[local_y][local_x]
            world_x = chunk_x * self.config.chunk_size + local_x
            world_y = chunk_y * self.config.chunk_size + local_y
            if not tile.walkable:
                continue
            if any(item["x"] == world_x and item["y"] == world_y for item in chunk.structures):
                continue
            chunk.structures.append({"type": structure_type, "x": world_x, "y": world_y, "label": label})
            chunk.mutated = True
            return True
        return False

    def update_resources(self, delta_years: float, chunk_keys: set[tuple[int, int]], growth_modifier: float = 1.0) -> None:
        if delta_years <= 0.0:
            return
        growth_modifier = max(0.0, growth_modifier)
        for chunk_key in chunk_keys:
            chunk = self.get_chunk(*chunk_key)
            for structure in chunk.structures:
                if structure["type"] != "food_bush":
                    continue
                maximum = float(structure.get("max_food", 5.0))
                current = float(structure.get("food", maximum))
                rate = float(structure.get("regrow_rate", 0.2))
                structure["food"] = min(maximum, current + rate * growth_modifier * delta_years)

    def harvest_food_near(self, x: int, y: int, radius: int, amount: float) -> float:
        bush = self.find_structure_at_or_near(x, y, "food_bush", radius)
        if bush is None:
            return 0.0
        available = float(bush.get("food", bush.get("max_food", 5.0)))
        harvested = min(max(0.0, amount), available)
        bush["food"] = available - harvested
        chunk = self.get_chunk(*self.chunk_coords_for_tile(bush["x"], bush["y"]))
        chunk.mutated = True
        return harvested

    def visible_chunk_rect(self, camera_x: int, camera_y: int, screen_tiles_x: int, screen_tiles_y: int) -> tuple[int, int, int, int]:
        margin = self.config.preload_margin_chunks
        start_chunk_x = max(0, (camera_x // self.config.chunk_size) - margin)
        start_chunk_y = max(0, (camera_y // self.config.chunk_size) - margin)
        end_chunk_x = min(
            self.config.world_width // self.config.chunk_size,
            ((camera_x + screen_tiles_x) // self.config.chunk_size) + margin,
        )
        end_chunk_y = min(
            self.config.world_height // self.config.chunk_size,
            ((camera_y + screen_tiles_y) // self.config.chunk_size) + margin,
        )
        return start_chunk_x, start_chunk_y, end_chunk_x, end_chunk_y

    def active_chunks(self, camera_x: int, camera_y: int, screen_tiles_x: int, screen_tiles_y: int) -> dict[tuple[int, int], str]:
        visible = self.visible_chunk_rect(camera_x, camera_y, screen_tiles_x, screen_tiles_y)
        cx = camera_x // self.config.chunk_size
        cy = camera_y // self.config.chunk_size
        result: dict[tuple[int, int], str] = {}
        for chunk_x in range(visible[0], visible[2] + 1):
            for chunk_y in range(visible[1], visible[3] + 1):
                distance = max(abs(chunk_x - cx), abs(chunk_y - cy))
                if distance <= 0:
                    lod = "onscreen"
                elif distance <= self.config.nearby_radius_chunks:
                    lod = "nearby"
                else:
                    lod = "far"
                result[(chunk_x, chunk_y)] = lod
                self.get_chunk(chunk_x, chunk_y)
        return result
