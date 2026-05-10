# Changelog

All notable changes to this fork are documented in this file.

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
