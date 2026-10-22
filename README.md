# Berry Creek GPS — iPad Landscape Prototype v0.1

A **separate** proof-of-concept from the Berry Creek DH Game. This package does not call, access, or modify the DH Game's database, source, or hosting.

## What works

- iPad-first 2-panel landscape user interface and full-map toggle.
- Live satellite map of The Club at Berry Creek (initial clubhouse reference point, not a mapped hole).
- Streets/satellite toggle, pan and zoom, recenter on clubhouse or your reported GPS position.
- Live device geolocation (after permission) and accuracy readout; geolocation is available only on a secure HTTPS or localhost origin. Cellular-equipped iPads with GNSS generally give better on-course positioning; a Wi-Fi-only iPad can have less precise location.
- Mark FRONT, CENTER and BACK of each hole's green by tapping the map. Mapping starts intentionally blank: precise green coordinates have **not** been independently verified. Use a survey or verified green coordinates before depending on the distance readings.
- Yardages in yards from your actual reported position to each saved mapped green point; tap-to-measure targets.
- Yellow TEST POINT mode for off-course demonstration; never presented as real GPS.
- Current round scoring for up to five players, 18 holes, gross totals, to-par totals, and 18-hole scorecard.
- Save and revisit local round history. CSV score export. Export/import mapped green coordinates as JSON.
- Browser device storage for rounds, scores, and mappings; local app-shell cache via service worker.

## Important limitations in v0.1

1. **This is a development prototype, not yet a calibrated golf GPS product.** The green coordinates are intentionally blank. There is no source-verified front/center/back database yet. Do not interpret course-card tee distances as live GPS distances.
2. Maps and Leaflet library initially require network access. Service worker caches the local app shell, **not guaranteed offline satellite imagery**. Score data is saved to this device only (no login, cloud sync, GHIN, or DH Game connectivity).
3. Apple Home Screen web apps provide an app-like standalone experience, but can still display some iPadOS system bars and cannot always lock physical device orientation. Rotate the iPad to landscape and preferably use it outside Stage Manager / Split View.
4. Base imagery uses Esri World Imagery public tile endpoint with visible attribution. Review imagery licensing, tile usage, API keys/provider pricing, and offline storage rights before deploying to a larger group.
5. Scorecard yardages/handicap ranks were transcribed from public listings and have known inconsistencies across websites/tee revisions. Validate against a current Berry Creek physical scorecard. **Combo/23 yardages intentionally display as unavailable.**
6. To preserve data during testing, use the Round Menu to export your scores and green-point JSON. Clearing Safari site data or switching browsers can erase local storage.

## Open in an iPad

1. Put the included files in a **separate HTTPS static website** (e.g., separate GitHub repository with GitHub Pages, or new Render static site). Do not deploy these over the DH Game's existing files.
2. On the iPad, open the HTTPS address in Safari and rotate it into landscape.
3. Tap **Share → Add to Home Screen**, enable **Open as Web App**, then open the resulting icon. Safari's address and tab bars should be removed from the app display.
4. Tap **Players** and edit player names, then use +, – or the center score to record each golfer's score. Use Hole < and > or Next Hole to navigate.
5. Tap **My Location** to grant access to GPS. If not physically on the course, choose **Test Point** and tap a map location for a simulated testing origin.
6. Tap **Mark Green → Set CENTER / FRONT / BACK**, then tap a precise map coordinate to map the currently selected hole. A saved mapped hole shows GPS distances if a GPS or test position exists.
7. Tap **Full Map** for a map-dominant view; **Show Scores** to return to scoring.

### Quick static-server test on a computer

Run `python3 -m http.server 8000` from this directory, then open `http://localhost:8000` in a browser. Your device may not receive live GPS position when you're remote from Berry Creek; use Test Point for demo only.

## Source data for working scorecard

- Course official page: https://www.theclubatberrycreek.com/golf
- Gold tee yardages, par and stroke indexes: https://18birdies.com/golf-courses/club/8b620030-86ac-11e4-8c28-020000005b00/berry-creek-country-club
- Other tee lengths: https://www.freegolftracker.com/courses/Berry-Creek-Country-Club_12376.htm
- Clubhouse approximate location: 30.706445, -97.670818 from a public business directory (not survey-grade).
- Apple install guidance: https://support.apple.com/guide/ipad/open-as-web-app-ipad8f1f7a29/ipados

## Suggested next development phase

1. Map the 18 greens with validated front, center, and back coordinates; add tee zones and the navigable hole centerlines.
2. Show hole-focused fly-to view and carries to hazards and layups; improve GPS accuracy and test GNSS hardware in an actual cart.
3. Add selectable per-player tees, strokes/handicaps, hole pops, stableford/net scoring if desired.
4. Add real account logins, shared rounds, live multi-device sync, server backups, and an admin coordinate editor in a **separate** repository/server.
5. Review map imagery licensing, offline cache strategy, and iPad kiosk/fullscreen behaviors.
