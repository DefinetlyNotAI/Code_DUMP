from __future__ import annotations

from dataclasses import dataclass, field
from typing import Literal


DeliveryMode = Literal["single", "broadcast", "indirect"]
OverlayMode = Literal["lore", "debug"]
EventKind = Literal[
    "miracle",
    "storm",
    "fertility",
    "corruption",
    "abundance",
    "plague",
    "quake",
]


@dataclass(slots=True)
class DeviceComponent:
    key: str
    label: str
    category: str
    magnitude: float
    detail: str


@dataclass(slots=True)
class DeviceProfile:
    machine_name: str
    os_name: str
    architecture: str
    cpu_label: str
    ram_gb: int
    gpu_label: str
    storage_gb: int
    components: list[DeviceComponent] = field(default_factory=list)
    signature: str = ""


@dataclass(slots=True)
class BiomeArchetype:
    biome_id: str
    lore_name: str
    component_key: str
    component_label: str
    component_detail: str
    category: str
    color: tuple[int, int, int]
    hazard: float
    fertility: float
    resource: str
    climate: str


@dataclass(slots=True)
class TileState:
    biome_id: str
    fertility: float
    hazard: float
    walkable: bool
    elevation: float
    moisture: float
    feature: str


@dataclass(slots=True)
class ChunkState:
    chunk_x: int
    chunk_y: int
    seed: int
    biome_id: str
    lore_name: str
    component_key: str
    tiles: list[list[TileState]]
    mutated: bool = False
    corruption: float = 0.0
    blessing: float = 0.0
    structures: list[dict] = field(default_factory=list)
    regional_summary: dict = field(default_factory=dict)


@dataclass(slots=True)
class MemoryEntry:
    title: str
    summary: str
    importance: float
    year: float


@dataclass(slots=True)
class RelationshipEdge:
    npc_id: int
    label: str
    affinity: float


@dataclass(slots=True)
class NpcState:
    npc_id: int
    name: str
    x: int
    y: int
    age_years: float
    sex: str
    health: float
    hunger: float
    faith: float
    fertility: float
    alive: bool
    spouse_id: int | None
    parent_ids: list[int]
    child_ids: list[int]
    traits: list[str]
    skills: dict[str, float]
    beliefs: dict[str, float]
    relationships: list[RelationshipEdge]
    memories: list[MemoryEntry]
    home_chunk: tuple[int, int]
    intent: str
    speech_buffer: list[str] = field(default_factory=list)
    last_dialogue_year: float = 0.0
    emotions: dict[str, float] = field(default_factory=dict)
    needs: dict[str, float] = field(default_factory=dict)
    mood: str = "calm"
    tribe_id: str = "first-tribe"
    role: str = "gatherer"
    inventory: dict[str, float] = field(default_factory=dict)
    life_events: list[str] = field(default_factory=list)
    values: dict[str, float] = field(default_factory=dict)
    coping_style: str = "seek_support"
    current_goal: str = "settle_near_tribe"
    goal_progress: float = 0.0
    morale: float = 0.5
    energy: float = 0.8
    routine_phase: str = "day_work"
    routine_offset: float = 0.0
    social_preference: float = 0.5
    personal_space: float = 2.5
    last_speech_text: str = ""
    health_condition: str = "healthy"
    exposure: float = 0.0
    immunity: float = 0.5
    injury: float = 0.0
    comfort: float = 0.5
    trauma: float = 0.0
    resilience: float = 0.5
    reputation: float = 0.0
    gratitude: float = 0.0
    recent_event_weight: float = 0.0
    attachment_style: str = "secure"
    social_state: str = "settled"
    social_focus_id: int | None = None
    last_social_year: float = 0.0
    nutrition: float = 0.65
    sleep_debt: float = 0.2
    shelter_security: float = 0.4
    household_stability: float = 0.5
    status: float = 0.0
    resentment: float = 0.0
    leadership: float = 0.0
    mediation_skill: float = 0.0
    memory_bias: dict[str, float] = field(default_factory=dict)
    worldview: str = "unformed"
    childhood_security: float = 0.5
    developmental_pressure: float = 0.0
    parental_attachment: float = 0.5
    home_component_key: str = ""
    home_component_label: str = ""
    component_attunement: float = 0.5
    communication_drive: float = 0.35


@dataclass(slots=True)
class DivineEvent:
    event_id: int
    year: float
    source: str
    scope: str
    delivery_mode: DeliveryMode
    payload: str
    event_kind: EventKind | None = None
    target_npc_id: int | None = None
    chunk_target: tuple[int, int] | None = None
    applied_to_npcs: bool = False
