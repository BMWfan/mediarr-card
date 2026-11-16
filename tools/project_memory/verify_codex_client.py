"""Offline actual Codex app-server MCP probe; never starts a model turn."""
import json
import os
from pathlib import Path
import select
import signal
import subprocess
import sys


def run(home):
    proc = subprocess.Popen(['codex', 'app-server'], env={**os.environ, 'CODEX_HOME': home},
                            stdin=subprocess.PIPE, stdout=subprocess.PIPE, stderr=subprocess.DEVNULL,
                            text=True, bufsize=1, start_new_session=True)
    seq = 0

    def rpc(method, params):
        nonlocal seq
        seq += 1
        proc.stdin.write(json.dumps({'id': seq, 'method': method, 'params': params}) + '\n')
        proc.stdin.flush()
        while True:
            if not select.select([proc.stdout], [], [], 30)[0]:
                raise TimeoutError(method)
            line = proc.stdout.readline()
            if not line:
                raise RuntimeError('app-server exited')
            response = json.loads(line)
            if response.get('id') == seq:
                print(json.dumps({'method': method, 'response': response}), flush=True)
                if 'error' in response:
                    raise RuntimeError(response['error'])
                return response['result']

    try:
        rpc('initialize', {'clientInfo': {'name': 'synthetic-memory-probe', 'version': '1'},
                           'capabilities': {'experimentalApi': True}})
        proc.stdin.write('{"method":"initialized"}\n')
        proc.stdin.flush()
        rpc('mcpServerStatus/list', {'serverName': 'project_memory'})
        thread = rpc('thread/start', {'cwd': str(Path(__file__).resolve().parents[2]), 'ephemeral': True})
        tid = thread['thread']['id']
        def call(tool, arguments):
            return rpc('mcpServer/tool/call', {'threadId': tid, 'server': 'project_memory',
                                              'tool': tool, 'arguments': arguments})
        call('memory_recall', {'query': 'synthetic restart fixture'})
        if len(sys.argv) > 2 and sys.argv[2] == 'invalidate':
            call('memory_invalidate', {'id': '724c3aaae23dac679c30fff6'})
            call('memory_recall', {'query': 'synthetic restart fixture'})
            return
        result = call('memory_record', {'content': 'synthetic restart fixture uses offline storage',
                                        'source': 'local-test:codex-client'})
        call('memory_recall', {'query': 'synthetic restart fixture'})
        return result
    finally:
        os.killpg(proc.pid, signal.SIGKILL)
        proc.wait(timeout=10)


if __name__ == '__main__':
    run(sys.argv[1])
