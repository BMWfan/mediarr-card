import test from 'node:test';
import assert from 'node:assert/strict';
import { mediaBackdropImages } from '../media-library.js';
test('landscape alternatives survive preferred source failure without choosing the poster first',()=>{
 const entry={banner:'/missing.svg',poster:'/poster.svg',item:{banner:'/missing.svg',fanart:'/fanart.svg',backdrop:'/tmdb.svg'},refs:[{item:{banner:'/other.svg',backdrop:'/tmdb.svg'}}]};
 assert.deepEqual(mediaBackdropImages(entry),['/missing.svg','/fanart.svg','/tmdb.svg','/other.svg']);
});
test('invalid URLs and poster duplicates are excluded from landscape candidates',()=>{
 assert.deepEqual(mediaBackdropImages({banner:'javascript:alert(1)',poster:'/poster.svg',item:{fanart:'//external.invalid/art',backdrop:'/poster.svg'},refs:[{item:{banner:null}},{item:{fanart:'https://example.invalid/backdrop.jpg'}}]}),['https://example.invalid/backdrop.jpg']);
 assert.deepEqual(mediaBackdropImages(undefined),[]);
});
