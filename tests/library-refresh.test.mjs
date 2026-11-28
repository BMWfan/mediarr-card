import test from 'node:test';
import assert from 'node:assert/strict';
import {MediaLibraryView} from '../media-library.js';

test('manual refresh during a revision check is queued once and awaited', async () => {
  const requests=[];
  const state={loaded:true,groups:{plex:[]},revision:'before',grantsUpdated:Date.now()};
  const view=Object.create(MediaLibraryView.prototype);
  view.card={isConnected:true,_fullLibraryState:state,_hass:{callWS:request=>
    new Promise(resolve=>requests.push({request,resolve}))}};
  view.refresh=view.render=()=>{};
  const check=view.loadLibrary(false,true);
  const manual=view.loadLibrary(true);
  assert.equal(view.loadLibrary(true),manual);
  assert.equal(requests.length,1);
  requests[0].resolve({unchanged:true,complete:true});
  await check;
  assert.equal(requests.length,2);
  assert.equal(requests[1].request.refresh,true);
  assert.equal(state.loading,true);
  requests[1].resolve({groups:{plex:[]},total_pages:1,revision:'after',complete:true});
  await manual;
  assert.equal(state.revision,'after');
  assert.equal(state.loading,false);
});
