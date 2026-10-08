import { useEffect, useState } from 'react'; import { motion } from 'framer-motion'; import { alerts } from '../services/intelService'; import { Spinner, Notice } from '../components/States';
const tone = { CRITICAL: 'border-red-400 text-red-300', WARNING: 'border-amber-400 text-amber-300', WATCH: 'border-blue-400 text-blue-300' };
export default function Alerts() {
  const [d, setD] = useState(null); const [err, setErr] = useState(null);
  useEffect(() => { alerts().then(setD).catch(e => setErr(e.response ? 'Could not load alerts' : 'Network error')); }, []);
  if (err) return <Notice title="Something went wrong" text={err}/>; if (!d) return <Spinner/>;
  if (!d.length) return <Notice title="All clear" text="No active workforce alerts."/>;
  return (<div className="space-y-4"><h1 className="text-2xl font-semibold">Early Warning Center</h1>{d.map((a, i) => (
    <motion.div key={a.title} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }} className={`rounded-2xl border-l-4 bg-card p-5 ${tone[a.severity]}`}>
      <div className="text-xs font-semibold">{a.severity}</div><div className="my-1 text-lg text-white">{a.title}</div>
      <p className="text-sm text-slate-400">{a.detail}</p>
      <ul className="mt-3 grid gap-1 text-sm text-slate-200 sm:grid-cols-2">{a.actions.map(x => <li key={x}>→ {x}</li>)}</ul></motion.div>))}</div>);
}
