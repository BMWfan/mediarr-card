# Banner disappears after refresh (SDD-Light M)

## Problem / clarification
Owner reports one formerly ISO-backed movie now appears, but its banner briefly appears on pull-to-refresh and then disappears on both home and details; poster remains visible. No production data was read; the exact live URL/failure is unknown. Source inspection confirms CSS backdrops have no image-load validation or fallback. Reproduce that failure with synthetic missing artwork and later data updates; do not claim it proves the live incident's cause.

## Scope / acceptance
- Try safe landscape candidates from merged sources/metadata, then the poster. A broken preferred URL must not hide usable alternatives.
- Keep a previously loaded banner for the same stable title identity while new artwork loads or metadata temporarily omits it. Share this fallback within the card's home/details; bound the session-only cache.
- Never show the previous title's banner for another title. Late image responses and disconnected old DOM nodes must not overwrite current selection.
- Include fallback inputs in cinema's render signature so metadata-only changes can update artwork. Reject unsafe URLs as existing mediaImage does.
- Verify actual local HA/browser behavior with synthetic 404, sparse refresh, title change and delayed response; no production/paid API calls.
- Keep changes separate from Issue #44, and preserve SDD-Light/owner gates. No backend API/credential/network policy changes, merge or release.
