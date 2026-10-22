# Berry Creek GPS — Render deployment fix (v0.1.1)

The earlier ZIP held only static files and did not include `server.js`.
If Render showed `Cannot find module '/opt/render/project/src/server.js'`, the service was likely configured as a Node Web Service.

## Recommended: a fresh Render Static Site
1. Use a **separate** GitHub repository for Berry Creek GPS; do not replace the DH Game repository.
2. Upload the **contents of this ZIP**, not the ZIP itself, to the GitHub repository root.
   Confirm `index.html` appears at the repository root, alongside `app.js` and `styles.css`.
3. In Render choose **New > Static Site** and select that repository.
4. Name: `berry-creek-gps` (or another unused name). Branch: `main` (or your repo's actual default).
5. Root Directory: blank. Build Command: `echo "Static files ready"`. Publish Directory: `.`.
6. Deploy and open the resulting HTTPS address.

Alternatively, select a **Blueprint** and use the included `render.yaml`, which declares a static site.

## Alternative: keep the existing Render Node Web Service
This revised package also includes a self-contained `server.js` and `package.json`.
1. Upload **the contents** of this ZIP to the root of the GitHub repository connected to the existing Render Web Service.
2. Confirm `server.js` is in the repository root (not nested in another folder).
3. In Render's Web Service settings, use:
   - Root Directory: blank
   - Build Command: `npm install` (or `echo "No build necessary"`)
   - Start Command: `node server.js` (or `npm start`)
4. Redeploy the latest commit. The Node server listens on the port Render sets in `PORT`.

If you put the files inside a folder instead, set Root Directory to that folder and use Publish Directory `.` for a Static Site.

**Do not deploy to the existing Berry Creek DH Game service.** This is a separate application.

## App expectations
- A valid HTTPS URL is needed for real iPad geolocation permissions.
- Internet access is required for initial maps, and GPS distance labels remain blank until the green coordinates are mapped.
- Scoring and course points are locally saved in the browser in this development version.
