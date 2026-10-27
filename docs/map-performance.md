# Map loading

Browse pages wait for Leaflet's initial viewport before requesting data. They send
`map=1&bbox=west,south,east,north` to `/parcels` and `/properties`. Subsequent moves
are debounced, with a padded area to avoid refetching on every small pan. Requests
for superseded areas are cancelled. The sidebar represents that loaded area.

Map responses include boundary/position, prices, filter fields and a cover photo.
Descriptions, contact details, amenities and photo galleries are fetched by id
when a listing or comparison is opened. Shared links resolve by id even outside
the initial viewport. Existing non-map API responses remain available to other
consumers. Deploy the backend with these changes before the frontend.

Laravel caches map summaries for 30 seconds. Listing, county and photo saves,
deletes and restores invalidate the cache after commit. Bulk SQL updates bypass
model events; their results and time-based boost expiry appear within 30 seconds
on a fresh API request. Browser query results retain their existing 60-second
freshness window. Use a shared Laravel cache store in multi-instance deployments.
No authenticated responses are cached at an edge CDN.

Plotting starts at a local approximate county-town coordinate; these points are
navigation aids, not county boundaries. Existing pins and boundaries take
precedence. Drawing JavaScript and CSS load on the first Trace boundary click.
Reverse geocoding waits 500 ms and cancels when the pin changes or the map closes.

Map code preloads on browse-link hover/focus and in the route loader. Plotting
code preloads during the preceding basic-details step. Both prepare connections
to the configured tile origins without prefetching tiles.

## Tile CDN configuration

Set `VITE_STREET_TILES_URL` to a provider's licensed HTTPS raster XYZ URL and
`VITE_STREET_TILES_ATTRIBUTION` to its required attribution HTML, then rebuild.
Any browser-visible API key must be restricted to the site's domains. The
existing OpenStreetMap endpoint remains the fallback until a provider is chosen.
The satellite endpoint is unchanged.

## Measurement

Compare the same production build, viewport and browser/network settings:

1. Use DevTools Network with cache disabled and a mobile network/CPU throttle.
2. Open `/land`, `/rentals` and `/explore`. Confirm the first feed request has
   `map=1` and `bbox`; record transferred bytes and time until the first pins.
3. Pan outside the loaded area and back rapidly. Confirm obsolete requests cancel
   and a small pan inside the loaded area needs no new request.
4. Open a listing, a shared link outside Nairobi and a comparison. Confirm that
   details load independently and the map does not jump back after another pan.
5. Open plotting for a distant county. Confirm there is no county-search request
   or drawing-tool request before Trace boundary. Move a pin rapidly and check
   that only the settled location's reverse-geocode response is used.
6. Record tile request counts while panning and zooming before experimenting with
   `keepBuffer` or `updateWhenZooming`. These retain Leaflet defaults for now.

Functional checks do not establish a measured load-time improvement. Record
before/after timings on the deployed network before claiming a percentage gain.
