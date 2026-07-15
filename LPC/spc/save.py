from __future__ import annotations

import json
from pathlib import Path

from .divine import DivineLedger
from .npc import NpcManager
from .types import ChunkState, DivineEvent, MemoryEntry, RelationshipEdge, TileState
from .world import World


def save_game(path: Path, year: float, world: World, npcs: NpcManager, divine: DivineLedger) -> None:
    changed_chunks = []
    for chunk in world.chunk_cache.values():
        if not chunk.mutated:
            continue
        changed_chunks.append(
            {
                "chunk_x": chunk.chunk_x,
                "chunk_y": chunk.chunk_y,
                "seed": chunk.seed,
                "biome_id": chunk.biome_id,
                "lore_name": chunk.lore_name,
                "component_key": chunk.component_key,
                "mutated": chunk.mutated,
                "corruption": chunk.corruption,
                "blessing": chunk.blessing,
                "structures": chunk.structures,
                "regional_summary": chunk.regional_summary,
                "tiles": [
                    [
                        {
                            "biome_id": tile.biome_id,
                            "fertility": tile.fertility,
                            "hazard": tile.hazard,
                            "walkable": tile.walkable,
                            "elevation": tile.elevation,
                            "moisture": tile.moisture,
                            "feature": tile.feature,
                        }
                        for tile in row
                    ]
                    for row in chunk.tiles
                ],
            }
        )
    payload = {
        "year": year,
        "device_profile_signature": world.device_profile.signature,
        "npcs": npcs.serialize(),
        "divine": {
            "next_id": divine.next_id,
            "events": [
                {
                    "event_id": event.event_id,
                    "year": event.year,
                    "source": event.source,
                    "scope": event.scope,
                    "delivery_mode": event.delivery_mode,
                    "payload": event.payload,
                    "event_kind": event.event_kind,
                    "target_npc_id": event.target_npc_id,
                    "chunk_target": list(event.chunk_target) if event.chunk_target else None,
                    "applied_to_npcs": event.applied_to_npcs,
                }
                for event in divine.events
            ],
        },
        "changed_chunks": changed_chunks,
    }
    path.write_text(json.dumps(payload, indent=2), encoding="utf-8")


def load_game(path: Path, world: World, npcs: NpcManager, divine: DivineLedger) -> float:
    payload = json.loads(path.read_text(encoding="utf-8"))
    npcs.load(payload["npcs"])
    divine.events = [
        DivineEvent(
            event_id=event["event_id"],
            year=event["year"],
            source=event["source"],
            scope=event["scope"],
            delivery_mode=event["delivery_mode"],
            payload=event["payload"],
            event_kind=event["event_kind"],
            target_npc_id=event["target_npc_id"],
            chunk_target=tuple(event["chunk_target"]) if event["chunk_target"] else None,
            applied_to_npcs=event.get("applied_to_npcs", False),
        )
        for event in payload["divine"]["events"]
    ]
    divine.next_id = payload["divine"]["next_id"]
    for chunk_payload in payload["changed_chunks"]:
        chunk = ChunkState(
            chunk_x=chunk_payload["chunk_x"],
            chunk_y=chunk_payload["chunk_y"],
            seed=chunk_payload["seed"],
            biome_id=chunk_payload["biome_id"],
            lore_name=chunk_payload["lore_name"],
            component_key=chunk_payload["component_key"],
            mutated=chunk_payload["mutated"],
            corruption=chunk_payload["corruption"],
            blessing=chunk_payload["blessing"],
            structures=chunk_payload["structures"],
            regional_summary=chunk_payload["regional_summary"],
            tiles=[
                [
                    TileState(
                        biome_id=tile_payload["biome_id"],
                        fertility=tile_payload["fertility"],
                        hazard=tile_payload["hazard"],
                        walkable=tile_payload["walkable"],
                        elevation=tile_payload.get("elevation", 0.5),
                        moisture=tile_payload.get("moisture", 0.5),
                        feature=tile_payload.get("feature", "plain"),
                    )
                    for tile_payload in row
                ]
                for row in chunk_payload["tiles"]
            ],
        )
        world.chunk_cache[(chunk.chunk_x, chunk.chunk_y)] = chunk
    return float(payload["year"])
