# Library added order (M)

User reports Odyssee is marked available in Trending but is absent from the
expected first position in From your library. User ruled out kind/genre/unseen
filters and expects the last imported film first. Production payload is not
available in this session, so the exact movie is not asserted reproduced.

Confirmed code defect: Plex sensor emits `added` (YYYY-MM-DD) and precise
`added_at` (Unix seconds). Cinema prefers the lossy `added`, so same-day imports
sort alphabetically. Compact additionally passes numeric timestamps to Date.parse.

Use one source-aware added-time resolver in both views: prefer raw server import
time; try valid representations before fallback. Prefer actual Plex/Jellyfin
source references over merged manager/discovery metadata. Never sort on update,
release, request or current clock time. Preserve explicit filters and movie/TV
identity. Unknown timestamps sort after known times, without inventing dates.
