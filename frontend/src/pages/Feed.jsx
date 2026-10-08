import { useEffect, useState } from 'react'; import { Link } from 'react-router-dom'; import { motion } from 'framer-motion'; import { AlertTriangle, BookOpen, Info, TrendingDown } from 'lucide-react';
import { feed } from '../services/courseService'; import { Notice, Spinner } from '../components/States';
const tone = { CRITICAL: 'border-red-400 text-red-300', WARNING: 'border-amber-400 text-amber-300', WATCH: 'border-violet-400 text-violet-300', INFO: 'border-cyan-400 text-cyan-300' };
const icon = { ALERT: AlertTriangle, COURSE: BookOpen, TREND: TrendingDown, INFO: Info };
export default function Feed() {
  const [d, setD] = useState(null); const [err, setErr] = useState('');
  useEffect(() => { const l = () => feed().then(setD).catch(() => setErr('Could not load your feed')); l(); const t = setInterval(l, 20000); return () => clearInterval(t); }, []);
  if (err && !d) return <Notice title="Something went wrong" text={err}/>; if (!d) return <Spinner/>;
  return (<div className="mx-auto max-w-2xl space-y-3"><h1 className="flex items-center gap-2 text-2xl font-semibold">News Feed <span className="live-dot"/></h1>
    <p className="text-sm text-slate-400">Personal alerts based on your skills, market shifts and new courses. Updates automatically.</p>
    {d.map((x, i) => { const I = icon[x.type] || Info; return (<motion.div key={x.title + i} initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.07 }} className={`rounded-2xl border-l-4 bg-card p-4 ${tone[x.severity]}`}>
      <div className="flex items-center gap-2 text-xs font-semibold"><I size={14}/> {x.severity}</div><div className="my-1 text-white">{x.title}</div><p className="text-sm text-slate-400">{x.text}</p>
      {x.courseId && <Link to="/catalog" className="mt-2 inline-block text-sm text-cyan-300 underline">View in catalog</Link>}</motion.div>); })}</div>);
}
