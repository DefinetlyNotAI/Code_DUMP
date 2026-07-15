from __future__ import annotations

import abc
import random
from dataclasses import dataclass

import requests

from .types import DivineEvent, NpcState


def compress_to_single_sentence(text: str) -> str:
    cleaned = " ".join(text.replace("\n", " ").split())
    if not cleaned:
        return "Silence settles over the air."
    for stop in ".!?":
        if stop in cleaned:
            cleaned = cleaned.split(stop, 1)[0]
            break
    cleaned = cleaned.strip(" ,;:-")
    return f"{cleaned}." if cleaned else "Silence settles over the air."


def derive_symbolic_intent(npc: NpcState) -> str:
    if npc.energy < 0.22:
        return "rest"
    if npc.health_condition in {"sick", "injured"}:
        return "rest"
    if npc.routine_phase == "night_rest" and npc.hunger < 0.7:
        return "rest"
    if npc.hunger > 0.75:
        return "seek_food"
    if npc.health < 0.4:
        return "rest"
    if npc.social_state in {"seeking_comfort", "repairing_bond", "grieving"}:
        return "seek_company"
    if npc.social_state == "guarding_family":
        return "care_for_family"
    if npc.social_state == "avoiding_conflict":
        return "cool_down"
    goal = npc.current_goal
    if goal == "secure_food":
        return "gather_food"
    if goal == "build_home":
        return "gather_wood"
    if goal == "strengthen_bond":
        return "seek_company"
    if goal == "raise_child":
        return "care_for_family"
    if goal == "recover":
        return "rest"
    if goal == "explore_safely":
        return "scout_area"
    if npc.needs.get("belonging", 0.0) > 0.65 or npc.emotions.get("loneliness", 0.0) > 0.6:
        return "seek_company"
    if npc.emotions.get("fear", 0.0) > 0.65:
        return "seek_safety"
    if npc.emotions.get("anger", 0.0) > 0.7:
        return "cool_down"
    if npc.spouse_id is None and 18 <= npc.age_years <= 40:
        return "socialize"
    if npc.child_ids and npc.hunger < 0.5:
        return "care_for_family"
    if npc.faith > 0.75:
        return "keep_ritual"
    return "wander"


class MindAdapter(abc.ABC):
    @abc.abstractmethod
    def is_available(self) -> bool:
        raise NotImplementedError

    @abc.abstractmethod
    def generate_line(self, npc: NpcState, prompt: str) -> str:
        raise NotImplementedError

    @abc.abstractmethod
    def choose_intent(self, npc: NpcState, prompt: str) -> str:
        raise NotImplementedError

    @abc.abstractmethod
    def summarize_memory(self, npc: NpcState, prompt: str) -> str:
        raise NotImplementedError

    @abc.abstractmethod
    def respond_to_oracle(self, npc: NpcState, event: DivineEvent) -> str:
        raise NotImplementedError


@dataclass(slots=True)
class NullMindAdapter(MindAdapter):
    seed: int = 0

    def is_available(self) -> bool:
        return True

    def generate_line(self, npc: NpcState, prompt: str) -> str:
        stable_prompt = sum(ord(char) for char in prompt)
        rng = random.Random(self.seed + npc.npc_id * 97 + int(npc.age_years * 10) + stable_prompt)
        goal = npc.current_goal.replace("_", " ")
        role_lines = {
            "gatherer": [
                f"I will look for food before the baskets run low",
                f"The bushes near camp should be checked again",
                f"I can bring food back if the path stays safe",
            ],
            "builder": [
                f"We need wood before another shelter can stand",
                f"I am counting beams and dry branches for the next house",
                f"A strong wall matters more than wandering today",
            ],
            "caregiver": [
                f"Stay near the fires so nobody is alone",
                f"I will check who needs food or rest",
                f"Our people hold better when someone notices pain",
            ],
            "scout": [
                f"I will not go far beyond sight of home",
                f"The edge paths need watching before dusk",
                f"I saw signs in the brush and will keep close",
            ],
        }
        need_lines = []
        if npc.hunger > 0.72:
            need_lines.append("I need food before my strength leaves me")
        if npc.energy < 0.25:
            need_lines.append("I need to rest before my hands fail me")
        if npc.health_condition == "sick":
            need_lines.append("My body feels wrong and I need the fire close")
        if npc.health_condition == "injured":
            need_lines.append("My wound slows me and I need help")
        if npc.needs.get("shelter", 0.0) > 0.65:
            need_lines.append("I want a roof before the next hard weather")
        if npc.emotions.get("loneliness", 0.0) > 0.62:
            need_lines.append("Do not drift too far from me")
        if npc.emotions.get("fear", 0.0) > 0.62:
            need_lines.append("Something feels wrong beyond the houses")
        if "speaking to" in prompt or "replying to" in prompt:
            social_lines = [
                f"My heart is {npc.mood}, but I will stay with the tribe",
                f"My work is {goal}, and I need you near",
                f"Tell me what you saw, then we return to the homes",
                f"We should share food before anyone weakens",
                f"When the light fades, I want our people within calling distance",
            ]
            return compress_to_single_sentence(rng.choice(social_lines + need_lines))
        if need_lines:
            return compress_to_single_sentence(rng.choice(need_lines))
        return compress_to_single_sentence(rng.choice(role_lines.get(npc.role, ["I will stay close to our people"])))

    def choose_intent(self, npc: NpcState, prompt: str) -> str:
        return derive_symbolic_intent(npc)

    def summarize_memory(self, npc: NpcState, prompt: str) -> str:
        return compress_to_single_sentence(f"{npc.name} remembers hardship, kinship, and the changing land")

    def respond_to_oracle(self, npc: NpcState, event: DivineEvent) -> str:
        if event.delivery_mode == "single":
            return compress_to_single_sentence(f"I hear you, unseen guide, and I will remember this sign")
        if event.delivery_mode == "broadcast":
            return compress_to_single_sentence(f"The sky has spoken and our people will argue over its meaning")
        return compress_to_single_sentence(f"The land changes under sacred force and we must adapt quickly")


@dataclass(slots=True)
class HttpMindAdapter(MindAdapter):
    endpoint: str
    model: str
    timeout: float = 10.0

    def is_available(self) -> bool:
        try:
            response = requests.get(self.endpoint.rstrip("/") + "/models", timeout=self.timeout)
            return response.ok
        except requests.RequestException:
            return False

    def _chat(self, system: str, user: str) -> str:
        payload = {
            "model": self.model,
            "messages": [
                {"role": "system", "content": system},
                {"role": "user", "content": user},
            ],
            "max_tokens": 40,
            "temperature": 0.7,
        }
        try:
            response = requests.post(
                self.endpoint.rstrip("/") + "/chat/completions",
                json=payload,
                timeout=self.timeout,
            )
            response.raise_for_status()
            data = response.json()
            text = data["choices"][0]["message"]["content"]
            return compress_to_single_sentence(text)
        except Exception:
            return "The words beyond the veil do not arrive."

    def generate_line(self, npc: NpcState, prompt: str) -> str:
        # Background speech stays symbolic so the simulation does not stall on frequent model calls.
        intent = derive_symbolic_intent(npc).replace("_", " ")
        if npc.hunger > 0.75:
            return compress_to_single_sentence(f"I must seek food before I weaken")
        return compress_to_single_sentence(
            f"I feel {npc.mood} and need to {intent}"
        )

    def choose_intent(self, npc: NpcState, prompt: str) -> str:
        # Intents are deliberately symbolic and local to avoid per-NPC inference stalls.
        return derive_symbolic_intent(npc)

    def summarize_memory(self, npc: NpcState, prompt: str) -> str:
        return self._chat(
            "Summarize the memory in exactly one sentence from the character's in-world perspective.",
            prompt,
        )

    def respond_to_oracle(self, npc: NpcState, event: DivineEvent) -> str:
        if event.delivery_mode == "broadcast":
            return compress_to_single_sentence("The omen settles over the tribe and each heart weighs it differently")
        return self._chat(
            "Respond as an in-world mortal hearing a divine sign. Exactly one sentence, no out-of-world references.",
            f"Character: {npc.name}. Event: {event.payload}",
        )


class OllamaAdapter(HttpMindAdapter):
    pass


class LlamaCppAdapter(HttpMindAdapter):
    pass
