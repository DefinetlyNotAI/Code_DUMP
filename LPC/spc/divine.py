from __future__ import annotations

from dataclasses import dataclass, field

from .types import DivineEvent, EventKind


@dataclass(slots=True)
class DivineLedger:
    events: list[DivineEvent] = field(default_factory=list)
    next_id: int = 1

    def add_direct_message(self, year: float, target_npc_id: int, payload: str) -> DivineEvent:
        event = DivineEvent(
            event_id=self.next_id,
            year=year,
            source="player",
            scope="single",
            delivery_mode="single",
            payload=payload,
            target_npc_id=target_npc_id,
        )
        self.next_id += 1
        self.events.append(event)
        return event

    def add_broadcast_omen(self, year: float, payload: str, scope: str = "world") -> DivineEvent:
        event = DivineEvent(
            event_id=self.next_id,
            year=year,
            source="player",
            scope=scope,
            delivery_mode="broadcast",
            payload=payload,
        )
        self.next_id += 1
        self.events.append(event)
        return event

    def add_indirect_event(self, year: float, event_kind: EventKind, chunk_target: tuple[int, int], payload: str) -> DivineEvent:
        event = DivineEvent(
            event_id=self.next_id,
            year=year,
            source="player",
            scope="chunk",
            delivery_mode="indirect",
            payload=payload,
            event_kind=event_kind,
            chunk_target=chunk_target,
        )
        self.next_id += 1
        self.events.append(event)
        return event

