# Mediarr Card for Home Assistant

A visual overview card for Home Assistant that combines media servers, media managers, and discovery/request sources in one Lovelace card.

## Fork Notes

This fork includes significant UX and maintenance updates compared to the upstream baseline.
See [CHANGELOG.md](CHANGELOG.md) for full details.

Highlights in this fork:

- Improved readability and contrast behavior for dark/bright backdrops
- Centralized EN/DE label system with dynamic section-title localization
- Better Seer request/status UX (modal-based actions, toast feedback)
- HACS-ready metadata updates (`content_in_root`) and migration notes
- Cache-friendly module versioning improvements for submodule imports

## Features

- Collapsible sections
- Dynamic card/media backdrops
- Plex and Jellyfin recently-added support
- Sonarr and Radarr support (up to 2 instances each)
- Overseerr/Jellyseerr requests with status actions
- Immaculaterr Observatory suggestions with `Request` and `Not interested` actions
- Trakt and TMDB discovery sections

## Screenshots

![VIEW](https://github.com/user-attachments/assets/e5eda74d-e50b-4dde-9985-45282dc99a51)
![Screenshot 2025-01-21 at 14-51-50 mediarr – Home Assistant](https://github.com/user-attachments/assets/4c73b44a-680a-42ea-8d2b-0d96806fb1c6)

## Installation

### Prerequisite

Install and configure the sensor backend first:
https://github.com/Vansmak/mediarr_sensor

### HACS (Recommended)

1. Open `HACS` -> `Frontend`.
2. Open the menu `⋮` -> `Custom repositories`.
3. Add your fork URL (example: `https://github.com/BMWfan/mediarr-card`).
4. Category: `Dashboard`.
5. Install `Mediarr Card`.
6. Restart Home Assistant.

If you migrate from manual `/local/mediarr-card/...` resources, remove the old manual resource after installing via HACS.
Detailed migration steps: [MIGRATION_TO_HACS.md](MIGRATION_TO_HACS.md).

### Manual Installation (Legacy)

1. Copy this folder to:
   `/config/www/mediarr-card/`
2. Add Lovelace resource:
   `/local/mediarr-card/mediarr-card.js`
3. Type: `JavaScript Module`
4. Restart Home Assistant.

Configuration

Step 1: Install and configure the Mediarr Server sensors

🔗 Mediarr Server Repository github.com/Vansmak/mediarr_server

Step 2: Add the Card to Lovelace

Mediarr Card Configuration Guide
Basic Configuration
Add the following YAML to your dashboard. The sections will appear in the same order as they are listed in this configuration:
Labels are optional 
```
type: custom:mediarr-card
media_player_entity: media_player.entity # optional for visual of whats currently playing
plex_entity: sensor.plex_mediarr
jellyfin_entity: sensor.jellyfin_mediarr
sonarr_entity: sensor.sonarr_mediarr
sonarr_label: 1st sonarr instance
radarr_entity: sensor.radarr_mediarr
radarr_label: 1st radarr instance
radarr_release_types: 
  - Digital
  - Theatres
  - Physical
sonarr2_entity: sensor.sonarr2_mediarr
sonarr2_label: 2nd sonarr instance
radarr2_entity: sensor.radarr2_mediarr
radarr2_label: 2nd radarr instance
seer_entity: sensor.seer_mediarr
immaculaterr_movies_entity: sensor.immaculaterr_mediarr_movies
immaculaterr_tv_entity: sensor.immaculaterr_mediarr_tv
trakt_entity: sensor.trakt_mediarr
tmdb_entity: sensor.tmdb_mediarr
```
Item Limit Configuration
Control how many items show in each section:
```
# Global settings (applies to all sections)
max_items: 15  # Show a maximum of 15 items per section
days_to_check: 30  # For sections that use date filtering (Sonarr/Radarr)

# Section-specific overrides
plex_max_items: 20  # Override just for Plex section
sonarr_max_items: 10  # Override just for Sonarr section
radarr_max_items: 12  # Override just for Radarr section
tmdb_max_items: 25  # Override just for TMDB sections
```
Visual Configuration
Control the appearance of background images:
```
# Controls transparency of background images (0-1)
# 0 = completely transparent, 1 = fully opaque
# Recommended: 0.7 for good balance of visibility
opacity: 0.7

# Optional blur effect for backgrounds (in pixels)
blur_radius: 5
```
Optional Seer Lists
Additional Seer content sections can be added:
```
seer_trending_entity: sensor.seer_mediarr_trending
seer_discover_entity: sensor.seer_mediarr_discover
seer_popular_movies_entity: sensor.seer_mediarr_popular_movies
seer_popular_tv_entity: sensor.seer_mediarr_popular_tv
```
Optional Immaculaterr Lists
Add one or both Observatory suggestion sensors:
```
immaculaterr_movies_entity: sensor.immaculaterr_mediarr_movies
immaculaterr_tv_entity: sensor.immaculaterr_mediarr_tv
immaculaterr_max_items: 12
```
Optional TMDB Lists
Additional TMDB content sections can be added:
```
tmdb_airing_today_entity: sensor.tmdb_mediarr_airing_today
tmdb_now_playing_entity: sensor.tmdb_mediarr_now_playing
tmdb_upcoming_entity: sensor.tmdb_mediarr_upcoming
tmdb_on_air_entity: sensor.tmdb_mediarr_on_air
```
Media Player Integration
For progress tracking of currently playing media:
```
media_player_entity: media_player.your_plex_player
```
Configuration Options Explained

max_items: Controls the maximum number of items displayed in each section. This is useful for limiting the number of items shown in the UI, even if your sensor retrieves more data. Default is 10.
days_to_check: Applies to Sonarr and Radarr sections. Controls the number of days to look ahead for upcoming releases. Default is 60.
Section-specific max_items: You can override the global max_items setting for individual sections by adding [section_name]_max_items to your configuration. 
opacity: Controls how transparent the background images appear. A value between 0 and 1:

0.5 = 50% transparent (50% opaque)
0.7 = 30% transparent (70% opaque) - generally provides good readability
1.0 = 0% transparent (fully opaque)

radarr_release_types: # Exclude physical releases by not including them
  - Digital
  - Theatres
  - Physical

blur_radius: Optional setting to add a blur effect to background images, measured in pixels. Higher values create more blur.

Note: All entity configurations are optional. Use only what you need for your setup. The order of entities in your configuration determines the order they appear in the card.

Upcoming Features

🚀 Emby support maybe
🎬 Click-to-play functionality for Plex/Jellyfin (still pondering)
🔍 More integrations based on user feedback! 

Contributors

- 👤 Vansmak (aka Vanhacked)
- 👤 BMWfan


---

License

📜 MIT License


---
