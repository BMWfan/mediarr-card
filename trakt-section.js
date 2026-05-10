// sections/trakt-section.js
import { BaseSection } from './base-section.js?v=20260403-20';

export class TraktSection extends BaseSection {
  constructor() {
    super('trakt', 'Trakt Popular');
    this.titleKey = 'trakt_popular';
  }

  generateMediaItem(item, index, selectedType, selectedIndex) {
    if (item.title_default) {
      return `
        <div class="empty-section-content">
          <div class="empty-message">${this.t(this._currentCard, 'no_media_available', 'No media available')}</div>
        </div>
      `;
    }
    return `
      <div class="media-item ${selectedType === this.key && index === selectedIndex ? 'selected' : ''}"
           data-type="${this.key}"
           data-index="${index}">
        ${this.buildPosterImage(item, item.title || '')}
        <div class="media-item-title">${this._escapeHtml(item.title)}</div>
      </div>
    `;
  }

  updateInfo(cardInstance, item) {
    if (!item || item.title_default) return;

    const bg = item.backdrop || item.poster || '';
    this._applyBackground(cardInstance, bg, bg);

    cardInstance.info.innerHTML = `
      <div class="title">${this._escapeHtml(item.title)}${item.year ? ` (${this._escapeHtml(String(item.year))})` : ''}</div>
      <div class="type">${this._escapeHtml((item.type || '').toUpperCase())}</div>
      ${item.overview ? `<div class="overview">${this._escapeHtml(item.overview)}</div>` : ''}
      <div class="details">
        <div class="request-button-container">
          <button class="request-button" onclick="this.dispatchEvent(new CustomEvent('seer-request', {
            bubbles: true,
            detail: {
              title: '${(item.title || '').replace(/'/g, "\\'")}',
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
            ${item.ids.imdb ? `IMDB: ${this._escapeHtml(item.ids.imdb)}` : ''}
            ${item.ids.tmdb ? `TMDB: ${this._escapeHtml(String(item.ids.tmdb))}` : ''}
          </div>
        ` : ''}
      </div>
    `;
  }
}
