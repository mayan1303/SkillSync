import { useState } from 'react'; import { motion } from 'framer-motion'; import { simulate } from '../services/intelService'; import CountUp from '../components/CountUp';
export default function Simulator() {
  const [f, setF] = useState({ demand: 1000, supply: 300, capacity: 500, completion: 75 });
  const [r, setR] = useState(null); const [busy, setBusy] = useState(false); const [err, setErr] = useState('');
  const run = async () => { setBusy(true); setErr(''); try { setR(await simulate(f)); } catch (e) { setErr(e.response?.data?.message || 'Network error'); } finally { setBusy(false); } };
  const sl = (k, label, max, suf = '') => (<label className="block text-sm"><div className="mb-1 flex justify-between"><span>{label}</span><span className="text-slate-400">{f[k]}{suf}</span></div>
    <input type="range" min="0" max={max} value={f[k]} onChange={e => setF({ ...f, [k]: +e.target.value })} className="w-full accent-blue-500"/></label>);
  return (<div className="space-y-6"><h1 className="text-2xl font-semibold">What-If Intervention Simulator</h1>
    <div className="grid gap-6 md:grid-cols-2"><div className="space-y-4 rounded-2xl bg-card p-5">
      {sl('demand', 'Projected demand', 3000)}{sl('supply', 'Current supply', 3000)}{sl('capacity', 'Training capacity (students)', 2000)}{sl('completion', 'Completion rate', 100, '%')}
      <button className="btn w-full" onClick={run} disabled={busy}>{busy ? 'Simulating…' : 'SIMULATE'}</button>{err && <p className="text-sm text-red-400">{err}</p>}</div>
    <div className="space-y-4">{r ? (<motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
      <div className="rounded-2xl bg-red-500/10 p-5"><div className="text-sm text-red-300">WITHOUT INTERVENTION</div><div className="text-3xl font-semibold">Gap = <CountUp to={r.gapBefore}/></div></div>
      <div className="rounded-2xl bg-emerald-500/10 p-5"><div className="text-sm text-emerald-300">WITH INTERVENTION</div>
        <div>Projected supply <b><CountUp to={r.projectedSupply}/></b></div><div className="text-3xl font-semibold">New gap = <CountUp to={r.gapAfter}/></div>
        <div className="mt-1 text-lg">Gap reduction <b><CountUp to={r.reductionPct} decimals={1} suffix="%"/></b></div></div></motion.div>)
      : <div className="grid h-full place-items-center rounded-2xl bg-card p-8 text-slate-400">Adjust the sliders and press Simulate.</div>}</div></div></div>);
}
