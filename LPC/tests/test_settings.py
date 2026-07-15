import json
import tempfile
import unittest
from pathlib import Path

from spc.config import GameConfig
from spc.game import should_open_settings
from spc.settings import RuntimeSettings, load_runtime_settings, save_runtime_settings


class SettingsTests(unittest.TestCase):
    def test_settings_roundtrip(self) -> None:
        settings = RuntimeSettings(ai_backend="ollama", ai_model="qwen2.5:3b", screen_width=1280)
        with tempfile.TemporaryDirectory() as tmpdir:
            path = Path(tmpdir) / "settings.json"
            save_runtime_settings(path, settings)
            loaded = load_runtime_settings(path)
            self.assertEqual(loaded.ai_backend, "ollama")
            self.assertEqual(loaded.ai_model, "qwen2.5:3b")
            self.assertEqual(loaded.screen_width, 1280)

    def test_should_skip_settings_when_file_exists(self) -> None:
        with tempfile.TemporaryDirectory() as tmpdir:
            config = GameConfig()
            config.settings_path = Path(tmpdir) / "spc_settings.json"
            save_runtime_settings(config.settings_path, RuntimeSettings())
            self.assertFalse(should_open_settings(config, []))


if __name__ == "__main__":
    unittest.main()
