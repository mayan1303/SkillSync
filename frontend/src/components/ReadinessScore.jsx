import { motion } from 'framer-motion'; import CountUp from './CountUp';
export default function ReadinessScore({ value }) {
  const r = 54, c = 2 * Math.PI * r;
  return (<div className="relative h-40 w-40"><svg viewBox="0 0 120 120" className="-rotate-90">
    <circle cx="60" cy="60" r={r} stroke="rgba(255,255,255,.08)" strokeWidth="10" fill="none"/>
    <motion.circle cx="60" cy="60" r={r} stroke="#3b82f6" strokeWidth="10" strokeLinecap="round" fill="none" strokeDasharray={c}
      initial={{ strokeDashoffset: c }} animate={{ strokeDashoffset: c * (1 - value / 100) }} transition={{ duration: 1.2 }}/></svg>
    <div className="absolute inset-0 grid place-items-center text-center"><div><div className="text-3xl font-semibold"><CountUp to={value} suffix="%"/></div>
    <div className="text-xs text-slate-400">Future Readiness</div></div></div></div>);
}
