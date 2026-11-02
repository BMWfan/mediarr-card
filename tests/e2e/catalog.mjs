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
 const page=await browser.newPage({viewport:{width:1280,height:850}});
 page.setDefaultTimeout(10000);
 const errors=[];page.on('pageerror',e=>{errors.push(e.message);console.log('PAGE ERROR',e.message)});
 await page.addInitScript(({auth,base})=>localStorage.setItem('hassTokens',JSON.stringify({hassUrl:base,clientId:base+'/',...auth,expires:Date.now()+auth.expires_in*1000})),{auth,base});
 await page.goto(base+'/mediarr-test/test');
 const source=page.locator('mediarr-card');await source.locator('.mediarr-open-button').waitFor();
 await source.evaluate(el=>{
   const actual=el._hass;
   window.catalogCalls=[];window.catalogPending={};window.requestCalls=[];
   const config={visible_sections:['plex','radarr','tmdb'],plex_entity:'sensor.catalog_ready',radarr_entity:'sensor.catalog_waiting',tmdb_entity:'sensor.catalog_discover'};
   const states={...actual.states};
   for(const [kind,key,offset] of [['movie','plex_entity',100],['movie','radarr_entity',200],['movie','tmdb_entity',300]]) {
     states[config[key]]={state:'15',attributes:{data:Array.from({length:15},(_,i)=>({title:`Scroll ${offset+i}`,tmdb_id:offset+i,type:kind,overview:'Eine lange Handlung zum Scrollen. '.repeat(140),cast:[{name:'Test Actor',character:'Pilot'}]}))}};
   }
   states[config.plex_entity].attributes.data.push({title:'Vorhandener Film',tmdb_id:7,type:'movie',watched:true,overview:'Bereits in Plex',cast:[{name:'Actor'}]});
   el.setConfig({...el.config,...config});
   el.hass={...actual,language:'de',states,services:{...actual.services,mediarr:{submit_movie_request:{},submit_tv_request:{}}},
     callService:async(domain,service,data)=>{window.requestCalls.push({domain,service,data});if(data.name==='Rejected')throw new Error('Rejected by backend');},
     callWS:msg=>{
       if(msg.type==='mediarr/search') {window.catalogCalls.push(msg);return new Promise((resolve,reject)=>window.catalogPending[msg.query+':'+msg.page]={resolve,reject});}
       if(msg.type==='mediarr/media_details')return Promise.resolve({media_type:msg.media_type,tmdb_id:msg.tmdb_id,title:msg.title,overview:'Vollständige Handlung',cast:[{name:'Catalog Actor',character:'Pilot'}]});
       return actual.callWS(msg);
     }};
   window.catalogTestConfig=el.config;window.catalogTestHass=el._hass;
 });
 await source.locator('.mediarr-open-button').click();
 const expanded=page.locator('mediarr-overlay-host mediarr-card');
 const input=expanded.locator('.mediarr-search');
 const list=expanded.locator('.library-results');const detail=expanded.locator('.library-focus');
 // The same independent-scroll contract applies to every category, including waiting.
 for(const width of [1280]) {
   await page.setViewportSize({width,height:850});
   if(!await page.locator('mediarr-overlay-host').count()) {
     await source.locator('.mediarr-open-button').waitFor();
     await source.evaluate(el=>{el.setConfig(window.catalogTestConfig);el.hass=window.catalogTestHass;el._openMediaOverlay();});
   }
   for(const category of ['waiting','ready','discover']) {
     await expanded.locator(`[data-category=${category}]`).click();
     await list.evaluate(el=>el.scrollTop=0);await detail.evaluate(el=>el.scrollTop=0);
     assert.ok(await list.evaluate(el=>el.scrollHeight>el.clientHeight));
     await list.hover();await page.mouse.wheel(0,400);
     await page.waitForFunction(()=>document.querySelector('mediarr-overlay-host').shadowRoot.querySelector('.library-results').scrollTop>0);
     assert.equal(await detail.evaluate(el=>el.scrollTop),0);
     const before=await list.evaluate(el=>el.scrollTop);
     await detail.hover();await page.mouse.wheel(0,600);
     await page.waitForFunction(()=>document.querySelector('mediarr-overlay-host').shadowRoot.querySelector('.library-focus').scrollTop>0);
     assert.equal(await list.evaluate(el=>el.scrollTop),before);
     await detail.evaluate(el=>el.scrollTop=el.scrollHeight);
     await detail.hover();await page.mouse.wheel(0,500);
     assert.equal(await list.evaluate(el=>el.scrollTop),before,'no scroll chaining at detail boundary');
   }
 }
 passed.push('watchlist, available and discovery panes scroll independently on desktop');
 await page.setViewportSize({width:1280,height:850});
 if(!await page.locator('mediarr-overlay-host').count())await source.evaluate(el=>{el.setConfig(window.catalogTestConfig);el.hass=window.catalogTestHass;el._openMediaOverlay();});
 await input.fill('Nova');
 await page.waitForFunction(()=>window.catalogPending['Nova:1']);
 await page.evaluate(()=>window.catalogPending['Nova:1'].resolve({page:1,total_pages:2,results:[
   {title:'Nova',media_type:'movie',tmdb_id:7},
   {title:'Nova',media_type:'tv',tmdb_id:7},
   {title:'Nova Remake',media_type:'movie',tmdb_id:99},
 ]}));
 await expanded.locator('.library-catalog-status').filter({hasText:'TMDB-Treffer'}).waitFor();
 assert.equal(await expanded.locator('.library-result').count(),3,'typed IDs merge known movies without merging a TV ID collision');
 assert.ok((await list.textContent()).includes('Vorhandener Film'),'watched local item still appears in search');
 await expanded.locator('.library-result').filter({hasText:'Vorhandener Film'}).click();
 assert.equal(await expanded.locator('.library-request').count(),0,'known library item cannot be requested');
 passed.push('catalog includes new titles and watched library matches, preserving movie/TV identity and availability');
 await expanded.locator('.library-result').filter({hasText:'Nova Remake'}).click();
 await expanded.locator('.library-person').waitFor();
 await expanded.locator('.library-request').click();
 await expanded.locator('.library-heading .library-status-waiting').waitFor();
 assert.deepEqual((await page.evaluate(()=>window.requestCalls))[0],{domain:'mediarr',service:'submit_movie_request',data:{name:'Nova Remake',tmdb_id:99}});
 passed.push('new catalog movie requests the selected TMDB ID and enters the watchlist');
 await expanded.locator('.library-result').filter({hasText:'Nova',exact:false}).filter({hasText:'Serie'}).click();
 await expanded.locator('.library-request').click();
 await expanded.locator('#season-select').selectOption('all');
 await expanded.locator('.mediarr-btn-confirm').click();
 await expanded.locator('.library-heading .library-status-waiting').waitFor();
 assert.deepEqual((await page.evaluate(()=>window.requestCalls))[1],{domain:'mediarr',service:'submit_tv_request',data:{name:'Nova',tmdb_id:7,season:'all'}});
 passed.push('new catalog series uses TV request with exact ID and season selection');
 await expanded.locator('.library-load-more').click();
 await page.waitForFunction(()=>window.catalogPending['Nova:2']);
 await page.evaluate(()=>window.catalogPending['Nova:2'].resolve({page:2,total_pages:2,results:[{title:'Nova Two',media_type:'movie',tmdb_id:1010}]}));
 await expanded.locator('.library-result').filter({hasText:'Nova Two'}).waitFor();
 assert.equal(await expanded.locator('.library-result').count(),4);
 passed.push('additional catalog pages append and deduplicate results');
 await input.fill('Old');await page.waitForFunction(()=>window.catalogPending['Old:1']);
 await input.fill('New');await page.waitForFunction(()=>window.catalogPending['New:1']);
 await page.evaluate(()=>{
   window.catalogPending['New:1'].resolve({page:1,total_pages:1,results:[{title:'New title',media_type:'movie',tmdb_id:1100}]});
   window.catalogPending['Old:1'].resolve({page:1,total_pages:1,results:[{title:'Old stale title',media_type:'movie',tmdb_id:1101}]});
 });
 await expanded.locator('.library-result').filter({hasText:'New title'}).waitFor();
 assert.equal(await expanded.locator('.library-result').filter({hasText:'Old stale title'}).count(),0);
 passed.push('late catalog responses cannot overwrite a newer search');
 await input.fill('Missing');await page.waitForFunction(()=>window.catalogPending['Missing:1']);
 await page.evaluate(()=>window.catalogPending['Missing:1'].reject({code:'tmdb_not_configured'}));
 await expanded.locator('.library-catalog-status').filter({hasText:'TMDB-Zugang'}).waitFor();
 await input.fill('Scroll');await page.waitForFunction(()=>window.catalogPending['Scroll:1']);
 await page.evaluate(()=>window.catalogPending['Scroll:1'].reject({code:'unknown_command'}));
 await expanded.locator('.library-catalog-status').filter({hasText:'aktualisierte Mediarr'}).waitFor();
 assert.ok(await expanded.locator('.library-result').count()>0,'local search remains usable without catalog backend');
 passed.push('missing TMDB and outdated backend show explicit status while local search still works');
 await page.locator('mediarr-overlay-host .mediarr-overlay-close').click();await page.locator('mediarr-overlay-host').waitFor({state:'detached'});
 assert.ok((await source.locator('.compact-watchlist-link').textContent()).includes('17'),'pending catalog requests survive closing');
 await source.evaluate(el=>{el.setConfig({...el.config,view:'library'});});
 await source.locator('.mediarr-search').waitFor();
 assert.equal(await page.locator('mediarr-overlay-host').count(),0);
 assert.equal(await source.locator('.compact-media').count(),0);
 await source.locator('[data-category=waiting]').click();
 assert.ok((await source.locator('.library-results').textContent()).includes('Nova Remake'));
 const pageHeight=await source.evaluate(el=>el.getBoundingClientRect().height);
 assert.ok(pageHeight>700 && pageHeight<=850,'full-page mode fills viewport content');
 await page.screenshot({path:path.join(runtime,'catalog-full-page.png')});
 await source.evaluate(el=>el.setConfig({...el.config,view:'compact'}));
 await source.locator('.compact-media').waitFor();
 passed.push('editor view option switches compact/full-page without an overlay and preserves requested catalog titles');
 assert.deepEqual(errors,[]);
 console.log(`PASS: ${passed.length} catalog checks\n${passed.join('\n')}`);
} finally {await browser.close();}
