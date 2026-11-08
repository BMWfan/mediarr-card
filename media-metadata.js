// Metadata travels through the authenticated HA connection, never a browser API key.
export async function fetchMediaLibrary(hass, options = {}) {
  if(typeof hass?.callWS!=='function')throw {code:'unknown_command'};
  let timeout;
  try {
    return await Promise.race([hass.callWS({type:'mediarr/library',...options}),new Promise((_,reject)=>{timeout=setTimeout(()=>reject({code:'library_unavailable'}),90000);})]);
  } finally {clearTimeout(timeout);}
}

export async function searchMediaCatalog(hass, query, language = 'en', page = 1) {
  if (typeof hass?.callWS !== 'function') throw {code:'unknown_command'};
  let timeout;
  try {
    const result=await Promise.race([
      hass.callWS({type:'mediarr/search',query:query.trim(),language:/^[a-zA-Z]{2,3}(-[a-zA-Z]{2})?$/.test(language)?language:'en',page}),
      new Promise((_,reject)=>{timeout=setTimeout(()=>reject({code:'metadata_unavailable'}),16000);}),
    ]);
    if (!result || !Array.isArray(result.results) || !Number.isInteger(result.page) || !Number.isInteger(result.total_pages)) throw {code:'metadata_invalid'};
    return {...result,results:result.results.filter(item=>['movie','tv'].includes(item?.media_type)&&Number.isSafeInteger(item.tmdb_id)&&item.tmdb_id>0)};
  } finally {clearTimeout(timeout);}
}

export async function fetchMediaMetadata(hass, entry, language = 'en', region = 'DE') {
  if (typeof hass?.callWS !== 'function') throw {code:'unknown_command',message:'Mediarr metadata backend is unavailable.'};
  const request = {
    type:'mediarr/media_details',
    media_type:['movie','tv'].includes(entry.kind) ? entry.kind : 'unknown',
    title:entry.title,
    language:/^[a-zA-Z]{2,3}(-[a-zA-Z]{2})?$/.test(language) ? language : 'en',
    region:/^[A-Z]{2}$/.test(region)?region:'DE',
  };
  const id = Number(entry.ids?.tmdb);
  if (Number.isSafeInteger(id) && id > 0) request.tmdb_id=id;
  const year = Number(entry.year);
  if (Number.isInteger(year) && year >= 1800 && year <= 2200) request.year=year;
  let timeout;
  try {
    const result=await Promise.race([
      hass.callWS(request),
      new Promise((_,reject)=>{timeout=setTimeout(()=>reject({code:'metadata_unavailable',message:'Metadata request timed out.'}),16000);}),
    ]);
    if (!result || !['movie','tv'].includes(result.media_type) || !Number.isSafeInteger(result.tmdb_id) || result.tmdb_id <= 0) {
      throw {code:'metadata_invalid',message:'Invalid metadata response.'};
    }
    return result;
  } finally { clearTimeout(timeout); }
}
