/* forge-cloud.js — guarded Supabase auth+sync for SURGE. No-ops when unconfigured.
   Requires window.SURGE_CONFIG = { SUPABASE_URL, SUPABASE_ANON_KEY } set before this script.
   App fully works offline without it. */
(function(){
  const cfg = window.SURGE_CONFIG || {};
  const ON = !!(cfg.SUPABASE_URL && cfg.SUPABASE_ANON_KEY);
  let sb = null, user = null, syncTimer = null;
  const LS_KEY = 'forge.v1';

  window.Cloud = {
    get enabled(){ return ON; },
    get user(){ return user; },
    async init(){
      if(!ON) return null;
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
    async signup(email,pw){ must(); const {error} = await sb.auth.signUp({email:email, password:pw}); if(error) throw error; },
    async login(email,pw){ must(); const {error} = await sb.auth.signInWithPassword({email:email, password:pw}); if(error) throw error; pull(); },
    async logout(){ if(!sb) return; await sb.auth.signOut(); user=null; },
    scheduleSync(){ if(!ON||!user) return; clearTimeout(syncTimer); syncTimer=setTimeout(push, 2500); },
    push: push,
    pull: pull,
    async deleteAccountData(){
      must();
      if(!confirm('Delete all synced workouts from your account? Local data stays.')) return;
      await sb.from('workout_sets').delete().eq('user_id', user.id);
      await sb.from('workout_sessions').delete().eq('user_id', user.id);
    }
  };

  function must(){ if(!sb) throw new Error('Cloud not configured — app still works offline.'); }

  async function push(){
    if(!sb||!user) return;
    try{
      const S = JSON.parse(localStorage.getItem(LS_KEY)||'{"sessions":{}}');
      const rows = Object.entries(S.sessions||{}).map(function(entry){
        const dateKey = entry[0], s = entry[1];
        return {
          user_id: user.id, date_key: dateKey, day_id: s.dayId||null,
          payload: { entries: s.entries||{}, feel: s.feel||null, notes: (s.notes||'').slice(0,2000),
                     startedAt: s.startedAt||null, endedAt: s.endedAt||null, watch: s.watch||null },
          updated_at: new Date().toISOString()
        };
      });
      if(rows.length) await sb.from('workout_sessions').upsert(rows, {onConflict:'user_id,date_key'});
      const sets=[];
      for(const [dateKey,s] of Object.entries(S.sessions||{}))
        for(const [exId,en] of Object.entries(s.entries||{}))
          (en.sets||[]).forEach((st,i)=>{ if(st.done&&(st.w||st.r))
            sets.push({user_id:user.id, local_key:dateKey+'|'+exId+'|'+i, date_key:dateKey,
              exercise_id:exId, w:parseFloat(st.w)||null, r:parseFloat(st.r)||null,
              done:true, updated_at:new Date().toISOString()}); });
      for(let i=0;i<sets.length;i+=200){
        const res = await sb.from('workout_sets').upsert(sets.slice(i,i+200), {onConflict:'user_id,local_key'});
        if(res.error) throw res.error;
      }
    }catch(e){ console.warn('[cloud] push deferred', e); }
  }

  async function pull(){
    if(!sb||!user) return;
    try{
      const res = await sb.from('workout_sessions').select('*');
      if(res.error) throw res.error;
      const raw = localStorage.getItem(LS_KEY);
      const S = raw ? JSON.parse(raw) : {sessions:{}};
      S.sessions = S.sessions||{};
      (res.data||[]).forEach((r)=>{
        const k = (typeof r.date_key==='string') ? r.date_key.slice(0,10) : r.date_key;
        const local = S.sessions[k];
        if(!local || !local._syncedAt || new Date(r.updated_at) > new Date(local._syncedAt)){
          S.sessions[k] = Object.assign({}, local||{}, r.payload||{}, {dayId:r.day_id, _syncedAt:r.updated_at});
        }
      });
      localStorage.setItem(LS_KEY, JSON.stringify(S));
      if(typeof render==='function') render();
    }catch(e){ console.warn('[cloud] pull deferred', e); }
  }

  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',()=>window.Cloud.init());
  else window.Cloud.init();
})();
