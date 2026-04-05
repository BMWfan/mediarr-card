// sections/trakt-section.js
import { BaseSection } from './base-section.js?v=20260403-20';

export class TraktSection extends BaseSection {
  constructor() {
    super('trakt', 'Trakt Popular');
    this.titleKey = 'trakt_popular';
  }

  update(cardInstance, entity) {
    this._currentCard = cardInstance;
    super.update(cardInstance, entity);
  }

  generateMediaItem(item, index, selectedType, selectedIndex) {
    return `
      <div class="media-item ${selectedType === this.key && index === selectedIndex ? 'selected' : ''}"
           data-type="${this.key}"
           data-index="${index}">
        <img src="${item.poster || '/api/placeholder/400/600'}" alt="${item.title}">
        <div class="media-item-title">${item.title}</div>
      </div>
    `;
  }

  updateInfo(cardInstance, item) {
    this._currentCard = cardInstance;
    if (!item) return;

    const mediaBackground = item.backdrop || item.poster;
    const cardBackground = item.backdrop || item.poster;
    
    if (mediaBackground) {
        cardInstance.background.style.backgroundImage = `url('${mediaBackground}')`;
        cardInstance.background.style.opacity = cardInstance.config.opacity || 0.7;
    }

    if (cardBackground && cardInstance.cardBackground) {
        cardInstance.cardBackground.style.backgroundImage = `url('${cardBackground}')`;
    }
    this.applyAdaptiveContrast(cardInstance, mediaBackground || cardBackground);

    // Enhanced info display for Trakt items
    cardInstance.info.innerHTML = `
        <div class="title">${item.title}${item.year ? ` (${item.year})` : ''}</div>
        <div class="type">${(item.type || '').toUpperCase()}</div>
        ${item.overview ? `<div class="overview">${item.overview}</div>` : ''}
        <div class="details">
          <div class="request-button-container">
            <button class="request-button" onclick="this.dispatchEvent(new CustomEvent('seer-request', {
              bubbles: true,
              detail: {
                title: '${item.title.replace(/'/g, "\\'")}',
                year: '${item.year || ''}',
                type: '${item.type || 'movie'}',
                tmdb_id: ${item.tmdb_id || item.ids?.tmdb || 0},
                poster: '${(item.poster || '').replace(/'/g, "\\'")}',
                overview: '${(item.overview || '').replace(/'/g, "\\'")}'
              }
            }))">
              <ha-icon icon="mdi:plus-circle-outline"></ha-icon>
              ${this.t(cardInstance, 'request', 'Request')}
            </button>
          </div>
          ${item.ids ? `
            <div class="metadata">
              ${item.ids.imdb ? `IMDB: ${item.ids.imdb}` : ''}
              ${item.ids.tmdb ? `TMDB: ${item.ids.tmdb}` : ''}
            </div>
          ` : ''}
        </div>
    `;
  }
}
