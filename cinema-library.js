import {MediaLibraryView, mediaEntriesForCard, mediaText, mediaNames, mediaImage, mediaDownload, escapeMediaHtml, downloadBadge, hasUnwatchedMedia, seriesEpisodeLabel} from './media-library.js';

const esc=escapeMediaHtml;
const identity=item=>`${item.media_type}:${item.tmdb_id}`;
const entryIdentity=entry=>`${entry.kind}:${entry.ids.tmdb}`;
// Preserve loaded images, focus and native controls during live HA updates.
function patchCinemaDOM(target, markup) {
  const template=document.createElement('template');template.innerHTML=markup;
  const patch=(parent,nextParent)=>{
    const desired=[...nextParent.childNodes];
    desired.forEach((next,index)=>{
      let current=parent.childNodes[index];
      if(!current){parent.append(next.cloneNode(true));return;}
      if(current.nodeType!==next.nodeType||current.nodeName!==next.nodeName||
         (current.dataset?.selectKey&&next.dataset?.selectKey&&current.dataset.selectKey!==next.dataset.selectKey)) {
        current.replaceWith(next.cloneNode(true));return;
      }
      if(current.nodeType===Node.TEXT_NODE){if(current.data!==next.data)current.data=next.data;return;}
      if(!(current instanceof Element))return;
      for(const attr of [...current.attributes])if(!next.hasAttribute(attr.name)&&!(attr.name==='style'&&current.classList.contains('cinema-hero-backdrop')))current.removeAttribute(attr.name);
      for(const attr of next.attributes)if(current.getAttribute(attr.name)!==attr.value)current.setAttribute(attr.name,attr.value);
      patch(current,next);
      if(current instanceof HTMLInputElement&&current.checked!==next.checked)current.checked=next.checked;
      if(current instanceof HTMLSelectElement&&current.value!==next.value)current.value=next.value;
    });
    while(parent.childNodes.length>desired.length)parent.lastChild.remove();
  };
  patch(target,template.content);
}
const timestamp=value=>{
  if(typeof value==='number')return value<1e12?value*1000:value;
  return /^\d+$/.test(String(value||''))?timestamp(Number(value)):Date.parse(value)||0;
};

export function curatedCinemaEntries(entries,{selection='recent',kind='all',genre='',unseen=true,collectionKeys=[]}={}) {
  return entries.filter(entry=>entry.stage==='ready' && (kind==='all'||entry.kind===kind) &&
    (!genre||mediaNames(entry.item.genres||entry.item.genre).includes(genre)) && (!unseen||hasUnwatchedMedia(entry)) &&
    (selection==='unwatched'?hasUnwatchedMedia(entry):selection==='started'?entry.item.in_progress===true:
      selection.startsWith('collection:')?entry.refs.some(ref=>collectionKeys.includes(ref.item.library_key)):true))
    .sort((a,b)=>timestamp(b.item.added||b.item.added_at)-timestamp(a.item.added||a.item.added_at)||a.title.localeCompare(b.title));
}

export class CinemaLibraryView extends MediaLibraryView {
  constructor(card) {
    super(card);
    this.selection=card._cinemaSelection||'recent';this.kind='all';this.genre='';this.unseen=true;
    this.period='week';this.upcomingMode='tracked';this.discovery={trending:[],personal:[],upcoming:[],errors:{},account:{}};
    this.collections=[];this.collectionKeys=[];this.railLimits={};this.detailKey=card._initialLibrarySelection?.selectedKey;
    this.collectionVersion=0;this.discoveryVersion=0;this.alive=true;
  }

  mount() {
    const content=this.card.querySelector('.card-content');
    this.card.querySelectorAll('.section, .media-details-panel').forEach(el=>el.remove());
    this.card.content.hidden=true;this.card.classList.add('mediarr-cinema');
    this.shell=document.createElement('div');this.shell.className='cinema-shell';
    this.shell.innerHTML=`<header class="cinema-toolbar"><span class="cinema-brand"><ha-icon icon="mdi:movie-open-outline"></ha-icon><strong>Mediarr</strong></span><label class="cinema-search-label"><span class="sr-only">${esc(this.label('Filme und Serien suchen','Search movies and series'))}</span><ha-icon icon="mdi:magnify" aria-hidden="true"></ha-icon><input class="mediarr-search" type="search" maxlength="128" placeholder="${esc(this.label('Filme und Serien suchen …','Search movies and series …'))}"></label><button class="cinema-download-shortcut" type="button" aria-label="${esc(this.label('Laufende Downloads','Active downloads'))}"><ha-icon icon="mdi:download-outline"></ha-icon><span></span></button></header><main class="cinema-body"><p class="cinema-library-status" role="status"></p><section class="cinema-detail" hidden><button type="button" class="cinema-back">← ${esc(this.label('Zurück zur Auswahl','Back to selection'))}</button><div class="library-focus"></div></section><div class="cinema-home"></div><section class="cinema-search-results" hidden><p class="mediarr-search-status" role="status"></p><p class="library-catalog-status" role="status"></p><div class="library-results"></div><button class="library-load-more" type="button">${esc(this.label('Weitere Treffer','More results'))}</button></section></main>`;
    content.append(this.shell);this.input=this.shell.querySelector('input');this.body=this.shell.querySelector('.cinema-body');
    this.home=this.shell.querySelector('.cinema-home');this.focus=this.shell.querySelector('.library-focus');
    this.results=this.shell.querySelector('.library-results');this.searchStatus=this.shell.querySelector('.library-catalog-status');
    this.moreButton=this.shell.querySelector('.library-load-more');
    this.input.oninput=()=>{if(this.detailKey)this.back(false);this.scheduleSearch();};
    this.shell.querySelector('.cinema-back').onclick=()=>this.back();
    this.shell.querySelector('.cinema-download-shortcut').onclick=()=>{this.input.value='';this.back(false);this.scheduleSearch();this.home.querySelector('.cinema-downloads')?.scrollIntoView({behavior:'smooth',block:'start'});};
    this.refresh();this.loadLibrary();this.loadDiscovery();this.loadCollections();
    this.libraryTimer=setInterval(()=>{if(document.visibilityState==='visible'&&this.card.isConnected)this.loadLibrary(true);},60000);
  }

  async ws(type,data={}) {
    if(typeof this.card._hass?.callWS!=='function')throw {code:'unknown_command'};
    let timer;
    try{return await Promise.race([this.card._hass.callWS({type,...data}),new Promise((_,reject)=>timer=setTimeout(()=>reject({code:'metadata_unavailable'}),30000))]);}
    finally{clearTimeout(timer);}
  }

  async loadDiscovery() {
    const version=++this.discoveryVersion;this.discoveryLoading=true;
    try {
      const data=await this.ws('mediarr/cinema',{language:this.card._hass?.language||'en',region:this.card.config.streaming_region||'DE',period:this.period});
      if(!this.alive||version!==this.discoveryVersion)return;
      this.discovery={trending:[],personal:[],upcoming:[],errors:{},account:{},...data};this.discoveryError=null;
    }catch(error){if(version===this.discoveryVersion)this.discoveryError=error?.code||'metadata_unavailable';}
    finally{if(this.alive&&version===this.discoveryVersion){this.discoveryLoading=false;this.refresh();}}
  }

  async loadCollections(id) {
    const version=++this.collectionVersion;this.collectionLoading=true;this.render();
    try {
      const data=await this.ws('mediarr/collections',id?{collection_id:id}:{});
      if(!this.alive||version!==this.collectionVersion)return;
      if(id)this.collectionKeys=data.keys||[];else this.collections=data.collections||[];
      this.collectionError=null;
    }catch(error){if(version===this.collectionVersion)this.collectionError=error?.code||'library_unavailable';}
    finally{if(this.alive&&version===this.collectionVersion){this.collectionLoading=false;this.render();}}
  }

  refresh() {
    const extra=[...this.catalog,...this.discovery.trending,...this.discovery.personal,...this.discovery.upcoming];
    this.entries=mediaEntriesForCard(this.card,extra);
    this.render();
  }

  status(entry) {
    if(entry.stage==='ready')return this.label('In deiner Mediathek','In your library');
    if(entry.stage==='waiting'&&!entry.optimistic&&!mediaDownload(entry))return this.label('Vorgemerkt · ','Tracked · ')+super.status(entry);
    if(entry.stage==='discover')return this.label('Neu entdecken','Discover');
    return super.status(entry);
  }

  sourceEntries(name) {
    const identities=new Set(this.discovery[name].map(identity));
    const entries=this.entries.filter(entry=>identities.has(entryIdentity(entry)));
    // Keep the upstream ordering. Existing library/queue data supplies status.
    const order=new Map(this.discovery[name].map((item,index)=>[identity(item),index]));
    return entries.sort((a,b)=>order.get(entryIdentity(a))-order.get(entryIdentity(b)));
  }

  poster(entry) {
    return `<button class="cinema-poster" type="button" data-select-key="${esc(entry.key)}" aria-label="${esc(entry.title)}"><span class="cinema-poster-art">${entry.poster?`<img src="${esc(entry.poster)}" alt="" loading="lazy">`:'<ha-icon icon="mdi:movie-open-outline"></ha-icon>'}<span class="cinema-poster-status cinema-status-${entry.stage}" title="${esc(this.status(entry))}">${entry.stage==='ready'?'✓':entry.stage==='waiting'?'◷':'+'}</span>${downloadBadge(entry,this.label.bind(this))}</span><strong>${esc(entry.title)}</strong><small>${esc(entry.year||this.label(entry.kind==='tv'?'Serie':'Film',entry.kind==='tv'?'Series':'Movie'))}</small>${entry.stage==='ready'&&entry.kind==='tv'?`<span class="cinema-episode-status">${esc(seriesEpisodeLabel(entry,this.label.bind(this)))}</span>`:''}</button>`;
  }

  rail(name,entries,empty='') {
    const limit=this.railLimits[name]||24;
    return `<div class="cinema-rail" data-rail="${name}" role="region" aria-label="${esc(name)}">${entries.length?entries.slice(0,limit).map(entry=>this.poster(entry)).join(''):`<p class="cinema-empty">${esc(empty||this.label('Keine passenden Titel.','No matching titles.'))}</p>`}${entries.length>limit?`<button class="cinema-rail-more" type="button" data-more="${name}">${esc(this.label('Mehr anzeigen','Show more'))}</button>`:''}</div>`;
  }

  render() {
    if(!this.shell)return;
    const railScroll=new Map([...this.home.querySelectorAll('[data-rail]')].map(el=>[el.dataset.rail,el.scrollLeft]));
    const activeKey=this.home.querySelector('button:focus')?.dataset.selectKey;
    const state=this.card._fullLibraryState;
    this.shell.querySelector('.cinema-library-status').textContent=state.loading?this.label('Mediathek wird geladen …','Loading library …'):state.error==='unknown_command'?this.label('Für die vollständige Mediathek die Mediarr-Integration aktualisieren.','Update the Mediarr integration for the full library.'):state.error?this.label('Nicht alle Quellen erreichbar. Die Auswahl kann unvollständig sein.','Some sources are unavailable. The selection may be incomplete.'):'';
    const downloads=this.entries.filter(entry=>mediaDownload(entry));
    this.shell.querySelector('.cinema-download-shortcut span').textContent=downloads.length||'';
    this.shell.querySelector('.cinema-detail').hidden=!this.detailKey;
    this.shell.querySelector('.cinema-search-results').hidden=!!this.detailKey||!this.input.value.trim();
    this.home.hidden=!!this.detailKey||!!this.input.value.trim();
    if(this.detailKey) {
      const entry=this.entries.find(entry=>entry.key===this.detailKey);
      const signature=JSON.stringify([entry,this.metadataMessage(entry||{}),this.messages.get(entry?.key),this.busy.has(entry?.key)]);
      if(this.detailSignature===signature)return;
      this.detailSignature=signature;
      this.selectedKey=this.detailKey;super.renderDetails(entry);
      this.focus.querySelector('.library-play')?.remove();
      if(entry?.stage==='ready'&&entry.refs.some(ref=>ref.provider==='plex'&&ref.item.library_key)) {
        const play=document.createElement('button');play.type='button';play.className='library-request cinema-detail-play';play.innerHTML=`<ha-icon icon="mdi:play" aria-hidden="true"></ha-icon>${esc(this.label('Abspielen','Play'))}`;
        play.onclick=()=>this.play(entry);this.focus.querySelector('.library-actions').prepend(play);
      }
      const trailer=this.focus.querySelector('.library-trailer');
      if(trailer)trailer.onclick=event=>{event.preventDefault();this.showTrailer(entry,trailer.href,event.currentTarget);};
      this.bindImages(this.focus);return;
    }
    if(this.input.value.trim()){this.renderSearch();return;}
    const own=curatedCinemaEntries(this.entries,{selection:this.selection,kind:this.kind,genre:this.genre,unseen:this.unseen,collectionKeys:this.collectionKeys});
    const hero=own.find(entry=>entry.key===this.heroKey)||own[0]||this.sourceEntries('trending')[0];
    this.heroKey=hero?.key;
    const genres=[...new Set(this.entries.filter(entry=>entry.stage==='ready').flatMap(entry=>mediaNames(entry.item.genres||entry.item.genre)))].sort();
    const trending=this.sourceEntries('trending').length?this.sourceEntries('trending'):this.entries.filter(entry=>entry.stage==='discover'&&entry.refs.some(ref=>ref.provider==='tmdb'&&!ref.entityKey.includes('upcoming'))).slice(0,20);
    const personal=this.sourceEntries('personal').filter(entry=>entry.stage==='discover');
    const upcoming=this.upcomingMode==='all'?this.sourceEntries('upcoming'):this.entries.filter(entry=>entry.stage==='waiting'&&!mediaDownload(entry));
    const options=[['recent',this.label('Zuletzt hinzugefügt','Recently added')],['unwatched',this.label('Noch nicht gesehen','Unwatched')],['started',this.label('Angefangen','Started')]];
    const homeMarkup=`${hero?this.heroMarkup(hero):`<section class="cinema-hero cinema-hero-empty"><div class="cinema-hero-copy"><h1>${esc(this.label('Dein nächster Filmabend','Your next movie night'))}</h1><p>${esc(this.label('Durchsuche Filme und Serien oder lade deine Plex-Mediathek.','Search movies and series or load your Plex library.'))}</p><button type="button" class="cinema-reload">${esc(this.label('Mediathek laden','Load library'))}</button></div></section>`}
      <section class="cinema-library-section"><div class="cinema-section-heading"><h2>${esc(this.label('Aus deiner Mediathek','From your library'))}</h2><div class="cinema-filters"><label><span class="sr-only">${esc(this.label('Auswahl','Selection'))}</span><select class="cinema-selection">${options.map(([key,title])=>`<option value="${key}" ${this.selection===key?'selected':''}>${esc(title)}</option>`).join('')}${this.collections.length?`<optgroup label="Plex">${this.collections.map(c=>`<option value="collection:${esc(c.id)}" ${this.selection==='collection:'+c.id?'selected':''}>${esc(c.title)}</option>`).join('')}</optgroup>`:''}</select></label><label><span class="sr-only">${esc(this.label('Medientyp','Media type'))}</span><select class="cinema-kind">${[['all',this.label('Filme & Serien','Movies & series')],['movie',this.label('Filme','Movies')],['tv',this.label('Serien','Series')]].map(([key,title])=>`<option value="${key}" ${this.kind===key?'selected':''}>${esc(title)}</option>`).join('')}</select></label><label><span class="sr-only">Genre</span><select class="cinema-genre"><option value="">Genre</option>${genres.map(g=>`<option value="${esc(g)}" ${this.genre===g?'selected':''}>${esc(g)}</option>`).join('')}</select></label><label class="cinema-unseen"><input type="checkbox" ${this.unseen||this.selection==='unwatched'?'checked':''} ${this.selection==='unwatched'?'disabled':''}>${esc(this.label('Ungesehen','Unwatched'))}</label></div></div>${this.selection.startsWith('collection:')&&this.collectionLoading?`<p role="status">${esc(this.label('Sammlung wird geladen …','Loading collection …'))}</p>`:this.selection.startsWith('collection:')&&this.collectionError?`<p role="status">${esc(this.label('Plex-Sammlung nicht erreichbar.','Plex collection unavailable.'))}</p>`:''}${this.rail('library',own)}</section>
      <div class="cinema-discovery"><section><div class="cinema-section-heading"><h2>Trending</h2><label><span class="sr-only">${esc(this.label('Zeitraum','Period'))}</span><select class="cinema-period"><option value="week" ${this.period==='week'?'selected':''}>${esc(this.label('Diese Woche','This week'))}</option><option value="day" ${this.period==='day'?'selected':''}>${esc(this.label('Heute','Today'))}</option></select></label></div>${this.rail('trending',trending,this.discoveryLoading?this.label('Trending wird geladen …','Loading trending …'):this.label('Trending momentan nicht verfügbar.','Trending is currently unavailable.'))}</section><section><div class="cinema-section-heading"><h2>${esc(this.label('Für deinen Geschmack','Picked for you'))}</h2><button type="button" class="cinema-account-settings">${esc(this.discovery.account.connected?'TMDB ✓':this.label('TMDB-Konto','TMDB account'))}</button></div>${personal.length?this.rail('personal',personal):this.accountMarkup()}</section></div>
      <section class="cinema-upcoming"><div class="cinema-section-heading"><h2>${esc(this.label('Demnächst','Coming soon'))}</h2><label><span class="sr-only">${esc(this.label('Kommende Titel','Upcoming titles'))}</span><select class="cinema-upcoming-mode"><option value="tracked" ${this.upcomingMode==='tracked'?'selected':''}>${esc(this.label('Deine vorgemerkten Titel','Your tracked titles'))}</option><option value="all" ${this.upcomingMode==='all'?'selected':''}>${esc(this.label('Kommende Veröffentlichungen','Upcoming releases'))}</option></select></label></div><div class="cinema-upcoming-rail">${upcoming.slice(0,12).map(entry=>`<button type="button" class="cinema-upcoming-card" data-select-key="${esc(entry.key)}"><span>${entry.banner||entry.poster?`<img src="${esc(entry.banner||entry.poster)}" alt="" loading="lazy">`:'<ha-icon icon="mdi:movie-open-outline"></ha-icon>'}</span><strong>${esc(entry.title)}</strong><small>${esc(this.releaseLabel(entry))}</small></button>`).join('')||`<p class="cinema-empty">${esc(this.label('Keine kommenden Titel in dieser Auswahl.','No upcoming titles in this selection.'))}</p>`}</div></section>
      <section class="cinema-downloads"><div class="cinema-section-heading"><h2>${esc(this.label('Wird gerade geladen','Downloading'))}</h2><button type="button" class="cinema-reload">${esc(this.label('Aktualisieren','Refresh'))}</button></div><div class="cinema-download-grid">${downloads.map(entry=>`<button class="cinema-download-item" type="button" data-select-key="${esc(entry.key)}">${entry.poster?`<img src="${esc(entry.poster)}" alt="" loading="lazy">`:'<ha-icon icon="mdi:movie-open-outline"></ha-icon>'}<span><strong>${esc(entry.title)}</strong>${downloadBadge(entry,this.label.bind(this))}</span></button>`).join('')||`<p class="cinema-empty">${esc(this.label('Gerade keine aktiven Downloads.','No active downloads.'))}</p>`}</div></section>`;
    const signature=homeMarkup+(hero?.banner||'');
    if(this.homeSignature===signature)return;
    this.homeSignature=signature;patchCinemaDOM(this.home,homeMarkup);
    this.bindHome(hero);
    for(const el of this.home.querySelectorAll('[data-rail]'))el.scrollLeft=railScroll.get(el.dataset.rail)||0;
    if(activeKey)[...this.home.querySelectorAll('[data-select-key]')].find(el=>el.dataset.selectKey===activeKey)?.focus({preventScroll:true});
    this.bindImages(this.home);
    // Manager lists may have IDs but no cover; enrich only a bounded visible set.
    for(const entry of upcoming.slice(0,12).filter(entry=>!entry.poster))void this.loadMetadata(entry);
    if(hero?.banner){const bg=this.home.querySelector('.cinema-hero-backdrop');if(bg)bg.style.backgroundImage=`url(${JSON.stringify(hero.banner)})`;}
    if(hero && (!hero.banner || hero.banner===hero.poster || hero.item.trailer===undefined))void this.loadMetadata(hero);
  }

  heroMarkup(entry) {
    const canPlay=entry.stage==='ready'&&entry.refs.some(ref=>ref.provider==='plex'&&ref.item.library_key);
    const canRequest=entry.stage==='discover'&&this.requestService(entry);
    const action=canPlay?this.label('Abspielen','Play'):canRequest?this.label('Hinzufügen','Add'):this.label('Details','Details');
    return `<section class="cinema-hero"><div class="cinema-hero-backdrop"></div><div class="cinema-hero-copy"><h1>${esc(entry.title)}</h1><p class="cinema-hero-meta">${esc([entry.year,mediaNames(entry.item.genres).slice(0,2).join(' · '),entry.item.runtime?`${entry.item.runtime} min`:null,entry.rating?`★ ${entry.rating}`:null].filter(Boolean).join(' · '))}</p><span class="cinema-availability cinema-availability-${entry.stage}">${esc(this.status(entry))}</span><p class="cinema-hero-synopsis">${esc(entry.summary||this.label('Öffne den Film für Handlung und Besetzung.','Open this title for synopsis and cast.'))}</p><div class="cinema-hero-actions"><button type="button" class="cinema-primary" data-hero-action="${canPlay?'play':canRequest?'request':'details'}">${canPlay?'<ha-icon icon="mdi:play" aria-hidden="true"></ha-icon>':''}${esc(action)}</button>${entry.item.trailer?.url?`<button type="button" class="cinema-hero-trailer"><ha-icon icon="mdi:movie-play-outline" aria-hidden="true"></ha-icon>${esc(this.label('Trailer','Trailer'))}</button>`:''}${canPlay||canRequest?`<button type="button" data-select-key="${esc(entry.key)}">${esc(this.label('Details','Details'))}</button>`:''}</div></div></section>`;
  }

  accountMarkup() {
    const errors=this.discovery.errors||{};
    const text=this.accountMessage||(!this.discovery.account.connected?this.label('Verbinde dein TMDB-Konto für persönliche Empfehlungen.','Connect your TMDB account for personal recommendations.'):errors.personal?this.label('TMDB-Empfehlungen sind momentan nicht verfügbar.','TMDB recommendations are currently unavailable.'):this.label('Noch keine neuen Kontoempfehlungen. Bewertungen in TMDB helfen bei der Auswahl.','No new account recommendations yet. Ratings in TMDB help guide suggestions.'));
    return `<div class="cinema-account"><ha-icon icon="mdi:account-star-outline"></ha-icon><p role="status">${esc(text)}</p>${this.accountUrl?`<a href="${esc(this.accountUrl)}" target="_blank" rel="noopener noreferrer">${esc(this.label('TMDB-Freigabe öffnen','Open TMDB authorization'))}</a><button type="button" data-account="finish">${esc(this.label('Ich habe bestätigt','I approved it'))}</button>`:!this.discovery.account.connected?`<button type="button" data-account="start">${esc(this.label('TMDB-Konto verbinden','Connect TMDB account'))}</button>`:''}</div>`;
  }

  releaseLabel(entry) {
    const raw=this.discovery.upcoming.find(item=>identity(item)===entryIdentity(entry));
    const value=entry.item.release_date||entry.item.first_air_date||entry.item.digitalRelease||raw?.release_date;
    const time=timestamp(value);
    const kind=entry.item.release_kind;
    const caption=kind==='cinema'?this.label('Kinostart: ','Cinema release: '):kind==='digital'?this.label('Digital: ','Digital release: '):kind==='physical'?this.label('Disc: ','Disc release: '):kind==='episode'?this.label('Nächste Folge: ','Next episode: '):this.label('Veröffentlichung: ','Release: ');
    return time>Date.now()?`${caption}${new Date(time).toLocaleDateString(this.card._hass?.language||'en')}`:this.label('Wartet auf Verfügbarkeit','Awaiting availability');
  }

  bindHome(hero) {
    this.home.querySelectorAll('[data-select-key]').forEach(button=>button.onclick=()=>this.openDetails(button.dataset.selectKey,button));
    const primary=this.home.querySelector('.cinema-primary');
    if(primary)primary.onclick=()=>{
      const action=this.home.querySelector('.cinema-primary').dataset.heroAction;
      if(action==='play')this.play(hero);
      else if(action==='request'){this.openDetails(hero.key);this.request(hero);}
      else this.openDetails(hero.key);
    };
    const trailer=this.home.querySelector('.cinema-hero-trailer');
    if(trailer)trailer.onclick=event=>this.showTrailer(hero,hero.item.trailer?.url,event.currentTarget);
    this.home.querySelector('.cinema-selection').onchange=event=>{this.selection=event.target.value;this.card._cinemaSelection=this.selection;this.heroKey=null;this.collectionKeys=[];this.render();if(this.selection.startsWith('collection:'))this.loadCollections(this.selection.slice(11));};
    this.home.querySelector('.cinema-kind').onchange=event=>{this.kind=event.target.value;this.heroKey=null;this.render();};
    this.home.querySelector('.cinema-genre').onchange=event=>{this.genre=event.target.value;this.heroKey=null;this.render();};
    this.home.querySelector('.cinema-unseen input').onchange=event=>{this.unseen=event.target.checked;this.heroKey=null;this.render();};
    this.home.querySelector('.cinema-period').onchange=event=>{this.period=event.target.value;this.loadDiscovery();};
    this.home.querySelector('.cinema-upcoming-mode').onchange=event=>{this.upcomingMode=event.target.value;this.render();};
    this.home.querySelectorAll('.cinema-reload').forEach(button=>button.onclick=()=>this.loadLibrary(true));
    this.home.querySelectorAll('[data-more]').forEach(button=>button.onclick=()=>{this.railLimits[button.dataset.more]=(this.railLimits[button.dataset.more]||24)+24;this.render();});
    this.home.querySelectorAll('[data-account]').forEach(button=>button.onclick=()=>this.accountAction(button.dataset.account));
    this.home.querySelector('.cinema-account-settings').onclick=()=>{if(this.discovery.account.connected){this.accountMessage=this.label('Das TMDB-Konto ist verbunden.','TMDB account is connected.');this.showAccount=true;this.home.querySelector('.cinema-account-settings').outerHTML=`<button class="cinema-disconnect" type="button">${esc(this.label('TMDB trennen','Disconnect TMDB'))}</button>`;this.home.querySelector('.cinema-disconnect').onclick=()=>this.accountAction('disconnect');}else this.accountAction('start');};
  }

  async accountAction(action) {
    try {
      const data=await this.ws('mediarr/tmdb_account',{action});
      if(!this.alive)return;
      this.accountUrl=data.authorization_url&&/^https:\/\/www\.themoviedb\.org\/auth\/access\?/.test(data.authorization_url)?data.authorization_url:null;
      this.discovery.account=data;this.accountMessage=null;
      if(action==='finish'||action==='disconnect')this.loadDiscovery();
    }catch(error){if(['tmdb_account_auth','tmdb_account_expired'].includes(error?.code))this.accountUrl=null;this.accountMessage=error?.code==='tmdb_read_token_required'?this.label('In den Mediarr-TMDB-Optionen den API Read Access Token hinterlegen.','Set the API Read Access Token in the Mediarr TMDB options.'):error?.code==='unknown_command'?this.label('Für die Kontoverbindung die Mediarr-Integration aktualisieren.','Update Mediarr integration to connect your account.'):this.label('TMDB-Freigabe noch nicht abgeschlossen oder nicht erreichbar.','TMDB authorization is not complete or is unavailable.');}
    finally{if(this.alive)this.render();}
  }

  async play(entry) {
    if(this.playerDialog)return;
    const ref=entry.refs.find(ref=>ref.provider==='plex'&&ref.item.library_key);
    if(!ref)return;
    const dialog=this.playerDialog=document.createElement('dialog');dialog.className='cinema-player-dialog';
    dialog.innerHTML=`<h2>${esc(this.label('Auf welchem Gerät?','Choose a player'))}</h2><div class="cinema-player-list" role="status">${esc(this.label('Plex-Player werden geladen …','Loading Plex players …'))}</div><button class="cinema-player-refresh" type="button">${esc(this.label('Liste aktualisieren','Refresh players'))}</button><button class="cinema-player-close" type="button">${esc(this.label('Schließen','Close'))}</button>`;
    this.shell.append(dialog);dialog.showModal();
    const close=()=>{dialog.close();dialog.remove();this.playerDialog=null;};
    dialog.querySelector('.cinema-player-close').onclick=close;
    dialog.addEventListener('cancel',event=>{event.preventDefault();event.stopPropagation();close();});
    dialog.querySelector('.cinema-player-refresh').onclick=()=>this.loadPlayers(dialog,ref);
    await this.loadPlayers(dialog,ref);
  }

  async loadPlayers(dialog,ref) {
    const refresh=dialog.querySelector('.cinema-player-refresh');refresh.disabled=true;
    try {
      const data=await this.ws('mediarr/players');if(!dialog.isConnected)return;
      const list=dialog.querySelector('.cinema-player-list');
      list.innerHTML=data.players?.length?data.players.map(player=>`<button type="button" data-player="${esc(player.entity_id)}" ${player.available?'':'disabled'}>${esc(player.name)}${!player.available?` · ${esc(player.reason==='disabled'?this.label('In HA deaktiviert','Disabled in HA'):player.reason==='not_loaded'?this.label('Nicht geladen','Not loaded'):this.label('Nicht erreichbar','Unavailable'))}`:''}</button>`).join(''):`<p>${esc(this.label('Kein Plex-Player verfügbar. Öffne Plex auf dem Zielgerät und richte die offizielle Plex-Integration in Home Assistant ein.','No Plex player available. Open Plex on your device and configure the official Plex integration in Home Assistant.'))}</p>`;
      if(data.players?.length&&!data.players.some(player=>player.available)){const hint=document.createElement('p');hint.textContent=this.label('Öffne Plex auf dem Zielgerät, erlaube dort die Fernsteuerung und aktualisiere nach einigen Sekunden die Liste. Deaktivierte Player in HA unter Einstellungen → Geräte & Dienste → Entitäten aktivieren.','Open Plex on the target device, allow remote control and refresh this list after a few seconds. Enable disabled players under HA Settings → Devices & services → Entities.');list.append(hint);}
      list.querySelectorAll('[data-player]').forEach(button=>button.onclick=async()=>{
        button.disabled=true;
        try {
          await this.ws('mediarr/play',{entity_id:button.dataset.player,library_key:ref.item.library_key});
          if(dialog.isConnected){list.textContent=this.label('Wiedergabe angefordert.','Playback requested.');}
        }catch{if(dialog.isConnected){button.disabled=false;const message=document.createElement('p');message.textContent=this.label('Wiedergabe konnte nicht gestartet werden. Prüfe Plex und das Zielgerät.','Could not start playback. Check Plex and the selected device.');list.append(message);}}
      });
    }catch{if(dialog.isConnected)dialog.querySelector('.cinema-player-list').textContent=this.label('Plex-Player nicht erreichbar. Prüfe die Mediarr-Integration.','Plex players unavailable. Check the Mediarr integration.');}
    finally{if(dialog.isConnected)refresh.disabled=false;}
  }

  showTrailer(entry,url,opener) {
    const match=/^https:\/\/www\.youtube\.com\/watch\?v=([A-Za-z0-9_-]{11})$/.exec(url);
    if(!match)return;
    this.closeTrailer();this.trailerOpener=opener;
    const window=this.trailerWindow=document.createElement('section');
    window.className='cinema-trailer-window';window.setAttribute('role','dialog');
    window.setAttribute('aria-label',this.label('Trailer','Trailer')+' · '+entry.title);
    window.innerHTML=`<header><strong>${esc(entry.title)}</strong><button class="cinema-trailer-close" type="button" aria-label="${esc(this.label('Trailer schließen','Close trailer'))}">✕</button></header><iframe title="${esc(this.label('Trailer zu ','Trailer for ')+entry.title)}" src="https://www.youtube-nocookie.com/embed/${match[1]}?autoplay=1&playsinline=1&rel=0" allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowfullscreen referrerpolicy="strict-origin-when-cross-origin"></iframe><a href="${esc(url)}" target="_blank" rel="noopener noreferrer">${esc(this.label('Falls das Video hier nicht abspielt: Auf YouTube öffnen','If the video cannot play here: Open on YouTube'))}</a>`;
    window.querySelector('button').onclick=()=>this.closeTrailer();
    this.trailerKeyHandler=event=>{if(event.key==='Escape'){event.preventDefault();event.stopImmediatePropagation();this.closeTrailer();}};
    this.shell.addEventListener('keydown',this.trailerKeyHandler,true);
    this.shell.append(window);window.querySelector('button').focus({preventScroll:true});
  }

  closeTrailer() {
    if(!this.trailerWindow)return;
    this.trailerWindow.querySelector('iframe')?.remove();
    this.trailerWindow.remove();this.trailerWindow=null;
    this.shell.removeEventListener('keydown',this.trailerKeyHandler,true);
    this.trailerKeyHandler=null;
    if(this.trailerOpener?.isConnected)this.trailerOpener.focus({preventScroll:true});
    this.trailerOpener=null;
  }

  renderSearch() {
    const query=this.input.value.trim().toLocaleLowerCase();
    const ids=new Set(this.catalog.map(identity));
    const visible=this.entries.filter(entry=>ids.has(entryIdentity(entry))||`${entry.title} ${entry.year} ${entry.summary}`.toLocaleLowerCase().includes(query));
    this.shell.querySelector('.mediarr-search-status').textContent=`${visible.length} ${this.label('Treffer · Deine Mediathek und neue Titel','matches · Your library and new titles')}`;
    this.searchStatus.textContent=this.searching?this.label('Suche läuft …','Searching …'):this.searchError?this.label('Katalogsuche nicht verfügbar. Treffer aus deinen Daten werden angezeigt.','Catalog search unavailable. Showing matches from your data.'):query.length<2?this.label('Ab zwei Zeichen auch neue Titel finden.','Type at least two characters to find new titles.'):'';
    const resultsMarkup=visible.slice(0,this.localLimit).map(entry=>`<button type="button" class="cinema-search-result" data-select-key="${esc(entry.key)}"><span class="cinema-result-poster">${entry.poster?`<img src="${esc(entry.poster)}" alt="">`:'<ha-icon icon="mdi:movie-open-outline"></ha-icon>'}${downloadBadge(entry,this.label.bind(this))}</span><span class="cinema-result-copy"><strong>${esc(entry.title)}</strong><small>${esc([entry.year,entry.kind==='tv'?this.label('Serie','Series'):this.label('Film','Movie'),entry.rating?`★ ${entry.rating}`:''].filter(Boolean).join(' · '))}</small><span>${esc(entry.summary)}</span></span><span class="cinema-availability cinema-availability-${entry.stage}">${esc(this.status(entry))}</span></button>`).join('')||`<p class="cinema-empty">${esc(this.label('Keine passenden Titel gefunden.','No matching titles found.'))}</p>`;
    if(this.resultsMarkup!==resultsMarkup){patchCinemaDOM(this.results,resultsMarkup);this.resultsMarkup=resultsMarkup;}
    this.results.querySelectorAll('[data-select-key]').forEach(button=>button.onclick=()=>this.openDetails(button.dataset.selectKey,button));
    this.moreButton.hidden=visible.length<=this.localLimit && this.searchPage>=this.totalPages;
    this.moreButton.disabled=this.searching;
    this.moreButton.onclick=()=>{if(visible.length>this.localLimit){this.localLimit+=60;this.renderSearch();}else this.searchCatalog(this.searchPage+1);};
    this.bindImages(this.results);
  }

  openDetails(key,button) {
    this.returnSurface=this.scrollSurface();this.previousScroll=this.returnSurface.scrollTop;this.returnKey=key;this.detailKey=key;this.render();this.scrollSurface().scrollTop=0;
    this.shell.querySelector('.cinema-back').focus({preventScroll:true});
  }

  back(restore=true) {
    this.detailKey=null;this.render();
    if(restore){(this.returnSurface||this.scrollSurface()).scrollTop=this.previousScroll||0;[...this.shell.querySelectorAll('[data-select-key]')].find(el=>el.dataset.selectKey===this.returnKey)?.focus({preventScroll:true});}
  }

  scrollSurface() {
    let node=this.body;
    while(node instanceof HTMLElement) {
      if(/auto|scroll/.test(getComputedStyle(node).overflowY))return node;
      node=node.parentElement||node.getRootNode()?.host;
    }
    return document.scrollingElement;
  }

  bindImages(root) {root.querySelectorAll('img').forEach(img=>img.onerror=()=>{img.onerror=null;img.hidden=true;});}
  destroy() {this.closeTrailer();this.alive=false;++this.discoveryVersion;++this.collectionVersion;if(this.playerDialog){this.playerDialog.close();this.playerDialog.remove();this.playerDialog=null;}super.destroy();this.card.classList.remove('mediarr-cinema');}
}
