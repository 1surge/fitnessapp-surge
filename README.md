# SURGE — gym log, local-first

Single-folder training log. It shows today's session, has video for each lift and the set logging is meant to work one-handed in a noisy gym.

No accounts. No server. No build step. Open `index.html` and it runs. Workout history sits in your browser's local storage on this device. Export JSON is what you do when you want a backup.

I am still working on it. It works fine for actual lifting, a couple of areas are a bit rough. I put what is not there yet under Limitations at the bottom.

## Run it

Double-click `index.html`. It works straight off the disk.

If you want a localhost server instead (`start.bat`, port 8778, opens the browser).

Videos need internet. The rest runs offline.

## What's in it

- Today: today's session with a checklist, set logging, rest timer and a running clock. The only screen I actually use at the gym.
- Week: the Mon-Fri plan behind it.
- Exercises: 124 exercises, each with 2 YouTube demos, setup steps, form cues, common mistakes, breathing, an easier version and a safety note. Searchable and filterable. Plus 28 stretches.
- Progress: sessions, sets, hours, weekly consistency, per-exercise strength lines, muscle-group freshness, full history.
- Learn: 12 short topics. Nutrition, recovery, sleep, overtraining, how muscle adapts. Written for a teenager who lifts.
- Apple Watch: what actually works with a web page, and what does not (below).

## The program

Five days. Three strength days (A / B / C) and two recovery days (R1 / R2).

- Every major group gets trained at least twice a week.
- No 1RM testing, no training to failure, no supplements.
- Technique and gradual progression over max effort. A coach should eyeball new lifts before you load them.

## Your data

localStorage for this site. It saves on every tap so closing the tab mid-set loses nothing.

- Back up: Settings > Export JSON. Do it now and then.
- Restore: Settings > Import JSON.
- Wiping browser data for this site clears your history. The export is the backup, that is it.

## Apple Watch

A web page cannot read HealthKit. That is an Apple rule, not a missing feature.

What works right now:

1. Start Functional Strength Training on the watch.
2. Log sets here (weight and reps, the watch has no way to know those).
3. After the session you can add duration / average heart rate / calories on the Today screen, or import a Health Auto Export JSON on the Apple Watch page.

Proper integration (structured workouts sent to the watch, auto sync) would need a native iOS app built on HealthKit and WorkoutKit. The Apple Watch page in the app lists what that would take.

## Config (optional cloud hooks)

Two optional integrations are in the code but off by default. The app works the same with them off.

- `forge-cloud.js` / `surge-cloud.js`: Supabase sync. Both expect `window.SURGE_CONFIG = { SUPABASE_URL, SUPABASE_ANON_KEY }` before they load. Empty strings mean local only.
- PostHog (`window.FEEDBACK`): analytics and feedback, empty by default.

Nothing leaves the machine until you fill those in.

## Check the data

`test_app.py` checks `data.js`: every program slot points at a real exercise, every exercise has 2 videos, alternates resolve, and the week covers all the muscle groups.

python test_app.py            # fast check
python test_app.py --videos   # also re-checks all 248 YouTube links

`data.js` is generated from the build scripts. Edit the source and re-run the builder instead of editing `data.js` by hand.

## Layout

index.html           # main app (SURGE v1.1.x)
surge-v2.html        # v2, still being built
data.js              # exercise + program + learn data (generated)
forge-cloud.js       # Supabase sync (guarded, optional)
surge-cloud.js       # same, for v2
surge-plate.svg      # logo artwork
manifest.webmanifest # PWA manifest
start.bat            # serves locally on 8778
test_app.py          # structural self-check
PRODUCT.md           # product spec

`PRODUCT.md` and `PRO-CHECKLIST.md` are product docs. I keep them for reference; they are not shipped in the app.

## Limitations

What is not there yet, plainly:

- Single-device storage. localStorage, exported by hand. No cross-device sync until you turn on the Supabase config.
- Two versions next to each other. `index.html` (v1, what you actually open) and `surge-v2.html` (v2 in progress). They share `data.js`. They are not fully in sync.
- No PWA offline cache yet. First load needs a connection for fonts and videos.
- Videos are YouTube. They are served by YouTube. If a link goes dead the exercise text stays and the link check catches it.
- No accounts, no social, no sharing. That is on purpose.
- Backups are manual. Export JSON regularly.

## History

Started out as Forge, a smaller local helper, then became SURGE v1 (current default). v2 is in progress. The old Forge README is gone now, it is in git history if you want it.
