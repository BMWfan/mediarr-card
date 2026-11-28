import test from 'node:test';
import assert from 'node:assert/strict';
import {curatedCinemaEntries} from '../cinema-library.js';
import {seriesEpisodeLabel} from '../media-library.js';
const entry=(key,extra={})=>({key,title:key,stage:'ready',kind:'movie',watched:false,item:{added:1,genres:['Thriller']},refs:[{provider:'plex',item:{}}],...extra});
test('unwatched series depend on episodes after current progress, not old season gaps',()=>{
 const caughtUp=entry('old gap',{kind:'tv',item:{episode_progress:{available:true,started:true,unwatched_count:0,ranges:[]}}});
 const newEpisodes=entry('current',{kind:'tv',item:{episode_progress:{available:true,started:true,unwatched_count:3,ranges:[{season:4,first:6,last:8}]}}});
 assert.deepEqual(curatedCinemaEntries([caughtUp,newEpisodes],{selection:'unwatched'}).map(e=>e.key),['current']);
 assert.deepEqual(curatedCinemaEntries([caughtUp,newEpisodes],{unseen:false}).map(e=>e.key),['current','old gap']);
 assert.equal(seriesEpisodeLabel(newEpisodes,de=>de),'3 neue Folgen · S04 E06–E08');
 assert.equal(seriesEpisodeLabel(caughtUp,de=>de),'Auf dem neuesten Stand');
 assert.equal(seriesEpisodeLabel(entry('unknown',{kind:'tv'}),de=>de),'Folgenstatus nicht verfügbar');
});
test('curated selection excludes watched/queued titles and sorts actual added timestamps',()=>{
 const day='2026-01-02';
 const entries=[
  entry('Alpha',{refs:[{provider:'plex',item:{added:day,added_at:'1767326400'}}]}),
  entry('Zulu',{item:{genres:['Drama']},refs:[{provider:'jellyfin',item:{added:day,added_at:day+'T15:00:00Z'}}]}),
  entry('Missing',{item:{added_at:'2030-01-01'},refs:[{provider:'plex',item:{added_at:'invalid'}}]}),
  entry('Seerr only',{refs:[{provider:'seer',item:{media_status:5}}]}),
  entry('watched',{watched:true}),entry('queued',{stage:'waiting'}),
 ];
 assert.deepEqual(curatedCinemaEntries(entries).map(e=>e.key),['Zulu','Alpha','Missing']);
 assert.equal(entries.length,6);
 assert.deepEqual(curatedCinemaEntries(entries,{genre:'Thriller'}).map(e=>e.key),['Alpha']);
});
test('started and Plex smart collection filters use source state and stable membership IDs',()=>{
 const entries=[entry('started',{item:{in_progress:true}}),entry('collection',{refs:[{item:{library_key:'0:42'}}]}),entry('other-server',{refs:[{item:{library_key:'1:42'}}]})];
 assert.deepEqual(curatedCinemaEntries(entries,{selection:'started'}).map(e=>e.key),['started']);
 assert.deepEqual(curatedCinemaEntries(entries,{selection:'collection:0:7',collectionKeys:['0:42']}).map(e=>e.key),['collection']);
});
