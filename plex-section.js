// sections/plex-section.js
import { BaseSection } from './base-section.js?v=20260403-20';

export class PlexSection extends BaseSection {
  constructor() {
    super('plex', 'Plex Recently Added');
    this.titleKey = 'plex_recently_added';
  }

  updateInfo(cardInstance, item) {
    super.updateInfo(cardInstance, item);

    if (!item) return;
    if (item.title_default) {
      cardInstance.info.innerHTML = '';
      return;
    }

    const releaseDate = item.release === 'TBA' ? 'TBA' : (this.formatDate(item.release) || 'TBA');

    cardInstance.info.innerHTML = `
      <div class="title">${this._escapeHtml(item.title)}${item.year ? ` (${this._escapeHtml(String(item.year))})` : ''}</div>
      ${item.number ? `<div class="details">${this._escapeHtml(item.number)}${item.episode ? ` - ${this._escapeHtml(item.episode)}` : ''}</div>` : ''}
      <div class="metadata">${this.t(cardInstance, 'released', 'Released')}: ${releaseDate}</div>
    `;
  }

  generateMediaItem(item, index, selectedType, selectedIndex) {
    if (item.title_default) {
      return `
        <div class="empty-section-content">
          <div class="empty-message">${this.t(this._currentCard, 'no_recent_media', 'No recently added media')}</div>
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
}
