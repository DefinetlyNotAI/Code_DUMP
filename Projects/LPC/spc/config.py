from dataclasses import dataclass
from pathlib import Path


@dataclass(slots=True)
class GameConfig:
    world_width: int = 5_000
    world_height: int = 5_000
    chunk_size: int = 64
    tile_size: int = 10
    screen_width: int = 1366
    screen_height: int = 768
    preload_margin_chunks: int = 1
    nearby_radius_chunks: int = 2
    far_radius_chunks: int = 4
    base_sim_speed: float = 60.0
    start_population: int = 36
    max_population: int = 100
    max_active_npc_dialogues: int = 24
    save_path: Path = Path("spc_save.json")
    auto_save_path: Path = Path("spc_autosave.json")
    settings_path: Path = Path("spc_settings.json")
    world_seed: int = 402_031
