# Verification — SPEC-039

## Commands and results
- Proposed: `python -m unittest discover -s tools/project_memory -p 'test_*.py' -v`.
- **Not executed successfully.** Attempted to clone the feature branch into the isolated test container, but DNS resolution of github.com failed (`Could not resolve host: github.com`). Consequently no unittest or runtime MCP handshake passed; no test pass is claimed.

## Manual checks
- MCP stdio initialize, tools/list, tools/call: pending.
- Persistence across process restart: pending.
- Cloud Codex agent MCP access: pending; documentation alone is insufficient.

## Coverage gaps and limitations
- Prototype uses keyword overlap, not semantic embeddings; token estimate is not measured usage.
- No session observer, auto-curation, remote persistence, authentication or full prompt-injection/secret protection.
- No HA UI/backend changes; existing HA/browser suite not run for this isolated tooling spike.
- Do not merge until security and functional findings are addressed, tests run and owner explicitly approves.

## AI review — initial findings

- **Fixed:** secret-detection regex contained escaped backslashes, making expected credential matches fail. Corrected in commit `102bda9`.
- **Open, high:** source URL validation is not sufficient authentication/provenance; MCP clients can submit arbitrary purported facts. Restrict write permissions and mark content as untrusted before rollout.
- **Open, high:** no full secret scanning; do not ingest production data or external issue text automatically.
- **Open, medium:** MCP JSON-RPC interoperability needs actual client tests, including protocol framing/version and error handling.
- **Open, medium:** persistence, duplicate behavior and token estimates need runtime verification.
- **Open, design:** semantic retrieval and cloud Codex integration are not implemented; keyword overlap is explicitly only a spike.

**Review disposition:** do not merge. Continue with reproducible tests and a real Codex cloud compatibility gate.

## 2026-11-15 — isolated local verification

The exact Python source text fetched through the GitHub connector was reproduced in an isolated local container (direct `git clone` unavailable due to DNS failure). Tests therefore verify the fetched source copy, **not** a GitHub Actions runner or a live Codex cloud environment.

Command: `python -m unittest discover -s tools/project_memory -p 'test_*.py' -v`

Result: **3 tests passed, 0 failed** (0.013 s):
- `test_mcp_handshake` — OK
- `test_persistence_recall_dedup_and_invalidation` — OK
- `test_repository_source_boundary_and_secrets` — OK

Additional subprocess integration test: launched `server.py` with newline-delimited JSON-RPC initialize, tools/list, memory_record, memory_recall; received four responses, listed three tools, and recalled the stored synthetic decision. Restarted the Python process using the same temporary data directory and recalled one persisted memory. **Passed**.

### Remaining gates
- Real MCP client compatibility (Codex local/cloud): **not executed**.
- Authentication, robust secret scanning, prompt-injection handling, concurrent writes and repo-isolation under hostile input: **not established**.
- Semantic search, automatic memory creation, total-token savings: **not implemented/measured**.
- Do not merge or release without explicit owner approval.



## 2026-11-15 — actual Codex MCP client in the selected cloud workspace

### Specify / Clarify / Plan / Tasks / Analyze
Read AGENTS.md, .github/SDD-LIGHT.md and all four SPEC-039 documents before execution; checked Issue #39 and existing Draft PR #40. User authorizes integration verification and confirmed fixes, synthetic data only, no paid API, CI/release changes, merge or release. Existing M scope retained. Plan extension: use installed Codex app-server's direct MCP endpoints without starting a model turn; test process persistence; assess independent-session provisioning separately; fix demonstrated input-boundary defects and rerun tests.

### Environment and provenance
- Selected managed cloud runtime, provider `cloud`, Debian 13 / Python 3.12; installed `codex-cli 0.167.0-alpha.4`.
- This is **not evidence of a GitHub-hosted Codex coding-agent job**. Local app-server threads report environmentId `local` inside this cloud workspace.
- Empty initial /workspace; no existing checkout. Files fetched verbatim using GitHub connector from branch `spike/39-project-memory-poc`, head `96d71545ed2261ed366d88fa2cda2ab5019e914d`. This tests a fetched source snapshot, not a complete git clone. Updates are applied only to that remote branch via GitHub API.
- Actual git transport failure: `fatal: unable to access 'https://github.com/BMWfan/mediarr-card.git/': Failed to connect to proxy port 8080 after 0 ms: Could not connect to server`.
- Cloud status reports unrestricted network; that report does not override the observed shell proxy failure.

### Reproduction (no model or paid API calls)
Generate installed protocol schema: `codex app-server generate-json-schema --out /tmp/memory-schema` (exit 0). It exposes `mcpServerStatus/list` and `mcpServer/tool/call`. The probe sends app-server RPC, **not fabricated server responses or direct memory-server JSON-RPC**. Codex itself starts the stdio server, negotiates MCP and invokes tools. No `turn/start` is sent. Temporary CODEX_HOME avoids touching existing credentials/configuration.

Create `/tmp/memory-codex-home/config.toml`:
```toml
[mcp_servers.project_memory]
command = "python"
args = ["/workspace/mediarr-card/tools/project_memory/server.py"]
[mcp_servers.project_memory.env]
PROJECT_MEMORY_DIR = "/tmp/memory-cloud-test"
```
Run from fetched source directory:
```sh
python -m unittest discover -s tools/project_memory -p 'test_*.py' -v
python tools/project_memory/verify_codex_client.py /tmp/memory-codex-home
python tools/project_memory/verify_codex_client.py /tmp/memory-codex-home
python tools/project_memory/verify_codex_client.py /tmp/memory-codex-home invalidate
python tools/project_memory/verify_codex_client.py /tmp/memory-codex-home invalidate
```
Use a fresh temporary data directory for an independent reproduction: repeated record intentionally does not revive an invalidated fact. Probe force-stops its own app-server process group in finally, ensuring subsequent runs start new processes. Initial probe's graceful terminate timed out after successful calls; fixed probe cleanup, subsequent runs all exit 0.

### Actual results
- Baseline existing suite: 3 tests passed in 0.016 s. Final suite: 5 tests passed, exit 0 (full output below).
- Actual Codex client: initialize, tools inventory (all three tools), record and recall pass. Restarted client/server recalled existing fixture **before recording again**.
- Invalidation returns true, immediate recall empty; next fresh app-server/server also recalls empty. This proves process persistence with the same SQLite directory on one machine, **not separate Cloud-session persistence**.
- Complete successful app-server JSON response logs below include thread/start and empty turns; no model turn executed. First run excerpts precede fixes; later logs cover fixed code.

### Separate cloud sessions and future task provisioning — BLOCKED / NOT VERIFIED
This task has one selected environment and no callable interface to launch a second independent GitHub Codex task, attach a durable volume to it, or change that platform's future-task MCP configuration. `/workspace/.codex` is read-only and empty; only temporary CODEX_HOME was configured. Configuring that child CLI does not register tools in this conversation's managed MCP inventory or in future hosted tasks. No second-session success or general platform-wide lack of support is claimed. Process restarts / ephemeral child threads cannot substitute for independent Cloud sessions.

Suitable fallback: keep owner-reviewed project decisions in repository specs, fetch exact branch/revision with the GitHub connector at task start, and propose sourced updates in the existing PR at task end. Connector reads of all four SPEC-039 files and branch writes are exercised in this task; automatic future-task invocation remains unverified. This requires explicit instructions in each task or a separately configured supported environment bootstrap; AGENTS.md and existing CI workflows were not changed. For a configurable local Codex host, use the demonstrated stdio config plus a repository-specific persistent directory; backups, retention and permissions need an operator-owned design before rollout. Do not expose this unauthenticated spike over a network.

### AI security and architecture review
Confirmed fixes:
1. First malformed JSON caused UnboundLocalError and killed server; reset request per line, return parse error -32700 and continue. Regression proves subsequent ping succeeds.
2. Prefix-only provenance allowed repository path traversal and secrets in source metadata. Reject decoded dot segments, backslashes, query/fragment metadata, excessive source length and detectable secrets in source. Regression covers literal/encoded traversal and synthetic credentials. This is a reference boundary, **not authenticated provenance**.
3. Recall previously supplied facts without a trust marker; returned entries now explicitly state untrusted status and require source verification. This is a warning, not complete injection prevention.

Remaining rollout risks: trusted local MCP clients can write/invalidate arbitrary purported facts; no user authentication or role separation. Best-effort regex is not comprehensive secret scanning. Local filesystem access inherits host permissions; no cross-user isolation guarantee. Protocol validation is still minimal, fixed protocol version, generic errors for several invalid requests; only demonstrated Codex version is verified. SQLite transactions and repository filters are used, but hostile multi-client concurrency/load and retention/backup recovery were not tested. Invalidated duplicate records remain invalid (no implicit revival). No semantic retrieval, automatic observation/curation, contradiction resolution or token/quality benchmark. Character token heuristic remains explicitly an estimate. No NetClaw source reused; upstream license audit remains an open gate.

Disposition: **No-Go for automatic production/cloud rollout; retain Draft PR.** Actual installed Codex client compatibility and same-machine process persistence verified. Independent hosted sessions and automatic provisioning remain open. No Mediarr runtime/frontend/backend changes; HA/browser tests unnecessary for this tooling-only change. No CI/release workflow, bundle, paid API, merge or release changes.

### Captured final unit-test output
```text
test_malformed_input_keeps_server_alive (test_protocol_security.ProtocolSecurityTests.test_malformed_input_keeps_server_alive) ... ok
test_source_traversal_and_sensitive_metadata (test_protocol_security.ProtocolSecurityTests.test_source_traversal_and_sensitive_metadata) ... ok
test_mcp_handshake (test_server.MemoryTests.test_mcp_handshake) ... ok
test_persistence_recall_dedup_and_invalidation (test_server.MemoryTests.test_persistence_recall_dedup_and_invalidation) ... ok
test_repository_source_boundary_and_secrets (test_server.MemoryTests.test_repository_source_boundary_and_secrets) ... ok

----------------------------------------------------------------------
Ran 5 tests in 0.041s

OK
```

### Captured actual Codex client responses (successful runs)

#### restart (exit 0)
```jsonl
{"method": "initialize", "response": {"id": 1, "result": {"userAgent": "synthetic-memory-probe/0.167.0-alpha.4 (Debian 13.0.0; x86_64) dumb (synthetic-memory-probe; 1)", "codexHome": "/tmp/memory-codex-home", "platformFamily": "unix", "platformOs": "linux"}}}
{"method": "mcpServerStatus/list", "response": {"id": 2, "result": {"data": [{"name": "project_memory", "runtimeStatus": null, "pluginId": null, "httpOrigin": null, "serverInfo": {"name": "mediarr-project-memory-spike", "title": null, "version": "0.1.0", "description": null, "icons": null, "websiteUrl": null}, "serverCapabilities": {"tools": {}}, "toolListMeta": null, "tools": {"memory_invalidate": {"name": "memory_invalidate", "description": "Invalidate outdated memory", "inputSchema": {"type": "object", "properties": {"id": {"type": "string"}}, "required": ["id"]}}, "memory_recall": {"name": "memory_recall", "description": "Recall repository-scoped memories (keyword-only spike)", "inputSchema": {"type": "object", "properties": {"query": {"type": "string"}, "limit": {"type": "integer"}}, "required": ["query"]}}, "memory_record": {"name": "memory_record", "description": "Record sourced project decision/finding", "inputSchema": {"type": "object", "properties": {"content": {"type": "string"}, "source": {"type": "string"}, "kind": {"type": "string"}}, "required": ["content", "source"]}}}, "toolsError": null, "resources": [], "resourceTemplates": [], "authStatus": "unsupported"}], "nextCursor": null}}}
{"method": "thread/start", "response": {"id": 3, "result": {"thread": {"id": "01a1df41-b7a2-78a3-98a4-02011d1134ab", "environments": [{"environmentId": "local", "cwd": "/workspace/mediarr-card", "runtimeWorkspaceRoots": ["/workspace/mediarr-card"]}], "extra": null, "sessionId": "01a1df41-b7a2-78a3-98a4-02011d1134ab", "forkedFromId": null, "parentThreadId": null, "preview": "", "ephemeral": true, "section": null, "sectionEnteredAt": null, "projectId": null, "historyMode": "paginated", "modelProvider": "openai", "model": "gpt-6.1-sol", "reasoningEffort": null, "createdAt": 1794746988, "updatedAt": 1794746988, "recencyAt": 1794746988, "status": {"type": "idle"}, "path": null, "cwd": "/workspace/mediarr-card", "cliVersion": "0.167.0-alpha.4", "originator": "synthetic-memory-probe", "source": "vscode", "canAcceptDirectInput": true, "threadSource": null, "agentNickname": null, "agentRole": null, "gitInfo": null, "name": null, "daybreakEnabled": null, "turns": []}, "model": "gpt-6.1-sol", "modelProvider": "openai", "serviceTier": null, "disabledPluginIds": [], "cwd": "/workspace/mediarr-card", "runtimeWorkspaceRoots": ["/workspace/mediarr-card"], "instructionSources": [], "approvalPolicy": "on-request", "approvalsReviewer": "user", "sandbox": {"type": "readOnly", "networkAccess": false}, "activePermissionProfile": {"id": ":read-only", "extends": null}, "reasoningEffort": null, "multiAgentMode": "explicitRequestOnly"}}}
{"method": "mcpServer/tool/call", "response": {"id": 4, "result": {"content": [{"type": "text", "text": "{\"repository\": \"BMWfan/mediarr-card\", \"memories\": [{\"id\": \"724c3aaae23dac679c30fff6\", \"kind\": \"decision\", \"content\": \"synthetic restart fixture uses offline storage\", \"source\": \"local-test:codex-client\", \"trust\": \"untrusted; verify source before acting\"}], \"estimated_tokens\": 29, \"method\": \"keyword-overlap (not semantic)\"}"}]}}}
{"method": "mcpServer/tool/call", "response": {"id": 5, "result": {"content": [{"type": "text", "text": "{\"id\": \"724c3aaae23dac679c30fff6\", \"repository\": \"BMWfan/mediarr-card\"}"}]}}}
{"method": "mcpServer/tool/call", "response": {"id": 6, "result": {"content": [{"type": "text", "text": "{\"repository\": \"BMWfan/mediarr-card\", \"memories\": [{\"id\": \"724c3aaae23dac679c30fff6\", \"kind\": \"decision\", \"content\": \"synthetic restart fixture uses offline storage\", \"source\": \"local-test:codex-client\", \"trust\": \"untrusted; verify source before acting\"}], \"estimated_tokens\": 29, \"method\": \"keyword-overlap (not semantic)\"}"}]}}}
```

#### invalidate (exit 0)
```jsonl
{"method": "initialize", "response": {"id": 1, "result": {"userAgent": "synthetic-memory-probe/0.167.0-alpha.4 (Debian 13.0.0; x86_64) dumb (synthetic-memory-probe; 1)", "codexHome": "/tmp/memory-codex-home", "platformFamily": "unix", "platformOs": "linux"}}}
{"method": "mcpServerStatus/list", "response": {"id": 2, "result": {"data": [{"name": "project_memory", "runtimeStatus": null, "pluginId": null, "httpOrigin": null, "serverInfo": {"name": "mediarr-project-memory-spike", "title": null, "version": "0.1.0", "description": null, "icons": null, "websiteUrl": null}, "serverCapabilities": {"tools": {}}, "toolListMeta": null, "tools": {"memory_record": {"name": "memory_record", "description": "Record sourced project decision/finding", "inputSchema": {"type": "object", "properties": {"content": {"type": "string"}, "source": {"type": "string"}, "kind": {"type": "string"}}, "required": ["content", "source"]}}, "memory_recall": {"name": "memory_recall", "description": "Recall repository-scoped memories (keyword-only spike)", "inputSchema": {"type": "object", "properties": {"query": {"type": "string"}, "limit": {"type": "integer"}}, "required": ["query"]}}, "memory_invalidate": {"name": "memory_invalidate", "description": "Invalidate outdated memory", "inputSchema": {"type": "object", "properties": {"id": {"type": "string"}}, "required": ["id"]}}}, "toolsError": null, "resources": [], "resourceTemplates": [], "authStatus": "unsupported"}], "nextCursor": null}}}
{"method": "thread/start", "response": {"id": 3, "result": {"thread": {"id": "01a1df41-f413-7120-bc5c-cc8679468c37", "environments": [{"environmentId": "local", "cwd": "/workspace/mediarr-card", "runtimeWorkspaceRoots": ["/workspace/mediarr-card"]}], "extra": null, "sessionId": "01a1df41-f413-7120-bc5c-cc8679468c37", "forkedFromId": null, "parentThreadId": null, "preview": "", "ephemeral": true, "section": null, "sectionEnteredAt": null, "projectId": null, "historyMode": "paginated", "modelProvider": "openai", "model": "gpt-6.1-sol", "reasoningEffort": null, "createdAt": 1794747003, "updatedAt": 1794747003, "recencyAt": 1794747003, "status": {"type": "idle"}, "path": null, "cwd": "/workspace/mediarr-card", "cliVersion": "0.167.0-alpha.4", "originator": "synthetic-memory-probe", "source": "vscode", "canAcceptDirectInput": true, "threadSource": null, "agentNickname": null, "agentRole": null, "gitInfo": null, "name": null, "daybreakEnabled": null, "turns": []}, "model": "gpt-6.1-sol", "modelProvider": "openai", "serviceTier": null, "disabledPluginIds": [], "cwd": "/workspace/mediarr-card", "runtimeWorkspaceRoots": ["/workspace/mediarr-card"], "instructionSources": [], "approvalPolicy": "on-request", "approvalsReviewer": "user", "sandbox": {"type": "readOnly", "networkAccess": false}, "activePermissionProfile": {"id": ":read-only", "extends": null}, "reasoningEffort": null, "multiAgentMode": "explicitRequestOnly"}}}
{"method": "mcpServer/tool/call", "response": {"id": 4, "result": {"content": [{"type": "text", "text": "{\"repository\": \"BMWfan/mediarr-card\", \"memories\": [{\"id\": \"724c3aaae23dac679c30fff6\", \"kind\": \"decision\", \"content\": \"synthetic restart fixture uses offline storage\", \"source\": \"local-test:codex-client\", \"trust\": \"untrusted; verify source before acting\"}], \"estimated_tokens\": 29, \"method\": \"keyword-overlap (not semantic)\"}"}]}}}
{"method": "mcpServer/tool/call", "response": {"id": 5, "result": {"content": [{"type": "text", "text": "{\"invalidated\": true}"}]}}}
{"method": "mcpServer/tool/call", "response": {"id": 6, "result": {"content": [{"type": "text", "text": "{\"repository\": \"BMWfan/mediarr-card\", \"memories\": [], \"estimated_tokens\": 0, \"method\": \"keyword-overlap (not semantic)\"}"}]}}}
```

#### invalidated-restart (exit 0)
```jsonl
{"method": "initialize", "response": {"id": 1, "result": {"userAgent": "synthetic-memory-probe/0.167.0-alpha.4 (Debian 13.0.0; x86_64) dumb (synthetic-memory-probe; 1)", "codexHome": "/tmp/memory-codex-home", "platformFamily": "unix", "platformOs": "linux"}}}
{"method": "mcpServerStatus/list", "response": {"id": 2, "result": {"data": [{"name": "project_memory", "runtimeStatus": null, "pluginId": null, "httpOrigin": null, "serverInfo": {"name": "mediarr-project-memory-spike", "title": null, "version": "0.1.0", "description": null, "icons": null, "websiteUrl": null}, "serverCapabilities": {"tools": {}}, "toolListMeta": null, "tools": {"memory_record": {"name": "memory_record", "description": "Record sourced project decision/finding", "inputSchema": {"type": "object", "properties": {"content": {"type": "string"}, "source": {"type": "string"}, "kind": {"type": "string"}}, "required": ["content", "source"]}}, "memory_recall": {"name": "memory_recall", "description": "Recall repository-scoped memories (keyword-only spike)", "inputSchema": {"type": "object", "properties": {"query": {"type": "string"}, "limit": {"type": "integer"}}, "required": ["query"]}}, "memory_invalidate": {"name": "memory_invalidate", "description": "Invalidate outdated memory", "inputSchema": {"type": "object", "properties": {"id": {"type": "string"}}, "required": ["id"]}}}, "toolsError": null, "resources": [], "resourceTemplates": [], "authStatus": "unsupported"}], "nextCursor": null}}}
{"method": "thread/start", "response": {"id": 3, "result": {"thread": {"id": "01a1df41-f545-7600-b59a-8130bdd8fcca", "environments": [{"environmentId": "local", "cwd": "/workspace/mediarr-card", "runtimeWorkspaceRoots": ["/workspace/mediarr-card"]}], "extra": null, "sessionId": "01a1df41-f545-7600-b59a-8130bdd8fcca", "forkedFromId": null, "parentThreadId": null, "preview": "", "ephemeral": true, "section": null, "sectionEnteredAt": null, "projectId": null, "historyMode": "paginated", "modelProvider": "openai", "model": "gpt-6.1-sol", "reasoningEffort": null, "createdAt": 1794747004, "updatedAt": 1794747004, "recencyAt": 1794747004, "status": {"type": "idle"}, "path": null, "cwd": "/workspace/mediarr-card", "cliVersion": "0.167.0-alpha.4", "originator": "synthetic-memory-probe", "source": "vscode", "canAcceptDirectInput": true, "threadSource": null, "agentNickname": null, "agentRole": null, "gitInfo": null, "name": null, "daybreakEnabled": null, "turns": []}, "model": "gpt-6.1-sol", "modelProvider": "openai", "serviceTier": null, "disabledPluginIds": [], "cwd": "/workspace/mediarr-card", "runtimeWorkspaceRoots": ["/workspace/mediarr-card"], "instructionSources": [], "approvalPolicy": "on-request", "approvalsReviewer": "user", "sandbox": {"type": "readOnly", "networkAccess": false}, "activePermissionProfile": {"id": ":read-only", "extends": null}, "reasoningEffort": null, "multiAgentMode": "explicitRequestOnly"}}}
{"method": "mcpServer/tool/call", "response": {"id": 4, "result": {"content": [{"type": "text", "text": "{\"repository\": \"BMWfan/mediarr-card\", \"memories\": [], \"estimated_tokens\": 0, \"method\": \"keyword-overlap (not semantic)\"}"}]}}}
{"method": "mcpServer/tool/call", "response": {"id": 5, "result": {"content": [{"type": "text", "text": "{\"invalidated\": true}"}]}}}
{"method": "mcpServer/tool/call", "response": {"id": 6, "result": {"content": [{"type": "text", "text": "{\"repository\": \"BMWfan/mediarr-card\", \"memories\": [], \"estimated_tokens\": 0, \"method\": \"keyword-overlap (not semantic)\"}"}]}}}
```


## 2026-11-15 — resumed selected cloud environment

User resumed the task after the selected environment reported `starting`; wait_for_environment returned `ready`. The environment ID is unchanged (`ccarenv_b64_Y2NhcmVudl9hMTcxODAzODI5NDg4MTkxODE1OWQyOWFhOTliNjc2MA`). Both `/tmp/memory-cloud-test` and `/tmp/memory-codex-home` remained present. This is a resume of the same environment, not a second independent hosted task; no claim is made about machine replacement or durable-volume guarantees.

Ran `python tools/project_memory/verify_codex_client.py /tmp/memory-codex-home invalidate` from `/workspace/mediarr-card`, exit **0**, without a model turn. Fresh actual Codex MCP client discovered all three tools. Initial recall was empty before any mutation, confirming the previously invalidated fixture remains excluded after this environment resume. Subsequent invalidation returned true (the implementation reports matched rows, including already-invalid records); final recall remained empty. Cross-session provisioning and independent-environment persistence remain blocked/unverified as described above. No CI/release changes, paid API, merge or release.

Captured responses:
```jsonl
{"method": "initialize", "response": {"id": 1, "result": {"userAgent": "synthetic-memory-probe/0.167.0-alpha.4 (Debian 13.0.0; x86_64) dumb (synthetic-memory-probe; 1)", "codexHome": "/tmp/memory-codex-home", "platformFamily": "unix", "platformOs": "linux"}}}
{"method": "mcpServerStatus/list", "response": {"id": 2, "result": {"data": [{"name": "project_memory", "runtimeStatus": null, "pluginId": null, "httpOrigin": null, "serverInfo": {"name": "mediarr-project-memory-spike", "title": null, "version": "0.1.0", "description": null, "icons": null, "websiteUrl": null}, "serverCapabilities": {"tools": {}}, "toolListMeta": null, "tools": {"memory_invalidate": {"name": "memory_invalidate", "description": "Invalidate outdated memory", "inputSchema": {"type": "object", "properties": {"id": {"type": "string"}}, "required": ["id"]}}, "memory_record": {"name": "memory_record", "description": "Record sourced project decision/finding", "inputSchema": {"type": "object", "properties": {"content": {"type": "string"}, "source": {"type": "string"}, "kind": {"type": "string"}}, "required": ["content", "source"]}}, "memory_recall": {"name": "memory_recall", "description": "Recall repository-scoped memories (keyword-only spike)", "inputSchema": {"type": "object", "properties": {"query": {"type": "string"}, "limit": {"type": "integer"}}, "required": ["query"]}}}, "toolsError": null, "resources": [], "resourceTemplates": [], "authStatus": "unsupported"}], "nextCursor": null}}}
{"method": "thread/start", "response": {"id": 3, "result": {"thread": {"id": "01a1e0e7-2f73-7b93-bb83-dfaa9307c2fe", "environments": [{"environmentId": "local", "cwd": "/workspace/mediarr-card", "runtimeWorkspaceRoots": ["/workspace/mediarr-card"]}], "extra": null, "sessionId": "01a1e0e7-2f73-7b93-bb83-dfaa9307c2fe", "forkedFromId": null, "parentThreadId": null, "preview": "", "ephemeral": true, "section": null, "sectionEnteredAt": null, "projectId": null, "historyMode": "paginated", "modelProvider": "openai", "model": "gpt-6.1-sol", "reasoningEffort": null, "createdAt": 1794774609, "updatedAt": 1794774609, "recencyAt": 1794774609, "status": {"type": "idle"}, "path": null, "cwd": "/workspace/mediarr-card", "cliVersion": "0.167.0-alpha.4", "originator": "synthetic-memory-probe", "source": "vscode", "canAcceptDirectInput": true, "threadSource": null, "agentNickname": null, "agentRole": null, "gitInfo": null, "name": null, "daybreakEnabled": null, "turns": []}, "model": "gpt-6.1-sol", "modelProvider": "openai", "serviceTier": null, "disabledPluginIds": [], "cwd": "/workspace/mediarr-card", "runtimeWorkspaceRoots": ["/workspace/mediarr-card"], "instructionSources": [], "approvalPolicy": "on-request", "approvalsReviewer": "user", "sandbox": {"type": "readOnly", "networkAccess": false}, "activePermissionProfile": {"id": ":read-only", "extends": null}, "reasoningEffort": null, "multiAgentMode": "explicitRequestOnly"}}}
{"method": "mcpServer/tool/call", "response": {"id": 4, "result": {"content": [{"type": "text", "text": "{\"repository\": \"BMWfan/mediarr-card\", \"memories\": [], \"estimated_tokens\": 0, \"method\": \"keyword-overlap (not semantic)\"}"}]}}}
{"method": "mcpServer/tool/call", "response": {"id": 5, "result": {"content": [{"type": "text", "text": "{\"invalidated\": true}"}]}}}
{"method": "mcpServer/tool/call", "response": {"id": 6, "result": {"content": [{"type": "text", "text": "{\"repository\": \"BMWfan/mediarr-card\", \"memories\": [], \"estimated_tokens\": 0, \"method\": \"keyword-overlap (not semantic)\"}"}]}}}
```


## 2026-11-15 — deeper provisioning and independent-session investigation

### Correction of the earlier interface assessment
The installed CLI **does** provide a Cloud task submission interface. Earlier statements that no second-task launch interface exists were too broad: no such connector tool was exposed, but `codex cloud exec` is available. The actual remaining CLI blocker is authentication, after network access is granted. No Cloud task was submitted.

Actual command/help evidence:
```text
$ codex cloud exec --help
Submit a new Codex Cloud task without launching the TUI
Usage: codex cloud exec [OPTIONS] --env <ENV_ID> [QUERY]
--branch <BRANCH>  Git branch to run in Codex Cloud
--attempts <ATTEMPTS>  Number of assistant attempts (best-of-N), default 1

$ codex cloud list --json
Error: http error: list_tasks failed: error sending request for url (https://chatgpt.com/backend-api/wham/tasks/list?limit=20&task_filter=current)

$ codex cloud list --json
# Retried with explicit execution-tool network permission:
Error: http error: list_tasks failed: GET https://chatgpt.com/backend-api/wham/tasks/list?limit=20&task_filter=current failed: 401 Unauthorized; content-type=application/json; body={"detail":"Could not parse your authentication token. Please try signing in again."}
```
Both list attempts exited 1. This is a read-only API request, not a paid model invocation. Network permission changed the observed failure from transport to server-side authentication rejection. It does not establish which credential source or account is wrong; no credential values were inspected, copied, printed or changed. The selected managed-environment ID must not be assumed to be a valid ID for the legacy Cloud task API. No valid target Cloud-task environment ID has been established.

### Official documentation checked on 2026-11-15
- [Current Cloud environments](https://learn.chatgpt.com/docs/environments/cloud-environments): reusable environments can package a tested install script and start skill. Publishing captures prepared filesystem state for new tasks; each task has separate working files, and existing tasks retain their own state. **Inference:** a seeded SQLite database in that prepared filesystem is not a continuously shared memory store between tasks. This explains why resume success alone is insufficient.
- [Codex Cloud Legacy](https://learn.chatgpt.com/docs/environments/cloud-environment): GitHub/Linear integration workflows use this separate environment model, with setup and optional maintenance scripts plus a bounded container cache. A cache is not a durable project-memory contract. Setup-shell exports do not themselves persist into the agent phase.
- [MCP configuration and surface support](https://learn.chatgpt.com/docs/extend/mcp): local Codex-host configuration supports stdio and streamable HTTP. Project configuration requires trust. Hosted orchestration has separate transport/policy constraints. A child CLI's config does not demonstrate the coordinator consuming it.
These are configuration options and limitations documented for their respective surfaces, **not** proof of this account's settings or an executed hosted integration.

### Actual automatic configuration experiment
Used stdlib subprocess orchestration and three fresh temporary CODEX_HOME directories; no global configuration was touched. For each configuration:
```sh
CODEX_HOME=<fresh-home> codex mcp add project_memory \
  --env PROJECT_MEMORY_DIR=<test-store> -- python /workspace/mediarr-card/tools/project_memory/server.py
python /workspace/mediarr-card/tools/project_memory/verify_codex_client.py <fresh-home>
```
All six commands exited 0. The orchestration asserted the first recall count from actual MCP response JSON before the probe recorded anything:
- A: fresh home, fresh shared-store => 0 memories, then record succeeds.
- B: different fresh home, same shared-store => 1 memory before recording.
- C: different fresh home, different fresh-store => 0 memories before recording.
All three assertions passed. This demonstrates scripted registration and independent client configuration with a shared local directory. It **does not** simulate an independent hosted machine or validate a shared volume in Codex Cloud. It establishes that configuration persistence and data persistence are separate requirements. Full actual-client logs follow.

### Concrete next integration path (prepared, not deployed)
1. Identify the intended surface: GitHub-triggered Legacy environment versus current published Cloud environment. Select the environment for BMWfan/mediarr-card; do not reuse another repository's store.
2. In the appropriate environment setup/settings, arrange the already-tested stdio registration command with the actual checkout path. Run it before starting the Codex host that is supposed to consume that configuration. On Legacy use the setup/maintenance mechanism as appropriate; on current Cloud use its tested install/start setup. A running coordinator may not read child-host configuration; check its own tool inventory before claiming support.
3. Bootstrap must be reproducible from the selected branch. The spike is not on main: a setup snapshot built from main cannot assume `tools/project_memory/server.py` exists. Do not copy a stale database or credential-bearing CODEX_HOME into a shared snapshot.
4. Choose a cross-task data mechanism explicitly. Recommended under the current no-deployment/no-paid-service constraints: owner-reviewed repository documents, fetched at a pinned revision using the existing GitHub connector, with proposed updates in this Draft PR. This provides durable reviewed text rather than automatic mutable SQLite memory. A truly shared mutable store requires a supported durable storage attachment or a separately authenticated service, isolation, retention, backups and concurrency design; none is provisioned or claimed here. Do not expose the current unauthenticated stdio spike on a network or put SQLite WAL on arbitrary network storage.
5. Save/publish the reusable setup only through the owner's environment controls and existing project authorization rules. No environment publication/deployment was performed in this investigation.
6. Start two **independent tasks** from the intended environment and on `spike/39-project-memory-poc`. Task A must verify real coordinator tool discovery, record a unique synthetic fixture and end. Task B must verify discovery and recall that exact fixture before any write, invalidate it, and end. Task C must confirm exclusion after invalidation. Log environment/task IDs, revision, server/client versions and actual responses. Distinguish shared live state from identical snapshot seeds.
7. For CLI submission from an authenticated client, the tested help specifies `codex cloud exec --env <actual-cloud-task-environment-id> --branch spike/39-project-memory-poc "<task prompt>"`. A successful login/list and validated target environment are prerequisites. This session cannot pass them: the actual read-only request returned 401. No submission, model run or login was attempted, preserving the no-paid-API constraint.

Prepared task prompt:
> Work only on BMWfan/mediarr-card branch spike/39-project-memory-poc and existing Draft PR #40. Read AGENTS.md, .github/SDD-LIGHT.md and all SPEC-039 documents first. Use synthetic fixtures only; no paid API, CI/release changes, additional PR, merge or release. Verify memory tools in the actual hosted coordinator, not only a child CLI. Execute the assigned A/B/C phase from verification.md; never seed the expected fixture in phase B/C. Record exact task/environment IDs, revisions, commands and real responses in verification.md. If tools or durable storage are unavailable, record the actual blocker and do not replace the hosted test with same-machine subprocesses.

**Disposition:** scripted local Codex registration is now verified. Independent hosted execution remains specifically blocked by Cloud API authentication and lack of verified target environment/storage configuration, rather than an assumed absence of a task API. Official reusable-setup options exist; automatic coordinator MCP provisioning and shared mutable cross-task storage remain unverified.

### Captured provisioning/client responses
```text
PHASE A: fresh CODEX_HOME; storage=/tmp/memory-provision-s0m76ly9/shared-store
COMMAND ['codex', 'mcp', 'add', 'project_memory', '--env', 'PROJECT_MEMORY_DIR=/tmp/memory-provision-s0m76ly9/shared-store', '--', 'python', '/workspace/mediarr-card/tools/project_memory/server.py']
EXIT 0
Added global MCP server 'project_memory'.
WARNING: proceeding, even though we could not create PATH aliases: Refusing to create helper binaries under temporary dir "/tmp" (codex_home: AbsolutePathBuf("/tmp/memory-provision-s0m76ly9/A"))

PROBE EXIT 0
{"method": "initialize", "response": {"id": 1, "result": {"userAgent": "synthetic-memory-probe/0.167.0-alpha.4 (Debian 13.0.0; x86_64) dumb (synthetic-memory-probe; 1)", "codexHome": "/tmp/memory-provision-s0m76ly9/A", "platformFamily": "unix", "platformOs": "linux"}}}
{"method": "mcpServerStatus/list", "response": {"id": 2, "result": {"data": [{"name": "project_memory", "runtimeStatus": null, "pluginId": null, "httpOrigin": null, "serverInfo": {"name": "mediarr-project-memory-spike", "title": null, "version": "0.1.0", "description": null, "icons": null, "websiteUrl": null}, "serverCapabilities": {"tools": {}}, "toolListMeta": null, "tools": {"memory_recall": {"name": "memory_recall", "description": "Recall repository-scoped memories (keyword-only spike)", "inputSchema": {"type": "object", "properties": {"query": {"type": "string"}, "limit": {"type": "integer"}}, "required": ["query"]}}, "memory_invalidate": {"name": "memory_invalidate", "description": "Invalidate outdated memory", "inputSchema": {"type": "object", "properties": {"id": {"type": "string"}}, "required": ["id"]}}, "memory_record": {"name": "memory_record", "description": "Record sourced project decision/finding", "inputSchema": {"type": "object", "properties": {"content": {"type": "string"}, "source": {"type": "string"}, "kind": {"type": "string"}}, "required": ["content", "source"]}}}, "toolsError": null, "resources": [], "resourceTemplates": [], "authStatus": "unsupported"}], "nextCursor": null}}}
{"method": "thread/start", "response": {"id": 3, "result": {"thread": {"id": "01a1e0e8-f376-7ef3-b338-9a08ae7794e9", "environments": [{"environmentId": "local", "cwd": "/workspace/mediarr-card", "runtimeWorkspaceRoots": ["/workspace/mediarr-card"]}], "extra": null, "sessionId": "01a1e0e8-f376-7ef3-b338-9a08ae7794e9", "forkedFromId": null, "parentThreadId": null, "preview": "", "ephemeral": true, "section": null, "sectionEnteredAt": null, "projectId": null, "historyMode": "paginated", "modelProvider": "openai", "model": "gpt-6.1-sol", "reasoningEffort": null, "createdAt": 1794774725, "updatedAt": 1794774725, "recencyAt": 1794774725, "status": {"type": "idle"}, "path": null, "cwd": "/workspace/mediarr-card", "cliVersion": "0.167.0-alpha.4", "originator": "synthetic-memory-probe", "source": "vscode", "canAcceptDirectInput": true, "threadSource": null, "agentNickname": null, "agentRole": null, "gitInfo": null, "name": null, "daybreakEnabled": null, "turns": []}, "model": "gpt-6.1-sol", "modelProvider": "openai", "serviceTier": null, "disabledPluginIds": [], "cwd": "/workspace/mediarr-card", "runtimeWorkspaceRoots": ["/workspace/mediarr-card"], "instructionSources": [], "approvalPolicy": "on-request", "approvalsReviewer": "user", "sandbox": {"type": "readOnly", "networkAccess": false}, "activePermissionProfile": {"id": ":read-only", "extends": null}, "reasoningEffort": null, "multiAgentMode": "explicitRequestOnly"}}}
{"method": "mcpServer/tool/call", "response": {"id": 4, "result": {"content": [{"type": "text", "text": "{\"repository\": \"BMWfan/mediarr-card\", \"memories\": [], \"estimated_tokens\": 0, \"method\": \"keyword-overlap (not semantic)\"}"}]}}}
{"method": "mcpServer/tool/call", "response": {"id": 5, "result": {"content": [{"type": "text", "text": "{\"id\": \"724c3aaae23dac679c30fff6\", \"repository\": \"BMWfan/mediarr-card\"}"}]}}}
{"method": "mcpServer/tool/call", "response": {"id": 6, "result": {"content": [{"type": "text", "text": "{\"repository\": \"BMWfan/mediarr-card\", \"memories\": [{\"id\": \"724c3aaae23dac679c30fff6\", \"kind\": \"decision\", \"content\": \"synthetic restart fixture uses offline storage\", \"source\": \"local-test:codex-client\", \"trust\": \"untrusted; verify source before acting\"}], \"estimated_tokens\": 29, \"method\": \"keyword-overlap (not semantic)\"}"}]}}}

ASSERT initial recall count = 0 PASS

PHASE B: fresh CODEX_HOME; storage=/tmp/memory-provision-s0m76ly9/shared-store
COMMAND ['codex', 'mcp', 'add', 'project_memory', '--env', 'PROJECT_MEMORY_DIR=/tmp/memory-provision-s0m76ly9/shared-store', '--', 'python', '/workspace/mediarr-card/tools/project_memory/server.py']
EXIT 0
Added global MCP server 'project_memory'.
WARNING: proceeding, even though we could not create PATH aliases: Refusing to create helper binaries under temporary dir "/tmp" (codex_home: AbsolutePathBuf("/tmp/memory-provision-s0m76ly9/B"))

PROBE EXIT 0
{"method": "initialize", "response": {"id": 1, "result": {"userAgent": "synthetic-memory-probe/0.167.0-alpha.4 (Debian 13.0.0; x86_64) dumb (synthetic-memory-probe; 1)", "codexHome": "/tmp/memory-provision-s0m76ly9/B", "platformFamily": "unix", "platformOs": "linux"}}}
{"method": "mcpServerStatus/list", "response": {"id": 2, "result": {"data": [{"name": "project_memory", "runtimeStatus": null, "pluginId": null, "httpOrigin": null, "serverInfo": {"name": "mediarr-project-memory-spike", "title": null, "version": "0.1.0", "description": null, "icons": null, "websiteUrl": null}, "serverCapabilities": {"tools": {}}, "toolListMeta": null, "tools": {"memory_recall": {"name": "memory_recall", "description": "Recall repository-scoped memories (keyword-only spike)", "inputSchema": {"type": "object", "properties": {"query": {"type": "string"}, "limit": {"type": "integer"}}, "required": ["query"]}}, "memory_record": {"name": "memory_record", "description": "Record sourced project decision/finding", "inputSchema": {"type": "object", "properties": {"content": {"type": "string"}, "source": {"type": "string"}, "kind": {"type": "string"}}, "required": ["content", "source"]}}, "memory_invalidate": {"name": "memory_invalidate", "description": "Invalidate outdated memory", "inputSchema": {"type": "object", "properties": {"id": {"type": "string"}}, "required": ["id"]}}}, "toolsError": null, "resources": [], "resourceTemplates": [], "authStatus": "unsupported"}], "nextCursor": null}}}
{"method": "thread/start", "response": {"id": 3, "result": {"thread": {"id": "01a1e0e8-f53f-7140-a3d6-5717e7dccb09", "environments": [{"environmentId": "local", "cwd": "/workspace/mediarr-card", "runtimeWorkspaceRoots": ["/workspace/mediarr-card"]}], "extra": null, "sessionId": "01a1e0e8-f53f-7140-a3d6-5717e7dccb09", "forkedFromId": null, "parentThreadId": null, "preview": "", "ephemeral": true, "section": null, "sectionEnteredAt": null, "projectId": null, "historyMode": "paginated", "modelProvider": "openai", "model": "gpt-6.1-sol", "reasoningEffort": null, "createdAt": 1794774725, "updatedAt": 1794774725, "recencyAt": 1794774725, "status": {"type": "idle"}, "path": null, "cwd": "/workspace/mediarr-card", "cliVersion": "0.167.0-alpha.4", "originator": "synthetic-memory-probe", "source": "vscode", "canAcceptDirectInput": true, "threadSource": null, "agentNickname": null, "agentRole": null, "gitInfo": null, "name": null, "daybreakEnabled": null, "turns": []}, "model": "gpt-6.1-sol", "modelProvider": "openai", "serviceTier": null, "disabledPluginIds": [], "cwd": "/workspace/mediarr-card", "runtimeWorkspaceRoots": ["/workspace/mediarr-card"], "instructionSources": [], "approvalPolicy": "on-request", "approvalsReviewer": "user", "sandbox": {"type": "readOnly", "networkAccess": false}, "activePermissionProfile": {"id": ":read-only", "extends": null}, "reasoningEffort": null, "multiAgentMode": "explicitRequestOnly"}}}
{"method": "mcpServer/tool/call", "response": {"id": 4, "result": {"content": [{"type": "text", "text": "{\"repository\": \"BMWfan/mediarr-card\", \"memories\": [{\"id\": \"724c3aaae23dac679c30fff6\", \"kind\": \"decision\", \"content\": \"synthetic restart fixture uses offline storage\", \"source\": \"local-test:codex-client\", \"trust\": \"untrusted; verify source before acting\"}], \"estimated_tokens\": 29, \"method\": \"keyword-overlap (not semantic)\"}"}]}}}
{"method": "mcpServer/tool/call", "response": {"id": 5, "result": {"content": [{"type": "text", "text": "{\"id\": \"724c3aaae23dac679c30fff6\", \"repository\": \"BMWfan/mediarr-card\"}"}]}}}
{"method": "mcpServer/tool/call", "response": {"id": 6, "result": {"content": [{"type": "text", "text": "{\"repository\": \"BMWfan/mediarr-card\", \"memories\": [{\"id\": \"724c3aaae23dac679c30fff6\", \"kind\": \"decision\", \"content\": \"synthetic restart fixture uses offline storage\", \"source\": \"local-test:codex-client\", \"trust\": \"untrusted; verify source before acting\"}], \"estimated_tokens\": 29, \"method\": \"keyword-overlap (not semantic)\"}"}]}}}

ASSERT initial recall count = 1 PASS

PHASE C: fresh CODEX_HOME; storage=/tmp/memory-provision-s0m76ly9/fresh-store
COMMAND ['codex', 'mcp', 'add', 'project_memory', '--env', 'PROJECT_MEMORY_DIR=/tmp/memory-provision-s0m76ly9/fresh-store', '--', 'python', '/workspace/mediarr-card/tools/project_memory/server.py']
EXIT 0
Added global MCP server 'project_memory'.
WARNING: proceeding, even though we could not create PATH aliases: Refusing to create helper binaries under temporary dir "/tmp" (codex_home: AbsolutePathBuf("/tmp/memory-provision-s0m76ly9/C"))

PROBE EXIT 0
{"method": "initialize", "response": {"id": 1, "result": {"userAgent": "synthetic-memory-probe/0.167.0-alpha.4 (Debian 13.0.0; x86_64) dumb (synthetic-memory-probe; 1)", "codexHome": "/tmp/memory-provision-s0m76ly9/C", "platformFamily": "unix", "platformOs": "linux"}}}
{"method": "mcpServerStatus/list", "response": {"id": 2, "result": {"data": [{"name": "project_memory", "runtimeStatus": null, "pluginId": null, "httpOrigin": null, "serverInfo": {"name": "mediarr-project-memory-spike", "title": null, "version": "0.1.0", "description": null, "icons": null, "websiteUrl": null}, "serverCapabilities": {"tools": {}}, "toolListMeta": null, "tools": {"memory_record": {"name": "memory_record", "description": "Record sourced project decision/finding", "inputSchema": {"type": "object", "properties": {"content": {"type": "string"}, "source": {"type": "string"}, "kind": {"type": "string"}}, "required": ["content", "source"]}}, "memory_invalidate": {"name": "memory_invalidate", "description": "Invalidate outdated memory", "inputSchema": {"type": "object", "properties": {"id": {"type": "string"}}, "required": ["id"]}}, "memory_recall": {"name": "memory_recall", "description": "Recall repository-scoped memories (keyword-only spike)", "inputSchema": {"type": "object", "properties": {"query": {"type": "string"}, "limit": {"type": "integer"}}, "required": ["query"]}}}, "toolsError": null, "resources": [], "resourceTemplates": [], "authStatus": "unsupported"}], "nextCursor": null}}}
{"method": "thread/start", "response": {"id": 3, "result": {"thread": {"id": "01a1e0e8-f6fa-7532-92a1-7d80fbbdf8ac", "environments": [{"environmentId": "local", "cwd": "/workspace/mediarr-card", "runtimeWorkspaceRoots": ["/workspace/mediarr-card"]}], "extra": null, "sessionId": "01a1e0e8-f6fa-7532-92a1-7d80fbbdf8ac", "forkedFromId": null, "parentThreadId": null, "preview": "", "ephemeral": true, "section": null, "sectionEnteredAt": null, "projectId": null, "historyMode": "paginated", "modelProvider": "openai", "model": "gpt-6.1-sol", "reasoningEffort": null, "createdAt": 1794774726, "updatedAt": 1794774726, "recencyAt": 1794774726, "status": {"type": "idle"}, "path": null, "cwd": "/workspace/mediarr-card", "cliVersion": "0.167.0-alpha.4", "originator": "synthetic-memory-probe", "source": "vscode", "canAcceptDirectInput": true, "threadSource": null, "agentNickname": null, "agentRole": null, "gitInfo": null, "name": null, "daybreakEnabled": null, "turns": []}, "model": "gpt-6.1-sol", "modelProvider": "openai", "serviceTier": null, "disabledPluginIds": [], "cwd": "/workspace/mediarr-card", "runtimeWorkspaceRoots": ["/workspace/mediarr-card"], "instructionSources": [], "approvalPolicy": "on-request", "approvalsReviewer": "user", "sandbox": {"type": "readOnly", "networkAccess": false}, "activePermissionProfile": {"id": ":read-only", "extends": null}, "reasoningEffort": null, "multiAgentMode": "explicitRequestOnly"}}}
{"method": "mcpServer/tool/call", "response": {"id": 4, "result": {"content": [{"type": "text", "text": "{\"repository\": \"BMWfan/mediarr-card\", \"memories\": [], \"estimated_tokens\": 0, \"method\": \"keyword-overlap (not semantic)\"}"}]}}}
{"method": "mcpServer/tool/call", "response": {"id": 5, "result": {"content": [{"type": "text", "text": "{\"id\": \"724c3aaae23dac679c30fff6\", \"repository\": \"BMWfan/mediarr-card\"}"}]}}}
{"method": "mcpServer/tool/call", "response": {"id": 6, "result": {"content": [{"type": "text", "text": "{\"repository\": \"BMWfan/mediarr-card\", \"memories\": [{\"id\": \"724c3aaae23dac679c30fff6\", \"kind\": \"decision\", \"content\": \"synthetic restart fixture uses offline storage\", \"source\": \"local-test:codex-client\", \"trust\": \"untrusted; verify source before acting\"}], \"estimated_tokens\": 29, \"method\": \"keyword-overlap (not semantic)\"}"}]}}}

ASSERT initial recall count = 0 PASS
```
