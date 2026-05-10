// sections/sonarr-section.js
import { BaseSection } from './base-section.js?v=20260403-20';

export class SonarrBaseSection extends BaseSection {
  updateInfo(cardInstance, item) {
    super.updateInfo(cardInstance, item);

    if (!item) return;
    if (item.title_default) {
      cardInstance.info.innerHTML = '';
      return;
    }

    const airDate = this.formatDate(item.release !== 'Unknown' ? item.release : '');

    cardInstance.info.innerHTML = `
      <div class="title">${this._escapeHtml(item.title)}</div>
      <div class="details">${this._escapeHtml(item.number || '')} - ${this._escapeHtml(item.episode || '')}</div>
      <div class="metadata">
        ${this.t(cardInstance, 'airs', 'Airs')}: ${airDate}${item.network ? ` ${this.t(cardInstance, 'on', 'on')} ${this._escapeHtml(item.network)}` : ''}
      </div>
    `;
  }

  generateMediaItem(item, index, selectedType, selectedIndex) {
    if (item.title_default) {
      return `
        <div class="empty-section-content">
          <div class="empty-message">${this.t(this._currentCard, 'no_upcoming_shows', 'No upcoming shows')}</div>
        </div>
      `;
    }

    return `
      <div class="media-item ${selectedType === this.key && index === selectedIndex ? 'selected' : ''}"
           data-type="${this.key}"
           data-index="${index}">
        ${this.buildPosterImage(item, item.title || '')}
        <div class="media-item-title">${this._escapeHtml(item.number)} - ${this._escapeHtml(item.title)}</div>
      </div>
    `;
  }
}

export class SonarrSection extends SonarrBaseSection {
  constructor() {
    super('sonarr', 'Sonarr Shows');
    this.titleKey = 'sonarr_upcoming_shows';
  }
}
