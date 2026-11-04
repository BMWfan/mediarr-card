export const cinemaStyles = `
  .sr-only { position:absolute; width:1px; height:1px; padding:0; margin:-1px; overflow:hidden; clip:rect(0,0,0,0); white-space:nowrap; border:0; }
  .mediarr-cinema { max-width:none; color:#f4f6fa; background:#090d12; }
  .mediarr-cinema.mediarr-page { padding:0; height:auto; min-height:calc(100dvh - var(--header-height,56px)); }
  .mediarr-cinema.mediarr-page .cinema-shell { height:auto; }
  .mediarr-cinema.mediarr-page .cinema-body { overflow:visible; flex:none; }
  .mediarr-cinema ha-card { background:#090d12; color:#f4f6fa; border:0; border-radius:0; }
  .mediarr-cinema .card-content { padding:0; }
  .cinema-shell { display:flex; flex-direction:column; height:100%; min-height:0; font-family:var(--ha-font-family-body,Roboto,sans-serif); }
  .cinema-toolbar { display:flex; align-items:center; gap:24px; padding:14px 28px; flex-shrink:0; background:#090d12; border-bottom:1px solid #ffffff0d; z-index:3; }
  .cinema-brand { display:flex; align-items:center; gap:10px; color:#2bd6e4; font-size:1.4rem; white-space:nowrap; }
  .cinema-brand ha-icon { --mdc-icon-size:30px; }
  .cinema-search-label { display:flex; align-items:center; gap:10px; margin-left:auto; width:min(54%,650px); border:1px solid #ffffff32; background:#ffffff08; border-radius:9px; padding:0 12px; color:#a8b8c5; }
  .cinema-search-label .mediarr-search { border:0; background:transparent; padding:10px 0; border-radius:0; color:#f4f6fa; min-width:0; }
  .cinema-search-label:focus-within { outline:2px solid #2bd6e4; outline-offset:2px; }
  .cinema-search-label .mediarr-search:focus { outline:none; }
  .cinema-download-shortcut { position:relative; padding:8px; border:0; background:transparent; color:#cbd6df; cursor:pointer; }
  .cinema-download-shortcut span:not(:empty) { position:absolute; top:0; right:0; min-width:15px; height:15px; border-radius:20px; padding:1px; font-size:.65rem; background:#2bd6e4; color:#08131b; }
  .cinema-body { min-height:0; flex:1; overflow-y:auto; overscroll-behavior-y:contain; scrollbar-width:thin; scrollbar-color:#3c4b57 #090d12; scroll-padding-top:16px; }
  .cinema-library-status { margin:0; padding:10px 28px; background:#11222c; color:#bddbe4; font-size:.85rem; }
  .cinema-library-status:empty { display:none; }
  .cinema-home { padding-bottom:32px; }
  .cinema-hero { position:relative; min-height:420px; display:flex; align-items:center; isolation:isolate; overflow:hidden; background:radial-gradient(ellipse at 80% 20%,#183446,#090d12 70%); }
  .cinema-hero-backdrop { position:absolute; inset:0; z-index:-1; background-position:70% 28%; background-size:cover; }
  .cinema-hero-backdrop::after { content:''; position:absolute; inset:0; background:linear-gradient(90deg,#090d12 0%,#090d12d9 23%,#090d1270 48%,transparent 80%),linear-gradient(0deg,#090d12 0%,#090d1240 35%,transparent 75%); }
  .cinema-hero-copy { padding:44px 40px 58px; width:min(54%,650px); box-sizing:border-box; }
  .cinema-hero h1 { font-size:clamp(2rem,3.6vw,3.6rem); letter-spacing:.04em; line-height:1.15; margin:0 0 14px; text-wrap:balance; text-shadow:0 3px 24px #000; }
  .cinema-hero-meta { color:#bfcbd5; font-size:.85rem; line-height:1.6; margin:0 0 14px; }
  .cinema-availability { display:inline-block; padding:5px 9px; border:1px solid #597283; border-radius:7px; color:#bfd5e5; font-size:.75rem; line-height:1.4; }
  .cinema-availability-ready { border-color:#3e8159; color:#a5e9b8; background:#14371e80; }
  .cinema-availability-waiting { border-color:#877443; color:#eed89b; background:#30281380; }
  .cinema-hero-synopsis { margin:16px 0 22px; font-size:.95rem; line-height:1.6; color:#e0e5eb; display:-webkit-box; -webkit-line-clamp:3; -webkit-box-orient:vertical; overflow:hidden; }
  .cinema-hero-actions { display:flex; gap:12px; flex-wrap:wrap; align-items:center; }
  .mediarr-cinema button { font-family:inherit; cursor:pointer; }
  .cinema-hero-actions button, .cinema-account button, .cinema-account a, .cinema-reload { padding:9px 18px; color:#f0f4f8; border:1px solid #798a99; border-radius:7px; background:#111920a0; font-size:.85rem; }
  .cinema-hero-actions .cinema-primary { background:#2bd6e4; color:#07161b; border-color:#2bd6e4; font-weight:650; }
  .mediarr-cinema button:disabled { cursor:default; opacity:.55; }
  .mediarr-cinema button:focus-visible, .mediarr-cinema select:focus-visible, .cinema-account a:focus-visible { outline:2px solid #57e5f3; outline-offset:3px; }
  .cinema-home > section:not(.cinema-hero), .cinema-discovery { margin:22px 28px 32px; }
  .cinema-section-heading { display:flex; align-items:center; flex-wrap:wrap; gap:12px; margin:0 0 18px; }
  .cinema-section-heading h2 { font-size:clamp(1.1rem,1.6vw,1.5rem); margin:0; color:#f1f4f7; line-height:1.3; }
  .cinema-filters { display:flex; align-items:center; flex-wrap:wrap; gap:9px; margin-left:auto; }
  .mediarr-cinema select { background:#10181f; border:1px solid #566774; color:#ecf3f8; padding:7px 10px; border-radius:7px; font:inherit; font-size:.8rem; max-width:220px; }
  .mediarr-cinema select option, .mediarr-cinema select optgroup { background:#10181f; color:#ecf3f8; }
  .cinema-unseen { display:flex; gap:6px; align-items:center; border:1px solid #566774; padding:6px 9px; border-radius:7px; color:#d1e4ec; font-size:.8rem; cursor:pointer; }
  .cinema-unseen input { accent-color:#2bd6e4; }
  .cinema-episode-status { color:#6ce6ed; line-height:1.5; font-size:.75rem; }
  .library-trailer { display:inline-block; color:#6ce6ed; border:1px solid #34586b; border-radius:7px; padding:8px 12px; margin:8px 0; text-decoration:none; }
  .library-actions { display:flex; gap:12px; flex-wrap:wrap; align-items:center; }
  .cinema-trailer-window { position:fixed; right:20px; bottom:20px; width:min(480px,calc(100vw - 24px)); z-index:1000; background:#101923; color:#f1f7fb; border:1px solid #3f5e70; border-radius:12px; box-shadow:0 14px 70px #000b; overflow:hidden; }
  .cinema-trailer-window header { display:flex; align-items:center; gap:12px; padding:8px 12px; }
  .cinema-trailer-window strong { flex:1; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
  .cinema-trailer-close { background:transparent; border:0; color:#eff8fc; padding:8px; cursor:pointer; }
  .cinema-trailer-window iframe { display:block; width:100%; aspect-ratio:16/9; border:0; background:#000; }
  .cinema-trailer-window > a { display:block; padding:10px 12px; font-size:.75rem; color:#81e4ed; }
  @media (max-width:700px) { .cinema-trailer-window { right:12px; bottom:max(12px,env(safe-area-inset-bottom)); } }
  .library-episode-status { color:#6ce6ed; line-height:1.6; }
  .cinema-unseen:has(input:disabled) { opacity:.45; cursor:default; }
  .cinema-rail { display:grid; grid-auto-flow:column; grid-auto-columns:calc((100% - 5 * 14px) / 6); gap:14px; overflow-x:auto; padding:3px 3px 12px; scroll-snap-type:x proximity; scrollbar-width:thin; scrollbar-color:#344957 transparent; align-items:start; }
  .cinema-poster { min-width:0; border:0; background:transparent; color:#eef3f8; padding:0; text-align:left; scroll-snap-align:start; }
  .cinema-poster-art { position:relative; display:grid; place-items:center; aspect-ratio:2/3; background:linear-gradient(140deg,#21394a,#101923); border-radius:9px; overflow:hidden; box-shadow:0 0 0 1px #ffffff0c; }
  .cinema-poster-art > img { width:100%; height:100%; object-fit:cover; }
  .cinema-poster:hover .cinema-poster-art { box-shadow:0 0 0 2px #2bd6e4; }
  .cinema-poster > strong { display:block; margin-top:9px; font-size:.83rem; font-weight:550; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
  .cinema-poster > small { display:block; margin-top:3px; color:#a9b5bf; font-size:.72rem; }
  .cinema-poster-status { position:absolute; top:7px; right:7px; display:grid; place-items:center; height:21px; width:21px; border-radius:30px; font-size:.85rem; color:#eafaff; background:#173141df; }
  .cinema-status-ready { color:#abefbd; background:#185030e8; }
  .cinema-status-waiting { color:#ffe0a3; background:#564421e8; }
  .cinema-empty { margin:0; padding:28px 8px; color:#aab9c5; font-size:.9rem; line-height:1.6; min-width:230px; grid-column:1/-1; }
  .cinema-rail-more { align-self:center; border:1px solid #435a6d; border-radius:8px; padding:12px; background:#12232e; color:#6ce6ed; }
  .cinema-discovery { display:grid; grid-template-columns:minmax(0,1fr) minmax(0,1fr); gap:30px; }
  .cinema-discovery > section { min-width:0; }
  .cinema-discovery > section + section { border-left:1px solid #ffffff20; padding-left:30px; }
  .cinema-discovery .cinema-rail { grid-auto-columns:calc((100% - 2 * 12px) / 3); gap:12px; }
  .cinema-account-settings,.cinema-disconnect { background:transparent; color:#a8c4d3; border:0; padding:4px; font-size:.75rem; margin-left:auto; }
  .cinema-account { min-height:230px; display:flex; flex-direction:column; align-items:flex-start; justify-content:center; gap:10px; padding:20px; color:#a9c0cd; border-radius:10px; background:linear-gradient(125deg,#172934,#0c141c); }
  .cinema-account p { line-height:1.6; margin:0; font-size:.9rem; }
  .cinema-account ha-icon { color:#41ccd9; --mdc-icon-size:32px; }
  .cinema-account a { text-decoration:none; }
  .cinema-upcoming-rail { display:grid; grid-auto-flow:column; grid-auto-columns:calc((100% - 3 * 16px) / 4); gap:16px; overflow-x:auto; scrollbar-width:thin; scrollbar-color:#344957 transparent; padding:3px 3px 12px; }
  .cinema-upcoming-card { min-width:0; border:0; padding:0; text-align:left; background:transparent; color:#eaf1f7; }
  .cinema-upcoming-card > span { display:grid; place-items:center; aspect-ratio:16/9; border-radius:9px; background:#162735; overflow:hidden; }
  .cinema-upcoming-card img { width:100%; height:100%; object-fit:cover; }
  .cinema-upcoming-card strong,.cinema-upcoming-card small { display:block; margin-top:7px; font-size:.85rem; }
  .cinema-upcoming-card small { color:#a4bdca; font-size:.75rem; }
  .cinema-download-grid { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:24px; }
  .cinema-download-item { display:flex; align-items:center; gap:16px; padding:0; border:0; background:transparent; text-align:left; color:#ecf4f9; }
  .cinema-download-item > img { width:62px; height:90px; object-fit:cover; border-radius:7px; }
  .cinema-download-item > span { flex:1; min-width:0; }
  .cinema-download-item .media-download-badge { position:static; background:transparent; padding:10px 0; font-size:.8rem; }
  .cinema-download-item .media-download-track { height:5px; }
  .cinema-section-heading .cinema-reload { margin-left:auto; padding:5px 10px; font-size:.75rem; }
  .cinema-detail { padding:20px 30px 36px; }
  .cinema-back { color:#d7e6f0; background:transparent; border:0; padding:8px 0; margin-bottom:8px; font-size:.9rem; }
  .mediarr-cinema .library-focus { position:static; overflow:visible; height:auto; padding:0; scrollbar-gutter:auto; }
  .mediarr-cinema .library-detail { background:#090d12; }
  .mediarr-cinema .library-backdrop::after { background:linear-gradient(90deg,#090d12 0%,transparent 35%),linear-gradient(0deg,#090d12 0%,#090d1240 60%,transparent); }
  .mediarr-cinema .library-title-row { padding-top:80px; }
  .mediarr-cinema .library-detail-body { max-width:1100px; }
  .cinema-search-results { padding:12px 30px 40px; }
  .mediarr-cinema .cinema-search-results .library-results { display:grid; gap:0; overflow:visible; padding:0; scrollbar-gutter:auto; }
  .cinema-search-result { display:grid; grid-template-columns:90px minmax(0,1fr) auto; align-items:center; gap:20px; border:0; border-bottom:1px solid #ffffff1c; background:transparent; color:#ecf3f8; text-align:left; padding:16px 0; }
  .cinema-search-result:hover { background:#ffffff04; }
  .cinema-result-poster { position:relative; display:grid; place-items:center; width:90px; aspect-ratio:2/3; background:#162735; border-radius:7px; overflow:hidden; }
  .cinema-result-poster img { width:100%; height:100%; object-fit:cover; }
  .cinema-result-copy { display:grid; gap:8px; min-width:0; }
  .cinema-result-copy strong { font-size:1.2rem; }
  .cinema-result-copy small { color:#b7c9d5; }
  .cinema-result-copy > span { color:#bac8d4; font-size:.9rem; line-height:1.5; display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; overflow:hidden; }
  .cinema-home[hidden],.cinema-detail[hidden],.cinema-search-results[hidden] { display:none; }
  .cinema-player-dialog { width:min(460px,calc(100vw - 48px)); box-sizing:border-box; border:1px solid #405b6b; border-radius:12px; padding:24px; color:#f0f7fc; background:#0d1821; }
  .cinema-player-dialog::backdrop { background:#000b; }
  .cinema-player-dialog h2 { margin:0 0 20px; font-size:1.2rem; }
  .cinema-player-list { display:grid; gap:12px; line-height:1.6; }
  .cinema-player-dialog button { padding:10px 14px; background:#122935; border:1px solid #34586b; border-radius:7px; color:#d2f2fa; }
  .cinema-player-close { margin-top:20px; }
  .cinema-player-refresh { margin-top:20px; margin-right:12px; }
  /* Text actions share the compact trailer proportions, including native buttons. */
  .mediarr-cinema .library-actions > button,
  .mediarr-cinema .library-actions > .library-trailer,
  .mediarr-cinema .cinema-hero-actions > button,
  .mediarr-cinema .cinema-account button,
  .mediarr-cinema .cinema-account a,
  .mediarr-cinema .cinema-reload,
  .mediarr-cinema .library-metadata-retry,
  .mediarr-cinema .cinema-player-refresh,
  .mediarr-cinema .cinema-player-close {
    box-sizing:border-box; display:inline-flex; align-items:center; justify-content:center;
    min-height:42px; padding:8px 14px; border-width:1px; border-style:solid;
    border-radius:7px; font-family:inherit; font-size:.9rem; line-height:1.4;
    text-align:center; text-decoration:none; vertical-align:middle;
  }
  .mediarr-cinema .library-actions > button,
  .mediarr-cinema .library-actions > .library-trailer { margin:0; }
  .library-trailer, .cinema-hero-trailer { gap:8px; }
  .library-trailer ha-icon, .cinema-hero-trailer ha-icon { --mdc-icon-size:20px; flex-shrink:0; }
  @media (max-width:1050px) {
    .cinema-section-heading { align-items:flex-start; }
    .cinema-filters { margin-left:0; }
    .cinema-rail { grid-auto-columns:calc((100% - 4 * 12px) / 5); gap:12px; }
    .cinema-hero-copy { width:65%; padding-left:28px; }
  }
  @media (max-width:700px) {
    .mediarr-cinema.mediarr-page { height:auto; min-height:calc(100dvh - var(--header-height,56px)); }
    .mediarr-cinema .cinema-shell { height:auto; }
    .mediarr-cinema .cinema-body { overflow:visible; }
    .cinema-toolbar { gap:12px; padding:10px 12px; position:sticky; top:0; }
    .mediarr-page .cinema-toolbar { top:var(--header-height,56px); }
    .cinema-brand { font-size:1.05rem; gap:5px; }
    .cinema-brand ha-icon { --mdc-icon-size:23px; }
    .cinema-search-label { width:auto; flex:1; padding:0 8px; min-width:0; }
    .cinema-search-label .mediarr-search { font-size:.8rem; }
    .cinema-search-label > ha-icon { display:none; }
    .cinema-download-shortcut { padding:4px; }
    .cinema-hero { min-height:390px; align-items:flex-end; }
    .cinema-hero-copy { width:100%; padding:160px 18px 30px; }
    .cinema-hero-backdrop { background-position:65% top; }
    .cinema-hero-backdrop::after { background:linear-gradient(0deg,#090d12 0%,#090d12eb 30%,#090d1260 70%,#090d1220); }
    .cinema-hero h1 { font-size:2rem; }
    .cinema-hero-meta { font-size:.75rem; }
    .cinema-hero-synopsis { font-size:.85rem; -webkit-line-clamp:2; }
    .cinema-home > section:not(.cinema-hero),.cinema-discovery { margin:20px 14px 28px; }
    .cinema-filters { gap:7px; }
    .mediarr-cinema select { font-size:.72rem; max-width:180px; padding:6px 7px; }
    .cinema-unseen { font-size:.72rem; padding:5px 7px; }
    .cinema-rail { grid-auto-columns:calc((100% - 24px) / 2.65); gap:12px; }
    .cinema-discovery { grid-template-columns:minmax(0,1fr); gap:28px; }
    .cinema-discovery > section + section { border:0; padding:0; }
    .cinema-discovery .cinema-rail { grid-auto-columns:calc((100% - 24px) / 2.65); }
    .cinema-upcoming-rail { grid-auto-columns:75%; }
    .cinema-download-grid { grid-template-columns:minmax(0,1fr); gap:18px; }
    .cinema-detail,.cinema-search-results { padding:10px 14px 28px; }
    .cinema-search-result { grid-template-columns:66px minmax(0,1fr); gap:12px; }
    .cinema-result-poster { width:66px; grid-row:1/3; }
    .cinema-result-copy strong { font-size:1rem; }
    .cinema-result-copy small { font-size:.72rem; }
    .cinema-result-copy > span { font-size:.78rem; }
    .cinema-search-result > .cinema-availability { grid-column:2; justify-self:start; font-size:.65rem; }
    .mediarr-cinema .library-title-row { padding-top:20px; }
  }
  @media (prefers-reduced-motion:reduce) { .mediarr-cinema * { scroll-behavior:auto!important; transition:none!important; } }
`;
