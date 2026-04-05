# Mediarr Card: Migration to HACS

These steps are generic and repository-safe.

## 1) Create your own GitHub repository

1. Create a new repository, for example `yourname/mediarr-card`.
2. Push the contents of this card directory/repository to that repository.
3. Verify that `hacs.json` is in the repository root.

Note: This is already prepared in the current state (`content_in_root: true`, `filename: mediarr-card.js`).

## 2) Add a HACS custom repository

1. Home Assistant -> `HACS` -> `Frontend`.
2. Open `⋮` -> `Custom repositories`.
3. Add your repository URL.
4. Category: `Dashboard`.
5. Save.

## 3) Install the card via HACS

1. Search for your card in HACS.
2. Install it.
3. Restart Home Assistant.

## 4) Remove the old manual resource (important)

Current manual resource:

- `/local/mediarr-card/mediarr-card.js` (or a previously versioned file)

After HACS installation, remove the old manual resource to avoid duplicate card registrations.

Steps:

1. Settings -> Dashboards -> Resources.
2. Remove the old `/local/mediarr-card/...` resource.
3. Confirm a HACS resource exists instead:
   - `/hacsfiles/<your-repo-name>/mediarr-card.js?hacstag=...`

## 5) Refresh browser cache

1. Reload Home Assistant frontend.
2. Hard-reload the browser (`Ctrl+F5`).

## 6) Optional cleanup after migration

After verification, you can delete local cache-bust helper bundles:

- `mediarr-card.<version>.js` helper files

and keep only `mediarr-card.js`.

## 7) Future update flow

1. Commit changes to your GitHub repository.
2. Create a release/tag.
3. Update from HACS.

If submodule cache issues still appear, bump query versions in imports (for example `?v=<new-version>`) to force fresh submodule loading.
