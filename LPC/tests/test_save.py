import tempfile
import unittest
from pathlib import Path

from spc.config import GameConfig
from spc.device import build_device_profile
from spc.divine import DivineLedger
from spc.mind import NullMindAdapter
from spc.npc import NpcManager
from spc.save import load_game, save_game
from spc.world import World


class SaveTests(unittest.TestCase):
    def test_save_and_load_roundtrip(self) -> None:
        config = GameConfig(start_population=0)
        world = World(config, build_device_profile())
        npcs = NpcManager(config, world, NullMindAdapter())
        original = npcs.create_npc(30, 40, 20)
        original.emotions["joy"] = 0.83
        original.needs["belonging"] = 0.61
        original.mood = "joyful"
        original.role = "builder"
        original.inventory["wood"] = 2.25
        original.life_events.append("Built the first shelter.")
        original.values["ambition"] = 0.91
        original.coping_style = "work"
        original.current_goal = "build_home"
        original.goal_progress = 0.44
        original.morale = 0.72
        original.energy = 0.33
        original.routine_phase = "night_rest"
        original.routine_offset = 0.12
        original.social_preference = 0.68
        original.personal_space = 3.1
        original.last_speech_text = "We need wood."
        original.health_condition = "sick"
        original.exposure = 0.77
        original.immunity = 0.22
        original.injury = 0.18
        original.comfort = 0.31
        original.trauma = 0.44
        original.resilience = 0.62
        original.reputation = -0.13
        original.gratitude = 0.28
        original.recent_event_weight = 0.51
        original.attachment_style = "anxious"
        original.social_state = "seeking_comfort"
        original.social_focus_id = 99
        original.last_social_year = 1.75
        original.nutrition = 0.21
        original.sleep_debt = 0.74
        original.shelter_security = 0.36
        original.household_stability = 0.49
        original.status = -0.22
        original.resentment = 0.64
        original.leadership = 0.71
        original.mediation_skill = 0.58
        original.memory_bias["loss"] = 0.44
        original.memory_bias["care"] = 0.31
        original.worldview = "grief-marked"
        original.childhood_security = 0.37
        original.developmental_pressure = 0.69
        original.parental_attachment = 0.42
        original.home_component_key = "cpu"
        original.home_component_label = "CPU Core"
        original.component_attunement = 0.73
        original.communication_drive = 0.66
        npcs.culture["cohesion"] = 0.33
        npcs.culture["care_norm"] = 0.81
        npcs.culture["scarcity_memory"] = 0.67
        npcs.environment["season"] = "winter"
        npcs.environment["weather"] = "storm"
        npcs.environment["food_growth"] = 0.42
        npcs.resource_pressure["food"] = 0.91
        npcs.resource_pressure["shelter"] = 0.42
        npcs.resource_pressure["ration_level"] = 0.18
        npcs.role_pressure["gatherer"] = 0.73
        npcs.role_pressure["builder"] = 0.12
        npcs.role_pressure["coverage"] = 0.64
        npcs.dependency_pressure["dependents"] = 2.5
        npcs.dependency_pressure["care_load"] = 0.77
        npcs.disease_pressure["risk"] = 0.66
        npcs.disease_pressure["sick"] = 1.0
        npcs.disease_pressure["crowding"] = 0.31
        divine = DivineLedger()
        chunk = world.get_chunk(0, 0)
        chunk.mutated = True
        chunk.corruption = 0.5
        with tempfile.TemporaryDirectory() as tmpdir:
            path = Path(tmpdir) / "save.json"
            save_game(path, 2.5, world, npcs, divine)
            loaded_world = World(config, build_device_profile())
            loaded_npcs = NpcManager(config, loaded_world, NullMindAdapter())
            loaded_divine = DivineLedger()
            year = load_game(path, loaded_world, loaded_npcs, loaded_divine)
            self.assertEqual(year, 2.5)
            self.assertEqual(loaded_npcs.living_population(), 1)
            self.assertEqual(loaded_npcs.culture["cohesion"], 0.33)
            self.assertEqual(loaded_npcs.culture["care_norm"], 0.81)
            self.assertEqual(loaded_npcs.culture["scarcity_memory"], 0.67)
            self.assertEqual(loaded_npcs.environment["season"], "winter")
            self.assertEqual(loaded_npcs.environment["weather"], "storm")
            self.assertEqual(loaded_npcs.environment["food_growth"], 0.42)
            self.assertEqual(loaded_npcs.resource_pressure["food"], 0.91)
            self.assertEqual(loaded_npcs.resource_pressure["shelter"], 0.42)
            self.assertEqual(loaded_npcs.resource_pressure["ration_level"], 0.18)
            self.assertEqual(loaded_npcs.role_pressure["gatherer"], 0.73)
            self.assertEqual(loaded_npcs.role_pressure["builder"], 0.12)
            self.assertEqual(loaded_npcs.role_pressure["coverage"], 0.64)
            self.assertEqual(loaded_npcs.dependency_pressure["dependents"], 2.5)
            self.assertEqual(loaded_npcs.dependency_pressure["care_load"], 0.77)
            self.assertEqual(loaded_npcs.disease_pressure["risk"], 0.66)
            self.assertEqual(loaded_npcs.disease_pressure["sick"], 1.0)
            self.assertEqual(loaded_npcs.disease_pressure["crowding"], 0.31)
            self.assertEqual(loaded_world.get_chunk(0, 0).corruption, 0.5)
            loaded = loaded_npcs.npcs[original.npc_id]
            self.assertEqual(loaded.emotions["joy"], 0.83)
            self.assertEqual(loaded.needs["belonging"], 0.61)
            self.assertEqual(loaded.mood, "joyful")
            self.assertEqual(loaded.role, "builder")
            self.assertEqual(loaded.inventory["wood"], 2.25)
            self.assertIn("Built the first shelter.", loaded.life_events)
            self.assertEqual(loaded.values["ambition"], 0.91)
            self.assertEqual(loaded.coping_style, "work")
            self.assertEqual(loaded.current_goal, "build_home")
            self.assertEqual(loaded.goal_progress, 0.44)
            self.assertEqual(loaded.morale, 0.72)
            self.assertEqual(loaded.energy, 0.33)
            self.assertEqual(loaded.routine_phase, "night_rest")
            self.assertEqual(loaded.routine_offset, 0.12)
            self.assertEqual(loaded.social_preference, 0.68)
            self.assertEqual(loaded.personal_space, 3.1)
            self.assertEqual(loaded.last_speech_text, "We need wood.")
            self.assertEqual(loaded.health_condition, "sick")
            self.assertEqual(loaded.exposure, 0.77)
            self.assertEqual(loaded.immunity, 0.22)
            self.assertEqual(loaded.injury, 0.18)
            self.assertEqual(loaded.comfort, 0.31)
            self.assertEqual(loaded.trauma, 0.44)
            self.assertEqual(loaded.resilience, 0.62)
            self.assertEqual(loaded.reputation, -0.13)
            self.assertEqual(loaded.gratitude, 0.28)
            self.assertEqual(loaded.recent_event_weight, 0.51)
            self.assertEqual(loaded.attachment_style, "anxious")
            self.assertEqual(loaded.social_state, "seeking_comfort")
            self.assertEqual(loaded.social_focus_id, 99)
            self.assertEqual(loaded.last_social_year, 1.75)
            self.assertEqual(loaded.nutrition, 0.21)
            self.assertEqual(loaded.sleep_debt, 0.74)
            self.assertEqual(loaded.shelter_security, 0.36)
            self.assertEqual(loaded.household_stability, 0.49)
            self.assertEqual(loaded.status, -0.22)
            self.assertEqual(loaded.resentment, 0.64)
            self.assertEqual(loaded.leadership, 0.71)
            self.assertEqual(loaded.mediation_skill, 0.58)
            self.assertEqual(loaded.memory_bias["loss"], 0.44)
            self.assertEqual(loaded.memory_bias["care"], 0.31)
            self.assertEqual(loaded.worldview, "grief-marked")
            self.assertEqual(loaded.childhood_security, 0.37)
            self.assertEqual(loaded.developmental_pressure, 0.69)
            self.assertEqual(loaded.parental_attachment, 0.42)
            self.assertEqual(loaded.home_component_key, "cpu")
            self.assertEqual(loaded.home_component_label, "CPU Core")
            self.assertEqual(loaded.component_attunement, 0.73)
            self.assertEqual(loaded.communication_drive, 0.66)


if __name__ == "__main__":
    unittest.main()
