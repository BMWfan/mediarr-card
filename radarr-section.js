// sections/radarr-section.js
import { BaseSection } from './base-section.js?v=20260403-20';
export class RadarrSection extends BaseSection {
  constructor() {
    super('radarr', 'Radarr Movies');  // Default name if no label provided
  }
  
  generateTemplate(config, cardInstance = this._currentCard) {
    // Get label from config or use default
    const label = config?.radarr_label ?? this.t(cardInstance, 'radarr_upcoming_movies', 'Upcoming Movies');
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
    const maxItems = cardInstance.config[`${this.key}_max_items`] || cardInstance.config.max_items || 10;
    const releaseTypes = cardInstance.config[`${this.key}_release_types`] || ['Digital', 'Theaters', 'Physical'];
   
    let items = entity.attributes.data || [];
   
    // Filter by release type if this isn't a default "empty" item
    if (items.length > 0 && !items[0].title_default) {
      items = items.filter(item => {
        // Check if the release string contains any of the allowed release types
        return releaseTypes.some(type =>
          item.release && item.release.includes(type)
        );
      });
    }
   
    // Now call the parent method with our filtered items
    // We need to temporarily replace the data in the entity
    const originalData = entity.attributes.data;
    entity.attributes.data = items.slice(0, maxItems);
   
    // Call parent update method to handle the rest
    super.update(cardInstance, entity);
   
    // Restore original data
    entity.attributes.data = originalData;
  }
  
  updateInfo(cardInstance, item) {
    super.updateInfo(cardInstance, item);  // Handle backgrounds
   
    if (!item) return;
    if (item.title_default) {
        cardInstance.info.innerHTML = '';
        return;
    }
    let releaseDate = '';
    if (item.release && !item.release.includes('Unknown')) {
        const dateStr = item.release.split(' - ')[1] || item.release;
        const date = new Date(dateStr);
        if (!isNaN(date.getTime())) {
            releaseDate = date.toLocaleDateString();
        }
    }
    const runtime = item.runtime ? `${item.runtime} min` : '';
    cardInstance.info.innerHTML = `
        <div class="title">${item.title}${item.year ? ` (${item.year})` : ''}</div>
        <div class="details">${item.genres || ''}</div>
        <div class="metadata">${releaseDate}${runtime ? ` | ${runtime}` : ''}</div>
        ${item.overview ? `<div class="overview">${item.overview}</div>` : ''}
    `;
  }
  
  generateMediaItem(item, index, selectedType, selectedIndex) {
    // Handle empty state
    if (item.title_default) {
      return `
        <div class="empty-section-content">
          <div class="empty-message">${this.t(this._currentCard, 'no_upcoming_movies', 'No upcoming movies')}</div>
        </div>
      `;
    }
    // Use original media item layout
    return `
      <div class="media-item ${selectedType === this.key && index === selectedIndex ? 'selected' : ''}"
           data-type="${this.key}"
           data-index="${index}">
        ${this.buildPosterImage(item, item.title || '')}
        <div class="media-item-title">${item.title}</div>
      </div>
    `;
  }
}
