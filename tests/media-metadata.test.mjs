import test from 'node:test';
import assert from 'node:assert/strict';
import {fetchMediaMetadata} from '../media-metadata.js';
test('metadata uses authenticated HA WebSocket with typed ID and no credentials', async()=>{
 let request;
 const result=await fetchMediaMetadata({callWS:async msg=>{request=msg;return {media_type:'tv',tmdb_id:7,cast:[{name:'Actor'}]};}}, {title:'Dark',kind:'tv',ids:{tmdb:'7'},year:'2017'},'de-DE');
 assert.deepEqual(request,{type:'mediarr/media_details',media_type:'tv',title:'Dark',language:'de-DE',tmdb_id:7,year:2017});
 assert.equal(result.cast[0].name,'Actor');
});
test('unknown type remains explicit and backend failures propagate with safe codes',async()=>{
 await assert.rejects(fetchMediaMetadata({callWS:async msg=>{assert.equal(msg.media_type,'unknown');throw {code:'tmdb_not_configured'};}},{title:'Film',kind:'unknown',ids:{}},'de'),error=>error.code==='tmdb_not_configured');
 await assert.rejects(fetchMediaMetadata({},{title:'Film',kind:'movie'}),error=>error.code==='unknown_command');
});
test('malformed responses are not used to guess a type',async()=>{
 await assert.rejects(fetchMediaMetadata({callWS:async()=>({overview:'Something'})},{title:'Film',kind:'unknown',ids:{}}),error=>error.code==='metadata_invalid');
});
