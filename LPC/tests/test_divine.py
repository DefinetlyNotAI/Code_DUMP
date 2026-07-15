import unittest

from spc.config import GameConfig
from spc.device import build_device_profile
from spc.divine import DivineLedger
from spc.mind import NullMindAdapter
from spc.npc import NpcManager
from spc.world import World


class FailingBroadcastMind(NullMindAdapter):
    def respond_to_oracle(self, npc, event):  # pragma: no cover - failure path
        if event.delivery_mode == "broadcast":
            raise AssertionError("broadcast should not call per-NPC oracle responses")
        return super().respond_to_oracle(npc, event)


class DivineTests(unittest.TestCase):
    def test_single_target_message_reaches_only_selected_npc(self) -> None:
        config = GameConfig(start_population=0)
        world = World(config, build_device_profile())
        npcs = NpcManager(config, world, NullMindAdapter())
        first = npcs.create_npc(20, 20, 24)
        second = npcs.create_npc(21, 20, 22)
        ledger = DivineLedger()
        event = ledger.add_direct_message(1.0, first.npc_id, "Hold fast.")
        npcs.update(0.0, {}, [event])
        self.assertTrue(first.speech_buffer)
        self.assertFalse(second.speech_buffer)

    def test_broadcast_omen_is_symbolic_and_does_not_mass_speak(self) -> None:
        config = GameConfig(start_population=0)
        world = World(config, build_device_profile())
        npcs = NpcManager(config, world, FailingBroadcastMind())
        first = npcs.create_npc(20, 20, 24)
        second = npcs.create_npc(21, 20, 22)
        ledger = DivineLedger()
        event = ledger.add_broadcast_omen(1.0, "The sky warns us.")
        npcs.update(0.0, {}, [event])
        self.assertFalse(first.speech_buffer)
        self.assertFalse(second.speech_buffer)
        self.assertTrue(event.applied_to_npcs)
        self.assertEqual(len(npcs.consume_recent_speeches()), 1)


if __name__ == "__main__":
    unittest.main()
