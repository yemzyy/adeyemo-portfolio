# Video recovery review

CANVA PLAYER RECOVERY — MITIGATION, NOT A VERIFIED FREEZE FIX

The intermittent frozen-picture/moving-indicator report has not been reproduced.
Video 01 started normally during inspection; its actual HTML video time advanced,
readyState was 4 and data was buffered. This does not diagnose another browser/device.
The affected video number and browser/device are still needed for a matching test.

Changes:
- Added a small reload icon beside each video/vlog title. It restarts only that Canva
  player, without refreshing the whole site or switching its provider. The visitor
  then uses Canva's own Play control. There is no automatic retry loop.
- Reload removes the old iframe and clears its load timer before making the new frame.
  It does not restart neighbouring videos or discard the rest of the page.
- Decorative background canvas drawing stops while a Canva/native player is focused
  and resumes when interaction returns to the page. Its normal drawing is capped at
  30fps. This reduces competing rendering work, not Canva's internal resource usage.
- Script/style URLs are versioned to avoid accidentally running a stale cached version.
- Canva remains primary; Cloudinary remains the existing best-effort startup backup.
- No under-video backup labels were reintroduced. Existing cached-player protection,
  corrected links, picture backups and the silent local hero playlist are retained.

Unchanged limits:
The website cannot inspect or repair Canva's cross-origin player internals. The reload
icon is an explicit recovery action. These changes do not guarantee prevention of
freezing, detection of all Canva errors, pause-other-Canva-video or precise Canva resume.
The 30-second startup fallback is not a check of whether video frames are advancing.

Verification:
- Browser: a single click started video 01; media interaction added the rendering-pause
  state. Reload incremented only video 01's retry count, left video 02's mount count at
  one, and retained the Canva URL. No Cloudinary backup player was created.
- Syntax, unchanged video mappings, animation pause/resume and 30fps cap were checked.
- The actual intermittent freeze has not been reproduced or declared fixed.

Install:
Small update ZIP: replace index.html, script.js and styles.css in the latest complete
portfolio (the version with hero-player.js and the four local hero clips). Notes are
included. All other files remain in place. Alternatively use the complete ZIP.
Nothing has been published to GitHub.


Latest update: see THUMBNAIL-UPDATE.txt for permanent video covers and the two-player loading queue.
