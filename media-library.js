import { fetchMediaMetadata, searchMediaCatalog, fetchMediaLibrary } from './media-metadata.js';
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

function metadataText(value) {
  const text = mediaText(value);
  return /^(n\/a|unknown|null|none|undefined)$/i.test(text) ? '' : text;
}

export function mediaKind(item, provider = '', entityKey = '') {
  if (provider === 'sonarr') return 'tv';
  if (provider === 'radarr') return 'movie';
  for (const value of [item.media_type, item.mediaType, item.Type, item.type, item.media?.mediaType]) {
    const type = mediaText(value).toLowerCase().replace(/[\s_-]+/g, '');
    if (['tv','show','tvshow','tvseries','series','episode','season','serie'].includes(type)) return 'tv';
    if (['movie','film'].includes(type)) return 'movie';
  }
  if (/_(airing_today|on_air|popular_tv|tv)(?:_entity)?$/.test(entityKey)) return 'tv';
  if (/_(now_playing|upcoming|popular_movies|movies)(?:_entity)?$/.test(entityKey)) return 'movie';
  if (/\bS\d{1,3}E\d{1,4}\b|\b\d{1,3}x\d{1,4}\b/i.test(mediaText(item.number)) || / - \d{1,3}x\d{1,4}$/i.test(mediaText(item.title))) return 'tv';
  if (item.first_air_date || item.original_name) return 'tv';
  if (provider === 'tmdb' && item.release_date) return 'movie';
  if (item.SeriesName || item.series_name || item.grandparentTitle || item.show?.title || item.series?.title) return 'tv';
  if ([item.season, item.season_number, item.SeasonNumber, item.ParentIndexNumber].some(value => value !== null && value !== undefined && /^\d{1,3}$/.test(String(value)))) return 'tv';
  // Legacy Plex/Jellyfin movie payloads put the production year in `number`.
  if (['plex','jellyfin'].includes(provider) && /^(18|19|20|21)\d{2}$/.test(mediaText(item.number))) return 'movie';
  return 'unknown';
}

export function normalizeMediaItem(raw, provider = '', entityKey = '') {
  const kind = mediaKind(raw, provider, entityKey);
  const title = mediaText(raw.series_name || raw.SeriesName || raw.grandparentTitle || raw.title || raw.name || raw.Name || raw.show?.title || raw.movie?.title);
  const seriesTitle = kind === 'tv' ? title.replace(/ - \d{1,3}x\d{1,4}$/i, '').trim() : title;
  const year = metadataText(raw.year ?? raw.ProductionYear) ||
    (kind === 'movie' && /^\d{4}$/.test(mediaText(raw.number)) ? mediaText(raw.number) : '') ||
    metadataText(kind === 'tv' ? raw.first_air_date : raw.release_date || raw.release || raw.PremiereDate).match(/^\d{4}/)?.[0] || '';
  const people = Array.isArray(raw.People) ? raw.People : [];
  const rawCast = raw.cast || raw.Cast || raw.actors || people.filter(person => person.Type === 'Actor');
  const cast = Array.isArray(rawCast) ? rawCast.map(person => {
    if (!person || typeof person !== 'object') return person;
    const actor = {...person};
    if (!actor.name && person.Name) actor.name=person.Name;
    if (!actor.character && person.Role) actor.character=person.Role;
    if (!actor.image && (person.photo || person.thumb)) actor.image=person.photo || person.thumb;
    return actor;
  }) : rawCast;
  const crew = Array.isArray(raw.credits?.crew) ? raw.credits.crew : [];
  const directors = raw.director || raw.directors || [...crew.filter(person=>person.job==='Director').map(person=>person.name), ...people.filter(person=>person.Type==='Director').map(person=>person.Name)];
  const overview = [raw.overview,raw.summary,raw.description,raw.plot,raw.Overview,
    kind === 'movie' && ['plex','jellyfin'].includes(provider) ? raw.episode : undefined].map(metadataText).find(Boolean) || '';
  const providerIds = raw.ProviderIds || {};
  const image = (value,size) => /^\/[A-Za-z0-9._-]+$/.test(mediaText(value)) ? `https://image.tmdb.org/t/p/${size}${value}` : '';
  return {
    ...raw, title:seriesTitle, year, media_type:kind,
    overview, cast, directors,
    genres:raw.genres || raw.genre || raw.Genres,
    tmdb_id:raw.tmdb_id ?? raw.tmdbId ?? raw.ids?.tmdb ?? providerIds.Tmdb,
    tvdb_id:raw.tvdb_id ?? raw.tvdbId ?? raw.ids?.tvdb ?? providerIds.Tvdb,
    imdb_id:raw.imdb_id ?? raw.imdbId ?? raw.ids?.imdb ?? providerIds.Imdb,
    poster:raw.poster || raw.thumb || image(raw.poster_path,'w500'),
    backdrop:raw.backdrop || image(raw.backdrop_path,'w1280'),
    community_rating:raw.community_rating ?? raw.communityRating ?? raw.CommunityRating,
  };
}

function mediaIdentifiers(item, provider, entityKey) {
  // Seerr request IDs are local IDs; only discovery payloads expose TMDB as `id`.
  const implicitTmdbId = provider === 'tmdb' || (provider === 'seer' && entityKey !== 'seer_entity');
  const ids = {
    tmdb: mediaText(item.tmdb_id ?? item.tmdbId ?? item.ids?.tmdb ?? (implicitTmdbId ? item.id : undefined)),
    tvdb: mediaText(item.tvdb_id ?? item.tvdbId ?? item.ids?.tvdb),
    imdb: mediaText(item.imdb_id ?? item.imdbId ?? item.ids?.imdb),
  };
  for (const key of Object.keys(ids)) if (!ids[key] || ids[key] === '0') delete ids[key];
  return ids;
}

export function collectMediaLibrary(config, hass) {
  const groups = [];
  const aliases = new Map();
  const records = [];
  const hints = new Map();
  const normalized = value => mediaText(value).toLocaleLowerCase().replace(/\s+/g, ' ');
  for (const [entityKey, entityId] of Object.entries(config)) {
    if (!/^(plex|jellyfin|sonarr2?|radarr2?|seer|tmdb|trakt|immaculaterr)(?:_[a-z0-9]+)*_entity$/.test(entityKey)) continue;
    const sourceKey = entityKey.split('_')[0];
    if (Array.isArray(config.visible_sections) && config.visible_sections.length && !config.visible_sections.includes(sourceKey)) continue;
    const entity = hass?.states?.[entityId];
    if (!entity || ['unavailable','unknown'].includes(entity.state) || !Array.isArray(entity.attributes?.data)) continue;
    const provider = sourceKey.replace(/[12]$/, '');
    entity.attributes.data.forEach((raw,index) => {
      if (!raw || typeof raw !== 'object' || raw.title_default) return;
      const item = normalizeMediaItem(raw,provider,entityKey);
      if (!item.title) return;
      records.push({item,index,entityKey,entityId,provider,kind:item.media_type,ids:mediaIdentifiers(item,provider,entityKey)});
    });
  }
  const remember = record => {
    for (const [namespace,id] of Object.entries(record.ids)) {
      const key = `${namespace}:${id}`;
      if (!hints.has(key)) hints.set(key,new Set());
      hints.get(key).add(record.kind);
    }
  };
  records.filter(record=>record.kind!=='unknown').forEach(remember);
  // Recover a missing type from unique ID evidence, never from the title alone.
  // Numeric TMDB movie and TV IDs can collide, so ambiguous evidence stays unknown.
  let changed = true;
  while (changed) {
    changed = false;
    for (const record of records.filter(record=>record.kind==='unknown')) {
      const kinds = new Set(Object.entries(record.ids).flatMap(([namespace,id])=>[...(hints.get(`${namespace}:${id}`)||[])]));
      if (kinds.size===1) { record.kind=[...kinds][0]; record.item.media_type=record.kind; remember(record); changed=true; }
    }
  }
  for (const {item,index,entityKey,entityId,provider,kind,ids} of records) {
      const title = item.title;
      const identityKeys = Object.entries(ids).map(([key,value]) => `${kind}:${key}:${value}`);
      const year = mediaText(item.year);
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

export function mergeCatalogEntries(local, results) {
  const entries=local.slice();
  for (const item of results) {
    const existing=entries.find(entry=>entry.kind===item.media_type && String(entry.ids.tmdb)===String(item.tmdb_id));
    if (existing) continue; // Local availability and requests always take precedence.
    const entry=collectMediaLibrary({tmdb_entity:'catalog'},{states:{catalog:{state:'1',attributes:{data:[item]}}}})[0];
    if (entry) {entry.catalog=true;entries.push(entry);}
  }
  return entries;
}

function metadataNamespace(card) {
  const region=card.config.streaming_region || 'DE';
  return (card._hass?.language || 'en')+(region==='DE'?'':`:${region}`);
}

export function mediaEntriesForCard(card, catalog = []) {
  const remembered=card._catalogRequests ||= new Map();
  const config={...card.config};
  const states={...card._hass?.states};
  if(card._fullLibraryState?.groups) {
    for(const key of Object.keys(config)) if(key.endsWith('_entity') && config.visible_sections?.length && !config.visible_sections.includes(key.split('_')[0]))delete config[key];
    config.visible_sections=[];
    for(const [provider,items] of Object.entries(card._fullLibraryState.groups)) {
      const id=`sensor.mediarr_full_${provider}`;
      config[`${provider}_full_entity`]=id;
      states[id]={state:'1',attributes:{data:items}};
    }
  }
  const entries = mergeCatalogEntries(collectMediaLibrary(Object.fromEntries(Object.entries(config).sort(([a],[b])=>Number(b.includes('_full_entity'))-Number(a.includes('_full_entity')))),{states}), [...remembered.values(),...catalog]);
  const language = metadataNamespace(card);
  for (const entry of entries) {
    const cached = card._mediaMetadataCache?.get(`${language}:${entry.key}`);
    if (!cached || Date.now() - cached.timestamp > 6 * 60 * 60 * 1000) continue;
    const metadata = cached.data;
    for (const [key,value] of Object.entries(metadata)) {
      if (value !== null && value !== undefined && value !== '' && (!Array.isArray(value) || value.length)) entry.item[key]=value;
    }
    entry.kind=metadata.media_type;
    entry.ids={...entry.ids,tmdb:String(metadata.tmdb_id)};
    entry.year=mediaText(metadata.year) || entry.year;
    entry.summary=metadataText(metadata.overview) || entry.summary;
    entry.rating=mediaText(metadata.vote_average ?? entry.rating);
    entry.poster=entry.poster || mediaImage(metadata.poster);
    entry.banner=entry.banner || mediaImage(metadata.backdrop || metadata.banner);
  }
  const pending = card._pendingLibraryRequests ||= new Set();
  for (const entry of entries) {
    if (pending.has(entry.key) && entry.stage === 'discover') {
      entry.stage = 'waiting';
      entry.optimistic = true;
    } else if (entry.stage !== 'discover') pending.delete(entry.key);
  }
  return entries;
}

export function mediaDownload(entry) {
  const ref=entry.refs.find(ref=>ref.item.download_status || typeof ref.item.download_progress==='number');
  if(!ref)return null;
  const raw=ref.item.download_progress;
  return {status:ref.item.download_status || 'downloading',progress:typeof raw==='number'&&Number.isFinite(raw)?Math.max(0,Math.min(100,Math.round(raw))):null};
}

function downloadBadge(entry, label) {
  const download=mediaDownload(entry);
  if(!download)return '';
  const text=({paused:label('Pausiert','Paused'),queued:label('Warteschlange','Queued'),importing:label('Importiert','Importing'),completed:label('Wird verarbeitet','Processing'),warning:label('Prüfung nötig','Needs attention')})[download.status] || label('Lädt herunter','Downloading');
  const caption=`${text}${download.progress!==null?` · ${download.progress} %`:''}`;
  return `<span class="media-download-badge" aria-label="${escapeMediaHtml(caption)}"><span>${escapeMediaHtml(caption)}</span>${download.progress!==null?`<span class="media-download-track" role="progressbar" aria-label="${escapeMediaHtml(text)}" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${download.progress}"><span style="width:${download.progress}%"></span></span>`:''}</span>`;
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
    const signature = JSON.stringify([this.card._hass?.language,this.card.config.compact_items,entries.map(entry=>[entry.key,entry.stage,entry.title,entry.poster,entry.kind,entry.item.added,entry.item.added_at,mediaDownload(entry)])]);
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
    this.panel.querySelector('.mediarr-open-button').innerHTML = `<span class="mediarr-open-icon"><ha-icon icon="mdi:movie-open-outline" aria-hidden="true"></ha-icon></span><span class="mediarr-open-copy"><strong>${this.label('Dein Filmabend','Your movie night')}</strong><span>${this.label('Entdecken, suchen und vormerken','Discover, search and save')}</span></span><ha-icon class="mediarr-open-arrow" icon="mdi:arrow-right" aria-hidden="true"></ha-icon>`;
    const renderRow = (selector, items, small = false) => {
      const row = this.panel.querySelector(selector);
      if (!small) row.style.gridAutoColumns = `minmax(64px, calc((100% - ${(limit - 1) * 10}px) / ${limit}))`;
      const focusedKey = row.querySelector('button:focus')?.dataset.key;
      row.innerHTML = items.length ? items.slice(0,small?8:limit).map(entry=>`<button type="button" class="compact-poster" data-key="${esc(entry.key)}" aria-label="${esc(entry.title)}" aria-haspopup="dialog"><span class="compact-poster-art">${downloadBadge(entry,this.label.bind(this))}${entry.poster?`<img src="${esc(entry.poster)}" alt="" loading="lazy">`:'<ha-icon icon="mdi:movie-open-outline"></ha-icon>'}${!small?`<span class="compact-kind">${esc(entry.kind==='tv'?this.label('Serie','Series'):entry.kind==='movie'?this.label('Film','Movie'):this.label('Medientyp unbekannt','Unknown media type'))}</span>`:''}</span>${!small?`<span class="compact-poster-title">${esc(entry.title)}</span>`:''}</button>`).join('') : `<p class="compact-empty">${esc(small?this.label('Noch keine Titel auf deiner Merkliste.','No titles on your watchlist yet.'):this.label('Noch keine Titel verfügbar.','No titles available yet.'))}</p>`;
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
    this.metadataPending = new Set();
    this.metadataErrors = new Map();
    this.card._mediaMetadataCache ||= new Map();
    this.card._metadataBackendState ||= {unsupported:false};
    this.catalog=[];
    this.searchVersion=0;
    this.searchPage=0;
    this.totalPages=0;
    this.localLimit=60;
    this.card._fullLibraryState ||= {groups:null,loaded:false};
  }

  label(de,en) { return this.card._mediaLabel(de,en); }
  stageLabel(stage) {
    return ({all:this.label('Alle Titel','All titles'),library:this.label('Meine Bibliothek','My library'),discover:this.label('Dein nächster Filmabend','Your next movie night'),waiting:this.label('Deine Merkliste','Your watchlist'),ready:this.label('Vorhang auf','Ready to watch')})[stage];
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
    this.results.tabIndex = 0;
    this.results.setAttribute('role', 'region');
    this.results.setAttribute('aria-label', this.label('Titelliste', 'Title list'));
    this.focus.tabIndex = 0;
    this.focus.setAttribute('role', 'region');
    this.focus.setAttribute('aria-label', this.label('Filmdetails und Besetzung', 'Media details and cast'));
    this.input.maxLength=128;
    this.input.placeholder=this.label('Filme und Serien suchen …','Search movies and series …');
    this.searchStatus=document.createElement('p');
    this.searchStatus.className='library-catalog-status';
    this.searchStatus.setAttribute('role','status');
    this.moreButton=document.createElement('button');
    this.moreButton.type='button';
    this.moreButton.className='library-load-more';
    this.moreButton.textContent=this.label('Weitere Treffer','More results');
    this.moreButton.onclick=()=>this.searchCatalog(this.searchPage+1);
    shell.querySelector('.library-workspace').before(this.searchStatus);
    shell.append(this.moreButton);
    this.input.oninput = () => this.scheduleSearch();
    this.refresh();
    this.loadLibrary();
    this.libraryTimer=setInterval(()=>{if(document.visibilityState==='visible'&&this.card.isConnected)this.loadLibrary(true);},60000);
  }

  refresh() {
    this.entries = mediaEntriesForCard(this.card,this.catalog);
    this.render();
  }

  async loadLibrary(refresh=false) {
    const state=this.card._fullLibraryState;
    if(state.loading || (state.loaded&&!refresh))return;
    state.loading=true;state.error=null;this.render();
    try {
      const groups={plex:[],radarr:[],sonarr:[]};
      let page=1,response;
      do {
        response=await fetchMediaLibrary(this.card._hass,{page,refresh:refresh&&page===1});
        if(!response?.groups || !Number.isInteger(response.total_pages) || response.total_pages<1 || response.total_pages>10000)throw {code:'library_unavailable'};
        for(const provider of Object.keys(groups))groups[provider].push(...(response.groups[provider]||[]));
        page++;
      } while(page<=response.total_pages && this.card.isConnected);
      if(!this.card.isConnected)return;
      state.groups=groups;state.loaded=true;state.complete=response.complete;
      if(!response.complete)state.error='library_incomplete';
      state.updated=Date.now();
    } catch(error) {state.error=error?.code || 'library_unavailable';}
    finally {
      state.loading=false;
      if(this.card.isConnected)this.refresh();
    }
  }

  destroy() {clearTimeout(this.searchTimer);clearInterval(this.libraryTimer);++this.searchVersion;}

  scheduleSearch() {
    clearTimeout(this.searchTimer);
    ++this.searchVersion;
    this.catalog=[];this.searchPage=0;this.totalPages=0;this.searchError=null;
    this.localLimit=60;
    this.searching=this.input.value.trim().length>=2;
    this.refresh();
    if(this.searching) this.searchTimer=setTimeout(()=>this.searchCatalog(1),350);
  }

  async searchCatalog(page=1) {
    if(!this.card.isConnected)return;
    const query=this.input.value.trim();
    if(query.length<2)return;
    const version=this.searchVersion;
    this.searching=true;this.searchError=null;this.render();
    try {
      const response=await searchMediaCatalog(this.card._hass,query,this.card._hass?.language,page);
      if(version!==this.searchVersion || !this.card.isConnected)return;
      this.catalog=page===1?response.results:[...this.catalog,...response.results];
      this.searchPage=response.page;this.totalPages=response.total_pages;
    } catch(error) {
      if(version!==this.searchVersion || !this.card.isConnected)return;
      this.searchError=error?.code || 'metadata_unavailable';
    } finally {
      if(version===this.searchVersion && this.card.isConnected){this.searching=false;this.refresh();}
    }
  }

  status(entry) {
    if (entry.stage === 'ready') return entry.watched === false ? this.label('Bereit · Noch nicht angesehen','Ready · Unwatched') : this.label('In deiner Bibliothek','In your library');
    if (entry.optimistic) return this.label('Angefragt · Status wird aktualisiert','Requested · Awaiting status');
    const downloading = mediaDownload(entry);
    if (downloading) {
      const caption=({paused:this.label('Pausiert','Paused'),queued:this.label('Warteschlange','Queued'),importing:this.label('Wird importiert','Importing'),warning:this.label('Download prüfen','Check download'),completed:this.label('Wird verarbeitet','Processing')})[downloading.status] || this.label('Download läuft','Downloading');
      return caption+(downloading.progress!==null?` · ${downloading.progress} %`:'');
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
    const matchesCatalog=entry=>this.catalog.some(item=>item.media_type===entry.kind && String(item.tmdb_id)===String(entry.ids.tmdb));
    const visible = this.entries.filter(entry => (query || this.category==='library' || entry.watched !== true) &&
      (query ? matchesCatalog(entry) || `${entry.title} ${entry.year} ${entry.summary}`.toLocaleLowerCase().includes(query) : this.category==='library'?entry.stage==='ready':this.category === 'all' || entry.stage === this.category));
    const tabs = this.shell.querySelector('.library-tabs');
    const focusedTab = tabs.querySelector('button:focus')?.dataset.category;
    tabs.innerHTML = ['all','library','discover','waiting','ready'].map(stage => `<button type="button" data-category="${stage}" aria-pressed="${this.category===stage}">${esc(this.stageLabel(stage))}</button>`).join('');
    tabs.querySelectorAll('button').forEach(button => button.onclick = () => { this.category=button.dataset.category; this.input.value=''; this.scheduleSearch(); });
    const reload=document.createElement('button');reload.type='button';reload.className='library-refresh';reload.textContent=this.label('Aktualisieren','Refresh');reload.disabled=this.card._fullLibraryState.loading;reload.onclick=()=>{this.loadLibrary(true);};tabs.append(reload);
    if (focusedTab) [...tabs.querySelectorAll('button')].find(button => button.dataset.category === focusedTab)?.focus({preventScroll:true});
    this.shell.querySelector('.mediarr-search-status').textContent = `${visible.length} ${this.label('Titel','titles')}`;
    this.searchStatus.textContent=!query?'':this.searching?this.label('TMDB wird durchsucht …','Searching TMDB …'):this.searchError==='unknown_command'?this.label('Globale Suche benötigt die aktualisierte Mediarr-Integration. Lokale Treffer werden angezeigt.','Global search requires the updated Mediarr integration. Showing local matches.'):this.searchError==='tmdb_not_configured'?this.label('Für die globale Suche den TMDB-Zugang in Mediarr einrichten.','Configure TMDB in Mediarr for global search.'):this.searchError?this.label('Katalogsuche nicht erreichbar. Lokale Treffer werden angezeigt.','Catalog search unavailable. Showing local matches.'):query.length<2?this.label('Ab zwei Zeichen auch neue Titel finden.','Type at least two characters to discover new titles.'):this.searchPage?this.label('Lokale Titel und TMDB-Treffer','Local titles and TMDB results'):'';
    this.searchStatus.hidden=!this.searchStatus.textContent;
    if(!query) {
      const state=this.card._fullLibraryState;
      this.searchStatus.textContent=state.loading?this.label('Vollständige Bibliothek wird geladen …','Loading complete library …'):state.error==='unknown_command'?this.label('Vollständige Bibliothek benötigt die aktualisierte Mediarr-Integration. Sensor-Ausschnitte werden angezeigt.','Complete library requires the updated Mediarr integration. Showing sensor excerpts.'):state.error?this.label('Bibliothek nicht vollständig erreichbar. Angezeigte Daten können unvollständig sein.','Library not fully reachable. Displayed data may be incomplete.'):'';
      this.searchStatus.hidden=!this.searchStatus.textContent;
    }
    this.moreButton.hidden=visible.length<=this.localLimit && (!query || this.searchPage>=this.totalPages);
    this.moreButton.onclick=()=>{if(visible.length>this.localLimit){this.localLimit+=60;this.render();}else this.searchCatalog(this.searchPage+1);};
    this.moreButton.disabled=this.searching;
    if (!visible.some(entry => entry.key === this.selectedKey)) this.selectedKey = visible[0]?.key;
    this.results.innerHTML = visible.length ? visible.slice(0,this.localLimit).map(entry => `<button type="button" class="media-item library-result ${entry.key===this.selectedKey?'selected':''}" data-key="${esc(entry.key)}" aria-pressed="${entry.key===this.selectedKey}"><span class="library-result-poster">${downloadBadge(entry,this.label.bind(this))}${entry.poster?`<img src="${esc(entry.poster)}" alt="" loading="lazy">`:'<ha-icon icon="mdi:movie-open-outline"></ha-icon>'}</span><span class="media-item-title">${esc(entry.title)}</span><span class="library-result-meta">${esc([entry.year,entry.kind==='tv'?this.label('Serie','Series'):entry.kind==='movie'?this.label('Film','Movie'):this.label('Medientyp unbekannt','Unknown media type'),entry.rating?`★ ${entry.rating}`:''].filter(Boolean).join(' · '))}</span><span class="mediarr-result-summary">${esc(entry.summary)}</span><span class="library-status library-status-${entry.stage}">${esc(this.status(entry))}</span></button>`).join('') : `<p class="library-empty">${esc(query?this.label('Keine passenden Titel gefunden.','No matching titles found.'):this.label('Hier sind noch keine Titel vorhanden.','No titles here yet.'))}</p>`;
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

  async loadMetadata(entry, retry = false) {
    const language=this.card._hass?.language || 'en';
    const key=`${metadataNamespace(this.card)}:${entry.key}`;
    const cached=this.card._mediaMetadataCache.get(key);
    if (this.metadataPending.has(key)) return;
    if (!retry && (this.metadataErrors.has(key) || this.card._metadataBackendState.unsupported || (cached && Date.now()-cached.timestamp<6*60*60*1000))) return;
    this.metadataPending.add(key);
    this.metadataErrors.delete(key);
    if (retry) this.card._metadataBackendState.unsupported=false;
    try {
      const data=await fetchMediaMetadata(this.card._hass,entry,language,this.card.config.streaming_region || 'DE');
      this.card._mediaMetadataCache.set(key,{timestamp:Date.now(),data});
      while(this.card._mediaMetadataCache.size>200) this.card._mediaMetadataCache.delete(this.card._mediaMetadataCache.keys().next().value);
    } catch(error) {
      this.metadataErrors.set(key,error?.code || 'metadata_unavailable');
      if (error?.code==='unknown_command') this.card._metadataBackendState.unsupported=true;
    } finally {
      this.metadataPending.delete(key);
      if (this.card.isConnected) this.refresh();
    }
  }

  metadataMessage(entry) {
    const key=`${metadataNamespace(this.card)}:${entry.key}`;
    if (this.metadataPending.has(key)) return this.label('Filmdetails werden geladen …','Loading title details …');
    const code=this.metadataErrors.get(key);
    if (code==='tmdb_not_configured') return this.label('Für vollständige Details den TMDB-Zugang in der Mediarr-Integration einrichten.','Configure TMDB in the Mediarr integration for complete details.');
    if (code==='unknown_command' || this.card._metadataBackendState.unsupported) return this.label('Vollständige Details benötigen die aktualisierte Mediarr-Sensor-Integration.','Complete details require the updated Mediarr sensor integration.');
    if (code==='metadata_auth') return this.label('Der hinterlegte TMDB-Zugang wurde abgewiesen.','The configured TMDB credential was rejected.');
    if (code==='metadata_ambiguous') return this.label('Dieser Titel konnte nicht eindeutig zugeordnet werden.','This title could not be identified unambiguously.');
    if (code) return this.label('Weitere Details konnten nicht geladen werden.','Additional details could not be loaded.');
    return '';
  }

  renderDetails(entry) {
    if (this._renderedDetailKey !== entry?.key) this.focus.scrollTop = 0;
    this._renderedDetailKey = entry?.key;
    const esc=escapeMediaHtml;
    if (entry && (!entry.summary || !mediaCast(entry.item).length || entry.kind==='unknown' || entry.item.streaming===undefined)) void this.loadMetadata(entry);
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
    const offers=item.streaming;
    const streaming=offers?`<section class="library-streaming"><h2>${esc(this.label('Streaming','Streaming'))} · ${esc(offers.region)}</h2>${[['subscription',this.label('Im Abo','Subscription')],['rent',this.label('Leihen','Rent')],['buy',this.label('Kaufen','Buy')]].map(([key,title])=>offers[key]?.length?`<p><strong>${esc(title)}</strong> ${offers[key].map(provider=>`<span class="streaming-provider">${esc(provider.name)}</span>`).join(' ')}</p>`:'').join('')}${!['subscription','rent','buy'].some(key=>offers[key]?.length)?`<p>${esc(this.label('Keine Anbieterangaben für dieses Land verfügbar.','No provider information available for this country.'))}</p>`:''}<small>${offers.link&&/^https:\/\/www\.themoviedb\.org\//.test(offers.link)?`<a href="${esc(offers.link)}" target="_blank" rel="noopener noreferrer">${esc(this.label('Verfügbarkeit prüfen','Check availability'))}</a> · `:''}JustWatch / TMDB</small></section>`:'';
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
            <div class="library-poster">${downloadBadge(entry,this.label.bind(this))}${entry.poster ? `<img src="${esc(entry.poster)}" alt="${esc(entry.title)}">` : '<ha-icon icon="mdi:movie-open-outline"></ha-icon>'}</div>
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
          <p class="library-metadata-status" role="status">${esc(this.metadataMessage(entry))}</p>
          ${this.metadataMessage(entry) && !this.metadataPending.has(`${metadataNamespace(this.card)}:${entry.key}`) ? `<button type="button" class="library-metadata-retry">${esc(this.label('Details erneut laden','Retry details'))}</button>` : ''}
          <p class="media-details-synopsis">${esc(entry.summary || this.label('Für diesen Titel liegt noch keine Beschreibung vor.', 'No synopsis is available for this title yet.'))}</p>
          ${streaming}
          ${directors ? `<p class="library-director"><strong>${esc(this.label('Regie', 'Director'))}</strong> ${esc(directors)}</p>` : ''}
          <h2>${esc(this.label('Besetzung', 'Cast'))}</h2>${castMarkup || castText ? `<div class="library-cast">${castMarkup || esc(castText)}</div>` : `<p>${esc(this.label('Für diesen Titel ist noch keine Besetzung verfügbar.', 'Cast information is not available for this title yet.'))}</p>`}
          <details class="library-sources"><summary>${esc(this.label('Datenquellen', 'Data sources'))}</summary>${esc([...new Set(entry.refs.map(ref => ref.provider))].join(', '))}</details>
        </div>
      </article>`;
    const retry=this.focus.querySelector('.library-metadata-retry');
    if(retry) retry.onclick=()=>{void this.loadMetadata(entry,true);this.renderDetails(entry);};
    const backdrop=this.focus.querySelector('.library-backdrop');
    if(entry.banner) backdrop.style.backgroundImage=`url(${JSON.stringify(entry.banner)})`;
    const play = this.focus.querySelector('.library-play');
    if (play) play.onclick=()=>this.card._showClientSelector(playable.item);
    const action=this.focus.querySelector('.library-request:not(.library-play)');
    if(action) action.onclick=()=>this.request(entry);
  }

  requestService(entry) {
    if (!['movie','tv'].includes(entry.kind)) return null;
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
      if(entry.catalog && entry.ids.tmdb) data.tmdb_id=Number(entry.ids.tmdb);
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
      if(entry.catalog) this.card._catalogRequests.set(entry.key,{...entry.item,tmdb_id:Number(entry.ids.tmdb),media_type:entry.kind});
    } catch(error) { this.messages.set(entry.key,error?.message||this.label('Hinzufügen fehlgeschlagen.','Could not add title.')); }
    finally { this.busy.delete(entry.key);this.refresh(); }
  }
}
