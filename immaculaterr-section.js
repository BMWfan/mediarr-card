import { BaseSection } from './base-section.js?v=20260403-20';

export class ImmaculaterrSection extends BaseSection {
  constructor() {
    super('immaculaterr_container', '');
    this.sections = [
      {
        key: 'immaculaterr_movies',
        title: 'Immaculaterr Movies',
        titleKey: 'immaculaterr_movies',
        entityKey: 'immaculaterr_movies_entity',
        listClass: 'immaculaterr-movies-list'
      },
      {
        key: 'immaculaterr_tv',
        title: 'Immaculaterr TV',
        titleKey: 'immaculaterr_tv',
        entityKey: 'immaculaterr_tv_entity',
        listClass: 'immaculaterr-tv-list'
      }
    ];
  }

  _escape(value) {
    return String(value ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
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
      `)
      .join('');
  }

  generateMediaItem(item, index, selectedType, selectedIndex, sectionKey) {
    return `
      <div class="media-item ${selectedType === sectionKey && index === selectedIndex ? 'selected' : ''}"
           data-type="${sectionKey}"
           data-index="${index}">
        ${this.buildPosterImage(item, item.title || '')}
        <div class="media-item-title">${this._escape(item.title || '')}</div>
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

    const maxItems = cardInstance.config.immaculaterr_max_items || cardInstance.config.max_items || 10;
    const items = (entity.attributes.data || []).slice(0, maxItems);
    const listElement = cardInstance.querySelector(`[data-list="${sectionConfig.key}"]`);

    if (!listElement) return;

    cardInstance._immaculaterrLists = cardInstance._immaculaterrLists || {};
    cardInstance._immaculaterrLists[sectionConfig.key] = { items, listElement };

    this._renderList(cardInstance, sectionConfig.key);
  }

  _renderList(cardInstance, sectionKey) {
    const listState = cardInstance._immaculaterrLists?.[sectionKey];
    if (!listState) return;

    listState.listElement.innerHTML = listState.items.map((item, index) =>
      this.generateMediaItem(item, index, cardInstance.selectedType, cardInstance.selectedIndex, sectionKey)
    ).join('');

    this.addClickHandlers(cardInstance, listState.listElement, listState.items, sectionKey);
  }

  addClickHandlers(cardInstance, listElement, items, sectionKey) {
    listElement.querySelectorAll('.media-item').forEach(item => {
      item.onclick = () => {
        const index = parseInt(item.dataset.index, 10);
        cardInstance.selectedType = sectionKey;
        cardInstance.selectedIndex = index;
        this.updateInfo(cardInstance, items[index], sectionKey);

        cardInstance.querySelectorAll('.media-item').forEach(listItem => {
          listItem.classList.toggle(
            'selected',
            listItem.dataset.type === sectionKey && parseInt(listItem.dataset.index, 10) === index
          );
        });
      };
    });

    if (!cardInstance._immaculaterrActionHandlerAdded) {
      cardInstance.addEventListener('immaculaterr-action', async (e) => {
        const {
          title,
          media_type,
          library_section_key,
          suggestion_id,
          action,
          apply,
          sectionKey,
          index
        } = e.detail;

        try {
          await window.document.querySelector('home-assistant')
            ?.hass.callService('mediarr', 'process_immaculaterr_suggestion', {
              media_type,
              library_section_key,
              suggestion_id,
              action,
              apply
            });

          this._applyOptimisticUpdate(cardInstance, {
            action,
            apply,
            sectionKey,
            index
          });

          const successMessage = action === 'approve'
            ? this.t(cardInstance, 'requested', 'Requested')
            : this.t(cardInstance, 'not_interested', 'Not interested');
          this._showToast(cardInstance, successMessage, 'success');
        } catch (error) {
          console.error(`Error processing Immaculaterr suggestion for ${title}:`, error);
          this._showToast(cardInstance, error?.message || this.t(cardInstance, 'failed', 'Failed'), 'error');
        }
      });

      cardInstance._immaculaterrActionHandlerAdded = true;
    }
  }

  _applyOptimisticUpdate(cardInstance, detail) {
    const listState = cardInstance._immaculaterrLists?.[detail.sectionKey];
    if (!listState) return;

    const currentItem = listState.items[detail.index];
    if (!currentItem) return;

    if (detail.action === 'reject' || detail.action === 'remove') {
      listState.items.splice(detail.index, 1);
      if (cardInstance.selectedType === detail.sectionKey) {
        if (listState.items.length > 0) {
          cardInstance.selectedIndex = Math.min(detail.index, listState.items.length - 1);
          this.updateInfo(cardInstance, listState.items[cardInstance.selectedIndex], detail.sectionKey);
        } else {
          cardInstance.selectedType = null;
          cardInstance.selectedIndex = 0;
          cardInstance.info.innerHTML = `
            <div class="title">${this.t(cardInstance, 'immaculaterr_empty', 'No more Immaculaterr suggestions in this row')}</div>
          `;
        }
      }
    } else if (detail.action === 'approve') {
      currentItem.download_approval = 'approved';
      if (detail.apply) {
        currentItem.sent_at = new Date().toISOString();
      }
      if (cardInstance.selectedType === detail.sectionKey) {
        this.updateInfo(cardInstance, currentItem, detail.sectionKey);
      }
    }

    this._renderList(cardInstance, detail.sectionKey);
  }

  _showToast(cardInstance, message, kind = 'info') {
    if (!cardInstance || !message) return;
    const toast = document.createElement('div');
    toast.className = `mediarr-toast mediarr-toast-${kind}`;
    toast.textContent = message;
    cardInstance.appendChild(toast);
    requestAnimationFrame(() => toast.classList.add('show'));
    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => toast.remove(), 250);
    }, 2600);
  }

  updateInfo(cardInstance, item, sectionKey = null) {
    this._currentCard = cardInstance;
    if (!item) return;

    const mediaBackground = item.fanart || item.banner || item.poster || '';
    const cardBackground = item.fanart || item.banner || item.poster || '';

    if (mediaBackground) {
      cardInstance.background.style.backgroundImage = `url('${mediaBackground}')`;
      cardInstance.background.style.opacity = cardInstance.config.opacity || 0.7;
    }

    if (cardBackground && cardInstance.cardBackground) {
      cardInstance.cardBackground.style.backgroundImage = `url('${cardBackground}')`;
    }
    this.applyAdaptiveContrast(cardInstance, mediaBackground || cardBackground);

    const activeSectionKey = sectionKey || (item.media_type === 'tv' ? 'immaculaterr_tv' : 'immaculaterr_movies');
    const isRequested = Boolean(item.sent_at);
    const approvalRequired = item.approval_required_from_observatory !== false;
    const canRequest = approvalRequired && !isRequested;
    const requestLabel = isRequested
      ? this.t(cardInstance, 'requested', 'Requested')
      : this.t(cardInstance, 'request', 'Request');
    const scoreMarkup = typeof item.score === 'number'
      ? `<span class="detail-chip">${this.t(cardInstance, 'score', 'Score')}: ${item.score}</span>`
      : '';
    const ratingMarkup = typeof item.tmdb_vote_avg === 'number'
      ? `<span class="detail-chip">TMDB ${item.tmdb_vote_avg.toFixed(1)}</span>`
      : '';
    const statusMarkup = isRequested
      ? `<span class="status status-approved"><ha-icon icon="mdi:check-circle-outline"></ha-icon>${this.t(cardInstance, 'requested', 'Requested')}</span>`
      : item.download_approval === 'approved'
        ? `<span class="status status-approved"><ha-icon icon="mdi:thumb-up-outline"></ha-icon>${this.t(cardInstance, 'approved', 'Approved')}</span>`
        : '';

    const requestButton = `
      <button
        class="request-button ${isRequested ? 'status-approved' : ''}"
        ${canRequest ? '' : 'disabled'}
        onclick="this.dispatchEvent(new CustomEvent('immaculaterr-action', {
          bubbles: true,
          detail: {
            title: '${this._escape(item.title || '')}',
            media_type: '${item.media_type}',
            library_section_key: '${this._escape(item.library_section_key || '')}',
            suggestion_id: ${item.id},
            action: 'approve',
            apply: true,
            sectionKey: '${activeSectionKey}',
            index: ${cardInstance.selectedIndex}
          }
        }))">
        <ha-icon icon="${isRequested ? 'mdi:check-circle-outline' : 'mdi:download-outline'}"></ha-icon>
        ${requestLabel}
      </button>
    `;

    const rejectButton = `
      <button
        class="request-button request-button-secondary"
        onclick="this.dispatchEvent(new CustomEvent('immaculaterr-action', {
          bubbles: true,
          detail: {
            title: '${this._escape(item.title || '')}',
            media_type: '${item.media_type}',
            library_section_key: '${this._escape(item.library_section_key || '')}',
            suggestion_id: ${item.id},
            action: 'reject',
            apply: true,
            sectionKey: '${activeSectionKey}',
            index: ${cardInstance.selectedIndex}
          }
        }))">
        <ha-icon icon="mdi:thumb-down-outline"></ha-icon>
        ${this.t(cardInstance, 'not_interested', 'Not interested')}
      </button>
    `;

    const noteMarkup = approvalRequired
      ? ''
      : `<div class="immaculaterr-note">${this.t(
          cardInstance,
          'immaculaterr_manual_mode_required',
          'Enable approvalRequiredFromObservatory in Immaculaterr for one-click requests.'
        )}</div>`;

    cardInstance.info.innerHTML = `
      <div class="type">${this._escape(item.type || '').toUpperCase()}</div>
      <div class="title">${this._escape(item.title || '')}${item.year ? ` (${this._escape(item.year)})` : ''}</div>
      ${item.overview ? `<div class="overview">${this._escape(item.overview)}</div>` : ''}
      <div class="details">
        ${statusMarkup}
        ${scoreMarkup}
        ${ratingMarkup}
      </div>
      <div class="action-buttons">
        ${requestButton}
        ${rejectButton}
      </div>
      ${noteMarkup}
    `;
  }
}
