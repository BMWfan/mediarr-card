"""Regression checks for confirmed protocol and source-boundary defects."""
import json
from pathlib import Path
import subprocess
import sys
import test_server
import unittest


class ProtocolSecurityTests(unittest.TestCase):
    setUp = test_server.MemoryTests.setUp
    tearDown = test_server.MemoryTests.tearDown

    def test_malformed_input_keeps_server_alive(self):
        messages = 'not-json\n' + json.dumps({'jsonrpc': '2.0', 'id': 7, 'method': 'ping'}) + '\n'
        result = subprocess.run([sys.executable, str(Path(__file__).with_name('server.py'))],
                                input=messages, text=True, capture_output=True, timeout=10)
        self.assertEqual(result.returncode, 0, result.stderr)
        replies = [json.loads(line) for line in result.stdout.splitlines()]
        self.assertEqual(replies[0]['error']['code'], -32700)
        self.assertEqual(replies[1], {'jsonrpc': '2.0', 'id': 7, 'result': {}})

    def test_source_traversal_and_sensitive_metadata(self):
        for source in ['https://github.com/BMWfan/mediarr-card/../other/issues/1',
                       'https://github.com/BMWfan/mediarr-card/%2e%2e/other',
                       'local-test:api_key=synthetic',
                       'https://github.com/BMWfan/mediarr-card/issues/39?secret=synthetic']:
            with self.subTest(source=source), self.assertRaises(ValueError):
                test_server.memory.add('synthetic boundary fixture', source)

    def test_encoded_backslash_source_is_rejected(self):
        for encoded in ('%5c', '%5C'):
            with self.subTest(encoded=encoded), self.assertRaises(ValueError):
                test_server.memory.add('synthetic encoded separator fixture',
                    'https://github.com/BMWfan/mediarr-card/' + encoded + '..' + encoded + 'other/issues/1')
