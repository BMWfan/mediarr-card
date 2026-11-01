import test from 'node:test';
import assert from 'node:assert/strict';
import {collectMediaLibrary, mediaImage, mediaCast, mediaEntriesForCard, mediaKind, normalizeMediaItem} from '../media-library.js';
const state = data => ({state:'1',attributes:{data}});
test('merges IDs across providers, enriches metadata, available overrides request', () => {
  const entries=collectMediaLibrary({plex_entity:'p',radarr_entity:'r',tmdb_entity:'t'},{states:{
    p:state([{title:'Arrival',year:2016,tmdb_id:329865,watched:false}]),
    r:state([{title:'Arrival',year:2016,tmdbId:329865}]),
    t:state([{title:'Arrival',year:2016,id:329865,overview:'A linguist interprets an alien language.',cast:[{name:'Example Actor'}]}]),
  }});
  assert.equal(entries.length,1);assert.equal(entries[0].stage,'ready');assert.equal(entries[0].refs.length,3);
  assert.equal(entries[0].watched,false);assert.ok(entries[0].summary.includes('linguist'));
});
test('classifies requests separately from discoveries, does not invent watch state', () => {
  const entries=collectMediaLibrary({sonarr_entity:'s',tmdb_entity:'t',jellyfin_entity:'j'},{states:{
    s:state([{title:'Series',year:2026}]),t:state([{title:'New movie',year:2027,id:2}]),j:state([{title:'Available',year:2025}]),
  }});
  assert.deepEqual(entries.map(e=>e.stage),['waiting','discover','ready']);
  assert.equal(entries[0].kind,'tv');assert.equal(entries[2].watched,null);
});
test('conflicting IDs and film/series remakes remain separate', () => {
  const entries=collectMediaLibrary({tmdb_entity:'t',sonarr_entity:'s'},{states:{
    t:state([{title:'Same name',year:2026,id:1,type:'movie'},{title:'Same name',year:2026,id:2,type:'movie'}]),
    s:state([{title:'Same name',year:2026,tmdb_id:1}]),
  }});
  assert.equal(entries.length,3);
});
test('a later cross-ID record resolves previously separate identities', () => {
  const entries=collectMediaLibrary({plex_entity:'p',radarr_entity:'r',tmdb_entity:'t'},{states:{
    p:state([{title:'Local title',imdb_id:'tt123'}]),r:state([{title:'Different title',tmdb_id:12}]),
    t:state([{title:'Original title',id:12,imdb_id:'tt123'}]),
  }});
  assert.equal(entries.length,1);assert.equal(entries[0].refs.length,3);
});
test('unavailable and placeholder sensors are excluded; unsafe image URLs are rejected', () => {
  const entries=collectMediaLibrary({tmdb_entity:'t',plex_entity:'p'},{states:{t:{...state([{title:'Stale'}]),state:'unavailable'},p:state([{title_default:true},{title:''}])}});
  assert.equal(entries.length,0);assert.equal(mediaImage('javascript:alert(1)'),'');assert.equal(mediaImage('//untrusted.example/a.jpg'),'');
});

test('rich cast credits retain photos and roles when another provider only has names', () => {
  const rich=[{name:'Example Actor',character:'Pilot',profile_path:'/portrait.jpg'}];
  const entries=collectMediaLibrary({plex_entity:'p',tmdb_entity:'t'},{states:{p:state([{title:'Film',year:2026,tmdb_id:12,cast:['Example Actor']}]),t:state([{title:'Film',year:2026,id:12,cast:rich}])}});
  assert.deepEqual(mediaCast(entries[0].item),rich);
  assert.deepEqual(mediaCast({cast:['Example Actor'],credits:{cast:rich}}),rich);
});

test('configured sources can be excluded from the unified and compact views', () => {
  const entries=collectMediaLibrary({plex_entity:'p',tmdb_entity:'t',visible_sections:['plex']},{states:{p:state([{title:'Available'}]),t:state([{title:'Hidden discovery'}])}});
  assert.equal(entries.length,1);assert.equal(entries[0].title,'Available');
});
test('pending requests survive view changes until confirmed by a source', () => {
  const card={config:{tmdb_entity:'t'},_hass:{states:{t:state([{title:'Film',id:12,type:'movie'}])}},_pendingLibraryRequests:new Set(['movie:tmdb:12'])};
  assert.equal(mediaEntriesForCard(card)[0].stage,'waiting');
  assert.equal(mediaEntriesForCard(card)[0].optimistic,true);
  card.config.radarr_entity='r';card._hass.states.r=state([{title:'Film',tmdb_id:12,hasFile:true}]);
  assert.equal(mediaEntriesForCard(card)[0].stage,'ready');
  assert.equal(card._pendingLibraryRequests.size,0);
});
test('Seerr TMDB identity merges requests without a year; manager-local IDs do not collide', () => {
  const entries=collectMediaLibrary({seer_entity:'s',tmdb_entity:'t',radarr_entity:'r'},{states:{s:state([{title:'Film',request_id:991,tmdb_id:12,status:1}]),t:state([{title:'Film',id:12,type:'movie'}]),r:state([{title:'Another film',id:12}])}});
  assert.equal(entries.length,2);assert.equal(entries[0].refs.length,2);assert.equal(entries[0].stage,'waiting');
});

test('legacy Plex and Jellyfin episodes are TV even when type is absent', () => {
  const raw={title:'Dark',episode:'Anfänge',number:'S01E01',release:'2017-12-01',genres:'Mystery'};
  const item=normalizeMediaItem(raw,'plex','plex_entity');
  assert.equal(item.media_type,'tv');assert.equal(item.overview,'');assert.equal(item.year,'');
  assert.equal(mediaKind({...raw,number:'S00E03'},'jellyfin'),'tv');
  assert.equal(mediaKind({title:'A film',episode:'A description',number:'2024'},'plex'),'movie');
});
test('legacy movie year and synopsis are read from number and episode', () => {
  const item=normalizeMediaItem({title:'Film',number:'2025',episode:'A real description'},'jellyfin');
  assert.equal(item.year,'2025');assert.equal(item.overview,'A real description');assert.equal(item.media_type,'movie');
  assert.equal(normalizeMediaItem({title:'Film',number:'2025',episode:'N/A'},'plex').overview,'');
});
test('Sonarr episode suffix and Jellyfin casing preserve usable series metadata', () => {
  const item=normalizeMediaItem({title:'Dark - 01x03',episode:'Gestern und Heute',number:'S01E03'},'sonarr');
  assert.equal(item.title,'Dark');assert.equal(item.media_type,'tv');
  const jf=normalizeMediaItem({Name:'Film',Type:'Movie',ProductionYear:2024,Overview:'Full plot',People:[{Name:'Actor',Type:'Actor',Role:'Pilot'},{Name:'Director',Type:'Director'}],ProviderIds:{Tmdb:'12'}},'jellyfin');
  assert.equal(jf.tmdb_id,'12');assert.equal(jf.cast[0].name,'Actor');assert.equal(jf.cast[0].character,'Pilot');assert.deepEqual(jf.directors,['Director']);
});
test('missing media type is not silently assumed to be a movie', () => {
  assert.equal(mediaKind({title:'Ambiguous'},'plex'),'unknown');
  assert.equal(mediaKind({name:'A series',first_air_date:'2020-01-01'},'tmdb'),'tv');
  const entries=collectMediaLibrary({tmdb_entity:'t',sonarr_entity:'s'},{states:{t:state([{title:'Same',id:7}]),s:state([{title:'Same',tmdb_id:7}])}});
  assert.equal(entries.length,1);assert.equal(entries[0].kind,'tv');
});

test('confirmed live TMDB payloads preserve movie/show types, IDs and overview without inventing cast', () => {
  const entries=collectMediaLibrary({tmdb_entity:'t'},{states:{t:state([
    {title:'Film A',type:'movie',tmdb_id:1001,overview:'Film synopsis'},
    {title:'Serie B',type:'show',tmdb_id:1002,overview:'Series synopsis'},
  ])}});
  assert.deepEqual(entries.map(entry=>entry.kind),['movie','tv']);
  assert.deepEqual(entries.map(entry=>entry.ids.tmdb),['1001','1002']);
  assert.deepEqual(entries.map(entry=>entry.summary),['Film synopsis','Series synopsis']);
  assert.ok(entries.every(entry=>mediaCast(entry.item).length===0));
});
test('Seerr request identifiers never become TMDB identifiers, while discovery IDs follow the backend contract', () => {
  const entries=collectMediaLibrary({seer_entity:'requests',seer_trending_entity:'discovery'},{states:{
    requests:state([{title:'Requested film',media_type:'movie',id:81,request_id:81},{title:'Another film',media_type:'movie',request_id:82,tmdb_id:500}]),
    discovery:state([{title:'Discovered series',media_type:'tv',id:300}]),
  }});
  assert.equal(entries[0].ids.tmdb,undefined);
  assert.equal(entries[1].ids.tmdb,'500');
  assert.equal(entries[2].ids.tmdb,'300');
});
test('four empty Immaculaterr lists do not generate phantom titles or suppress other sources', () => {
  const config={tmdb_entity:'t',immaculaterr_movies_entity:'m1',immaculaterr_tv_entity:'s1'};
  const entries=collectMediaLibrary(config,{states:{t:state([{title:'Film A',type:'movie',tmdb_id:1001,overview:'Synopsis'}]),m1:state([]),s1:state([]),m2:state([]),s2:state([])}});
  assert.equal(entries.length,1);assert.equal(entries[0].title,'Film A');
});
