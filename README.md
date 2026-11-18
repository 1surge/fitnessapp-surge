# SURGE — gym log, local-first

Single-folder training log. It shows today's session, has video for each lift and the set logging is designed to work one-handed at a squat rack.

No accounts. No server required. No build step. Open `index.html` and it runs off the disk. History lives in the browser's local storage on that device. Export JSON backs it up.

## Run it

Double-click `index.html` and it runs from the disk.

For a local address, run `start.bat`. It serves on port 8778 and opens the browser.

Video demos stream from YouTube, so they need a connection. Everything else works offline after the first load.

## Hosting — free, on the web

Two free options. Both serve the same folder.

### surge.sh

Live site: **https://surgefitness.surge.sh**

**First publish:**
1. In a terminal: `npm i -g surge`
2. Run `surge` and sign in (free account). The first publish claims the domain.
3. `cd` into the folder that has `index.html` (the repo root).
4. `surge . surgefitness.surge.sh`

Open the URL on a phone, then Share → Add to Home Screen.

**Subsequent publishes:**
```bash
git add . && git commit -m "what changed" && git push
surge . surgefitness.surge.sh
```
The same command replaces the live site with the new version.

**Automated publishing:**
```bash
surge tokens add --domain "surgefitness.surge.sh" -m "ci"
```
The token it prints can publish to that domain only. The account can't be touched with it. Delete it with `surge tokens rem`. See surge.sh/docs/agents.

### GitHub Pages

Live URL will be **https://1surge.github.io/fitnessapp-surge/**

Requires a public repository on the free plan:
   ```bash
   gh repo edit 1surge/fitnessapp-surge --visibility public --accept-visibility-change-consequences
   ```
Then in the browser: Settings → Pages → Source: Deploy from a branch → main, `/ (root)`. Every push redeploys in about a minute.

`manifest.webmanifest` sits in the root, so Add to Home Screen works from there too.

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

`test_app.py` checks `data.js`: every program slot points at a real exercise, every exercise has 2 videos, alternates resolve, and the week covers all the muscle groups.

```bash
python test_app.py            # fast
python test_app.py --videos   # also re-checks every video link
```

## Layout

index.html            # the app. This is what you open.
data.js               # exercises, stretches, program, learn topics
test_app.py           # data self-check
PRODUCT.md            # product spec
PRO-CHECKLIST.md      # compliance checklist
start.bat             # local server on 8778
manifest.webmanifest  # PWA manifest for Add to Home Screen
assets-v2/            # fonts, thumbnails, three.js, icons (not in git — see below)
surge-v2.html         # previous build, kept for reference

`assets-v2/` (fonts, thumbnails, three.js, icons) is generated locally and gitignored. A fresh clone still runs — the app falls back to YouTube thumbnail URLs — but needs that folder for full offline use. `netlify-drop/` is a prebuilt copy for uploading and isn't tracked.

## History

Started as Forge, then became SURGE. The current build is the one live at the URLs above. The original Forge README is in git history.
