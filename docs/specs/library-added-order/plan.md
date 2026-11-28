# Plan and analysis

Add a shared added-time resolver, use it in Cinema and compact sorting, and
cover same-day chronological ordering, source precedence, invalid fallbacks,
update/release-field exclusion and Trending-to-library identity consistency.
Verify synthetic model and real HA browser regression. Publish HACS Card
0.6.0-dev.12 paired with unchanged sensor 0.8.0-dev.10; do not merge main.

If a production title still lacks any Plex/library timestamp, do not claim this
fix fabricates one or proves the title's live source data. Follow up with actual
read-only source evidence. Rollback: Card 0.6.0-dev.11; no storage migration.
