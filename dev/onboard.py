"""Bootstrap only the disposable, loopback Home Assistant development instance."""

import json
import os
from pathlib import Path
import secrets
import time
import urllib.error
import urllib.parse
import urllib.request

os.umask(0o077)
RUNTIME = Path(os.environ.get("HA_DEV_RUNTIME_DIR", Path(__file__).parent / ".runtime"))
BASE = "http://127.0.0.1:" + os.environ.get("HA_DEV_PORT", "8124")
AUTH_FILE = RUNTIME / "local-auth.json"


def request(path, data=None, token=None, form=False, method=None):
    headers = {}
    if token:
        headers["Authorization"] = "Bearer " + token
    if data is not None:
        if form:
            data = urllib.parse.urlencode(data).encode()
            headers["Content-Type"] = "application/x-www-form-urlencoded"
        else:
            data = json.dumps(data).encode()
            headers["Content-Type"] = "application/json"
    req = urllib.request.Request(BASE + path, data=data, headers=headers, method=method)
    with urllib.request.urlopen(req, timeout=30) as response:
        return json.load(response)


def save_auth(auth):
    AUTH_FILE.write_text(json.dumps(auth))
    AUTH_FILE.chmod(0o600)


if not AUTH_FILE.exists():
    status = request("/api/onboarding")
    if next(step for step in status if step["step"] == "user")["done"]:
        raise RuntimeError("Existing owner without local test credentials; refusing to overwrite")
    password = secrets.token_urlsafe(32)
    result = request("/api/onboarding/users", {
        "client_id": BASE + "/", "name": "Mediarr Dev", "username": "mediarr-dev",
        "password": password, "language": "de",
    })
    auth = request("/auth/token", {
        "grant_type": "authorization_code", "code": result["auth_code"],
        "client_id": BASE + "/",
    }, form=True)
    save_auth({"username": "mediarr-dev", "password": password, **auth})
    print("Local-only owner created; credentials retained privately, not printed")

# Refresh before every test, including after a restored snapshot.
auth = json.loads(AUTH_FILE.read_text())
auth.update(request("/auth/token", {
    "grant_type": "refresh_token", "refresh_token": auth["refresh_token"],
    "client_id": BASE + "/",
}, form=True))
save_auth(auth)

# Resume incomplete onboarding after an interrupted first run.
try:
    status = request("/api/onboarding")
except urllib.error.HTTPError as error:
    if error.code != 404:
        raise
    status = []
pending = {step["step"] for step in status if not step["done"]}
for step, data in [
    ("core_config", {}), ("analytics", {}),
    ("integration", {"client_id": BASE + "/", "redirect_uri": BASE + "/"}),
]:
    if step in pending:
        request("/api/onboarding/" + step, data, auth["access_token"])

# HA creates these optional integrations during onboarding. Remove only its
# onboarding-generated entries so the fixture environment has no cloud services.
entries = request("/api/config/config_entries/entry", token=auth["access_token"])
for entry in entries:
    if entry["domain"] in {"met", "google_translate", "radio_browser", "shopping_list"} and entry.get("source") == "onboarding":
        request("/api/config/config_entries/entry/" + entry["entry_id"],
                token=auth["access_token"], method="DELETE")

# The manifest healthcheck can pass before the application has finished startup.
deadline = time.monotonic() + 120
while True:
    config = request("/api/config", token=auth["access_token"])
    if config["state"] == "RUNNING":
        break
    if time.monotonic() > deadline:
        raise RuntimeError("HA did not reach RUNNING: " + config["state"])
    time.sleep(1)
state = request("/api/states/sensor.plex_mediarr_dev", token=auth["access_token"])
if state["attributes"]["data"][0]["title"] != "Mediarr Cloud Test":
    raise RuntimeError("Mediarr sensor fixture missing")
print("PASS: authenticated HA API, RUNNING state, Mediarr sensor fixture")
