# Portfolio media and mobile update

Inspected 2 November 2026. Estimates use decimal MB (1 MB = 1,000,000 bytes) and
1 GB = 1,000 MB. Carrier accounting, caching, stream quality and browsing choices vary.
These are file-size estimates, not an end-to-end mobile data-meter capture.

## What the previous version loaded

The page did not download all 60 full gallery videos immediately. It rendered lazy
JPEG covers, then automatically mounted Canva players when cards were at least
25% visible. Two initial iframe loads ran concurrently. Once each iframe fired
load, another could begin: this limited starts, not Canva's ongoing buffering.
Scrolling through the video gallery could therefore load player scripts, images,
and some streamed video content before Play. Hidden cards were not all mounted.
The browser could lazy-load images a little ahead of the visible screen.

The hero was a separate native, silent four-clip playlist. It loaded the current
and next clip and paused offscreen/background. All four clips total 1,435,243 bytes.
The old bounded iframe cache reduced some reloads but could evict older players.
There was no app service worker or offline cache. Normal browser/host HTTP caching
applied; refreshing or returning did not guarantee zero downloads.

## Measured files: before and after

| Media | Before | Updated |
|---|---:|---:|
| All 50 graphic gallery covers | 11.343 MB | 2.647 MB |
| All 60 video/vlog covers | 1.473 MB | 1.473 MB |
| About portrait displayed on page | 3.351 MB | 0.070 MB |
| Four automatic hero MP4 clips | 1.435 MB | 1.435 MB |
| Original 50 graphic JPG files (backup only) | 69.329 MB | 69.329 MB |

Graphic covers are about 77% smaller; the portrait preview is about 98% smaller.
Original graphics are retained. A picture's full original is requested only if
its GitHub backup is used; Canva design previews have their own additional cost.
The original artwork collection is not downloaded just because it is in the ZIP.
The ZIP also retains an old 20.654 MB local video file that current gallery code
does not reference; its presence does not cause a browser download.

Other local files include approximately 0.676 MB of tool logos, 0.101 MB of client
avatars, a 0.030 MB logo, hero poster images, scripts, styles, HTML and JSON.
Google Fonts are external. Compression and caching affect actual transferred bytes.
Before the change, a complete tour of local gallery covers and page media was about
18–20 MB, plus any automatically initialized Canva embeds and external resources.

## What the update loads

- Main video and vlog grids contain lazy JPEGs and one preview button per card.
  They contain no video element or iframe and no automatic player-loading observer.
- Selecting a card creates exactly one Canva iframe in the modal. It does not
  initialize the other 59 players. Canva may begin buffering that selected video
  as soon as the preview opens, before its Play button is pressed. The parent
  website cannot impose preload=none inside Canva's cross-origin player.
- Closing the modal removes the iframe and stops its playback context. Native
  backup playback is paused and its source removed on close. An in-flight request
  can have already transferred some data. Reopening Canva may buffer again.
- Reload replaces only the selected player. The hero pauses while a video modal
  is open. It otherwise retains the requested automatic silent loop.
- Canva remains primary. Cloudinary is a best-effort startup backup for the selected
  video only: invalid/missing Canva URL, or no initial iframe load within 30 seconds.
  The timer is cancelled on iframe load or close. It cannot detect all internal
  Canva errors, permissions pages or frozen playback. Vlog 08 has no supplied backup.
  Native backup uses preload=none, then downloads when its own Play is selected.
- Stable thumbnail paths let normal browser caching reuse images after scrolling.
  No cache-busting is added to image URLs. Updated code URLs are versioned so the
  browser gets this release. GitHub Pages controls response caching headers; local
  code cannot promise a cache duration or guarantee Canva's caching behavior.

## Estimated browsing costs after this update

Assuming a fresh visit, normal fonts/resources and no design popups:

| Activity | Approximate usage | Left from 1 GB |
|---|---:|---:|
| Open landing page, no gallery playback | 2–4 MB | 996–998 MB |
| Browse all 50 graphics and the page, no design popups | 5–7 MB | 993–995 MB |
| Browse all graphics plus all 60 video/vlog covers | 6–8 MB | 992–994 MB |

Lazy loading means a short visit often downloads less. Browser load-ahead can
request offscreen covers. Opening high-resolution design previews adds Canva
resources; opening all original GitHub pictures would add up to 69.329 MB if uncached.

Actual Canva playback cannot be predicted from original file sizes alone: Canva
serves renditions and may change quality, buffer ahead, include audio, or reload
when a preview is reopened. The following are illustrative calculations, NOT a
measurement of Canva's current bitrate or a data cap:

Video MB ≈ bitrate in megabits/second × seconds watched ÷ 8.
At an assumed total bitrate of 0.5–2 Mbps:
- Three 30-second videos: about 5.6–22.5 MB of media, plus player overhead/buffering.
- Three one-minute videos: about 11.3–45 MB of media, plus player overhead/buffering.
With 6–8 MB of browsing, three short clips give a planning range around 12–35 MB
including a modest allowance for player overhead: roughly 965–988 MB left from 1 GB.
Longer clips, higher bitrates or repeated preview opens can use substantially more.
This range is illustrative, not a guaranteed ceiling.

## Actual backup file sizes checked

HEAD requests to all 59 supplied original Cloudinary URLs returned file lengths.
Total: 2,146.351 MB; average: 36.379 MB; range: 9.899–86.787 MB.
Examples: video 01 20.654 MB, video 02 42.766 MB, video 03 46.013 MB.
The first three originals total 109.433 MB. Delivering those original files in
full would use that much media data; a 7 MB page tour would leave about 883.6 MB
from 1 GB. The current MP4/q_auto fallback can deliver a different size, so these
original lengths are not exact predictions for fallback or Canva playback.
See VIDEO-SOURCE-SIZES.csv for every checked source.

## Layout and checks

One image-only card opens the selected player in a native modal dialog above a
darkened, blurred portfolio. Close and Reload stay outside the player, on the right.
The player fits the available viewport without clipping its controls. Landscape
Canva embeds get an additional 112 pixels of height for their own controls; short
portrait screens retain more player width to avoid squeezing the toolbar.
The complete original video stays contained, with letterboxing when necessary.
Canva's own icon arrangement cannot be rewritten from another website. This update
fixes the cramped card/player viewport; it does not claim control over Canva's UI.

Verified in the browser at mobile widths 390 and 320 pixels and at desktop size:
zero gallery iframes before selection; one on selection; Canva video/vlog playback;
reload leaves one player; close leaves zero players and restores the card's focus;
viewport containment; original design preview and GitHub image backup still work.
The browser preview is not a physical iPhone/Android device test. Intermittent Canva
freezing has not been reproduced or claimed fixed.

## Installation

Use the complete ZIP OR overlay the small update on your current portfolio root.
Keep all existing images and files; replace matching files, add the included asset
folders, then commit to GitHub. The full ZIP already includes the patch. Deploying
this ZIP is separate from this local verification; no live GitHub site was changed.

References:
- https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/iframe
- https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/video

Latest image preview cleanup: the backup button is removed. Missing Canva URLs or
a missing initial viewer load after 15 seconds switch to GitHub automatically. This
is not a detector for every internal Canva image failure. See IMAGE-PREVIEW-UPDATE.txt.
