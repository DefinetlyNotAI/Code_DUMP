import unittest
from unittest.mock import Mock, patch

from spc.settings import probe_ollama


class ProbeTests(unittest.TestCase):
    @patch("spc.settings.requests.get")
    def test_probe_ollama_reads_models(self, mock_get: Mock) -> None:
        response = Mock()
        response.json.return_value = {"models": [{"name": "gemma3:4b"}, {"name": "phi3.5:latest"}]}
        response.raise_for_status.return_value = None
        mock_get.return_value = response
        probe = probe_ollama("http://localhost:11434")
        self.assertTrue(probe.ok)
        self.assertEqual(probe.models, ["gemma3:4b", "phi3.5:latest"])


if __name__ == "__main__":
    unittest.main()
