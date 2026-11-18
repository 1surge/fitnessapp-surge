# FORGE — $0 Accounts + Feedback Spec (drop-in, no-break when unconfigured)

All free tiers below are **no credit card**. If any key is blank, the app runs 100% local as today.

## 0. Free-tier limits (exact, as shipped)

| Service | Plan | Limit | Gotcha |
|---|---|---|---|
| **Supabase Free** | $0, no card | 500 MB Postgres, 1 GB Storage, 2 GB bandwidth/mo, 50k MAU, 500k Edge Function invocations/mo | Project **pauses after 7 days idle** — open dashboard 1×/week pre-launch or it cold-starts ~30s. Pick region **eu-central-1 (Frankfurt)** or **eu-west-1 (Ireland)** at project create for GDPR. |
| **Tally Free** | $0, no card | Unlimited forms + unlimited responses, popup embed | — |
| **PostHog Cloud Free** | $0, no card | 1M events/mo free, 5k replays/mo | We cap client to **20 events/day/browser** so you never approach it. Scrub PII before send. |
| **Cloudflare Pages Free** | $0, no card | Unlimited sites + bandwidth, 500 builds/mo, 100 custom domains/site | Build cmd: none (static). Output dir: `/` or `FitnessApp`. |
| **Brevo Free SMTP** (optional, for Supabase custom SMTP) | $0, no card | 300 emails/day | Use only to raise Supabase auth-email deliverability. |

## 1. Supabase Free (EU) — auth + sync, vanilla JS

### 1.1 Create project (2 min)
1. supabase.com → New project → Region: **EU Central (Frankfurt `eu-central-1`)** → Free plan.
2. Auth → Providers → Email ON. Turn OFF "Confirm email" for v1 testing, ON for public launch.
3. Auth → Age gate is **in your UI, not Supabase** (see 1.5).
4. Copy: Project URL (`https://xyz.supabase.co`) + `anon public` key. `service_role` NEVER goes in frontend.

### 1.2 SQL — run once in Supabase SQL Editor
```sql
-- Sessions: one row per user per day. Last-write-wins via updated_at.
create table if not exists workout_sessions (
  user_id uuid references auth.users(id) on delete cascade not null,
  date_key date not null,
  day_id text,
  payload jsonb not null default '{}',
  updated_at timestamptz not null default now(),
  primary key (user_id, date_key)
);

-- Sets: one row per logged set. local_key = client uuid, dedupes retries/offline replays.
create table if not exists workout_sets (
  user_id uuid references auth.users(id) on delete cascade not null,
  local_key text not null,
  date_key date not null,
  exercise_id text not null,
  w numeric,
  r numeric,
  done boolean default false,
  updated_at timestamptz not null default now(),
  primary key (user_id, local_key)
);
create index if not exists idx_sets_user_date on workout_sets (user_id, date_key);

-- RLS: user can only touch own rows. YOU MUST ENABLE THIS.
alter table workout_sessions enable row level security;
alter table workout_sets enable row level security;
drop policy if exists "own rows" on workout_sessions;
create policy "own rows" on workout_sessions for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "own rows" on workout_sets;
create policy "own rows" on workout_sets for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
```
> RLS reminder: if you can read another user's row in the Table Editor as `anon`, your policy is wrong. Test with two logins.

### 1.3 Drop-in `forge-cloud.js` — guarded, offline-safe
Save as `forge-cloud.js` next to `index.html`. Loads Supabase ESM **only when configured**. All exports no-op otherwise.

```html
<!-- paste before <script src="data.js"> : config lives in ONE place -->
<script>
window.FORGE_CONFIG = {
  SUPABASE_URL: "",        // e.g. "https://xyz.supabase.co" — leave "" = fully offline
  SUPABASE_ANON_KEY: "",
  TALLY_FORM_ID: "",       // e.g. "3xAbC123" — leave "" = feedback button hidden
  POSTHOG_KEY: "",         // e.g. "phc_..." — leave "" = no telemetry
  POSTHOG_HOST: "https://eu.i.posthog.com" // EU endpoint for GDPR
};
</script>
<script src="forge-cloud.js"></script>
```

```js
/* forge-cloud.js — guarded Supabase auth+sync. No-ops when unconfigured. */
(function(){
  const cfg = window.FORGE_CONFIG || {};
  const ON = !!(cfg.SUPABASE_URL && cfg.SUPABASE_ANON_KEY);
  let sb = null, user = null, syncTimer = null;
  const LS_KEY = 'forge.v1';

  window.Cloud = {
    get enabled(){ return ON; },
    get user(){ return user; },
    async init(){ if(!ON) return null;
      try{
        const { createClient } = await import('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm');
        sb = createClient(cfg.SUPABASE_URL, cfg.SUPABASE_ANON_KEY);
        const { data } = await sb.auth.getSession();
        user = data.session ? data.session.user : null;
        sb.auth.onAuthStateChange((_e, s)=>{ user = s ? s.user : null; if(typeof render==='function') render(); });
        if(user) pull();
        return user;
      }catch(e){ console.warn('[cloud] offline, local-only', e); return null; }
    },
    async signup(email,pw){ must(); const {error} = await sb.auth.signUp({email,password:pw}); if(error) throw error; },
    async login(email,pw){ must(); const {error} = await sb.auth.signInWithPassword({email,password:pw}); if(error) throw error; pull(); },
    async logout(){ if(!sb) return; await sb.auth.signOut(); user=null; },
    scheduleSync(){ if(!ON||!user) return; clearTimeout(syncTimer); syncTimer=setTimeout(push, 2500); },
    push, pull,
    async deleteAccountData(){
      // Deletes WORKOUT data only. Auth-user deletion needs a server call (see 1.6).
      must(); if(!confirm('Delete all synced workouts from your account? Local data stays.')) return;
      await sb.from('workout_sets').delete().eq('user_id', user.id);
      await sb.from('workout_sessions').delete().eq('user_id', user.id);
    }
  };
  function must(){ if(!sb) throw new Error('Cloud not configured — app still works offline.'); }

  // Push: sessions upsert (last-write-wins) + sets upsert (local_key dedupe)
  async function push(){
    if(!sb||!user) return;
    try{
      const S = JSON.parse(localStorage.getItem(LS_KEY)||'{"sessions":{}}');
      const rows = Object.entries(S.sessions||{}).map(([dateKey,s])=>({
        user_id:user.id, date_key:dateKey, day_id:s.dayId||null,
        payload:{ entries:s.entries||{}, feel:s.feel||null, notes:(s.notes||'').slice(0,2000),
                  startedAt:s.startedAt||null, endedAt:s.endedAt||null, watch:s.watch||null },
        updated_at:new Date().toISOString()
      }));
      if(rows.length) await sb.from('workout_sessions').upsert(rows, {onConflict:'user_id,date_key'});
      // Flatten done sets with stable local_key: date|ex|idx
      const sets=[];
      for(const [dateKey,s] of Object.entries(S.sessions||{}))
        for(const [exId,en] of Object.entries(s.entries||{}))
          (en.sets||[]).forEach((st,i)=>{ if(st.done&&(st.w||st.r))
            sets.push({user_id:user.id, local_key:`${dateKey}|${exId}|${i}`, date_key:dateKey,
              exercise_id:exId, w:parseFloat(st.w)||null, r:parseFloat(st.r)||null,
              done:true, updated_at:new Date().toISOString()}); });
      for(let i=0;i<sets.length;i+=200){
        const {error} = await sb.from('workout_sets').upsert(sets.slice(i,i+200), {onConflict:'user_id,local_key'});
        if(error) throw error;
      }
    }catch(e){ console.warn('[cloud] push deferred', e); }
  }
  // Pull: server wins only if newer (updated_at). Never wipes local when offline.
  async function pull(){
    if(!sb||!user) return;
    try{
      const {data, error} = await sb.from('workout_sessions').select('*');
      if(error) throw error;
      const raw = localStorage.getItem(LS_KEY); const S = raw?JSON.parse(raw):{sessions:{}};
      S.sessions = S.sessions||{};
      (data||[]).forEach(r=>{
        const k = (typeof r.date_key==='string')?r.date_key.slice(0,10):r.date_key;
        const local = S.sessions[k];
        if(!local || !local._syncedAt || new Date(r.updated_at) > new Date(local._syncedAt)){
          S.sessions[k] = Object.assign({}, local||{}, r.payload||{}, {dayId:r.day_id, _syncedAt:r.updated_at});
        }
      });
      localStorage.setItem(LS_KEY, JSON.stringify(S));
      if(typeof render==='function') render();
    }catch(e){ console.warn('[cloud] pull deferred', e); }
  }
  // Auto-init (safe: no-ops when blank)
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',()=>window.Cloud.init());
  else window.Cloud.init();
})();
```

Wire-in (2 lines, in your existing code):
```js
// in save(): after localStorage.setItem(...) add:
if(window.Cloud) window.Cloud.scheduleSync();
// in boot: after render(); add:
if(window.Cloud) window.Cloud.init();
```

### 1.4 Settings account UI — paste inside `viewSettings()` before Backup card
```js
// Account card HTML (insert into viewSettings template):
const acct = (window.Cloud && window.Cloud.enabled)
 ? (window.Cloud.user
   ? `<div class="card"><div class="tiny dim">Account</div>
      <p class="small muted mt8">Signed in as <b>${esc(window.Cloud.user.email)}</b>. Workouts sync when online; offline always works.</p>
      <div class="grid2 mt12"><button class="btn ghost" data-act="acct-logout">Sign out</button>
      <button class="btn ghost danger" data-act="acct-delete">Delete cloud data</button></div></div>`
   : `<div class="card"><div class="tiny dim">Account (optional)</div>
      <p class="small muted mt8">Sync workouts across devices. Must be <b>13+</b>. No account needed — app works fully offline.</p>
      <div class="stack mt12">
        <label class="small muted">Email<input id="acct-email" type="email" autocomplete="email" class="mt8"></label>
        <label class="small muted">Password (min 8 chars)<input id="acct-pw" type="password" autocomplete="new-password" class="mt8"></label>
        <label class="small muted"><input id="acct-age" type="checkbox" style="width:auto"> I confirm I am 13 or older</label>
        <div class="grid2"><button class="btn primary" data-act="acct-login">Log in</button>
        <button class="btn ghost" data-act="acct-signup">Sign up</button></div>
        <div class="small dim">Health data is special-category under GDPR — we store only sets you log, exportable/deletable in Settings.</div>
      </div></div>`)
 : ``; // unconfigured → no card, zero breakage
```
```js
// Actions — add to your existing data-act switch:
case 'acct-signup': {
  if(!document.getElementById('acct-age').checked){ toast('You must confirm you are 13+'); break; }
  const em=document.getElementById('acct-email').value.trim(), pw=document.getElementById('acct-pw').value;
  if(pw.length<8){ toast('Password must be 8+ characters'); break; }
  try{ await window.Cloud.signup(em,pw); toast('Check email to confirm, then log in'); render(); }catch(e){ toast(e.message); } break; }
case 'acct-login': {
  const em=document.getElementById('acct-email').value.trim(), pw=document.getElementById('acct-pw').value;
  try{ await window.Cloud.login(em,pw); toast('Signed in — syncing'); render(); }catch(e){ toast(e.message); } break; }
case 'acct-logout': await window.Cloud.logout(); render(); toast('Signed out — local data kept'); break;
case 'acct-delete': await window.Cloud.deleteAccountData(); toast('Cloud workouts deleted'); break;
```

### 1.5 Custom SMTP + age gate + delete-account notes
- **Custom SMTP (free, no card):** Supabase Dashboard → Auth → SMTP → Brevo (brevo.com, free 300/day): `smtp-relay.brevo.com:587` + API key. Sender: `noreply@yourdomain` (Cloudflare Email Routing can forward). Without this, Supabase's shared sender is rate-limited and may land in spam — fine for testing, set before public launch.
- **Age gate:** checkbox above + `onboarded` block for under-13: never create an account, keep local-only, and show "Ask a parent/guardian". Required for COPPA/GDPR-Kids (13+ only, no under-13 accounts).
- **Delete account (GDPR right-to-erasure):** client code above deletes workout rows. Full `auth.users` deletion needs a server key — free options: (a) Supabase Dashboard → Users → Delete (manual, fine at small scale), or (b) free Edge Function with `service_role` that calls `auth.admin.deleteUser`. Document response SLA: "within 30 days, email [owner email]".

## 2. Free feedback / bug stack

### 2.1 Floating button + Tally popup + 14-day prompt rule (drop-in)
```html
<!-- paste before </body>. All no-ops when TALLY_FORM_ID is blank. -->
<button id="fb-btn" hidden aria-label="Send feedback"
 style="position:fixed;right:16px;bottom:84px;z-index:60;background:#C8F751;color:#0A0B0A;font-weight:700;border-radius:999px;padding:12px 16px;box-shadow:0 4px 20px rgba(0,0,0,.4)">💬 Feedback</button>
<script>
(function(){
  const id = (window.FORGE_CONFIG||{}).TALLY_FORM_ID;
  const btn = document.getElementById('fb-btn');
  if(!id) return; // unconfigured → hidden, zero breakage
  btn.hidden = false;
  btn.onclick = ()=>{
    // Tally popup embed; type=bug/feature chosen INSIDE the form (dropdown)
    const w=520,h=640,l=(screen.width-w)/2,t=(screen.height-h)/2;
    window.open(`https://tally.so/r/${id}?app=forge&v=1`,'forge-feedback',`width=${w},height=${h},left=${l},top=${t}`);
    try{localStorage.setItem('forge.fb.last',Date.now());}catch(e){}
    if(window.PH) window.PH('feedback_opened');
  };
  // 1-prompt-per-14-days: gentle nudge only, never blocking, never with screenshot
  try{
    const last = +(localStorage.getItem('forge.fb.last')||0);
    const sessions = Object.keys(JSON.parse(localStorage.getItem('forge.v1')||'{"sessions":{}}').sessions||{}).length;
    if(!last && sessions>=5 && Date.now()-last > 14*864e5){
      setTimeout(()=>{ if(confirm('Enjoying FORGE? Got 30 seconds to suggest one improvement?')) btn.click(); }, 2500);
    }
  }catch(e){}
})();
</script>
```
Tally form fields (create at tally.so, free unlimited): `Type [bug|feature|confusing]`, `What happened? (textarea)`, `Which screen? (Today/Week/Exercises/Progress/Settings)`, `Email (optional)`. Rule: **never screenshot `<input>` values** (weights are health data) — screenshots of layout only, inputs masked.

### 2.2 PostHog error hook — PII-scrubbed, 20/day cap, EU host
```html
<script>
/* paste before </body>. No-op when POSTHOG_KEY blank. */
window.PH = function(ev, props){
  try{
    const cfg = window.FORGE_CONFIG||{}; if(!cfg.POSTHOG_KEY) return;
    const cap = JSON.parse(localStorage.getItem('forge.ph.cap')||'{"d":"","n":0}');
    const today = new Date().toISOString().slice(0,10);
    if(cap.d!==today){ cap.d=today; cap.n=0; }
    if(cap.n>=20) return; cap.n++; localStorage.setItem('forge.ph.cap',JSON.stringify(cap));
    // Scrub: drop emails, names, weights/notes free-text
    const clean = {}; for(const [k,v] of Object.entries(props||{}))
      if(!/email|name|note|weight|why/i.test(k)) clean[k]=String(v).slice(0,200);
    navigator.sendBeacon?.(cfg.POSTHOG_HOST+'/e/', new Blob([JSON.stringify({event:ev,props:clean})],{type:'application/json'}));
  }catch(e){}
};
window.addEventListener('error', e=>window.PH('js_error',{screen:location.hash, msg:String(e.message||'').slice(0,200)}));
window.addEventListener('unhandledrejection', e=>window.PH('js_error',{screen:location.hash, msg:String(e.reason||'').slice(0,200)}));
</script>
```
Full PostHog SDK is optional; the beacon above is enough for v1 error counts. If you add `posthog-js`, init with `opt_out_capturing_by_default:true`, `persistence:'localStorage'`, host `https://eu.i.posthog.com`, and never capture `$snapshot`/replays on log screens.

## 3. Launch checklist

- [ ] **Favicon:** `favicon.svg` (lime dot on dark) + `<link rel="icon" href="favicon.svg">`. Free, no dependency.
- [ ] **Meta/OG:** keep `<meta name="theme-color" content="#0A0B0A">` (already present). Add:
```html
<meta name="description" content="FORGE — a free offline-first beginner training log. No account needed.">
<meta property="og:title" content="FORGE — Training Log">
<meta property="og:description" content="Five days a week. Every muscle. Twice. Free, offline-first.">
<meta property="og:type" content="website">
```
- [ ] **Offline note:** Settings → About already says local-first. Add one line on first load if `!navigator.onLine`: "You're offline — everything still works, sync resumes later."
- [ ] **Backup:** Export JSON exists — add quarterly reminder via the 14-day prompt slot (`forge.backup.last`).
- [ ] **Privacy one-pager** (`privacy.html`, link from Settings → About):
> FORGE stores workouts in your browser (localStorage). Accounts are optional, 13+. If you sign in, we store your email + logged sets in Supabase EU (Frankfurt) to sync devices. We never sell data, never show ads, never track under-13s. Health data: only what you log. Rights: export (Settings → Export JSON) and delete (Settings → Delete cloud data + Erase all data) anytime. Contact: [owner email]. Deletion requests answered within 30 days.
- [ ] **Hosting pick: Cloudflare Pages.** Why: $0 no-card, unlimited bandwidth (vs Netlify 100 GB/mo, Vercel 100 GB/mo + 12s serverless cap you don't need), 500 builds/mo, EU edge by default, drag-drop or `git push` deploy, free HTTPS + custom domain. Deploy: Pages → Upload `FitnessApp/` folder (or connect repo), Build output: `/`, no build command. Add `privacy.html` + `favicon.svg` to same folder.

## 4. What to configure when (keeps $0 + shippable at every step)
1. Ship static app on Cloudflare Pages today (no keys — everything no-ops).
2. Add `TALLY_FORM_ID` → feedback live, still no backend.
3. Add Supabase URL+anon key → accounts live. Set SMTP + RLS before sharing link publicly.
