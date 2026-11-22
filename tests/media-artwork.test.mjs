import test from 'node:test';
import assert from 'node:assert/strict';
import { mediaBackdropImages, preloadMediaBackdrops, setMediaBackdrop } from '../media-library.js';

test('a warmed film switch paints synchronously and reuses in-flight image loads', async () => {
 const originalImage=globalThis.Image, requests=[];
 globalThis.Image=class {
   set src(url){requests.push({url,image:this});}
   decode(){return Promise.resolve();}
 };
 try {
   const card={}, target={isConnected:true,style:{}};
   const films=['first','second'].map(key=>({key,banner:`/${key}.jpg`}));
   preloadMediaBackdrops(card,films);
   setMediaBackdrop(target,films[0],card);
   assert.equal(requests.length,2);
   requests.forEach(({image})=>image.onload());
   await new Promise(resolve=>setImmediate(resolve));
   for(const film of [films[1],films[0]]) {
     setMediaBackdrop(target,film,card);
     assert.equal(target.style.backgroundImage,`url("${film.banner}")`);
   }
   assert.equal(requests.length,2);
 } finally {
   if(originalImage===undefined) delete globalThis.Image;
   else globalThis.Image=originalImage;
 }
});
test('landscape alternatives survive preferred source failure without choosing the poster first',()=>{
 const entry={banner:'/missing.svg',poster:'/poster.svg',item:{banner:'/missing.svg',fanart:'/fanart.svg',backdrop:'/tmdb.svg'},refs:[{item:{banner:'/other.svg',backdrop:'/tmdb.svg'}}]};
 assert.deepEqual(mediaBackdropImages(entry),['/missing.svg','/fanart.svg','/tmdb.svg','/other.svg']);
});
test('invalid URLs and poster duplicates are excluded from landscape candidates',()=>{
 assert.deepEqual(mediaBackdropImages({banner:'javascript:alert(1)',poster:'/poster.svg',item:{fanart:'//external.invalid/art',backdrop:'/poster.svg'},refs:[{item:{banner:null}},{item:{fanart:'https://example.invalid/backdrop.jpg'}}]}),['https://example.invalid/backdrop.jpg']);
 assert.deepEqual(mediaBackdropImages(undefined),[]);
});
