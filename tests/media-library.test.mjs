import test from 'node:test';
import assert from 'node:assert/strict';
import {collectMediaLibrary, mediaImage, mediaCast, mediaEntriesForCard} from '../media-library.js';
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
    t:state([{title:'Same name',year:2026,id:1},{title:'Same name',year:2026,id:2}]),
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
  const card={config:{tmdb_entity:'t'},_hass:{states:{t:state([{title:'Film',id:12}])}},_pendingLibraryRequests:new Set(['movie:tmdb:12'])};
  assert.equal(mediaEntriesForCard(card)[0].stage,'waiting');
  assert.equal(mediaEntriesForCard(card)[0].optimistic,true);
  card.config.radarr_entity='r';card._hass.states.r=state([{title:'Film',tmdb_id:12,hasFile:true}]);
  assert.equal(mediaEntriesForCard(card)[0].stage,'ready');
  assert.equal(card._pendingLibraryRequests.size,0);
});
test('Seerr TMDB identity merges requests without a year; manager-local IDs do not collide', () => {
  const entries=collectMediaLibrary({seer_entity:'s',tmdb_entity:'t',radarr_entity:'r'},{states:{s:state([{title:'Film',id:12,status:1}]),t:state([{title:'Film',id:12}]),r:state([{title:'Another film',id:12}])}});
  assert.equal(entries.length,2);assert.equal(entries[0].refs.length,2);assert.equal(entries[0].stage,'waiting');
});
