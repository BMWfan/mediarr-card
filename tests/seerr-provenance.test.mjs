import test from 'node:test';
import {readFileSync} from 'node:fs';
import assert from 'node:assert/strict';
import { collectMediaLibrary, CompactMediaView } from '../media-library.js';
import { SeerSection } from '../seer-section.js';
const state = data => ({state:'1',attributes:{data}});
const row = extra => ({title:'Synthetic request',type:'Movie',media_type:'movie',request_id:401,tmdb_id:91,...extra});
const collect = (item, extraConfig={}, extraStates={}) => collectMediaLibrary(
  {seer_entity:'s',...extraConfig}, {states:{s:state([row(item)]),...extraStates}})[0];

test('compact recent imports refresh when Plex evidence and its timestamp arrive', () => {
  const request = row({title:'Zulu', media_type:'tv', type:'TV Show', request_status:2, media_status:4});
  const older = row({title:'Alpha', tmdb_id:92, added_at:'1767326400'});
  const card = {
    config:{seer_entity:'s', plex_entity:'p'},
    _hass:{language:'en', states:{s:state([request]), p:state([older])}},
    _mediaLabel:(_german,english)=>english,
  };
  const nodes = new Map();
  const view = new CompactMediaView(card);
  view.panel = {querySelector(selector) {
    if (!nodes.has(selector)) nodes.set(selector,{style:{},querySelector:()=>null,querySelectorAll:()=>[]});
    return nodes.get(selector);
  }};
  const posters = () => nodes.get('.compact-posters').innerHTML;
  view.refresh();
  assert.match(posters(), /Alpha/);
  assert.doesNotMatch(posters(), /Zulu/);
  card._hass.states.p = state([older,{...request,added_at:''}]);
  view.refresh();
  assert.match(posters(), /Alpha.*Zulu/);
  card._hass.states.p = state([older,{...request,added_at:'1767337200'}]);
  view.refresh();
  assert.match(posters(), /Zulu.*Alpha/);
});

test('all legacy and explicit request statuses are distinct from ownership', () => {
  for (const status of [1,2,3,4,5,'4','5']) {
    assert.equal(collect({status}).stage,'waiting',`legacy request ${status}`);
    assert.equal(collect({status,request_status:status,media_status:null}).stage,'waiting');
  }
});
test('explicit media availability wins over request failure without claiming watched state', () => {
  for (const status of [1,2,3,4,5]) {
    const entry=collect({status,request_status:status,media_status:5});
    assert.equal(entry.stage,'ready');assert.equal(entry.watched,null);
  }
  assert.equal(collect({status:4,media:{status:5,mediaType:'movie'}}).stage,'ready');
  assert.equal(collect({status:4,media_status:2,media:{status:5}}).stage,'waiting','explicit flat status takes precedence');
});
test('partial media is available only for TV, never a movie or unknown type', () => {
  for (const media_status of [4,'4']) {
    assert.equal(collect({status:2,media_status}).stage,'waiting');
    assert.equal(collect({status:2,media_status,media_type:'tv',type:'TV Show'}).stage,'ready');
    assert.equal(collect({status:2,media_status,media_type:'unknown',type:'unknown'}).stage,'waiting');
  }
});
test('unknown/malformed and non-available media states never imply availability', () => {
  for (const media_status of [undefined,null,0,1,2,3,6,7,99,true,{},'AVAILABLE','5junk']) {
    assert.equal(collect({status:5,media_status}).stage,'waiting',JSON.stringify(media_status));
  }
  assert.equal(collect({media_status:'5'}).stage,'ready');
});
test('independent Plex, Jellyfin and file evidence survives failed requests', () => {
  for (const provider of ['plex','jellyfin']) {
    const entry=collect({status:4},{[provider+'_entity']:'p'},{p:state([row({watched:false})])});
    assert.equal(entry.stage,'ready');assert.equal(entry.refs.length,2);
  }
  for (const field of ['hasFile','has_file']) {
    assert.equal(collect({status:4},{radarr_entity:'r'},{r:state([row({[field]:true})])}).stage,'ready');
    for (const value of [false,'true',1]) assert.equal(collect({status:4,[field]:value}).stage,'waiting');
  }
});
test('request status labels do not advertise failed or completed requests as available', () => {
  const section=new SeerSection();
  assert.equal(section._getStatusInfo(4).text,'Failed');
  assert.equal(section._getStatusInfo(5).text,'Completed');
  assert.equal(section._getStatusInfo(2).text,'Approved');
  assert.equal(section._getStatusInfo(99).class,'status-unknown');
  section._currentCard={_hass:{language:'de'}};
  assert.equal(section._getStatusInfo(4).text,'Fehlgeschlagen');
  assert.equal(section._getStatusInfo(5).text,'Abgeschlossen');
});
test('malformed request status never resolves inherited object properties', () => {
  const section=new SeerSection();
  for (const status of ['constructor','toString','__proto__',{},[],null,true,99]) {
    assert.equal(section._getStatusInfo(status).text,'Unknown');
    assert.equal(section._getStatusInfo(status).class,'status-unknown');
  }
});
test('paired sensor fixture preserves Seerr availability and legacy request-only behavior', () => {
  const contract = JSON.parse(readFileSync(new URL('./contracts/v1.json', import.meta.url)));
  for (const {request_status, media_status, kind, stage} of contract.seerr_cases) {
    const legacy = {status:request_status, media_type:kind, type:kind === 'tv' ? 'TV Show' : 'Movie'};
    assert.equal(collect(legacy).stage, 'waiting');
    assert.equal(collect({...legacy, request_status, media_status}).stage, stage);
  }
});
