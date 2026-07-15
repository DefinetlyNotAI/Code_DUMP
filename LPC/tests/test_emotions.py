import unittest

from spc.config import GameConfig
from spc.device import build_device_profile
from spc.mind import NullMindAdapter
from spc.npc import NpcManager
from spc.types import RelationshipEdge
from spc.world import World


class AlwaysSwitchRng:
    def random(self) -> float:
        return 0.0

    def choice(self, values):
        return values[0]


class NoAmbientSpeechAdapter(NullMindAdapter):
    def generate_line(self, npc, prompt):  # pragma: no cover - failure path
        raise AssertionError("ambient NPC speech should not call the model")


class EmotionTests(unittest.TestCase):
    def test_created_npc_has_affective_state(self) -> None:
        config = GameConfig(start_population=0)
        world = World(config, build_device_profile())
        npcs = NpcManager(config, world, NullMindAdapter())
        npc = npcs.create_npc(50_000, 50_000, 24)
        self.assertIn("cohesion", npcs.culture)
        self.assertIn("care_norm", npcs.culture)
        self.assertIn("season", npcs.environment)
        self.assertIn("weather", npcs.environment)
        self.assertIn("food", npcs.resource_pressure)
        self.assertIn("shelter", npcs.resource_pressure)
        self.assertIn("gatherer", npcs.role_pressure)
        self.assertIn("care_load", npcs.dependency_pressure)
        self.assertIn("risk", npcs.disease_pressure)
        self.assertIn("joy", npc.emotions)
        self.assertIn("loneliness", npc.emotions)
        self.assertIn("belonging", npc.needs)
        self.assertEqual(npc.tribe_id, "first-tribe")
        self.assertIn("community", npc.values)
        self.assertIn(npc.coping_style, {"seek_support", "work", "withdraw", "pray", "confront"})
        self.assertEqual(npc.current_goal, "settle_near_tribe")
        self.assertGreaterEqual(npc.energy, 0.0)
        self.assertGreaterEqual(npc.social_preference, 0.0)
        self.assertGreater(npc.personal_space, 0.0)
        self.assertIn(npc.attachment_style, {"secure", "anxious", "avoidant", "familial"})
        self.assertEqual(npc.social_state, "settled")
        self.assertIsNone(npc.social_focus_id)
        self.assertGreaterEqual(npc.nutrition, 0.0)
        self.assertGreaterEqual(npc.sleep_debt, 0.0)
        self.assertGreaterEqual(npc.shelter_security, 0.0)
        self.assertGreaterEqual(npc.household_stability, 0.0)
        self.assertGreaterEqual(npc.leadership, 0.0)
        self.assertGreaterEqual(npc.mediation_skill, 0.0)
        self.assertEqual(npc.status, 0.0)
        self.assertEqual(npc.resentment, 0.0)
        self.assertIn("scarcity", npc.memory_bias)
        self.assertEqual(npc.worldview, "unformed")
        self.assertGreaterEqual(npc.childhood_security, 0.0)
        self.assertGreaterEqual(npc.parental_attachment, 0.0)
        self.assertGreaterEqual(npc.developmental_pressure, 0.0)
        self.assertTrue(npc.home_component_key)
        self.assertTrue(npc.home_component_label)
        self.assertGreaterEqual(npc.component_attunement, 0.0)
        self.assertGreaterEqual(npc.communication_drive, 0.0)
        self.assertEqual(npc.health_condition, "healthy")
        self.assertGreaterEqual(npc.immunity, 0.0)
        self.assertGreaterEqual(npc.resilience, 0.0)
        self.assertGreaterEqual(npc.trauma, 0.0)

    def test_hungry_npc_sets_food_goal(self) -> None:
        config = GameConfig(start_population=0)
        world = World(config, build_device_profile())
        npcs = NpcManager(config, world, NullMindAdapter())
        npc = npcs.create_npc(50_000, 50_000, 24)
        npc.hunger = 0.8
        npcs._choose_goal(npc)
        self.assertEqual(npc.current_goal, "secure_food")

    def test_night_routine_restores_energy(self) -> None:
        config = GameConfig(start_population=0)
        world = World(config, build_device_profile())
        npcs = NpcManager(config, world, NullMindAdapter())
        npc = npcs.create_npc(50_000, 50_000, 24)
        npc.routine_offset = 0.05
        npc.energy = 0.2
        before_rest = npc.needs["rest"]
        npcs._update_routine(npc, 0.2)
        self.assertEqual(npc.routine_phase, "night_rest")
        self.assertGreater(npc.energy, 0.2)
        self.assertLess(npc.needs["rest"], before_rest)

    def test_duplicate_speech_is_suppressed(self) -> None:
        config = GameConfig(start_population=0)
        world = World(config, build_device_profile())
        npcs = NpcManager(config, world, NullMindAdapter())
        npc = npcs.create_npc(50_000, 50_000, 24)
        self.assertTrue(npcs._emit_speech(npc, "Stay close."))
        self.assertFalse(npcs._emit_speech(npc, "Stay close."))
        self.assertEqual(npc.speech_buffer.count("Stay close."), 1)

    def test_reflect_filler_speech_is_suppressed(self) -> None:
        config = GameConfig(start_population=0)
        world = World(config, build_device_profile())
        npcs = NpcManager(config, world, NullMindAdapter())
        npc = npcs.create_npc(50_000, 50_000, 24)
        self.assertFalse(npcs._emit_speech(npc, f"{npc.name} turns the thought over and decides to reflect."))
        self.assertFalse(npcs._emit_speech(npc, "I feel calm and need to keep ritual."))
        self.assertFalse(npcs._emit_speech(npc, "They ponder silently."))
        self.assertFalse(npc.speech_buffer)

    def test_need_speech_is_contextual_without_model_call(self) -> None:
        config = GameConfig(start_population=0)
        world = World(config, build_device_profile())
        npcs = NpcManager(config, world, NoAmbientSpeechAdapter())
        npc = npcs.create_npc(50_000, 50_000, 24)
        npc.hunger = 0.95
        self.assertTrue(npcs._emit_speech(npc, npcs._compose_need_line(npc)))
        self.assertNotIn("reflect", npc.speech_buffer[-1].lower())
        self.assertNotIn("feel calm", npc.speech_buffer[-1].lower())

    def test_social_speech_is_contextual_without_model_call(self) -> None:
        config = GameConfig(start_population=0)
        world = World(config, build_device_profile())
        npcs = NpcManager(config, world, NoAmbientSpeechAdapter())
        left = npcs.create_npc(50_000, 50_000, 24)
        right = npcs.create_npc(50_001, 50_000, 25)
        left.intent = "gather_food"
        npcs.resource_pressure["food"] = 0.9
        line = npcs._compose_social_line(left, right)
        self.assertTrue(npcs._emit_speech(left, line))
        self.assertTrue(any(word in left.speech_buffer[-1].lower() for word in ("food", "bushes", "fruit")))

    def test_conversation_reply_stays_on_the_same_topic(self) -> None:
        config = GameConfig(start_population=0)
        world = World(config, build_device_profile())
        npcs = NpcManager(config, world, NoAmbientSpeechAdapter())
        left = npcs.create_npc(50_000, 50_000, 24)
        right = npcs.create_npc(50_001, 50_000, 25)
        left.intent = "gather_food"
        npcs.resource_pressure["food"] = 0.9
        npcs._run_conversation(left, right)
        speeches = npcs.consume_recent_speeches()
        self.assertEqual(len(speeches), 2)
        self.assertTrue(any(word in speeches[0].lower() for word in ("food", "bushes", "fruit", "grove")))
        self.assertTrue(any(word in speeches[1].lower() for word in ("bushes", "path", "share")))

    def test_strained_relationship_repairs_gradually(self) -> None:
        config = GameConfig(start_population=0)
        world = World(config, build_device_profile())
        npcs = NpcManager(config, world, NullMindAdapter())
        left = npcs.create_npc(50_000, 50_000, 24)
        right = npcs.create_npc(50_001, 50_000, 25)
        left.relationships.append(RelationshipEdge(right.npc_id, "tribemate", -0.8))
        right.relationships.append(RelationshipEdge(left.npc_id, "tribemate", -0.8))
        npcs._strengthen_relationship(left, right)
        self.assertAlmostEqual(left.relationships[-1].affinity, -0.77)
        self.assertAlmostEqual(right.relationships[-1].affinity, -0.77)

    def test_divorce_updates_both_spouses_and_relationship_edges(self) -> None:
        config = GameConfig(start_population=0)
        world = World(config, build_device_profile())
        npcs = NpcManager(config, world, NullMindAdapter())
        left = npcs.create_npc(50_000, 50_000, 30)
        right = npcs.create_npc(50_001, 50_000, 31)
        left.spouse_id = right.npc_id
        right.spouse_id = left.npc_id
        left.relationships.append(RelationshipEdge(right.npc_id, "spouse", -0.8))
        right.relationships.append(RelationshipEdge(left.npc_id, "spouse", -0.8))
        for npc in (left, right):
            npc.resentment = 1.0
            npc.emotions["anger"] = 1.0
            npc.household_stability = 0.0
        npcs.culture["conflict_norm"] = 1.0
        npcs.rng = AlwaysSwitchRng()
        npcs._resolve_divorces(1.0)
        self.assertIsNone(left.spouse_id)
        self.assertIsNone(right.spouse_id)
        self.assertEqual(left.relationships[-1].label, "former_spouse")
        self.assertEqual(right.relationships[-1].label, "former_spouse")
        self.assertTrue(any(event.startswith("Divorced ") for event in left.life_events))
        self.assertTrue(any("separate" in line.lower() or "bond" in line.lower() or "household" in line.lower() for line in left.speech_buffer))

    def test_major_life_events_can_create_specific_speech(self) -> None:
        config = GameConfig(start_population=0)
        world = World(config, build_device_profile())
        npcs = NpcManager(config, world, NoAmbientSpeechAdapter())
        npc = npcs.create_npc(50_000, 50_000, 24)
        npcs._record_life_event(npc, "Welcomed child Ari-99.", 1.0)
        self.assertTrue(npc.speech_buffer)
        self.assertFalse(any(fragment in npc.speech_buffer[-1].lower() for fragment in ("reflect", "random", "generic")))

    def test_low_importance_life_events_stay_silent(self) -> None:
        config = GameConfig(start_population=0)
        world = World(config, build_device_profile())
        npcs = NpcManager(config, world, NoAmbientSpeechAdapter())
        npc = npcs.create_npc(50_000, 50_000, 24)
        npcs._record_life_event(npc, "Made progress toward shelter.", 0.35)
        self.assertFalse(npc.speech_buffer)

    def test_environmental_exposure_can_make_npc_sick(self) -> None:
        config = GameConfig(start_population=0)
        world = World(config, build_device_profile())
        npcs = NpcManager(config, world, NullMindAdapter())
        npc = npcs.create_npc(50_000, 50_000, 24)
        npc.exposure = 0.8
        npc.immunity = 0.0
        npc.comfort = 0.0
        before_health = npc.health
        npcs._update_health_conditions(npc, 0.3)
        self.assertEqual(npc.health_condition, "sick")
        self.assertLess(npc.health, before_health)

    def test_caregiver_reduces_exposure_growth(self) -> None:
        config = GameConfig(start_population=0)
        world = World(config, build_device_profile())
        npcs = NpcManager(config, world, NullMindAdapter())
        patient = npcs.create_npc(50_000, 50_000, 24)
        caregiver = npcs.create_npc(50_001, 50_000, 30)
        caregiver.role = "caregiver"
        caregiver.values["compassion"] = 1.0
        self.assertGreater(npcs._nearby_caregiver_bonus(patient), 0.0)

    def test_relationship_drift_reduces_isolation_with_strong_bond(self) -> None:
        config = GameConfig(start_population=0)
        world = World(config, build_device_profile())
        npcs = NpcManager(config, world, NullMindAdapter())
        left = npcs.create_npc(50_000, 50_000, 24)
        right = npcs.create_npc(50_001, 50_000, 25)
        left.relationships.append(RelationshipEdge(right.npc_id, "tribemate", 0.8))
        before = left.emotions["loneliness"]
        npcs._drift_relationships(0.5)
        self.assertLess(left.emotions["loneliness"], before)

    def test_social_isolation_increases_belonging_need(self) -> None:
        config = GameConfig(start_population=0)
        world = World(config, build_device_profile())
        npcs = NpcManager(config, world, NullMindAdapter())
        npc = npcs.create_npc(50_000, 50_000, 24)
        before = npc.needs["belonging"]
        npcs._update_emotional_state(npc, 0.5)
        self.assertGreater(npc.needs["belonging"], before)

    def test_death_propagates_grief_to_spouse(self) -> None:
        config = GameConfig(start_population=0)
        world = World(config, build_device_profile())
        npcs = NpcManager(config, world, NullMindAdapter())
        deceased = npcs.create_npc(50_000, 50_000, 30)
        survivor = npcs.create_npc(50_001, 50_000, 31)
        deceased.spouse_id = survivor.npc_id
        survivor.spouse_id = deceased.npc_id
        before = survivor.emotions["sadness"]
        before_trauma = survivor.trauma
        deceased.health = 0.0
        npcs._tick_npc(deceased, 0.1)
        self.assertGreater(survivor.emotions["sadness"], before)
        self.assertGreater(survivor.trauma, before_trauma)
        self.assertTrue(any("Grieved" in event for event in survivor.life_events))

    def test_care_builds_gratitude_and_reputation(self) -> None:
        config = GameConfig(start_population=0)
        world = World(config, build_device_profile())
        npcs = NpcManager(config, world, NullMindAdapter())
        patient = npcs.create_npc(50_000, 50_000, 24)
        caregiver = npcs.create_npc(50_001, 50_000, 30)
        patient.health_condition = "sick"
        caregiver.role = "caregiver"
        before_gratitude = patient.gratitude
        before_reputation = caregiver.reputation
        before_care_norm = npcs.culture["care_norm"]
        npcs._apply_care_social_effects(patient, 0.5)
        self.assertGreater(patient.gratitude, before_gratitude)
        self.assertGreater(caregiver.reputation, before_reputation)
        self.assertGreater(npcs.culture["care_norm"], before_care_norm)

    def test_resilience_and_support_reduce_trauma(self) -> None:
        config = GameConfig(start_population=0)
        world = World(config, build_device_profile())
        npcs = NpcManager(config, world, NullMindAdapter())
        npc = npcs.create_npc(50_000, 50_000, 24)
        npc.trauma = 0.6
        npc.resilience = 1.0
        npc.comfort = 1.0
        npc.emotions["fear"] = 0.0
        npc.emotions["stress"] = 0.0
        before = npc.trauma
        npcs._update_long_term_psychology(npc, 0.5)
        self.assertLess(npc.trauma, before)

    def test_culture_scarcity_pushes_gatherers_to_food_goal(self) -> None:
        config = GameConfig(start_population=0)
        world = World(config, build_device_profile())
        npcs = NpcManager(config, world, NullMindAdapter())
        npc = npcs.create_npc(50_000, 50_000, 24)
        npc.role = "gatherer"
        npc.hunger = 0.1
        npcs.tribe_food = 100.0
        npcs.culture["scarcity_memory"] = 0.9
        npcs._choose_goal(npc)
        self.assertEqual(npc.current_goal, "secure_food")

    def test_culture_updates_from_tribe_state(self) -> None:
        config = GameConfig(start_population=0)
        world = World(config, build_device_profile())
        npcs = NpcManager(config, world, NullMindAdapter())
        first = npcs.create_npc(50_000, 50_000, 24)
        second = npcs.create_npc(50_001, 50_000, 25)
        first.trauma = 0.8
        second.trauma = 0.8
        npcs.tribe_food = 0.1
        before = npcs.culture["scarcity_memory"]
        npcs._update_culture(1.0)
        self.assertGreater(npcs.culture["scarcity_memory"], before)

    def test_environment_updates_seasonal_food_growth(self) -> None:
        config = GameConfig(start_population=0)
        world = World(config, build_device_profile())
        npcs = NpcManager(config, world, NullMindAdapter())
        npc = npcs.create_npc(50_000, 50_000, 24.1)
        npcs._update_environment(0.1)
        self.assertIn(npcs.environment["season"], {"spring", "summer", "autumn", "winter"})
        self.assertGreater(float(npcs.environment["food_growth"]), 0.0)
        self.assertGreaterEqual(float(npcs.environment["temperature_stress"]), 0.0)

    def test_severe_weather_pushes_npc_to_shelter(self) -> None:
        config = GameConfig(start_population=0)
        world = World(config, build_device_profile())
        npcs = NpcManager(config, world, NullMindAdapter())
        npc = npcs.create_npc(50_000, 50_000, 24)
        npcs.environment["weather"] = "storm"
        npc.hunger = 0.2
        npc.energy = 0.8
        npcs._tick_npc(npc, 0.1)
        self.assertEqual(npc.intent, "seek_shelter")

    def test_weather_increases_unsheltered_exposure(self) -> None:
        config = GameConfig(start_population=0)
        world = World(config, build_device_profile())
        npcs = NpcManager(config, world, NullMindAdapter())
        npc = npcs.create_npc(50_000, 50_000, 24)
        npcs.environment.update({"weather": "storm", "temperature_stress": 0.7, "rainfall": 0.9})
        npc.exposure = 0.1
        npc.comfort = 0.0
        npc.immunity = 0.0
        before = npc.exposure
        npcs._update_health_conditions(npc, 0.5)
        self.assertGreater(npc.exposure, before)

    def test_resource_pressure_tracks_food_and_shelter(self) -> None:
        config = GameConfig(start_population=0)
        world = World(config, build_device_profile())
        npcs = NpcManager(config, world, NullMindAdapter())
        npcs.create_npc(50_000, 50_000, 24)
        npcs.create_npc(50_001, 50_000, 25)
        npcs.tribe_food = 0.1
        npcs._update_resource_pressure()
        self.assertGreater(npcs.resource_pressure["food"], 0.8)
        self.assertGreaterEqual(npcs.resource_pressure["shelter"], 0.0)

    def test_rationing_feeds_hungriest_npc(self) -> None:
        config = GameConfig(start_population=0)
        world = World(config, build_device_profile())
        npcs = NpcManager(config, world, NullMindAdapter())
        hungry = npcs.create_npc(50_000, 50_000, 24)
        fed = npcs.create_npc(50_001, 50_000, 25)
        hungry.hunger = 0.9
        fed.hunger = 0.1
        npcs.tribe_food = 2.0
        before_hunger = hungry.hunger
        before_food = npcs.tribe_food
        npcs._apply_rationing(1.0)
        self.assertLess(hungry.hunger, before_hunger)
        self.assertLess(npcs.tribe_food, before_food)
        self.assertGreater(hungry.gratitude, 0.0)

    def test_role_pressure_tracks_village_needs(self) -> None:
        config = GameConfig(start_population=0)
        world = World(config, build_device_profile())
        npcs = NpcManager(config, world, NullMindAdapter())
        first = npcs.create_npc(50_000, 50_000, 24)
        second = npcs.create_npc(50_001, 50_000, 25)
        first.role = "scout"
        second.role = "scout"
        npcs.resource_pressure["food"] = 0.95
        npcs.culture["scarcity_memory"] = 0.8
        npcs._update_role_pressure()
        self.assertGreater(npcs.role_pressure["gatherer"], 0.5)

    def test_adaptive_roles_switch_to_needed_work(self) -> None:
        config = GameConfig(start_population=0)
        world = World(config, build_device_profile())
        npcs = NpcManager(config, world, NullMindAdapter())
        npc = npcs.create_npc(50_000, 50_000, 24)
        npc.role = "scout"
        npc.skills["forage"] = 1.0
        npc.values["community"] = 1.0
        npc.trauma = 0.0
        npcs.role_pressure["gatherer"] = 0.9
        npcs.rng = AlwaysSwitchRng()
        npcs._adapt_roles(1.0)
        self.assertEqual(npc.role, "gatherer")
        self.assertTrue(any("Changed role" in event for event in npc.life_events))

    def test_life_stage_classification(self) -> None:
        config = GameConfig(start_population=0)
        world = World(config, build_device_profile())
        npcs = NpcManager(config, world, NullMindAdapter())
        infant = npcs.create_npc(50_000, 50_000, 0.5)
        child = npcs.create_npc(50_001, 50_000, 6)
        adult = npcs.create_npc(50_002, 50_000, 30)
        elder = npcs.create_npc(50_003, 50_000, 70)
        self.assertEqual(npcs.life_stage(infant), "infant")
        self.assertEqual(npcs.life_stage(child), "child")
        self.assertEqual(npcs.life_stage(adult), "adult")
        self.assertEqual(npcs.life_stage(elder), "elder")

    def test_dependency_pressure_counts_children(self) -> None:
        config = GameConfig(start_population=0)
        world = World(config, build_device_profile())
        npcs = NpcManager(config, world, NullMindAdapter())
        npcs.create_npc(50_000, 50_000, 0.5)
        npcs.create_npc(50_001, 50_000, 7)
        caregiver = npcs.create_npc(50_002, 50_000, 30)
        caregiver.role = "caregiver"
        npcs._update_dependency_pressure()
        self.assertGreater(npcs.dependency_pressure["dependents"], 1.0)
        self.assertGreater(npcs.dependency_pressure["care_load"], 0.0)

    def test_disease_pressure_tracks_sick_and_crowding(self) -> None:
        config = GameConfig(start_population=0)
        world = World(config, build_device_profile())
        npcs = NpcManager(config, world, NullMindAdapter())
        first = npcs.create_npc(50_000, 50_000, 24)
        second = npcs.create_npc(50_001, 50_000, 25)
        first.health_condition = "sick"
        second.health_condition = "weakened"
        npcs.resource_pressure["house_capacity"] = 1.0
        npcs._update_dependency_pressure()
        npcs._update_disease_pressure()
        self.assertEqual(npcs.disease_pressure["sick"], 1.0)
        self.assertEqual(npcs.disease_pressure["weakened"], 1.0)
        self.assertGreater(npcs.disease_pressure["risk"], 0.0)
        self.assertGreater(npcs.disease_pressure["crowding"], 0.0)

    def test_local_contagion_increases_exposure(self) -> None:
        config = GameConfig(start_population=0)
        world = World(config, build_device_profile())
        npcs = NpcManager(config, world, NullMindAdapter())
        sick = npcs.create_npc(50_000, 50_000, 24)
        healthy = npcs.create_npc(50_001, 50_000, 25)
        sick.health_condition = "sick"
        healthy.exposure = 0.0
        healthy.immunity = 0.0
        healthy.comfort = 0.0
        npcs.resource_pressure["house_capacity"] = 1.0
        npcs._update_dependency_pressure()
        npcs._update_disease_pressure()
        before = healthy.exposure
        npcs._update_health_conditions(healthy, 0.5)
        self.assertGreater(healthy.exposure, before)

    def test_child_near_parent_feels_safer(self) -> None:
        config = GameConfig(start_population=0)
        world = World(config, build_device_profile())
        npcs = NpcManager(config, world, NullMindAdapter())
        parent = npcs.create_npc(50_000, 50_000, 30)
        child = npcs.create_npc(50_001, 50_000, 4, parent_ids=[parent.npc_id])
        parent.child_ids.append(child.npc_id)
        child.needs["safety"] = 0.7
        before = child.needs["safety"]
        npcs._update_dependency_state(child, 0.5)
        self.assertLess(child.needs["safety"], before)

    def test_child_goal_stays_with_family(self) -> None:
        config = GameConfig(start_population=0)
        world = World(config, build_device_profile())
        npcs = NpcManager(config, world, NullMindAdapter())
        child = npcs.create_npc(50_000, 50_000, 5)
        npcs._choose_goal(child)
        self.assertEqual(child.current_goal, "stay_with_family")

    def test_child_inherits_parental_temperament(self) -> None:
        config = GameConfig(start_population=0)
        world = World(config, build_device_profile())
        npcs = NpcManager(config, world, NullMindAdapter())
        parent = npcs.create_npc(50_000, 50_000, 30)
        parent.traits = ["tender", "patient"]
        parent.values["compassion"] = 0.95
        parent.household_stability = 0.9
        child = npcs.create_npc(50_001, 50_000, 0.0, parent_ids=[parent.npc_id])
        self.assertTrue(set(child.traits).issubset(set(parent.traits)))
        self.assertGreater(child.values["compassion"], 0.5)
        self.assertGreater(child.childhood_security, 0.5)

    def test_supported_childhood_improves_security(self) -> None:
        config = GameConfig(start_population=0)
        world = World(config, build_device_profile())
        npcs = NpcManager(config, world, NullMindAdapter())
        parent = npcs.create_npc(50_000, 50_000, 30)
        child = npcs.create_npc(50_001, 50_000, 4, parent_ids=[parent.npc_id])
        parent.child_ids.append(child.npc_id)
        child.childhood_security = 0.4
        before = child.childhood_security
        npcs._update_dependency_state(child, 0.5)
        self.assertGreater(child.childhood_security, before)

    def test_neglected_childhood_increases_developmental_pressure(self) -> None:
        config = GameConfig(start_population=0)
        world = World(config, build_device_profile())
        npcs = NpcManager(config, world, NullMindAdapter())
        child = npcs.create_npc(50_000, 50_000, 4)
        child.developmental_pressure = 0.1
        before = child.developmental_pressure
        npcs._update_dependency_state(child, 0.5)
        self.assertGreater(child.developmental_pressure, before)

    def test_developmental_pressure_pushes_child_to_comfort(self) -> None:
        config = GameConfig(start_population=0)
        world = World(config, build_device_profile())
        npcs = NpcManager(config, world, NullMindAdapter())
        child = npcs.create_npc(50_000, 50_000, 5)
        child.developmental_pressure = 0.8
        npcs._choose_goal(child)
        self.assertEqual(child.current_goal, "seek_comfort")

    def test_lonely_npc_seeks_comfort_from_bond(self) -> None:
        config = GameConfig(start_population=0)
        world = World(config, build_device_profile())
        npcs = NpcManager(config, world, NullMindAdapter())
        left = npcs.create_npc(50_000, 50_000, 24)
        right = npcs.create_npc(50_001, 50_000, 25)
        left.relationships.append(RelationshipEdge(right.npc_id, "tribemate", 0.7))
        left.emotions["loneliness"] = 0.8
        left.needs["belonging"] = 0.7
        before = left.emotions["loneliness"]
        npcs._update_social_drives(left, 0.5)
        self.assertEqual(left.social_state, "seeking_comfort")
        self.assertEqual(left.social_focus_id, right.npc_id)
        self.assertLess(left.emotions["loneliness"], before)

    def test_angry_npc_avoids_strained_relationship(self) -> None:
        config = GameConfig(start_population=0)
        world = World(config, build_device_profile())
        npcs = NpcManager(config, world, NullMindAdapter())
        left = npcs.create_npc(50_000, 50_000, 24)
        right = npcs.create_npc(50_001, 50_000, 25)
        left.relationships.append(RelationshipEdge(right.npc_id, "tribemate", -0.6))
        left.emotions["anger"] = 0.7
        npcs._update_social_drives(left, 0.25)
        self.assertEqual(left.social_state, "avoiding_conflict")
        self.assertEqual(left.social_focus_id, right.npc_id)

    def test_parent_guards_vulnerable_child(self) -> None:
        config = GameConfig(start_population=0)
        world = World(config, build_device_profile())
        npcs = NpcManager(config, world, NullMindAdapter())
        parent = npcs.create_npc(50_000, 50_000, 30)
        child = npcs.create_npc(50_001, 50_000, 4, parent_ids=[parent.npc_id])
        parent.child_ids.append(child.npc_id)
        npcs._update_social_drives(parent, 0.25)
        self.assertEqual(parent.social_state, "guarding_family")
        self.assertEqual(parent.social_focus_id, child.npc_id)

    def test_deprivation_welfare_increases_stress(self) -> None:
        config = GameConfig(start_population=0)
        world = World(config, build_device_profile())
        npcs = NpcManager(config, world, NullMindAdapter())
        npc = npcs.create_npc(50_000, 50_000, 24)
        npc.hunger = 1.0
        npc.energy = 0.15
        npc.needs["rest"] = 1.0
        npc.nutrition = 0.1
        npc.sleep_debt = 0.9
        npc.shelter_security = 0.1
        npc.emotions["stress"] = 0.1
        before = npc.emotions["stress"]
        npcs.resource_pressure.update({"stores_per_person": 0.0, "ration_level": 0.0, "shelter": 1.0, "food": 1.0})
        npcs._update_welfare_state(npc, 0.5)
        self.assertGreater(npc.emotions["stress"], before)
        self.assertLess(npc.household_stability, 0.5)

    def test_stable_household_reduces_belonging_need(self) -> None:
        config = GameConfig(start_population=0)
        world = World(config, build_device_profile())
        npcs = NpcManager(config, world, NullMindAdapter())
        first = npcs.create_npc(50_000, 50_000, 30)
        second = npcs.create_npc(50_001, 50_000, 31)
        first.relationships.append(RelationshipEdge(second.npc_id, "tribemate", 0.8))
        world.add_structure_near(first.x, first.y, "house", "test house")
        first.nutrition = 0.8
        first.household_stability = 0.8
        first.needs["belonging"] = 0.5
        npcs.resource_pressure.update({"stores_per_person": 2.0, "ration_level": 1.0, "shelter": 0.0, "food": 0.0})
        before = first.needs["belonging"]
        npcs._update_welfare_state(first, 0.5)
        self.assertLess(first.needs["belonging"], before)

    def test_low_nutrition_prioritizes_food_goal(self) -> None:
        config = GameConfig(start_population=0)
        world = World(config, build_device_profile())
        npcs = NpcManager(config, world, NullMindAdapter())
        npc = npcs.create_npc(50_000, 50_000, 24)
        npc.hunger = 0.1
        npc.nutrition = 0.2
        npcs.tribe_food = 100.0
        npcs.resource_pressure["food"] = 0.0
        npcs._choose_goal(npc)
        self.assertEqual(npc.current_goal, "secure_food")

    def test_status_rises_from_reputation_and_leadership(self) -> None:
        config = GameConfig(start_population=0)
        world = World(config, build_device_profile())
        npcs = NpcManager(config, world, NullMindAdapter())
        npc = npcs.create_npc(50_000, 50_000, 35)
        npc.reputation = 0.8
        npc.leadership = 0.9
        npc.household_stability = 0.8
        before = npc.status
        npcs._update_status_state(npc, 1.0)
        self.assertGreater(npc.status, before)

    def test_unserved_rationing_increases_resentment(self) -> None:
        config = GameConfig(start_population=0)
        world = World(config, build_device_profile())
        npcs = NpcManager(config, world, NullMindAdapter())
        first = npcs.create_npc(50_000, 50_000, 24)
        second = npcs.create_npc(50_001, 50_000, 25)
        first.hunger = 0.9
        second.hunger = 0.85
        npcs.tribe_food = 0.1
        npcs.culture["cohesion"] = 0.0
        before = second.resentment
        npcs._apply_rationing(1.0)
        self.assertGreater(second.resentment, before)

    def test_mediator_reduces_conflict_damage(self) -> None:
        config = GameConfig(start_population=0)
        world = World(config, build_device_profile())
        npcs = NpcManager(config, world, NullMindAdapter())
        left = npcs.create_npc(50_000, 50_000, 24)
        right = npcs.create_npc(50_001, 50_000, 25)
        mediator = npcs.create_npc(50_001, 50_001, 40)
        mediator.mediation_skill = 1.0
        mediator.leadership = 1.0
        mediator.status = 0.9
        before_rep = mediator.reputation
        npcs._handle_conflict(left, right)
        self.assertGreater(mediator.reputation, before_rep)
        self.assertTrue(any("Mediated" in event for event in mediator.life_events))

    def test_life_event_builds_memory_bias_and_worldview(self) -> None:
        config = GameConfig(start_population=0)
        world = World(config, build_device_profile())
        npcs = NpcManager(config, world, NullMindAdapter())
        npc = npcs.create_npc(50_000, 50_000, 24)
        before_security = npc.values["security"]
        npcs._record_life_event(npc, "Food scarcity made the tribe hungry.", 1.0)
        self.assertGreater(npc.memory_bias["scarcity"], 0.0)
        self.assertGreater(npc.values["security"], before_security)
        self.assertEqual(npc.worldview, "scarcity-minded")

    def test_memory_bias_can_shape_goal_choice(self) -> None:
        config = GameConfig(start_population=0)
        world = World(config, build_device_profile())
        npcs = NpcManager(config, world, NullMindAdapter())
        npc = npcs.create_npc(50_000, 50_000, 24)
        npc.role = "gatherer"
        npc.hunger = 0.1
        npc.nutrition = 0.8
        npc.memory_bias["scarcity"] = 0.8
        npcs.tribe_food = 100.0
        npcs.resource_pressure["food"] = 0.0
        npcs._choose_goal(npc)
        self.assertEqual(npc.current_goal, "secure_food")

    def test_memory_bias_slowly_decays(self) -> None:
        config = GameConfig(start_population=0)
        world = World(config, build_device_profile())
        npcs = NpcManager(config, world, NullMindAdapter())
        npc = npcs.create_npc(50_000, 50_000, 24)
        npc.memory_bias["loss"] = 0.8
        npcs._decay_memory_bias(npc, 1.0)
        self.assertLess(npc.memory_bias["loss"], 0.8)

    def test_population_cap_is_enforced(self) -> None:
        config = GameConfig(start_population=0)
        config.max_population = 2
        world = World(config, build_device_profile())
        npcs = NpcManager(config, world, NullMindAdapter())
        npcs.create_npc(2_500, 2_500, 24)
        npcs.create_npc(2_501, 2_500, 25)
        with self.assertRaises(RuntimeError):
            npcs.create_npc(2_502, 2_500, 26)


if __name__ == "__main__":
    unittest.main()
