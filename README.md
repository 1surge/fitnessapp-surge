# SURGE — gym log, local-first

Single-folder training log. It shows today's session, has video for each lift and the set logging is meant to work one-handed in a noisy gym.

No accounts. No server unless you want one (see Hosting below). No build step. Open `index.html` and it runs off the disk. History sits in your browser's local storage on this device. Export JSON is how you back it up.

## Run it

Double-click `index.html`. It works straight off the disk.

Want it on a local address instead? Run `start.bat` — it serves on port 8778 and opens the browser.

Videos need internet. The rest works offline once you've loaded the page once.

## What's in it

## Hosting — free, on the web

Two free ways to put it on a URL. Both serve the same folder.

### surge.sh (already live here)

Live site: **https://surgefitness.surge.sh**

**First time:**
1. In a terminal: `npm i -g surge`
2. Run `surge` and sign in (free account). The first publish claims the domain.
3. `cd` into the folder that has `index.html` (the repo root).
4. `surge . surgefitness.surge.sh`

Done. Open that URL on your phone, then Share → Add to Home Screen.

**Every update after that:**
```bash
git add . && git commit -m "what changed" && git push
surge . surgefitness.surge.sh
```
Same domain, same folder. Surge swaps in the new version.

**Letting an agent or CI publish for you:**
```bash
surge tokens add --domain "surgefitness.surge.sh" -m "agent"
```
Copy the token it prints. Anyone with that token can publish to that domain and nothing else on your account. Delete it any time with `surge tokens rem`. Surge's agent guide is at surge.sh/docs/agents.

### GitHub Pages

Live URL will be **https://1surge.github.io/fitnessapp-surge/**

1. Make the repo public first — Pages needs it on the free plan:
   ```bash
   gh repo edit 1surge/fitnessapp-surge --visibility public --accept-visibility-change-consequences
   ```
2. Turn it on in the browser: repo page → Settings → Pages → Source: Deploy from a branch → main, `/ (root)` → Save. There's no API call for this on the free plan, so it stays a click.
3. Push changes and Pages republishes in about a minute.

`manifest.webmanifest` is already in the root, so Add to Home Screen works from there too.

## What's in it

- **Today:** the session. A lane view with the plan in order, set logging, rest timer, running clock. This is the screen you actually use at the gym.
- **Library:** 124 lifts and 28 stretches. Every lift has 2 YouTube demos, setup steps, form cues, common mistakes, breathing, an easier version and a safety note. Search and filter by muscle.
- **Progress:** sessions, sets, training time, weekly consistency, best set per lift, full history.
- **You:** units (LB/KG), what equipment your gym has (anything missing gets swapped for a stand-in), light mode, and where the log lives — on this device, or a folder you pick in Drive/OneDrive/iCloud that syncs itself.
- **Learn:** 12 short topics — protein, carbs and fats, eating enough, hydration, snacks, recovery, sleep, fatigue, how muscle grows, technique, progressive overload, training safely.

## The program

Five days. Three strength days (A / B / C) and two recovery days (R1 / R2).

- Every major group gets trained at least twice a week.
- No 1RM testing, no training to failure, no supplements.
- Technique and gradual progression over max effort. A coach should eyeball new lifts before you load them.

## Your data

It saves in your browser on every tap, so closing the tab mid-set loses nothing.

- Back up: You → Send a copy (emails the file anywhere).
- Bring it back: You → Open a saved log.
- Wipe browser data for the site and the local log goes with it. The export is the backup.

Optional cloud: You → "My own folder" lets you pick a folder in Drive, OneDrive or iCloud. The log saves there as `surge-log.json` after every change. That works in desktop browsers; Safari falls back to the file buttons.

## Check the data

`test_app.py` verifies programs, alternates, coverage and counts. Run it before you push.

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

Thumbnails and fonts live in `assets-v2/` and are generated locally, so they're gitignored. If you clone this repo fresh the app still works — it falls back to YouTube thumbnail URLs — but for full offline use you need that folder too. The deploy folder `netlify-drop/` is a prebuilt copy for uploading; it isn't tracked either.

## History

Started as Forge, became SURGE. The current build is the one live at the URLs above. The old Forge README is in git history.
