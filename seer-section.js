import { BaseSection } from './base-section.js?v=20260403-20';

export class SeerSection extends BaseSection {
  constructor() {
    super('seer', 'Seer Content');
    this.sections = [
      { key: 'seer', title: 'Media Requests', titleKey: 'media_requests', entityKey: 'seer_entity', listClass: 'seer-list' },
      { key: 'seer_trending', title: 'Trending', titleKey: 'trending', entityKey: 'seer_trending_entity', listClass: 'seer-trending-list' },
      { key: 'seer_popular_movies', title: 'Popular Movies', titleKey: 'popular_movies', entityKey: 'seer_popular_movies_entity', listClass: 'seer-popular-movies-list' },
      { key: 'seer_popular_tv', title: 'Popular TV', titleKey: 'popular_tv', entityKey: 'seer_popular_tv_entity', listClass: 'seer-popular-tv-list' },
      { key: 'seer_discover', title: 'Discover', titleKey: 'discover', entityKey: 'seer_discover_entity', listClass: 'seer-discover-list' }
    ];

    this.statusMap = {
      1: { text: 'Pending', icon: 'mdi:clock-outline', class: 'status-pending' },
      2: { text: 'Approved', icon: 'mdi:check-circle-outline', class: 'status-approved' },
      3: { text: 'Declined', icon: 'mdi:close-circle-outline', class: 'status-declined' },
      4: { text: 'Available', icon: 'mdi:download-circle-outline', class: 'status-available' }
    };
  }

  update(cardInstance, entity) {
    this._currentCard = cardInstance;
    const entityId = entity.entity_id;
    const sectionConfig = this.sections.find(section =>
      cardInstance.config[section.entityKey] === entityId
    );

    if (!sectionConfig) return;

    const maxItems = cardInstance.config.seer_max_items || cardInstance.config.max_items || 10;
    let items = entity.attributes.data || [];
    items = items.slice(0, maxItems);

    const listElement = cardInstance.querySelector(`[data-list="${sectionConfig.key}"]`);
    if (!listElement) return;

    listElement.innerHTML = items.map((item, index) =>
      this.generateMediaItem(item, index, cardInstance.selectedType, cardInstance.selectedIndex, sectionConfig.key)
    ).join('');

    this.addClickHandlers(cardInstance, listElement, items, sectionConfig.key);

    if (entity.entity_id === cardInstance.config.seer_entity) {
      this.existingRequests = items;
    }
  }

  generateTemplate(config, cardInstance = this._currentCard) {
    return this.sections
      .filter(section => config[section.entityKey])
      .map(section => `
        <div class="section" data-section="${section.key}">
          <div class="section-header">
            <div class="section-header-content">
              <ha-icon class="section-toggle-icon" icon="mdi:chevron-down"></ha-icon>
              <div class="section-label">${this.t(cardInstance, section.titleKey, section.title)}</div>
            </div>
          </div>
          <div class="section-content">
            <div class="${section.listClass}" data-list="${section.key}"></div>
          </div>
        </div>
      `).join('');
  }

  generateMediaItem(item, index, selectedType, selectedIndex, sectionKey) {
    // Use any available image source
    const imageUrl = item.poster || item.fanart || item.banner || '/api/placeholder/400/600';
    
    return `
      <div class="media-item ${selectedType === sectionKey && index === selectedIndex ? 'selected' : ''}"
           data-type="${sectionKey}"
           data-index="${index}">
        <img src="${imageUrl}" alt="${item.title || item.name || ''}">
        <div class="media-item-title">${item.title || item.name || ''}</div>
      </div>
    `;
  }

  async checkIfRequested(cardInstance, item) {
    if (!this.existingRequests) {
      // Get requests from the seer entity
      const seerEntity = cardInstance.config.seer_entity;
      if (seerEntity && cardInstance._hass.states[seerEntity]) {
        this.existingRequests = cardInstance._hass.states[seerEntity].attributes.data || [];
      } else {
        this.existingRequests = [];
      }
    }

    // First try to match by TMDb ID
    const tmdbId = item.tmdbId || item.id;
    if (tmdbId) {
      return this.existingRequests.find(request => {
        const requestTmdbId = request.media?.tmdbId || request.tmdbId;
        return requestTmdbId === tmdbId;
      });
    }

    // If no TMDb ID, try to match by title and year (less reliable)
    if (item.title && item.year) {
      return this.existingRequests.find(request => 
        request.title === item.title && 
        request.year === item.year
      );
    }

    return null;  // No match found
  }

  async updateInfo(cardInstance, item, sectionKey) {
    if (!item) return;

    const title = item.title || item.name || '';
    const overview = item.overview || '';
    const year = item.year || '';
    const type = this._determineMediaType(item, sectionKey);
    
    const tmdbId = item.id;

    const mediaBackground = item.fanart || item.poster || '';
    const cardBackground = item.fanart || item.poster || '';
    
    if (mediaBackground) {
      cardInstance.background.style.backgroundImage = `url('${mediaBackground}')`;
      cardInstance.background.style.opacity = cardInstance.config.opacity || 0.7;
    }

    if (cardBackground && cardInstance.cardBackground) {
      cardInstance.cardBackground.style.backgroundImage = `url('${cardBackground}')`;
    }
    this.applyAdaptiveContrast(cardInstance, mediaBackground || cardBackground);

    // Check if item is already requested
    const existingRequest = await this.checkIfRequested(cardInstance, item);
    
    let actionButton = '';
    if (sectionKey !== 'seer') {
      if (existingRequest) {
        const statusInfo = this._getStatusInfo(existingRequest.status);
        actionButton = `
          <div class="request-button-container">
            <button class="request-button ${statusInfo.class}" disabled>
              <ha-icon icon="${statusInfo.icon}"></ha-icon>
              ${statusInfo.text}
            </button>
          </div>
        `;
      } else {
        actionButton = `
          <div class="request-button-container">
            <button class="request-button" onclick="this.dispatchEvent(new CustomEvent('seer-request', {
              bubbles: true,
              detail: {
                title: '${title.replace(/'/g, "\\'")}',
                year: '${year}',
                type: '${type}',
                tmdb_id: ${tmdbId},
                poster: '${(item.poster || '').replace(/'/g, "\\'")}',
                overview: '${overview.replace(/'/g, "\\'")}'
              }
            }))">
              <ha-icon icon="mdi:plus-circle-outline"></ha-icon>
              ${this.t(cardInstance, 'request', 'Request')}
            </button>
          </div>
        `;
      }
    }

    if (item.status) {
      const statusInfo = this._getStatusInfo(item.status);
      cardInstance.info.innerHTML = `
        <div class="title">${title}</div>
        <div class="details">
          <span class="status ${statusInfo.class}" onclick="this.dispatchEvent(new CustomEvent('change-status', {
            bubbles: true,
            detail: {
              title: '${title.replace(/'/g, "\\'")}',
              type: '${item.media_type || 'movie'}',
              request_id: ${item.request_id || 0}
            }
          }))">
            <ha-icon icon="${statusInfo.icon}"></ha-icon>
            ${statusInfo.text}
          </span>
          ${item.requested_by ? `${item.requested_by} - ${this.formatDate(item.requested_date)}` : ''}
        </div>
      `;
    } else {
  cardInstance.info.innerHTML = `
    <div class="title">${title}${year ? ` (${year})` : ''}</div>
    ${overview ? `<div class="overview">${overview}</div>` : ''}
    <div class="details">
      ${actionButton}
      ${type ? `<span class="type">${type}</span>` : ''}
    </div>
  `;
  }
  }

  _determineMediaType(item, sectionKey) {
    if (item.type) return item.type;
    if (sectionKey === 'seer_popular_movies' || item.media_type === 'movie') return 'movie';
    if (sectionKey === 'seer_popular_tv' || item.media_type === 'tv') return 'tv';
    if (item.first_air_date) return 'tv';
    if (item.release_date) return 'movie';
    return 'movie';
  }

  _showToast(cardInstance, message, kind = 'info') {
    if (!cardInstance || !message) return;
    const toast = document.createElement('div');
    toast.className = `mediarr-toast mediarr-toast-${kind}`;
    toast.textContent = message;
    cardInstance.appendChild(toast);
    requestAnimationFrame(() => toast.classList.add('show'));
    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => toast.remove(), 250);
    }, 2600);
  }

  _openStatusModal(title) {
    return new Promise((resolve) => {
      const modal = document.createElement('div');
      modal.className = 'mediarr-modal-overlay';
      modal.innerHTML = `
        <div class="mediarr-modal">
          <button class="mediarr-modal-close" type="button">
            <ha-icon icon="mdi:close"></ha-icon>
          </button>
          <p class="mediarr-modal-title">${this.t(this._currentCard, 'update_status_for', 'Update status for')} "<strong>${title}</strong>"</p>
          <select class="mediarr-modal-select" id="status-select">
            <option value="approve">${this.t(this._currentCard, 'approve', 'Approve')}</option>
            <option value="decline">${this.t(this._currentCard, 'decline', 'Decline')}</option>
            <option value="remove">${this.t(this._currentCard, 'remove', 'Remove')}</option>
          </select>
          <div class="mediarr-modal-actions">
            <button class="mediarr-btn mediarr-btn-confirm" type="button">${this.t(this._currentCard, 'confirm', 'Confirm')}</button>
            <button class="mediarr-btn mediarr-btn-cancel" type="button">${this.t(this._currentCard, 'cancel', 'Cancel')}</button>
          </div>
        </div>
      `;

      document.body.appendChild(modal);

      const close = () => {
        if (document.body.contains(modal)) {
          document.body.removeChild(modal);
        }
      };

      modal.querySelector('.mediarr-modal-close').onclick = () => {
        close();
        resolve(null);
      };
      modal.querySelector('.mediarr-btn-cancel').onclick = () => {
        close();
        resolve(null);
      };
      modal.querySelector('.mediarr-btn-confirm').onclick = () => {
        const value = modal.querySelector('#status-select').value;
        close();
        resolve(value);
      };
    });
  }

  _openSeasonModal(title) {
    return new Promise((resolve) => {
      const modal = document.createElement('div');
      modal.className = 'mediarr-modal-overlay';
      modal.innerHTML = `
        <div class="mediarr-modal">
          <button class="mediarr-modal-close" type="button">
            <ha-icon icon="mdi:close"></ha-icon>
          </button>
          <p class="mediarr-modal-title">${this.t(this._currentCard, 'select_season_for', 'Select season for')} "<strong>${title}</strong>"</p>
          <select class="mediarr-modal-select" id="season-select">
            <option value="first">${this.t(this._currentCard, 'first', 'First')}</option>
            <option value="latest">${this.t(this._currentCard, 'latest', 'Latest')}</option>
            <option value="all" selected>${this.t(this._currentCard, 'all', 'All')}</option>
          </select>
          <div class="mediarr-modal-actions">
            <button class="mediarr-btn mediarr-btn-confirm" type="button">${this.t(this._currentCard, 'confirm', 'Confirm')}</button>
            <button class="mediarr-btn mediarr-btn-cancel" type="button">${this.t(this._currentCard, 'cancel', 'Cancel')}</button>
          </div>
        </div>
      `;

      document.body.appendChild(modal);
      const close = () => {
        if (document.body.contains(modal)) {
          document.body.removeChild(modal);
        }
      };

      modal.querySelector('.mediarr-modal-close').onclick = () => {
        close();
        resolve(null);
      };
      modal.querySelector('.mediarr-btn-cancel').onclick = () => {
        close();
        resolve(null);
      };
      modal.querySelector('.mediarr-btn-confirm').onclick = () => {
        const value = modal.querySelector('#season-select').value;
        close();
        resolve(value);
      };
    });
  }

  addClickHandlers(cardInstance, listElement, items, sectionKey) {
    listElement.querySelectorAll('.media-item').forEach(item => {
      item.onclick = () => {
        const index = parseInt(item.dataset.index);
        cardInstance.selectedType = sectionKey;
        cardInstance.selectedIndex = index;
        this.updateInfo(cardInstance, items[index], sectionKey);

        cardInstance.querySelectorAll('.media-item').forEach(i => {
          i.classList.toggle('selected', 
            i.dataset.type === sectionKey && parseInt(i.dataset.index) === index);
        });
      };
    });
    
    if (!cardInstance._statusChangeHandlerAdded) {
      cardInstance.addEventListener('change-status', async (e) => {
        const { title, type, request_id } = e.detail;
        const new_status = await this._openStatusModal(title);
        if (!new_status) return;

        try {
          await window.document.querySelector('home-assistant')
            ?.hass.callService('mediarr', 'update_request', {
              name: title,
              type,
              new_status,
              request_id
            });

          if (typeof cardInstance.selectedIndex !== 'undefined' && cardInstance.selectedType) {
            const selectedItems = cardInstance._hass.states[cardInstance.config.seer_entity].attributes.data || [];
            this.updateInfo(cardInstance, selectedItems[cardInstance.selectedIndex], cardInstance.selectedType);
          }
          this._showToast(cardInstance, this.t(cardInstance, 'confirm', 'Confirm'), 'success');
        } catch (error) {
          this._showToast(cardInstance, error?.message || this.t(cardInstance, 'failed', 'Failed'), 'error');
        }
      });
    
      cardInstance._statusChangeHandlerAdded = true;
    }

    if (!cardInstance._seerRequestHandlerAdded) {
      cardInstance.addEventListener('seer-request', async (e) => {
        const { title, year, type, tmdb_id } = e.detail;
    
        try {
          const parsedTmdbId = parseInt(tmdb_id, 10);
          if (isNaN(parsedTmdbId)) {
            throw new Error('Invalid TMDB ID');
          }
    
          if (!this.existingRequests) {
            const seerEntity = cardInstance.config.seer_entity;
            if (seerEntity && cardInstance._hass.states[seerEntity]) {
              this.existingRequests = cardInstance._hass.states[seerEntity].attributes.data || [];
            } else {
              this.existingRequests = [];
            }
          }
    
          const existingRequest = this.existingRequests.find(request => {
            return request.title.toLowerCase() === title.toLowerCase() &&
                   (!year || request.year == year);
          });
    
          if (existingRequest && type.toUpperCase() === 'MOVIE') {
            this._showToast(cardInstance, `"${title}" ${this.t(cardInstance, 'already_requested', 'has already been requested.')}`, 'info');
            return;
          }
    
          let action, data;
    
          if (type.toUpperCase() === 'TV SHOW') {
            const season = await this._openSeasonModal(title);
          
            // Check if user cancelled
            if (season === null) {
              return; // Exit without making a request
            }
          
            data = { name: title, season };
            action = 'mediarr.submit_tv_request';
          }
    
            
            else if (type.toUpperCase() === 'MOVIE') {
            data = { name: title };
            action = 'mediarr.submit_movie_request';
          } else {
            throw new Error(this.t(cardInstance, 'unknown_media_type', 'Unknown media type'));
          }
    
          await window.document.querySelector('home-assistant')
            ?.hass.callService('mediarr', action.split('.')[1], data);
    
          const button = cardInstance.querySelector('.request-button');
          if (button) {
            button.innerHTML = `
              <ha-icon icon="mdi:check-circle-outline"></ha-icon>
              ${this.t(cardInstance, 'requested', 'Requested')}
            `;
            button.classList.add('status-approved');
            button.disabled = true;
          }
    
          this.existingRequests = null;
          this._showToast(cardInstance, this.t(cardInstance, 'requested', 'Requested'), 'success');
    
        } catch (error) {
          console.error('Error sending media request:', error);
          const button = cardInstance.querySelector('.request-button');
          if (button) {
            button.innerHTML = `
              <ha-icon icon="mdi:alert-circle"></ha-icon>
              ${this.t(cardInstance, 'failed', 'Failed')}
            `;
            button.classList.add('status-declined');
          }
          this._showToast(cardInstance, error?.message || this.t(cardInstance, 'failed', 'Failed'), 'error');
        }
      });
    
      cardInstance._seerRequestHandlerAdded = true;
    }
  }

  _getStatusInfo(statusCode) {
    const status = this.statusMap[statusCode] || {
      text: 'Unknown',
      icon: 'mdi:help-circle-outline',
      class: 'status-unknown'
    };
    const normalized = status.text.toLowerCase();
    return {
      ...status,
      text: this.t(this._currentCard, normalized, status.text)
    };
  }
}
