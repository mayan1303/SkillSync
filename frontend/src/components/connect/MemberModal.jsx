import { useCallback, useEffect, useState } from 'react'; import { motion } from 'framer-motion'; import { X } from 'lucide-react'; import * as S from '../../services/connectService';
import { Avatar, Bar, Chip, DemoBadge, ScoreRing, TYPE_META, timeAgo } from './ui'; import ConnectButton from './ConnectButton';
export default function MemberModal({ id, onClose, onChat, onChanged }) {
  const [m, setM] = useState(null); const [err, setErr] = useState('');
  const load = useCallback(() => S.memberDetail(id).then(setM).catch(e => setErr(S.errMsg(e))), [id]); useEffect(() => { load(); }, [load]);
  const changed = async () => { await load(); onChanged?.(); };
  return (<motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="fixed inset-0 z-50 grid place-items-center bg-black/70 p-4" onClick={onClose}>
    <motion.div initial={{ y: 20, scale: .97 }} animate={{ y: 0, scale: 1 }} onClick={e => e.stopPropagation()} role="dialog" aria-modal="true" className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-white/10 bg-[#0b1220] p-6">
      <button onClick={onClose} aria-label="Close" className="float-right text-slate-400 hover:text-white"><X/></button>
      {err && <p className="text-red-300">{err}</p>}{!m && !err && <p className="text-slate-400">Loading...</p>}
      {m && <div className="space-y-4">
        <div className="flex items-center gap-4"><Avatar name={m.name} size={64}/><div className="flex-1"><h2 className="flex items-center gap-2 text-xl font-semibold">{m.name} {m.demo && <DemoBadge/>}</h2><p className="text-slate-400">{m.careerGoal || 'No career goal set'}</p></div><ScoreRing value={m.match.score} size={64}/></div>
        {m.bio && <p className="text-sm text-slate-300">{m.bio}</p>}
        <div className="flex flex-wrap items-center gap-2"><ConnectButton memberId={m.id} conn={m.connection} onChanged={changed} onChat={id => { onClose(); onChat(id); }}/>
          {m.connection.status === 'CONNECTED' && !m.privateChat && <span className="text-xs text-amber-300">Private messages are off for this member</span>}</div>
        <div className="grid gap-3 rounded-xl bg-white/5 p-4 sm:grid-cols-2"><Bar label="Skill fit (45%)" value={m.match.skillScore}/><Bar label="Skill level (20%)" value={m.match.levelScore}/><Bar label="Career goal (20%)" value={m.match.careerScore}/><Bar label="Personality (15%)" value={m.match.personalityScore}/></div>
        {m.match.matched.length > 0 && <div><div className="mb-1 text-sm text-slate-400">They can help you with</div><div className="flex flex-wrap gap-1.5">{m.match.matched.map(s => <Chip key={s} tone="green">{s}</Chip>)}</div></div>}
        {m.match.theyWant.length > 0 && <div><div className="mb-1 text-sm text-slate-400">They want to learn what you know</div><div className="flex flex-wrap gap-1.5">{m.match.theyWant.map(s => <Chip key={s} tone="violet">{s}</Chip>)}</div></div>}
        <div><div className="mb-1 text-sm text-slate-400">Skills</div><div className="flex flex-wrap gap-1.5">{m.currentSkills.map(s => <Chip key={s.name} tone="cyan">{s.name} · {s.level}/5</Chip>)}</div></div>
        <div className="grid gap-3 sm:grid-cols-2"><div><div className="mb-1 text-sm text-slate-400">Learning</div><div className="flex flex-wrap gap-1.5">{m.learningSkills.map(s => <Chip key={s} tone="violet">{s}</Chip>)}</div></div>
          <div><div className="mb-1 text-sm text-slate-400">Can teach</div><div className="flex flex-wrap gap-1.5">{m.canTeach.map(s => <Chip key={s} tone="green">{s}</Chip>)}</div></div></div>
        {m.posts.length > 0 && <div><div className="mb-1 text-sm text-slate-400">Recent posts</div><div className="space-y-2">{m.posts.map(p => (<div key={p.id} className="rounded-xl bg-white/5 p-3 text-sm"><div className="mb-1 flex items-center gap-2 text-xs"><Chip tone={TYPE_META[p.type][1]}>{TYPE_META[p.type][0]}{p.skill ? ` · ${p.skill}` : ''}</Chip><span className="text-slate-500">{timeAgo(p.createdAt)}</span></div>{p.message}</div>))}</div></div>}
      </div>}</motion.div></motion.div>);
}
