import unittest

from spc.config import GameConfig
from spc.device import build_device_profile
from spc.world import World


class WorldTests(unittest.TestCase):
    def test_default_world_is_5000_square(self) -> None:
        config = GameConfig()
        self.assertEqual(config.world_width, 5_000)
        self.assertEqual(config.world_height, 5_000)
        self.assertEqual(config.max_population, 100)

    def test_chunk_generation_is_deterministic(self) -> None:
        config = GameConfig()
        profile = build_device_profile()
        world_a = World(config, profile)
        world_b = World(config, profile)
        chunk_a = world_a.get_chunk(10, 12)
        chunk_b = world_b.get_chunk(10, 12)
        self.assertEqual(chunk_a.biome_id, chunk_b.biome_id)
        self.assertEqual(chunk_a.tiles[3][4].fertility, chunk_b.tiles[3][4].fertility)
        self.assertEqual(chunk_a.tiles[3][4].feature, chunk_b.tiles[3][4].feature)

    def test_chunk_tiles_can_mix_biomes(self) -> None:
        config = GameConfig()
        world = World(config, build_device_profile())
        chunk = world.get_chunk(10, 12)
        biome_ids = {tile.biome_id for row in chunk.tiles for tile in row}
        self.assertGreater(len(biome_ids), 1)

    def test_active_chunks_are_chunk_scoped(self) -> None:
        config = GameConfig()
        profile = build_device_profile()
        world = World(config, profile)
        chunks = world.active_chunks(2_500, 2_500, 50, 40)
        self.assertLess(len(chunks), 100)
        self.assertGreater(len(chunks), 0)

    def test_tile_inspection_returns_verbose_metadata(self) -> None:
        config = GameConfig()
        profile = build_device_profile()
        world = World(config, profile)
        info = world.inspect_tile(12, 18)
        self.assertIn("biome", info)
        self.assertIn("component_label", info)
        self.assertIn("feature", info)
        self.assertIn("hazard", info)

    def test_chunk_generates_props(self) -> None:
        config = GameConfig()
        profile = build_device_profile()
        world = World(config, profile)
        chunk = world.get_chunk(10, 10)
        self.assertTrue(any(item["type"] in {"house", "food_bush"} for item in chunk.structures))

    def test_add_structure_near_marks_chunk_mutated(self) -> None:
        config = GameConfig()
        profile = build_device_profile()
        world = World(config, profile)
        self.assertTrue(world.add_structure_near(50_000, 50_000, "house", "tribal house"))

    def test_food_bushes_are_finite_and_regrow(self) -> None:
        config = GameConfig()
        world = World(config, build_device_profile())
        chunk = world.get_chunk(10, 10)
        bush = next(item for item in chunk.structures if item["type"] == "food_bush")
        start = bush["food"]
        harvested = world.harvest_food_near(bush["x"], bush["y"], radius=0, amount=1.0)
        self.assertGreater(harvested, 0.0)
        self.assertLess(bush["food"], start)
        depleted = bush["food"]
        world.update_resources(1.0, {(chunk.chunk_x, chunk.chunk_y)})
        self.assertGreater(bush["food"], depleted)

    def test_food_regrowth_respects_growth_modifier(self) -> None:
        config = GameConfig()
        world = World(config, build_device_profile())
        chunk = world.get_chunk(10, 10)
        bush = next(item for item in chunk.structures if item["type"] == "food_bush")
        world.harvest_food_near(bush["x"], bush["y"], radius=0, amount=2.0)
        depleted = bush["food"]
        world.update_resources(1.0, {(chunk.chunk_x, chunk.chunk_y)}, growth_modifier=0.0)
        self.assertEqual(bush["food"], depleted)


if __name__ == "__main__":
    unittest.main()
