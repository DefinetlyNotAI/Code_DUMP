import unittest

from spc.mind import HttpMindAdapter, derive_symbolic_intent
from spc.types import NpcState


class StaticIntentAdapter(HttpMindAdapter):
    def _chat(self, system: str, user: str) -> str:  # pragma: no cover
        raise AssertionError("choose_intent should not call the model")


def make_npc(**overrides) -> NpcState:
    base = dict(
        npc_id=1,
        name="Test-1",
        x=0,
        y=0,
        age_years=25.0,
        sex="f",
        health=0.8,
        hunger=0.2,
        faith=0.3,
        fertility=0.7,
        alive=True,
        spouse_id=None,
        parent_ids=[],
        child_ids=[],
        traits=[],
        skills={},
        beliefs={"omen_trust": 0.5, "community": 0.5},
        relationships=[],
        memories=[],
        home_chunk=(0, 0),
        intent="wander",
        speech_buffer=[],
        last_dialogue_year=0.0,
    )
    base.update(overrides)
    return NpcState(**base)


class MindTests(unittest.TestCase):
    def test_symbolic_intent_prefers_food_when_hungry(self) -> None:
        npc = make_npc(hunger=0.9)
        self.assertEqual(derive_symbolic_intent(npc), "seek_food")

    def test_http_adapter_choose_intent_is_non_blocking(self) -> None:
        adapter = StaticIntentAdapter(endpoint="http://localhost:11434/v1", model="dummy")
        npc = make_npc(hunger=0.1, health=0.2)
        self.assertEqual(adapter.choose_intent(npc, "ignored"), "rest")

    def test_http_adapter_generate_line_is_non_blocking(self) -> None:
        adapter = StaticIntentAdapter(endpoint="http://localhost:11434/v1", model="dummy")
        npc = make_npc(hunger=0.9)
        line = adapter.generate_line(npc, "ignored")
        self.assertIn("seek food", line.lower())

    def test_loneliness_changes_symbolic_intent(self) -> None:
        npc = make_npc(
            spouse_id=2,
            emotions={"loneliness": 0.8},
            needs={"belonging": 0.8},
        )
        self.assertEqual(derive_symbolic_intent(npc), "seek_company")

    def test_social_state_changes_symbolic_intent(self) -> None:
        npc = make_npc(social_state="avoiding_conflict")
        self.assertEqual(derive_symbolic_intent(npc), "cool_down")


if __name__ == "__main__":
    unittest.main()
