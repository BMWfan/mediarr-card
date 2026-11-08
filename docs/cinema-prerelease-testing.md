# Test Cinema in an existing Home Assistant instance

## Current candidate and compatibility

Reviewed 2026-11-08. Use **Card v0.6.0-dev.7** and **sensor v0.8.0-dev.6**.
Both are developer prereleases, selected explicitly through HACS beta versions.
Card source/tag commit: `1265a0af7325a08138547b9b34f4b04b6b5e0dea`. Root `mediarr-card.js` SHA-256:
`dc30b17d16817e40031c1949f7336375ad5c4b97030748bf37183a15bcd87358`. Do not move or replace an existing tag.

HACS uses root `mediarr-card.js` (`content_in_root: true`); no attached release
asset or extra module files are needed. Verify the version displayed in the card
editor after reloading, and check the published release links before installing:

- [Card v0.6.0-dev.7](https://github.com/BMWfan/mediarr-card/releases/tag/v0.6.0-dev.7)
- [Sensor v0.8.0-dev.6](https://github.com/BMWfan/mediarr_sensor/releases/tag/v0.8.0-dev.6)

| Backend | Behavior with the current card |
| --- | --- |
| dev.3 | Cinema/library/collections/episode data and available Plex player selection; no pause API or readiness API. Requests/account-connect stay disabled; missing pause command explains the required update without inventing state. |
| dev.4 | Adds current-playback fields and pause/resume; lacks readiness API, so new request/account-connect actions remain disabled. |
| dev.5 | Full request/readiness API and corrected lookups. Minimum for the current functional request flow. |
| dev.6 | Same runtime API as dev.5, plus guarded manual release automation. Recommended pairing. |

The dev.3 browser regression is a deliberate compatibility check, **not** the
recommended installation. It mocks the older response/unknown-command behavior;
it does not run a real dev.3 integration or establish production connectivity.
Earlier dev.5/dev.3 preparation notes under `docs/specs/cinema-dev5/` are historical;
this guide supersedes their old installation pairing.

## Install through HACS

1. Back up HA and record installed card/integration versions and dashboard YAML.
   Use a separate test dashboard in your existing instance. Do not run repository
   `dev/setup.sh` or `dev/onboard.py` on that instance.
2. HACS → **Mediarr** integration → download/redownload → enable beta versions →
   select **v0.8.0-dev.6**. If needed, add `BMWfan/mediarr_sensor` as a custom
   Integration repository. Restart HA and verify the integration version. Keep existing configuration;
   on first setup configure Plex, Seerr and TMDB in the Mediarr integration.
3. HACS → **Mediarr Card** → download/redownload → select **v0.6.0-dev.7** with
   beta versions enabled. If needed, add `BMWfan/mediarr-card` as Dashboard/
   Lovelace repository. Do not select an unversioned branch.
4. Keep one JavaScript module resource for
   `/hacsfiles/mediarr-card/mediarr-card.js`, preserving HACS's cache query when
   present. Remove duplicate resources such as a second `/local/mediarr-card.js`
   entry for this test. Reload resources and fully reload the browser/companion
   frontend cache. Verify loaded build **0.6.0-dev.7** in the card editor.
5. Add a panel view to the test dashboard:

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

If a version is missing, refresh HACS repository information and reopen its beta
version selector. A draft PR alone is not installable through HACS.

## Owner acceptance checks

- Hero, poster filters, search, details/back, covers and partial-source messages.
- Unwatched series: verify the configured Plex account's latest watch boundary,
  old season gaps, new episode counts and one poster per show.
- Full-page HA scrolling and compact-card fullscreen-overlay scrolling/close.
- Play and Trailer have matching dimensions and distinct native icons. Trailer
  opens in-page, closes cleanly and does not restart on unrelated status updates.
- Open Plex on an online client registered by HA's official Plex integration.
  Verify actual playback on that device; Android TV alone is insufficient.
  Check device/title display, pause/resume and stopped-device removal.
- Request buttons are disabled until Seerr and its actual default non-4K
  Radarr/Sonarr profile/root are reachable. Film/series status is independent.
  The refresh icon rechecks connections; readonly checks never add test media.
- With an intended test title, confirm the selected movie/series and season in
  Seerr and the manager. Cancel must not submit. A 30-second unconfirmed call
  must not create a fake watchlist success; check Seerr before retrying because
  a remote request may have completed despite a lost acknowledgement.
- Personal TMDB recommendations require the configured Read Access Token plus
  explicit per-user account consent. Record credentials only in HA, never here.

Record HA/HACS/browser versions, both Mediarr versions, observed results and
redacted errors. Automated synthetic transports do not prove real accounts,
physical playback or production manager connectivity.

## Rollback and release boundary

Redownload the previously recorded card and integration versions in HACS.
Restart HA after reverting the integration and reload the frontend after the card.
Restore dashboard YAML or the backup if configuration/storage rollback is needed.
`library_layout: classic` changes the layout; it does not roll back the backend.

Release workflows are now manual. Publishing requires exact version confirmation;
developer versions cannot become stable/latest. Main/stable merges and publication
remain owner decisions after testing. This documentation PR changes no runtime
bundle, tag, release, production instance or primary PR source branch.
