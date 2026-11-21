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
try {
 const page=await browser.newPage();const errors=[];page.on('pageerror',error=>errors.push(error.message));
 await page.addInitScript(({auth,base})=>localStorage.setItem('hassTokens',JSON.stringify({hassUrl:base,clientId:base+'/',...auth,expires:Date.now()+auth.expires_in*1000})),{auth,base});
 await page.goto(base+'/mediarr-test/test');
 const source=page.locator('mediarr-card');await source.locator('.mediarr-open-button').waitFor();
 const result=await source.evaluate(el=>{
   const config={type:'custom:mediarr-card',view:'library',media_player_entity:'media_player.test_fire_tv',
     plex_entity:'sensor.test_plex',radarr_entity:'sensor.test_radarr',sonarr_entity:'sensor.test_sonarr',
     immaculaterr_movies_entity:'sensor.test_immac_movies',immaculaterr_tv_entity:'sensor.test_immac_tv',
     tmdb_entity:'sensor.test_tmdb',tmdb_now_playing_entity:'sensor.test_tmdb_now',
     tmdb_on_air_entity:'sensor.test_tmdb_air',tmdb_popular_movies_entity:'sensor.test_tmdb_movies',
     tmdb_popular_tv_entity:'sensor.test_tmdb_tv',tmdb_upcoming_entity:'sensor.test_tmdb_upcoming',
     seer_entity:'sensor.test_seer',seer_trending_entity:'sensor.test_seer_trending',seer_discover_entity:'sensor.test_seer_discover',
     radarr_release_types:['Digital','Theatres','Physical'],max_items:15,days_to_check:360,opacity:.7,blur_radius:5};
   const actual=el._hass;
   const state=(id,data)=>({entity_id:id,state:'1',attributes:{data}});
   const states={...actual.states};
   for(const [key,id] of Object.entries(config))if(key.endsWith('_entity')&&key!=='media_player_entity')states[id]=state(id,[]);
   states[config.plex_entity]=state(config.plex_entity,[{title:'Existing movie',type:'movie',tmdb_id:10,number:'2026',overview:'A library title.'}]);
   states[config.radarr_entity]=state(config.radarr_entity,[{title:'Waiting movie',tmdb_id:11,release:2027}]);
   states[config.sonarr_entity]=state(config.sonarr_entity,[{title:'Waiting series',type:'show',tmdb_id:12,season:2}]);
   states[config.tmdb_entity]=state(config.tmdb_entity,[{title:'New movie',type:'movie',tmdb_id:13,overview:'Discovery overview.'}]);
   states[config.media_player_entity]={entity_id:config.media_player_entity,state:'playing',attributes:{media_title:'Test player',media_position:10,media_duration:100}};
   el._fullLibraryState={loaded:true,complete:true,groups:null};el._metadataBackendState={unsupported:true};
   el.setConfig(config);
   try {
     el.hass={...actual,language:'de',states};
     const initial=el._libraryView.entries.length;
     states[config.radarr_entity]=state(config.radarr_entity,{unexpected:'Not an array'});
     states[config.tmdb_now_playing_entity]=state(config.tmdb_now_playing_entity,null);
     states[config.immaculaterr_movies_entity]={entity_id:config.immaculaterr_movies_entity,state:'unavailable',attributes:{}};
     el.hass={...actual,language:'de',states};
     return {initial,after:el._libraryView.entries.length,error:null};
   } catch(error) {return {error:error.message};}
 });
 assert.equal(result.error,null,'full-page library must not call legacy release filters or renderers');
 assert.equal(result.initial,4);assert.equal(result.after,3);
 await source.evaluate(el=>el.setConfig({...el.config,view:'compact'}));
 await source.locator('.mediarr-open-button').click();
 const expanded=page.locator('mediarr-overlay-host mediarr-card');
 await expanded.locator('.cinema-shell').waitFor();
 assert.equal(await expanded.evaluate(el=>el._libraryView.entries.length),3);
 assert.deepEqual(errors,[]);
 // Issue #44: render synthetic Seerr rows with independent request/media states.
 await page.keyboard.press('Escape');
 await page.locator('mediarr-overlay-host').waitFor({state:'detached'});
 await source.evaluate(el=>{
   const row=(id,title,extra={})=>({request_id:id+1000,tmdb_id:id,title,type:'Movie',media_type:'movie',status:4,...extra});
   const requests=[row(701,'Failed request'),row(702,'Completed request',{status:5}),
     row(703,'Available media',{request_status:4,media_status:5}),
     row(704,'Partial movie',{status:2,request_status:2,media_status:4}),
     row(705,'Partial series',{type:'TV Show',media_type:'tv',request_status:2,media_status:4}),
     row(706,'File evidence')];
   const sensor=(id,data)=>({entity_id:id,state:'6',attributes:{data}});
   el._fullLibraryState={loaded:true,complete:true,groups:null};
   el.setConfig({...el.config,view:'library',library_layout:'classic',visible_sections:['seer','radarr','plex'],plex_entity:'sensor.provenance_plex',
     seer_entity:'sensor.provenance_requests',radarr_entity:'sensor.provenance_files'});
   el.hass={...el._hass,language:'en',states:{...el._hass.states,
     'sensor.provenance_requests':sensor('sensor.provenance_requests',requests),
     'sensor.provenance_plex':sensor('sensor.provenance_plex',[]),
     'sensor.provenance_files':sensor('sensor.provenance_files',[row(706,'File evidence',{has_file:true})])}};
 });
 await source.locator('[data-category=waiting]').click();
 const titles=await source.locator('.library-result').allTextContents();
 assert.equal(titles.length,3);
 for(const title of ['Failed request','Completed request','Partial movie'])assert.ok(titles.some(text=>text.includes(title)));
 await source.locator('[data-category=ready]').click();
 const available=await source.locator('.library-result').allTextContents();
 assert.equal(available.length,3);
 for(const title of ['Available media','Partial series','File evidence'])assert.ok(available.some(text=>text.includes(title)));
 // Ownership without Plex/Jellyfin library provenance is not a new arrival.
 await source.evaluate(el=>el.setConfig({...el.config,view:'compact'}));
 assert.equal(await source.locator('.compact-posters .compact-poster').count(),0,
   'manager files and Seerr availability must not enter Recently added without library provenance');
 await source.evaluate(el=>{
   const id='sensor.provenance_plex';
   const sensor=el._hass.states[id];
   el.hass={...el._hass,states:{...el._hass.states,[id]:{...sensor,attributes:{data:[
     {title:'Available media',type:'Movie',media_type:'movie',tmdb_id:703}
   ]}}}};
 });
 assert.equal(await source.locator('.compact-posters .compact-poster').count(),1,
   'new Plex evidence must refresh unchanged ready/title/ID entries');
 assert.ok((await source.locator('.compact-posters').textContent()).includes('Available media'));
 await source.evaluate(el=>{
   const id='sensor.provenance_plex';
   const sensor=el._hass.states[id];
   const added='2026-01-02';
   const rows=[
     {...sensor.attributes.data[0],added,added_at:'1767326400'},
     {title:'Zulu',media_type:'movie',tmdb_id:707,added,added_at:'1767337200'}
   ];
   el.hass={...el._hass,states:{...el._hass.states,[id]:{...sensor,attributes:{data:rows}}}};
 });
 assert.deepEqual(await source.locator('.compact-posters .compact-poster-title').allTextContents(),['Zulu','Available media']);
 // Exercise actual legacy detail rendering, including explicit status precedence.
 await source.evaluate(el=>{
   const id='sensor.provenance_requests';
   const sensor=el._hass.states[id];
   const rows=[{...sensor.attributes.data[0],status:2,request_status:4},
     {...sensor.attributes.data[1],status:4,request_status:5},sensor.attributes.data[0],
     {...sensor.attributes.data[0],request_status:'constructor'}];
   el.setConfig({...el.config,view:'legacy',visible_sections:['seer']});
   el.hass={...el._hass,states:{...el._hass.states,[id]:{...sensor,attributes:{data:rows}}}};
 });
 for(const [index,label] of [[0,'Failed'],[1,'Completed'],[2,'Failed'],[3,'Unknown']]) {
   await source.locator(`[data-type=seer][data-index="${index}"]`).click();
   await source.locator('[data-mediarr-status]').filter({hasText:label}).waitFor();
   assert.equal(await source.locator('.status-available').count(),0);
 }
 assert.deepEqual(errors,[]);
 console.log('PASS: 6 provider configuration checks\nfull source configuration with active media player and non-string release field\nmalformed/empty/unavailable sensor updates keep the unified library usable\ncompact opening overlay is independent of legacy renderers\nSeerr request/media/file evidence renders in the correct category\nlegacy failed/completed request labels and explicit request_status precedence\nmanager-only availability does not become a recent library arrival');
} finally {await browser.close();}
