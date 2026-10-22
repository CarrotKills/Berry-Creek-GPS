# Berry Creek GPS v0.2.0 — Illustrated Course Map for iPad

**Entirely separate from the Berry Creek DH Game.** Deploy to the existing Berry Creek GPS repository/service only. Do not upload files to the DH Game repository.

## New: Course Art toggle, real golf hole shapes

Tap **Course Art** on the map toolbar to switch from satellite imagery to an illustrated map with green fairways, bright greens, tan bunkers, and blue water. Shapes are geographic overlays, so GPS markers, scoring, and measurements stay aligned.

- On first use, the app *attempts* to retrieve mapped golf course outlines from **OpenStreetMap's Overpass API**. Available data vary and require an internet connection; there is no guarantee that all holes/features are mapped. OSM data are licensed ODbL; attribute OpenStreetMap and follow applicable use terms.
- If the illustrated map is missing a fairway or bunker, use **Draw Hole**. Choose a feature type, then tap its corners **on the satellite image**, press Save Shape. Return to Course Art to view the traced feature. **No invented hole shapes are bundled.**
- You can draw fairways, greens, bunkers, water, tee boxes, and rough for each hole. Each shape is saved to this iPad's browser storage. Use Draw Hole → **Export Drawings JSON** to back up and share between iPads. **Import Drawings JSON** replaces the current local custom drawings. This differs from the existing Round Menu → Export/Import Green Points JSON, which holds actual front/center/back distance reference points.
- The selected hole's custom drawings are shown over the community geometry. Course Art includes a legend and displays number of custom outlines for the hole. On initial use with incomplete mapped outlines, you may only see the topographic base map; map the silhouettes by tracing.
- Marker animations and moving distance guides carry over from v0.1.2.

## Installation on Render

Recommended: an independent Render **Static Site** pointed at a GitHub repo whose root contains `index.html`, `app.js`, `styles.css`, `icon.svg`, `sw.js`, `manifest.webmanifest` etc. Use build command `echo "Static files ready"` and publish directory `.`. Existing **Web Service** deployments continue to work with `node server.js` since `server.js` and `package.json` are included.

For an existing Berry Creek GPS Render deployment, extract this ZIP, replace the app files in the Berry Creek GPS GitHub repo root, commit, and redeploy. Open from iPad Home Screen in landscape after update. Because a service worker caches the shell, do a reload if seeing the old button.

## Important limitations

This is **not yet a verified, course-wide Garmin-equivalent map**. Actual outlines depend on community map features and manually traced geometry. Unmapped hazards are not shown and should not be assumed absent. Front/center/back green positions still must be calibrated for GPS yardages. **Do not use unverified coordinates or map measurements to make safety decisions near water or hazards.** Traced outlines and OpenStreetMap data are not survey grade. A source-verified proprietary aerial layout is not included.

Live maps and the Leaflet mapping library require internet connectivity (unless you separately license and implement offline tiles). A GPS-equipped iPad and location permission are recommended; iPads with Wi‑Fi-only location may be inaccurate. Existing scorekeeper data remain local on this iPad and are not synced to other users. Back up rounds and drawings before clearing browser data.

Map sources: OpenStreetMap contributors (Open Database License), Esri (satellite/topographic imagery; provider-specific terms), The Club at Berry Creek's public course information (https://www.theclubatberrycreek.com/golf).

See `RENDER_DEPLOYMENT.md` for Render details.
