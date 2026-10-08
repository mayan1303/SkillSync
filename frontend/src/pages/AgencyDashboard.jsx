import { Link } from 'react-router-dom'; import useDashboard from '../components/useDashboard'; import { Spinner, Notice } from '../components/States'; import StatCard from '../components/StatCard';
export default function AgencyDashboard() {
  const { data: d, error } = useDashboard('agency');
  if (error) return <Notice title="Couldn't load dashboard" text={error}/>; if (!d) return <Spinner/>;
  const t = d.topOpportunity;
  return (<div className="space-y-8"><h1 className="text-2xl font-semibold">What should we teach next?</h1>
    <div className="rounded-2xl bg-gradient-to-br from-electric/20 to-purple-500/20 p-6"><div className="text-xl font-semibold">🔥 {t.skill} <span className="text-emerald-300">in {t.demandGrowthPct}% of job postings</span></div>
      <div className="mt-4 grid grid-cols-3 gap-4"><StatCard label="Potential Learners" value={t.potentialLearners}/><StatCard i={1} label="Companies Hiring" value={t.companiesHiring}/>
        <div className="rounded-2xl bg-card p-5"><div className="text-sm text-slate-400">Competition</div><div className="mt-1 text-3xl font-semibold">{t.competition}</div></div></div>
      <Link to="/agency/courses" className="btn mt-4 inline-block">Create Course</Link></div>
    <section className="rounded-2xl bg-card p-5"><h2 className="mb-3 font-semibold">Skill groups by demand and impact</h2>
      {[...d.highDemand].sort((a, b) => b.momentumPct - a.momentumPct).map(s => (<div key={s.skill} className="flex justify-between border-b border-white/5 py-2 text-sm last:border-0">
        <span>{s.skill}</span><span className="text-cyan-300">in {s.projectedDemand}% of postings · hike link {(s.momentumPct / 100).toFixed(2)}</span></div>))}</section></div>);
}
