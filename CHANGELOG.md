# Changelog

All notable changes to this fork are documented in this file.

## 0.6.0-dev.8 (2026-11-09)

- Include reviewed read-only security CI and paired card/backend contract fixtures.
- Add three frontend adapter regressions and document older backend behavior.
- Runtime behavior is unchanged from dev.7; only the displayed build version changes.

## 0.6.0-dev.7 (2026-11-08)

- Include the reviewed PR #15 legacy security hardening: DOM listeners instead
  of inline script handlers, escaped client/section metadata, retained artwork
  after image failures, bounded progress/cache/list data and robust Radarr input.
- Verify these protections with ten synthetic browser security regressions.
- Make release publication manual with exact version confirmation. Developer
  versions cannot be stable/latest; stable publication requires reviewed main.
  Add six tests exercising the actual release workflow guard.
- Upload only explicitly selected synthetic test artifacts from the ignored
  runtime directory, so screenshots are available for PR review.

## 0.6.0-dev.6 (2026-11-08)

- Send known TMDB IDs for all requests, including sensor/discovery titles, instead
  of searching again by name. Use a native season dialog inside both Cinema
  page/overlay and classic library; cancel/close releases the busy state.
- Bound the service acknowledgement wait to 30 seconds. A timeout leaves the
  request unconfirmed and instructs checking Seerr before retrying.
- Disable request actions until read-only connection checks confirm Seerr and
  its default Radarr/Sonarr profile/root configuration. Checks run every 30 seconds;
  offline status explains why a button is disabled. Optional Immaculaterr approval
  and TMDB account buttons also require successful connection checks.
- Disable Cinema Play when no permitted reachable Plex player is known. Connection
  loss after a successful check is still handled by command error reporting.
- Requires sensor integration 0.8.0-dev.5. No main/stable update.

## 0.6.0-dev.5 (2026-11-07)

- Match Play/Add and the other Cinema text actions to the compact Trailer button:
  shared minimum height, font size, padding, borders and corners. Remove the
  mismatched detail-action margins and wrap hero actions on narrow screens.
- Replace the trailer emoji with Home Assistant's `mdi:movie-play-outline` icon
  in details and the hero, with consistent icon sizing and label spacing.
- Add a matching `mdi:play` icon to Play in details and the hero, keeping it
  visually distinct from the trailer's clapperboard.
- Show a current-playback row per active Plex device, including title and target.
  Pause/resume controls follow reported HA state and device capabilities; commands
  are authorized in sensor 0.8.0-dev.4 and failures do not fabricate state changes.

## 0.6.0-dev.4 (2026-11-04)

- Place Trailer alongside Play in Cinema details and highlights. User clicks
  open a floating in-page YouTube player with fullscreen support and an external
  fallback. Closing removes the iframe; Escape closes the trailer first.
- Preserve poster/image nodes, filter controls and unchanged details across HA
  live updates to prevent repeated redraws and flickering on mobile.
- Add player-list refresh and useful offline guidance, distinguishing disabled
  entities from missing/unavailable players with sensor 0.8.0-dev.3. A player
  must be reachable in HA before playback can be requested.

## 0.6.0-dev.3 (2026-11-04)

- Unwatched series use available episodes after the furthest watched/started
  episode, ignoring old season gaps. One poster shows counts and episode ranges.
  Requires sensor 0.8.0-dev.2; unavailable episode status is explicit.
- Add a safe external official YouTube trailer link from TMDB details, without
  embedding or autoplay. Prefer the configured language with English fallback.
- Let Home Assistant scroll the permanent Cinema page as its content grows;
  retain the independent scroll surface in the compact-card fullscreen overlay.
- Show manager artwork on waiting titles and fetch missing covers via metadata.

## 0.6.0-dev.2 (2026-11-04)

- Merge undated episode-sensor entries into an unambiguous dated series so the
  Cinema library does not show the same series twice. Conflicting IDs and
  same-name remakes remain separate. No sensor-integration update is required.
- Keep the Unwatched checkbox checked and disabled while the Unwatched selection
  already enforces that filter; restore its prior preference on other selections.

## 0.6.0-dev.1 (2026-11-03)

- Replace the large default view with the approved cinema page: full-width
  spotlight, curated collection controls, poster rails and a single page scroll.
- Add native Plex collection selection, trending period, sourced TMDB account
  recommendations, upcoming releases and real download queues without extra menus.
- Add full-page film details with context-preserving back navigation, global
  library/manager/TMDB search and exact-ID requests. Compact cards remain intact.
- Add secure TMDB account approval and authorized HA Plex player selection via
  mediarr_sensor 0.8.0-dev.1. Credentials stay in HA, and each HA user connects
  their own TMDB account. There is no local recommendation engine.
- Keep the previous large layout available with `library_layout: classic`.

## 0.5.1-dev.1 (2026-11-02)

- Keep library/overlay rendering independent of legacy provider initialization
  and updates, so malformed or legacy-only sensor fields cannot abort the library.

- Fix the configuration error when adding a card without individual sensor
  entities. A minimal `type: custom:mediarr-card` now opens the backend library;
  configured sensor cards retain the compact default. Explicit compact mode
  also accepts backend-only configuration. Legacy sections still require sensors.

## 0.5.0 (2026-11-01)

- Add authenticated TMDB catalog search alongside existing-library matches,
  paged results, exact-ID requests, stale-response protection and explicit errors.
- Add `view: library` for a full-page Home Assistant panel, alongside the compact
  dashboard card and fullscreen overlay.
- Read the complete Plex movie/show catalog and Radarr/Sonarr managed lists
  through the backend, including watched titles and download queue progress.
- Show download status and progress on list, detail and compact posters.
- Keep discovery suggestions sourced from configured integrations; no new
  recommendation engine or account-history import is introduced.
- Show regional streaming subscriptions separately from rental/purchase offers,
  with JustWatch/TMDB attribution. Requires mediarr_sensor 0.7.0.

- Replace the compact opening link with a full-width film-night button,
  including the clapperboard icon, subtitle and arrow without hover movement.
- Give the desktop title list and film details separate scroll areas, so long
  synopses and cast stay reachable while search and category controls remain
  visible. Keep a single page scroll on mobile and reset details for a new title.

## 0.4.1 (2026-11-01)

- Correct legacy Plex/Jellyfin TV detection from episode numbers, movie years
  and descriptions, Sonarr episode-title suffixes and Jellyfin field casing.
- Preserve unknown media types; infer a missing type only from unambiguous ID
  evidence. Unknown titles cannot accidentally submit movie requests.
- Load complete selected-title metadata via the authenticated Mediarr backend,
  with caching, race protection and explicit missing-backend/TMDB errors.
  Requires the paired mediarr_sensor backend update for cast/credits loading.

## 0.4.0 (2026-10-31)

- Default compact dashboard with recently added/discovery posters, a watchlist
  row, direct detail navigation and a small fullscreen opening button.
- Fullscreen overlay with source-independent discovery, waiting and available
  categories, ID-based deduplication and cinematic title/cast details.
- Backend-aware movie/series requests, truthful missing-data states and shared
  pending requests across compact/large views. Global catalog search still
  requires a separate backend capability.
- Source selection, compact poster count and legacy-layout option in the editor.
- Stable banner hover; responsive layout, history/Escape handling and keyboard
  focus restoration. Added Docker HA/Playwright development workflow and tests.

## 0.3.5 (2026-05-22)

### Fixed

- Sections with no data or unavailable sensors now show localized empty-state messages ("Keine kommenden Serien", "Keine Medien verfügbar", "Keine Daten verfügbar", etc.) instead of a blank area.
- `.empty-section-content` CSS: added `flex: 0 0 100%`, `min-height: 60px`, and `var(--secondary-text-color)` so the message is always visible and adapts to any HA theme.
- `set hass()` entity loop refactored: reuses `SECTION_ENTITY_KEYS` to avoid duplicated lists and locates sub-sections by `entityKey` name for reliable unavailable-state rendering.
- Added `data_unavailable` translation key (DE: "Keine Daten verfügbar", EN: "Data unavailable").

## 0.3.4 (2026-05-10)

### Fixed

- Eliminated white/bright flash when clicking between media items by using a double-buffer crossfade: two overlapping background layers swap opacity after the new image loads so the previous image stays visible throughout the transition.
- Tightened CSS transitions to only the required properties — `transition: all` was causing unintended side effects during item switches.

### Changed

- Consolidated HTML escaping into `BaseSection._escapeHtml()` — per-section duplicate escape helpers removed.
- Sections now use a shared `formatDate()` helper from the base class.
- Added empty-state rendering (title_default guard) to ImmaculaterrSection and TMDBSection.
- Added `scripts/deploy.sh` for building and deploying `mediarr-card.js` + `.gz` to the HA www directories (configured via `HA_CONFIG_DIR` env var).

## 0.3.3 (2026-04-06)

### Fixed

- Added robust poster fallbacks to avoid broken thumbnail icons in card sections.
- Improved image error handling so missing poster URLs no longer break section visuals.

## 0.3.2 (2026-04-06)

### Fixed

- Switched HACS delivery to a true single-file `mediarr-card.js` build.
- Removed runtime dependency on extra JS module files under `/hacsfiles/mediarr-card/`.
- Prevented card load failures caused by section module 404 responses.

## 0.3.1 (2026-04-06)

### Fixed

- Made `getConfigElement()` synchronous so Home Assistant visual editor detection works reliably.
- Reduced card-not-found issues caused by stale frontend resource cache behavior.

## 0.3.0 (2026-04-06)

### Changed

- Stabilized HACS loading behavior for `mediarr-card` with updated module cache-busting.
- Improved visual editor behavior and section visibility handling based on active sensors.

### Fixed

- Resolved frontend loading regressions where the card could appear as not found.
- Prevented stale module/cache scenarios by aligning shipped resource files.

## Unreleased (feature/hacs-i18n-readability-seer-ux-improvements)

### Added

- Centralized label/translation system in `base-section.js` with EN/DE defaults.
- Dynamic translation keys for section titles (including Seer and TMDB subsections).
- Modal and toast based interactions for Seer status/season workflows.
- Migration guide for switching from manual resource loading to HACS (`MIGRATION_TO_HACS.md`).
- HACS metadata improvement: `"content_in_root": true`.

### Changed

- Improved text readability and contrast strategy in `styles.js`:
  - stronger hero/header contrast handling
  - explicit readable text colors for critical UI text
  - refined section header backgrounds/borders
- Initial template render now receives Home Assistant context so translations are available immediately.
- Section modules updated to use shared translation helper keys.
- Repository hygiene:
  - cache-bust helper bundles are now ignored via `.gitignore`
  - README updated for this fork and corrected installation/resource paths

### Fixed

- Several section labels and request/status texts now localize reliably in German/English.
- Inconsistent section title rendering across different content sections.
- Cache-related stale submodule behavior by bumping module import query versions consistently.
