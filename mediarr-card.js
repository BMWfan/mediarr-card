// main-card.js
import { PlexSection } from './plex-section.js?v=20260403-20';
import { JellyfinSection } from './jellyfin-section.js?v=20260403-20';
import { SonarrSection } from './sonarr-section.js?v=20260403-20';
import { RadarrSection } from './radarr-section.js?v=20260403-20';
import { SeerSection } from './seer-section.js?v=20260403-20';
import { TMDBSection } from './tmdb-section.js?v=20260403-20';
import { TraktSection } from './trakt-section.js?v=20260403-20';
import { Sonarr2Section } from './sonarr2-section.js?v=20260403-20';
import { Radarr2Section } from './radarr2-section.js?v=20260403-20';
import { ImmaculaterrSection } from './immaculaterr-section.js?v=20260405-01';
import { styles } from './styles.js?v=20260405-01';


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
    // Get the order of configuration keys from the user's configuration
    const configKeys = Object.keys(this.config)
      .filter(key => 
        key.endsWith('_entity') && 
        this.config[key] && 
        this.config[key].length > 0
      );
    
    // Build sections in the order specified by the configuration
    const orderedSections = configKeys.reduce((sections, key) => {
      let sectionKey = null;
     
      if (key === 'plex_entity') sectionKey = 'plex';
      else if (key === 'jellyfin_entity') sectionKey = 'jellyfin';
      else if (key === 'sonarr_entity') sectionKey = 'sonarr';
      else if (key === 'radarr_entity') sectionKey = 'radarr';
      else if (key === 'sonarr2_entity') sectionKey = 'sonarr2';
      else if (key === 'radarr2_entity') sectionKey = 'radarr2';
      else if (key === 'seer_entity') sectionKey = 'seer';
      else if (key === 'trakt_entity') sectionKey = 'trakt';
      else if (key === 'immaculaterr_movies_entity' || key === 'immaculaterr_tv_entity') sectionKey = 'immaculaterr';
      else if (key.startsWith('tmdb_')) sectionKey = 'tmdb';
 
      if (sectionKey && !sections.includes(sectionKey)) {
        sections.push(sectionKey);
      }
      return sections;
    }, []);
  
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
    const requiredEntities = {
      tmdb: [
        'tmdb_entity',
        'tmdb_airing_today_entity',
        'tmdb_now_playing_entity',
        'tmdb_on_air_entity',
        'tmdb_upcoming_entity',
        'tmdb_popular_movies_entity',
        'tmdb_popular_tv_entity'
      ],
      seer: [
        'seer_entity',
        'seer_trending_entity',
        'seer_popular_movies_entity',
        'seer_popular_tv_entity',
        'seer_discover_entity'
      ],
      immaculaterr: [
        'immaculaterr_movies_entity',
        'immaculaterr_tv_entity'
      ]
    };

    const hasEntity = Object.keys(this.sections).some(key => {
      if (requiredEntities[key]) {
        return requiredEntities[key].some(entityKey => config[entityKey]);
      }
      return config[`${key}_entity`];
    });
  
    if (!hasEntity) {
      throw new Error('Please define at least one media entity');
    }
    
    // Set defaults for the new options
    this.config = {
      max_items: 10,            // Default max items if not specified
      days_to_check: 60,        // Default days to check if not specified
      radarr_release_types: ['Digital', 'Theaters'], // Default to digital and theatrical, exclude physical
      radarr2_release_types: ['Digital', 'Theaters'],
      ...config                 // This will override defaults with user config
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
    

  static getStubConfig() {
    return {
      // Default global values
      max_items: 10,
      days_to_check: 60,
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

customElements.define('mediarr-card', MediarrCard);

window.customCards = window.customCards || [];
window.customCards.push({
  type: "mediarr-card",
  name: "Mediarr Card",
  description: "A modular card for displaying media from various sources",
  preview: true
});
