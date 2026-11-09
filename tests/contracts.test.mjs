import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {fetchMediaMetadata, searchMediaCatalog, fetchMediaLibrary} from '../media-metadata.js';
import {normalizeMediaItem} from '../media-library.js';
const contract=JSON.parse(readFileSync(new URL('./contracts/v1.json',import.meta.url)));
test('v1 metadata fixture survives frontend adapter with optional fields and additions',async()=>{
 const entry={kind:'tv',title:'Synthetic Series',ids:{tmdb:'77'}};
 for(const response of [contract.details,{media_type:'tv',tmdb_id:77,future_field:true}]){
  const result=await fetchMediaMetadata({callWS:async request=>{
   assert.equal(request.type,'mediarr/media_details');assert.equal(request.tmdb_id,77);return response;
  }},entry);
  assert.deepEqual(result,response);
 }
 assert.equal(normalizeMediaItem({type:'show',title:'Synthetic Series',tmdb_id:77},'tmdb').media_type,'tv');
});
test('v1 catalog fixture preserves IDs and discards ambiguous or invalid types',async()=>{
 const response={...contract.search,results:[...contract.search.results,{media_type:'show',tmdb_id:88},{media_type:'movie',tmdb_id:0},{media_type:'movie',tmdb_id:'77'}]};
 const result=await searchMediaCatalog({callWS:async request=>{assert.equal(request.query,'Sterne & Meer');return response;}},'  Sterne & Meer  ','de');
 assert.deepEqual(result.results,contract.search.results);
});
test('old/missing backend and typed errors propagate without fake success',async()=>{
 const actions=[h=>fetchMediaMetadata(h,{kind:'tv',title:'Test'}),h=>searchMediaCatalog(h,'Test'),h=>fetchMediaLibrary(h)];
 for(const action of actions){
  await assert.rejects(action({}),e=>e.code==='unknown_command');
  for(const code of contract.errors)await assert.rejects(action({callWS:async()=>{throw {code};}}),e=>e.code===code);
 }
});
