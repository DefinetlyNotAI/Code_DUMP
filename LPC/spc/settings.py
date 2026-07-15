from __future__ import annotations

import json
from dataclasses import asdict, dataclass
from pathlib import Path

import requests
from rich.console import Console
from rich.panel import Panel
from rich.table import Table


console = Console()


@dataclass(slots=True)
class RuntimeSettings:
    ai_backend: str = "none"
    ai_endpoint: str = "http://localhost:11434/v1"
    ai_model: str = ""
    screen_width: int = 1366
    screen_height: int = 768
    tile_size: int = 10
    chunk_size: int = 64
    start_population: int = 36
    base_sim_speed: float = 60.0
    auto_load_latest: bool = True


@dataclass(slots=True)
class BackendProbe:
    backend: str
    ok: bool
    endpoint: str
    detail: str
    models: list[str]


def load_runtime_settings(path: Path) -> RuntimeSettings:
    if not path.exists():
        return RuntimeSettings()
    payload = json.loads(path.read_text(encoding="utf-8"))
    return RuntimeSettings(**payload)


def save_runtime_settings(path: Path, settings: RuntimeSettings) -> None:
    path.write_text(json.dumps(asdict(settings), indent=2), encoding="utf-8")


def configure_runtime_settings(path: Path) -> RuntimeSettings:
    console.clear()
    settings = load_runtime_settings(path)
    probe_cache: dict[tuple[str, str], BackendProbe] = {}
    while True:
        selected_probe = discover_backend(settings.ai_backend, settings.ai_endpoint, probe_cache)
        local_probes = discover_local_backends(probe_cache)
        render_setup_screen(settings, selected_probe, local_probes)
        choice = input("Command: ").strip().lower()
        if choice == "1":
            settings.ai_backend = _choose_backend(settings.ai_backend)
            if settings.ai_backend == "none":
                settings.ai_model = ""
            elif settings.ai_backend == "ollama" and settings.ai_endpoint == "http://localhost:11434/v1":
                settings.ai_endpoint = "http://localhost:11434"
            elif settings.ai_backend == "llama_cpp" and settings.ai_endpoint in {"http://localhost:11434", "http://localhost:11434/v1"}:
                settings.ai_endpoint = "http://localhost:8080/v1"
        elif choice == "2":
            settings.ai_endpoint = _prompt_text("AI endpoint", settings.ai_endpoint)
        elif choice == "3":
            probe = selected_probe
            if settings.ai_backend == "ollama" and not probe.models:
                probe = local_probes.get("ollama", probe)
            settings.ai_model = _choose_model(settings, probe)
        elif choice == "4":
            settings.screen_width = _prompt_int("Screen width", settings.screen_width, 640, 4096)
            settings.screen_height = _prompt_int("Screen height", settings.screen_height, 480, 2160)
        elif choice == "5":
            settings.tile_size = _prompt_int("Tile size", settings.tile_size, 4, 32)
        elif choice == "6":
            settings.chunk_size = _prompt_int("Chunk size", settings.chunk_size, 16, 256)
        elif choice == "7":
            settings.start_population = _prompt_int("Start population", settings.start_population, 1, 100)
        elif choice == "8":
            settings.base_sim_speed = _prompt_float("Simulation speed", settings.base_sim_speed, 1.0, 10000.0)
        elif choice == "9":
            settings.auto_load_latest = _prompt_bool("Auto-load latest save", settings.auto_load_latest)
        elif choice == "d":
            probe_cache.pop((settings.ai_backend, settings.ai_endpoint), None)
            probe_cache.pop(("ollama", "http://localhost:11434"), None)
            probe_cache.pop(("llama_cpp", "http://localhost:8080/v1"), None)
        elif choice == "r":
            settings = RuntimeSettings()
            probe_cache.clear()
        elif choice == "s":
            save_runtime_settings(path, settings)
            console.print(f"[green]Saved settings to[/green] {path}")
            return settings
        elif choice == "q":
            raise SystemExit(0)


def render_setup_screen(
    settings: RuntimeSettings,
    selected_probe: BackendProbe,
    local_probes: dict[str, BackendProbe],
) -> None:
    console.clear()
    table = Table(title="SPC Setup", expand=True)
    table.add_column("Key", style="cyan", width=6)
    table.add_column("Setting", style="white", width=20)
    table.add_column("Value", style="green")
    table.add_row("1", "AI backend", settings.ai_backend)
    table.add_row("2", "AI endpoint", settings.ai_endpoint)
    table.add_row("3", "AI model", settings.ai_model or "(none)")
    table.add_row("4", "Resolution", f"{settings.screen_width}x{settings.screen_height}")
    table.add_row("5", "Tile size", str(settings.tile_size))
    table.add_row("6", "Chunk size", str(settings.chunk_size))
    table.add_row("7", "Start population", str(settings.start_population))
    table.add_row("8", "Sim speed", str(settings.base_sim_speed))
    table.add_row("9", "Auto-load latest", str(settings.auto_load_latest))
    console.print(table)

    status_color = "green" if selected_probe.ok else ("yellow" if settings.ai_backend == "none" else "red")
    model_preview = ", ".join(selected_probe.models[:6]) if selected_probe.models else "No models discovered"
    probe_panel = Panel(
        f"[bold]Backend probe[/bold]\n"
        f"Backend: {selected_probe.backend}\n"
        f"Endpoint: {selected_probe.endpoint}\n"
        f"Status: [{status_color}]{selected_probe.detail}[/{status_color}]\n"
        f"Models: {model_preview}",
        title="Selected Backend",
        border_style=status_color,
    )
    console.print(probe_panel)
    console.print(render_local_probe_table(local_probes))
    console.print(
        Panel(
            "[bold]Commands[/bold]\n"
            "1-9 edit setting\n"
            "d refresh backend detection\n"
            "s save and start\n"
            "r reset defaults\n"
            "q quit",
            title="Controls",
            border_style="blue",
        )
    )


def discover_backend(backend: str, endpoint: str, probe_cache: dict[tuple[str, str], BackendProbe]) -> BackendProbe:
    cache_key = (backend, endpoint)
    if cache_key in probe_cache:
        return probe_cache[cache_key]
    if backend == "none":
        probe = BackendProbe(backend=backend, ok=True, endpoint=endpoint, detail="Local AI disabled", models=[])
    elif backend == "ollama":
        probe = probe_ollama(endpoint)
    elif backend == "llama_cpp":
        probe = probe_openai_models(endpoint, backend)
    else:
        probe = BackendProbe(backend=backend, ok=False, endpoint=endpoint, detail="Unknown backend", models=[])
    probe_cache[cache_key] = probe
    return probe


def discover_local_backends(probe_cache: dict[tuple[str, str], BackendProbe]) -> dict[str, BackendProbe]:
    return {
        "ollama": discover_backend("ollama", "http://localhost:11434", probe_cache),
        "llama_cpp": discover_backend("llama_cpp", "http://localhost:8080/v1", probe_cache),
    }


def render_local_probe_table(local_probes: dict[str, BackendProbe]) -> Table:
    table = Table(title="Local Runtime Detection", expand=True)
    table.add_column("Runtime", style="cyan", width=12)
    table.add_column("Endpoint", style="white", width=28)
    table.add_column("Status", style="green", width=28)
    table.add_column("Models", style="magenta")
    for backend, probe in local_probes.items():
        status = probe.detail
        models = ", ".join(probe.models[:5]) if probe.models else "-"
        table.add_row(backend, probe.endpoint, status, models)
    return table


def probe_ollama(endpoint: str) -> BackendProbe:
    base = endpoint.rstrip("/")
    if base.endswith("/v1"):
        base = base[:-3]
    url = f"{base}/api/tags"
    try:
        response = requests.get(url, timeout=1.5)
        response.raise_for_status()
        payload = response.json()
        models = [item["name"] for item in payload.get("models", [])]
        detail = f"Connected, {len(models)} model(s) discovered"
        return BackendProbe(backend="ollama", ok=True, endpoint=base, detail=detail, models=models)
    except Exception as exc:
        return BackendProbe(backend="ollama", ok=False, endpoint=base, detail=f"Not reachable: {type(exc).__name__}", models=[])


def probe_openai_models(endpoint: str, backend: str) -> BackendProbe:
    url = endpoint.rstrip("/") + "/models"
    try:
        response = requests.get(url, timeout=1.5)
        response.raise_for_status()
        payload = response.json()
        models = [item["id"] for item in payload.get("data", [])]
        detail = f"Connected, {len(models)} model(s) discovered"
        return BackendProbe(backend=backend, ok=True, endpoint=endpoint, detail=detail, models=models)
    except Exception as exc:
        return BackendProbe(backend=backend, ok=False, endpoint=endpoint, detail=f"Not reachable: {type(exc).__name__}", models=[])


def _choose_backend(current: str) -> str:
    console.print("Choose backend:")
    console.print(f"1. none {'(current)' if current == 'none' else ''}")
    console.print(f"2. ollama {'(current)' if current == 'ollama' else ''}")
    console.print(f"3. llama_cpp {'(current)' if current == 'llama_cpp' else ''}")
    raw = input("Backend [1-3]: ").strip()
    return {"1": "none", "2": "ollama", "3": "llama_cpp"}.get(raw, current)


def _choose_model(settings: RuntimeSettings, probe: BackendProbe) -> str:
    if probe.models:
        console.print("\nDiscovered models:")
        for index, model in enumerate(probe.models, start=1):
            marker = " (current)" if model == settings.ai_model else ""
            console.print(f"{index}. {model}{marker}")
        console.print("M. Manual entry")
        raw = input("Model selection: ").strip().lower()
        if raw == "m":
            return _prompt_text("AI model", settings.ai_model)
        try:
            idx = int(raw)
        except ValueError:
            return settings.ai_model
        if 1 <= idx <= len(probe.models):
            return probe.models[idx - 1]
        return settings.ai_model
    console.print("[yellow]No discovered models for the current backend. Enter one manually if needed.[/yellow]")
    return _prompt_text("AI model", settings.ai_model)


def _prompt_text(label: str, current: str) -> str:
    raw = input(f"{label} [{current}]: ").strip()
    return raw or current


def _prompt_int(label: str, current: int, minimum: int, maximum: int) -> int:
    raw = input(f"{label} [{current}]: ").strip()
    if not raw:
        return current
    try:
        value = int(raw)
    except ValueError:
        return current
    return min(maximum, max(minimum, value))


def _prompt_float(label: str, current: float, minimum: float, maximum: float) -> float:
    raw = input(f"{label} [{current}]: ").strip()
    if not raw:
        return current
    try:
        value = float(raw)
    except ValueError:
        return current
    return min(maximum, max(minimum, value))


def _prompt_bool(label: str, current: bool) -> bool:
    raw = input(f"{label} [{'Y' if current else 'N'}] (y/n): ").strip().lower()
    if not raw:
        return current
    return raw.startswith("y")
