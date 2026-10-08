import { useEffect, useState } from 'react'; import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { outcomes } from '../services/intelService'; import { Spinner, Notice } from '../components/States'; import StatCard from '../components/StatCard';
export default function Outcomes() {
  const [d, setD] = useState(null); const [err, setErr] = useState(null);
  useEffect(() => { outcomes().then(setD).catch(e => setErr(e.response ? 'Could not load outcomes' : 'Network error')); }, []);
  if (err) return <Notice title="Something went wrong" text={err}/>; if (!d) return <Spinner/>;
  return (<div className="space-y-6"><h1 className="text-2xl font-semibold">Outcome Tracking</h1>
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">{d.funnel.map((s, i) => <StatCard key={s.stage} i={i} label={s.stage} value={s.count}/>)}<StatCard i={5} label="Skill gap reduced" value={d.skillGapReducedPct} suffix="%"/></div>
    <section className="rounded-2xl bg-card p-5"><ResponsiveContainer width="100%" height={280}><BarChart data={d.funnel} layout="vertical"><CartesianGrid stroke="rgba(255,255,255,.06)"/>
      <XAxis type="number" stroke="#94a3b8" fontSize={12}/><YAxis type="category" dataKey="stage" stroke="#94a3b8" fontSize={12} width={100}/><Tooltip contentStyle={{ background: '#0b1226', border: 0 }}/>
      <Bar dataKey="count" fill="#3b82f6" radius={[0, 6, 6, 0]} animationDuration={1000}/></BarChart></ResponsiveContainer></section></div>);
}
