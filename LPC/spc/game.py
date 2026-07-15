from __future__ import annotations

import sys
from dataclasses import dataclass

import pygame
from rich.console import Console

from .config import GameConfig
from .device import build_device_profile
from .divine import DivineLedger
from .mind import LlamaCppAdapter, NullMindAdapter, OllamaAdapter
from .npc import NpcManager
from .save import load_game, save_game
from .settings import RuntimeSettings, configure_runtime_settings, load_runtime_settings
from .types import EventKind, NpcState
from .world import World


EVENT_KINDS: list[EventKind] = ["miracle", "storm", "fertility", "corruption", "abundance", "plague", "quake"]
console = Console()


@dataclass(slots=True)
class SessionState:
    config: GameConfig
    camera_x: int
    camera_y: int
    year: float = 0.0
    speed_multiplier: float = 1.0
    input_mode: str = "single"
    omen_text: str = ""
    selected_npc_id: int | None = None
    debug_overlay: bool = False
    indirect_kind_index: int = 0
    status_line: str = "SPC initialized."
    render_cache: dict[tuple[int, int], tuple[tuple[float, float], pygame.Surface]] | None = None
    hovered_summary: str = ""
    last_hover_key: tuple[int, int, int, int] | None = None
    last_hover_log_ticks: int = 0
    paused: bool = False
    dragging: bool = False
    drag_start_mouse: tuple[int, int] | None = None
    drag_start_camera: tuple[int, int] | None = None
    mouse_moved_drag: bool = False
    admin_lines: list[str] | None = None
    typing_active: bool = False
    panel_scroll: int = 0


def choose_mind(config: GameConfig, settings: RuntimeSettings):
    if settings.ai_backend == "ollama":
        endpoint = settings.ai_endpoint or "http://localhost:11434"
        if not endpoint.rstrip("/").endswith("/v1"):
            endpoint = endpoint.rstrip("/") + "/v1"
        return OllamaAdapter(
            endpoint=endpoint,
            model=settings.ai_model or "qwen2.5:3b",
            timeout=2.0,
        )
    if settings.ai_backend == "llama_cpp":
        return LlamaCppAdapter(
            endpoint=settings.ai_endpoint or "http://localhost:8080/v1",
            model=settings.ai_model or "Qwen2.5-3B-Instruct",
            timeout=2.0,
        )
    return NullMindAdapter(seed=config.world_seed)


def apply_indirect_effect(world: World, chunk_key: tuple[int, int], event_kind: EventKind) -> None:
    chunk = world.get_chunk(*chunk_key)
    chunk.mutated = True
    if event_kind == "corruption":
        chunk.corruption = min(1.0, chunk.corruption + 0.25)
    elif event_kind == "miracle":
        chunk.blessing = min(1.0, chunk.blessing + 0.25)
    elif event_kind == "abundance":
        chunk.blessing = min(1.0, chunk.blessing + 0.15)
    elif event_kind == "plague":
        chunk.corruption = min(1.0, chunk.corruption + 0.18)
    elif event_kind == "storm":
        chunk.corruption = min(1.0, chunk.corruption + 0.08)
    elif event_kind == "fertility":
        chunk.blessing = min(1.0, chunk.blessing + 0.1)
    elif event_kind == "quake":
        chunk.corruption = min(1.0, chunk.corruption + 0.12)
    for row in chunk.tiles:
        for tile in row:
            if event_kind in {"corruption", "plague", "storm", "quake"}:
                tile.hazard = min(1.0, tile.hazard + 0.05)
                tile.fertility = max(0.0, tile.fertility - 0.04)
            else:
                tile.hazard = max(0.0, tile.hazard - 0.03)
                tile.fertility = min(1.0, tile.fertility + 0.05)


def world_position_from_mouse(state: SessionState, config: GameConfig, mouse_pos: tuple[int, int]) -> tuple[int, int]:
    mx, my = mouse_pos
    world_x = state.camera_x + (mx // config.tile_size)
    world_y = state.camera_y + (my // config.tile_size)
    return world_x, world_y


def zoom_at_mouse(state: SessionState, config: GameConfig, mouse_pos: tuple[int, int], delta: int) -> None:
    sim_rect, _ = dashboard_rects(config)
    old_tile_size = config.tile_size
    new_tile_size = max(6, min(18, old_tile_size + delta))
    if new_tile_size == old_tile_size:
        return
    before_x = state.camera_x + mouse_pos[0] / old_tile_size
    before_y = state.camera_y + mouse_pos[1] / old_tile_size
    config.tile_size = new_tile_size
    screen_tiles_x = max(1, sim_rect.width // config.tile_size)
    screen_tiles_y = max(1, config.screen_height // config.tile_size)
    state.camera_x = max(0, min(config.world_width - screen_tiles_x, round(before_x - mouse_pos[0] / new_tile_size)))
    state.camera_y = max(0, min(config.world_height - screen_tiles_y, round(before_y - mouse_pos[1] / new_tile_size)))
    if state.render_cache is not None:
        state.render_cache.clear()


def draw_text(surface: pygame.Surface, font: pygame.font.Font, text: str, x: int, y: int, color=(235, 235, 235)) -> None:
    surface.blit(font.render(text, True, color), (x, y))


def dashboard_rects(config: GameConfig) -> tuple[pygame.Rect, pygame.Rect]:
    sim_width = int(config.screen_width * 0.8)
    return (
        pygame.Rect(0, 0, sim_width, config.screen_height),
        pygame.Rect(sim_width, 0, config.screen_width - sim_width, config.screen_height),
    )


def pause_button_rect(config: GameConfig) -> pygame.Rect:
    _, panel_rect = dashboard_rects(config)
    return pygame.Rect(panel_rect.x + 14, 14, panel_rect.width - 28, 36)


def log_runtime(message: str) -> None:
    console.log(message)


def dim_color(color: tuple[int, int, int], shift: int) -> tuple[int, int, int]:
    return (
        max(0, min(255, color[0] + shift)),
        max(0, min(255, color[1] + shift)),
        max(0, min(255, color[2] + shift)),
    )


def draw_loading_screen(
    screen: pygame.Surface,
    font: pygame.font.Font,
    small_font: pygame.font.Font,
    progress: float,
    title: str,
    detail: str,
) -> None:
    width, height = screen.get_size()
    screen.fill((14, 19, 26))
    for band in range(12):
        color = (26 + band * 6, 38 + band * 5, 32 + band * 3)
        pygame.draw.rect(screen, color, pygame.Rect(0, height - (band + 1) * 24, width, 24))
    draw_text(screen, font, "SPC: Simulated PC", 36, 38, (238, 241, 226))
    draw_text(screen, font, title, 36, 90, (196, 229, 172))
    draw_text(screen, small_font, detail, 36, 122, (214, 220, 228))
    box = pygame.Rect(36, 168, width - 72, 30)
    pygame.draw.rect(screen, (50, 56, 62), box, border_radius=5)
    fill = pygame.Rect(box.x + 3, box.y + 3, max(0, int((box.width - 6) * max(0.0, min(1.0, progress)))), box.height - 6)
    pygame.draw.rect(screen, (120, 190, 105), fill, border_radius=4)
    draw_text(screen, small_font, f"{int(progress * 100)}%", box.right - 48, box.y + 38, (210, 220, 206))
    pygame.display.flip()


def pump_loading_events() -> None:
    for event in pygame.event.get():
        if event.type == pygame.QUIT:
            raise SystemExit(0)


def warm_visible_world(
    screen: pygame.Surface,
    font: pygame.font.Font,
    small_font: pygame.font.Font,
    config: GameConfig,
    world: World,
    camera_x: int,
    camera_y: int,
) -> dict[tuple[int, int], str]:
    sim_rect, _ = dashboard_rects(config)
    screen_tiles_x = sim_rect.width // config.tile_size
    screen_tiles_y = config.screen_height // config.tile_size
    rect = world.visible_chunk_rect(camera_x, camera_y, screen_tiles_x, screen_tiles_y)
    chunk_keys = [
        (chunk_x, chunk_y)
        for chunk_x in range(rect[0], rect[2] + 1)
        for chunk_y in range(rect[1], rect[3] + 1)
    ]
    total = max(1, len(chunk_keys))
    for index, chunk_key in enumerate(chunk_keys, start=1):
        pump_loading_events()
        world.get_chunk(*chunk_key)
        draw_loading_screen(
            screen,
            font,
            small_font,
            index / total,
            "Generating world...",
            f"Streaming chunk {chunk_key[0]}, {chunk_key[1]}",
        )
    return world.active_chunks(camera_x, camera_y, screen_tiles_x, screen_tiles_y)


def build_chunk_surface(chunk, world: World, tile_size: int) -> pygame.Surface:
    surface = pygame.Surface((world.config.chunk_size * tile_size, world.config.chunk_size * tile_size))
    for local_y, row in enumerate(chunk.tiles):
        for local_x, tile in enumerate(row):
            biome = world.biomes[tile.biome_id]
            color = biome.color
            if chunk.corruption > 0:
                color = (
                    max(0, color[0] - int(chunk.corruption * 45)),
                    max(0, color[1] - int(chunk.corruption * 20)),
                    min(255, color[2] + int(chunk.corruption * 35)),
                )
            if chunk.blessing > 0:
                color = (
                    min(255, color[0] + int(chunk.blessing * 25)),
                    min(255, color[1] + int(chunk.blessing * 30)),
                    min(255, color[2] + int(chunk.blessing * 10)),
                )
            tile_rect = pygame.Rect(local_x * tile_size, local_y * tile_size, tile_size, tile_size)
            pygame.draw.rect(surface, color, tile_rect)
            dark = dim_color(color, -34)
            light = dim_color(color, 24)
            mid = dim_color(color, -10)
            if tile_size >= 8:
                pygame.draw.rect(surface, light, pygame.Rect(tile_rect.x, tile_rect.y, tile_size, 1))
                pygame.draw.rect(surface, dark, pygame.Rect(tile_rect.x, tile_rect.bottom - 1, tile_size, 1))
            match tile.feature:
                case "ridge":
                    pygame.draw.line(surface, light, tile_rect.topleft, tile_rect.bottomright, 1)
                    pygame.draw.line(surface, dark, (tile_rect.x, tile_rect.bottom - 2), (tile_rect.right - 2, tile_rect.y), 1)
                case "grove":
                    pygame.draw.rect(surface, mid, pygame.Rect(tile_rect.x + 1, tile_rect.y + 1, max(1, tile_size // 2), max(1, tile_size // 2)))
                    pygame.draw.rect(surface, light, pygame.Rect(tile_rect.centerx - 1, tile_rect.centery - 1, max(1, tile_size // 3), max(1, tile_size // 3)))
                case "channel":
                    pygame.draw.line(surface, light, (tile_rect.x, tile_rect.centery), (tile_rect.right - 1, tile_rect.centery), max(1, tile_size // 5))
                case "vault":
                    pygame.draw.rect(surface, dark, pygame.Rect(tile_rect.x + 1, tile_rect.y + 1, max(1, tile_size - 3), max(1, tile_size - 3)), 1)
                case "forge":
                    pygame.draw.rect(surface, light, pygame.Rect(tile_rect.centerx - 1, tile_rect.y + 1, max(1, tile_size // 3), max(1, tile_size // 3)))
                    pygame.draw.rect(surface, dark, pygame.Rect(tile_rect.x + 1, tile_rect.centery, max(1, tile_size // 2), max(1, tile_size // 3)))
                case "fault":
                    pygame.draw.line(surface, dark, tile_rect.topleft, tile_rect.bottomright, 1)
                    pygame.draw.line(surface, light, (tile_rect.x + 1, tile_rect.bottom - 1), (tile_rect.right - 1, tile_rect.y + 1), 1)
                case "dust":
                    surface.set_at((tile_rect.x + min(tile_size - 1, 1), tile_rect.y + min(tile_size - 1, 1)), light)
                    surface.set_at((tile_rect.x + min(tile_size - 1, tile_size // 2), tile_rect.y + min(tile_size - 1, tile_size // 2)), dark)
    return surface.convert()


def update_hover_state(state: SessionState, world: World, npcs: NpcManager) -> None:
    mouse_pos = pygame.mouse.get_pos()
    sim_rect, panel_rect = dashboard_rects(state.config)
    if panel_rect.collidepoint(mouse_pos):
        state.hovered_summary = "Metadata panel"
        return
    world_x, world_y = world_position_from_mouse(state, state.config, mouse_pos)
    tile_info = world.inspect_tile(world_x, world_y)
    hovered_npc = npcs.nearest_npc(world_x, world_y, max_distance=1.5)
    hover_key = (
        world_x,
        world_y,
        hovered_npc.npc_id if hovered_npc else -1,
        hash((tile_info["feature"], tile_info["component_key"])),
    )
    if hover_key == state.last_hover_key:
        return
    if hovered_npc is not None:
        summary = (
            f"Hover NPC {hovered_npc.name} | age {hovered_npc.age_years:.1f} | health {hovered_npc.health:.2f} | "
            f"intent {hovered_npc.intent} | chunk {tile_info['chunk']} | biome {tile_info['biome']}"
        )
    elif tile_info["structures"]:
        structure = tile_info["structures"][0]
        summary = (
            f"Hover {structure['type']} | {structure['label']} | tile {tile_info['world']} | chunk {tile_info['chunk']} | "
            f"biome {tile_info['biome']} | feature {tile_info['feature']}"
        )
    else:
        summary = (
            f"Hover tile {tile_info['world']} | chunk {tile_info['chunk']} | biome {tile_info['biome']} | "
            f"component {tile_info['component_label']} [{tile_info['component_key']}] | feature {tile_info['feature']} | "
            f"haz {tile_info['hazard']:.2f} fert {tile_info['fertility']:.2f} elev {tile_info['elevation']:.2f} moist {tile_info['moisture']:.2f}"
        )
    state.hovered_summary = summary
    state.status_line = summary
    state.last_hover_key = hover_key
def should_open_settings(config: GameConfig, argv: list[str] | None = None) -> bool:
    flags = {flag.lower() for flag in (argv if argv is not None else sys.argv[1:])}
    if "-s" in flags or "--settings" in flags:
        return True
    return not config.settings_path.exists()


def run() -> int:
    config = GameConfig()
    open_settings = should_open_settings(config, sys.argv[1:])
    if open_settings:
        settings = configure_runtime_settings(config.settings_path)
    else:
        settings = load_runtime_settings(config.settings_path)
    config.screen_width = settings.screen_width
    config.screen_height = settings.screen_height
    config.tile_size = settings.tile_size
    config.chunk_size = settings.chunk_size
    config.start_population = min(settings.start_population, config.max_population)
    config.base_sim_speed = settings.base_sim_speed

    console.clear()
    log_runtime("SPC runtime console attached.")
    log_runtime(f"Settings file: {config.settings_path}")
    log_runtime(f"Setup menu opened: {open_settings}")
    log_runtime(f"AI backend: {settings.ai_backend} | endpoint: {settings.ai_endpoint} | model: {settings.ai_model or '(none)'}")
    log_runtime(
        f"World config: logical_size={config.world_width}x{config.world_height} chunk_size={config.chunk_size} "
        f"tile_size={config.tile_size} resolution={config.screen_width}x{config.screen_height} population={config.start_population}"
    )

    pygame.init()
    display_info = pygame.display.Info()
    config.screen_width = display_info.current_w
    config.screen_height = display_info.current_h
    screen = pygame.display.set_mode((config.screen_width, config.screen_height), pygame.FULLSCREEN)
    pygame.display.set_caption("SPC: Simulated PC")
    clock = pygame.time.Clock()
    font = pygame.font.SysFont("consolas", 18)
    small_font = pygame.font.SysFont("consolas", 14)
    draw_loading_screen(screen, font, small_font, 0.05, "Bootstrapping renderer...", "Preparing surfaces and runtime")

    pump_loading_events()
    device_profile = build_device_profile()
    log_runtime(f"Device profile built for {device_profile.machine_name} [{device_profile.signature}]")
    draw_loading_screen(screen, font, small_font, 0.15, "Reading host hardware...", f"CPU: {device_profile.cpu_label[:48]}")

    pump_loading_events()
    world = World(config, device_profile)
    draw_loading_screen(screen, font, small_font, 0.3, "Assembling biomes...", f"{len(world.biomes)} biome archetypes linked to host components")
    mind = choose_mind(config, settings)
    log_runtime(f"Mind adapter selected: {type(mind).__name__}")

    pump_loading_events()
    npcs = NpcManager(config, world, mind)
    draw_loading_screen(screen, font, small_font, 0.45, "Growing settlements...", "Spawning initial population")
    npcs.spawn_initial_population()
    log_runtime(f"Initial population spawned: {npcs.living_population()}")
    divine = DivineLedger()
    state = SessionState(
        config=config,
        camera_x=config.world_width // 2 - 30,
        camera_y=config.world_height // 2 - 20,
        status_line=f"World seeded from {device_profile.machine_name} [{device_profile.signature}] | backend={settings.ai_backend}",
        render_cache={},
        admin_lines=[],
    )

    if settings.auto_load_latest and config.auto_save_path.exists():
        try:
            draw_loading_screen(screen, font, small_font, 0.6, "Recovering prior world...", f"Loading {config.auto_save_path}")
            state.year = load_game(config.auto_save_path, world, npcs, divine)
            state.status_line = f"Auto-loaded {config.auto_save_path} | backend={settings.ai_backend}"
            log_runtime(f"Auto-loaded save from {config.auto_save_path}")
        except Exception:
            state.status_line = "Auto-load failed; started fresh."
            log_runtime("Auto-load failed; starting fresh world.")

    warm_visible_world(screen, font, small_font, config, world, state.camera_x, state.camera_y)
    draw_loading_screen(screen, font, small_font, 0.95, "Finalizing chunks...", "Preparing first visible region")
    log_runtime("Initial visible chunks generated.")
    log_runtime(f"Chunk cache primed with {len(world.chunk_cache)} chunks.")

    running = True
    while running:
        dt = clock.tick(60) / 1000.0
        sim_years = dt * (config.base_sim_speed / 3600.0) * state.speed_multiplier
        sim_rect, panel_rect = dashboard_rects(config)
        screen_tiles_x = sim_rect.width // config.tile_size
        screen_tiles_y = config.screen_height // config.tile_size
        active_chunks = world.active_chunks(state.camera_x, state.camera_y, screen_tiles_x, screen_tiles_y)
        if not state.paused:
            state.year += sim_years
            npcs.update(sim_years, active_chunks, divine.events)
            for speech in npcs.consume_recent_speeches():
                log_runtime(speech)
                if state.admin_lines is not None:
                    state.admin_lines.append(speech)
                    state.admin_lines = state.admin_lines[-30:]
        update_hover_state(state, world, npcs)

        for event in pygame.event.get():
            if event.type == pygame.QUIT:
                save_game(config.auto_save_path, state.year, world, npcs, divine)
                log_runtime(f"Auto-saved world to {config.auto_save_path}")
                running = False
            elif event.type == pygame.MOUSEBUTTONDOWN and event.button == 1:
                if pause_button_rect(config).collidepoint(event.pos):
                    state.paused = not state.paused
                    state.status_line = "Simulation paused." if state.paused else "Simulation resumed."
                    log_runtime(state.status_line)
                elif sim_rect.collidepoint(event.pos):
                    state.dragging = True
                    state.mouse_moved_drag = False
                    state.drag_start_mouse = event.pos
                    state.drag_start_camera = (state.camera_x, state.camera_y)
            elif event.type == pygame.MOUSEBUTTONUP and event.button == 1:
                if state.dragging and not state.mouse_moved_drag:
                    wx, wy = world_position_from_mouse(state, config, event.pos)
                    npc = npcs.nearest_npc(wx, wy)
                    if npc is not None:
                        state.selected_npc_id = npc.npc_id
                        state.status_line = f"Selected {npc.name}."
                        log_runtime(f"Selected NPC {npc.name} ({npc.npc_id}) at {npc.x}, {npc.y}")
                state.dragging = False
                state.drag_start_mouse = None
                state.drag_start_camera = None
            elif event.type == pygame.MOUSEBUTTONDOWN and event.button in {4, 5}:
                mouse_pos = pygame.mouse.get_pos()
                if panel_rect.collidepoint(mouse_pos):
                    amount = -42 if event.button == 4 else 42
                    state.panel_scroll = max(0, state.panel_scroll + amount)
                elif sim_rect.collidepoint(mouse_pos):
                    zoom_at_mouse(state, config, mouse_pos, 1 if event.button == 4 else -1)
                    screen_tiles_x = max(1, sim_rect.width // config.tile_size)
                    screen_tiles_y = max(1, config.screen_height // config.tile_size)
            elif event.type == pygame.MOUSEWHEEL:
                mouse_pos = pygame.mouse.get_pos()
                if panel_rect.collidepoint(mouse_pos):
                    state.panel_scroll = max(0, state.panel_scroll - event.y * 42)
                elif sim_rect.collidepoint(mouse_pos):
                    zoom_at_mouse(state, config, mouse_pos, 1 if event.y > 0 else -1)
                    screen_tiles_x = max(1, sim_rect.width // config.tile_size)
                    screen_tiles_y = max(1, config.screen_height // config.tile_size)
            elif event.type == pygame.MOUSEMOTION and state.dragging and state.drag_start_mouse and state.drag_start_camera:
                dx = event.pos[0] - state.drag_start_mouse[0]
                dy = event.pos[1] - state.drag_start_mouse[1]
                if abs(dx) > 2 or abs(dy) > 2:
                    state.mouse_moved_drag = True
                state.camera_x = max(0, min(config.world_width - screen_tiles_x, state.drag_start_camera[0] - dx // config.tile_size))
                state.camera_y = max(0, min(config.world_height - screen_tiles_y, state.drag_start_camera[1] - dy // config.tile_size))
            elif event.type == pygame.KEYDOWN:
                if event.key == pygame.K_ESCAPE:
                    save_game(config.auto_save_path, state.year, world, npcs, divine)
                    log_runtime(f"Auto-saved world to {config.auto_save_path}")
                    running = False
                elif event.key == pygame.K_SPACE and not state.typing_active:
                    state.paused = not state.paused
                    state.status_line = "Simulation paused." if state.paused else "Simulation resumed."
                    log_runtime(state.status_line)
                elif event.key == pygame.K_TAB:
                    state.debug_overlay = not state.debug_overlay
                elif event.key == pygame.K_F1:
                    state.input_mode = "single"
                    state.status_line = "Direct speech mode."
                elif event.key == pygame.K_F2:
                    state.input_mode = "broadcast"
                    state.status_line = "Broadcast omen mode."
                elif event.key == pygame.K_F3:
                    state.input_mode = "indirect"
                    state.indirect_kind_index = (state.indirect_kind_index + 1) % len(EVENT_KINDS)
                    state.status_line = f"Indirect mode: {EVENT_KINDS[state.indirect_kind_index]}."
                elif event.key == pygame.K_s and event.mod & pygame.KMOD_CTRL:
                    save_game(config.save_path, state.year, world, npcs, divine)
                    state.status_line = f"Saved to {config.save_path}."
                    log_runtime(f"Manual save written to {config.save_path}")
                elif event.key == pygame.K_l and event.mod & pygame.KMOD_CTRL and config.save_path.exists():
                    state.year = load_game(config.save_path, world, npcs, divine)
                    if state.render_cache is not None:
                        state.render_cache.clear()
                    state.status_line = f"Loaded {config.save_path}."
                    log_runtime(f"Loaded manual save from {config.save_path}")
                elif event.key == pygame.K_RETURN:
                    message = state.omen_text.strip()
                    if state.input_mode == "single":
                        if state.selected_npc_id is None:
                            state.status_line = "Select an NPC first."
                        elif message:
                            divine.add_direct_message(state.year, state.selected_npc_id, message)
                            state.status_line = "Direct divine message sent."
                            log_runtime(f"Divine whisper sent to NPC {state.selected_npc_id}: {message}")
                            state.omen_text = ""
                    elif state.input_mode == "broadcast":
                        if message:
                            divine.add_broadcast_omen(state.year, message)
                            state.status_line = "Omen broadcast across the world."
                            log_runtime(f"Broadcast omen: {message}")
                            state.omen_text = ""
                    elif state.input_mode == "indirect":
                        kind = EVENT_KINDS[state.indirect_kind_index]
                        center_chunk = world.chunk_coords_for_tile(
                            state.camera_x + screen_tiles_x // 2,
                            state.camera_y + screen_tiles_y // 2,
                        )
                        payload = message or f"A {kind} moves through the land."
                        divine.add_indirect_event(state.year, kind, center_chunk, payload)
                        apply_indirect_effect(world, center_chunk, kind)
                        if state.render_cache is not None:
                            state.render_cache.pop(center_chunk, None)
                        state.status_line = f"Indirect event triggered: {kind}."
                        log_runtime(f"Indirect event {kind} at chunk {center_chunk}: {payload}")
                        state.omen_text = ""
                    state.typing_active = False
                elif event.key == pygame.K_BACKSPACE:
                    state.omen_text = state.omen_text[:-1]
                    state.typing_active = bool(state.omen_text)
                elif event.key == pygame.K_LEFTBRACKET:
                    state.speed_multiplier = max(0.25, state.speed_multiplier / 2.0)
                    log_runtime(f"Simulation speed changed to x{state.speed_multiplier:g}")
                elif event.key == pygame.K_RIGHTBRACKET:
                    state.speed_multiplier = min(16.0, state.speed_multiplier * 2.0)
                    log_runtime(f"Simulation speed changed to x{state.speed_multiplier:g}")
                elif event.unicode and event.unicode.isprintable():
                    state.omen_text += event.unicode
                    state.typing_active = True

        keys = pygame.key.get_pressed()
        move_speed = max(1, int(24 * dt * (1.0 + state.speed_multiplier * 0.1)))
        if not state.typing_active:
            if keys[pygame.K_a] or keys[pygame.K_LEFT]:
                state.camera_x = max(0, state.camera_x - move_speed)
            if keys[pygame.K_d] or keys[pygame.K_RIGHT]:
                state.camera_x = min(config.world_width - screen_tiles_x, state.camera_x + move_speed)
            if keys[pygame.K_w] or keys[pygame.K_UP]:
                state.camera_y = max(0, state.camera_y - move_speed)
            if keys[pygame.K_s] or keys[pygame.K_DOWN]:
                state.camera_y = min(config.world_height - screen_tiles_y, state.camera_y + move_speed)

        render(screen, font, small_font, state, world, npcs, active_chunks, device_profile)
        pygame.display.flip()

    pygame.quit()
    return 0


def wrap_text(font: pygame.font.Font, text: str, max_width: int) -> list[str]:
    words = text.split()
    if not words:
        return [""]
    lines: list[str] = []
    current = words[0]
    for word in words[1:]:
        candidate = f"{current} {word}"
        if font.size(candidate)[0] <= max_width:
            current = candidate
        else:
            lines.append(current)
            current = word
    lines.append(current)
    return lines


def draw_meter(
    surface: pygame.Surface,
    font: pygame.font.Font,
    label: str,
    value: float,
    x: int,
    y: int,
    width: int,
    color: tuple[int, int, int],
) -> None:
    draw_text(surface, font, f"{label:<10} {value:>4.0%}", x, y, (210, 216, 211))
    bar = pygame.Rect(x, y + 17, width, 7)
    pygame.draw.rect(surface, (43, 48, 48), bar, border_radius=3)
    pygame.draw.rect(surface, color, pygame.Rect(bar.x, bar.y, int(bar.width * value), bar.height), border_radius=3)


def draw_metadata_panel(
    screen: pygame.Surface,
    font: pygame.font.Font,
    small_font: pygame.font.Font,
    state: SessionState,
    world: World,
    npcs: NpcManager,
    active_chunks: dict[tuple[int, int], str],
) -> None:
    config = state.config
    sim_rect, panel_rect = dashboard_rects(config)
    pygame.draw.rect(screen, (18, 22, 23), panel_rect)
    pygame.draw.line(screen, (69, 78, 76), panel_rect.topleft, panel_rect.bottomleft, 2)
    x = panel_rect.x + 14
    width = panel_rect.width - 28
    draw_text(screen, font, "SPC LIFE MONITOR", x, 62, (225, 231, 224))

    pause_rect = pause_button_rect(config)
    pygame.draw.rect(screen, (52, 67, 65), pause_rect, border_radius=6)
    pygame.draw.rect(screen, (146, 166, 157), pause_rect, 1, border_radius=6)
    label = "RESUME SIMULATION" if state.paused else "PAUSE SIMULATION"
    label_width = small_font.size(label)[0]
    draw_text(screen, small_font, label, pause_rect.centerx - label_width // 2, pause_rect.y + 10, (235, 239, 234))

    selected = npcs.npcs.get(state.selected_npc_id) if state.selected_npc_id else None
    content_rect = pygame.Rect(panel_rect.x, 94, panel_rect.width, max(40, config.screen_height - 340))
    screen.set_clip(content_rect)
    y = 94 - state.panel_scroll
    if selected is None:
        draw_text(screen, font, "Tribe overview", x, y, (193, 210, 194))
        y += 32
        overview = [
            f"Population: {npcs.living_population()}",
            f"Food: {npcs.tribe_food:.1f}",
            f"Wood: {npcs.tribe_wood:.1f}",
            f"Food pressure: {npcs.resource_pressure.get('food', 0.0):.0%}",
            f"Shelter pressure: {npcs.resource_pressure.get('shelter', 0.0):.0%}",
            f"Ration level: {npcs.resource_pressure.get('ration_level', 1.0):.0%}",
            f"Stores/person: {npcs.resource_pressure.get('stores_per_person', 0.0):.2f}",
            f"Role coverage: {npcs.role_pressure.get('coverage', 1.0):.0%}",
            f"Need G/B/C/S: {npcs.role_pressure.get('gatherer', 0.0):.0%}/{npcs.role_pressure.get('builder', 0.0):.0%}/{npcs.role_pressure.get('caregiver', 0.0):.0%}/{npcs.role_pressure.get('scout', 0.0):.0%}",
            f"Dependents: {npcs.dependency_pressure.get('dependents', 0.0):.1f}",
            f"Care load: {npcs.dependency_pressure.get('care_load', 0.0):.0%}",
            f"Disease risk: {npcs.disease_pressure.get('risk', 0.0):.0%}",
            f"Sick/weakened: {npcs.disease_pressure.get('sick', 0.0):.0f}/{npcs.disease_pressure.get('weakened', 0.0):.0f}",
            f"Crowding: {npcs.disease_pressure.get('crowding', 0.0):.0%}",
            f"Season: {npcs.environment.get('season', 'spring')} | weather: {npcs.environment.get('weather', 'clear')}",
            f"Food growth: {float(npcs.environment.get('food_growth', 1.0)):.2f}x",
            f"Temp stress: {float(npcs.environment.get('temperature_stress', 0.0)):.0%} | rain {float(npcs.environment.get('rainfall', 0.0)):.0%}",
            f"Cohesion: {npcs.culture.get('cohesion', 0.5):.0%}",
            f"Care norm: {npcs.culture.get('care_norm', 0.5):.0%}",
            f"Conflict norm: {npcs.culture.get('conflict_norm', 0.35):.0%}",
            f"Spirituality: {npcs.culture.get('spirituality', 0.45):.0%}",
            f"Scarcity memory: {npcs.culture.get('scarcity_memory', 0.25):.0%}",
            f"Visible chunks: {len(active_chunks)}",
            "Click a person to inspect their inner state.",
        ]
        for line in overview:
            for wrapped in wrap_text(small_font, line, width):
                draw_text(screen, small_font, wrapped, x, y, (202, 210, 203))
                y += 19
    else:
        draw_text(screen, font, selected.name, x, y, (207, 220, 199))
        y += 25
        draw_text(screen, small_font, f"Age {selected.age_years:.1f} | {npcs.life_stage(selected)} | {selected.sex} | {selected.role}", x, y, (205, 211, 204))
        y += 21
        draw_text(screen, small_font, f"Mood: {selected.mood} | intent: {selected.intent.replace('_', ' ')}", x, y, (179, 201, 184))
        y += 20
        draw_text(
            screen,
            small_font,
            f"Goal: {selected.current_goal.replace('_', ' ')} ({selected.goal_progress:.0%})",
            x,
            y,
            (179, 201, 184),
        )
        y += 20
        draw_text(screen, small_font, f"Copes by: {selected.coping_style.replace('_', ' ')} | morale {selected.morale:.0%}", x, y, (179, 201, 184))
        y += 20
        focus = npcs.npcs.get(selected.social_focus_id) if selected.social_focus_id is not None else None
        focus_label = focus.name if focus is not None else "none"
        draw_text(
            screen,
            small_font,
            f"Social: {selected.social_state.replace('_', ' ')} | {selected.attachment_style} | focus {focus_label}",
            x,
            y,
            (179, 201, 184),
        )
        y += 20
        strongest_memory = max(selected.memory_bias.items(), key=lambda item: item[1]) if selected.memory_bias else ("none", 0.0)
        draw_text(
            screen,
            small_font,
            f"Worldview: {selected.worldview} | memory {strongest_memory[0]} {strongest_memory[1]:.0%}",
            x,
            y,
            (179, 201, 184),
        )
        y += 20
        draw_text(
            screen,
            small_font,
            f"Component: {selected.home_component_label[:24]} | attune {selected.component_attunement:.0%} | comm {selected.communication_drive:.0%}",
            x,
            y,
            (179, 201, 184),
        )
        y += 20
        draw_text(
            screen,
            small_font,
            f"Culture cohesion {npcs.culture.get('cohesion', 0.5):.0%} | care {npcs.culture.get('care_norm', 0.5):.0%}",
            x,
            y,
            (179, 201, 184),
        )
        y += 20
        draw_text(
            screen,
            small_font,
            f"Food pressure {npcs.resource_pressure.get('food', 0.0):.0%} | shelter {npcs.resource_pressure.get('shelter', 0.0):.0%}",
            x,
            y,
            (179, 201, 184),
        )
        y += 20
        draw_text(
            screen,
            small_font,
            f"Role pressure G/B/C/S {npcs.role_pressure.get('gatherer', 0.0):.0%}/{npcs.role_pressure.get('builder', 0.0):.0%}/{npcs.role_pressure.get('caregiver', 0.0):.0%}/{npcs.role_pressure.get('scout', 0.0):.0%}",
            x,
            y,
            (179, 201, 184),
        )
        y += 20
        draw_text(
            screen,
            small_font,
            f"Dependents {npcs.dependency_pressure.get('dependents', 0.0):.1f} | care load {npcs.dependency_pressure.get('care_load', 0.0):.0%}",
            x,
            y,
            (179, 201, 184),
        )
        y += 20
        draw_text(
            screen,
            small_font,
            f"Disease risk {npcs.disease_pressure.get('risk', 0.0):.0%} | crowding {npcs.disease_pressure.get('crowding', 0.0):.0%}",
            x,
            y,
            (179, 201, 184),
        )
        y += 20
        draw_text(
            screen,
            small_font,
            f"{str(npcs.environment.get('season', 'spring')).title()} / {npcs.environment.get('weather', 'clear')} | growth {float(npcs.environment.get('food_growth', 1.0)):.2f}x",
            x,
            y,
            (179, 201, 184),
        )
        y += 20
        draw_text(
            screen,
            small_font,
            f"Routine: {selected.routine_phase.replace('_', ' ')} | energy {selected.energy:.0%}",
            x,
            y,
            (179, 201, 184),
        )
        y += 20
        draw_text(
            screen,
            small_font,
            f"Social pull {selected.social_preference:.0%} | space {selected.personal_space:.1f} tiles",
            x,
            y,
            (179, 201, 184),
        )
        y += 20
        draw_text(
            screen,
            small_font,
            f"Condition: {selected.health_condition} | comfort {selected.comfort:.0%}",
            x,
            y,
            (179, 201, 184),
        )
        y += 20
        draw_text(
            screen,
            small_font,
            f"Exposure {selected.exposure:.0%} | injury {selected.injury:.0%} | immunity {selected.immunity:.0%}",
            x,
            y,
            (179, 201, 184),
        )
        y += 20
        draw_text(
            screen,
            small_font,
            f"Trauma {selected.trauma:.0%} | resil {selected.resilience:.0%} | rep {selected.reputation:+.2f}",
            x,
            y,
            (179, 201, 184),
        )
        y += 20
        draw_text(
            screen,
            small_font,
            f"Status {selected.status:+.2f} | leadership {selected.leadership:.0%} | resent {selected.resentment:.0%}",
            x,
            y,
            (179, 201, 184),
        )
        y += 20
        draw_text(
            screen,
            small_font,
            f"Gratitude {selected.gratitude:.0%} | event weight {selected.recent_event_weight:.0%}",
            x,
            y,
            (179, 201, 184),
        )
        y += 20
        draw_text(
            screen,
            small_font,
            f"Welfare food {selected.nutrition:.0%} | sleep debt {selected.sleep_debt:.0%}",
            x,
            y,
            (179, 201, 184),
        )
        y += 20
        if npcs.life_stage(selected) in {"infant", "child"}:
            draw_text(
                screen,
                small_font,
                f"Childhood secure {selected.childhood_security:.0%} | attach {selected.parental_attachment:.0%} | pressure {selected.developmental_pressure:.0%}",
                x,
                y,
                (179, 201, 184),
            )
            y += 20
        draw_text(
            screen,
            small_font,
            f"Shelter security {selected.shelter_security:.0%} | household {selected.household_stability:.0%}",
            x,
            y,
            (179, 201, 184),
        )
        y += 20
        draw_text(
            screen,
            small_font,
            f"Carrying food {selected.inventory.get('food', 0.0):.2f} | wood {selected.inventory.get('wood', 0.0):.2f}",
            x,
            y,
            (179, 201, 184),
        )
        y += 28
        draw_text(screen, small_font, "EMOTIONS", x, y, (151, 178, 160))
        y += 22
        emotion_colors = {
            "joy": (102, 157, 105),
            "sadness": (91, 127, 153),
            "fear": (129, 119, 145),
            "anger": (147, 98, 87),
            "loneliness": (105, 116, 136),
            "stress": (151, 131, 91),
            "trust": (92, 151, 137),
        }
        meter_width = max(60, width - 116)
        emotion_names = (
            ("joy", "fear", "loneliness", "stress", "trust")
            if config.screen_height < 900
            else ("joy", "sadness", "fear", "anger", "loneliness", "stress", "trust")
        )
        for name in emotion_names:
            draw_meter(screen, small_font, name, selected.emotions.get(name, 0.0), x, y, meter_width, emotion_colors[name])
            y += 31
        draw_text(screen, small_font, "UNMET NEEDS", x, y, (151, 178, 160))
        y += 22
        need_names = (
            ("belonging", "safety", "shelter", "purpose")
            if config.screen_height < 900
            else ("belonging", "safety", "shelter", "purpose", "rest")
        )
        for name in need_names:
            draw_meter(screen, small_font, name, selected.needs.get(name, 0.0), x, y, meter_width, (126, 145, 107))
            y += 31

        if y < config.screen_height - 250 + state.panel_scroll:
            draw_text(screen, small_font, "VALUES", x, y, (151, 178, 160))
            y += 21
            top_values = sorted(selected.values.items(), key=lambda item: item[1], reverse=True)[:3]
            for name, value in top_values:
                draw_text(screen, small_font, f"{name}: {value:.0%}", x, y, (195, 205, 196))
                y += 18

        draw_text(screen, small_font, "SOCIAL / MEMORY", x, y, (151, 178, 160))
        y += 21
        strongest = sorted(selected.relationships, key=lambda edge: edge.affinity, reverse=True)[:2]
        if strongest:
            for edge in strongest:
                other = npcs.npcs.get(edge.npc_id)
                label = other.name if other else f"NPC {edge.npc_id}"
                draw_text(screen, small_font, f"{edge.label}: {label} ({edge.affinity:+.2f})", x, y, (195, 205, 196))
                y += 18
        elif y < config.screen_height - 250 + state.panel_scroll:
            draw_text(screen, small_font, "No established bonds yet.", x, y, (169, 179, 171))
            y += 18
        if selected.life_events and y < config.screen_height - 250 + state.panel_scroll:
            for line in wrap_text(small_font, selected.life_events[-1], width):
                draw_text(screen, small_font, line, x, y, (181, 190, 183))
                y += 17

    state.panel_scroll = min(state.panel_scroll, max(0, y + state.panel_scroll - content_rect.bottom + 20))
    screen.set_clip(None)
    log_y = config.screen_height - 235
    pygame.draw.rect(screen, (18, 22, 23), pygame.Rect(panel_rect.x, log_y - 8, panel_rect.width, config.screen_height - log_y + 8))
    draw_text(screen, small_font, "RECENT SPEECH / EVENTS", x, log_y, (151, 178, 160))
    log_y += 22
    available_lines = max(2, (config.screen_height - log_y - 80) // 18)
    log_lines: list[str] = []
    for entry in (state.admin_lines or [])[-8:]:
        log_lines.extend(wrap_text(small_font, entry, width))
    for line in log_lines[-available_lines:]:
        draw_text(screen, small_font, line, x, log_y, (195, 205, 196))
        log_y += 18

    controls_y = config.screen_height - 67
    pygame.draw.line(screen, (59, 68, 66), (x, controls_y - 8), (panel_rect.right - 14, controls_y - 8))
    draw_text(screen, small_font, "Sim: drag pan, wheel zoom | Panel: wheel scroll", x, controls_y, (159, 173, 164))
    draw_text(screen, small_font, "F1 whisper | F2 omen | F3 event type | Enter apply", x, controls_y + 20, (159, 173, 164))


def render(
    screen: pygame.Surface,
    font: pygame.font.Font,
    small_font: pygame.font.Font,
    state: SessionState,
    world: World,
    npcs: NpcManager,
    active_chunks: dict[tuple[int, int], str],
    device_profile,
) -> None:
    screen.fill((15, 18, 19))
    config = state.config
    sim_rect, _ = dashboard_rects(config)
    screen.set_clip(sim_rect)

    for (chunk_x, chunk_y), _lod in active_chunks.items():
        chunk = world.get_chunk(chunk_x, chunk_y)
        signature = (round(chunk.corruption, 3), round(chunk.blessing, 3))
        cached = state.render_cache.get((chunk_x, chunk_y)) if state.render_cache is not None else None
        if cached is None or cached[0] != signature:
            surface = build_chunk_surface(chunk, world, config.tile_size)
            if state.render_cache is not None:
                state.render_cache[(chunk_x, chunk_y)] = (signature, surface)
        else:
            surface = cached[1]
        screen.blit(
            surface,
            (
                (chunk_x * config.chunk_size - state.camera_x) * config.tile_size,
                (chunk_y * config.chunk_size - state.camera_y) * config.tile_size,
            ),
        )

    for chunk_x, chunk_y in active_chunks:
        for structure in world.get_chunk(chunk_x, chunk_y).structures:
            sx = (structure["x"] - state.camera_x) * config.tile_size
            sy = (structure["y"] - state.camera_y) * config.tile_size
            if not sim_rect.inflate(20, 20).collidepoint(sx, sy):
                continue
            if structure["type"] == "house":
                pygame.draw.rect(screen, (128, 96, 72), pygame.Rect(sx - 5, sy - 7, 12, 9))
                pygame.draw.polygon(screen, (102, 78, 58), [(sx - 6, sy - 7), (sx + 1, sy - 13), (sx + 8, sy - 7)])
            elif structure["type"] == "food_bush":
                fullness = min(1.0, float(structure.get("food", structure.get("max_food", 5.0))) / max(0.1, float(structure.get("max_food", 5.0))))
                base = (50 + int(25 * fullness), 88 + int(62 * fullness), 56 + int(25 * fullness))
                pygame.draw.circle(screen, base, (sx + 1, sy - 1), 4)
                if fullness > 0.25:
                    pygame.draw.circle(screen, (79, 148, 84), (sx - 1, sy - 2), 3)

    for npc in npcs.npcs.values():
        if not npc.alive:
            continue
        sx = (npc.x - state.camera_x) * config.tile_size
        sy = (npc.y - state.camera_y) * config.tile_size
        if not sim_rect.inflate(30, 30).collidepoint(sx, sy):
            continue
        mood_colors = {
            "joyful": (192, 217, 179),
            "sad": (163, 180, 190),
            "afraid": (182, 174, 195),
            "angry": (194, 166, 151),
            "lonely": (174, 181, 193),
            "stressed": (195, 184, 157),
            "content": (205, 207, 184),
            "calm": (205, 197, 181),
        }
        color = mood_colors.get(npc.mood, (205, 197, 181))
        body_rect = pygame.Rect(
            sx - max(3, config.tile_size // 2),
            sy - int(config.tile_size * 1.4),
            max(8, config.tile_size + 2),
            max(12, config.tile_size + 7),
        )
        pygame.draw.rect(screen, color, body_rect, border_radius=3)
        pygame.draw.rect(screen, (78, 62, 49), pygame.Rect(body_rect.x + 1, body_rect.y + 1, body_rect.width - 2, max(2, body_rect.height // 3)), border_radius=3)
        if npc.npc_id == state.selected_npc_id:
            pygame.draw.rect(screen, (245, 248, 239), body_rect.inflate(5, 5), 2, border_radius=4)
        if 0.0 <= npc.age_years - npc.last_dialogue_year < 0.025 and npc.speech_buffer:
            lines = wrap_text(small_font, npc.speech_buffer[-1], 210)[:3]
            bubble_width = max(small_font.size(line)[0] for line in lines) + 16
            bubble_height = len(lines) * 17 + 10
            bubble_x = max(4, min(sim_rect.right - bubble_width - 4, sx - bubble_width // 2))
            bubble_rect = pygame.Rect(bubble_x, sy - body_rect.height - bubble_height - 8, bubble_width, bubble_height)
            pygame.draw.rect(screen, (248, 247, 240), bubble_rect, border_radius=8)
            pygame.draw.rect(screen, (50, 50, 52), bubble_rect, 1, border_radius=8)
            for index, line in enumerate(lines):
                draw_text(screen, small_font, line, bubble_rect.x + 8, bubble_rect.y + 5 + index * 17, (30, 30, 34))

    overlay = pygame.Surface((sim_rect.width, 154), pygame.SRCALPHA)
    overlay.fill((10, 10, 12, 215))
    screen.blit(overlay, (0, config.screen_height - 154))
    current_chunk = world.chunk_coords_for_tile(
        state.camera_x + (sim_rect.width // config.tile_size) // 2,
        state.camera_y + (config.screen_height // config.tile_size) // 2,
    )
    chunk = world.get_chunk(*current_chunk)
    mode_label = {
        "single": "Direct speech",
        "broadcast": "Broadcast omen",
        "indirect": f"Indirect event [{EVENT_KINDS[state.indirect_kind_index]}]",
    }[state.input_mode]
    draw_text(screen, font, f"Year {state.year:06.2f} | Pop {npcs.living_population()} | x{state.speed_multiplier:g} | {'PAUSED' if state.paused else 'RUNNING'}", 12, config.screen_height - 146)
    draw_text(screen, small_font, f"Chunk {current_chunk} | {chunk.lore_name} | tile zoom {config.tile_size}", 12, config.screen_height - 118)
    draw_text(screen, small_font, f"Mode: {mode_label}", 12, config.screen_height - 95)
    draw_text(screen, small_font, f"Command: {state.omen_text or '_'}", 12, config.screen_height - 72, (238, 230, 190))
    draw_text(screen, small_font, state.status_line[:120], 12, config.screen_height - 48, (183, 216, 255))
    draw_text(screen, small_font, f"Food {npcs.tribe_food:.1f} | Wood {npcs.tribe_wood:.1f} | {device_profile.gpu_label[:36]}", 12, config.screen_height - 25, (198, 211, 195))

    screen.set_clip(None)
    draw_metadata_panel(screen, font, small_font, state, world, npcs, active_chunks)


def main() -> None:
    raise SystemExit(run())
