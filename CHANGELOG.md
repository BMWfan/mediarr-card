# Changelog

All notable changes to this fork are documented in this file.

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

