import { useState } from 'react'; import { Plus, Save, Trash2 } from 'lucide-react'; import * as S from '../../services/connectService'; import { TagInput } from './ui';
const LV = ['', 'Beginner', 'Basic', 'Working', 'Strong', 'Expert']; const TRAITS = [['neuroticism', 'Emotional reactivity'], ['extraversion', 'Extraversion'], ['openness', 'Openness to ideas'], ['agreeableness', 'Agreeableness'], ['conscientiousness', 'Conscientiousness']];
const Sec = ({ t, hint, children }) => <section className="rounded-2xl bg-card p-5"><h3 className="font-semibold">{t}</h3>{hint && <p className="mb-3 text-sm text-slate-400">{hint}</p>}{children}</section>;
export default function ProfileTab({ me, onSaved, skills, onboarding }) {
  const p = me.profile, sg = me.suggestion || {};
  const [cur, setCur] = useState(p?.currentSkills || sg.currentSkills || []); const [learn, setLearn] = useState(p?.learningSkills || []); const [teach, setTeach] = useState(p?.canTeach || []);
  const [goal, setGoal] = useState(p?.careerGoal || ''); const [bio, setBio] = useState(p?.bio || ''); const [pc, setPc] = useState(p?.privateChat ?? true); const [pr, setPr] = useState(p?.publicReply ?? true);
  const [pers, setPers] = useState(p?.personality || Object.fromEntries(TRAITS.map(([k]) => [k, 50]))); const [nw, setNw] = useState('');
  const [busy, setBusy] = useState(false); const [err, setErr] = useState(''); const [ok, setOk] = useState(false);
  const all = [...new Set([...(skills.market || []), ...(skills.community || [])])];
  const add = () => { const v = nw.trim(); if (v && !cur.some(x => x.name.toLowerCase() === v.toLowerCase()) && cur.length < 30) setCur([...cur, { name: v, level: 3 }]); setNw(''); };
  const save = async e => {
    e.preventDefault(); setBusy(true); setErr(''); setOk(false);
    try { const r = await S.saveMe({ current: cur, learning: learn, canTeach: teach, careerGoal: goal, bio, privateChat: pc, publicReply: pr, personality: pers }); setOk(true); onSaved({ profile: r, suggestion: null }); }
    catch (x) { setErr(x.response?.data?.code === 'VALIDATION_ERROR' ? 'Please check the fields: skill names and text are too long or missing.' : S.errMsg(x)); } finally { setBusy(false); } };
  return (<form onSubmit={save} className="mx-auto max-w-3xl space-y-4">
    {onboarding && <div className="rounded-2xl border border-cyan-400/30 bg-cyan-400/5 p-5"><h2 className="text-xl font-semibold">Set up your Skill Connect profile</h2>
      <p className="mt-1 text-sm text-slate-300">We matched the skills from your account where we could. Tell us what you want to learn and what you can teach, and we will rank the people who fit you best.</p></div>}
    <Sec t="Skills you have" hint="Rate each one from 1 to 5. Others see this and it feeds the level score.">
      <div className="space-y-2">{cur.map((s, i) => (<div key={s.name} className="flex items-center gap-2"><span className="flex-1 rounded-xl bg-white/5 px-3 py-2 text-sm">{s.name}</span>
        <select className="input !w-36" value={s.level} onChange={e => setCur(cur.map((x, j) => j === i ? { ...x, level: +e.target.value } : x))}>{[1, 2, 3, 4, 5].map(n => <option key={n} value={n}>{n} · {LV[n]}</option>)}</select>
        <button type="button" aria-label="Remove skill" onClick={() => setCur(cur.filter((_, j) => j !== i))} className="text-slate-500 hover:text-red-300"><Trash2 size={16}/></button></div>))}
        {cur.length === 0 && <p className="text-sm text-slate-500">No skills yet. Add your first one below.</p>}</div>
      <div className="mt-3 flex gap-2"><input className="input" list="dl-cur" value={nw} maxLength={40} placeholder="Add a skill, e.g. Python" onChange={e => setNw(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); add(); } }}/>
        <datalist id="dl-cur">{all.slice(0, 100).map(s => <option key={s} value={s}/>)}</datalist><button type="button" className="btn inline-flex items-center gap-1" onClick={add}><Plus size={16}/> Add</button></div></Sec>
    <Sec t="Skills you want to learn" hint="Matching looks for people who have or teach these."><TagInput id="learn" value={learn} onChange={setLearn} suggestions={all} placeholder="Type a skill and press Enter"/></Sec>
    <Sec t="Skills you can teach" hint="Shown to people who want to learn them."><TagInput id="teach" value={teach} onChange={setTeach} suggestions={all} placeholder="Type a skill and press Enter"/>
      {teach.length === 0 && cur.length > 0 && <button type="button" className="mt-2 text-sm text-cyan-300 underline" onClick={() => setTeach(cur.filter(s => s.level >= 4).map(s => s.name))}>Use my skills rated 4 or 5</button>}</Sec>
    <Sec t="About you"><div className="space-y-3"><div><label className="mb-1 block text-sm text-slate-400">Career goal</label><input className="input" maxLength={80} value={goal} onChange={e => setGoal(e.target.value)} placeholder="e.g. Data Scientist"/></div>
      <div><label className="mb-1 block text-sm text-slate-400">Short bio</label><textarea className="input min-h-[80px]" maxLength={400} value={bio} onChange={e => setBio(e.target.value)} placeholder="What are you working on?"/></div></div></Sec>
    <Sec t="Personality (optional)" hint="Used for 15% of the match score, so people with a similar working style rank higher. Leave it at 50 if unsure.">
      <div className="grid gap-3 sm:grid-cols-2">{TRAITS.map(([k, l]) => (<label key={k} className="text-sm text-slate-300"><div className="flex justify-between"><span>{l}</span><span className="text-slate-500">{pers[k]}</span></div>
        <input type="range" min="0" max="100" value={pers[k]} onChange={e => setPers({ ...pers, [k]: +e.target.value })} className="w-full accent-cyan-400"/></label>))}</div></Sec>
    <Sec t="Privacy"><label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={pc} onChange={e => setPc(e.target.checked)} className="accent-cyan-400"/> Allow private messages from my connections</label>
      <label className="mt-2 flex items-center gap-2 text-sm"><input type="checkbox" checked={pr} onChange={e => setPr(e.target.checked)} className="accent-cyan-400"/> Allow public replies on my posts</label></Sec>
    {err && <p className="text-sm text-red-300">{err}</p>}{ok && <p className="text-sm text-emerald-300">Profile saved.</p>}
    <button disabled={busy} className="btn inline-flex items-center gap-2"><Save size={16}/> {onboarding ? 'Save and find my matches' : 'Save profile'}</button></form>);
}
