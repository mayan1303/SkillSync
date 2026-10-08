import { useEffect, useState } from 'react'; import { whatIf } from '../services/intelService'; import CountUp from '../components/CountUp'; import ReadinessScore from '../components/ReadinessScore';
const SKILLS = ['MLOps', 'Docker', 'Edge AI', 'ROS2', 'Cloud', 'Generative AI'];
export default function StudentWhatIf() {
  const [pick, setPick] = useState([]); const [steps, setSteps] = useState([{ label: 'Current', readiness: 0 }]); const [err, setErr] = useState('');
  useEffect(() => { whatIf(pick).then(d => { setSteps(d.steps); setErr(''); }).catch(e => setErr(e.response?.data?.message || 'Network error')); }, [pick]);
  const toggle = s => setPick(p => p.includes(s) ? p.filter(x => x !== s) : [...p, s]);
  return (<div className="space-y-6"><h1 className="text-2xl font-semibold">What happens if I learn…?</h1>
    <div className="flex flex-wrap gap-2">{SKILLS.map(s => (<button key={s} onClick={() => toggle(s)}
      className={`rounded-full border px-4 py-1.5 text-sm transition ${pick.includes(s) ? 'border-electric bg-electric/20' : 'border-white/10 text-slate-400'}`}>{s}</button>))}</div>
    {err && <p className="text-sm text-red-400">{err}</p>}
    <div className="flex flex-wrap items-center gap-8"><ReadinessScore value={steps[steps.length - 1].readiness}/>
      <ul className="space-y-2">{steps.map(s => <li key={s.label} className="text-slate-300">{s.label}: <b className="text-white"><CountUp to={s.readiness} suffix="%"/></b></li>)}</ul></div></div>);
}
