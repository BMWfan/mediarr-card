import { chromium } from '../../dev/node_modules/playwright/index.mjs';
import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import assert from 'node:assert/strict';
const root=fileURLToPath(new URL('../../',import.meta.url));
const runtime=process.env.HA_DEV_RUNTIME_DIR||path.join(root,'dev/.runtime');
const base=`http://127.0.0.1:${process.env.HA_DEV_PORT||8124}`;
const auth=JSON.parse(await fs.readFile(path.join(runtime,'local-auth.json'),'utf8'));
await fs.copyFile(path.join(root,'tests/fixtures/library-artwork.svg'),path.join(runtime,'config/www/library-artwork.svg'));
const poster='/local/library-artwork.svg';
const suffix=Date.now();
const config={visible_sections:['plex','tmdb','radarr','sonarr'],plex_entity:`sensor.library_plex_${suffix}`,tmdb_entity:`sensor.library_tmdb_${suffix}`,radarr_entity:`sensor.library_radarr_${suffix}`,sonarr_entity:`sensor.library_sonarr_${suffix}`};
const movie={title:'Sternenreise',year:2026,tmdb_id:101,type:'movie',poster,banner:poster,overview:'Eine Pilotin folgt einem rätselhaften Signal bis an den Rand der bekannten Galaxie.',runtime:128,vote_average:8.4,genres:['Science-Fiction','Abenteuer'],cast:[{name:'Mara Winter',character:'Elara Voss'},{name:'Jonas Berg',character:'Captain Rhen'},{name:'Lea Sommer',character:'Dr. Tessa Kral'}]};
const data={
 plex_entity:[{title:'Horizont',year:2025,number:'2025',tmdb_id:301,watched:false,poster,banner:poster}],
 tmdb_entity:[movie,{title:'Sternenstation',year:2026,tmdb_id:202,type:'tv',overview:'Das Leben auf einer abgelegenen Raumstation.',poster,banner:poster},{title:'Horizont',year:2025,tmdb_id:301,overview:'Eine Reise über die Grenzen des Bekannten.'},{title:'Fehlerfilm',year:2026,type:'movie',tmdb_id:303}],
 radarr_entity:[{title:'Jenseits der Horizonte',year:2030,tmdb_id:401,release_date:'2030-12-18',poster,banner:poster}],
 sonarr_entity:[{title:'Nordlicht',year:2026,tmdb_id:501,type:'tv',download_status:'downloading',download_progress:68,poster,banner:poster}],
};
async function api(url,options={}){const response=await fetch(base+url,{...options,headers:{Authorization:`Bearer ${auth.access_token}`,'Content-Type':'application/json'}});assert.ok(response.ok,`${options.method||'GET'} ${url}: ${response.status}`);return response.status===204?null:response.json();}
const states={};const created=[];let browser;
const passed=[];
try {
 for(const [key,id] of Object.entries(config)){if(key==='visible_sections')continue;states[id]=await api('/api/states/'+id,{method:'POST',body:JSON.stringify({state:'1',attributes:{data:data[key]}})});created.push(id);}
 browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||undefined,args:['--no-sandbox','--disable-dev-shm-usage','--no-proxy-server']});
 const page=await browser.newPage({viewport:{width:1536,height:1000}});const errors=[];page.on('pageerror',error=>errors.push(error.message));
 await page.addInitScript(({auth,base})=>localStorage.setItem('hassTokens',JSON.stringify({hassUrl:base,clientId:base+'/',...auth,expires:Date.now()+auth.expires_in*1000})),{auth,base});
 await page.goto(base+'/mediarr-test/test');
 const source=page.locator('mediarr-card');await source.locator('.mediarr-open-button').waitFor();
 await source.evaluate((el,{config,states})=>{el.setConfig({...el.config,...config});el.hass={...el._hass,language:'de',states:{...el._hass.states,...states}};},{config,states});
 assert.equal(await source.locator('.compact-media').count(),1);
 assert.equal(await source.locator('.section, .media-details-panel').count(),0);
 assert.equal(await source.locator('.compact-posters .compact-poster').count(),1);
 assert.equal(await source.locator('.compact-watchlist-posters .compact-poster').count(),2);
 assert.ok((await source.locator('.compact-watchlist-link').textContent()).includes('2'));
 await page.screenshot({path:path.join(runtime,'compact-desktop.png'),fullPage:true});
 passed.push('default compact card shows recent posters and watchlist without source sections');
 const expanded=page.locator('mediarr-overlay-host mediarr-card');
 await source.locator('.compact-watchlist-link').click();
 await expanded.locator('[data-category=waiting][aria-pressed=true]').waitFor();
 assert.equal(await expanded.locator('.library-result').count(),2);
 await page.keyboard.press('Escape');await page.locator('mediarr-overlay-host').waitFor({state:'detached'});
 assert.equal(await source.locator('.compact-watchlist-link').evaluate(el=>el.matches(':focus')),true);
 passed.push('compact watchlist link opens the correct category and restores keyboard focus');
 await source.locator('.compact-posters .compact-poster').first().click();
 await expanded.locator('.library-heading h1').filter({hasText:'Horizont'}).waitFor();
 await page.keyboard.press('Escape');await page.locator('mediarr-overlay-host').waitFor({state:'detached'});
 assert.equal(await source.locator('.compact-posters .compact-poster').first().evaluate(el=>el.matches(':focus')),true);
 passed.push('compact poster opens its film details and returns focus to the poster');
 await source.locator('.mediarr-open-button').click();
 const results=expanded.locator('.library-result');
 await results.first().waitFor();
 assert.equal(await results.count(),6,'shared ID should merge Plex and TMDB');
 await expanded.locator('[data-category=waiting]').click();
 assert.equal(await results.count(),2);assert.ok((await expanded.locator('.library-results').textContent()).includes('68 %'));
 await expanded.locator('[data-category=ready]').click();assert.equal(await results.count(),1);
 assert.ok((await expanded.locator('.library-results').textContent()).includes('Horizont'));
 await expanded.locator('[data-category=discover]').click();assert.equal(await results.count(),3);
 passed.push('cross-provider deduplication, enrichment and all three lifecycle categories');
 await expanded.locator('.mediarr-search').fill('Sterne');
 assert.equal(await results.count(),2,'search traverses title metadata');
 await results.filter({hasText:'Sternenreise'}).click();
 assert.equal(await expanded.locator('.library-heading h1').textContent(),'Sternenreise');
 assert.equal(await expanded.locator('.library-person').count(),3);
 assert.ok((await expanded.locator('.library-metadata').textContent()).includes('8.4'));
 assert.equal(await expanded.locator('.library-request').isDisabled(),true,'missing service must not present a working request');
 await page.screenshot({path:path.join(runtime,'library-desktop.png')});
 passed.push('cinematic detail view, poster, cast and unavailable service handling');
 // Exercise both scroll panes with enough actual sensor data to overflow.
 await expanded.evaluate((el,id)=>{
   el.__beforeScrollTest=el._hass;
   const sensor=el._hass.states[id];
   const items=sensor.attributes.data.map(item=>item.title==='Sternenreise'?{...item,overview:'Eine lange Handlung. '.repeat(180)}:item);
   items.push(...Array.from({length:18},(_,i)=>({title:`Sterne Test ${i}`,type:'movie',tmdb_id:10000+i,overview:'Testtitel'})));
   el.hass={...el._hass,states:{...el._hass.states,[id]:{...sensor,attributes:{...sensor.attributes,data:items}}}};
 },config.tmdb_entity);
 const detailPane=expanded.locator('.library-focus');
 const listPane=expanded.locator('.library-results');
 assert.ok(await detailPane.evaluate(el=>el.scrollHeight>el.clientHeight),'details must have a scroll viewport');
 assert.ok(await listPane.evaluate(el=>el.scrollHeight>el.clientHeight),'list must have a separate scroll viewport');
 await detailPane.hover();await page.mouse.wheel(0,800);
 await page.waitForFunction(()=>document.querySelector('mediarr-overlay-host').shadowRoot.querySelector('.library-focus').scrollTop>0);
 assert.equal(await listPane.evaluate(el=>el.scrollTop),0,'scrolling details must leave list in place');
 const detailScroll=await detailPane.evaluate(el=>el.scrollTop);
 await listPane.hover();await page.mouse.wheel(0,500);
 await page.waitForFunction(()=>document.querySelector('mediarr-overlay-host').shadowRoot.querySelector('.library-results').scrollTop>0);
 assert.equal(await detailPane.evaluate(el=>el.scrollTop),detailScroll,'scrolling list must leave details in place');
 await detailPane.focus();await page.keyboard.press('End');
 await expanded.locator('.library-person').last().scrollIntoViewIfNeeded();
 const actorBounds=await expanded.locator('.library-person').last().boundingBox();
 const paneBounds=await detailPane.boundingBox();
 assert.ok(actorBounds.y>=paneBounds.y && actorBounds.y+actorBounds.height<=paneBounds.y+paneBounds.height+1,'cast must be reachable inside detail viewport');
 await page.screenshot({path:path.join(runtime,'library-cast-scroll-desktop.png')});
 passed.push('desktop list and details scroll independently with mouse and keyboard, reaching cast');
 await expanded.evaluate(el=>{el.hass=el.__beforeScrollTest;delete el.__beforeScrollTest;});
 await detailPane.evaluate(el=>el.scrollTop=0);
 await listPane.evaluate(el=>el.scrollTop=0);
 const mockServices=async(fail=false)=>expanded.evaluate((el,fail)=>{
   const current=el._hass;
   el._hass={...current,services:{...current.services,mediarr:{submit_movie_request:{},submit_tv_request:{}}},callService:async(domain,service,data)=>{el.__calls??=[];el.__calls.push({domain,service,data});if(fail)throw new Error('Test backend rejected request');}};
   el._libraryView.refresh();
 },fail);
 await mockServices();
 await expanded.locator('.library-request').click();
 await expanded.locator('.library-heading .library-status-waiting').waitFor();
 const calls=await expanded.evaluate(el=>el.__calls);
 assert.deepEqual(calls[0],{domain:'mediarr',service:'submit_movie_request',data:{name:'Sternenreise'}});
 passed.push('movie request invokes advertised Mediarr service and enters waiting state (mock backend)');
 await results.filter({hasText:'Sternenstation'}).click();
 await expanded.locator('.library-request').click();
 await expanded.locator('#season-select').selectOption('latest');
 await expanded.locator('.mediarr-btn-confirm').click();
 await expanded.locator('.library-heading .library-status-waiting').waitFor();
 assert.deepEqual((await expanded.evaluate(el=>el.__calls))[1],{domain:'mediarr',service:'submit_tv_request',data:{name:'Sternenstation',season:'latest'}});
 passed.push('series request uses season selection and TV service (mock backend)');
 await expanded.locator('.mediarr-search').fill('Fehlerfilm');await results.click();await mockServices(true);
 await expanded.locator('.library-request').click();
 await expanded.locator('.library-action-message').filter({hasText:'Test backend rejected request'}).waitFor();
 assert.equal(await expanded.locator('.library-request').isDisabled(),false);
 passed.push('backend rejection stays visible and allows retry');
 await page.keyboard.press('Escape');await page.locator('mediarr-overlay-host').waitFor({state:'detached'});
 assert.equal(await source.locator('.compact-watchlist-posters .compact-poster').count(),4);
 passed.push('successful requests remain in the compact watchlist while sensors catch up');
 await source.locator('.mediarr-open-button').click();
 await expanded.locator('.mediarr-search').fill('Horizont');
 await results.filter({hasText:'Jenseits der Horizonte'}).click();
 const tracked=states[config.radarr_entity];tracked.attributes.data[0].hasFile=true;
 await api('/api/states/'+config.radarr_entity,{method:'POST',body:JSON.stringify({state:'1',attributes:tracked.attributes})});
 // Feed the actual API representation directly as well as via HA's WebSocket.
 await expanded.evaluate((el,{id,value})=>{el.hass={...el._hass,states:{...el._hass.states,[id]:value}};},{id:config.radarr_entity,value:tracked});
 await expanded.locator('.library-heading .library-status-ready').waitFor();
 passed.push('confirmed file availability moves a tracked title to ready');
 await expanded.locator('.mediarr-search').fill('Sterne');
 await results.filter({hasText:'Sternenreise'}).click();
 await page.keyboard.press('Escape');await page.locator('mediarr-overlay-host').waitFor({state:'detached'});
 await page.setViewportSize({width:390,height:844});
 await source.locator('.mediarr-open-button').waitFor();
 await source.evaluate((el,{config,states})=>{el.setConfig({...el.config,...config});el.hass={...el._hass,language:'de',states:{...el._hass.states,...states}};},{config,states});
 await source.locator('.mediarr-open-button').click();
 await expanded.locator('.mediarr-search').fill('Sterne');
 await results.filter({hasText:'Sternenreise'}).click();
 assert.equal(await source.locator('.compact-media').evaluate(el=>el.scrollWidth>el.clientWidth),false);
 passed.push('compact card fits a narrow mobile dashboard');
 assert.equal(await expanded.locator('.library-detail').evaluate(el=>el.scrollWidth>el.clientWidth),false);
 await expanded.locator('.library-focus').scrollIntoViewIfNeeded();
 await expanded.locator('.library-person').last().scrollIntoViewIfNeeded();
 const mobileCast=await expanded.locator('.library-person').last().boundingBox();
 assert.ok(mobileCast.y>=0 && mobileCast.y+mobileCast.height<=845,`mobile page scroll must reach cast: ${JSON.stringify(mobileCast)}`);
 await page.screenshot({path:path.join(runtime,'library-mobile.png')});
 passed.push('mobile layout preserves readable details without horizontal overflow');
 await page.keyboard.press('Escape');await page.locator('mediarr-overlay-host').waitFor({state:'detached'});
 assert.deepEqual(errors,[]);
 passed.push('clean close and no JavaScript exceptions');
 await fs.writeFile(path.join(runtime,'library-test-results.json'),JSON.stringify({passed,errors},null,2));
 console.log(`PASS: ${passed.length} library checks\n${passed.join('\n')}`);
} finally {
 try {if(browser) await browser.close();} finally {for(const id of created)await api('/api/states/'+id,{method:'DELETE'});}
}
