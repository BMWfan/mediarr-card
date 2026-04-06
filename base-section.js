// base-section.js
export class BaseSection {
  static POSTER_PLACEHOLDER =
    'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 300 450%22%3E%3Cdefs%3E%3ClinearGradient id=%22g%22 x1=%220%25%22 y1=%220%25%22 x2=%220%25%22 y2=%22100%25%22%3E%3Cstop offset=%220%25%22 stop-color=%22%23313a46%22/%3E%3Cstop offset=%22100%25%22 stop-color=%22%23141a23%22/%3E%3C/linearGradient%3E%3C/defs%3E%3Crect width=%22300%22 height=%22450%22 fill=%22url(%23g)%22/%3E%3Ctext x=%22150%22 y=%22230%22 fill=%22%23d5dbe3%22 font-family=%22Arial,sans-serif%22 font-size=%2222%22 text-anchor=%22middle%22%3ENo%20Poster%3C/text%3E%3C/svg%3E';

  constructor(key, title) {
    this.key = key;
    this.title = title;
    this._lastBackgroundUpdate = 0;
  }

  _labels(cardInstance) {
    const language = (cardInstance?._hass?.language || 'en').toLowerCase();
    const isDe = language.startsWith('de');
    const defaults = isDe
      ? {
          request: 'Anfragen',
          requested: 'Angefragt',
          failed: 'Fehlgeschlagen',
          sonarr_upcoming_shows: 'Sonarr',
          sonarr2_upcoming_shows: 'Sonarr 2',
          radarr_upcoming_movies: 'Radarr',
          radarr2_upcoming_movies: 'Radarr 2',
          plex_recently_added: 'K\u00fcrzlich hinzugef\u00fcgt auf Plex',
          jellyfin_recently_added: 'Jellyfin K\u00fcrzlich hinzugef\u00fcgt',
          trakt_popular: 'Trakt Beliebt',
          media_requests: 'Medienanfragen',
          trending: 'Trends',
          popular_movies: 'Beliebte Filme',
          popular_tv: 'Beliebte Serien',
          discover: 'Entdecken',
          trending_on_tmdb: 'Trends auf TMDB',
          airing_today: 'Heute ausgestrahlt',
          now_playing: 'Jetzt im Kino',
          on_air: 'On Air',
          upcoming: 'Demn\u00e4chst',
          popular_tv_shows: 'Beliebte TV-Serien',
          cancel: 'Abbrechen',
          confirm: 'Best\u00e4tigen',
          remove: 'Entfernen',
          approve: 'Freigeben',
          decline: 'Ablehnen',
          update_status_for: 'Status \u00e4ndern f\u00fcr',
          select_season_for: 'Staffel ausw\u00e4hlen f\u00fcr',
          no_upcoming_shows: 'Keine kommenden Serien',
          no_upcoming_movies: 'Keine kommenden Filme',
          no_recent_media: 'Keine k\u00fcrzlich hinzugef\u00fcgten Medien',
          pending: 'Ausstehend',
          approved: 'Freigegeben',
          declined: 'Abgelehnt',
          available: 'Verf\u00fcgbar',
          unknown: 'Unbekannt',
          released: 'Ver\u00f6ffentlicht',
          airs: 'L\u00e4uft',
          on: 'auf',
          movie: 'Film',
          first: 'Erste',
          latest: 'Neueste',
          all: 'Alle',
          unknown_media_type: 'Unbekannter Medientyp',
          already_requested: 'wurde bereits angefragt.'
        }
      : {
          request: 'Request',
          requested: 'Requested',
          failed: 'Failed',
          sonarr_upcoming_shows: 'Sonarr',
          sonarr2_upcoming_shows: 'Sonarr 2',
          radarr_upcoming_movies: 'Radarr',
          radarr2_upcoming_movies: 'Radarr 2',
          plex_recently_added: 'Plex Recently Added',
          jellyfin_recently_added: 'Jellyfin Recently Added',
          trakt_popular: 'Trakt Popular',
          media_requests: 'Media Requests',
          trending: 'Trending',
          popular_movies: 'Popular Movies',
          popular_tv: 'Popular TV',
          discover: 'Discover',
          trending_on_tmdb: 'Trending on TMDB',
          airing_today: 'Airing Today',
          now_playing: 'Now Playing',
          on_air: 'On Air',
          upcoming: 'Upcoming',
          popular_tv_shows: 'Popular TV Shows',
          cancel: 'Cancel',
          confirm: 'Confirm',
          remove: 'Remove',
          approve: 'Approve',
          decline: 'Decline',
          update_status_for: 'Update status for',
          select_season_for: 'Select season for',
          no_upcoming_shows: 'No upcoming shows',
          no_upcoming_movies: 'No upcoming movies',
          no_recent_media: 'No recently added media',
          pending: 'Pending',
          approved: 'Approved',
          declined: 'Declined',
          available: 'Available',
          unknown: 'Unknown',
          released: 'Released',
          airs: 'Airs',
          on: 'on',
          movie: 'Movie',
          first: 'First',
          latest: 'Latest',
          all: 'All',
          unknown_media_type: 'Unknown media type',
          already_requested: 'has already been requested.'
        };

    const overrides = cardInstance?.config?.labels || {};
    return { ...defaults, ...overrides };
  }

  t(cardInstance, key, fallback = '') {
    const labels = this._labels(cardInstance);
    return labels[key] || fallback || key;
  }

  _escapeHtml(value = '') {
    return String(value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  getPosterSource(item = {}) {
    const candidates = [item.poster, item.backdrop, item.fanart, item.banner];
    for (const candidate of candidates) {
      if (typeof candidate !== 'string') continue;
      const trimmed = candidate.trim();
      if (!trimmed || trimmed === 'null' || trimmed === 'undefined') continue;
      return trimmed;
    }
    return BaseSection.POSTER_PLACEHOLDER;
  }

  buildPosterImage(item, alt = '') {
    const source = this._escapeHtml(this.getPosterSource(item));
    const escapedAlt = this._escapeHtml(alt);
    return `<img src="${source}" alt="${escapedAlt}" loading="lazy" decoding="async" referrerpolicy="no-referrer" onerror="this.onerror=null;this.src='${BaseSection.POSTER_PLACEHOLDER}'">`;
  }

  generateTemplate(config = {}, cardInstance = this._currentCard) {
    const labelOverride = config?.[`${this.key}_label`];
    const translatedTitle = this.t(cardInstance, this.titleKey || this.key, this.title);
    const label = labelOverride ?? translatedTitle;
    return `
      <div class="section" data-section="${this.key}">
        <div class="section-header">
          <div class="section-header-content">
            <ha-icon class="section-toggle-icon" icon="mdi:chevron-down"></ha-icon>
            <div class="section-label">${label}</div>
          </div>
        </div>
        <div class="section-content">
          <div class="${this.key}-list"></div>
        </div>
      </div>
    `;
  }

  generateMediaItem(item, index, selectedType, selectedIndex) {
    return `
      <div class="media-item ${selectedType === this.key && index === selectedIndex ? 'selected' : ''}"
           data-type="${this.key}"
           data-index="${index}">
        ${this.buildPosterImage(item, item.title || '')}
        <div class="media-item-title">${item.title}</div>
      </div>
    `;
  }

  updateInfo(cardInstance, item) {
    if (!item) return;

    const mediaBackground = item.banner || item.fanart;
    const cardBackground = item.fanart || item.banner;
    
    if (mediaBackground) {
      cardInstance.background.style.backgroundImage = `url('${mediaBackground}')`;
      cardInstance.background.style.opacity = cardInstance.config.opacity || 0.7;
    }

    if (cardBackground && cardInstance.cardBackground) {
      cardInstance.cardBackground.style.backgroundImage = `url('${cardBackground}')`;
    }

    this.applyAdaptiveContrast(cardInstance, mediaBackground || cardBackground);

    const details = item.genres || item.episode || '';
    const metadata = item.release || item.number || '';
    const overview = item.overview || '';

    cardInstance.info.innerHTML = `
      <div class="title">${item.title}${item.year ? ` (${item.year})` : ''}</div>
      ${details ? `<div class="details">${details}</div>` : ''}
      ${metadata ? `<div class="metadata">${metadata}</div>` : ''}
      ${overview ? `<div class="overview">${overview}</div>` : ''}
    `;
  }

  applyAdaptiveContrast(cardInstance, imageUrl) {
    if (!cardInstance || !imageUrl) return;

    const contentRoot = cardInstance.content || cardInstance.querySelector('.card-content');
    if (!contentRoot) return;

    if (!cardInstance._contrastCache) {
      cardInstance._contrastCache = new Map();
    }

    const cacheKey = String(imageUrl);
    const applyMode = (mode) => {
      contentRoot.classList.toggle('contrast-dark', mode === 'dark');
      contentRoot.classList.toggle('contrast-light', mode === 'light');
    };

    if (cardInstance._contrastCache.has(cacheKey)) {
      applyMode(cardInstance._contrastCache.get(cacheKey));
      return;
    }

    cardInstance._contrastRequestId = (cardInstance._contrastRequestId || 0) + 1;
    const requestId = cardInstance._contrastRequestId;

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.referrerPolicy = 'no-referrer';

    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        const width = 48;
        const height = 48;
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        if (!ctx) {
          applyMode('dark');
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);
        const { data } = ctx.getImageData(0, 0, width, height);
        // Sample mainly where the text is rendered (left/bottom hero area),
        // instead of averaging the whole image.
        const sampleXStart = 0;
        const sampleXEnd = Math.floor(width * 0.72);
        const sampleYStart = Math.floor(height * 0.45);
        const sampleYEnd = height;

        let luminanceSum = 0;
        let pixelCount = 0;

        for (let y = sampleYStart; y < sampleYEnd; y += 1) {
          for (let x = sampleXStart; x < sampleXEnd; x += 1) {
            const i = (y * width + x) * 4;
            const r = data[i] / 255;
            const g = data[i + 1] / 255;
            const b = data[i + 2] / 255;

            const linearR = r <= 0.03928 ? r / 12.92 : ((r + 0.055) / 1.055) ** 2.4;
            const linearG = g <= 0.03928 ? g / 12.92 : ((g + 0.055) / 1.055) ** 2.4;
            const linearB = b <= 0.03928 ? b / 12.92 : ((b + 0.055) / 1.055) ** 2.4;

            luminanceSum += 0.2126 * linearR + 0.7152 * linearG + 0.0722 * linearB;
            pixelCount += 1;
          }
        }

        const averageLuminance = pixelCount > 0 ? (luminanceSum / pixelCount) : 0;
        const contrastWithWhite = 1.05 / (averageLuminance + 0.05);
        const contrastWithBlack = (averageLuminance + 0.05) / 0.05;
        // Prefer light text unless black text is clearly superior.
        // This avoids hard-to-read dark text on medium/dark posters.
        const blackClearlyBetter =
          contrastWithBlack >= 7 && (contrastWithBlack - contrastWithWhite) >= 1.2;
        const mode = blackClearlyBetter ? 'light' : 'dark';
        cardInstance._contrastCache.set(cacheKey, mode);

        if (requestId === cardInstance._contrastRequestId) {
          applyMode(mode);
        }
      } catch {
        if (requestId === cardInstance._contrastRequestId) {
          applyMode('dark');
        }
      }
    };

    img.onerror = () => {
      if (requestId === cardInstance._contrastRequestId) {
        applyMode('dark');
      }
    };

    img.src = imageUrl;
  }

  update(cardInstance, entity) {
    const maxItems = cardInstance.config[`${this.key}_max_items`] || cardInstance.config.max_items || 10;
    
    let items = entity.attributes.data || [];
    items = items.slice(0, maxItems);
    
    const listElement = cardInstance.querySelector(`.${this.key}-list`);
    if (!listElement) return;

    listElement.innerHTML = items.map((item, index) => 
      this.generateMediaItem(item, index, cardInstance.selectedType, cardInstance.selectedIndex)
    ).join('');

    this.addClickHandlers(cardInstance, listElement, items);
    
    if (cardInstance.cardBackground && (!this._lastBackgroundUpdate || Date.now() - this._lastBackgroundUpdate > 30000)) {
      const bgImage = this.getRandomArtwork(items);
      if (bgImage) {
        cardInstance.cardBackground.style.backgroundImage = `url('${bgImage}')`;
        this._lastBackgroundUpdate = Date.now();
      }
    }
  }

  addClickHandlers(cardInstance, listElement, items) {
    listElement.querySelectorAll('.media-item').forEach(item => {
      item.onclick = () => {
        const index = parseInt(item.dataset.index, 10);
        const selectedItem = items[index];
        if (!selectedItem) return;

        cardInstance.selectedType = this.key;
        cardInstance.selectedIndex = index;

        const mediaBackground = selectedItem.banner || selectedItem.fanart;
        const cardBackground = selectedItem.fanart || selectedItem.banner;

        if (mediaBackground) {
          cardInstance.background.style.backgroundImage = `url('${mediaBackground}')`;
        }
        if (cardBackground) {
          cardInstance.cardBackground.style.backgroundImage = `url('${cardBackground}')`;
        }

        this.updateInfo(cardInstance, selectedItem);

        cardInstance.querySelectorAll('.media-item').forEach(i => {
          i.classList.toggle(
            'selected',
            i.dataset.type === this.key && parseInt(i.dataset.index, 10) === index
          );
        });
      };
    });
  }

  getRandomArtwork(items) {
    if (!items || items.length === 0) return null;
    
    const validItems = items.filter(item => item.fanart || item.backdrop || item.banner);
    if (validItems.length === 0) return null;
    
    const randomItem = validItems[Math.floor(Math.random() * validItems.length)];
    
    return randomItem.fanart || randomItem.backdrop || randomItem.banner;
  }

  getAllArtwork(items) {
    if (!items || items.length === 0) return [];
    
    return items.reduce((artworks, item) => {
      if (item.fanart) artworks.push(item.fanart);
      if (item.backdrop) artworks.push(item.backdrop);
      if (item.banner) artworks.push(item.banner);
      return artworks;
    }, []);
  }

  formatDate(dateString) {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return '';
      return date.toLocaleDateString();
    } catch {
      return '';
    }
  }
}
