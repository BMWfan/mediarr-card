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
 assert.deepEqual(errors,[]);
 await fs.writeFile(path.join(runtime,'metadata-test-results.json'),JSON.stringify({passed,errors},null,2));
 console.log(`PASS: ${passed.length} metadata browser checks\n${passed.join('\n')}`);
} finally {await browser.close();}
