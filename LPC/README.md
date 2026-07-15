# SPC: Simulated PC

SPC is a Python desktop simulation game where your computer becomes a procedurally generated world. The logical world is `1,000,000 x 1,000,000` tiles, but only chunk-sized regions near the camera are generated, simulated, and rendered.

## Features

- Chunk-streamed world rendering with deterministic regeneration
- Device-profile-based biome generation from real hardware and software components
- NPC society simulation with families, relationships, aging, death, and social memory
- Optional local LLM adapters for NPC speech and oracle responses
- Divine controls for direct speech, omens, and indirect world events
- Save and load support with paused-when-closed semantics

## Run

```bash
python -m pip install -e .
python main.py
```

On launch, SPC now clears the console and opens a terminal setup UI first. It shows current settings, backend connection status, local runtime detection, and discovered models. The selected values are saved to `spc_settings.json` and reused on later runs.

## Controls

- `WASD` / Arrow keys: move camera
- `[` / `]`: slow down / speed up time
- `Tab`: toggle debug overlay
- Left click: select an NPC
- `F1`: direct speech to selected NPC
- `F2`: broadcast omen
- `F3`: indirect event mode
- `Enter`: send current text input
- `Backspace`: edit input
- `S`: save
- `L`: load
- `Esc`: quit

## Notes

- The game never renders the full `1e6 x 1e6` map.
- Local AI is optional. By default, SPC uses deterministic text generation.
- Startup no longer blocks on hidden model-server auto-probes before opening the game. Backend detection happens inside the setup UI with short timeouts and explicit refresh.
- Ollama and llama.cpp are supported through OpenAI-style HTTP adapters when selected in the setup menu.
- After the setup screen, the console is reused as the live runtime log; logs are printed to the terminal only and are not written to log files.
- The game now shows a staged world-generation loading screen before entering the live simulation.
