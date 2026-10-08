import { useEffect, useState } from 'react'; import { motion } from 'framer-motion'; import { Sparkles } from 'lucide-react';
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { market } from '../services/dataService'; import { Notice, Spinner } from '../components/States'; import StatCard from '../components/StatCard';
const TT = { contentStyle: { background: '#05070f', border: '1px solid #164e63' } };
const Card = ({ title, note, children }) => <section className="rounded-2xl bg-card p-5"><h2 className="font-semibold">{title}</h2>{note && <p className="mb-2 text-xs text-slate-400">{note}</p>}{children}</section>;
function Bars({ data, x, bars, vertical, h = 280 }) {
  return (<ResponsiveContainer width="100%" height={h}><BarChart data={data} layout={vertical ? 'vertical' : 'horizontal'}><CartesianGrid stroke="rgba(255,255,255,.06)"/>
    {vertical ? <><XAxis type="number" stroke="#94a3b8" fontSize={11}/><YAxis type="category" dataKey={x} stroke="#94a3b8" fontSize={11} width={105}/></> : <><XAxis dataKey={x} stroke="#94a3b8" fontSize={11}/><YAxis stroke="#94a3b8" fontSize={11}/></>}
    <Tooltip {...TT}/>{bars.length > 1 && <Legend/>}{bars.map(([k, n, c]) => <Bar key={k} dataKey={k} name={n} fill={c} radius={4} animationDuration={900}/>)}</BarChart></ResponsiveContainer>);
}
export default function Market() {
  const [d, setD] = useState(null); const [err, setErr] = useState('');
  useEffect(() => { market().then(setD).catch(() => setErr('Could not load market data')); }, []);
  if (err) return <Notice title="Something went wrong" text={err}/>; if (!d) return <Spinner/>;
  const m = d.meta, perf = f => f.map(r => ({ label: r.label, high: r.high, low: r.low }));
  return (<div className="space-y-6"><h1 className="text-2xl font-semibold">Market Intelligence</h1>
    <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="rounded-2xl border border-cyan-400/30 bg-card p-4 text-sm text-slate-200"><Sparkles size={14} className="mr-2 inline text-cyan-300"/>{d.callout}</motion.div>
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4"><StatCard label="Analytics postings analysed" value={m.analyticsClean}/><StatCard i={1} label="Companies in jobs data" value={m.companies}/><StatCard i={2} label="Data-science postings" value={m.dsPostings}/><StatCard i={3} label="Employees profiled" value={m.juniors + m.seniors}/></div>
    <div className="grid gap-6 lg:grid-cols-2">
      <Card title="Most requested skills" note="% of de-duplicated analytics postings"><Bars data={d.topSkills} x="name" vertical h={380} bars={[['pct', '% of postings', '#22d3ee']]}/></Card>
      <Card title="Skill groups: demand vs junior proficiency" note="Demand = % of postings; proficiency = junior cohort mean score / 5"><Bars data={d.categories} x="name" bars={[['demandPct', 'Demand %', '#22d3ee'], ['proficiencyPct', 'Proficiency %', '#a78bfa']]}/></Card>
      <Card title="Where the jobs are" note="% of postings mentioning each location"><Bars data={d.locations} x="name" bars={[['pct', '% of postings', '#22d3ee']]}/></Card>
      <Card title="Salary bands" note="% of analytics postings (lakh per year)"><Bars data={d.salaryBands} x="band" bars={[['pct', '% of postings', '#a78bfa']]}/></Card>
      <Card title="What separates high-hike juniors" note={`Mean skill score (1-5), n=${d.junior.metrics.n}`}><Bars data={perf(d.junior.features)} x="label" bars={[['high', 'High hike', '#22d3ee'], ['low', 'Low hike', '#64748b']]}/></Card>
      <Card title="What separates successful seniors" note={`Mean normalized trait score, n=${d.senior.metrics.n}`}><Bars data={perf(d.senior.features)} x="label" bars={[['high', 'High success', '#22d3ee'], ['low', 'Low success', '#64748b']]}/></Card></div>
    <div className="grid gap-6 lg:grid-cols-2"><Card title="Companies with most postings" note="Data Science Jobs file (avg salary in lakh)">{d.companies.map(c => <div key={c.name} className="flex justify-between border-b border-white/5 py-1.5 text-sm last:border-0"><span>{c.name}</span><span className="text-slate-400">{c.jobs} postings · {c.avgSalaryL}L</span></div>)}</Card>
      <Card title="Roles: postings and pay">{d.titles.map(t => <div key={t.title} className="flex justify-between border-b border-white/5 py-1.5 text-sm last:border-0"><span>{t.title}</span><span className="text-slate-400">{t.postings} · {t.avgSalaryL}L avg</span></div>)}</Card></div>
    <Card title="Data quality: what we cleaned">{m.dataQuality.map(x => <p key={x} className="py-1 text-sm text-slate-300">• {x}</p>)}</Card></div>);
}
