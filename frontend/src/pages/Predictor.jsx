import { useEffect, useState } from 'react'; import { motion } from 'framer-motion'; import { market, predict } from '../services/dataService';
import { Notice, Spinner } from '../components/States'; import CountUp from '../components/CountUp'; import { useAuth } from '../context/AuthContext';
export default function Predictor() {
  const { user } = useAuth(); const [m, setM] = useState(null); const [tab, setTab] = useState('junior'); const [vals, setVals] = useState({}); const [res, setRes] = useState(null); const [err, setErr] = useState('');
  const rec = user.role === 'RECRUITER'; const model = m && m[tab];
  useEffect(() => { market().then(setM).catch(() => setErr('Could not load the model')); }, []);
  useEffect(() => { if (!model) return; setRes(null); setVals(Object.fromEntries(model.features.map(f => [f.key, f.mean]))); }, [tab, m]);
  useEffect(() => { if (!model || !Object.keys(vals).length) return; const t = setTimeout(() => predict(tab, vals).then(r => { setRes(r); setErr(''); }).catch(e => setErr(e.response?.data?.message || 'Prediction failed')), 250); return () => clearTimeout(t); }, [vals]);
  if (err && !m) return <Notice title="Something went wrong" text={err}/>; if (!m) return <Spinner/>;
  const junior = tab === 'junior', max = Math.max(0.01, ...(res?.drivers || []).map(d => Math.abs(d.impact)));
  return (<div className="space-y-6"><h1 className="text-2xl font-semibold">{rec ? 'Talent Screener' : 'Skill Lab'}</h1>
    <p className="text-sm text-slate-400">{rec ? 'Enter a candidate\'s scores to estimate their outcome.' : 'Move the sliders to your own scores to see your estimated chances and the fastest way to improve them.'} Models are trained on the hackathon data and are indicative only.</p>
    <div className="flex gap-2">{[['junior', 'Junior skills → salary hike'], ['senior', 'Senior traits → success']].map(([k, t]) => <button key={k} onClick={() => setTab(k)} className={`rounded-full border px-4 py-1.5 text-sm ${tab === k ? 'border-cyan-400 bg-cyan-400/15 text-cyan-200' : 'border-white/10 text-slate-400'}`}>{t}</button>)}</div>
    <div className="grid gap-6 md:grid-cols-2"><div className="space-y-4 rounded-2xl bg-card p-5">
      {model.features.map(f => (<label key={f.key} className="block text-sm"><div className="mb-1 flex justify-between"><span>{f.label} <span className="text-xs text-slate-500">(high performers avg {f.high})</span></span><b>{Number(vals[f.key] ?? f.mean).toFixed(junior ? 1 : 0)}</b></div>
        <input type="range" min={model.min} max={model.max} step={junior ? 0.1 : 1} value={vals[f.key] ?? f.mean} onChange={e => setVals({ ...vals, [f.key]: +e.target.value })} className="w-full accent-cyan-400"/></label>))}</div>
    <div className="space-y-4">{res ? (<motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4"><div className="rounded-2xl bg-card p-5 text-center"><div className="text-sm text-slate-400">{junior ? 'Chance of a HIGH salary hike' : 'Chance of HIGH success'}</div>
      <div className="text-5xl font-semibold text-cyan-300"><CountUp to={res.probability} decimals={1} suffix="%"/></div>
      <div className="text-xs text-slate-500">Cross-validated accuracy {Math.round(res.metrics.cvAccuracy * 100)}% · AUC {res.metrics.cvAUC} · n={res.metrics.n}</div></div>
      <div className="rounded-2xl bg-card p-5"><h2 className="mb-2 text-sm font-semibold">What is driving it</h2>{res.drivers.map(d => (<div key={d.key} className="mb-2 text-xs"><div className="flex justify-between"><span>{d.label}</span><span className={d.impact >= 0 ? 'text-emerald-300' : 'text-red-300'}>{d.impact >= 0 ? '+' : ''}{d.impact}</span></div>
        <div className="h-1.5 rounded bg-white/10"><div className={`h-1.5 rounded ${d.impact >= 0 ? 'bg-emerald-400' : 'bg-red-400'}`} style={{ width: `${(Math.abs(d.impact) / max) * 100}%`, transition: 'width .4s' }}/></div></div>))}</div>
      {res.bestLever && <div className="rounded-2xl border border-cyan-400/30 bg-card p-4 text-sm">Best lever: raise <b>{res.bestLever.label}</b> by {res.bestLever.delta} → chance becomes <b className="text-cyan-300">{res.bestLever.newProbability}%</b>.</div>}</motion.div>)
      : <Spinner/>}{err && <p className="text-sm text-red-400">{err}</p>}</div></div></div>);
}
