A failed or replaced banner URL currently blanks the cinema hero and detail backdrop even when another source has usable artwork. Preload safe candidates before replacement, retain the last loaded landscape for the same stable title, and use alternate artwork/poster fallback. Metadata-only changes refresh the hero; title changes and empty results clear old artwork, and late responses cannot overwrite a newer selection.

Owner-reported symptom: one film's banner appears briefly on refresh and then disappears on home and details while its poster remains. The synthetic failure is reproduced; its exact live source/URL was not inspected, so no claim is made that this proves the owner's specific cause.

SDD-Light M: [specification and evidence](https://github.com/BMWfan/mediarr-card/tree/fix/banner-refresh/docs/specs/banner-refresh). Separate main-based fix; no changes to Drafts #48/#33 or the sensor interface.

Validation: baseline main bundle fails the corrected real-HA image regression; candidate passes. Full local suite: 31 model tests, 6 release tests, 81 browser checks; generated bundle matches the tested development artifact. Covers missing image, sparse/metadata-only updates, mobile/home/details, delayed responses and empty selection. Actual token totals remain UNMEASURED; rework documented. No production access, version bump, merge or release. Keep Draft.
