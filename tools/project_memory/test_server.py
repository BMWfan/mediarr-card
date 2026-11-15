"""Offline unit tests for the isolated memory spike."""
import importlib.util
import os
from pathlib import Path
import tempfile
import unittest

SPEC = importlib.util.spec_from_file_location("project_memory", Path(__file__).with_name("server.py"))
memory = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(memory)


class MemoryTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        os.environ["PROJECT_MEMORY_DIR"] = self.temp.name

    def tearDown(self):
        os.environ.pop("PROJECT_MEMORY_DIR", None)
        self.temp.cleanup()

    def test_persistence_recall_dedup_and_invalidation(self):
        source = "https://github.com/BMWfan/mediarr-card/issues/39"
        first = memory.add("Plex fullscreen overlay uses a shared renderer", source)
        again = memory.add("Plex fullscreen overlay uses a shared renderer", source)
        self.assertEqual(first["id"], again["id"])
        self.assertEqual(len(memory.recall("Plex overlay")["memories"]), 1)
        self.assertTrue(memory.invalidate(first["id"])["invalidated"])
        self.assertEqual(memory.recall("Plex overlay")["memories"], [])

    def test_repository_source_boundary_and_secrets(self):
        with self.assertRaises(ValueError):
            memory.add("other repo", "https://github.com/BMWfan/paperless-ai/issues/1")
        with self.assertRaises(ValueError):
            memory.add("api_key=abcdef123456", "local-test:fixture")

    def test_mcp_handshake(self):
        self.assertEqual(memory.handle({"method": "initialize"})["serverInfo"]["name"], memory.SERVER)
        self.assertEqual(len(memory.handle({"method": "tools/list"})["tools"]), 3)


if __name__ == "__main__":
    unittest.main()
