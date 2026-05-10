// sections/radarr-section.js
import { BaseSection } from './base-section.js?v=20260403-20';

export class RadarrBaseSection extends BaseSection {
  update(cardInstance, entity) {
    const maxItems = cardInstance.config[`${this.key}_max_items`] || cardInstance.config.max_items || 10;
    const releaseTypes = cardInstance.config[`${this.key}_release_types`] || ['Digital', 'Theaters', 'Physical'];

    let items = entity.attributes.data || [];

    if (items.length > 0 && !items[0].title_default) {
      items = items.filter(item =>
        releaseTypes.some(type => item.release && item.release.includes(type))
      );
    }

    super.update(cardInstance, entity, items.slice(0, maxItems));
  }

  updateInfo(cardInstance, item) {
    super.updateInfo(cardInstance, item);

    if (!item) return;
    if (item.title_default) {
      cardInstance.info.innerHTML = '';
      return;
    }

    const dateStr = item.release ? (item.release.split(' - ')[1] || item.release) : '';
    const releaseDate = this.formatDate(dateStr.includes('Unknown') ? '' : dateStr);
    const runtime = item.runtime ? `${item.runtime} min` : '';

    cardInstance.info.innerHTML = `
      <div class="title">${this._escapeHtml(item.title)}${item.year ? ` (${this._escapeHtml(String(item.year))})` : ''}</div>
      <div class="details">${this._escapeHtml(item.genres || '')}</div>
      <div class="metadata">${releaseDate}${runtime ? ` | ${runtime}` : ''}</div>
      ${item.overview ? `<div class="overview">${this._escapeHtml(item.overview)}</div>` : ''}
    `;
  }

  generateMediaItem(item, index, selectedType, selectedIndex) {
    if (item.title_default) {
      return `
        <div class="empty-section-content">
          <div class="empty-message">${this.t(this._currentCard, 'no_upcoming_movies', 'No upcoming movies')}</div>
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

export class RadarrSection extends RadarrBaseSection {
  constructor() {
    super('radarr', 'Radarr Movies');
    this.titleKey = 'radarr_upcoming_movies';
  }
}
