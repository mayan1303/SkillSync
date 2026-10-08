import { useEffect, useState } from 'react'; import { motion } from 'framer-motion'; import { Repeat, Search } from 'lucide-react'; import * as S from '../../services/connectService';
import { Avatar, Bar, Chip, DemoBadge, ScoreRing } from './ui'; import ConnectButton from './ConnectButton';
export default function MatchesTab({ onView, onChat, onChanged, version }) {
  const [list, setList] = useState(null); const [q, setQ] = useState(''); const [err, setErr] = useState('');
  const load = () => S.matches(q.trim()).then(d => { setList(d); setErr(''); }).catch(e => setErr(S.errMsg(e)));
  useEffect(() => { const t = setTimeout(load, q ? 300 : 0); return () => clearTimeout(t); }, [q, version]);
  const changed = async () => { await load(); onChanged?.(); };
  return (<div className="space-y-4"><div className="flex flex-wrap items-end justify-between gap-3"><div><h2 className="text-xl font-semibold">People who match your skills</h2>
    <p className="text-sm text-slate-400">Score = 45% skills you want to learn that they have, 20% their level, 20% career goal, 15% personality.</p></div>
    <div className="relative w-full sm:w-64"><Search size={15} className="absolute left-3 top-3 text-slate-500"/><input className="input !pl-9" value={q} onChange={e => setQ(e.target.value)} placeholder="Filter by skill they have" aria-label="Filter by skill"/></div></div>
    {err && <p className="text-red-300">{err}</p>}{!list && !err && <p className="text-slate-400">Finding matches...</p>}
    {list && list.length === 0 && <div className="rounded-2xl bg-card p-8 text-center text-slate-400">{q ? 'Nobody with that skill yet.' : 'No other members yet.'}</div>}
    <div className="grid gap-4 md:grid-cols-2">{(list || []).map((m, i) => (<motion.div key={m.id} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(i, 8) * 0.04 }} className="space-y-3 rounded-2xl bg-card p-4">
      <div className="flex items-center gap-3"><button onClick={() => onView(m.id)} aria-label={`View ${m.name}`}><Avatar name={m.name} size={48}/></button><div className="min-w-0 flex-1"><button onClick={() => onView(m.id)} className="flex items-center gap-2 font-semibold hover:text-cyan-300">{m.name} {m.demo && <DemoBadge/>}</button><div className="truncate text-xs text-slate-400">{m.careerGoal}</div></div><ScoreRing value={m.match.score}/></div>
      {m.match.mutual && <Chip tone="amber"><Repeat size={11}/> Skill swap: you can help each other</Chip>}
      <div className="grid grid-cols-2 gap-x-4 gap-y-2"><Bar label="Skills" value={m.match.skillScore}/><Bar label="Level" value={m.match.levelScore}/><Bar label="Career" value={m.match.careerScore}/><Bar label="Personality" value={m.match.personalityScore}/></div>
      <div className="flex flex-wrap gap-1.5">{m.match.matched.map(s => <Chip key={s} tone="green">{s}</Chip>)}{m.match.missing.map(s => <Chip key={s} tone="dim" className="line-through">{s}</Chip>)}</div>
      <div className="flex items-center gap-2"><ConnectButton small memberId={m.id} conn={m.connection} onChanged={changed} onChat={onChat}/><button onClick={() => onView(m.id)} className="rounded-xl border border-white/15 px-3 py-1 text-sm text-slate-300 hover:text-white">View profile</button></div></motion.div>))}</div></div>);
}
