// sections/jellyfin-section.js
import { BaseSection } from './base-section.js?v=20260403-20';

export class JellyfinSection extends BaseSection {
  constructor() {
    super('jellyfin', 'Jellyfin Recently Added');
    this.titleKey = 'jellyfin_recently_added';
  }

  updateInfo(cardInstance, item) {
    super.updateInfo(cardInstance, item);

    if (!item) return;
    if (item.title_default) {
      cardInstance.info.innerHTML = '';
      return;
    }

    const addedDate = this.formatDate(item.release) || 'Unknown';
    const runtime = item.runtime ? `${item.runtime} min` : '';
    const subtitle = item.episode ? `${this._escapeHtml(item.number || '')} - ${this._escapeHtml(item.episode || '')}` : '';

    cardInstance.info.innerHTML = `
      <div class="title">${this._escapeHtml(item.title)}${item.year ? ` (${this._escapeHtml(String(item.year))})` : ''}</div>
      <div class="details">${subtitle}</div>
      <div class="metadata">${this.t(cardInstance, 'released', 'Released')}: ${addedDate}${runtime ? ` | ${runtime}` : ''}</div>
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
