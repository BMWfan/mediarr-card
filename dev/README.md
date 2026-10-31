# Local Home Assistant development

This disposable Home Assistant Core 2026.10.4 instance runs the real frontend
with a locally built Mediarr card, synthetic sensors and a YAML dashboard.
It does not connect to production or need Plex, Sonarr, Radarr, MCP, cloud
credentials or `remote_homeassistant`. Bootstrap removes the optional cloud
integrations that Home Assistant creates during onboarding; HA may attempt
initial connections before they are removed. The infrastructure follows the
BMWfan/homeassistant-dev template. That companion checkout is not needed to run
these scripts.

Requirements: Docker Engine with Compose v2, Node.js 24, npm and Python 3.12+.
The Home Assistant image is pinned by digest, and Playwright by package-lock.json.
The container includes Home Assistant's Python and frontend dependencies.
The card itself has no npm dependencies. Only Playwright is installed for tests.

```bash
bash dev/setup.sh
bash dev/start.sh
bash dev/test.sh
```

Setup installs the locked test dependencies and Playwright Chromium and pulls
the HA image. On Linux, missing browser OS packages can be installed with
`dev/node_modules/.bin/playwright install-deps chromium` (requires system package
installation privileges). To use installed Chromium instead, set
`CHROMIUM_PATH=/usr/bin/chromium` for both setup and tests.

The service binds to loopback port 8124. The dashboard route is
`/mediarr-test/test`. `HA_DEV_PORT` overrides the port. `HA_DEV_RUNTIME_DIR`
overrides the absolute runtime directory (default `dev/.runtime`). Run setup
again after card source changes; the next dashboard load gets the rebuilt card.
Setup builds in a temporary directory and leaves the tracked release bundle
unchanged. Existing runtime config is preserved; edit the runtime config for
local experiments. Changes to the checked-in configuration templates apply to
fresh runtime directories.

A random password is created for the local-only owner `mediarr-dev` on first
startup. Its credentials and refresh token are retained privately in
`dev/.runtime/local-auth.json`; never commit or upload that file. Repeated starts
reuse the account and refresh the short-lived token. This bootstrap targets a
fresh disposable instance, not an existing production instance.

The legacy Playwright regression check (`view: legacy`) tests the real authenticated HA dashboard, movie rendering,
section collapsing, item selection, empty lists, unavailable sensor state,
recovery and JavaScript exceptions. It also checks title metadata, keyboard
accessibility, escaping, stable hover geometry and long descriptions on mobile.
Fullscreen-overlay checks cover modal bounds, local search, sensor updates,
close-button/Escape/browser-Back behavior, nested request dialogs and mobile layout. It temporarily changes only the development
sensor through HA's API and restores the fixture afterward. A screenshot and
JSON results are saved in the ignored runtime directory. The initial fixture is
in `tests/fixtures/plex.json`; the HA template sensor gives the dashboard useful
data immediately after restart.

This is an initial integration suite, not full coverage of all media providers,
request dialogs, backend service calls or visual regressions. Other libraries
and custom integrations from homeassistant-dev are not dependencies of this
workflow and are intentionally not loaded.

`bash dev/test.sh` also runs model tests for cross-provider identity merging,
availability precedence, remakes and missing data. The additional library
browser suite creates temporary synthetic HA sensors, tests the three categories,
source enrichment, responsive detail layout, lifecycle changes, compact poster
rows, direct detail navigation and focus restoration, then deletes
those sensors. Movie/series service calls and failures are explicitly mocked;
no real Radarr/Sonarr requests or downloads are made. Screenshots are saved as
`compact-desktop.png`, `library-desktop.png` and `library-mobile.png` in the ignored runtime directory.
The fixture artwork is a local SVG illustration, not production poster art.

GitHub Actions runs the same workflow for pull requests and pushes to main.
It uploads only the screenshot, result JSON and service log, never authentication
or the HA database. The workflow itself still needs its first run on GitHub.

To stop without deleting local state:

```bash
docker compose -p mediarr-card-dev -f dev/compose.yaml down
```

Supply the same `HA_DEV_RUNTIME_DIR` and `HA_DEV_PORT` overrides to Compose if used.
Live processes do not survive a cloud snapshot; rerun `bash dev/start.sh`.
