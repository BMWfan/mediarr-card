# Changelog

All notable changes to this fork are documented in this file.

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
