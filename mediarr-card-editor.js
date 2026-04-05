const SECTION_DEFINITIONS = [
  {
    key: 'tmdb',
    label: 'TMDB',
    fields: [
      { key: 'tmdb_entity', label: 'Trending Sensor' },
      { key: 'tmdb_airing_today_entity', label: 'Airing Today Sensor' },
      { key: 'tmdb_now_playing_entity', label: 'Now Playing Sensor' },
      { key: 'tmdb_on_air_entity', label: 'On Air Sensor' },
      { key: 'tmdb_upcoming_entity', label: 'Upcoming Sensor' },
      { key: 'tmdb_popular_movies_entity', label: 'Popular Movies Sensor' },
      { key: 'tmdb_popular_tv_entity', label: 'Popular TV Sensor' }
    ]
  },
  {
    key: 'seer',
    label: 'Seer',
    fields: [
      { key: 'seer_entity', label: 'Requests Sensor' },
      { key: 'seer_trending_entity', label: 'Trending Sensor' },
      { key: 'seer_discover_entity', label: 'Discover Sensor' },
      { key: 'seer_popular_movies_entity', label: 'Popular Movies Sensor' },
      { key: 'seer_popular_tv_entity', label: 'Popular TV Sensor' }
    ]
  },
  {
    key: 'immaculaterr',
    label: 'Immaculaterr',
    fields: [
      { key: 'immaculaterr_movies_entity', label: 'Movies Sensor' },
      { key: 'immaculaterr_tv_entity', label: 'TV Sensor' }
    ]
  },
  { key: 'plex', label: 'Plex', fields: [{ key: 'plex_entity', label: 'Plex Sensor' }] },
  { key: 'jellyfin', label: 'Jellyfin', fields: [{ key: 'jellyfin_entity', label: 'Jellyfin Sensor' }] },
  { key: 'sonarr', label: 'Sonarr', fields: [{ key: 'sonarr_entity', label: 'Sonarr Sensor' }] },
  { key: 'sonarr2', label: 'Sonarr 2', fields: [{ key: 'sonarr2_entity', label: 'Sonarr 2 Sensor' }] },
  { key: 'radarr', label: 'Radarr', fields: [{ key: 'radarr_entity', label: 'Radarr Sensor' }] },
  { key: 'radarr2', label: 'Radarr 2', fields: [{ key: 'radarr2_entity', label: 'Radarr 2 Sensor' }] },
  { key: 'trakt', label: 'Trakt', fields: [{ key: 'trakt_entity', label: 'Trakt Sensor' }] }
];

const DEFAULT_VISIBLE_SECTIONS = ['tmdb', 'seer', 'immaculaterr'];

const fireEvent = (node, type, detail = {}) =>
  node.dispatchEvent(
    new CustomEvent(type, {
      detail,
      bubbles: true,
      composed: true
    })
  );

class MediarrCardEditor extends HTMLElement {
  setConfig(config) {
    this._config = { ...config };
    if (!Array.isArray(this._config.visible_sections) || this._config.visible_sections.length === 0) {
      this._config.visible_sections = this._deriveVisibleSections(this._config);
    }
    this._render();
  }

  set hass(hass) {
    this._hass = hass;
    this._render();
  }

  _deriveVisibleSections(config) {
    const visible = SECTION_DEFINITIONS
      .filter((section) => section.fields.some((field) => (config[field.key] || '').toString().trim().length > 0))
      .map((section) => section.key);
    return visible.length > 0 ? visible : [...DEFAULT_VISIBLE_SECTIONS];
  }

  _isSectionVisible(sectionKey) {
    const visibleSections = Array.isArray(this._config?.visible_sections) ? this._config.visible_sections : [];
    return visibleSections.includes(sectionKey);
  }

  _updateConfigValue(key, value) {
    const nextConfig = { ...(this._config || {}) };
    if (value === '' || value === null || value === undefined) {
      delete nextConfig[key];
    } else {
      nextConfig[key] = value;
    }
    this._config = nextConfig;
    fireEvent(this, 'config-changed', { config: nextConfig });
  }

  _toggleSection(sectionKey, enabled) {
    const visibleSections = Array.isArray(this._config?.visible_sections)
      ? [...this._config.visible_sections]
      : this._deriveVisibleSections(this._config || {});

    const hasSection = visibleSections.includes(sectionKey);
    if (enabled && !hasSection) {
      const order = SECTION_DEFINITIONS.map((section) => section.key);
      visibleSections.push(sectionKey);
      visibleSections.sort((a, b) => order.indexOf(a) - order.indexOf(b));
    }
    if (!enabled && hasSection) {
      const index = visibleSections.indexOf(sectionKey);
      visibleSections.splice(index, 1);
    }

    this._updateConfigValue('visible_sections', visibleSections);
    this._render();
  }

  _render() {
    if (!this._config) return;

    this.innerHTML = `
      <style>
        .editor-root { display: grid; gap: 16px; padding: 8px 0; }
        .editor-card { border: 1px solid var(--divider-color); border-radius: 10px; padding: 12px; }
        .editor-title { font-weight: 600; margin-bottom: 8px; }
        .editor-subtitle { font-size: 13px; opacity: 0.8; margin-bottom: 10px; }
        .module-list { display: grid; gap: 10px; }
        .module-row { border: 1px solid var(--divider-color); border-radius: 8px; padding: 10px; }
        .module-toggle { display: flex; align-items: center; gap: 8px; font-weight: 500; }
        .field-list { display: grid; gap: 10px; margin-top: 10px; }
        .field-label { font-size: 12px; opacity: 0.75; margin-bottom: 4px; }
        .entity-picker { width: 100%; }
        .global-grid { display: grid; gap: 10px; grid-template-columns: repeat(auto-fit, minmax(170px, 1fr)); }
        .global-field input { width: 100%; box-sizing: border-box; padding: 8px; border: 1px solid var(--divider-color); border-radius: 6px; background: var(--card-background-color); color: var(--primary-text-color); }
      </style>
      <div class="editor-root">
        <div class="editor-card">
          <div class="editor-title">Visible Sections</div>
          <div class="editor-subtitle">Enable only the modules you want to show on the card.</div>
          <div class="module-list">
            ${SECTION_DEFINITIONS.map((section) => `
              <div class="module-row">
                <label class="module-toggle">
                  <input type="checkbox" data-section-toggle="${section.key}" ${this._isSectionVisible(section.key) ? 'checked' : ''}>
                  <span>${section.label}</span>
                </label>
                ${this._isSectionVisible(section.key) ? `
                  <div class="field-list">
                    ${section.fields.map((field) => `
                      <div>
                        <div class="field-label">${field.label}</div>
                        <ha-entity-picker class="entity-picker" data-entity-key="${field.key}" include-domains="sensor"></ha-entity-picker>
                      </div>
                    `).join('')}
                  </div>
                ` : ''}
              </div>
            `).join('')}
          </div>
        </div>

        <div class="editor-card">
          <div class="editor-title">General Options</div>
          <div class="global-grid">
            <div class="global-field">
              <div class="field-label">Media Player Entity</div>
              <ha-entity-picker class="entity-picker" data-entity-key="media_player_entity" include-domains="media_player"></ha-entity-picker>
            </div>
            <div class="global-field">
              <div class="field-label">Default Max Items</div>
              <input type="number" min="1" max="100" data-number-key="max_items" value="${this._config.max_items ?? 10}">
            </div>
            <div class="global-field">
              <div class="field-label">Default Days To Check</div>
              <input type="number" min="1" max="365" data-number-key="days_to_check" value="${this._config.days_to_check ?? 60}">
            </div>
            <div class="global-field">
              <div class="field-label">Overlay Opacity (0-1)</div>
              <input type="number" min="0" max="1" step="0.05" data-number-key="opacity" value="${this._config.opacity ?? 0.7}">
            </div>
            <div class="global-field">
              <div class="field-label">Blur Radius</div>
              <input type="number" min="0" max="30" data-number-key="blur_radius" value="${this._config.blur_radius ?? 0}">
            </div>
          </div>
        </div>
      </div>
    `;

    this.querySelectorAll('[data-section-toggle]').forEach((checkbox) => {
      checkbox.addEventListener('change', (event) => {
        this._toggleSection(event.currentTarget.dataset.sectionToggle, Boolean(event.currentTarget.checked));
      });
    });

    this.querySelectorAll('ha-entity-picker').forEach((picker) => {
      const key = picker.dataset.entityKey;
      picker.hass = this._hass;
      picker.value = this._config[key] || '';
      picker.addEventListener('value-changed', (event) => {
        this._updateConfigValue(key, event.detail?.value || '');
      });
    });

    this.querySelectorAll('[data-number-key]').forEach((input) => {
      input.addEventListener('change', (event) => {
        const key = event.currentTarget.dataset.numberKey;
        const rawValue = event.currentTarget.value;
        const parsed = rawValue === '' ? '' : Number(rawValue);
        this._updateConfigValue(key, Number.isFinite(parsed) ? parsed : '');
      });
    });
  }
}

customElements.define('mediarr-card-editor', MediarrCardEditor);
