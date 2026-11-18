# SURGE — gym log, local-first

A single-folder training log for the gym: what to do today, video for every lift, and logging that works one-handed with a phone in a noisy gym.

No accounts. No server. No build step. Open `index.html` and it runs — workout data lives in your browser's local storage on *this* device, and Export JSON is your backup.

> I'm still shipping this, so expect roughness. It's usable today; a few areas are mid-refactor. What's honest about state is in [Limitations](#limitations) below.

## Run it

Double-click **`index.html`** — works from disk as-is.

If you want it served (tidier for localhost testing, or to reach it from your phone on the same Wi-Fi):

```bash
start.bat        # serves on http://localhost:8778/index.html
```

Videos need internet. Everything else is offline.

## What's in it

- **Today** — today's session with a checklist, set logging, rest timer, and a running clock. The only screen you need at the gym.
- **Week** — the Mon–Fri plan behind it.
- **Exercises** — 124 exercises, searchable/filterable, each with 2 verified YouTube demos, setup steps, form cues, beginner mistakes, breathing, an easier version, and a safety note. Plus 28 stretches.
- **Progress** — sessions, sets, hours, weekly consistency, per-exercise strength lines, muscle-group freshness, full history.
- **Learn** — 12 topics: nutrition, recovery, sleep, overtraining, how muscle adapts. Written for a teenager who lifts.
- **Apple Watch** — what actually works (and what doesn't) with a web page. See below.

## The program

Five days: three full-body strength days (A / B / C) and two recovery days (R1 / R2).

- Every major muscle group (chest, back, shoulders, arms, quads, hamstrings, glutes, calves, core) is trained ≥ twice a week.
- No 1RM testing, no training to failure, no supplements.
- Technique and gradual progression over max effort — a coach's eye on new lifts before load is part of the deal.

## Your data

Stored in your browser's local storage for this site. It saves on every tap — closing the tab mid-set loses nothing.

- **Back up:** Settings → Export JSON. Do this occasionally.
- **Restore:** Settings → Import JSON.
- ⚠️ **Clearing browser data for this site erases your history.** The export is the safety net.

## Apple Watch

A web page can't read HealthKit — that's an Apple platform rule. What works today:

1. Start **Functional Strength Training** on the watch when you start here.
2. Log sets here (weight + reps — the watch can't know those).
3. After the session, add duration / avg HR / calories on the Today screen, or import a **Health Auto Export** JSON on the Apple Watch page.

Deeper integration (structured workouts pushed to the watch, automatic sync) needs a native iOS app using HealthKit + WorkoutKit. The in-app page spells out exactly what that would take.

## Config (optional cloud)

Two cloud hooks exist but are **off by default** — the app works fully without them:

- **`forge-cloud.js` / `surge-cloud.js`** — guarded Supabase sync. Set `window.SURGE_CONFIG = { SUPABASE_URL, SUPABASE_ANON_KEY }` before the script loads to enable. Empty string = local-only.
- **PostHog** (`window.FEEDBACK`) — analytics + feedback, also empty by default.

Nothing is sent anywhere until you fill those in.

## Check the data

`test_app.py` validates `data.js`: every program slot points at a real exercise, every exercise has 2 videos, alt-targets resolve, all muscle groups are covered.

```bash
python test_app.py            # structural check, fast
python test_app.py --videos   # + re-verify all 248 YouTube links
```

`data.js` is generated from the build scripts (edit source, re-run the builder, don't hand-edit the output file).

## Layout

```
index.html          # main app (SURGE v1.1.x)
surge-v2.html       # v2 in progress, beside v1
data.js             # exercise + program + learn data (generated)
forge-cloud.js       # Supabase sync (guarded, optional)
surge-cloud.js       # same, for v2
surge-plate.svg     # logo artwork
manifest.webmanifest # PWA manifest
start.bat           # localhost server
test_app.py         # structural self-check
PRODUCT.md          # product spec
```

`PRODUCT.md` and `PRO-CHECKLIST.md` (and their history) are product docs — kept for reference, not shipped in the app.

## Limitations

Honest state, no polish:

- **Single-device storage.** localStorage only, exported by hand. No cross-device sync until you flip on the Supabase config.
- **Two versions side-by-side.** `index.html` (v1, default) and `surge-v2.html` (v2 WIP). They share `data.js`. Pick one; don't expect them to be fully in sync yet.
- **No PWA offline cache yet.** First load needs connection for fonts + videos; after that it's offline.
- **YouTube embeds are external.** Videos are YouTube, served by YouTube. If one disappears, the exercise still shows its text — the link check flags it.
- **No accounts, no social, no sharing.** By design.
- **Backups are manual.** Export JSON regularly.

## History

Known iterations: v0 Forge (local helper) → v1 SURGE (current default) → v2 in progress. `README.stale-FORGE.bak.md` is the old Forge README, kept as a snapshot — delete it once v2 lands.
