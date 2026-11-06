import test from 'node:test';
import assert from 'node:assert/strict';
import {fetchMediaLibrary, searchMediaCatalog} from '../media-metadata.js';

test('Mediarr 0.7 library contract preserves partial pages and provider errors', async () => {
  const request = {page: 1, refresh: true};
  let message;
  const response = {
    groups: {
      plex: [{title: 'Known film', media_type: 'movie', tmdb_id: 7}],
      radarr: [],
      sonarr: [],
    },
    page: 1,
    total_pages: 1,
    complete: false,
    errors: [{provider: 'radarr', code: 'library_unavailable'}],
  };
  const result = await fetchMediaLibrary({
    callWS: async value => {
      message = value;
      return response;
    },
  }, request);

  assert.deepEqual(message, {type: 'mediarr/library', ...request});
  assert.deepEqual(result, response);
  assert.equal(result.complete, false);
  assert.deepEqual(result.errors, [{provider: 'radarr', code: 'library_unavailable'}]);
});

test('Mediarr 0.7 catalog contract sends paging and accepts typed TMDB IDs only', async () => {
  let message;
  const result = await searchMediaCatalog({
    callWS: async value => {
      message = value;
      return {
        results: [
          {media_type: 'movie', tmdb_id: 12, title: 'Film'},
          {media_type: 'person', tmdb_id: 13, title: 'Actor'},
          {media_type: 'tv', tmdb_id: '14', title: 'Invalid ID'},
        ],
        page: 2,
        total_pages: 3,
      };
    },
  }, '  Film  ', 'de-DE', 2);

  assert.deepEqual(message, {
    type: 'mediarr/search',
    query: 'Film',
    language: 'de-DE',
    page: 2,
  });
  assert.equal(result.page, 2);
  assert.equal(result.total_pages, 3);
  assert.deepEqual(result.results, [{media_type: 'movie', tmdb_id: 12, title: 'Film'}]);
});

test('older or missing Mediarr commands are reported as unsupported', async () => {
  await assert.rejects(fetchMediaLibrary({}), error => error.code === 'unknown_command');
  await assert.rejects(searchMediaCatalog({callWS: async () => {
    throw {code: 'unknown_command'};
  }}, 'Film'), error => error.code === 'unknown_command');
});
