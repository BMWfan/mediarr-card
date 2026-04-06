// sections/sonarr2-section.js
import { BaseSection } from './base-section.js?v=20260403-20';

export class Sonarr2Section extends BaseSection {
  constructor() {
    super('sonarr2', 'Sonarr2 Shows');  // Default name if no label provided
  }

  generateTemplate(config, cardInstance = this._currentCard) {
    // Get label from config or use default
    const label = config?.sonarr2_label ?? this.t(cardInstance, 'sonarr2_upcoming_shows', 'Sonarr2 Shows');
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

  update(cardInstance, entity) {
    this._currentCard = cardInstance;
    super.update(cardInstance, entity);
  }


  updateInfo(cardInstance, item) {
    this._currentCard = cardInstance;
    super.updateInfo(cardInstance, item);  // Handle backgrounds
    
    if (!item) return;
    if (item.title_default) {
        cardInstance.info.innerHTML = '';
        return;
    }

    let airDate = '';
    if (item.release && item.release !== 'Unknown') {
        const date = new Date(item.release);
        if (!isNaN(date.getTime())) {
            airDate = date.toLocaleDateString();
        }
    }

    cardInstance.info.innerHTML = `
        <div class="title">${item.title}</div>
        <div class="details">${item.number || ''} - ${item.episode || ''}</div>
        <div class="metadata">
            ${this.t(cardInstance, 'airs', 'Airs')}: ${airDate}${item.network ? ` ${this.t(cardInstance, 'on', 'on')} ${item.network}` : ''}
        </div>
    `;
  }

  generateMediaItem(item, index, selectedType, selectedIndex) {
    // Handle empty state
    if (item.title_default) {
      return `
        <div class="empty-section-content">
          <div class="empty-message">${this.t(this._currentCard, 'no_upcoming_shows', 'No upcoming shows')}</div>
        </div>
      `;
    }

    // Use original media item layout
    return `
      <div class="media-item ${selectedType === this.key && index === selectedIndex ? 'selected' : ''}"
           data-type="${this.key}"
           data-index="${index}">
        ${this.buildPosterImage(item, item.title || '')}
        <div class="media-item-title">${item.number} - ${item.title}</div>
      </div>
    `;
  }
}
