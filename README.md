# SURGE — gym log, local-first

Single-folder training log. Opens on today's session, every movement has a demo video, and the set logging works one-handed at a squat rack. No accounts, no server, no build step.

## Run it

Double-click `index.html`. It runs from the disk.

For a local address, run `start.bat`. It serves on port 8778.

Videos stream from YouTube, so they need a connection. Everything else works offline after the first load.

## Hosting

GitHub Pages at **https://1surge.github.io/fitnessapp-surge/**. Push to main and it redeploys in about a minute.

`manifest.webmanifest` is in the root, so Add to Home Screen works from there too.

## What's in it

- **Today:** the session in order, with set logging, a rest timer and a running clock.
- **Library:** 124 lifts and 28 stretches. Each entry has 2 YouTube demos, setup steps, form cues, common mistakes, breathing, an easier option and a safety note. Searchable and filterable by muscle.
- **Progress:** sessions, sets, time trained, weekly consistency, best set per lift, full history.
- **You:** units (LB/KG), equipment your gym has (missing gear gets swapped for a stand-in), light mode, and where the log lives — on the device, or in a folder you pick in Drive/OneDrive/iCloud.
- **Learn:** 12 short topics covering protein, carbs and fats, eating enough, hydration, snacks, recovery, sleep, fatigue, muscle growth, technique, progressive overload and training safely.

## The program

Five days. Three strength days (A / B / C) and two recovery days (R1 / R2).

- Every major group gets trained at least twice a week.
- No 1RM testing, no training to failure, no supplements.
- Technique and gradual progression over max effort. A coach should eyeball new lifts before you load them.

## Your data

Every tap writes to the browser store, so closing the tab mid-set loses nothing.

- Back up: You → Send a copy (emails the file anywhere).
- Restore: You → Open a saved log.
- Clearing browser data for the site deletes the local log too. Keep an export.

Optional cloud: You → "My own folder" lets you pick a folder in Drive, OneDrive or iCloud. The log saves there as `surge-log.json` after every change. Works in desktop browsers; Safari falls back to the file buttons.

## Check the data

```bash
python test_app.py            # fast
python test_app.py --videos   # also re-checks every video link
```

`test_app.py` verifies programs, alternates, coverage and counts. Run it before you push.

## Layout

```
index.html            # the app. Open this.
data.js               # exercises, stretches, program, learn topics
test_app.py           # data self-check
PRODUCT.md            # product spec
PRO-CHECKLIST.md      # compliance checklist
start.bat             # local server on 8778
manifest.webmanifest  # PWA manifest for Add to Home Screen
surge-plate.svg       # logo artwork
assets-v2/            # fonts, thumbnails, three.js, icons (generated — gitignored)
```

Thumbnails and fonts are generated locally and gitignored. The app falls back to YouTube thumbnail URLs without them.

## History

Known as Forge earlier. The current build is the one live at the URL above.
