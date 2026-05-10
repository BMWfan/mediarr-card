// sections/tmdb-section.js
import { BaseSection } from './base-section.js?v=20260403-20';

export class TMDBSection extends BaseSection {
  constructor() {
    super('tmdb_container', '');
    this.sections = [
      { key: 'tmdb', title: 'Trending on TMDB', titleKey: 'trending_on_tmdb', entityKey: 'tmdb_entity', listClass: 'tmdb-list' },
      { key: 'tmdb_airing_today', title: 'Airing Today', titleKey: 'airing_today', entityKey: 'tmdb_airing_today_entity', listClass: 'tmdb-airing-today-list' },
      { key: 'tmdb_now_playing', title: 'Now Playing', titleKey: 'now_playing', entityKey: 'tmdb_now_playing_entity', listClass: 'tmdb-now-playing-list' },
      { key: 'tmdb_on_air', title: 'On Air', titleKey: 'on_air', entityKey: 'tmdb_on_air_entity', listClass: 'tmdb-on-air-list' },
      { key: 'tmdb_upcoming', title: 'Upcoming', titleKey: 'upcoming', entityKey: 'tmdb_upcoming_entity', listClass: 'tmdb-upcoming-list' },
      { key: 'tmdb_popular_movies', title: 'Popular Movies', titleKey: 'popular_movies', entityKey: 'tmdb_popular_movies_entity', listClass: 'tmdb-popular-movies-list' },
      { key: 'tmdb_popular_tv', title: 'Popular TV Shows', titleKey: 'popular_tv_shows', entityKey: 'tmdb_popular_tv_entity', listClass: 'tmdb-popular-tv-list' }
    ];
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
    if (item.title_default) {
      return `
        <div class="empty-section-content">
          <div class="empty-message">${this.t(this._currentCard, 'no_media_available', 'No media available')}</div>
        </div>
      `;
    }
    return `
      <div class="media-item ${selectedType === sectionKey && index === selectedIndex ? 'selected' : ''}"
           data-type="${sectionKey}"
           data-index="${index}">
        ${this.buildPosterImage(item, item.title || '')}
        <div class="media-item-title">${this._escapeHtml(item.title || '')}</div>
      </div>
    `;
  }

  update(cardInstance, entity) {
    this._currentCard = cardInstance;
    const entityId = entity.entity_id;
    const sectionConfig = this.sections.find(section =>
      cardInstance.config[section.entityKey] === entityId
    );

    if (!sectionConfig) return;

    const maxItems = cardInstance.config.tmdb_max_items || cardInstance.config.max_items || 10;
    const items = (entity.attributes.data || []).slice(0, maxItems);

    const listElement = cardInstance.querySelector(`[data-list="${sectionConfig.key}"]`);
    if (!listElement) return;

    listElement.innerHTML = items.map((item, index) =>
      this.generateMediaItem(item, index, cardInstance.selectedType, cardInstance.selectedIndex, sectionConfig.key)
    ).join('');

    this.addClickHandlers(cardInstance, listElement, items, sectionConfig.key);
    this._preloadImages(items);
  }

  addClickHandlers(cardInstance, listElement, items, sectionKey) {
    listElement.querySelectorAll('.media-item').forEach(item => {
      item.onclick = () => {
        const index = parseInt(item.dataset.index, 10);
        cardInstance.selectedType = sectionKey;
        cardInstance.selectedIndex = index;

        this._withInfoFade(cardInstance, () => this.updateInfo(cardInstance, items[index]));

        cardInstance.querySelectorAll('.media-item').forEach(i => {
          i.classList.toggle('selected',
            i.dataset.type === sectionKey && parseInt(i.dataset.index, 10) === index);
        });
      };
    });
  }

  updateInfo(cardInstance, item) {
    this._currentCard = cardInstance;
    if (!item || item.title_default) return;

    const bg = item.backdrop || item.poster || '';
    this._applyBackground(cardInstance, bg, bg);

    cardInstance.info.innerHTML = `
      <div class="type">${this._escapeHtml((item.type || '').toUpperCase())}</div>
      <div class="title">${this._escapeHtml(item.title)}${item.year ? ` (${this._escapeHtml(String(item.year))})` : ''}</div>
      <div class="overview">${this._escapeHtml(item.overview || '')}</div>
      <div class="details">
        <div class="request-button-container">
          <button class="request-button" onclick="this.dispatchEvent(new CustomEvent('seer-request', {
            bubbles: true,
            detail: {
              title: '${(item.title || '').replace(/'/g, "\\'")}',
              year: '${item.year || ''}',
              type: '${item.type || ''}',
              tmdb_id: ${item.tmdb_id || 0},
              poster: '${(item.poster || '').replace(/'/g, "\\'")}',
              overview: '${(item.overview || '').replace(/'/g, "\\'")}'
            }
          }))">
            <ha-icon icon="mdi:plus-circle-outline"></ha-icon>
            ${this.t(cardInstance, 'request', 'Request')}
          </button>
        </div>
        ${item.vote_average ? `<div class="rating">Rating: ${this._escapeHtml(String(item.vote_average))}/10</div>` : ''}
      </div>
    `;
  }
}
