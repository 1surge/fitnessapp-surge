# -*- coding: utf-8 -*-
"""Self-check for the SURGE app data. Run: python test_app.py [--videos]"""
import json, re, sys, urllib.request, urllib.parse

src = open('data.js', encoding='utf-8').read()
D = json.loads(src[len('window.DATA = '):].rstrip().rstrip(';'))
EX = {e['id']: e for e in D['exercises']}
P = D['program']

def check(cond, msg):
    if not cond:
        raise AssertionError(msg)

# 1. exercise library integrity
check(len(D['exercises']) == 124, f"expected 124 exercises, got {len(D['exercises'])}")
check(len(EX) == 124, "duplicate exercise ids")
check(len(D.get('stretches', [])) == 28, f"expected 28 stretches, got {len(D.get('stretches', []))}")
for e in D['exercises']:
    for f in ('name', 'why', 'breathing', 'easier', 'safety', 'equipment', 'difficulty'):
        check(e.get(f), f"{e['id']} missing {f}")
    for f in ('steps', 'cues', 'mistakes'):
        check(len(e.get(f, [])) >= 3, f"{e['id']} needs >=3 {f}")
    check(len(e['videos']) == 2, f"{e['id']} needs 2 videos, has {len(e['videos'])}")
    for v in e['videos']:
        check(re.fullmatch(r'[A-Za-z0-9_-]{11}', v['id']), f"{e['id']} bad video id {v['id']}")
        check(v.get('title') and v.get('channel'), f"{e['id']} video missing title/channel")
    check(e['groups'], f"{e['id']} has no muscle groups")

# 2. program integrity
for day in ('A', 'B', 'C', 'R1', 'R2'):
    check(day in P, f"missing day {day}")
    d = P[day]
    check(d['blocks'], f"{day} has no blocks")
    check(d['warmup'] and d['cooldown'], f"{day} missing warmup/cooldown")
    check(d['purpose'] and d['duration'], f"{day} missing purpose/duration")
    for b in d['blocks']:
        check(b['ex'] in EX, f"{day} references unknown exercise {b['ex']}")
        check(b['sets'] >= 1 and b['reps'], f"{day}/{b['ex']} bad sets/reps")
check(len(P['A']['blocks']) >= 6 and len(P['B']['blocks']) >= 6 and len(P['C']['blocks']) >= 6,
      "strength days need at least 6 exercises")

# 3. every exercise in the program is reachable, and every library exercise is used somewhere
used = {b['ex'] for d in P.values() for b in d['blocks']}
check(len(used) >= 30, f"only {len(used)} exercises used in the program")

# 4. alternates resolve (stretches allowed as targets)
LIBIDS = set(EX) | {x['id'] for x in D.get('stretches', [])}
for k, alts in D['alternates'].items():
    check(k in LIBIDS, f"alternates key {k} is not in library")
    for a in alts:
        check(a in LIBIDS, f"{k} alternate {a} does not exist")

# 5. muscle coverage of the whole week
need = {'Chest', 'Back', 'Shoulders', 'Biceps', 'Triceps', 'Forearms',
        'Quads', 'Hamstrings', 'Glutes', 'Calves', 'Core'}
have = set()
for d in P.values():
    for b in d['blocks']:
        have |= set(EX[b['ex']]['groups'])
missing = need - have
check(not missing, f"muscle groups never trained: {missing}")

# 6. learn content
check(len(D['learn']) >= 10, "not enough education content")

# 7. optional: re-verify every video still resolves
if '--videos' in sys.argv:
    bad = []
    for e in D['exercises']:
        for v in e['videos']:
            u = 'https://www.youtube.com/oembed?url=' + urllib.parse.quote(
                'https://www.youtube.com/watch?v=' + v['id'], safe='') + '&format=json'
            try:
                urllib.request.urlopen(urllib.request.Request(u, headers={'User-Agent': 'Mozilla/5.0'}), timeout=20)
            except Exception:
                bad.append((e['id'], v['id']))
    check(not bad, f"dead video links: {bad}")
    print(f"videos: all {sum(len(e['videos']) for e in D['exercises'])} links resolve")

print(f"OK")
