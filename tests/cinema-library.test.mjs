import test from 'node:test';
import assert from 'node:assert/strict';
import {curatedCinemaEntries} from '../cinema-library.js';
const entry=(key,extra={})=>({key,title:key,stage:'ready',kind:'movie',watched:false,item:{added:1,genres:['Thriller']},refs:[],...extra});
test('curated selection excludes watched/queued titles and sorts actual added timestamps',()=>{
 const entries=[entry('older'),entry('new',{item:{added:20,genres:['Drama']}}),entry('watched',{watched:true}),entry('queued',{stage:'waiting'})];
 assert.deepEqual(curatedCinemaEntries(entries).map(e=>e.key),['new','older']);
 assert.equal(entries.length,4);
 assert.deepEqual(curatedCinemaEntries(entries,{genre:'Thriller'}).map(e=>e.key),['older']);
});
test('started and Plex smart collection filters use source state and stable membership IDs',()=>{
 const entries=[entry('started',{item:{in_progress:true}}),entry('collection',{refs:[{item:{library_key:'0:42'}}]}),entry('other-server',{refs:[{item:{library_key:'1:42'}}]})];
 assert.deepEqual(curatedCinemaEntries(entries,{selection:'started'}).map(e=>e.key),['started']);
 assert.deepEqual(curatedCinemaEntries(entries,{selection:'collection:0:7',collectionKeys:['0:42']}).map(e=>e.key),['collection']);
});
