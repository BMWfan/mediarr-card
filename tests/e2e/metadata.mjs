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
 const page=await browser.newPage();const errors=[];page.on('pageerror',error=>errors.push(error.message));
 await page.addInitScript(({auth,base})=>localStorage.setItem('hassTokens',JSON.stringify({hassUrl:base,clientId:base+'/',...auth,expires:Date.now()+auth.expires_in*1000})),{auth,base});
 await page.goto(base+'/mediarr-test/test');
 const source=page.locator('mediarr-card');await source.locator('.mediarr-open-button').waitFor();
 await source.evaluate(el=>el.setConfig({...el.config,library_layout:'classic'}));
 await source.evaluate(el=>{
   window.__metadataCalls=[];window.__metadataResolvers={};
   const actual=el._hass;
   el.hass={...actual,language:'de',states:{...actual.states,[el.config.plex_entity]:{state:'2',attributes:{data:[
     {title:'Dark',number:'S01E03',episode:'Gestern und heute',runtime:'50'},
     {title:'Arrival',number:'2016',episode:'Short legacy description…',runtime:'116'},
   ]}}},callWS:message=>{
     if(message.type!=='mediarr/media_details')return actual.callWS(message);
     window.__metadataCalls.push(message);
     return new Promise(resolve=>{window.__metadataResolvers[message.title]=resolve;});
   }};
   el._openMediaOverlay();
 });
 const expanded=page.locator('mediarr-overlay-host mediarr-card');
 await expanded.locator('.library-heading h1').filter({hasText:'Dark'}).waitFor();
 assert.ok((await expanded.locator('.library-result').filter({hasText:'Dark'}).textContent()).includes('Serie'));
 await expanded.locator('.library-metadata-status').filter({hasText:'werden geladen'}).waitFor();
 assert.equal(await page.evaluate(()=>window.__metadataCalls[0].media_type),'tv');
 passed.push('legacy episode is classified as TV and automatically loads authenticated metadata');
 await expanded.locator('.library-result').filter({hasText:'Arrival'}).click();
 await page.waitForFunction(()=>window.__metadataResolvers.Arrival);
 assert.equal(await page.evaluate(()=>window.__metadataCalls.find(call=>call.title==='Arrival').year),2016);
 await page.evaluate(()=>window.__metadataResolvers.Dark({media_type:'tv',tmdb_id:70523,year:'2017',overview:'A complete series description.',cast:[{name:'Dark Actor',character:'Detective'}]}));
 assert.equal(await expanded.locator('.library-heading h1').textContent(),'Arrival');
 await page.evaluate(()=>window.__metadataResolvers.Arrival({media_type:'movie',tmdb_id:329865,year:'2016',overview:'The complete film synopsis from the backend.',vote_average:8.1,genres:['Science-Fiction'],cast:[{name:'Film Actor',character:'Linguist'}],directors:['Film Director']}));
 await expanded.locator('.media-details-synopsis').filter({hasText:'The complete film synopsis'}).waitFor();
 assert.ok((await expanded.locator('.library-cast').textContent()).includes('Linguist'));
 assert.ok((await expanded.locator('.library-metadata').textContent()).includes('8.1'));
 passed.push('full synopsis, cast roles, director and rating load without stale-selection overwrites');
 await expanded.locator('.library-result').filter({hasText:'Dark'}).click();
 await expanded.locator('.media-details-synopsis').filter({hasText:'complete series'}).waitFor();
 assert.equal(await page.evaluate(()=>window.__metadataCalls.length),2);
 await page.keyboard.press('Escape');await page.locator('mediarr-overlay-host').waitFor({state:'detached'});
 await source.locator('.mediarr-open-button').click();
 await expanded.locator('.media-details-synopsis').filter({hasText:'complete series'}).waitFor();
 assert.equal(await page.evaluate(()=>window.__metadataCalls.length),2);
 passed.push('metadata cache survives closing and reopening the overlay');
 await expanded.evaluate(el=>{
   el._mediaMetadataCache.clear();el._metadataBackendState.unsupported=false;el._libraryView.metadataErrors.clear();
   el._hass={...el._hass,callWS:async()=>{throw {code:'tmdb_not_configured'};}};
   el._libraryView.refresh();
 });
 await expanded.locator('.library-metadata-status').filter({hasText:'TMDB-Zugang'}).waitFor();
 assert.equal(await expanded.locator('.library-person').count(),0);
 await expanded.evaluate(el=>{el._hass={...el._hass,callWS:async()=>{throw {code:'unknown_command'};}};});
 await expanded.locator('.library-metadata-retry').click();
 await expanded.locator('.library-metadata-status').filter({hasText:'aktualisierte Mediarr'}).waitFor();
 passed.push('missing TMDB configuration and outdated backend are explicit, retryable states');
 await page.keyboard.press('Escape');await page.locator('mediarr-overlay-host').waitFor({state:'detached'});
 // Synthetic refresh regression: a broken preferred banner must use landscape fallback.
 const artwork=await fs.readFile(path.join(root,'tests/fixtures/library-artwork.svg'),'utf8');
 await page.route('**/banner-*.svg',route=>route.fulfill({status:route.request().url().includes('missing')?404:200,contentType:'image/svg+xml',body:route.request().url().includes('missing')?'not an image':artwork}));
 await source.evaluate(el=>{
   const row={title:'Banner fixture',type:'movie',media_type:'movie',tmdb_id:7101,watched:false,
     poster:'/local/banner-poster.svg',banner:'/local/banner-initial.svg',backdrop:'/local/banner-alternative.svg',library_key:'0:7101'};
   el._fullLibraryState={loaded:true,complete:true,groups:null};el._metadataBackendState={unsupported:true};
   el._mediaMetadataCache.clear();el._initialLibrarySelection=null;el._cinemaSelection='recent';
   el.setConfig({...el.config,view:'library',library_layout:'cinema',visible_sections:['plex'],plex_entity:'sensor.banner_fixture'});
   el.hass={...el._hass,states:{...el._hass.states,'sensor.banner_fixture':{entity_id:'sensor.banner_fixture',state:'1',attributes:{data:[row]}}}};
   el._libraryView.detailKey=null;el._libraryView.input.value='';el._libraryView.refresh();
 });
 const waitBackdrop=(selector,name)=>source.locator(selector).evaluate((el,name)=>new Promise((resolve,reject)=>{
   const deadline=Date.now()+3000;
   const check=()=>el.style.backgroundImage.includes(name)?resolve():Date.now()>deadline?reject(new Error('Expected synthetic backdrop '+name+'; actual='+el.style.backgroundImage+'; connected='+el.isConnected+'; class='+el.className)):setTimeout(check,25);
   check();
 }),name);
 await waitBackdrop('.cinema-hero-backdrop','banner-initial');
 await source.evaluate(el=>{
   const id='sensor.banner_fixture',sensor=el._hass.states[id];
   el.hass={...el._hass,states:{...el._hass.states,[id]:{...sensor,attributes:{data:sensor.attributes.data.map(item=>({...item,banner:'/local/banner-missing.svg'}))}}}};
 });
 await waitBackdrop('.cinema-hero-backdrop','banner-alternative');
 passed.push('a failed refreshed banner falls back to available landscape artwork');
 await source.evaluate(el=>{
   const id='sensor.banner_fixture',sensor=el._hass.states[id];
   el.hass={...el._hass,states:{...el._hass.states,[id]:{...sensor,attributes:{data:sensor.attributes.data.map(item=>({...item,backdrop:'/local/banner-third.svg'}))}}}};
 });
 await waitBackdrop('.cinema-hero-backdrop','banner-third');
 passed.push('metadata-only backdrop changes update the hero despite unchanged preferred URL');

 await source.locator('.cinema-hero [data-select-key]').click();
 await waitBackdrop('.library-backdrop','banner-third');
 await source.evaluate(el=>{
   const id='sensor.banner_fixture',sensor=el._hass.states[id];
   el.hass={...el._hass,states:{...el._hass.states,[id]:{...sensor,attributes:{data:sensor.attributes.data.map(item=>({...item,banner:'',backdrop:'',fanart:''}))}}}};
 });
 await waitBackdrop('.library-backdrop','banner-third');
 await page.setViewportSize({width:390,height:844});
 await waitBackdrop('.library-backdrop','banner-third');
 await source.locator('.cinema-back').click();
 await waitBackdrop('.cinema-hero-backdrop','banner-third');
 passed.push('same-title sparse updates retain the last loaded banner across home/details and mobile');
 let lateRoute,resolveLate;
 const lateRequested=new Promise(resolve=>{resolveLate=resolve;});
 await page.route('**/banner-late.svg',route=>{lateRoute=route;resolveLate();});
 await source.evaluate(el=>{
   const id='sensor.banner_fixture',sensor=el._hass.states[id];
   el.hass={...el._hass,states:{...el._hass.states,[id]:{...sensor,attributes:{data:sensor.attributes.data.map(item=>({...item,banner:'/local/banner-late.svg'}))}}}};
 });
 await lateRequested;
 await source.evaluate(el=>{
   const id='sensor.banner_fixture',sensor=el._hass.states[id];
   el.hass={...el._hass,states:{...el._hass.states,[id]:{...sensor,attributes:{data:[
     {title:'Other banner fixture',type:'movie',media_type:'movie',tmdb_id:7102,watched:false,poster:'/local/banner-poster.svg',banner:'/local/banner-second.svg',library_key:'0:7102'}
   ]}}}};
 });
 await waitBackdrop('.cinema-hero-backdrop','banner-second');
 const finished=page.waitForResponse(response=>response.url().includes('banner-late.svg'));
 await lateRoute.fulfill({status:200,contentType:'image/svg+xml',body:artwork});
 await (await finished).finished();
 const finalBackdrop=await source.locator('.cinema-hero-backdrop').evaluate(el=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(()=>resolve(el.style.backgroundImage)))));
 assert.ok(finalBackdrop.includes('banner-second'),'late old-title artwork must never overwrite the current title');
 passed.push('delayed artwork from an old title cannot overwrite a new selection');
 await source.evaluate(el=>{
   const id='sensor.banner_fixture',sensor=el._hass.states[id];
   el.hass={...el._hass,states:{...el._hass.states,[id]:{...sensor,attributes:{data:[]}}}};
 });
 await source.locator('.cinema-hero-empty').waitFor();
 assert.equal(await source.locator('.cinema-hero-empty .cinema-hero-copy').evaluate(el=>el.style.backgroundImage),'');
 passed.push('an empty library cannot retain artwork from the previous title');


 assert.deepEqual(errors,[]);
 await fs.writeFile(path.join(runtime,'metadata-test-results.json'),JSON.stringify({passed,errors},null,2));
 console.log(`PASS: ${passed.length} metadata browser checks\n${passed.join('\n')}`);
} finally {await browser.close();}
