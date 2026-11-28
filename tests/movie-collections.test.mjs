import test from 'node:test';
import assert from 'node:assert/strict';
import {movieCollectionEntries,mergeCatalogEntries} from '../media-library.js';
test('canonical movie parts retain individual owned, waiting and missing state and TV IDs do not collide',()=>{
 const parts=[1,2,3].map(tmdb_id=>({media_type:'movie',tmdb_id,title:`Part ${tmdb_id}`}));
 parts[2].has_file=true;parts[2].watched=true;parts[2].library_key='forged';
 const local=mergeCatalogEntries([],parts.slice(0,2));local[0].stage='ready';local[0].watched=true;local[1].stage='waiting';
 const collision=mergeCatalogEntries([],[{media_type:'tv',tmdb_id:3,title:'Unrelated TV'}])[0];collision.stage='ready';
 const selected={...local[0],item:{collection:{id:900,name:'Trilogy',parts}}};
 const result=movieCollectionEntries(selected,[...local,collision]);
 assert.deepEqual(result.map(x=>x.stage),['ready','waiting','discover']);assert.equal(result[0].watched,true);
 assert.equal(result[2].kind,'movie');assert.equal(result[2].ids.tmdb,'3');
});
test('missing/invalid/non-member collections never group films by title',()=>{
 const entry={kind:'movie',ids:{tmdb:'1'},item:{}};
 assert.deepEqual(movieCollectionEntries(entry,[]),[]);
 for(const collection of [{id:900,parts:[{media_type:'movie',tmdb_id:2,title:'Similar'}]},{id:'900',parts:[]}])assert.deepEqual(movieCollectionEntries({...entry,item:{collection}},[]),[]);
});
