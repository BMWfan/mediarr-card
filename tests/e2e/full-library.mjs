import {chromium} from '../../dev/node_modules/playwright/index.mjs';
import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import assert from 'node:assert/strict';
const root=fileURLToPath(new URL('../../',import.meta.url));
const runtime=process.env.HA_DEV_RUNTIME_DIR||path.join(root,'dev/.runtime');
const base=`http://127.0.0.1:${process.env.HA_DEV_PORT||8124}`;
const auth=JSON.parse(await fs.readFile(path.join(runtime,'local-auth.json'),'utf8'));
const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||undefined,args:['--no-sandbox','--disable-dev-shm-usage','--no-proxy-server']});
const passed=[];
try {
 const page=await browser.newPage({viewport:{width:1440,height:1000}});page.setDefaultTimeout(10000);
 const errors=[];page.on('pageerror',e=>{errors.push(e.message);console.log(e.stack)});
 await page.addInitScript(({auth,base})=>localStorage.setItem('hassTokens',JSON.stringify({hassUrl:base,clientId:base+'/',...auth,expires:Date.now()+auth.expires_in*1000})),{auth,base});
 await page.goto(base+'/mediarr-test/test');
 const source=page.locator('mediarr-card');await source.locator('.mediarr-open-button').waitFor();
 await source.evaluate(el=>{
   const original=el._hass;window.libraryCalls=[];
   const plex=Array.from({length:125},(_,i)=>({title:`Library film ${i}`,media_type:'movie',tmdb_id:10000+i,year:2000+i%20,watched:i%2===0,has_watched:i%2===0,overview:'Complete catalog fixture.',cast:[{name:'Test Actor'}]}));
   const waiting={title:'Downloading movie',media_type:'movie',tmdb_id:50000,download_status:'downloading',download_progress:68,overview:'A requested film.',cast:[{name:'Actor'}]};
   el.setConfig({...el.config,view:'compact',visible_sections:['plex'],plex_entity:'sensor.small_excerpt'});
   el.hass={...original,language:'de',states:{...original.states,sensor_small:{state:'1',attributes:{data:[]}}},callWS:async msg=>{
     if(msg.type==='mediarr/library') {
       window.libraryCalls.push(msg);
       return {groups:{plex:msg.page===1?plex.slice(0,100):plex.slice(100),radarr:msg.page===2?[waiting]:[],sonarr:[]},page:msg.page,total_pages:2,complete:true,errors:[]};
     }
     if(msg.type==='mediarr/media_details')return {media_type:msg.media_type,tmdb_id:msg.tmdb_id,title:msg.title,overview:'Detailed plot.',cast:[{name:'An Actor',character:'Pilot'}],streaming:{region:msg.region,subscription:[{name:'Netflix'}],rent:[{name:'Amazon Video'}],buy:[],link:'https://www.themoviedb.org/movie/1/watch'}};
     if(msg.type==='mediarr/search')return {results:[],page:1,total_pages:0};
     return original.callWS(msg);
   }};
   el.setConfig({...el.config,view:'library'});
 });
 await source.locator('[data-category=library]').click();
 await page.waitForFunction(()=>window.libraryCalls.some(msg=>msg.page===2));
 await source.locator('.mediarr-search-status').filter({hasText:'125'}).waitFor();
 assert.equal(await source.locator('.library-result').count(),60,'large catalogs do not render thousands of DOM rows');
 await source.locator('.library-load-more').click();assert.equal(await source.locator('.library-result').count(),120);
 await source.locator('.library-load-more').click();assert.equal(await source.locator('.library-result').count(),125);
 passed.push('complete paged Plex catalog includes watched titles beyond sensor excerpts and pages DOM rows');
 await source.locator('.mediarr-search').fill('Library film 124');
 await source.locator('.library-result').filter({hasText:'Library film 124'}).waitFor();
 assert.equal(await source.locator('.library-result').count(),1);
 await source.locator('[data-category=waiting]').click();
 await source.locator('.library-result-poster [role=progressbar]').waitFor();
 assert.equal(await source.locator('.library-result-poster [role=progressbar]').getAttribute('aria-valuenow'),'68');
 assert.ok((await source.locator('.library-result-poster').textContent()).includes('68 %'));
 passed.push('full-library search finds older watched titles and queue progress is visible on posters');
 await source.locator('.library-streaming').waitFor();
 assert.ok((await source.locator('.library-streaming').textContent()).includes('Netflix'));
 assert.ok((await source.locator('.library-streaming').textContent()).includes('Leihen'));
 assert.ok((await source.locator('.library-streaming').textContent()).includes('Amazon Video'));
 passed.push('streaming details distinguish Netflix subscription from Amazon rentals');
 await source.locator('[data-category=waiting]').click();
 await page.screenshot({path:path.join(runtime,'full-library-download.png')});
 await source.evaluate(el=>el.setConfig({...el.config,view:'compact'}));
 await source.locator('.compact-watchlist-posters [role=progressbar]').waitFor();
 assert.equal(await source.locator('.compact-watchlist-posters [role=progressbar]').getAttribute('aria-valuenow'),'68');
 await source.evaluate(el=>{el._fullLibraryState.groups.radarr[0].download_progress=91;el._compactView.refresh();});
 assert.equal(await source.locator('.compact-watchlist-posters [role=progressbar]').getAttribute('aria-valuenow'),'91');
 passed.push('download progress persists in compact watchlist posters');
 await source.evaluate(el=>{
   const editor=document.createElement('mediarr-card-editor');editor.setConfig(el.config);editor.hass=el._hass;el.append(editor);
 });
 await page.locator('mediarr-card-editor [data-streaming-region]').waitFor();
 assert.equal(await page.locator('mediarr-card-editor [data-view-mode] option[value=library]').count(),1);
 passed.push('card editor exposes full-page view and streaming country');
 assert.deepEqual(errors,[]);
 console.log(`PASS: ${passed.length} full-library checks\n${passed.join('\n')}`);
} finally {await browser.close();}
