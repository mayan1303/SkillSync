import { useState } from 'react'; import { Link } from 'react-router-dom'; import useDashboard from '../components/useDashboard'; import { Spinner, Notice } from '../components/States';
import ReadinessScore from '../components/ReadinessScore'; import SkillBar from '../components/SkillBar'; import StatCard from '../components/StatCard'; import InterventionCards from '../components/InterventionCards';
import { saveSkills } from '../services/authService';
function SkillEditor({ initial, onSaved }) {
  const [t, setT] = useState(initial); const [busy, setBusy] = useState(false); const [err, setErr] = useState('');
  const save = async () => { setBusy(true); setErr('');
    try { await saveSkills(t.split(',').map(s => s.trim()).filter(Boolean)); onSaved(); } catch (e) { setErr(e.response?.data?.message || 'Could not save'); } finally { setBusy(false); } };
  return (<div className="mt-4 space-y-2"><label className="text-sm text-slate-400">Edit skills (Name:level, comma separated)</label>
    <input className="input" value={t} onChange={e => setT(e.target.value)} placeholder="Python:90, Docker:40, Edge AI:20"/>
    {err && <p className="text-sm text-red-400">{err}</p>}<button className="btn" onClick={save} disabled={busy}>{busy ? 'Saving…' : 'Save skills'}</button></div>);
}
export default function StudentDashboard() {
  const { data: d, error, reload } = useDashboard('student');
  if (error) return <Notice title="Couldn't load dashboard" text={error}/>; if (!d) return <Spinner/>;
  const c = d.cards;
  return (<div className="space-y-8"><div className="flex flex-wrap items-center gap-8">
    <ReadinessScore key={d.futureReadiness} value={d.futureReadiness}/><div><h1 className="text-2xl font-semibold">Good day, {d.greetingName.split(' ')[0]} 👋</h1>
    <p className="text-slate-400">Here's your future workforce readiness.</p>
    {d.missingSkills.length > 0 && <p className="mt-2 text-sm text-slate-300">Biggest gaps: {d.missingSkills.join(', ')}</p>}</div></div>
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4"><StatCard i={0} label="Skill Strength" value={c.skillStrength} suffix="%"/><StatCard i={1} label="Industry Alignment" value={c.industryAlignment} suffix="%"/>
      <StatCard i={2} label="Adaptability" value={c.adaptability} suffix="%"/><StatCard i={3} label="Emerging Skill Exposure" value={c.emergingSkillExposure} suffix="%"/></div>
    <section className="rounded-2xl bg-card p-5"><h2 className="mb-3 font-semibold">Your skills</h2>
      {d.skills.length ? d.skills.map(s => <SkillBar key={s.name} {...s}/>) : <div className="rounded-xl bg-white/5 p-4 text-sm text-slate-300">Welcome! You have no skills yet. <Link className="text-electric underline" to="/assessment">Take your first AI assessment</Link> or add skills below to get your readiness score.</div>}
      <SkillEditor key={d.skills.map(s => s.name + s.level).join()} initial={d.skills.map(s => `${s.name}:${s.level}`).join(', ')} onSaved={reload}/></section>
    <section><h2 className="mb-3 font-semibold">Focus skill: {d.targetSkill}</h2><InterventionCards items={d.interventions}/></section></div>);
}
