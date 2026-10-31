// A source-independent view of the configured Mediarr sensors.
export function mediaText(value) {
  return typeof value === 'string' ? value.trim() : typeof value === 'number' && Number.isFinite(value) ? String(value) : '';
}

export function mediaNames(value) {
  return (Array.isArray(value) ? value : [value]).map(entry => mediaText(entry?.name ?? entry?.tag ?? entry)).filter(Boolean);
}

export function mediaImage(value) {
  const url = mediaText(value);
  return /^(https?:\/\/|\/(?!\/)|data:image\/(png|jpeg|webp|gif|svg\+xml)[;,])/i.test(url) ? url : '';
}

export function escapeMediaHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, char => ({'&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;'}[char]));
}


function mediaCastRichness(entries) {
  return Array.isArray(entries) ? entries.reduce((score, actor) => score + (typeof actor === 'object' && actor ? 1 + (actor.character ? 2 : 0) + (actor.profile_path || actor.image || actor.photo || actor.thumb ? 4 : 0) : 0), 0) : 0;
}

export function mediaCast(item) {
  return [item.cast, item.actors, item.credits?.cast]
    .filter(value => Array.isArray(value) && value.length)
    .reduce((best, value) => !best.length || mediaCastRichness(value) > mediaCastRichness(best) ? value : best, []);
}

export function collectMediaLibrary(config, hass) {
  const groups = [];
  const aliases = new Map();
  const normalized = value => mediaText(value).toLocaleLowerCase().replace(/\s+/g, ' ');
  for (const [entityKey, entityId] of Object.entries(config)) {
    if (!/^(plex|jellyfin|sonarr2?|radarr2?|seer|tmdb|trakt|immaculaterr)(?:_[a-z0-9]+)*_entity$/.test(entityKey)) continue;
    const sourceKey = entityKey.split('_')[0];
    if (Array.isArray(config.visible_sections) && config.visible_sections.length && !config.visible_sections.includes(sourceKey)) continue;
    const entity = hass?.states?.[entityId];
    if (!entity || ['unavailable','unknown'].includes(entity.state) || !Array.isArray(entity.attributes?.data)) continue;
    const provider = entityKey.split('_')[0].replace(/[12]$/, '');
    entity.attributes.data.forEach((item, index) => {
      if (!item || item.title_default || !mediaText(item.title || item.name)) return;
      const title = mediaText(item.title || item.name);
      const typeHint = mediaText(item.media_type || item.type).toLowerCase();
      const kind = provider === 'sonarr' || /tv|show|series|episode/.test(typeHint) || /_tv_|_tv_entity$/.test(entityKey) ? 'tv' : 'movie';
      const ids = {
        tmdb: mediaText(item.tmdb_id ?? item.tmdbId ?? item.ids?.tmdb ?? (['tmdb','seer'].includes(provider) ? item.id : undefined)),
        tvdb: mediaText(item.tvdb_id ?? item.tvdbId ?? item.ids?.tvdb),
        imdb: mediaText(item.imdb_id ?? item.imdbId ?? item.ids?.imdb),
      };
      for (const key of Object.keys(ids)) if (!ids[key] || ids[key] === '0') delete ids[key];
      const identityKeys = Object.entries(ids).map(([key,value]) => `${kind}:${key}:${value}`);
      const year = mediaText(item.year) || mediaText(item.release_date || item.first_air_date).slice(0,4);
      const fallback = year ? `${kind}:${normalized(title)}:${year}` : null;
      let group = identityKeys.map(key => aliases.get(key)).find(Boolean);
      if (!group && fallback) group = groups.find(candidate => candidate.fallback === fallback &&
        !Object.keys(ids).some(key => candidate.ids[key] && candidate.ids[key] !== ids[key]));
      if (!group) {
        group = {key:identityKeys[0] || fallback || `${kind}:${entityKey}:${normalized(title)}:${index}`, fallback, ids:{}, kind, title, year, item:{}, refs:[]};
        groups.push(group);
      }
      // A later item can bridge providers that exposed disjoint IDs earlier.
      for (const other of new Set(identityKeys.map(key => aliases.get(key)).filter(Boolean))) {
        if (other === group) continue;
        group.refs.push(...other.refs);
        Object.assign(group.ids, other.ids);
        group.item = { ...other.item, ...group.item };
        groups.splice(groups.indexOf(other), 1);
        for (const [key, target] of aliases) if (target === other) aliases.set(key, group);
      }
      Object.assign(group.ids, ids);
      identityKeys.forEach(key => aliases.set(key,group));
      // Enrich without replacing populated metadata with empty provider values.
      for (const [key,value] of Object.entries(item)) {
        if (value !== null && value !== undefined && value !== '' && (!Array.isArray(value) || value.length)) {
          if (group.item[key] === undefined || group.item[key] === '' || (Array.isArray(group.item[key]) && !group.item[key].length) || (['cast','actors'].includes(key) && mediaCastRichness(value) > mediaCastRichness(group.item[key]))) group.item[key] = value;
        }
      }
      group.refs.push({provider,entityKey,entityId,index,item});
    });
  }
  for (const group of groups) {
    const libraryRefs = group.refs.filter(ref => ['plex','jellyfin'].includes(ref.provider));
    const hasFile = group.refs.some(ref => ref.item.has_file === true || ref.item.hasFile === true);
    const requested = group.refs.some(ref => ['radarr','sonarr'].includes(ref.provider) || ref.entityKey === 'seer_entity' || ref.item.sent_at);
    group.stage = libraryRefs.length || hasFile || group.refs.some(ref => ref.entityKey === 'seer_entity' && ref.item.status === 4) ? 'ready' : requested ? 'waiting' : 'discover';
    const watched = libraryRefs.map(({item}) => {
      for (const value of [item.watched,item.played,item.user_data?.played,item.UserData?.Played]) if (typeof value === 'boolean') return value;
      const count = item.view_count ?? item.viewCount;
      return typeof count === 'number' ? count > 0 : null;
    }).filter(value => value !== null);
    group.watched = libraryRefs.length && watched.length === libraryRefs.length ? watched.every(Boolean) : null;
    group.summary = [group.item.overview,group.item.summary,group.item.description,group.item.plot].map(mediaText).find(Boolean) || '';
    group.poster = [group.item.poster,group.item.thumb,group.item.banner].map(mediaImage).find(Boolean) || '';
    group.banner = [group.item.banner,group.item.fanart,group.item.backdrop,group.item.poster].map(mediaImage).find(Boolean) || '';
    group.rating = mediaText(group.item.vote_average ?? group.item.tmdb_vote_avg ?? group.item.community_rating ?? group.item.communityRating ?? group.item.rating);
  }
  return groups;
}

export function mediaEntriesForCard(card) {
  const entries = collectMediaLibrary(card.config, card._hass);
  const pending = card._pendingLibraryRequests ||= new Set();
  for (const entry of entries) {
    if (pending.has(entry.key) && entry.stage === 'discover') {
      entry.stage = 'waiting';
      entry.optimistic = true;
    } else if (entry.stage !== 'discover') pending.delete(entry.key);
  }
  return entries;
}

export class CompactMediaView {
  constructor(card) { this.card = card; }
  label(de, en) { return this.card._mediaLabel(de, en); }

  mount() {
    this.card.classList.add('mediarr-compact');
    const panel = document.createElement('ha-card');
    panel.innerHTML = `<div class="compact-media"><header class="compact-header"><ha-icon icon="mdi:movie-open-outline"></ha-icon><div><h2>Mediarr</h2><p class="compact-subtitle"></p></div></header><section class="compact-recent"><h3></h3><div class="compact-posters"></div></section><section class="compact-watchlist"><button type="button" class="compact-watchlist-link" aria-haspopup="dialog"></button><div class="compact-watchlist-posters"></div></section><button type="button" class="mediarr-open-button" aria-haspopup="dialog"></button></div>`;
    this.card.append(panel);
    const style = document.createElement('style');
    style.textContent = this.card._mediaStyles;
    this.card.append(style);
    this.panel = panel;
    this.card.content = panel.querySelector('.compact-media');
    panel.querySelector('.mediarr-open-button').onclick = () => this.card._openMediaOverlay();
    panel.querySelector('.compact-watchlist-link').onclick = (event) => { this.card._overlayOpener = event.currentTarget; this.card._openMediaOverlay({category:'waiting'}); };
    this.refresh();
  }

  refresh() {
    const entries = mediaEntriesForCard(this.card).filter(entry => entry.watched !== true);
    const signature = JSON.stringify([this.card._hass?.language,this.card.config.compact_items,entries.map(entry=>[entry.key,entry.stage,entry.title,entry.poster,entry.kind,entry.item.added,entry.item.added_at])]);
    if (signature === this.signature) return;
    this.signature = signature;
    const esc = escapeMediaHtml;
    const limit = Math.max(1, Math.min(8, Math.floor(Number(this.card.config.compact_items) || 4)));
    const waiting = entries.filter(entry=>entry.stage==='waiting');
    const recent = entries.filter(entry=>entry.stage==='ready').sort((a,b)=>(Date.parse(b.item.added_at || b.item.added) || 0)-(Date.parse(a.item.added_at || a.item.added) || 0));
    const firstRow = recent.length ? recent : entries.filter(entry=>entry.stage==='discover');
    this.panel.querySelector('.compact-subtitle').textContent = this.label('Dein Filmabend','Your movie night');
    this.panel.querySelector('h3').textContent = recent.length ? this.label('Neu hinzugefügt','Recently added') : this.label('Dein nächster Filmabend','Your next movie night');
    this.panel.querySelector('.compact-watchlist-link').textContent = this.label('Auf deiner Merkliste','On your watchlist') + ` · ${waiting.length} ${this.label('Titel','titles')} ›`;
    this.panel.querySelector('.mediarr-open-button').textContent = this.label('Mediarr öffnen ↗','Open Mediarr ↗');
    const renderRow = (selector, items, small = false) => {
      const row = this.panel.querySelector(selector);
      if (!small) row.style.gridAutoColumns = `minmax(64px, calc((100% - ${(limit - 1) * 10}px) / ${limit}))`;
      const focusedKey = row.querySelector('button:focus')?.dataset.key;
      row.innerHTML = items.length ? items.slice(0,small?8:limit).map(entry=>`<button type="button" class="compact-poster" data-key="${esc(entry.key)}" aria-label="${esc(entry.title)}" aria-haspopup="dialog"><span class="compact-poster-art">${entry.poster?`<img src="${esc(entry.poster)}" alt="" loading="lazy">`:'<ha-icon icon="mdi:movie-open-outline"></ha-icon>'}${!small?`<span class="compact-kind">${esc(entry.kind==='tv'?this.label('Serie','Series'):this.label('Film','Movie'))}</span>`:''}</span>${!small?`<span class="compact-poster-title">${esc(entry.title)}</span>`:''}</button>`).join('') : `<p class="compact-empty">${esc(small?this.label('Noch keine Titel auf deiner Merkliste.','No titles on your watchlist yet.'):this.label('Noch keine Titel verfügbar.','No titles available yet.'))}</p>`;
      row.querySelectorAll('button').forEach(button => button.onclick = () => {
        const entry = entries.find(candidate=>candidate.key===button.dataset.key);
        this.card._overlayOpener = button;
        this.card._openMediaOverlay({category:entry.stage,selectedKey:entry.key});
      });
      row.querySelectorAll('img').forEach(img=>img.onerror=()=>{img.onerror=null;img.hidden=true;});
      if (focusedKey) [...row.querySelectorAll('button')].find(button=>button.dataset.key===focusedKey)?.focus({preventScroll:true});
    };
    renderRow('.compact-posters',firstRow);
    renderRow('.compact-watchlist-posters',waiting,true);
  }
}

export class MediaLibraryView {
  constructor(card) {
    this.card = card;
    this.category = card._initialLibrarySelection?.category || 'all';
    this.selectedKey = card._initialLibrarySelection?.selectedKey;
    this.pending = card._pendingLibraryRequests ||= new Set();
    this.busy = new Set();
    this.messages = new Map();
  }

  label(de,en) { return this.card._mediaLabel(de,en); }
  stageLabel(stage) {
    return ({all:this.label('Alle Titel','All titles'), discover:this.label('Dein nächster Filmabend','Your next movie night'),waiting:this.label('Deine Merkliste','Your watchlist'),ready:this.label('Vorhang auf','Ready to watch')})[stage];
  }

  mount() {
    const content = this.card.querySelector('.card-content');
    this.card.querySelectorAll('.section, .media-details-panel').forEach(el => el.remove());
    this.card.content.hidden = true;
    const shell = document.createElement('div');
    shell.className = 'mediarr-library';
    shell.innerHTML = `<label class="library-search-label"><span>${escapeMediaHtml(this.label('Filme und Serien','Movies and series'))}</span><input type="search" class="mediarr-search" placeholder="${escapeMediaHtml(this.label('In deinen Mediarr-Titeln suchen …','Search your Mediarr titles …'))}"></label><nav class="library-tabs" aria-label="${escapeMediaHtml(this.label('Bereiche','Categories'))}"></nav><p class="mediarr-search-status" role="status"></p><div class="library-workspace"><div class="library-results"></div><div class="library-focus"></div></div>`;
    content.append(shell);
    this.shell = shell;
    this.input = shell.querySelector('input');
    this.results = shell.querySelector('.library-results');
    this.focus = shell.querySelector('.library-focus');
    this.input.oninput = () => this.render();
    this.refresh();
  }

  refresh() {
    this.entries = mediaEntriesForCard(this.card);
    this.render();
  }

  status(entry) {
    if (entry.stage === 'ready') return entry.watched === false ? this.label('Bereit · Noch nicht angesehen','Ready · Unwatched') : this.label('In deiner Bibliothek','In your library');
    if (entry.optimistic) return this.label('Angefragt · Status wird aktualisiert','Requested · Awaiting status');
    const downloading = entry.refs.find(ref => ref.item.download_status === 'downloading' || typeof ref.item.download_progress === 'number');
    if (downloading) {
      const progress = downloading.item.download_progress;
      return this.label('Download läuft','Downloading') + (typeof progress === 'number' && progress >= 0 && progress <= 100 ? ` · ${Math.round(progress)} %` : '');
    }
    const releases = entry.refs.map(ref => mediaText(ref.item.release_date || ref.item.digital_release || ref.item.digitalRelease || ref.item.release)).filter(value => /^\d{4}-\d{2}-\d{2}/.test(value));
    const future = releases.map(value => new Date(value)).filter(date => Number.isFinite(date.valueOf()) && date > new Date()).sort((a,b)=>a-b)[0];
    if (entry.stage === 'waiting' && future) return this.label('Ab ','From ') + future.toLocaleDateString(this.card._hass?.language || 'en');
    if (entry.stage === 'waiting') return this.label('Hinzugefügt · Wartet auf Verfügbarkeit','Added · Awaiting availability');
    return this.label('Für dich entdecken','Discover something new');
  }

  render() {
    const esc = escapeMediaHtml;
    const query = this.input.value.trim().toLocaleLowerCase();
    const visible = this.entries.filter(entry => entry.watched !== true &&
      (query ? `${entry.title} ${entry.year} ${entry.summary}`.toLocaleLowerCase().includes(query) : this.category === 'all' || entry.stage === this.category));
    const tabs = this.shell.querySelector('.library-tabs');
    const focusedTab = tabs.querySelector('button:focus')?.dataset.category;
    tabs.innerHTML = ['all','discover','waiting','ready'].map(stage => `<button type="button" data-category="${stage}" aria-pressed="${this.category===stage}">${esc(this.stageLabel(stage))}</button>`).join('');
    tabs.querySelectorAll('button').forEach(button => button.onclick = () => { this.category=button.dataset.category; this.input.value=''; this.render(); });
    if (focusedTab) [...tabs.querySelectorAll('button')].find(button => button.dataset.category === focusedTab)?.focus({preventScroll:true});
    this.shell.querySelector('[role=status]').textContent = `${visible.length} ${this.label('Titel','titles')}` + (query ? ` · ${this.label('Suche in deinen Mediarr-Listen','Search in your Mediarr lists')}` : '');
    if (!visible.some(entry => entry.key === this.selectedKey)) this.selectedKey = visible[0]?.key;
    this.results.innerHTML = visible.length ? visible.map(entry => `<button type="button" class="media-item library-result ${entry.key===this.selectedKey?'selected':''}" data-key="${esc(entry.key)}" aria-pressed="${entry.key===this.selectedKey}"><span class="library-result-poster">${entry.poster?`<img src="${esc(entry.poster)}" alt="" loading="lazy">`:'<ha-icon icon="mdi:movie-open-outline"></ha-icon>'}</span><span class="media-item-title">${esc(entry.title)}</span><span class="library-result-meta">${esc([entry.year,entry.kind==='tv'?this.label('Serie','Series'):this.label('Film','Movie'),entry.rating?`★ ${entry.rating}`:''].filter(Boolean).join(' · '))}</span><span class="mediarr-result-summary">${esc(entry.summary)}</span><span class="library-status library-status-${entry.stage}">${esc(this.status(entry))}</span></button>`).join('') : `<p class="library-empty">${esc(query?this.label('Keine passenden Titel gefunden.','No matching titles found.'):this.label('Hier sind noch keine Titel vorhanden.','No titles here yet.'))}</p>`;
    this.results.querySelectorAll('button').forEach(button => button.onclick = () => {
      const hadFocus = button.matches(':focus');
      this.selectedKey=button.dataset.key;
      this.render();
      if (hadFocus) [...this.results.querySelectorAll('button')].find(row=>row.dataset.key===this.selectedKey)?.focus({preventScroll:true});
      if (matchMedia('(max-width: 700px)').matches) this.focus.scrollIntoView({behavior:'smooth',block:'start'});
    });
    this.renderDetails(visible.find(entry=>entry.key===this.selectedKey));
    this.shell.querySelectorAll('img').forEach(img => img.onerror = () => { img.onerror=null; img.hidden=true; });
  }

  renderDetails(entry) {
    const esc=escapeMediaHtml;
    if (!entry) { this.focus.innerHTML=`<p class="library-empty">${esc(this.label('Wähle einen Titel aus.','Choose a title.'))}</p>`; return; }
    const item=entry.item;
    const genres=mediaNames(item.genres || item.genre).join(', ');
    const runtime=mediaText(item.runtime);
    const metadata=[entry.year,genres,runtime?`${runtime}${/^\d+$/.test(runtime)?' min':''}`:'',entry.rating?`★ ${entry.rating}`:''].filter(Boolean).join(' · ');
    const actors=mediaCast(item);
    const castMarkup=actors.map(actor => {
      const name=mediaText(actor?.name || actor);
      if (!name) return '';
      const image=mediaImage(actor?.image || actor?.photo || actor?.thumb || (actor?.profile_path ? `https://image.tmdb.org/t/p/w185${actor.profile_path}` : ''));
      return `<div class="library-person">${image?`<img src="${esc(image)}" alt="" loading="lazy">`:`<span class="library-person-placeholder" aria-hidden="true">${esc(name.split(' ').map(word=>word[0]).slice(0,2).join(''))}</span>`}<strong>${esc(name)}</strong>${actor?.character?`<small>${esc(actor.character)}</small>`:''}</div>`;
    }).join('');
    const castText=castMarkup?'':mediaNames(item.cast || item.actors).join(', ');
    const directors=mediaNames(item.director || item.directors).join(', ');
    const actionable=this.requestService(entry);
    const busy=this.busy.has(entry.key);
    const playable = entry.refs.find(ref=>ref.provider==='plex' && ref.item.key && this.card.config.plex_url && this.card.config.plex_token);
    const actionMarkup = playable ? `<button type="button" class="library-play library-request">${esc(this.label('Abspielen', 'Play'))}</button>` : entry.stage === 'discover' ? `
      <button type="button" class="library-request" ${!actionable || busy ? 'disabled' : ''}>${esc(busy ? this.label('Wird hinzugefügt …', 'Adding …') : this.label('+ Zur Merkliste', '+ Add to watchlist'))}</button>
      ${!actionable ? `<small>${esc(this.label('Hinzufügen derzeit nicht verfügbar.', 'Adding is currently unavailable.'))}</small>` : ''}` : '';
    this.focus.innerHTML = `
      <article class="media-details-panel library-detail">
        <div class="library-hero">
          <div class="library-backdrop"></div>
          <div class="library-title-row">
            <div class="library-poster">${entry.poster ? `<img src="${esc(entry.poster)}" alt="${esc(entry.title)}">` : '<ha-icon icon="mdi:movie-open-outline"></ha-icon>'}</div>
            <div class="library-heading">
              <h1>${esc(entry.title)}</h1>
              <p class="library-metadata">${esc(metadata)}</p>
              <p class="library-status library-status-${entry.stage}">${esc(this.status(entry))}</p>
              ${actionMarkup}
              <p class="library-action-message" role="alert">${esc(this.messages.get(entry.key) || '')}</p>
            </div>
          </div>
        </div>
        <div class="library-detail-body">
          <h2>${esc(this.label('Handlung', 'Synopsis'))}</h2>
          <p class="media-details-synopsis">${esc(entry.summary || this.label('Für diesen Titel liegt noch keine Beschreibung vor.', 'No synopsis is available for this title yet.'))}</p>
          ${directors ? `<p class="library-director"><strong>${esc(this.label('Regie', 'Director'))}</strong> ${esc(directors)}</p>` : ''}
          ${castMarkup || castText ? `<h2>${esc(this.label('Besetzung', 'Cast'))}</h2><div class="library-cast">${castMarkup || esc(castText)}</div>` : ''}
          <details class="library-sources"><summary>${esc(this.label('Datenquellen', 'Data sources'))}</summary>${esc([...new Set(entry.refs.map(ref => ref.provider))].join(', '))}</details>
        </div>
      </article>`;
    const backdrop=this.focus.querySelector('.library-backdrop');
    if(entry.banner) backdrop.style.backgroundImage=`url(${JSON.stringify(entry.banner)})`;
    const play = this.focus.querySelector('.library-play');
    if (play) play.onclick=()=>this.card._showClientSelector(playable.item);
    const action=this.focus.querySelector('.library-request:not(.library-play)');
    if(action) action.onclick=()=>this.request(entry);
  }

  requestService(entry) {
    const services=this.card._hass?.services?.mediarr || {};
    const suggestion=entry.refs.find(ref=>ref.provider==='immaculaterr' && ref.item.id != null && ref.item.library_section_key && ref.item.approval_required_from_observatory !== false);
    if(suggestion && services.process_immaculaterr_suggestion) return {name:'process_immaculaterr_suggestion',suggestion};
    const name=entry.kind==='tv'?'submit_tv_request':'submit_movie_request';
    return services[name]?{name}:null;
  }

  async request(entry) {
    if(this.busy.has(entry.key)||this.pending.has(entry.key)||entry.stage!=='discover') return;
    const service=this.requestService(entry);
    if(!service) return;
    this.busy.add(entry.key);this.messages.delete(entry.key);this.render();
    try {
      let data={name:entry.title};
      if(service.suggestion) {
        const item=service.suggestion.item;
        data={media_type:item.media_type,library_section_key:item.library_section_key,suggestion_id:item.id,action:'approve',apply:true};
      } else if(entry.kind==='tv') {
        const season=await this.card.sections.seer._openSeasonModal(entry.title,this.card);
        if(season===null) return;
        data.season=season;
      }
      await this.card._hass.callService('mediarr',service.name,data);
      this.pending.add(entry.key);
    } catch(error) { this.messages.set(entry.key,error?.message||this.label('Hinzufügen fehlgeschlagen.','Could not add title.')); }
    finally { this.busy.delete(entry.key);this.refresh(); }
  }
}
