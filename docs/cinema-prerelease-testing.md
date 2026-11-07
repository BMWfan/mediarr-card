# Test Cinema in an existing Home Assistant instance

## Verified versions and availability

Checked 2026-11-07: [card v0.6.0-dev.5](https://github.com/BMWfan/mediarr-card/releases/tag/v0.6.0-dev.5)
exists as a published GitHub prerelease (not a draft). Its tag is PR #20 head
`fc755ec891366836961c9e8452d36847eb774ee8`. No release was created or changed by
this preparation. Do not move this tag or replace its contents.

`hacs.json` selects root `mediarr-card.js` with `content_in_root: true`.
HACS can fetch this file from the selected tag; a separately attached release
asset is unnecessary. The downloaded file and a fresh build have SHA-256:
`549729c7df49f0950ad3afd8abb0454712357761e8b591924d7ce15c551a7f80`.
Package version and the card's `MEDIARR_BUILD` both declare `0.6.0-dev.5`.
The bundle includes Cinema and has no module imports requiring extra files.

| Backend | Supported scope with this card |
| --- | --- |
| [sensor v0.8.0-dev.3](https://github.com/BMWfan/mediarr_sensor/releases/tag/v0.8.0-dev.3) | Cinema, discovery/account APIs, collections, episode progress, permitted Plex player selection and play requests |
| sensor v0.8.0-dev.4 | Adds backend pause/resume and richer current-playback fields |

The requested dev.3 pairing has reduced playback controls. Dev.3's
`mediarr/players` returns entity ID, name, availability and reason, without
state/title/control capabilities. Live HA entity state can still populate the
playback strip and show controls. Dev.3 has no `mediarr/playback_control`:
clicking pause/resume then displays an integration-update message and does not
change playback state. Do not count pause/resume as passing with dev.3.
The existing test suite's successful pause/resume fixtures model dev.4.

## Install through HACS

1. Back up Home Assistant and record the currently installed card and integration
   versions and dashboard YAML. Use a separate test dashboard in your existing
   instance. These instructions are for an owner-run test; no instance is changed
   by this PR.
2. In HACS, find **Mediarr** integration. If absent, add
   `https://github.com/BMWfan/mediarr_sensor` as a custom repository of type
   **Integration**. In its download/redownload dialog enable **Show beta versions**
   (wording varies by HACS version), explicitly select **v0.8.0-dev.3**, and download.
   Restart Home Assistant and verify the integration version. Keep existing
   Mediarr configuration; do not run `dev/onboard.py` or `dev/setup.sh` on this instance.
3. Find **Mediarr Card** in HACS. If absent, add
   `https://github.com/BMWfan/mediarr-card` as type **Dashboard** (older HACS:
   **Lovelace/Plugin**). Enable beta/prerelease versions, select **v0.6.0-dev.5**
   explicitly, and download/redownload. Do not select an unversioned development branch.
4. Check Settings → Dashboards → Resources (advanced mode may be needed).
   Keep one JavaScript module resource for `/hacsfiles/mediarr-card/mediarr-card.js`;
   preserve HACS's cache query when present. Remove duplicate manual resources
   such as `/local/mediarr-card.js` for this test. Reload resources, hard-refresh
   the browser or clear the companion app frontend cache. Verify the card editor
   reports **0.6.0-dev.5**.
5. Add this view to the test dashboard's raw configuration:

   ```yaml
   views:
     - title: Cinema test
       path: cinema-test
       panel: true
       cards:
         - type: custom:mediarr-card
           view: library
           library_layout: cinema
           streaming_region: DE
   ```

If the version is absent, refresh HACS repository information and reopen the
version dialog with beta versions enabled. A draft PR alone is not HACS-installable.
Check the linked published release before attempting any manual installation.

## Owner test checklist

- Check hero, poster rails, search, poster details/back navigation, artwork and
  unavailable/partial source messages against your configured Mediarr sources.
- Check Unwatched episode counts against the configured Plex account, including
  a series with older gaps. Public discovery needs the integration's TMDB API
  configuration; personal recommendations require a separate per-user TMDB consent.
- Scroll the full-page view using HA scrolling on desktop/mobile. In a second
  card set `view: compact`, configure your existing sensor entities, open its
  fullscreen Cinema overlay and check internal scrolling and close/Escape.
- Open Plex on an online client registered by HA's official Plex integration.
  Select an authorized player and start a title. An Android TV entity alone is
  insufficient. Verify actual playback on the device. On dev.3, record pause/resume
  as unsupported; an upgrade message must not fabricate a successful state change.
- Record HA/HACS/browser versions, both Mediarr versions, checks/results and
  redacted errors. Automated tests use synthetic sources and cannot establish
  actual Plex, TMDB, Radarr or Sonarr connectivity in your instance.

## Rollback and release boundary

In HACS redownload the previously recorded card and sensor versions, restart HA
after reverting the integration, and reload frontend resources/cache after the
card. Restore the prior dashboard YAML; restore the backup if needed for backend
configuration/storage changes. The classic layout can be selected with
`library_layout: classic`, but is not a backend rollback.

The inherited `release-on-main.yml` still runs on main pushes/manual dispatch,
sets `make_latest: true`, and does not explicitly mark prereleases. Do not use it
to republish this version. Its broader release-authorization hardening belongs
to the existing governance work (#21/#24). This follow-up changes no release
workflow, tag, release, production instance or existing PR #20 branch. Future
publication must be separately approved, use a new version if contents change,
and set `prerelease: true` and `make_latest: false`.
