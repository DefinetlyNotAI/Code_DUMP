from __future__ import annotations

import math
import random
from dataclasses import dataclass, field

from .config import GameConfig
from .mind import MindAdapter, compress_to_single_sentence
from .types import ChunkState, DivineEvent, MemoryEntry, NpcState, RelationshipEdge
from .world import World


FIRST_NAMES = [
    "Ari", "Bela", "Cato", "Dara", "Esen", "Faro", "Galen", "Hira", "Ivo", "Juno",
    "Kael", "Luma", "Mira", "Nilo", "Orin", "Pela", "Quin", "Rhea", "Soren", "Tavi",
]
TRAITS = ["curious", "devout", "stern", "tender", "ambitious", "wary", "joyful", "patient"]
ROLE_LABELS = ("gatherer", "builder", "caregiver", "scout")
COPING_STYLES = ("seek_support", "work", "withdraw", "pray", "confront")
ATTACHMENT_STYLES = ("secure", "anxious", "avoidant", "familial")


@dataclass(slots=True)
class NpcManager:
    config: GameConfig
    world: World
    mind: MindAdapter
    npcs: dict[int, NpcState] = field(init=False)
    next_id: int = field(init=False)
    rng: random.Random = field(init=False)
    recent_speeches: list[str] = field(init=False)
    tribe_food: float = field(init=False)
    tribe_wood: float = field(init=False)
    culture: dict[str, float] = field(init=False)
    environment: dict[str, float | str] = field(init=False)
    resource_pressure: dict[str, float] = field(init=False)
    role_pressure: dict[str, float] = field(init=False)
    dependency_pressure: dict[str, float] = field(init=False)
    disease_pressure: dict[str, float] = field(init=False)

    def __post_init__(self) -> None:
        self.npcs: dict[int, NpcState] = {}
        self.next_id = 1
        self.rng = random.Random(self.config.world_seed + 17)
        self.recent_speeches = []
        self.tribe_food = 18.0
        self.tribe_wood = 10.0
        self.culture = {
            "cohesion": 0.55,
            "care_norm": 0.5,
            "conflict_norm": 0.35,
            "tradition": 0.45,
            "risk_tolerance": 0.4,
            "scarcity_memory": 0.25,
            "spirituality": 0.45,
        }
        self.environment = {
            "season": "spring",
            "weather": "clear",
            "temperature_stress": 0.12,
            "rainfall": 0.45,
            "storm_risk": 0.08,
            "food_growth": 1.0,
            "year_fraction": 0.0,
        }
        self.resource_pressure = {
            "food": 0.2,
            "shelter": 0.0,
            "ration_level": 1.0,
            "stores_per_person": 0.0,
            "house_capacity": 0.0,
        }
        self.role_pressure = {
            "gatherer": 0.25,
            "builder": 0.25,
            "caregiver": 0.25,
            "scout": 0.25,
            "coverage": 1.0,
        }
        self.dependency_pressure = {
            "infants": 0.0,
            "children": 0.0,
            "elders": 0.0,
            "dependents": 0.0,
            "care_load": 0.0,
        }
        self.disease_pressure = {
            "sick": 0.0,
            "weakened": 0.0,
            "risk": 0.0,
            "crowding": 0.0,
            "care_exposure": 0.0,
        }

    def spawn_initial_population(self) -> None:
        center_x = self.config.world_width // 2
        center_y = self.config.world_height // 2
        target_population = min(self.config.start_population, self.config.max_population)
        for _ in range(target_population):
            spawn_x = center_x + self.rng.randint(-120, 120)
            spawn_y = center_y + self.rng.randint(-120, 120)
            house = self.world.find_nearest_structure(spawn_x, spawn_y, "house", max_chunk_radius=1)
            if house is not None:
                spawn_x = house["x"] + self.rng.randint(-2, 2)
                spawn_y = house["y"] + self.rng.randint(-2, 2)
            self.create_npc(
                x=spawn_x,
                y=spawn_y,
                age_years=self.rng.uniform(16, 52),
            )

    def create_npc(self, x: int, y: int, age_years: float, parent_ids: list[int] | None = None) -> NpcState:
        if self.living_population() >= self.config.max_population:
            raise RuntimeError(f"Population cap reached ({self.config.max_population})")
        npc_id = self.next_id
        self.next_id += 1
        name = f"{self.rng.choice(FIRST_NAMES)}-{npc_id}"
        sex = self.rng.choice(["f", "m"])
        home_chunk = self.world.chunk_coords_for_tile(x, y)
        home_tile = self.world.inspect_tile(max(0, min(self.config.world_width - 1, x)), max(0, min(self.config.world_height - 1, y)))
        traits = self.rng.sample(TRAITS, 2)
        skills = {"forage": self.rng.uniform(0.1, 1.0), "craft": self.rng.uniform(0.1, 1.0)}
        role = self._choose_role(traits, skills)
        values = self._derive_values(traits)
        coping_style = self._derive_coping_style(traits)
        social_preference = self._derive_social_preference(traits, values)
        attachment_style = self._derive_attachment_style(traits, values)
        personal_space = 1.8 + values["independence"] * 1.8 + (0.5 if "wary" in traits else 0.0)
        npc = NpcState(
            npc_id=npc_id,
            name=name,
            x=max(0, min(self.config.world_width - 1, x)),
            y=max(0, min(self.config.world_height - 1, y)),
            age_years=age_years,
            sex=sex,
            health=self.rng.uniform(0.55, 1.0),
            hunger=self.rng.uniform(0.05, 0.5),
            faith=self.rng.uniform(0.1, 0.9),
            fertility=self.rng.uniform(0.35, 0.9),
            alive=True,
            spouse_id=None,
            parent_ids=parent_ids or [],
            child_ids=[],
            traits=traits,
            skills=skills,
            beliefs={"omen_trust": self.rng.uniform(0.2, 0.9), "community": self.rng.uniform(0.2, 1.0)},
            relationships=[],
            memories=[],
            home_chunk=home_chunk,
            intent="wander",
            emotions={
                "joy": self.rng.uniform(0.3, 0.65),
                "sadness": self.rng.uniform(0.05, 0.25),
                "fear": self.rng.uniform(0.05, 0.25),
                "anger": self.rng.uniform(0.02, 0.18),
                "loneliness": self.rng.uniform(0.1, 0.35),
                "stress": self.rng.uniform(0.08, 0.3),
                "trust": self.rng.uniform(0.35, 0.75),
            },
            needs={
                "belonging": self.rng.uniform(0.1, 0.35),
                "safety": self.rng.uniform(0.05, 0.25),
                "shelter": self.rng.uniform(0.1, 0.4),
                "purpose": self.rng.uniform(0.15, 0.45),
                "rest": self.rng.uniform(0.05, 0.25),
            },
            mood="calm",
            role=role,
            inventory={"food": 0.0, "wood": 0.0},
            life_events=[f"Began life as a {role}."],
            values=values,
            coping_style=coping_style,
            current_goal="settle_near_tribe",
            goal_progress=0.0,
            morale=self._community_morale(),
            energy=self.rng.uniform(0.55, 0.95),
            routine_phase="day_work",
            routine_offset=self.rng.random(),
            social_preference=social_preference,
            personal_space=personal_space,
            health_condition="healthy",
            exposure=self.rng.uniform(0.0, 0.12),
            immunity=self.rng.uniform(0.35, 0.8),
            injury=0.0,
            comfort=self.rng.uniform(0.35, 0.7),
            trauma=self.rng.uniform(0.0, 0.08),
            resilience=self._derive_resilience(traits, values),
            reputation=0.0,
            gratitude=0.0,
            recent_event_weight=0.0,
            attachment_style=attachment_style,
            social_state="settled",
            social_focus_id=None,
            last_social_year=0.0,
            nutrition=self.rng.uniform(0.48, 0.82),
            sleep_debt=self.rng.uniform(0.08, 0.32),
            shelter_security=self.rng.uniform(0.22, 0.58),
            household_stability=self.rng.uniform(0.35, 0.72),
            status=0.0,
            resentment=0.0,
            leadership=self._derive_leadership(traits, values),
            mediation_skill=self._derive_mediation_skill(traits, values),
            memory_bias={
                "scarcity": 0.0,
                "loss": 0.0,
                "conflict": 0.0,
                "care": 0.0,
                "awe": 0.0,
                "shelter": 0.0,
                "belonging": 0.0,
            },
            worldview="unformed",
            childhood_security=self.rng.uniform(0.42, 0.68),
            developmental_pressure=0.0,
            parental_attachment=0.5,
            home_component_key=str(home_tile["component_key"]),
            home_component_label=str(home_tile["component_label"]),
            component_attunement=self.rng.uniform(0.35, 0.78),
            communication_drive=self.rng.uniform(0.24, 0.62),
        )
        self._apply_parental_inheritance(npc)
        npc.memories.append(
            MemoryEntry("awakening", f"{npc.name} began life beneath the {home_chunk} skies.", 0.4, 0.0)
        )
        self.npcs[npc_id] = npc
        return npc

    def update(self, delta_years: float, active_chunks: dict[tuple[int, int], str], divine_events: list[DivineEvent]) -> None:
        self._update_environment(delta_years)
        self.world.update_resources(delta_years, set(active_chunks), float(self.environment.get("food_growth", 1.0)))
        alive_npcs = [npc for npc in self.npcs.values() if npc.alive]
        for npc in alive_npcs:
            chunk_key = self.world.chunk_coords_for_tile(npc.x, npc.y)
            lod = active_chunks.get(chunk_key, "far")
            scale = {"onscreen": 1.0, "nearby": 0.35, "far": 0.08}[lod]
            self._tick_npc(npc, delta_years * scale)
        self._apply_divine_events(divine_events)
        self._pair_marriages(delta_years)
        self._resolve_divorces(delta_years)
        self._spawn_children(delta_years)
        self._build_houses_if_possible()
        self._apply_rationing(delta_years)
        self._update_resource_pressure()
        self._update_dependency_pressure()
        self._update_disease_pressure()
        self._update_role_pressure()
        self._adapt_roles(delta_years)
        self._drift_relationships(delta_years)
        self._summarize_relationships(delta_years)
        self._update_culture(delta_years)

    def _choose_role(self, traits: list[str], skills: dict[str, float]) -> str:
        if "tender" in traits or "patient" in traits:
            return "caregiver"
        if "curious" in traits or "wary" in traits:
            return "scout"
        if skills["craft"] > skills["forage"]:
            return "builder"
        return "gatherer"

    def life_stage(self, npc: NpcState) -> str:
        if npc.age_years < 2:
            return "infant"
        if npc.age_years < 12:
            return "child"
        if npc.age_years < 18:
            return "adolescent"
        if npc.age_years < 60:
            return "adult"
        return "elder"

    def _is_dependent(self, npc: NpcState) -> bool:
        return self.life_stage(npc) in {"infant", "child", "elder"} or npc.health_condition in {"sick", "injured"}

    def _derive_values(self, traits: list[str]) -> dict[str, float]:
        values = {
            "community": self.rng.uniform(0.45, 0.8),
            "independence": self.rng.uniform(0.15, 0.55),
            "tradition": self.rng.uniform(0.25, 0.7),
            "security": self.rng.uniform(0.35, 0.85),
            "compassion": self.rng.uniform(0.25, 0.75),
            "ambition": self.rng.uniform(0.2, 0.7),
        }
        if "tender" in traits:
            values["compassion"] += 0.2
            values["community"] += 0.12
        if "patient" in traits:
            values["security"] += 0.12
            values["tradition"] += 0.1
        if "devout" in traits:
            values["tradition"] += 0.2
        if "curious" in traits:
            values["independence"] += 0.2
        if "ambitious" in traits:
            values["ambition"] += 0.25
        if "wary" in traits or "stern" in traits:
            values["security"] += 0.18
        return {key: self._clamp(value) for key, value in values.items()}

    def _apply_parental_inheritance(self, child: NpcState) -> None:
        parents = [self.npcs[parent_id] for parent_id in child.parent_ids if parent_id in self.npcs]
        if not parents:
            return
        inherited_traits = list(dict.fromkeys(trait for parent in parents for trait in parent.traits))
        if inherited_traits:
            child.traits = self.rng.sample(inherited_traits, min(2, len(inherited_traits)))
        for key in child.values:
            parent_value = sum(parent.values.get(key, child.values[key]) for parent in parents) / len(parents)
            child.values[key] = self._clamp(parent_value * 0.55 + child.values[key] * 0.45)
        child.social_preference = self._derive_social_preference(child.traits, child.values)
        child.attachment_style = self._derive_attachment_style(child.traits, child.values)
        child.resilience = self._clamp(
            sum(parent.resilience for parent in parents) / len(parents) * 0.42
            + child.resilience * 0.58
        )
        household = sum(parent.household_stability for parent in parents) / len(parents)
        care = sum(parent.values.get("compassion", 0.5) for parent in parents) / len(parents)
        trauma = sum(parent.trauma for parent in parents) / len(parents)
        child.childhood_security = self._clamp(0.25 + household * 0.34 + care * 0.22 + (1.0 - trauma) * 0.19)
        child.parental_attachment = self._clamp(0.25 + child.childhood_security * 0.5 + care * 0.25)
        child.developmental_pressure = self._clamp(trauma * 0.22 + (1.0 - household) * 0.24)
        child.leadership = self._derive_leadership(child.traits, child.values)
        child.mediation_skill = self._derive_mediation_skill(child.traits, child.values)

    def _derive_coping_style(self, traits: list[str]) -> str:
        if "devout" in traits:
            return "pray"
        if "ambitious" in traits or "patient" in traits:
            return "work"
        if "tender" in traits or "joyful" in traits:
            return "seek_support"
        if "stern" in traits:
            return "confront"
        if "wary" in traits:
            return "withdraw"
        return self.rng.choice(COPING_STYLES)

    def _derive_social_preference(self, traits: list[str], values: dict[str, float]) -> float:
        preference = values["community"] * 0.45 + values["compassion"] * 0.25 + (1.0 - values["independence"]) * 0.3
        if "tender" in traits or "joyful" in traits:
            preference += 0.12
        if "wary" in traits or "stern" in traits:
            preference -= 0.12
        return self._clamp(preference)

    def _derive_attachment_style(self, traits: list[str], values: dict[str, float]) -> str:
        if values.get("compassion", 0.5) > 0.68 or "tender" in traits:
            return "familial"
        if "wary" in traits or values.get("independence", 0.5) > 0.68:
            return "avoidant"
        if values.get("security", 0.5) > 0.66 or "devout" in traits:
            return "anxious"
        if "patient" in traits and values.get("community", 0.5) > 0.45:
            return "secure"
        return self.rng.choice(ATTACHMENT_STYLES)

    def _derive_resilience(self, traits: list[str], values: dict[str, float]) -> float:
        resilience = 0.35 + values["security"] * 0.22 + values["community"] * 0.14 + values["tradition"] * 0.1
        if "patient" in traits:
            resilience += 0.15
        if "joyful" in traits:
            resilience += 0.12
        if "wary" in traits:
            resilience -= 0.08
        return self._clamp(resilience)

    def _derive_leadership(self, traits: list[str], values: dict[str, float]) -> float:
        leadership = values["community"] * 0.28 + values["security"] * 0.24 + values["tradition"] * 0.18 + values["ambition"] * 0.2
        if "stern" in traits:
            leadership += 0.12
        if "patient" in traits:
            leadership += 0.1
        if "wary" in traits:
            leadership -= 0.08
        return self._clamp(leadership)

    def _derive_mediation_skill(self, traits: list[str], values: dict[str, float]) -> float:
        skill = values["compassion"] * 0.35 + values["community"] * 0.28 + values["security"] * 0.17 + values["tradition"] * 0.1
        if "patient" in traits or "tender" in traits:
            skill += 0.13
        if "stern" in traits:
            skill -= 0.06
        return self._clamp(skill)

    def _update_environment(self, delta_years: float) -> None:
        if delta_years <= 0.0:
            return
        living = [npc for npc in self.npcs.values() if npc.alive]
        year = sum(npc.age_years for npc in living) / len(living) if living else 0.0
        year_fraction = year % 1.0
        if year_fraction < 0.25:
            season = "spring"
            base_rainfall = 0.68
            temperature_stress = 0.12
            growth = 1.25
            storm_risk = 0.16
        elif year_fraction < 0.5:
            season = "summer"
            base_rainfall = 0.32
            temperature_stress = 0.34
            growth = 0.92
            storm_risk = 0.1
        elif year_fraction < 0.75:
            season = "autumn"
            base_rainfall = 0.48
            temperature_stress = 0.16
            growth = 0.84
            storm_risk = 0.18
        else:
            season = "winter"
            base_rainfall = 0.38
            temperature_stress = 0.42
            growth = 0.45
            storm_risk = 0.12
        weather_roll = self.rng.random()
        if weather_roll < storm_risk * 0.18 * delta_years:
            weather = "storm"
        elif weather_roll < (storm_risk + base_rainfall * 0.25) * 0.16 * delta_years:
            weather = "rain"
        elif season == "summer" and weather_roll < 0.1 * delta_years:
            weather = "heat"
        elif season == "winter" and weather_roll < 0.12 * delta_years:
            weather = "cold"
        else:
            current_weather = str(self.environment.get("weather", "clear"))
            weather = current_weather if current_weather in {"rain", "storm", "heat", "cold"} and self.rng.random() > 0.18 * delta_years else "clear"
        if weather == "rain":
            rainfall = min(1.0, base_rainfall + 0.22)
            growth *= 1.18
        elif weather == "storm":
            rainfall = min(1.0, base_rainfall + 0.38)
            temperature_stress += 0.08
            growth *= 0.82
        elif weather == "heat":
            rainfall = max(0.0, base_rainfall - 0.18)
            temperature_stress += 0.18
            growth *= 0.72
        elif weather == "cold":
            rainfall = base_rainfall
            temperature_stress += 0.16
            growth *= 0.7
        else:
            rainfall = base_rainfall
        self.environment = {
            "season": season,
            "weather": weather,
            "temperature_stress": self._clamp(temperature_stress),
            "rainfall": self._clamp(rainfall),
            "storm_risk": self._clamp(storm_risk),
            "food_growth": max(0.05, growth),
            "year_fraction": year_fraction,
        }

    def _tick_npc(self, npc: NpcState, delta_years: float) -> None:
        if delta_years <= 0.0:
            return
        if npc.health <= 0:
            self._resolve_death(npc)
            return
        npc.age_years += delta_years
        npc.hunger = min(1.0, npc.hunger + 0.12 * delta_years)
        if self.life_stage(npc) == "infant":
            npc.hunger = min(1.0, npc.hunger + 0.16 * delta_years)
            npc.energy = self._clamp(npc.energy - 0.05 * delta_years)
        elif self.life_stage(npc) == "child":
            npc.hunger = min(1.0, npc.hunger + 0.05 * delta_years)
        self._update_routine(npc, delta_years)
        self._forage_if_possible(npc, delta_years)
        self._update_emotional_state(npc, delta_years)
        self._update_dependency_state(npc, delta_years)
        self._update_health_conditions(npc, delta_years)
        self._apply_care_social_effects(npc, delta_years)
        self._update_long_term_psychology(npc, delta_years)
        self._update_social_drives(npc, delta_years)
        self._update_welfare_state(npc, delta_years)
        self._update_status_state(npc, delta_years)
        self._choose_goal(npc)
        self._apply_coping(npc, delta_years)
        if npc.hunger > 0.9:
            npc.health -= 0.16 * delta_years
        else:
            npc.health = min(1.0, npc.health + 0.03 * delta_years)
        if npc.age_years > 70:
            npc.health -= 0.08 * delta_years
        if npc.health <= 0:
            self._resolve_death(npc)
            return
        npc.intent = self.mind.choose_intent(npc, f"hunger={npc.hunger:.2f}, health={npc.health:.2f}")
        forced_rest = (
            npc.energy < 0.22
            or npc.health_condition in {"sick", "injured"}
            or self.life_stage(npc) == "infant"
            or (npc.routine_phase == "night_rest" and npc.hunger < 0.7)
        )
        if forced_rest:
            npc.intent = "rest"
        elif self.life_stage(npc) == "child":
            npc.intent = "stay_near_family"
        elif npc.role == "gatherer" and npc.inventory.get("food", 0.0) < 2.0:
            npc.intent = "gather_food"
        elif npc.role == "builder" and npc.inventory.get("wood", 0.0) < 2.0:
            npc.intent = "gather_wood"
        elif npc.role == "caregiver" and npc.needs.get("belonging", 0.0) < 0.7:
            npc.intent = "support_tribe"
        elif npc.role == "caregiver" and self._nearest_unwell_npc(npc) is not None:
            npc.intent = "care_for_sick"
        if not forced_rest and npc.routine_phase == "dusk_social" and npc.social_preference > 0.45 and npc.hunger < 0.75:
            npc.intent = "seek_company"
        if not forced_rest:
            if npc.social_state in {"seeking_comfort", "repairing_bond", "grieving"}:
                npc.intent = "seek_company"
            elif npc.social_state == "guarding_family":
                npc.intent = "care_for_family"
            elif npc.social_state == "avoiding_conflict":
                npc.intent = "cool_down"
        if str(self.environment.get("weather", "clear")) in {"storm", "heat", "cold"} and npc.hunger < 0.82:
            npc.intent = "seek_shelter"
        self._update_goal_progress(npc, delta_years)
        self._move_npc(npc)
        self._share_resources(npc)
        if self._should_speak_need(npc, delta_years):
            line = self._compose_need_line(npc)
            if line:
                self._emit_speech(npc, line, f"{npc.name}: ")

    def _update_routine(self, npc: NpcState, delta_years: float) -> None:
        day_fraction = (npc.age_years * 365.0 + npc.routine_offset) % 1.0
        if day_fraction < 0.18:
            phase = "night_rest"
        elif day_fraction < 0.3:
            phase = "morning_prepare"
        elif day_fraction < 0.72:
            phase = "day_work"
        elif day_fraction < 0.88:
            phase = "dusk_social"
        else:
            phase = "night_rest"
        if phase != npc.routine_phase:
            npc.routine_phase = phase
        if phase == "night_rest":
            npc.energy = self._clamp(npc.energy + (0.45 - npc.hunger * 0.16) * delta_years)
            npc.needs["rest"] = self._clamp(npc.needs.get("rest", 0.0) - 0.35 * delta_years)
            npc.needs["safety"] = self._clamp(npc.needs.get("safety", 0.0) - 0.06 * delta_years)
        elif phase == "morning_prepare":
            npc.energy = self._clamp(npc.energy - 0.05 * delta_years)
            npc.needs["purpose"] = self._clamp(npc.needs.get("purpose", 0.0) - 0.03 * delta_years)
        elif phase == "day_work":
            drain = 0.18 + (0.1 if npc.intent in {"gather_food", "gather_wood", "scout_area"} else 0.0)
            npc.energy = self._clamp(npc.energy - drain * delta_years)
            npc.needs["rest"] = self._clamp(npc.needs.get("rest", 0.0) + 0.14 * delta_years)
        elif phase == "dusk_social":
            npc.energy = self._clamp(npc.energy - 0.04 * delta_years)
            if npc.social_preference > 0.45:
                npc.needs["belonging"] = self._clamp(npc.needs.get("belonging", 0.0) - 0.08 * delta_years)

    def _update_dependency_state(self, npc: NpcState, delta_years: float) -> None:
        stage = self.life_stage(npc)
        if stage not in {"infant", "child", "elder"}:
            return
        caregivers_near = [
            other for other in self.npcs.values()
            if other.alive
            and other.npc_id != npc.npc_id
            and (
                other.role == "caregiver"
                or other.npc_id in npc.parent_ids
                or npc.npc_id in other.child_ids
            )
            and math.dist((npc.x, npc.y), (other.x, other.y)) <= 8
        ]
        support = min(1.0, len(caregivers_near) / (1.0 if stage == "infant" else 2.0))
        if support > 0.0:
            npc.needs["belonging"] = self._clamp(npc.needs.get("belonging", 0.0) - (0.2 + support * 0.2) * delta_years)
            npc.needs["safety"] = self._clamp(npc.needs.get("safety", 0.0) - (0.14 + support * 0.16) * delta_years)
            npc.emotions["trust"] = self._clamp(npc.emotions.get("trust", 0.0) + 0.08 * support * delta_years)
            npc.gratitude = self._clamp(npc.gratitude + 0.04 * support * delta_years)
            npc.childhood_security = self._clamp(npc.childhood_security + (0.09 + support * 0.08) * delta_years)
            npc.parental_attachment = self._clamp(npc.parental_attachment + (0.08 + support * 0.06) * delta_years)
            npc.developmental_pressure = self._clamp(npc.developmental_pressure - (0.06 + support * 0.05) * delta_years)
        else:
            npc.needs["belonging"] = self._clamp(npc.needs.get("belonging", 0.0) + 0.22 * delta_years)
            npc.needs["safety"] = self._clamp(npc.needs.get("safety", 0.0) + 0.18 * delta_years)
            npc.emotions["fear"] = self._clamp(npc.emotions.get("fear", 0.0) + 0.1 * delta_years)
            npc.emotions["loneliness"] = self._clamp(npc.emotions.get("loneliness", 0.0) + 0.12 * delta_years)
            npc.childhood_security = self._clamp(npc.childhood_security - 0.1 * delta_years)
            npc.parental_attachment = self._clamp(npc.parental_attachment - 0.08 * delta_years)
            npc.developmental_pressure = self._clamp(npc.developmental_pressure + 0.12 * delta_years)
        if stage == "infant" and support <= 0.0:
            npc.health = max(0.0, npc.health - 0.08 * delta_years)
        if stage in {"infant", "child"}:
            if npc.childhood_security > 0.65:
                npc.resilience = self._clamp(npc.resilience + 0.025 * delta_years)
                npc.values["community"] = self._clamp(npc.values.get("community", 0.5) + 0.025 * delta_years)
                npc.values["compassion"] = self._clamp(npc.values.get("compassion", 0.5) + 0.018 * delta_years)
            if npc.developmental_pressure > 0.55:
                npc.trauma = self._clamp(npc.trauma + 0.03 * delta_years)
                npc.values["security"] = self._clamp(npc.values.get("security", 0.5) + 0.025 * delta_years)
                npc.values["independence"] = self._clamp(npc.values.get("independence", 0.5) + 0.018 * delta_years)

    def _update_health_conditions(self, npc: NpcState, delta_years: float) -> None:
        tile = self.world.inspect_tile(npc.x, npc.y)
        house = self.world.find_structure_at_or_near(npc.x, npc.y, "house", radius=5)
        sheltered = house is not None
        caregiver_bonus = self._nearby_caregiver_bonus(npc)
        hazard = float(tile["hazard"])
        moisture = float(tile["moisture"])
        weather = str(self.environment.get("weather", "clear"))
        temperature_stress = float(self.environment.get("temperature_stress", 0.1))
        rainfall = float(self.environment.get("rainfall", 0.4))
        comfort_target = self._clamp(
            0.25
            + (0.36 if sheltered else -0.08)
            + (1.0 - hazard) * 0.18
            + min(0.2, caregiver_bonus * 0.2)
            - npc.hunger * 0.12
            - npc.injury * 0.2
            - temperature_stress * (0.22 if not sheltered else 0.08)
        )
        npc.comfort = self._clamp(npc.comfort + (comfort_target - npc.comfort) * min(1.0, delta_years * 1.6))

        contagion = self._local_contagion_pressure(npc)
        exposure_gain = hazard * 0.16 + max(0.0, moisture - 0.7) * 0.12 + npc.hunger * 0.08
        exposure_gain += rainfall * (0.08 if not sheltered else 0.02)
        exposure_gain += temperature_stress * (0.11 if not sheltered else 0.03)
        exposure_gain += 0.08 if not sheltered and npc.routine_phase == "night_rest" else 0.0
        exposure_gain += 0.12 if weather == "storm" and not sheltered else 0.0
        exposure_gain += 0.06 if weather in {"heat", "cold"} and not sheltered else 0.0
        exposure_gain += contagion * (0.36 if not sheltered else 0.2)
        exposure_relief = npc.immunity * 0.1 + npc.comfort * 0.11 + caregiver_bonus * 0.08
        npc.exposure = self._clamp(npc.exposure + (exposure_gain - exposure_relief) * delta_years)
        if contagion > 0.16:
            npc.emotions["fear"] = self._clamp(npc.emotions.get("fear", 0.0) + contagion * 0.04 * delta_years)
            npc.emotions["stress"] = self._clamp(npc.emotions.get("stress", 0.0) + contagion * 0.05 * delta_years)

        injury_gain = 0.0
        if hazard > 0.65 and npc.intent in {"gather_food", "gather_wood", "scout_area", "seek_food"}:
            injury_gain = (hazard - 0.62) * (0.1 + (0.06 if npc.energy < 0.35 else 0.0))
        if weather == "storm" and npc.intent in {"gather_food", "gather_wood", "scout_area", "seek_food"}:
            injury_gain += 0.07
        npc.injury = self._clamp(npc.injury + injury_gain * delta_years - (0.07 + caregiver_bonus * 0.08 + npc.comfort * 0.04) * delta_years)

        previous = npc.health_condition
        if npc.injury > 0.55:
            npc.health_condition = "injured"
        elif npc.exposure > 0.72:
            npc.health_condition = "sick"
        elif npc.exposure > 0.45 or npc.injury > 0.28:
            npc.health_condition = "weakened"
        else:
            npc.health_condition = "healthy"

        if npc.health_condition == "sick":
            npc.health -= (0.05 + npc.exposure * 0.06) * delta_years
            npc.energy = self._clamp(npc.energy - 0.12 * delta_years)
            npc.emotions["fear"] = self._clamp(npc.emotions.get("fear", 0.0) + 0.08 * delta_years)
            npc.needs["safety"] = self._clamp(npc.needs.get("safety", 0.0) + 0.1 * delta_years)
        elif npc.health_condition == "injured":
            npc.health -= (0.035 + npc.injury * 0.05) * delta_years
            npc.energy = self._clamp(npc.energy - 0.08 * delta_years)
            npc.needs["rest"] = self._clamp(npc.needs.get("rest", 0.0) + 0.12 * delta_years)
        elif npc.health_condition == "weakened":
            npc.energy = self._clamp(npc.energy - 0.04 * delta_years)
            npc.needs["rest"] = self._clamp(npc.needs.get("rest", 0.0) + 0.06 * delta_years)
        elif npc.hunger < 0.55 and npc.energy > 0.35 and npc.comfort > 0.45:
            npc.health = min(1.0, npc.health + 0.025 * delta_years)

        if npc.health_condition != previous:
            self._record_life_event(npc, f"Became {npc.health_condition}.", 0.5)

    def _nearby_caregiver_bonus(self, npc: NpcState) -> float:
        bonus = 0.0
        for other in self.npcs.values():
            if not other.alive or other.npc_id == npc.npc_id:
                continue
            if other.role != "caregiver":
                continue
            distance = math.dist((npc.x, npc.y), (other.x, other.y))
            if distance <= 8:
                bonus += max(0.0, 1.0 - distance / 8.0) * (0.4 + other.values.get("compassion", 0.5) * 0.6)
        return min(1.0, bonus)

    def _apply_care_social_effects(self, patient: NpcState, delta_years: float) -> None:
        if patient.health_condition not in {"sick", "injured", "weakened"}:
            return
        for caregiver in self.npcs.values():
            if not caregiver.alive or caregiver.npc_id == patient.npc_id or caregiver.role != "caregiver":
                continue
            distance = math.dist((patient.x, patient.y), (caregiver.x, caregiver.y))
            if distance > 6:
                continue
            care_norm = self.culture.get("care_norm", 0.5)
            amount = (0.02 + caregiver.values.get("compassion", 0.5) * 0.025 + care_norm * 0.015) * delta_years
            caregiver.reputation = max(-1.0, min(1.0, caregiver.reputation + amount))
            caregiver.status = max(-1.0, min(1.0, caregiver.status + amount * 0.35))
            caregiver.resentment = self._clamp(caregiver.resentment - amount * 0.3)
            caregiver.needs["purpose"] = self._clamp(caregiver.needs.get("purpose", 0.0) - amount)
            patient.gratitude = self._clamp(patient.gratitude + amount * 1.7)
            patient.resentment = self._clamp(patient.resentment - amount * 0.4)
            self._adjust_affinity(patient, caregiver, amount * 0.8)
            self.culture["care_norm"] = self._clamp(self.culture.get("care_norm", 0.5) + amount * 0.4)

    def _update_long_term_psychology(self, npc: NpcState, delta_years: float) -> None:
        self._decay_memory_bias(npc, delta_years)
        strong_bonds = sum(1 for edge in npc.relationships if edge.affinity > 0.45)
        safety = 1.0 - npc.needs.get("safety", 0.0)
        bias = self._memory_bias(npc)
        recovery = (
            npc.resilience * 0.05
            + npc.comfort * 0.035
            + min(0.08, strong_bonds * 0.018)
            + max(0.0, npc.gratitude) * 0.02
            + bias.get("care", 0.0) * 0.012
            + bias.get("belonging", 0.0) * 0.014
        )
        stress_load = (
            npc.emotions.get("fear", 0.0) * 0.018
            + npc.emotions.get("stress", 0.0) * 0.014
            + max(0.0, 0.4 - safety) * 0.025
            + (0.03 if npc.health_condition in {"sick", "injured"} else 0.0)
            + bias.get("loss", 0.0) * 0.012
            + bias.get("conflict", 0.0) * 0.01
        )
        npc.trauma = self._clamp(npc.trauma + (stress_load - recovery) * delta_years)
        npc.gratitude = self._clamp(npc.gratitude - 0.04 * delta_years)
        npc.recent_event_weight = self._clamp(npc.recent_event_weight - 0.08 * delta_years)
        npc.reputation = max(-1.0, min(1.0, npc.reputation * (1.0 - min(0.08, 0.015 * delta_years))))
        if npc.trauma > 0.55:
            npc.emotions["fear"] = self._clamp(npc.emotions.get("fear", 0.0) + 0.05 * delta_years)
            npc.needs["safety"] = self._clamp(npc.needs.get("safety", 0.0) + 0.04 * delta_years)
            npc.social_preference = self._clamp(npc.social_preference - 0.015 * delta_years)
        elif npc.trauma < 0.25 and npc.gratitude > 0.2:
            npc.emotions["trust"] = self._clamp(npc.emotions.get("trust", 0.0) + 0.035 * delta_years)
        self._update_worldview(npc)

    def _memory_bias(self, npc: NpcState) -> dict[str, float]:
        defaults = {
            "scarcity": 0.0,
            "loss": 0.0,
            "conflict": 0.0,
            "care": 0.0,
            "awe": 0.0,
            "shelter": 0.0,
            "belonging": 0.0,
        }
        for key, value in defaults.items():
            npc.memory_bias.setdefault(key, value)
        return npc.memory_bias

    def _decay_memory_bias(self, npc: NpcState, delta_years: float) -> None:
        if delta_years <= 0.0:
            return
        bias = self._memory_bias(npc)
        decay = max(0.0, 1.0 - min(0.03, delta_years * 0.012))
        for key in list(bias):
            bias[key] = self._clamp(bias[key] * decay)

    def _apply_memory_bias(self, npc: NpcState, text: str, importance: float) -> None:
        lowered = text.lower()
        bias = self._memory_bias(npc)
        categories: list[str] = []
        if any(word in lowered for word in ("food", "hunger", "ration", "scarcity", "weakens")):
            categories.append("scarcity")
        if any(word in lowered for word in ("died", "death", "grieved")):
            categories.append("loss")
        if any(word in lowered for word in ("argued", "dispute", "strained")):
            categories.append("conflict")
        if any(word in lowered for word in ("care", "sick", "injured", "mended", "mediated")):
            categories.append("care")
        if any(word in lowered for word in ("divine", "omen", "miracle", "sacred")):
            categories.append("awe")
        if any(word in lowered for word in ("shelter", "home", "house", "roof")):
            categories.append("shelter")
        if any(word in lowered for word in ("married", "child", "bond", "welcomed", "family")):
            categories.append("belonging")
        if not categories:
            return
        amount = self._clamp(importance) * 0.18
        for category in categories:
            bias[category] = self._clamp(bias.get(category, 0.0) + amount)
        if "scarcity" in categories:
            npc.values["security"] = self._clamp(npc.values.get("security", 0.5) + amount * 0.16)
            npc.values["ambition"] = self._clamp(npc.values.get("ambition", 0.5) + amount * 0.08)
        if "loss" in categories:
            npc.values["security"] = self._clamp(npc.values.get("security", 0.5) + amount * 0.18)
            npc.values["community"] = self._clamp(npc.values.get("community", 0.5) + amount * 0.08)
        if "conflict" in categories:
            npc.values["independence"] = self._clamp(npc.values.get("independence", 0.5) + amount * 0.1)
            npc.values["community"] = self._clamp(npc.values.get("community", 0.5) - amount * 0.06)
        if "care" in categories:
            npc.values["compassion"] = self._clamp(npc.values.get("compassion", 0.5) + amount * 0.18)
            npc.values["community"] = self._clamp(npc.values.get("community", 0.5) + amount * 0.08)
        if "awe" in categories:
            npc.faith = self._clamp(npc.faith + amount * 0.16)
            npc.values["tradition"] = self._clamp(npc.values.get("tradition", 0.5) + amount * 0.08)
        if "shelter" in categories:
            npc.values["security"] = self._clamp(npc.values.get("security", 0.5) + amount * 0.1)
        if "belonging" in categories:
            npc.values["community"] = self._clamp(npc.values.get("community", 0.5) + amount * 0.12)
        self._update_worldview(npc)

    def _update_worldview(self, npc: NpcState) -> None:
        bias = self._memory_bias(npc)
        strongest, strength = max(bias.items(), key=lambda item: item[1])
        if strength < 0.18:
            npc.worldview = "unformed"
            return
        npc.worldview = {
            "scarcity": "scarcity-minded",
            "loss": "grief-marked",
            "conflict": "guarded",
            "care": "care-bound",
            "awe": "omen-led",
            "shelter": "home-seeking",
            "belonging": "kin-centered",
        }.get(strongest, "unformed")

    def _update_social_drives(self, npc: NpcState, delta_years: float) -> None:
        previous_state = npc.social_state
        previous_focus = npc.social_focus_id
        focus = self._choose_social_focus(npc)
        state = "settled"
        if npc.emotions.get("sadness", 0.0) > 0.64 and npc.recent_event_weight > 0.25:
            state = "grieving"
        elif self._family_needs_guarding(npc, focus):
            state = "guarding_family"
        elif focus is not None and self._affinity(npc, focus) < -0.2 and (
            npc.emotions.get("anger", 0.0) > 0.42 or npc.emotions.get("fear", 0.0) > 0.48
        ):
            state = "avoiding_conflict"
        elif focus is not None and self._affinity(npc, focus) < -0.08 and npc.emotions.get("anger", 0.0) < 0.42:
            state = "repairing_bond"
        elif npc.needs.get("belonging", 0.0) > 0.56 or npc.emotions.get("loneliness", 0.0) > 0.52 or (self.life_stage(npc) in {"infant", "child"} and npc.parental_attachment < 0.35):
            state = "seeking_comfort"
        elif npc.attachment_style == "anxious" and npc.needs.get("safety", 0.0) > 0.5:
            state = "seeking_comfort"
        elif npc.attachment_style == "avoidant" and npc.emotions.get("stress", 0.0) > 0.62:
            state = "avoiding_conflict"

        npc.social_state = state
        npc.social_focus_id = focus.npc_id if focus is not None else None
        if state != previous_state or npc.social_focus_id != previous_focus:
            npc.last_social_year = npc.age_years

        if focus is None:
            if state in {"grieving", "seeking_comfort"}:
                npc.emotions["loneliness"] = self._clamp(npc.emotions.get("loneliness", 0.0) + 0.045 * delta_years)
            return

        distance = math.dist((npc.x, npc.y), (focus.x, focus.y))
        close = distance <= max(3.0, npc.personal_space + 2.0)
        if state in {"seeking_comfort", "grieving"} and close:
            relief = (0.08 + max(0.0, self._affinity(npc, focus)) * 0.08) * delta_years
            npc.emotions["loneliness"] = self._clamp(npc.emotions.get("loneliness", 0.0) - relief)
            npc.emotions["fear"] = self._clamp(npc.emotions.get("fear", 0.0) - relief * 0.6)
            npc.emotions["trust"] = self._clamp(npc.emotions.get("trust", 0.0) + relief * 0.5)
            self._adjust_affinity(npc, focus, relief * 0.25)
        elif state == "guarding_family" and close:
            npc.needs["purpose"] = self._clamp(npc.needs.get("purpose", 0.0) - 0.075 * delta_years)
            npc.emotions["trust"] = self._clamp(npc.emotions.get("trust", 0.0) + 0.04 * delta_years)
            self._adjust_affinity(npc, focus, 0.018 * delta_years)
        elif state == "repairing_bond" and close:
            repair = (0.035 + npc.values.get("compassion", 0.5) * 0.025) * delta_years
            npc.emotions["anger"] = self._clamp(npc.emotions.get("anger", 0.0) - repair)
            focus.emotions["anger"] = self._clamp(focus.emotions.get("anger", 0.0) - repair * 0.5)
            self._adjust_affinity(npc, focus, repair)
            if previous_state != "repairing_bond":
                self._record_life_event(npc, f"Tried to mend things with {focus.name}.", 0.4)
        elif state == "avoiding_conflict" and distance < 5:
            npc.emotions["stress"] = self._clamp(npc.emotions.get("stress", 0.0) + 0.06 * delta_years)
            npc.emotions["anger"] = self._clamp(npc.emotions.get("anger", 0.0) + 0.035 * delta_years)

    def _choose_social_focus(self, npc: NpcState) -> NpcState | None:
        candidates: list[tuple[float, NpcState]] = []
        for other in self.npcs.values():
            if not other.alive or other.npc_id == npc.npc_id:
                continue
            distance = math.dist((npc.x, npc.y), (other.x, other.y))
            if distance > 64:
                continue
            affinity = self._affinity(npc, other)
            score = affinity * 0.55 - distance * 0.008
            if npc.spouse_id == other.npc_id:
                score += 0.75
            if other.npc_id in npc.child_ids:
                score += 0.65
            if other.npc_id in npc.parent_ids:
                score += 0.55
            if self.life_stage(npc) in {"infant", "child"} and other.npc_id in npc.parent_ids:
                score += 0.9
            if other.health_condition in {"sick", "injured", "weakened"} and (
                other.npc_id in npc.child_ids or npc.role == "caregiver" or npc.values.get("compassion", 0.5) > 0.62
            ):
                score += 0.55
            if affinity < -0.1 and (npc.emotions.get("anger", 0.0) > 0.38 or npc.emotions.get("fear", 0.0) > 0.42):
                score += 0.5
            elif affinity < -0.1 and npc.emotions.get("anger", 0.0) < 0.42:
                score += 0.22
            if npc.attachment_style == "avoidant" and affinity < 0.15:
                score -= 0.18
            if npc.attachment_style == "anxious" and affinity > 0.2:
                score += 0.2
            candidates.append((score, other))
        if not candidates:
            return None
        candidates.sort(key=lambda item: item[0], reverse=True)
        return candidates[0][1] if candidates[0][0] > -0.05 else None

    def _family_needs_guarding(self, npc: NpcState, focus: NpcState | None) -> bool:
        if focus is None:
            return False
        if focus.npc_id not in npc.child_ids and focus.npc_id not in npc.parent_ids and focus.npc_id != npc.spouse_id:
            return False
        if self.life_stage(focus) in {"infant", "child", "elder"}:
            return True
        return focus.health_condition in {"sick", "injured", "weakened"} or focus.needs.get("safety", 0.0) > 0.58

    def _affinity(self, source: NpcState, target: NpcState) -> float:
        edge = next((item for item in source.relationships if item.npc_id == target.npc_id), None)
        if edge is None:
            return 0.0
        return edge.affinity

    def _update_welfare_state(self, npc: NpcState, delta_years: float) -> None:
        house = self.world.find_structure_at_or_near(npc.x, npc.y, "house", radius=6)
        sheltered = house is not None
        kin_near = 0
        trusted_near = 0
        for other in self.npcs.values():
            if not other.alive or other.npc_id == npc.npc_id:
                continue
            distance = math.dist((npc.x, npc.y), (other.x, other.y))
            if distance > 10:
                continue
            if other.npc_id in npc.parent_ids or other.npc_id in npc.child_ids or other.npc_id == npc.spouse_id:
                kin_near += 1
            if self._affinity(npc, other) > 0.35:
                trusted_near += 1

        stores_per_person = self.resource_pressure.get("stores_per_person", 0.0)
        personal_food = npc.inventory.get("food", 0.0)
        nutrition_target = self._clamp(
            0.18
            + (1.0 - npc.hunger) * 0.42
            + min(0.22, stores_per_person * 0.16)
            + min(0.12, personal_food * 0.04)
            + self.resource_pressure.get("ration_level", 0.0) * 0.16
        )
        sleep_target = self._clamp(
            npc.needs.get("rest", 0.0) * 0.52
            + (0.28 if npc.routine_phase != "night_rest" and npc.energy < 0.35 else 0.0)
            + (0.18 if not sheltered and npc.routine_phase == "night_rest" else 0.0)
            + (0.16 if npc.health_condition in {"sick", "injured", "weakened"} else 0.0)
        )
        shelter_target = self._clamp(
            (0.72 if sheltered else 0.18)
            + (1.0 - self.resource_pressure.get("shelter", 0.0)) * 0.16
            + npc.comfort * 0.12
            - float(self.environment.get("temperature_stress", 0.0)) * (0.08 if sheltered else 0.22)
            - (0.14 if str(self.environment.get("weather", "clear")) in {"storm", "cold", "heat"} and not sheltered else 0.0)
        )
        household_target = self._clamp(
            shelter_target * 0.32
            + nutrition_target * 0.24
            + min(0.22, kin_near * 0.09 + trusted_near * 0.045)
            + self.culture.get("cohesion", 0.5) * 0.16
            + self.culture.get("care_norm", 0.5) * 0.06
            - self.resource_pressure.get("food", 0.0) * 0.1
            - self.disease_pressure.get("risk", 0.0) * 0.08
        )

        rate = min(1.0, delta_years * 1.4)
        npc.nutrition = self._clamp(npc.nutrition + (nutrition_target - npc.nutrition) * rate)
        npc.sleep_debt = self._clamp(npc.sleep_debt + (sleep_target - npc.sleep_debt) * rate)
        npc.shelter_security = self._clamp(npc.shelter_security + (shelter_target - npc.shelter_security) * rate)
        npc.household_stability = self._clamp(npc.household_stability + (household_target - npc.household_stability) * rate)

        deprivation = max(0.0, 0.36 - npc.nutrition) + max(0.0, npc.sleep_debt - 0.62) + max(0.0, 0.34 - npc.shelter_security)
        if deprivation > 0.0:
            npc.emotions["stress"] = self._clamp(npc.emotions.get("stress", 0.0) + deprivation * 0.08 * delta_years)
            npc.emotions["fear"] = self._clamp(npc.emotions.get("fear", 0.0) + deprivation * 0.04 * delta_years)
            npc.needs["safety"] = self._clamp(npc.needs.get("safety", 0.0) + deprivation * 0.05 * delta_years)
            npc.health = max(0.0, npc.health - deprivation * 0.025 * delta_years)
        if npc.household_stability > 0.68 and npc.nutrition > 0.55:
            npc.emotions["trust"] = self._clamp(npc.emotions.get("trust", 0.0) + 0.025 * delta_years)
            npc.needs["belonging"] = self._clamp(npc.needs.get("belonging", 0.0) - 0.04 * delta_years)

    def _update_status_state(self, npc: NpcState, delta_years: float) -> None:
        if delta_years <= 0.0:
            return
        age_weight = 0.12 if 28 <= npc.age_years <= 64 else (-0.08 if npc.age_years < 14 else 0.02)
        role_weight = {
            "caregiver": self.culture.get("care_norm", 0.5) * 0.18,
            "gatherer": (1.0 - self.resource_pressure.get("food", 0.0)) * 0.12 + npc.skills.get("forage", 0.5) * 0.08,
            "builder": (1.0 - self.resource_pressure.get("shelter", 0.0)) * 0.08 + npc.skills.get("craft", 0.5) * 0.12,
            "scout": self.culture.get("risk_tolerance", 0.4) * 0.12,
        }.get(npc.role, 0.0)
        welfare_weight = npc.household_stability * 0.1 + npc.nutrition * 0.07 - npc.sleep_debt * 0.06
        target = max(
            -1.0,
            min(
                1.0,
                npc.reputation * 0.42
                + npc.leadership * 0.18
                + role_weight
                + welfare_weight
                + age_weight
                + max(0.0, npc.gratitude) * 0.08
                - npc.resentment * 0.2
                - npc.trauma * 0.08,
            ),
        )
        npc.status = max(-1.0, min(1.0, npc.status + (target - npc.status) * min(1.0, delta_years * 0.5)))
        if npc.status < -0.22:
            npc.resentment = self._clamp(npc.resentment + (0.02 + abs(npc.status) * 0.025) * delta_years)
            npc.emotions["anger"] = self._clamp(npc.emotions.get("anger", 0.0) + 0.018 * delta_years)
        else:
            npc.resentment = self._clamp(npc.resentment - (0.018 + npc.household_stability * 0.012) * delta_years)
        if npc.status > 0.38:
            npc.emotions["trust"] = self._clamp(npc.emotions.get("trust", 0.0) + 0.012 * delta_years)
            npc.needs["purpose"] = self._clamp(npc.needs.get("purpose", 0.0) - 0.02 * delta_years)

    def _choose_goal(self, npc: NpcState) -> None:
        previous = npc.current_goal
        severe_weather = str(self.environment.get("weather", "clear")) in {"storm", "heat", "cold"}
        bias = self._memory_bias(npc)
        if npc.health_condition in {"sick", "injured"} or npc.health < 0.45 or npc.needs.get("rest", 0.0) > 0.72:
            goal = "recover"
        elif npc.social_state == "grieving":
            goal = "seek_comfort"
        elif self.life_stage(npc) in {"infant", "child"} and npc.developmental_pressure > 0.55:
            goal = "seek_comfort"
        elif self.life_stage(npc) in {"infant", "child"}:
            goal = "stay_with_family"
        elif npc.social_state == "guarding_family":
            goal = "guard_family"
        elif npc.social_state == "repairing_bond":
            goal = "repair_bond"
        elif severe_weather and npc.needs.get("shelter", 0.0) > 0.35:
            goal = "build_home"
        elif npc.nutrition < 0.34 or (
            npc.hunger > 0.62
            or self.tribe_food < max(3.0, self.living_population() * 0.25)
            or self.resource_pressure.get("food", 0.0) > 0.68
            or (self.culture.get("scarcity_memory", 0.25) > 0.62 and npc.role == "gatherer")
            or (bias.get("scarcity", 0.0) > 0.48 and npc.role == "gatherer")
        ):
            goal = "secure_food"
        elif (npc.child_ids or self.dependency_pressure.get("care_load", 0.0) > 0.55) and npc.values.get("compassion", 0.0) > 0.45:
            goal = "raise_child"
        elif npc.shelter_security < 0.32 or npc.needs.get("shelter", 0.0) > 0.62 or self._shelter_pressure() > 0.25 or bias.get("shelter", 0.0) > 0.55:
            goal = "build_home"
        elif npc.social_state == "seeking_comfort" or npc.needs.get("belonging", 0.0) > 0.58 or npc.emotions.get("loneliness", 0.0) > 0.55 or bias.get("belonging", 0.0) > 0.58:
            goal = "strengthen_bond"
        elif npc.role == "scout" and npc.values.get("independence", 0.0) > 0.5 and npc.emotions.get("fear", 0.0) < 0.55:
            goal = "explore_safely"
        elif npc.values.get("tradition", 0.0) > 0.68 and (npc.faith > 0.55 or self.culture.get("spirituality", 0.45) > 0.65 or bias.get("awe", 0.0) > 0.45):
            goal = "keep_ritual"
        else:
            goal = "settle_near_tribe"
        if goal != previous:
            npc.current_goal = goal
            npc.goal_progress = 0.0

    def _apply_coping(self, npc: NpcState, delta_years: float) -> None:
        if npc.emotions.get("stress", 0.0) < 0.45 and npc.emotions.get("fear", 0.0) < 0.45:
            return
        if npc.coping_style == "seek_support":
            npc.needs["belonging"] = self._clamp(npc.needs.get("belonging", 0.0) + 0.04 * delta_years)
            npc.intent = "seek_company"
        elif npc.coping_style == "work":
            npc.needs["purpose"] = self._clamp(npc.needs.get("purpose", 0.0) - 0.06 * delta_years)
        elif npc.coping_style == "withdraw":
            npc.emotions["anger"] = self._clamp(npc.emotions.get("anger", 0.0) - 0.05 * delta_years)
            npc.needs["belonging"] = self._clamp(npc.needs.get("belonging", 0.0) + 0.03 * delta_years)
        elif npc.coping_style == "pray":
            npc.faith = self._clamp(npc.faith + 0.03 * delta_years)
            npc.emotions["fear"] = self._clamp(npc.emotions.get("fear", 0.0) - 0.04 * delta_years)
        elif npc.coping_style == "confront":
            npc.emotions["anger"] = self._clamp(npc.emotions.get("anger", 0.0) + 0.04 * delta_years)

    def _update_goal_progress(self, npc: NpcState, delta_years: float) -> None:
        goal = npc.current_goal
        gain = 0.0
        if goal == "secure_food" and (npc.intent in {"seek_food", "gather_food"} or npc.inventory.get("food", 0.0) > 0.5):
            gain = 0.32
        elif goal == "build_home" and (npc.intent == "gather_wood" or npc.inventory.get("wood", 0.0) > 0.5):
            gain = 0.24
        elif goal == "strengthen_bond" and npc.intent in {"seek_company", "socialize", "support_tribe"}:
            gain = 0.28
        elif goal == "recover" and npc.intent == "rest":
            gain = 0.35
        elif goal == "raise_child" and (npc.child_ids or npc.intent in {"care_for_family", "support_tribe", "care_for_sick"}):
            gain = 0.16
        elif goal == "guard_family" and npc.intent in {"care_for_family", "stay_near_family"}:
            gain = 0.2
        elif goal == "repair_bond" and npc.intent == "seek_company":
            gain = 0.22
        elif goal == "seek_comfort" and npc.intent in {"seek_company", "rest"}:
            gain = 0.2
        elif goal == "stay_with_family" and npc.intent in {"stay_near_family", "rest"}:
            gain = 0.18
        elif goal == "explore_safely" and npc.intent == "scout_area":
            gain = 0.2
        elif goal in {"settle_near_tribe", "keep_ritual"}:
            gain = 0.12
        npc.goal_progress = self._clamp(npc.goal_progress + gain * delta_years)
        npc.morale = self._community_morale()
        if npc.goal_progress >= 1.0:
            label = goal.replace("_", " ")
            npc.emotions["joy"] = self._clamp(npc.emotions.get("joy", 0.0) + 0.08)
            npc.needs["purpose"] = self._clamp(npc.needs.get("purpose", 0.0) - 0.12)
            self._record_life_event(npc, f"Made progress toward {label}.", 0.35)
            npc.goal_progress = 0.0

    def _should_speak_need(self, npc: NpcState, delta_years: float) -> bool:
        if npc.age_years - npc.last_dialogue_year < 0.08:
            return False
        pressure = max(
            npc.hunger,
            npc.needs.get("shelter", 0.0),
            npc.emotions.get("fear", 0.0),
            npc.emotions.get("loneliness", 0.0),
            npc.emotions.get("stress", 0.0),
            npc.trauma,
        )
        if pressure < 0.68:
            return False
        chance = min(0.12, (pressure - 0.62) * 0.22 * delta_years)
        return self.rng.random() < chance

    def _compose_need_line(self, npc: NpcState) -> str:
        if npc.hunger > 0.88 or npc.nutrition < 0.25:
            return self.rng.choice(
                [
                    "The stores are thin; I am going to gather food.",
                    "I need berries before my strength leaves me.",
                    "Food comes first today.",
                ]
            )
        if npc.health_condition == "sick":
            return self.rng.choice(
                [
                    "I am sick; keep the children away from my breath.",
                    "My body burns, and I need shelter.",
                    "Someone should watch the sick tonight.",
                ]
            )
        if npc.health_condition == "injured" or npc.injury > 0.35:
            return self.rng.choice(
                [
                    "I am hurt and cannot range far.",
                    "My wound slows me; I need help close by.",
                    "Let me rest before I fail the tribe.",
                ]
            )
        if npc.needs.get("shelter", 0.0) > 0.78 or npc.shelter_security < 0.24:
            return self.rng.choice(
                [
                    "We need stronger walls before night.",
                    "This shelter will not hold if the weather turns.",
                    "Wood should go to houses before anything else.",
                ]
            )
        if npc.emotions.get("fear", 0.0) > 0.75 or npc.needs.get("safety", 0.0) > 0.75:
            return self.rng.choice(
                [
                    "Stay close; something feels wrong.",
                    "No one should walk alone right now.",
                    "Bring the young ones near the fires.",
                ]
            )
        if npc.emotions.get("loneliness", 0.0) > 0.78 or npc.needs.get("belonging", 0.0) > 0.78:
            return self.rng.choice(
                [
                    "Sit with me when the work is done.",
                    "I do not want to sleep apart from the others.",
                    "The tribe feels too quiet around me.",
                ]
            )
        if npc.emotions.get("stress", 0.0) > 0.82 or npc.trauma > 0.62:
            return self.rng.choice(
                [
                    "I need the camp calm for a while.",
                    "Too much has happened; let us keep together.",
                    "The old fear is loud today.",
                ]
            )
        return ""

    def _emit_speech(self, npc: NpcState, line: str, prefix: str = "") -> bool:
        line = compress_to_single_sentence(line)
        lowered = line.lower()
        banned_fragments = (
            "turns the thought over",
            "decides to reflect",
            "random thought",
            "generic thought",
            "ponders silently",
            "ponder silently",
            "chooses to reflect",
            "needs to reflect",
            "i feel calm and need to keep ritual",
        )
        if any(fragment in lowered for fragment in banned_fragments):
            return False
        if not line or line == npc.last_speech_text or line in npc.speech_buffer[-2:]:
            return False
        npc.speech_buffer.append(line)
        npc.speech_buffer = npc.speech_buffer[-4:]
        npc.last_dialogue_year = npc.age_years
        npc.last_speech_text = line
        self._record_speech(f"{prefix}{line}")
        return True

    def _shelter_pressure(self) -> float:
        living = self.living_population()
        if living == 0:
            return 0.0
        house_count = sum(
            1
            for chunk in self.world.chunk_cache.values()
            for structure in chunk.structures
            if structure["type"] == "house"
        )
        protected = house_count * 3
        return self._clamp((living - protected) / max(1, living))

    def _house_capacity(self) -> int:
        return sum(
            3
            for chunk in self.world.chunk_cache.values()
            for structure in chunk.structures
            if structure["type"] == "house"
        )

    def _update_resource_pressure(self) -> None:
        living = self.living_population()
        if living == 0:
            self.resource_pressure.update(
                {"food": 0.0, "shelter": 0.0, "ration_level": 1.0, "stores_per_person": 0.0, "house_capacity": 0.0}
            )
            return
        stores_per_person = self.tribe_food / max(1, living)
        food_pressure = self._clamp(1.0 - stores_per_person / 1.2)
        shelter_pressure = self._shelter_pressure()
        ration_level = self._clamp(stores_per_person / 0.75)
        self.resource_pressure.update(
            {
                "food": food_pressure,
                "shelter": shelter_pressure,
                "ration_level": ration_level,
                "stores_per_person": stores_per_person,
                "house_capacity": float(self._house_capacity()),
            }
        )

    def _apply_rationing(self, delta_years: float) -> None:
        if delta_years <= 0.0 or self.tribe_food <= 0.0:
            return
        living = [npc for npc in self.npcs.values() if npc.alive]
        if not living:
            return
        care_norm = self.culture.get("care_norm", 0.5)
        cohesion = self.culture.get("cohesion", 0.5)
        ration_budget = min(self.tribe_food, max(0.0, len(living) * (0.08 + care_norm * 0.08) * delta_years))
        if ration_budget <= 0.0:
            return
        hungry = sorted(
            [npc for npc in living if npc.hunger > 0.48],
            key=lambda npc: (
                npc.hunger
                + (0.1 if npc.health_condition in {"sick", "injured", "weakened"} else 0.0)
                + npc.gratitude * 0.03
                + max(0.0, npc.leadership) * 0.03
                - max(0.0, npc.status) * 0.02
            ),
            reverse=True,
        )
        if not hungry:
            return
        recipients = max(1, round(1 + cohesion * min(len(hungry), 6)))
        for npc in hungry[:recipients]:
            if ration_budget <= 0.0:
                break
            meal = min(0.22, ration_budget, npc.hunger)
            npc.hunger = max(0.0, npc.hunger - meal)
            npc.gratitude = self._clamp(npc.gratitude + meal * 0.08)
            npc.emotions["trust"] = self._clamp(npc.emotions.get("trust", 0.0) + meal * 0.04)
            ration_budget -= meal
            self.tribe_food -= meal
        if ration_budget <= 0.0 and len(hungry) > recipients:
            for npc in hungry[recipients:]:
                npc.emotions["anger"] = self._clamp(npc.emotions.get("anger", 0.0) + 0.015 * delta_years)
                npc.needs["safety"] = self._clamp(npc.needs.get("safety", 0.0) + 0.012 * delta_years)
                npc.resentment = self._clamp(npc.resentment + 0.035 * delta_years)

    def _update_role_pressure(self) -> None:
        living = [npc for npc in self.npcs.values() if npc.alive and npc.age_years >= 12]
        if not living:
            self.role_pressure.update({"gatherer": 0.0, "builder": 0.0, "caregiver": 0.0, "scout": 0.0, "coverage": 1.0})
            return
        counts = {role: sum(1 for npc in living if npc.role == role) for role in ROLE_LABELS}
        total = max(1, len(living))
        unwell = sum(1 for npc in living if npc.health_condition in {"sick", "injured", "weakened"})
        children = sum(1 for npc in self.npcs.values() if npc.alive and npc.age_years < 12)
        demands = {
            "gatherer": 0.28 + self.resource_pressure.get("food", 0.0) * 0.5 + self.culture.get("scarcity_memory", 0.25) * 0.16,
            "builder": 0.22 + self.resource_pressure.get("shelter", 0.0) * 0.5 + (0.18 if str(self.environment.get("weather", "clear")) in {"storm", "cold"} else 0.0),
            "caregiver": 0.18 + min(0.45, (unwell + children) / max(1, total) * 0.55) + self.dependency_pressure.get("care_load", 0.0) * 0.28 + self.culture.get("care_norm", 0.5) * 0.16 + self.disease_pressure.get("risk", 0.0) * 0.22,
            "scout": 0.14 + max(0.0, 1.0 - self.resource_pressure.get("food", 0.0)) * 0.18 + self.culture.get("risk_tolerance", 0.4) * 0.12,
        }
        role_pressure: dict[str, float] = {}
        coverage_values: list[float] = []
        for role, demand in demands.items():
            supply = counts[role] / total
            pressure = self._clamp(demand - supply)
            role_pressure[role] = pressure
            coverage_values.append(self._clamp(supply / max(0.01, demand)))
        role_pressure["coverage"] = sum(coverage_values) / len(coverage_values)
        self.role_pressure.update(role_pressure)

    def _update_dependency_pressure(self) -> None:
        living = [npc for npc in self.npcs.values() if npc.alive]
        if not living:
            self.dependency_pressure.update({"infants": 0.0, "children": 0.0, "elders": 0.0, "dependents": 0.0, "care_load": 0.0})
            return
        infants = sum(1 for npc in living if self.life_stage(npc) == "infant")
        children = sum(1 for npc in living if self.life_stage(npc) == "child")
        elders = sum(1 for npc in living if self.life_stage(npc) == "elder")
        unwell = sum(1 for npc in living if npc.health_condition in {"sick", "injured", "weakened"})
        caregivers = sum(1 for npc in living if npc.role == "caregiver" and npc.health_condition not in {"sick", "injured"})
        dependents = infants * 1.2 + children * 0.65 + elders * 0.45 + unwell * 0.8
        care_capacity = max(1.0, caregivers * 1.4 + sum(1 for npc in living if self.life_stage(npc) == "adult") * 0.12)
        self.dependency_pressure.update(
            {
                "infants": float(infants),
                "children": float(children),
                "elders": float(elders),
                "dependents": dependents,
                "care_load": self._clamp(dependents / care_capacity),
            }
        )

    def _update_disease_pressure(self) -> None:
        living = [npc for npc in self.npcs.values() if npc.alive]
        if not living:
            self.disease_pressure.update({"sick": 0.0, "weakened": 0.0, "risk": 0.0, "crowding": 0.0, "care_exposure": 0.0})
            return
        sick_count = sum(1 for npc in living if npc.health_condition == "sick")
        weakened_count = sum(1 for npc in living if npc.health_condition in {"weakened", "injured"})
        house_capacity = max(1.0, self.resource_pressure.get("house_capacity", 0.0))
        crowding = self._clamp(len(living) / house_capacity - 1.0)
        weather = str(self.environment.get("weather", "clear"))
        weather_risk = 0.18 if weather in {"rain", "storm", "cold"} else 0.04
        care_exposure = self.dependency_pressure.get("care_load", 0.0) * 0.35
        sick_ratio = sick_count / len(living)
        weakened_ratio = weakened_count / len(living)
        hygiene = self.culture.get("care_norm", 0.5) * 0.18 + self.culture.get("cohesion", 0.5) * 0.08
        risk = self._clamp(sick_ratio * 0.55 + weakened_ratio * 0.18 + crowding * 0.2 + weather_risk + care_exposure - hygiene)
        self.disease_pressure.update(
            {
                "sick": float(sick_count),
                "weakened": float(weakened_count),
                "risk": risk,
                "crowding": crowding,
                "care_exposure": care_exposure,
            }
        )

    def _local_contagion_pressure(self, npc: NpcState) -> float:
        if npc.health_condition == "sick":
            return 0.0
        pressure = 0.0
        for other in self.npcs.values():
            if not other.alive or other.npc_id == npc.npc_id or other.health_condition != "sick":
                continue
            distance = math.dist((npc.x, npc.y), (other.x, other.y))
            if distance <= 3:
                pressure += 0.18
            elif distance <= 7:
                pressure += 0.08 * (1.0 - distance / 8.0)
        if npc.role == "caregiver":
            pressure *= 1.25
        return self._clamp(pressure + self.disease_pressure.get("risk", 0.0) * 0.18)

    def _adapt_roles(self, delta_years: float) -> None:
        if delta_years <= 0.0:
            return
        target_role = max(ROLE_LABELS, key=lambda role: self.role_pressure.get(role, 0.0))
        target_pressure = self.role_pressure.get(target_role, 0.0)
        if target_pressure < 0.22:
            return
        candidates = [
            npc for npc in self.npcs.values()
            if npc.alive
            and 12 <= npc.age_years <= 65
            and npc.role != target_role
            and npc.health_condition not in {"sick", "injured"}
            and not (npc.life_events and npc.life_events[-1].startswith("Changed role"))
        ]
        if not candidates:
            return
        candidates.sort(key=lambda npc: self._role_fit(npc, target_role), reverse=True)
        candidate = candidates[0]
        if self._role_fit(candidate, target_role) < 0.32:
            return
        if self.rng.random() > min(0.35, target_pressure * delta_years * 0.9):
            return
        previous = candidate.role
        candidate.role = target_role
        candidate.intent = {
            "gatherer": "gather_food",
            "builder": "gather_wood",
            "caregiver": "support_tribe",
            "scout": "scout_area",
        }[target_role]
        candidate.needs["purpose"] = self._clamp(candidate.needs.get("purpose", 0.0) - 0.12)
        candidate.reputation = max(-1.0, min(1.0, candidate.reputation + 0.04))
        self.culture["cohesion"] = self._clamp(self.culture.get("cohesion", 0.55) + 0.01)
        self._record_life_event(candidate, f"Changed role from {previous} to {target_role}.", 0.5)

    def _role_fit(self, npc: NpcState, role: str) -> float:
        if role == "gatherer":
            return self._clamp(npc.skills.get("forage", 0.5) * 0.55 + npc.values.get("community", 0.5) * 0.2 + (1.0 - npc.trauma) * 0.25)
        if role == "builder":
            return self._clamp(npc.skills.get("craft", 0.5) * 0.55 + npc.values.get("security", 0.5) * 0.25 + npc.values.get("ambition", 0.5) * 0.2)
        if role == "caregiver":
            return self._clamp(npc.values.get("compassion", 0.5) * 0.55 + npc.values.get("community", 0.5) * 0.25 + npc.social_preference * 0.2)
        if role == "scout":
            return self._clamp(npc.values.get("independence", 0.5) * 0.45 + npc.skills.get("forage", 0.5) * 0.25 + (1.0 - npc.emotions.get("fear", 0.0)) * 0.3)
        return 0.0

    def _community_morale(self) -> float:
        living = [npc for npc in self.npcs.values() if npc.alive]
        if not living:
            return 0.5
        food_score = self._clamp(self.tribe_food / max(4.0, len(living) * 0.75))
        shelter_score = 1.0 - self._shelter_pressure()
        ration_score = 1.0 - self.resource_pressure.get("food", 0.0)
        avg_stress = sum(npc.emotions.get("stress", 0.0) for npc in living) / len(living)
        avg_loneliness = sum(npc.emotions.get("loneliness", 0.0) for npc in living) / len(living)
        avg_trust = sum(npc.emotions.get("trust", 0.5) for npc in living) / len(living)
        avg_household = sum(npc.household_stability for npc in living) / len(living)
        avg_nutrition = sum(npc.nutrition for npc in living) / len(living)
        avg_resentment = sum(npc.resentment for npc in living) / len(living)
        avg_status_floor = sum(max(0.0, npc.status + 0.2) for npc in living) / len(living)
        cohesion = self.culture.get("cohesion", 0.5)
        return self._clamp(food_score * 0.12 + ration_score * 0.09 + shelter_score * 0.12 + avg_trust * 0.16 + cohesion * 0.1 + avg_household * 0.13 + avg_nutrition * 0.08 + avg_status_floor * 0.05 + (1.0 - avg_resentment) * 0.07 + (1.0 - avg_stress) * 0.05 + (1.0 - avg_loneliness) * 0.03)

    def _update_culture(self, delta_years: float) -> None:
        living = [npc for npc in self.npcs.values() if npc.alive]
        if not living or delta_years <= 0.0:
            return
        avg_community = sum(npc.values.get("community", 0.5) for npc in living) / len(living)
        avg_compassion = sum(npc.values.get("compassion", 0.5) for npc in living) / len(living)
        avg_tradition = sum(npc.values.get("tradition", 0.5) for npc in living) / len(living)
        avg_independence = sum(npc.values.get("independence", 0.5) for npc in living) / len(living)
        avg_trauma = sum(npc.trauma for npc in living) / len(living)
        avg_trust = sum(npc.emotions.get("trust", 0.5) for npc in living) / len(living)
        avg_anger = sum(npc.emotions.get("anger", 0.0) for npc in living) / len(living)
        avg_resentment = sum(npc.resentment for npc in living) / len(living)
        avg_leadership = sum(max(0.0, npc.status) * npc.leadership for npc in living) / len(living)
        food_security = self._clamp(self.tribe_food / max(4.0, len(living) * 0.9))
        ration_security = 1.0 - self.resource_pressure.get("food", 0.0)
        shelter_security = 1.0 - self.resource_pressure.get("shelter", self._shelter_pressure())
        disease_risk = self.disease_pressure.get("risk", 0.0)
        crowding = self.disease_pressure.get("crowding", 0.0)
        targets = {
            "cohesion": self._clamp(avg_community * 0.3 + avg_trust * 0.23 + shelter_security * 0.15 + (1.0 - avg_trauma) * 0.16 + avg_leadership * 0.08 + disease_risk * 0.06 + (1.0 - avg_resentment) * 0.02),
            "care_norm": self._clamp(avg_compassion * 0.42 + self.culture.get("cohesion", 0.5) * 0.23 + (1.0 - avg_trauma) * 0.13 + avg_tradition * 0.12 + disease_risk * 0.1),
            "conflict_norm": self._clamp(avg_anger * 0.27 + avg_trauma * 0.22 + avg_resentment * 0.16 + (1.0 - food_security) * 0.14 + (1.0 - ration_security) * 0.1 + avg_independence * 0.08 + crowding * 0.03),
            "tradition": self._clamp(avg_tradition * 0.6 + self.culture.get("spirituality", 0.45) * 0.25 + self.culture.get("cohesion", 0.5) * 0.15),
            "risk_tolerance": self._clamp(avg_independence * 0.35 + food_security * 0.2 + (1.0 - avg_trauma) * 0.25 + avg_trust * 0.2),
            "scarcity_memory": self._clamp((1.0 - food_security) * 0.32 + (1.0 - ration_security) * 0.17 + avg_trauma * 0.28 + (1.0 - shelter_security) * 0.16 + disease_risk * 0.07),
            "spirituality": self._clamp(avg_tradition * 0.28 + sum(npc.faith for npc in living) / len(living) * 0.42 + avg_trauma * 0.11 + self.culture.get("tradition", 0.45) * 0.12 + disease_risk * 0.07),
        }
        rate = min(1.0, delta_years * 0.18)
        for key, target in targets.items():
            current = self.culture.get(key, target)
            self.culture[key] = self._clamp(current + (target - current) * rate)
        weather = str(self.environment.get("weather", "clear"))
        if weather in {"storm", "heat", "cold"}:
            pressure = min(0.04, delta_years * 0.02)
            self.culture["scarcity_memory"] = self._clamp(self.culture.get("scarcity_memory", 0.25) + pressure)
            self.culture["care_norm"] = self._clamp(self.culture.get("care_norm", 0.5) + pressure * 0.6)
            self.culture["cohesion"] = self._clamp(self.culture.get("cohesion", 0.55) + pressure * 0.4)

    def _update_emotional_state(self, npc: NpcState, delta_years: float) -> None:
        nearby = [
            other
            for other in self.npcs.values()
            if other.alive
            and other.npc_id != npc.npc_id
            and math.dist((npc.x, npc.y), (other.x, other.y)) <= 8
        ]
        house = self.world.find_structure_at_or_near(npc.x, npc.y, "house", radius=8)
        tile = self.world.inspect_tile(npc.x, npc.y)
        same_component = tile["component_key"] == npc.home_component_key
        social_support = min(1.0, len(nearby) / 4.0)
        spouse_near = bool(
            npc.spouse_id
            and (spouse := self.npcs.get(npc.spouse_id))
            and spouse.alive
            and math.dist((npc.x, npc.y), (spouse.x, spouse.y)) <= 10
        )

        npc.needs["belonging"] = self._clamp(npc.needs.get("belonging", 0.3) + (0.18 - social_support * 0.34) * delta_years)
        npc.needs["safety"] = self._clamp(npc.needs.get("safety", 0.2) + (tile["hazard"] * 0.26 - (0.12 if house else 0.0) - (0.04 if same_component else 0.0)) * delta_years)
        npc.needs["shelter"] = self._clamp(npc.needs.get("shelter", 0.3) + (0.12 if not house else -0.28) * delta_years)
        npc.needs["purpose"] = self._clamp(npc.needs.get("purpose", 0.3) + (0.08 if npc.intent == "wander" else -0.14) * delta_years)
        npc.needs["rest"] = self._clamp(npc.needs.get("rest", 0.2) + (0.1 + npc.hunger * 0.08 - (0.18 if npc.intent == "rest" else 0.0)) * delta_years)

        loneliness_target = self._clamp(npc.needs["belonging"] - social_support * 0.35 - (0.2 if spouse_near else 0.0))
        fear_target = self._clamp(npc.needs["safety"] + tile["hazard"] * 0.25)
        stress_target = self._clamp(
            npc.hunger * 0.35
            + npc.needs["shelter"] * 0.2
            + npc.needs["purpose"] * 0.12
            + fear_target * 0.25
        )
        sadness_target = self._clamp(loneliness_target * 0.45 + (1.0 - npc.health) * 0.35)
        joy_target = self._clamp(
            0.25
            + social_support * 0.28
            + (0.15 if spouse_near else 0.0)
            + (1.0 - npc.hunger) * 0.15
            - stress_target * 0.3
        )
        trust_target = self._clamp(0.3 + social_support * 0.35 + npc.beliefs.get("community", 0.5) * 0.25 + (npc.component_attunement * 0.08 if same_component else -0.04))

        self._approach_emotion(npc, "loneliness", loneliness_target, delta_years)
        self._approach_emotion(npc, "fear", fear_target, delta_years)
        self._approach_emotion(npc, "stress", stress_target, delta_years)
        self._approach_emotion(npc, "sadness", sadness_target, delta_years)
        self._approach_emotion(npc, "joy", joy_target, delta_years)
        self._approach_emotion(npc, "trust", trust_target, delta_years)
        self._approach_emotion(npc, "anger", stress_target * 0.35, delta_years * 0.65)
        npc.mood = self._derive_mood(npc)

    def _approach_emotion(self, npc: NpcState, name: str, target: float, delta_years: float) -> None:
        current = npc.emotions.get(name, 0.0)
        npc.emotions[name] = self._clamp(current + (target - current) * min(1.0, delta_years * 1.8))

    def _derive_mood(self, npc: NpcState) -> str:
        dominant = max(
            ("joy", "sadness", "fear", "anger", "loneliness", "stress"),
            key=lambda key: npc.emotions.get(key, 0.0),
        )
        value = npc.emotions.get(dominant, 0.0)
        if value < 0.42:
            return "content" if npc.emotions.get("joy", 0.0) > 0.32 else "calm"
        return {
            "joy": "joyful",
            "sadness": "sad",
            "fear": "afraid",
            "anger": "angry",
            "loneliness": "lonely",
            "stress": "stressed",
        }[dominant]

    @staticmethod
    def _clamp(value: float) -> float:
        return max(0.0, min(1.0, value))

    def _resolve_death(self, npc: NpcState) -> None:
        if not npc.alive:
            return
        npc.alive = False
        npc.intent = "dead"
        self._record_life_event(npc, f"Died at age {npc.age_years:.1f}.", 1.0)
        self._propagate_grief(npc)

    def _propagate_grief(self, deceased: NpcState) -> None:
        close_ids = set(deceased.parent_ids + deceased.child_ids)
        if deceased.spouse_id is not None:
            close_ids.add(deceased.spouse_id)
        close_ids.update(edge.npc_id for edge in deceased.relationships if edge.affinity >= 0.45)
        for npc_id in close_ids:
            survivor = self.npcs.get(npc_id)
            if survivor is None or not survivor.alive:
                continue
            survivor.emotions["sadness"] = self._clamp(survivor.emotions.get("sadness", 0.0) + 0.35)
            survivor.emotions["stress"] = self._clamp(survivor.emotions.get("stress", 0.0) + 0.15)
            survivor.emotions["joy"] = self._clamp(survivor.emotions.get("joy", 0.0) - 0.2)
            survivor.trauma = self._clamp(survivor.trauma + 0.22 * (1.0 - survivor.resilience * 0.45))
            survivor.recent_event_weight = self._clamp(survivor.recent_event_weight + 0.35)
            self._record_life_event(survivor, f"Grieved the death of {deceased.name}.", 0.9)

    def _move_npc(self, npc: NpcState) -> None:
        tribe_x, tribe_y = self.tribe_center()
        target_house = self.world.find_nearest_structure(npc.x, npc.y, "house", max_chunk_radius=2)
        target_bush = None
        target_person = self._social_target(npc)
        if npc.intent in {"seek_food", "gather_food", "gather_wood"}:
            target_bush = self.world.find_nearest_structure(npc.x, npc.y, "food_bush", max_chunk_radius=2)
            if target_bush and float(target_bush.get("food", 1.0)) <= 0.05:
                target_bush = None
        if target_bush:
            focus_x, focus_y = target_bush["x"], target_bush["y"]
        elif npc.social_state == "avoiding_conflict" and npc.social_focus_id in self.npcs:
            threat = self.npcs[npc.social_focus_id]
            focus_x = npc.x + max(-16, min(16, npc.x - threat.x))
            focus_y = npc.y + max(-16, min(16, npc.y - threat.y))
        elif npc.intent in {"seek_company", "support_tribe", "care_for_family", "care_for_sick", "stay_near_family"} and target_person is not None:
            focus_x, focus_y = target_person.x, target_person.y
        elif target_house and (
            npc.intent in {"rest", "seek_shelter"}
            or npc.routine_phase == "night_rest"
            or npc.needs.get("shelter", 0.0) > 0.55
            or str(self.environment.get("weather", "clear")) in {"storm", "heat", "cold"}
        ):
            focus_x, focus_y = target_house["x"], target_house["y"]
        else:
            focus_x, focus_y = tribe_x, tribe_y
        dx = self.rng.randint(-1, 1)
        dy = self.rng.randint(-1, 1)
        if abs(focus_x - npc.x) > 8:
            dx += 1 if focus_x > npc.x else -1
        if abs(focus_y - npc.y) > 8:
            dy += 1 if focus_y > npc.y else -1
        nearby = [
            other for other in self.npcs.values()
            if other.alive
            and other.npc_id != npc.npc_id
            and math.dist((npc.x, npc.y), (other.x, other.y)) < npc.personal_space
        ]
        if nearby:
            away_x = sum(npc.x - other.x for other in nearby)
            away_y = sum(npc.y - other.y for other in nearby)
            if away_x:
                dx += 1 if away_x > 0 else -1
            if away_y:
                dy += 1 if away_y > 0 else -1
        dx = max(-1, min(1, dx))
        dy = max(-1, min(1, dy))
        npc.x = max(0, min(self.config.world_width - 1, npc.x + dx))
        npc.y = max(0, min(self.config.world_height - 1, npc.y + dy))

    def _social_target(self, npc: NpcState) -> NpcState | None:
        if npc.social_focus_id is not None and npc.social_state != "avoiding_conflict":
            focus = self.npcs.get(npc.social_focus_id)
            if focus is not None and focus.alive and math.dist((npc.x, npc.y), (focus.x, focus.y)) <= 64:
                return focus
        candidates: list[tuple[float, NpcState]] = []
        for other in self.npcs.values():
            if not other.alive or other.npc_id == npc.npc_id:
                continue
            distance = math.dist((npc.x, npc.y), (other.x, other.y))
            if distance > 48:
                continue
            score = npc.social_preference * 0.25 - distance * 0.01
            if npc.spouse_id == other.npc_id:
                score += 0.55
            if other.npc_id in npc.child_ids or other.npc_id in npc.parent_ids:
                score += 0.45
            edge = next((item for item in npc.relationships if item.npc_id == other.npc_id), None)
            if edge is not None:
                score += edge.affinity * 0.45
            if other.role == "caregiver":
                score += 0.08
            if npc.role == "caregiver" and other.health_condition in {"sick", "injured", "weakened"}:
                score += 0.65
            if npc.role == "caregiver" and self.life_stage(other) in {"infant", "child", "elder"}:
                score += 0.42
            if self.life_stage(npc) in {"infant", "child"} and other.npc_id in npc.parent_ids:
                score += 0.75
            if other.npc_id in npc.child_ids and self.life_stage(other) in {"infant", "child"}:
                score += 0.55
            candidates.append((score, other))
        if not candidates:
            return None
        candidates.sort(key=lambda item: item[0], reverse=True)
        return candidates[0][1] if candidates[0][0] > 0.05 else None

    def _nearest_unwell_npc(self, npc: NpcState) -> NpcState | None:
        unwell = [
            other
            for other in self.npcs.values()
            if other.alive
            and other.npc_id != npc.npc_id
            and other.health_condition in {"sick", "injured", "weakened"}
            and math.dist((npc.x, npc.y), (other.x, other.y)) <= 24
        ]
        if not unwell:
            return None
        return min(unwell, key=lambda other: math.dist((npc.x, npc.y), (other.x, other.y)))

    def _forage_if_possible(self, npc: NpcState, delta_years: float) -> None:
        harvest_rate = 0.45 + npc.skills.get("forage", 0.5) * 0.9
        harvested = self.world.harvest_food_near(
            npc.x,
            npc.y,
            radius=2,
            amount=harvest_rate * delta_years,
        )
        if harvested <= 0.0:
            return
        eaten = min(harvested, npc.hunger * 0.7)
        npc.hunger = max(0.0, npc.hunger - eaten)
        npc.inventory["food"] = min(6.0, npc.inventory.get("food", 0.0) + harvested - eaten)
        wood_gain = harvested * (0.12 if npc.role == "builder" else 0.05)
        npc.inventory["wood"] = min(6.0, npc.inventory.get("wood", 0.0) + wood_gain)
        npc.needs["purpose"] = self._clamp(npc.needs.get("purpose", 0.0) - 0.04)

    def _share_resources(self, npc: NpcState) -> None:
        house = self.world.find_structure_at_or_near(npc.x, npc.y, "house", radius=4)
        if house is None:
            return
        food = npc.inventory.get("food", 0.0)
        wood = npc.inventory.get("wood", 0.0)
        if food > 0.6:
            deposit = food - 0.4
            self.tribe_food = min(200.0, self.tribe_food + deposit)
            npc.inventory["food"] -= deposit
        if wood > 0.4:
            deposit = wood - 0.25
            self.tribe_wood = min(200.0, self.tribe_wood + deposit)
            npc.inventory["wood"] -= deposit
        if npc.hunger > 0.65 and self.tribe_food >= 0.25:
            meal = min(0.4, self.tribe_food, npc.hunger)
            self.tribe_food -= meal
            npc.hunger -= meal

    def _apply_divine_events(self, divine_events: list[DivineEvent]) -> None:
        for event in divine_events:
            if event.applied_to_npcs:
                continue
            for npc in self.npcs.values():
                if not npc.alive:
                    continue
                if event.delivery_mode == "single" and npc.npc_id != event.target_npc_id:
                    continue
                if event.delivery_mode == "indirect":
                    if self.world.chunk_coords_for_tile(npc.x, npc.y) != event.chunk_target:
                        continue
                    npc.health = max(0.0, min(1.0, npc.health + {"miracle": 0.2, "abundance": 0.1, "plague": -0.25, "storm": -0.15, "quake": -0.18, "corruption": -0.12, "fertility": 0.05}.get(event.event_kind or "", 0.0)))
                    npc.fertility = max(0.0, min(1.0, npc.fertility + (0.2 if event.event_kind == "fertility" else 0.0)))
                    if event.event_kind in {"plague", "storm", "quake", "corruption"}:
                        npc.emotions["fear"] = self._clamp(npc.emotions.get("fear", 0.0) + 0.25)
                        npc.emotions["stress"] = self._clamp(npc.emotions.get("stress", 0.0) + 0.2)
                        npc.exposure = self._clamp(npc.exposure + (0.35 if event.event_kind == "plague" else 0.12))
                        npc.injury = self._clamp(npc.injury + (0.28 if event.event_kind in {"quake", "storm"} else 0.04))
                        npc.trauma = self._clamp(npc.trauma + 0.18)
                        npc.recent_event_weight = self._clamp(npc.recent_event_weight + 0.3)
                        self.culture["scarcity_memory"] = self._clamp(self.culture.get("scarcity_memory", 0.25) + 0.04)
                        self.culture["spirituality"] = self._clamp(self.culture.get("spirituality", 0.45) + 0.025)
                    elif event.event_kind in {"miracle", "abundance", "fertility"}:
                        npc.emotions["joy"] = self._clamp(npc.emotions.get("joy", 0.0) + 0.2)
                        npc.emotions["fear"] = self._clamp(npc.emotions.get("fear", 0.0) - 0.15)
                        npc.exposure = self._clamp(npc.exposure - 0.18)
                        npc.injury = self._clamp(npc.injury - 0.14)
                        npc.gratitude = self._clamp(npc.gratitude + 0.22)
                        npc.trauma = self._clamp(npc.trauma - 0.08)
                        self.culture["spirituality"] = self._clamp(self.culture.get("spirituality", 0.45) + 0.035)
                        self.culture["cohesion"] = self._clamp(self.culture.get("cohesion", 0.55) + 0.02)
                elif event.delivery_mode == "single":
                    response = self.mind.respond_to_oracle(npc, event)
                    self._emit_speech(npc, response, f"{npc.name}: ")
                    npc.faith = max(0.0, min(1.0, npc.faith + 0.08 * npc.beliefs["omen_trust"]))
                    npc.emotions["trust"] = self._clamp(npc.emotions.get("trust", 0.0) + 0.1)
                    npc.gratitude = self._clamp(npc.gratitude + 0.08)
                    self.culture["spirituality"] = self._clamp(self.culture.get("spirituality", 0.45) + 0.02)
                elif event.delivery_mode == "broadcast":
                    trust = npc.beliefs.get("omen_trust", 0.5)
                    npc.faith = self._clamp(npc.faith + 0.035 * trust)
                    npc.emotions["fear"] = self._clamp(npc.emotions.get("fear", 0.0) + 0.04 * (1.0 - trust))
                    npc.emotions["trust"] = self._clamp(npc.emotions.get("trust", 0.0) + 0.035 * trust)
                    npc.recent_event_weight = self._clamp(npc.recent_event_weight + 0.08)
                    self.culture["spirituality"] = self._clamp(self.culture.get("spirituality", 0.45) + 0.006)
                npc.memories.append(MemoryEntry("divine_event", compress_to_single_sentence(event.payload), 0.7, event.year))
                npc.memories = npc.memories[-12:]
                self._record_life_event(npc, f"Experienced a divine {event.delivery_mode}: {event.payload}", 0.7)
            if event.delivery_mode == "broadcast":
                self._record_speech(f"Omen carried across the tribe: {compress_to_single_sentence(event.payload)}")
            event.applied_to_npcs = True

    def _pair_marriages(self, delta_years: float) -> None:
        singles = [npc for npc in self.npcs.values() if npc.alive and npc.spouse_id is None and 18 <= npc.age_years <= 45]
        self.rng.shuffle(singles)
        for left, right in zip(singles[::2], singles[1::2]):
            if left.spouse_id or right.spouse_id:
                continue
            compatibility = max(0.0, self._compatibility(left, right))
            existing_affinity = next(
                (edge.affinity for edge in left.relationships if edge.npc_id == right.npc_id),
                0.0,
            )
            marriage_chance = min(0.2, delta_years * (0.05 + compatibility * 0.12 + max(0.0, existing_affinity) * 0.08))
            if self.rng.random() < marriage_chance:
                left.spouse_id = right.npc_id
                right.spouse_id = left.npc_id
                left.relationships.append(RelationshipEdge(right.npc_id, "spouse", 0.8))
                right.relationships.append(RelationshipEdge(left.npc_id, "spouse", 0.8))
                left.emotions["joy"] = self._clamp(left.emotions.get("joy", 0.0) + 0.25)
                right.emotions["joy"] = self._clamp(right.emotions.get("joy", 0.0) + 0.25)
                left.gratitude = self._clamp(left.gratitude + 0.2)
                right.gratitude = self._clamp(right.gratitude + 0.2)
                left.needs["belonging"] = self._clamp(left.needs.get("belonging", 0.0) - 0.25)
                right.needs["belonging"] = self._clamp(right.needs.get("belonging", 0.0) - 0.25)
                self._record_life_event(left, f"Married {right.name}.", 0.9)
                self._record_life_event(right, f"Married {left.name}.", 0.9)

    def _resolve_divorces(self, delta_years: float) -> None:
        if delta_years <= 0.0:
            return
        handled: set[tuple[int, int]] = set()
        for left in self.npcs.values():
            if not left.alive or left.spouse_id is None:
                continue
            right = self.npcs.get(left.spouse_id)
            if right is None or not right.alive or right.spouse_id != left.npc_id:
                continue
            pair = tuple(sorted((left.npc_id, right.npc_id)))
            if pair in handled:
                continue
            handled.add(pair)
            pressure = self._divorce_pressure(left, right)
            chance = min(0.3, max(0.0, pressure - 0.58) * 0.2 * delta_years)
            if self.rng.random() < chance:
                self._divorce_pair(left, right)

    def _divorce_pressure(self, left: NpcState, right: NpcState) -> float:
        affinity = min(self._affinity(left, right), self._affinity(right, left))
        anger = (left.emotions.get("anger", 0.0) + right.emotions.get("anger", 0.0)) / 2.0
        resentment = (left.resentment + right.resentment) / 2.0
        instability = 1.0 - (left.household_stability + right.household_stability) / 2.0
        conflict = self.culture.get("conflict_norm", 0.35)
        bond_loss = self._clamp((0.35 - affinity) / 0.85)
        return self._clamp(bond_loss * 0.36 + resentment * 0.25 + anger * 0.16 + instability * 0.15 + conflict * 0.08)

    def _divorce_pair(self, left: NpcState, right: NpcState) -> None:
        left.spouse_id = None
        right.spouse_id = None
        for source, target in ((left, right), (right, left)):
            edge = next((item for item in source.relationships if item.npc_id == target.npc_id), None)
            if edge is None:
                source.relationships.append(RelationshipEdge(target.npc_id, "former_spouse", -0.25))
            else:
                edge.label = "former_spouse"
                edge.affinity = max(-1.0, min(0.0, edge.affinity - 0.3))
            source.emotions["sadness"] = self._clamp(source.emotions.get("sadness", 0.0) + 0.22)
            source.emotions["stress"] = self._clamp(source.emotions.get("stress", 0.0) + 0.18)
            source.emotions["loneliness"] = self._clamp(source.emotions.get("loneliness", 0.0) + 0.2)
            source.needs["belonging"] = self._clamp(source.needs.get("belonging", 0.0) + 0.18)
            source.household_stability = self._clamp(source.household_stability - 0.28)
            source.recent_event_weight = self._clamp(source.recent_event_weight + 0.32)
            self._record_life_event(source, f"Divorced {target.name}.", 0.95)
        self.culture["cohesion"] = self._clamp(self.culture.get("cohesion", 0.55) - 0.015)

    def _spawn_children(self, delta_years: float) -> None:
        if self.living_population() >= self.config.max_population:
            return
        for npc in list(self.npcs.values()):
            if self.living_population() >= self.config.max_population:
                return
            if not npc.alive or npc.spouse_id is None or npc.sex != "f":
                continue
            if not (18 <= npc.age_years <= 40):
                continue
            if self.rng.random() < 0.02 * delta_years * max(0.2, npc.fertility):
                spouse = self.npcs.get(npc.spouse_id)
                if spouse is None or not spouse.alive:
                    continue
                child = self.create_npc(npc.x, npc.y, 0.0, parent_ids=[npc.npc_id, spouse.npc_id])
                npc.child_ids.append(child.npc_id)
                spouse.child_ids.append(child.npc_id)
                npc.emotions["joy"] = self._clamp(npc.emotions.get("joy", 0.0) + 0.3)
                spouse.emotions["joy"] = self._clamp(spouse.emotions.get("joy", 0.0) + 0.3)
                npc.gratitude = self._clamp(npc.gratitude + 0.25)
                spouse.gratitude = self._clamp(spouse.gratitude + 0.25)
                npc.reputation = max(-1.0, min(1.0, npc.reputation + 0.08))
                spouse.reputation = max(-1.0, min(1.0, spouse.reputation + 0.08))
                self._record_life_event(npc, f"Welcomed child {child.name}.", 1.0)
                self._record_life_event(spouse, f"Welcomed child {child.name}.", 1.0)

    def _summarize_relationships(self, delta_years: float) -> None:
        living = [npc for npc in self.npcs.values() if npc.alive]
        for npc in living[: self.config.max_active_npc_dialogues]:
            neighbors = [
                other for other in living
                if other.npc_id != npc.npc_id and math.dist((npc.x, npc.y), (other.x, other.y)) <= 4
            ]
            interaction_rate = 1.2 + npc.needs.get("belonging", 0.0) * 1.4
            if not neighbors or self.rng.random() >= min(0.25, interaction_rate * delta_years):
                continue
            partner = self.rng.choice(neighbors)
            compatibility = self._compatibility(npc, partner)
            conflict_risk = (
                npc.emotions.get("anger", 0.0) * 0.35
                + partner.emotions.get("anger", 0.0) * 0.35
                + max(0.0, -compatibility) * 0.3
                + self.resource_pressure.get("food", 0.0) * 0.16
                + self.culture.get("conflict_norm", 0.35) * 0.18
                - self.culture.get("cohesion", 0.55) * 0.12
            )
            if self.rng.random() < conflict_risk * 0.18:
                self._handle_conflict(npc, partner)
                continue
            npc.emotions["loneliness"] = self._clamp(npc.emotions.get("loneliness", 0.0) - 0.12)
            partner.emotions["loneliness"] = self._clamp(partner.emotions.get("loneliness", 0.0) - 0.12)
            npc.emotions["joy"] = self._clamp(npc.emotions.get("joy", 0.0) + 0.06)
            partner.emotions["joy"] = self._clamp(partner.emotions.get("joy", 0.0) + 0.06)
            self._strengthen_relationship(npc, partner)
            if self._should_social_talk(npc, partner, delta_years):
                self._run_conversation(npc, partner)
            elif self._should_social_talk(partner, npc, delta_years * 0.8):
                self._run_conversation(partner, npc)

    def _run_conversation(self, speaker: NpcState, partner: NpcState) -> None:
        topic = self._conversation_topic(speaker, partner)
        line = self._compose_social_line(speaker, partner, topic)
        if not self._emit_speech(speaker, line, f"{speaker.name} -> {partner.name}: "):
            return
        reply = self._compose_social_reply(partner, speaker, topic)
        if self._emit_speech(partner, reply, f"{partner.name} -> {speaker.name}: "):
            self._apply_conversation_effect(speaker, partner, topic)

    def _should_social_talk(self, speaker: NpcState, partner: NpcState, delta_years: float) -> bool:
        if speaker.age_years - speaker.last_dialogue_year < 0.06:
            return False
        edge = next((item for item in speaker.relationships if item.npc_id == partner.npc_id), None)
        affinity = edge.affinity if edge is not None else 0.0
        pressure = max(speaker.emotions.get("loneliness", 0.0), speaker.needs.get("belonging", 0.0))
        routine_bonus = 0.22 if speaker.routine_phase == "dusk_social" else 0.0
        chance = (
            0.04
            + speaker.social_preference * 0.1
            + speaker.communication_drive * 0.1
            + max(0.0, affinity) * 0.08
            + pressure * 0.1
            + routine_bonus
            + self.culture.get("cohesion", 0.55) * 0.04
        ) * delta_years
        return self.rng.random() < min(0.18, chance)

    def _conversation_topic(self, speaker: NpcState, partner: NpcState) -> str:
        edge = next((item for item in speaker.relationships if item.npc_id == partner.npc_id), None)
        affinity = edge.affinity if edge is not None else 0.0
        if speaker.spouse_id == partner.npc_id:
            return "family"
        if partner.npc_id in speaker.child_ids or speaker.npc_id in partner.child_ids:
            return "family"
        if speaker.intent == "gather_food" or self.resource_pressure.get("food", 0.0) > 0.7:
            return "food"
        if speaker.intent == "gather_wood" or self.resource_pressure.get("shelter", 0.0) > 0.65:
            return "shelter"
        if speaker.intent in {"care_for_sick", "support_tribe", "care_for_family"}:
            return "care"
        if affinity < -0.2 or speaker.resentment > 0.45:
            return "conflict"
        if speaker.emotions.get("fear", 0.0) > 0.65:
            return "danger"
        return "companionship"

    def _compose_social_line(self, speaker: NpcState, partner: NpcState, topic: str | None = None) -> str:
        topic = topic or self._conversation_topic(speaker, partner)
        if topic == "family" and speaker.spouse_id == partner.npc_id:
            options = [
                "Stay near me when the fires go low.",
                "We should keep food aside for our house.",
                "Walk with me after the work is done.",
            ]
        elif topic == "family" and partner.npc_id in speaker.child_ids:
            options = [
                "Keep close where I can see you.",
                "Eat first, then help near the camp.",
                "Do not wander past the houses.",
            ]
        elif topic == "family":
            options = [
                "I will stay near the house.",
                "I found a safe path back to camp.",
                "I am hungry, but I can help.",
            ]
        elif topic == "food":
            options = [
                "Come with me; the bushes may still have fruit.",
                "If we split the grove, we bring more food home.",
                "Mark the ripe bushes before dusk.",
            ]
        elif topic == "shelter":
            options = [
                "Help me carry wood for another house.",
                "The walls need more hands than mine.",
                "Good timber is close if we move together.",
            ]
        elif topic == "care":
            options = [
                "Check on the weak before you sleep.",
                "Bring water to the sick if you pass them.",
                "The tribe holds if we tend each other.",
            ]
        elif topic == "conflict":
            options = [
                "Do not take more than your share.",
                "We need fewer sharp words between us.",
                "Work beside me and prove this can settle.",
            ]
        elif topic == "danger":
            options = [
                "Stay within sight until the danger passes.",
                "Watch the paths while I gather the others.",
                "Something is wrong beyond the houses.",
            ]
        elif speaker.routine_phase == "dusk_social":
            options = [
                "Tell me what you saw beyond the houses.",
                "Sit close; the day is ending.",
                "The camp feels safer when voices stay near.",
            ]
        else:
            options = [
                "Keep close to the village path.",
                "I will work nearby if you need me.",
                "The camp is stronger when we move together.",
            ]
        return self.rng.choice(options)

    def _compose_social_reply(self, speaker: NpcState, partner: NpcState, topic: str) -> str:
        resistant = self._affinity(speaker, partner) < -0.2 or speaker.resentment > 0.55
        replies = {
            "food": ("I will search the near bushes with you.", "Find your own path; I will guard my share."),
            "shelter": ("I will carry wood back before dusk.", "I will not build beside you today."),
            "care": ("I will bring water and check the sick.", "Ask another; I have nothing left to give."),
            "family": ("I will stay close to our home.", "I need space before we speak of home."),
            "conflict": ("Then let us work without another quarrel.", "I have not forgotten what you took."),
            "danger": ("I will watch the path and stay near.", "Fear will not choose my steps for me."),
            "companionship": ("I will remain near the village with you.", "I would rather work alone for now."),
        }
        accepting, refusing = replies.get(topic, replies["companionship"])
        return refusing if resistant else accepting

    def _apply_conversation_effect(self, speaker: NpcState, partner: NpcState, topic: str) -> None:
        resistant = self._affinity(partner, speaker) < -0.2 or partner.resentment > 0.55
        if resistant:
            self._adjust_affinity(speaker, partner, -0.025)
            speaker.emotions["stress"] = self._clamp(speaker.emotions.get("stress", 0.0) + 0.025)
            return
        gain = 0.045 if topic in {"family", "care"} else 0.025
        self._adjust_affinity(speaker, partner, gain)
        for npc in (speaker, partner):
            npc.emotions["trust"] = self._clamp(npc.emotions.get("trust", 0.0) + gain)
            npc.emotions["loneliness"] = self._clamp(npc.emotions.get("loneliness", 0.0) - gain * 1.4)

    def _compatibility(self, left: NpcState, right: NpcState) -> float:
        score = 0.0
        shared = set(left.traits) & set(right.traits)
        score += len(shared) * 0.2
        complementary = {
            frozenset({"stern", "patient"}),
            frozenset({"ambitious", "tender"}),
            frozenset({"curious", "wary"}),
        }
        for left_trait in left.traits:
            for right_trait in right.traits:
                pair = frozenset({left_trait, right_trait})
                if pair in complementary:
                    score += 0.12
        if "stern" in left.traits and "stern" in right.traits:
            score -= 0.25
        if "ambitious" in left.traits and "ambitious" in right.traits:
            score -= 0.18
        return max(-1.0, min(1.0, score))

    def _handle_conflict(self, left: NpcState, right: NpcState) -> None:
        topic = "food" if self.tribe_food < max(4.0, self.living_population() * 0.3) else "responsibility"
        mediator, mediation = self._find_mediator(left, right)
        status_gap = left.status - right.status
        left_burden = 1.0 + max(0.0, -status_gap) * 0.45 - max(0.0, status_gap) * 0.18
        right_burden = 1.0 + max(0.0, status_gap) * 0.45 - max(0.0, -status_gap) * 0.18
        mediation_relief = mediation * 0.55

        left.emotions["anger"] = self._clamp(left.emotions.get("anger", 0.0) + max(0.04, 0.18 * left_burden - mediation_relief * 0.08))
        right.emotions["anger"] = self._clamp(right.emotions.get("anger", 0.0) + max(0.04, 0.18 * right_burden - mediation_relief * 0.08))
        left.emotions["trust"] = self._clamp(left.emotions.get("trust", 0.0) - max(0.01, 0.08 * left_burden - mediation_relief * 0.06))
        right.emotions["trust"] = self._clamp(right.emotions.get("trust", 0.0) - max(0.01, 0.08 * right_burden - mediation_relief * 0.06))
        left.trauma = self._clamp(left.trauma + max(0.01, 0.04 * left_burden - mediation_relief * 0.025))
        right.trauma = self._clamp(right.trauma + max(0.01, 0.04 * right_burden - mediation_relief * 0.025))
        left.reputation = max(-1.0, min(1.0, left.reputation - max(0.005, 0.04 - left.leadership * 0.015)))
        right.reputation = max(-1.0, min(1.0, right.reputation - max(0.005, 0.04 - right.leadership * 0.015)))
        left.resentment = self._clamp(left.resentment + max(0.01, 0.08 * left_burden - mediation_relief * 0.04))
        right.resentment = self._clamp(right.resentment + max(0.01, 0.08 * right_burden - mediation_relief * 0.04))
        left.recent_event_weight = self._clamp(left.recent_event_weight + 0.12)
        right.recent_event_weight = self._clamp(right.recent_event_weight + 0.12)
        self.culture["conflict_norm"] = self._clamp(self.culture.get("conflict_norm", 0.35) + max(0.004, 0.025 - mediation * 0.02))
        self.culture["cohesion"] = self._clamp(self.culture.get("cohesion", 0.55) - max(0.003, 0.02 - mediation * 0.018))
        self._adjust_affinity(left, right, -max(0.02, 0.08 - mediation * 0.05))
        if mediator is not None:
            mediator.reputation = max(-1.0, min(1.0, mediator.reputation + 0.03 * mediation))
            mediator.status = max(-1.0, min(1.0, mediator.status + 0.025 * mediation))
            mediator.needs["purpose"] = self._clamp(mediator.needs.get("purpose", 0.0) - 0.04 * mediation)
            self._adjust_affinity(left, mediator, 0.025 * mediation)
            self._adjust_affinity(right, mediator, 0.025 * mediation)
        line = f"{left.name} and {right.name} argued about {topic}."
        if mediator is not None and mediation > 0.2:
            line = f"{mediator.name} mediated when {left.name} and {right.name} argued about {topic}."
        self._record_speech(line)
        self._record_life_event(left, f"Argued with {right.name} about {topic}.", 0.55)
        self._record_life_event(right, f"Argued with {left.name} about {topic}.", 0.55)
        if mediator is not None and mediation > 0.2:
            self._record_life_event(mediator, f"Mediated a dispute between {left.name} and {right.name}.", 0.5)

    def _find_mediator(self, left: NpcState, right: NpcState) -> tuple[NpcState | None, float]:
        candidates: list[tuple[float, NpcState]] = []
        for npc in self.npcs.values():
            if not npc.alive or npc.npc_id in {left.npc_id, right.npc_id}:
                continue
            if math.dist((npc.x, npc.y), (left.x, left.y)) > 8 or math.dist((npc.x, npc.y), (right.x, right.y)) > 8:
                continue
            score = (
                npc.mediation_skill * 0.42
                + max(0.0, npc.status) * 0.22
                + npc.leadership * 0.18
                + self.culture.get("cohesion", 0.55) * 0.1
                + self.culture.get("care_norm", 0.5) * 0.08
                - npc.resentment * 0.2
                - npc.emotions.get("anger", 0.0) * 0.12
            )
            candidates.append((score, npc))
        if not candidates:
            return None, 0.0
        candidates.sort(key=lambda item: item[0], reverse=True)
        score, mediator = candidates[0]
        return (mediator, self._clamp(score)) if score > 0.25 else (None, 0.0)

    def _strengthen_relationship(self, left: NpcState, right: NpcState) -> None:
        for source, target in ((left, right), (right, left)):
            edge = next((item for item in source.relationships if item.npc_id == target.npc_id), None)
            if edge is None:
                source.relationships.append(RelationshipEdge(target.npc_id, "tribemate", 0.15))
            else:
                edge.affinity = max(-1.0, min(1.0, edge.affinity + 0.03))

    def _adjust_affinity(self, left: NpcState, right: NpcState, amount: float) -> None:
        for source, target in ((left, right), (right, left)):
            edge = next((item for item in source.relationships if item.npc_id == target.npc_id), None)
            if edge is None:
                source.relationships.append(RelationshipEdge(target.npc_id, "tribemate", max(-1.0, amount)))
            else:
                edge.affinity = max(-1.0, min(1.0, edge.affinity + amount))

    def _drift_relationships(self, delta_years: float) -> None:
        if delta_years <= 0.0:
            return
        living_ids = {npc.npc_id for npc in self.npcs.values() if npc.alive}
        for npc in self.npcs.values():
            if not npc.alive:
                continue
            strong_bonds = 0
            repaired = False
            kept_edges: list[RelationshipEdge] = []
            for edge in npc.relationships:
                other = self.npcs.get(edge.npc_id)
                if other is None or edge.npc_id not in living_ids:
                    continue
                distance = math.dist((npc.x, npc.y), (other.x, other.y))
                if edge.label == "spouse":
                    target = 0.78 if distance <= 18 else 0.55
                elif distance <= 8:
                    target = 0.35 + self._compatibility(npc, other) * 0.22
                else:
                    target = 0.08
                if edge.affinity < 0.0 and distance <= 8 and npc.emotions.get("anger", 0.0) < 0.45:
                    target = max(target, 0.05)
                    repaired = True
                rate = 0.07 if distance <= 8 else 0.035
                edge.affinity = max(-1.0, min(1.0, edge.affinity + (target - edge.affinity) * min(1.0, rate * delta_years)))
                if edge.affinity > 0.45:
                    strong_bonds += 1
                if edge.affinity > -0.6 or edge.label == "spouse":
                    kept_edges.append(edge)
            npc.relationships = kept_edges[-16:]
            if strong_bonds:
                npc.emotions["trust"] = self._clamp(npc.emotions.get("trust", 0.0) + min(0.08, strong_bonds * 0.015) * delta_years)
                npc.emotions["loneliness"] = self._clamp(npc.emotions.get("loneliness", 0.0) - min(0.08, strong_bonds * 0.02) * delta_years)
            else:
                npc.emotions["loneliness"] = self._clamp(npc.emotions.get("loneliness", 0.0) + 0.035 * delta_years)
            if repaired and self.rng.random() < min(0.08, 0.2 * delta_years):
                self._record_life_event(npc, "A strained bond began to soften.", 0.35)

    def _record_life_event(self, npc: NpcState, text: str, importance: float) -> None:
        npc.life_events.append(text)
        npc.life_events = npc.life_events[-16:]
        npc.memories.append(MemoryEntry("life_event", text, importance, npc.age_years))
        npc.memories = npc.memories[-16:]
        self._apply_memory_bias(npc, text, importance)
        self._maybe_voice_life_event(npc, text, importance)

    def _maybe_voice_life_event(self, npc: NpcState, text: str, importance: float) -> None:
        if not npc.alive or importance < 0.85:
            return
        if npc.age_years - npc.last_dialogue_year < 0.14:
            return
        line = self._compose_life_event_line(npc, text)
        if not line:
            return
        self._emit_speech(npc, line, f"{npc.name}: ")

    def _compose_life_event_line(self, npc: NpcState, text: str) -> str:
        lowered = text.lower()
        if "welcomed child" in lowered:
            child_name = text.rstrip(".").split()[-1]
            return self.rng.choice(
                [
                    f"{child_name} is ours to protect now.",
                    f"Make room near the fire for {child_name}.",
                    "A child has joined us; keep the camp gentle tonight.",
                ]
            )
        if lowered.startswith("married "):
            partner_name = text.rstrip(".").split(" ", 1)[1]
            return self.rng.choice(
                [
                    f"{partner_name} and I will share one house.",
                    "Our bond is before the tribe now.",
                    "Let our food and shelter be counted together.",
                ]
            )
        if lowered.startswith("divorced "):
            partner_name = text.rstrip(".").split(" ", 1)[1]
            return self.rng.choice(
                [
                    f"{partner_name} and I will keep separate homes now.",
                    "Our bond has ended before the tribe.",
                    "We could not keep one household without harm.",
                ]
            )
        if lowered.startswith("grieved the death of "):
            lost_name = text.rstrip(".").split(" of ", 1)[1]
            return self.rng.choice(
                [
                    f"Keep {lost_name} in the stories tonight.",
                    f"I will not forget {lost_name}.",
                    "The fire feels colder with one voice gone.",
                ]
            )
        if lowered.startswith("died at age"):
            return f"{npc.name} has died."
        if lowered.startswith("changed role"):
            role_name = text.rstrip(".").rsplit(" ", 1)[-1]
            return self.rng.choice(
                [
                    f"I will serve as a {role_name} now.",
                    f"The tribe needs me as a {role_name}.",
                    f"My hands turn toward {role_name} work.",
                ]
            )
        return ""

    def _record_speech(self, line: str) -> None:
        self.recent_speeches.append(line)
        self.recent_speeches = self.recent_speeches[-18:]

    def consume_recent_speeches(self) -> list[str]:
        lines = self.recent_speeches[:]
        self.recent_speeches.clear()
        return lines

    def _build_houses_if_possible(self) -> None:
        living = [npc for npc in self.npcs.values() if npc.alive]
        house_count = sum(
            1
            for chunk in self.world.chunk_cache.values()
            for structure in chunk.structures
            if structure["type"] == "house"
        )
        if len(living) <= house_count * 3:
            return
        if self.tribe_wood < 8.0 or self.tribe_food < 6.0:
            return
        center_x, center_y = self.tribe_center()
        if self.world.add_structure_near(center_x, center_y, "house", "tribal house"):
            self.tribe_wood -= 8.0
            self.tribe_food -= 3.0

    def nearest_npc(self, world_x: int, world_y: int, max_distance: float = 12.0) -> NpcState | None:
        living = [npc for npc in self.npcs.values() if npc.alive]
        if not living:
            return None
        best = min(living, key=lambda npc: math.dist((npc.x, npc.y), (world_x, world_y)))
        return best if math.dist((best.x, best.y), (world_x, world_y)) <= max_distance else None

    def living_population(self) -> int:
        return sum(1 for npc in self.npcs.values() if npc.alive)

    def tribe_center(self) -> tuple[int, int]:
        living = [npc for npc in self.npcs.values() if npc.alive]
        if not living:
            return self.config.world_width // 2, self.config.world_height // 2
        return (
            round(sum(npc.x for npc in living) / len(living)),
            round(sum(npc.y for npc in living) / len(living)),
        )

    def serialize(self) -> dict:
        return {
            "next_id": self.next_id,
            "tribe_food": self.tribe_food,
            "tribe_wood": self.tribe_wood,
            "culture": self.culture,
            "environment": self.environment,
            "resource_pressure": self.resource_pressure,
            "role_pressure": self.role_pressure,
            "dependency_pressure": self.dependency_pressure,
            "disease_pressure": self.disease_pressure,
            "npcs": [self._npc_to_dict(npc) for npc in self.npcs.values()],
        }

    def load(self, payload: dict) -> None:
        self.next_id = payload["next_id"]
        self.tribe_food = payload.get("tribe_food", 18.0)
        self.tribe_wood = payload.get("tribe_wood", 10.0)
        self.culture.update(payload.get("culture", {}))
        self.environment.update(payload.get("environment", {}))
        self.resource_pressure.update(payload.get("resource_pressure", {}))
        self.role_pressure.update(payload.get("role_pressure", {}))
        self.dependency_pressure.update(payload.get("dependency_pressure", {}))
        self.disease_pressure.update(payload.get("disease_pressure", {}))
        self.npcs.clear()
        for npc_payload in payload["npcs"]:
            npc = NpcState(
                npc_id=npc_payload["npc_id"],
                name=npc_payload["name"],
                x=npc_payload["x"],
                y=npc_payload["y"],
                age_years=npc_payload["age_years"],
                sex=npc_payload["sex"],
                health=npc_payload["health"],
                hunger=npc_payload["hunger"],
                faith=npc_payload["faith"],
                fertility=npc_payload["fertility"],
                alive=npc_payload["alive"],
                spouse_id=npc_payload["spouse_id"],
                parent_ids=npc_payload["parent_ids"],
                child_ids=npc_payload["child_ids"],
                traits=npc_payload["traits"],
                skills=npc_payload["skills"],
                beliefs=npc_payload["beliefs"],
                relationships=[RelationshipEdge(**item) for item in npc_payload["relationships"]],
                memories=[MemoryEntry(**item) for item in npc_payload["memories"]],
                home_chunk=tuple(npc_payload["home_chunk"]),
                intent=npc_payload["intent"],
                speech_buffer=npc_payload["speech_buffer"],
                last_dialogue_year=npc_payload["last_dialogue_year"],
                emotions=npc_payload.get(
                    "emotions",
                    {"joy": 0.4, "sadness": 0.1, "fear": 0.1, "anger": 0.05, "loneliness": 0.2, "stress": 0.2, "trust": 0.5},
                ),
                needs=npc_payload.get(
                    "needs",
                    {"belonging": 0.25, "safety": 0.2, "shelter": 0.25, "purpose": 0.3, "rest": 0.2},
                ),
                mood=npc_payload.get("mood", "calm"),
                tribe_id=npc_payload.get("tribe_id", "first-tribe"),
                role=npc_payload.get("role", "gatherer"),
                inventory=npc_payload.get("inventory", {"food": 0.0, "wood": 0.0}),
                life_events=npc_payload.get("life_events", []),
                values=npc_payload.get(
                    "values",
                    {
                        "community": npc_payload.get("beliefs", {}).get("community", 0.55),
                        "independence": 0.35,
                        "tradition": 0.45,
                        "security": 0.55,
                        "compassion": 0.45,
                        "ambition": 0.4,
                    },
                ),
                coping_style=npc_payload.get("coping_style", "seek_support"),
                current_goal=npc_payload.get("current_goal", "settle_near_tribe"),
                goal_progress=npc_payload.get("goal_progress", 0.0),
                morale=npc_payload.get("morale", 0.5),
                energy=npc_payload.get("energy", 0.8),
                routine_phase=npc_payload.get("routine_phase", "day_work"),
                routine_offset=npc_payload.get("routine_offset", 0.0),
                social_preference=npc_payload.get("social_preference", 0.5),
                personal_space=npc_payload.get("personal_space", 2.5),
                last_speech_text=npc_payload.get("last_speech_text", ""),
                health_condition=npc_payload.get("health_condition", "healthy"),
                exposure=npc_payload.get("exposure", 0.0),
                immunity=npc_payload.get("immunity", 0.5),
                injury=npc_payload.get("injury", 0.0),
                comfort=npc_payload.get("comfort", 0.5),
                trauma=npc_payload.get("trauma", 0.0),
                resilience=npc_payload.get("resilience", 0.5),
                reputation=npc_payload.get("reputation", 0.0),
                gratitude=npc_payload.get("gratitude", 0.0),
                recent_event_weight=npc_payload.get("recent_event_weight", 0.0),
                attachment_style=npc_payload.get("attachment_style", "secure"),
                social_state=npc_payload.get("social_state", "settled"),
                social_focus_id=npc_payload.get("social_focus_id"),
                last_social_year=npc_payload.get("last_social_year", 0.0),
                nutrition=npc_payload.get("nutrition", 0.65),
                sleep_debt=npc_payload.get("sleep_debt", 0.2),
                shelter_security=npc_payload.get("shelter_security", 0.4),
                household_stability=npc_payload.get("household_stability", 0.5),
                status=npc_payload.get("status", 0.0),
                resentment=npc_payload.get("resentment", 0.0),
                leadership=npc_payload.get("leadership", 0.0),
                mediation_skill=npc_payload.get("mediation_skill", 0.0),
                memory_bias=npc_payload.get("memory_bias", {}),
                worldview=npc_payload.get("worldview", "unformed"),
                childhood_security=npc_payload.get("childhood_security", 0.5),
                developmental_pressure=npc_payload.get("developmental_pressure", 0.0),
                parental_attachment=npc_payload.get("parental_attachment", 0.5),
                home_component_key=npc_payload.get("home_component_key", ""),
                home_component_label=npc_payload.get("home_component_label", ""),
                component_attunement=npc_payload.get("component_attunement", 0.5),
                communication_drive=npc_payload.get("communication_drive", 0.35),
            )
            self._memory_bias(npc)
            self.npcs[npc.npc_id] = npc

    def _npc_to_dict(self, npc: NpcState) -> dict:
        return {
            "npc_id": npc.npc_id,
            "name": npc.name,
            "x": npc.x,
            "y": npc.y,
            "age_years": npc.age_years,
            "sex": npc.sex,
            "health": npc.health,
            "hunger": npc.hunger,
            "faith": npc.faith,
            "fertility": npc.fertility,
            "alive": npc.alive,
            "spouse_id": npc.spouse_id,
            "parent_ids": npc.parent_ids,
            "child_ids": npc.child_ids,
            "traits": npc.traits,
            "skills": npc.skills,
            "beliefs": npc.beliefs,
            "relationships": [
                {"npc_id": edge.npc_id, "label": edge.label, "affinity": edge.affinity}
                for edge in npc.relationships
            ],
            "memories": [
                {
                    "title": memory.title,
                    "summary": memory.summary,
                    "importance": memory.importance,
                    "year": memory.year,
                }
                for memory in npc.memories
            ],
            "home_chunk": list(npc.home_chunk),
            "intent": npc.intent,
            "speech_buffer": npc.speech_buffer,
            "last_dialogue_year": npc.last_dialogue_year,
            "emotions": npc.emotions,
            "needs": npc.needs,
            "mood": npc.mood,
            "tribe_id": npc.tribe_id,
            "role": npc.role,
            "inventory": npc.inventory,
            "life_events": npc.life_events,
            "values": npc.values,
            "coping_style": npc.coping_style,
            "current_goal": npc.current_goal,
            "goal_progress": npc.goal_progress,
            "morale": npc.morale,
            "energy": npc.energy,
            "routine_phase": npc.routine_phase,
            "routine_offset": npc.routine_offset,
            "social_preference": npc.social_preference,
            "personal_space": npc.personal_space,
            "last_speech_text": npc.last_speech_text,
            "health_condition": npc.health_condition,
            "exposure": npc.exposure,
            "immunity": npc.immunity,
            "injury": npc.injury,
            "comfort": npc.comfort,
            "trauma": npc.trauma,
            "resilience": npc.resilience,
            "reputation": npc.reputation,
            "gratitude": npc.gratitude,
            "recent_event_weight": npc.recent_event_weight,
            "attachment_style": npc.attachment_style,
            "social_state": npc.social_state,
            "social_focus_id": npc.social_focus_id,
            "last_social_year": npc.last_social_year,
            "nutrition": npc.nutrition,
            "sleep_debt": npc.sleep_debt,
            "shelter_security": npc.shelter_security,
            "household_stability": npc.household_stability,
            "status": npc.status,
            "resentment": npc.resentment,
            "leadership": npc.leadership,
            "mediation_skill": npc.mediation_skill,
            "memory_bias": npc.memory_bias,
            "worldview": npc.worldview,
            "childhood_security": npc.childhood_security,
            "developmental_pressure": npc.developmental_pressure,
            "parental_attachment": npc.parental_attachment,
            "home_component_key": npc.home_component_key,
            "home_component_label": npc.home_component_label,
            "component_attunement": npc.component_attunement,
            "communication_drive": npc.communication_drive,
        }
