// main-card.js
import { PlexSection } from './plex-section.js?v=20260406-01';
import { JellyfinSection } from './jellyfin-section.js?v=20260406-01';
import { SonarrSection } from './sonarr-section.js?v=20260406-01';
import { RadarrSection } from './radarr-section.js?v=20260406-01';
import { SeerSection } from './seer-section.js?v=20260406-01';
import { TMDBSection } from './tmdb-section.js?v=20260406-01';
import { TraktSection } from './trakt-section.js?v=20260406-01';
import { Sonarr2Section } from './sonarr2-section.js?v=20260406-01';
import { Radarr2Section } from './radarr2-section.js?v=20260406-01';
import { ImmaculaterrSection } from './immaculaterr-section.js?v=20260406-01';
import { styles } from './styles.js?v=20260406-01';

const SECTION_ORDER = [
  'plex',
  'jellyfin',
  'sonarr',
  'sonarr2',
  'radarr',
  'radarr2',
  'seer',
  'tmdb',
  'trakt',
  'immaculaterr'
];

const SECTION_ENTITY_KEYS = {
  plex: ['plex_entity'],
  jellyfin: ['jellyfin_entity'],
  sonarr: ['sonarr_entity'],
  sonarr2: ['sonarr2_entity'],
  radarr: ['radarr_entity'],
  radarr2: ['radarr2_entity'],
  seer: [
    'seer_entity',
    'seer_trending_entity',
    'seer_discover_entity',
    'seer_popular_movies_entity',
    'seer_popular_tv_entity'
  ],
  tmdb: [
    'tmdb_entity',
    'tmdb_airing_today_entity',
    'tmdb_now_playing_entity',
    'tmdb_on_air_entity',
    'tmdb_upcoming_entity',
    'tmdb_popular_movies_entity',
    'tmdb_popular_tv_entity'
  ],
  trakt: ['trakt_entity'],
  immaculaterr: ['immaculaterr_movies_entity', 'immaculaterr_tv_entity']
};

function hasSectionEntities(config, sectionKey) {
  const entityKeys = SECTION_ENTITY_KEYS[sectionKey] || [];
  return entityKeys.some((entityKey) => {
    const value = config?.[entityKey];
    return typeof value === 'string' ? value.trim().length > 0 : Boolean(value);
  });
}

function deriveVisibleSections(config) {
  const explicit = Array.isArray(config?.visible_sections)
    ? config.visible_sections.filter((sectionKey) => SECTION_ORDER.includes(sectionKey))
    : [];

  if (explicit.length > 0) {
    return explicit;
  }

  return SECTION_ORDER.filter((sectionKey) => hasSectionEntities(config, sectionKey));
}


class MediarrCard extends HTMLElement {
  constructor() {
    super();
    this.selectedType = null;
    this.selectedIndex = 0;
    this.collapsedSections = new Set();
    this.progressInterval = null;
  
    this.sections = {
      plex: new PlexSection(),
      jellyfin: new JellyfinSection(),
      sonarr: new SonarrSection(),
      sonarr2: new Sonarr2Section(),
      radarr: new RadarrSection(),
      radarr2: new Radarr2Section(),
      seer: new SeerSection(),
      tmdb: new TMDBSection(),
      trakt: new TraktSection(),
      immaculaterr: new ImmaculaterrSection()
    };
  }

  async _getPlexClients(plexUrl, plexToken) {
    try {
      const response = await fetch(`${plexUrl}/clients?X-Plex-Token=${plexToken}`);
      if (!response.ok) throw new Error('Failed to fetch clients');
      
      const text = await response.text();
      const parser = new DOMParser();
      const xml = parser.parseFromString(text, 'text/xml');
      
      return Array.from(xml.querySelectorAll('Server')).map(server => ({
        name: server.getAttribute('name'),
        product: server.getAttribute('product'),
        version: server.getAttribute('version'),
        clientId: server.getAttribute('machineIdentifier')
      }));
    } catch (error) {
      console.error('Error fetching Plex clients:', error);
      return [];
    }
  }

  async _showClientSelector(mediaItem) {
    const plexUrl = this._formattedPlexUrl || this.config.plex_url;
    const plexToken = this.config.plex_token;
    
    if (!plexUrl || !plexToken) {
      console.error('Plex URL or token not available');
      return;
    }
    
    const clients = await this._getPlexClients(plexUrl, plexToken);
    const modal = this.querySelector('.client-modal');
    const clientList = this.querySelector('.client-list');
    
    if (clients.length === 0) {
      clientList.innerHTML = `
        <div style="padding: 16px; text-align: center;">
          <div style="opacity: 0.7; margin-bottom: 12px;">No Available Clients</div>
          <div style="font-size: 0.85em; color: var(--secondary-text-color);">
            Make sure your Plex clients are online and connected.
          </div>
        </div>
      `;
    } else {
      clientList.innerHTML = clients.map(client => `
        <div class="client-item" data-client-id="${client.clientId}">
          <ha-icon class="client-item-icon" icon="${this._getClientIcon(client.product)}"></ha-icon>
          <div class="client-item-info">
            <div class="client-item-name">${client.name}</div>
            <div class="client-item-details">${client.product} ${client.version}</div>
          </div>
        </div>
      `).join('');
      
      this.querySelectorAll('.client-item').forEach(item => {
        item.onclick = async () => {
          const clientId = item.dataset.clientId;
          const success = await this._playOnPlexClient(plexUrl, plexToken, clientId, mediaItem.key);
          if (success) {
            modal.classList.add('hidden');
          }
        };
      });
    }
    
    modal.classList.remove('hidden');
  }

  _getClientIcon(product) {
    const productMap = {
      'Plex for Android (TV)': 'mdi:android-tv',
      'Plex for Android': 'mdi:android',
      'Plex for iOS': 'mdi:apple',
      'Plex Web': 'mdi:web',
      'Plex HTPC': 'mdi:monitor',
      'Plex Media Player': 'mdi:play-circle',
      'Plex for Samsung': 'mdi:television',
      'Plex for LG': 'mdi:television',
      'Plex for Xbox': 'mdi:xbox',
      'Plex for PlayStation': 'mdi:playstation'
    };
    return productMap[product] || 'mdi:play-network';
  }

  _toggleSection(sectionKey) {
    const section = this.querySelector(`[data-section="${sectionKey}"]`);
    if (!section) return;

    const content = section.querySelector('.section-content');
    const icon = section.querySelector('.section-toggle-icon');
    
    if (this.collapsedSections.has(sectionKey)) {
      this.collapsedSections.delete(sectionKey);
      content.classList.remove('collapsed');
      icon.style.transform = 'rotate(0deg)';
    } else {
      this.collapsedSections.add(sectionKey);
      content.classList.add('collapsed');
      icon.style.transform = 'rotate(-90deg)';
    }
  }

  _updateNowPlaying(entity) {
    if (!entity || entity.state === 'unavailable' || entity.state === 'idle' || entity.state === 'off') {
      this.nowPlaying.classList.add('hidden');
      return;
    }

    this.nowPlaying.classList.remove('hidden');
    this.nowPlayingTitle.textContent = entity.attributes.media_title || '';
    this.nowPlayingSubtitle.textContent = entity.attributes.media_series_title || '';
    
    if (entity.attributes.media_position && entity.attributes.media_duration) {
      const progress = (entity.attributes.media_position / entity.attributes.media_duration) * 100;
      this.progressBar.style.width = `${progress}%`;
    }
    
    if (entity.attributes.entity_picture) {
      this.querySelector('.now-playing-background').style.backgroundImage = 
        `url('${entity.attributes.entity_picture}')`;
    }
  }

  initializeCard(hass) {
    const preferredSections = deriveVisibleSections(this.config);
    const orderedSections = preferredSections.filter((sectionKey) =>
      hasSectionEntities(this.config, sectionKey)
    );
  
    this.innerHTML =
      `<ha-card>
        <div class="card-background"></div>
        <div class="card-content">
          <div class="client-modal hidden">
            <div class="client-modal-content">
              <div class="client-modal-header">
                <div class="client-modal-title">Select Client</div>
                <ha-icon class="client-modal-close" icon="mdi:close"></ha-icon>
              </div>
              <div class="client-list"></div>
            </div>
          </div>
         
          <div class="now-playing hidden">
            <div class="now-playing-background"></div>
            <div class="now-playing-content">
              <div class="now-playing-info">
                <div class="now-playing-title"></div>
                <div class="now-playing-subtitle"></div>
              </div>
            </div>
            <div class="progress-bar">
              <div class="progress-bar-fill"></div>
            </div>
          </div>
         
          <div class="media-content">
            <div class="media-background"></div>
            <div class="media-info"></div>
            <div class="play-button hidden">
              <ha-icon class="play-icon" icon="mdi:play-circle-outline"></ha-icon>
            </div>
          </div>
         
          ${orderedSections
            .map(key => {
              const section = this.sections[key];
              // Always just call generateTemplate once, no special handling for tmdb needed
              return section.generateTemplate(this.config, this);
            })
            .join('')}            
             
        </div>
      </ha-card>`;
  
    // Initialize elements
    this.content = this.querySelector('.media-content');
    this.background = this.querySelector('.media-background');
    this.cardBackground = this.querySelector('.card-background');
    this.info = this.querySelector('.media-info');
    this.playButton = this.querySelector('.play-button');
    this.nowPlaying = this.querySelector('.now-playing');
    this.nowPlayingTitle = this.querySelector('.now-playing-title');
    this.nowPlayingSubtitle = this.querySelector('.now-playing-subtitle');
    this.progressBar = this.querySelector('.progress-bar-fill');
   
    // Replace the background setting section with:
    const firstSectionKey = orderedSections[0];
    const section = this.sections[firstSectionKey];
    let initialEntityId = this.config[`${firstSectionKey}_entity`];
    let initialSelectedType = firstSectionKey;

    if (firstSectionKey === 'tmdb') {
      const entityCandidates = [
        ['tmdb_entity', 'tmdb'],
        ['tmdb_airing_today_entity', 'tmdb_airing_today'],
        ['tmdb_now_playing_entity', 'tmdb_now_playing'],
        ['tmdb_on_air_entity', 'tmdb_on_air'],
        ['tmdb_upcoming_entity', 'tmdb_upcoming'],
        ['tmdb_popular_movies_entity', 'tmdb_popular_movies'],
        ['tmdb_popular_tv_entity', 'tmdb_popular_tv']
      ];
      const initialEntity = entityCandidates.find(([entityKey]) => this.config[entityKey] && hass.states[this.config[entityKey]]);
      if (initialEntity) {
        initialEntityId = this.config[initialEntity[0]];
        initialSelectedType = initialEntity[1];
      }
    } else if (firstSectionKey === 'seer') {
      const entityCandidates = [
        ['seer_entity', 'seer'],
        ['seer_trending_entity', 'seer_trending'],
        ['seer_discover_entity', 'seer_discover'],
        ['seer_popular_movies_entity', 'seer_popular_movies'],
        ['seer_popular_tv_entity', 'seer_popular_tv']
      ];
      const initialEntity = entityCandidates.find(([entityKey]) => this.config[entityKey] && hass.states[this.config[entityKey]]);
      if (initialEntity) {
        initialEntityId = this.config[initialEntity[0]];
        initialSelectedType = initialEntity[1];
      }
    } else if (firstSectionKey === 'immaculaterr') {
      const entityCandidates = [
        ['immaculaterr_movies_entity', 'immaculaterr_movies'],
        ['immaculaterr_tv_entity', 'immaculaterr_tv']
      ];
      const initialEntity = entityCandidates.find(([entityKey]) => this.config[entityKey] && hass.states[this.config[entityKey]]);
      if (initialEntity) {
        initialEntityId = this.config[initialEntity[0]];
        initialSelectedType = initialEntity[1];
      }
    }

    if (initialEntityId && hass.states[initialEntityId]) {
      const state = hass.states[initialEntityId];
      if (state.attributes.data?.[0]) {
        const data = state.attributes.data[0];
        
        // Set initial selection
        this.selectedType = initialSelectedType;
        this.selectedIndex = 0;
        
        // Use section's update logic for initial background
        section.updateInfo(this, data, initialSelectedType);
        
        // Force immediate background update
        this._lastBackgroundUpdate = 0;
      }
    }

    
    // Add styles
    const style = document.createElement('style');
    style.textContent = styles;
    this.appendChild(style);

    // Initialize click handlers
    this._initializeEventListeners(hass);
  }

  _initializeEventListeners(hass) {
    // Section headers
    this.querySelectorAll('.section-header').forEach(header => {
      header.onclick = () => {
        const sectionKey = header.closest('[data-section]').dataset.section;
        this._toggleSection(sectionKey);
      };
    });

    // Play button
    if (this.playButton) {
      this.playButton.onclick = async (e) => {
        e.stopPropagation();
        if (this.selectedType === 'plex' && this.config.plex_entity) {
          const plexEntity = hass.states[this.config.plex_entity];
          if (plexEntity?.attributes?.data) {
            const mediaItem = plexEntity.attributes.data[this.selectedIndex];
            if (mediaItem?.key) {
              await this._showClientSelector(mediaItem);
            }
          }
        }
      };
    }

    // Modal close
    const modal = this.querySelector('.client-modal');
    const closeButton = this.querySelector('.client-modal-close');
    
    if (closeButton) {
      closeButton.onclick = () => modal.classList.add('hidden');
    }
    
    if (modal) {
      modal.onclick = (e) => {
        if (e.target === modal) modal.classList.add('hidden');
      };
    }
  }

  set hass(hass) {
    this._hass = hass;
    if (!this.content) {
      this.initializeCard(hass);
    }

    if (this.config.media_player_entity) {
      this._updateNowPlaying(hass.states[this.config.media_player_entity]);
    }

    Object.entries(this.sections).forEach(([key, section]) => {
      if (key === 'tmdb') {
        const entities = [
          'tmdb_entity', 
          'tmdb_airing_today_entity', 
          'tmdb_now_playing_entity', 
          'tmdb_on_air_entity', 
          'tmdb_upcoming_entity',
          'tmdb_popular_movies_entity',
          'tmdb_popular_tv_entity'
        ];
        entities.forEach(entityKey => {
          const entityId = this.config[entityKey];
          if (entityId && hass.states[entityId]) {
            section.update(this, hass.states[entityId]);
          }
        });
      } else if (key === 'seer') {
        // Keep Seer handling as is since it's working
        const entities = ['seer_entity', 'seer_trending_entity', 'seer_discover_entity', 'seer_popular_movies_entity', 'seer_popular_tv_entity'];
        entities.forEach(entityKey => {
          const entityId = this.config[entityKey];
          if (entityId && hass.states[entityId]) {
            section.update(this, hass.states[entityId]);
          }
        });
      } else if (key === 'immaculaterr') {
        const entities = ['immaculaterr_movies_entity', 'immaculaterr_tv_entity'];
        entities.forEach(entityKey => {
          const entityId = this.config[entityKey];
          if (entityId && hass.states[entityId]) {
            section.update(this, hass.states[entityId]);
          }
        });
      } else {
        const entityId = this.config[`${key}_entity`];
        if (entityId && hass.states[entityId]) {
          section.update(this, hass.states[entityId]);
        }
      }
    });
  }

  setConfig(config) {
    const normalizedVisibleSections = deriveVisibleSections(config);
    const hasEntity = SECTION_ORDER.some((sectionKey) => hasSectionEntities(config, sectionKey));
  
    if (!hasEntity) {
      throw new Error('Please define at least one media entity');
    }
    
    // Set defaults for the new options
    this.config = {
      max_items: 10,            // Default max items if not specified
      days_to_check: 60,        // Default days to check if not specified
      radarr_release_types: ['Digital', 'Theaters'], // Default to digital and theatrical, exclude physical
      radarr2_release_types: ['Digital', 'Theaters'],
      ...config,                // This will override defaults with user config
      visible_sections: normalizedVisibleSections
    };
    // Section-specific overrides
    ['plex', 'jellyfin', 'sonarr', 'sonarr2', 'radarr', 'radarr2', 'seer', 'tmdb', 'trakt', 'immaculaterr'].forEach(section => {
      this.config[`${section}_max_items`] = this.config[`${section}_max_items`] || this.config.max_items;
    });
    
    ['sonarr', 'sonarr2', 'radarr', 'radarr2'].forEach(section => {
      this.config[`${section}_days_to_check`] = this.config[`${section}_days_to_check`] || this.config.days_to_check;
    });
    
    if (config.plex_url && !config.plex_url.endsWith('/')) {
      this._formattedPlexUrl = config.plex_url + '/';
    }
    if (config.jellyfin_url && !config.jellyfin_url.endsWith('/')) {
      this._formattedJellyfinUrl = config.jellyfin_url + '/';
    }
  }
    
  static getConfigElement() {
    return document.createElement('mediarr-card-editor');
  }

  static getStubConfig() {
    return {
      // Default global values
      max_items: 10,
      days_to_check: 60,
      visible_sections: ['tmdb', 'seer', 'immaculaterr'],
      // Release type filtering
      radarr_release_types: ['Digital', 'Theaters'],
      radarr2_release_types: ['Digital', 'Theaters'], 
      // Section-specific overrides
      tmdb_max_items: 15,
      seer_max_items: 10,
      plex_max_items: 10,
      sonarr_max_items: 10,
      sonarr_days_to_check: 60,
      radarr_max_items: 10,
      radarr_days_to_check: 60,
      
      // Existing config
      tmdb_entity: 'sensor.tmdb_mediarr',
      tmdb_airing_today_entity: 'sensor.tmdb_mediarr_airing_today',
      tmdb_now_playing_entity: 'sensor.tmdb_mediarr_now_playing',
      tmdb_on_air_entity: 'sensor.tmdb_mediarr_on_air',
      tmdb_upcoming_entity: 'sensor.tmdb_mediarr_upcoming',
      plex_entity: 'sensor.plex_mediarr',
      jellyfin_entity: 'sensor.jellyfin_mediarr',
      sonarr_entity: 'sensor.sonarr_mediarr',
      sonarr_label: 'Upcoming Shows',
      sonarr2_entity: 'sensor.sonarr2_mediarr',
      sonarr2_label: 'Sonarr2 Shows',
      radarr_entity: 'sensor.radarr_mediarr',
      radarr_label: 'Upcoming Movies',
      radarr2_entity: 'sensor.radarr2_mediarr',
      radarr2_label: 'Radarr2 Movies',
      seer_entity: 'sensor.seer_mediarr',
      seer_trending_entity: 'sensor.seer_mediarr_trending',
      seer_discover_entity: 'sensor.seer_mediarr_discover',
      seer_popular_movies_entity: 'sensor.seer_mediarr_popular_movies',
      seer_popular_tv_entity: 'sensor.seer_mediarr_popular_tv',
      immaculaterr_movies_entity: 'sensor.immaculaterr_mediarr_movies',
      immaculaterr_tv_entity: 'sensor.immaculaterr_mediarr_tv',
      trakt_entity: 'sensor.trakt_mediarr',
      media_player_entity: '',
      opacity: 0.7,
      blur_radius: 0
    };
  }
}

const EDITOR_SECTION_DEFINITIONS = [
  {
    key: 'tmdb',
    label: 'TMDB',
    fields: [
      { key: 'tmdb_entity', label: 'Trending Sensor' },
      { key: 'tmdb_airing_today_entity', label: 'Airing Today Sensor' },
      { key: 'tmdb_now_playing_entity', label: 'Now Playing Sensor' },
      { key: 'tmdb_on_air_entity', label: 'On Air Sensor' },
      { key: 'tmdb_upcoming_entity', label: 'Upcoming Sensor' },
      { key: 'tmdb_popular_movies_entity', label: 'Popular Movies Sensor' },
      { key: 'tmdb_popular_tv_entity', label: 'Popular TV Sensor' }
    ]
  },
  {
    key: 'seer',
    label: 'Seer',
    fields: [
      { key: 'seer_entity', label: 'Requests Sensor' },
      { key: 'seer_trending_entity', label: 'Trending Sensor' },
      { key: 'seer_discover_entity', label: 'Discover Sensor' },
      { key: 'seer_popular_movies_entity', label: 'Popular Movies Sensor' },
      { key: 'seer_popular_tv_entity', label: 'Popular TV Sensor' }
    ]
  },
  {
    key: 'immaculaterr',
    label: 'Immaculaterr',
    fields: [
      { key: 'immaculaterr_movies_entity', label: 'Movies Sensor' },
      { key: 'immaculaterr_tv_entity', label: 'TV Sensor' }
    ]
  },
  { key: 'plex', label: 'Plex', fields: [{ key: 'plex_entity', label: 'Plex Sensor' }] },
  { key: 'jellyfin', label: 'Jellyfin', fields: [{ key: 'jellyfin_entity', label: 'Jellyfin Sensor' }] },
  { key: 'sonarr', label: 'Sonarr', fields: [{ key: 'sonarr_entity', label: 'Sonarr Sensor' }] },
  { key: 'sonarr2', label: 'Sonarr 2', fields: [{ key: 'sonarr2_entity', label: 'Sonarr 2 Sensor' }] },
  { key: 'radarr', label: 'Radarr', fields: [{ key: 'radarr_entity', label: 'Radarr Sensor' }] },
  { key: 'radarr2', label: 'Radarr 2', fields: [{ key: 'radarr2_entity', label: 'Radarr 2 Sensor' }] },
  { key: 'trakt', label: 'Trakt', fields: [{ key: 'trakt_entity', label: 'Trakt Sensor' }] }
];

const DEFAULT_EDITOR_VISIBLE_SECTIONS = ['tmdb', 'seer', 'immaculaterr'];

const EDITOR_FIELD_MATCHERS = {
  plex_entity: [(entityId) => entityId.includes('plex_mediarr')],
  jellyfin_entity: [(entityId) => entityId.includes('jellyfin_mediarr')],
  sonarr_entity: [(entityId) => entityId.includes('sonarr_mediarr') && !entityId.includes('sonarr2_mediarr')],
  sonarr2_entity: [(entityId) => entityId.includes('sonarr2_mediarr')],
  radarr_entity: [(entityId) => entityId.includes('radarr_mediarr') && !entityId.includes('radarr2_mediarr')],
  radarr2_entity: [(entityId) => entityId.includes('radarr2_mediarr')],
  trakt_entity: [(entityId) => entityId.includes('trakt_mediarr')],
  seer_entity: [
    (entityId) =>
      entityId.includes('seer_mediarr') &&
      !entityId.includes('trending') &&
      !entityId.includes('discover') &&
      !entityId.includes('popular_movies') &&
      !entityId.includes('popular_tv')
  ],
  seer_trending_entity: [(entityId) => entityId.includes('seer_mediarr_trending')],
  seer_discover_entity: [(entityId) => entityId.includes('seer_mediarr_discover')],
  seer_popular_movies_entity: [(entityId) => entityId.includes('seer_mediarr_popular_movies')],
  seer_popular_tv_entity: [(entityId) => entityId.includes('seer_mediarr_popular_tv')],
  tmdb_entity: [(entityId) => entityId === 'sensor.tmdb_mediarr' || entityId.includes('tmdb_mediarr_trending')],
  tmdb_airing_today_entity: [(entityId) => entityId.includes('tmdb_mediarr_airing_today')],
  tmdb_now_playing_entity: [(entityId) => entityId.includes('tmdb_mediarr_now_playing')],
  tmdb_on_air_entity: [(entityId) => entityId.includes('tmdb_mediarr_on_air')],
  tmdb_upcoming_entity: [(entityId) => entityId.includes('tmdb_mediarr_upcoming')],
  tmdb_popular_movies_entity: [(entityId) => entityId.includes('tmdb_mediarr_popular_movies')],
  tmdb_popular_tv_entity: [(entityId) => entityId.includes('tmdb_mediarr_popular_tv')],
  immaculaterr_movies_entity: [
    (entityId) => entityId.includes('immaculaterr_mediarr_movies'),
    (entityId) => entityId.includes('immaculaterr_mediarr_movie')
  ],
  immaculaterr_tv_entity: [
    (entityId) => entityId.includes('immaculaterr_mediarr_tv'),
    (entityId) => entityId.includes('immaculaterr_mediarr_series')
  ]
};

const fireEditorEvent = (node, type, detail = {}) =>
  node.dispatchEvent(
    new CustomEvent(type, {
      detail,
      bubbles: true,
      composed: true
    })
  );

class MediarrCardEditor extends HTMLElement {
  setConfig(config) {
    this._config = { ...config };
    if (!Array.isArray(this._config.visible_sections) || this._config.visible_sections.length === 0) {
      this._config.visible_sections = this._deriveVisibleSections(this._config);
    }
    this._render();
  }

  set hass(hass) {
    this._hass = hass;
    this._render();
  }

  _getActiveSensorIds() {
    if (!this._hass?.states) return [];
    return Object.entries(this._hass.states)
      .filter(([entityId, stateObj]) => {
        if (!entityId.startsWith('sensor.')) return false;
        if (!stateObj) return false;
        return stateObj.state !== 'unavailable';
      })
      .map(([entityId]) => entityId)
      .sort();
  }

  _getEntityLabel(entityId) {
    const stateObj = this._hass?.states?.[entityId];
    const friendly = stateObj?.attributes?.friendly_name;
    return friendly ? `${friendly} (${entityId})` : entityId;
  }

  _getFieldCandidates(fieldKey) {
    const activeSensorIds = this._getActiveSensorIds();
    const matchers = EDITOR_FIELD_MATCHERS[fieldKey] || [];
    const candidates = activeSensorIds.filter((entityId) =>
      matchers.some((matcher) => matcher(entityId))
    );

    const configured = (this._config?.[fieldKey] || '').toString().trim();
    if (configured && !candidates.includes(configured)) {
      candidates.unshift(configured);
    }

    return [...new Set(candidates)];
  }

  _getAvailableSections() {
    return EDITOR_SECTION_DEFINITIONS
      .map((section) => {
        const fields = section.fields
          .map((field) => ({
            ...field,
            candidates: this._getFieldCandidates(field.key)
          }))
          .filter((field) => field.candidates.length > 0);

        const hasConfiguredField = section.fields.some((field) =>
          (this._config?.[field.key] || '').toString().trim().length > 0
        );

        if (fields.length === 0 && !hasConfiguredField) {
          return null;
        }

        if (fields.length === 0 && hasConfiguredField) {
          return {
            ...section,
            fields: section.fields.map((field) => ({
              ...field,
              candidates: this._getFieldCandidates(field.key)
            }))
          };
        }

        return { ...section, fields };
      })
      .filter(Boolean);
  }

  _deriveVisibleSections(config) {
    const visible = this._getAvailableSections()
      .filter((section) =>
        section.fields.some((field) => (config[field.key] || '').toString().trim().length > 0)
      )
      .map((section) => section.key);

    if (visible.length > 0) return visible;
    const availableDefault = this._getAvailableSections().map((section) => section.key);
    if (availableDefault.length > 0) {
      return DEFAULT_EDITOR_VISIBLE_SECTIONS.filter((sectionKey) =>
        availableDefault.includes(sectionKey)
      );
    }
    return [...DEFAULT_EDITOR_VISIBLE_SECTIONS];
  }

  _isSectionVisible(sectionKey) {
    const visibleSections = Array.isArray(this._config?.visible_sections)
      ? this._config.visible_sections
      : [];
    return visibleSections.includes(sectionKey);
  }

  _updateConfigValue(key, value) {
    const nextConfig = { ...(this._config || {}) };
    if (value === '' || value === null || value === undefined) {
      delete nextConfig[key];
    } else {
      nextConfig[key] = value;
    }
    this._config = nextConfig;
    fireEditorEvent(this, 'config-changed', { config: nextConfig });
  }

  _toggleSection(sectionKey, enabled) {
    const visibleSections = Array.isArray(this._config?.visible_sections)
      ? [...this._config.visible_sections]
      : this._deriveVisibleSections(this._config || {});

    const hasSection = visibleSections.includes(sectionKey);
    if (enabled && !hasSection) {
      const order = EDITOR_SECTION_DEFINITIONS.map((section) => section.key);
      visibleSections.push(sectionKey);
      visibleSections.sort((a, b) => order.indexOf(a) - order.indexOf(b));
    }
    if (!enabled && hasSection) {
      const index = visibleSections.indexOf(sectionKey);
      visibleSections.splice(index, 1);
    }

    this._updateConfigValue('visible_sections', visibleSections);
    this._render();
  }

  _render() {
    if (!this._config) return;
    const availableSections = this._getAvailableSections();

    this.innerHTML = `
      <style>
        .editor-root { display: grid; gap: 16px; padding: 8px 0; }
        .editor-card { border: 1px solid var(--divider-color); border-radius: 10px; padding: 12px; }
        .editor-title { font-weight: 600; margin-bottom: 8px; }
        .editor-subtitle { font-size: 13px; opacity: 0.8; margin-bottom: 10px; }
        .module-list { display: grid; gap: 10px; }
        .module-row { border: 1px solid var(--divider-color); border-radius: 8px; padding: 10px; }
        .module-toggle { display: flex; align-items: center; gap: 8px; font-weight: 500; }
        .field-list { display: grid; gap: 10px; margin-top: 10px; }
        .field-label { font-size: 12px; opacity: 0.75; margin-bottom: 4px; }
        .entity-picker { width: 100%; }
        .global-grid { display: grid; gap: 10px; grid-template-columns: repeat(auto-fit, minmax(170px, 1fr)); }
        .global-field input { width: 100%; box-sizing: border-box; padding: 8px; border: 1px solid var(--divider-color); border-radius: 6px; background: var(--card-background-color); color: var(--primary-text-color); }
      </style>
      <div class="editor-root">
        <div class="editor-card">
          <div class="editor-title">Visible Sections</div>
          <div class="editor-subtitle">Only active Mediarr sensors are shown here.</div>
          <div class="module-list">
            ${availableSections.map((section) => `
              <div class="module-row">
                <label class="module-toggle">
                  <input type="checkbox" data-section-toggle="${section.key}" ${this._isSectionVisible(section.key) ? 'checked' : ''}>
                  <span>${section.label}</span>
                </label>
                ${this._isSectionVisible(section.key) ? `
                  <div class="field-list">
                    ${section.fields.map((field) => `
                      <div>
                        <div class="field-label">${field.label}</div>
                        <select class="entity-picker" data-entity-select="${field.key}">
                          <option value="">Not configured</option>
                          ${field.candidates.map((entityId) => `
                            <option value="${entityId}" ${this._config[field.key] === entityId ? 'selected' : ''}>
                              ${this._getEntityLabel(entityId)}
                            </option>
                          `).join('')}
                        </select>
                      </div>
                    `).join('')}
                  </div>
                ` : ''}
              </div>
            `).join('')}
          </div>
        </div>

        <div class="editor-card">
          <div class="editor-title">General Options</div>
          <div class="global-grid">
            <div class="global-field">
              <div class="field-label">Media Player Entity</div>
              <ha-entity-picker class="entity-picker" data-entity-key="media_player_entity" include-domains="media_player"></ha-entity-picker>
            </div>
            <div class="global-field">
              <div class="field-label">Default Max Items</div>
              <input type="number" min="1" max="100" data-number-key="max_items" value="${this._config.max_items ?? 10}">
            </div>
            <div class="global-field">
              <div class="field-label">Default Days To Check</div>
              <input type="number" min="1" max="365" data-number-key="days_to_check" value="${this._config.days_to_check ?? 60}">
            </div>
            <div class="global-field">
              <div class="field-label">Overlay Opacity (0-1)</div>
              <input type="number" min="0" max="1" step="0.05" data-number-key="opacity" value="${this._config.opacity ?? 0.7}">
            </div>
            <div class="global-field">
              <div class="field-label">Blur Radius</div>
              <input type="number" min="0" max="30" data-number-key="blur_radius" value="${this._config.blur_radius ?? 0}">
            </div>
          </div>
        </div>
      </div>
    `;

    if (availableSections.length === 0) {
      this.querySelector('.module-list').innerHTML = `
        <div class="module-row">
          <div class="editor-subtitle">No active Mediarr sensors found. Configure sensors first, then reopen the editor.</div>
        </div>
      `;
    }

    this.querySelectorAll('[data-section-toggle]').forEach((checkbox) => {
      checkbox.addEventListener('change', (event) => {
        this._toggleSection(event.currentTarget.dataset.sectionToggle, Boolean(event.currentTarget.checked));
      });
    });

    this.querySelectorAll('[data-entity-select]').forEach((select) => {
      const key = select.dataset.entitySelect;
      select.addEventListener('change', (event) => {
        this._updateConfigValue(key, event.currentTarget.value || '');
      });
    });

    this.querySelectorAll('ha-entity-picker').forEach((picker) => {
      const key = picker.dataset.entityKey;
      picker.hass = this._hass;
      picker.value = this._config[key] || '';
      picker.addEventListener('value-changed', (event) => {
        this._updateConfigValue(key, event.detail?.value || '');
      });
    });

    this.querySelectorAll('[data-number-key]').forEach((input) => {
      input.addEventListener('change', (event) => {
        const key = event.currentTarget.dataset.numberKey;
        const rawValue = event.currentTarget.value;
        const parsed = rawValue === '' ? '' : Number(rawValue);
        this._updateConfigValue(key, Number.isFinite(parsed) ? parsed : '');
      });
    });
  }
}

customElements.define('mediarr-card', MediarrCard);
customElements.define('mediarr-card-editor', MediarrCardEditor);

window.customCards = window.customCards || [];
window.customCards.push({
  type: "mediarr-card",
  name: "Mediarr Card",
  description: "A modular card for displaying media from various sources",
  preview: true
});
