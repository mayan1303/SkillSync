import { useEffect, useState } from 'react'; import { Check, MessageCircle, X } from 'lucide-react'; import * as S from '../../services/connectService'; import { Avatar, Chip, DemoBadge } from './ui';
export default function NetworkTab({ onView, onChat, onChanged, version }) {
  const [d, setD] = useState(null); const [err, setErr] = useState('');
  const load = () => S.connections().then(x => { setD(x); setErr(''); }).catch(e => setErr(S.errMsg(e))); useEffect(() => { load(); }, [version]);
  const run = f => async () => { try { await f(); await load(); onChanged?.(); } catch (e) { setErr(S.errMsg(e)); } };
  if (!d) return <p className="text-slate-400">{err || 'Loading your network...'}</p>;
  const row = (m, actions) => (<div key={m.id} className="flex items-center gap-3 rounded-xl bg-white/5 p-3"><button onClick={() => onView(m.id)}><Avatar name={m.name} size={42}/></button>
    <div className="min-w-0 flex-1"><button onClick={() => onView(m.id)} className="flex items-center gap-2 font-medium hover:text-cyan-300">{m.name} {m.demo && <DemoBadge/>}</button><div className="truncate text-xs text-slate-400">{m.careerGoal}</div>
      <div className="mt-1 flex flex-wrap gap-1">{m.canTeach.slice(0, 3).map(s => <Chip key={s} tone="green">{s}</Chip>)}</div></div><div className="flex items-center gap-2">{actions}</div></div>);
  return (<div className="mx-auto max-w-3xl space-y-5">{err && <p className="text-red-300">{err}</p>}
    <section className="rounded-2xl bg-card p-4"><h3 className="mb-3 font-semibold">Requests received ({d.incoming.length})</h3><div className="space-y-2">
      {d.incoming.map(m => row(m, <><button className="btn inline-flex items-center gap-1 !px-3 !py-1 text-sm" onClick={run(() => S.acceptConn(m.connectionId))}><Check size={14}/> Accept</button>
        <button aria-label="Decline" className="rounded-xl border border-white/15 p-1.5 text-slate-400 hover:text-red-300" onClick={run(() => S.removeConn(m.connectionId))}><X size={15}/></button></>))}
      {d.incoming.length === 0 && <p className="text-sm text-slate-500">No pending requests.</p>}</div></section>
    <section className="rounded-2xl bg-card p-4"><h3 className="mb-3 font-semibold">Your connections ({d.connected.length})</h3><div className="space-y-2">
      {d.connected.map(m => row(m, <><button className="btn inline-flex items-center gap-1 !px-3 !py-1 text-sm" onClick={() => onChat(m.id)}><MessageCircle size={14}/> Message</button>
        <button aria-label="Remove connection" title="Remove connection" className="rounded-xl border border-white/15 p-1.5 text-slate-400 hover:text-red-300" onClick={run(() => S.removeConn(m.connectionId))}><X size={15}/></button></>))}
      {d.connected.length === 0 && <p className="text-sm text-slate-500">Nobody yet. Open Matches and send a few requests.</p>}</div></section>
    {d.outgoing.length > 0 && <section className="rounded-2xl bg-card p-4"><h3 className="mb-3 font-semibold">Sent requests ({d.outgoing.length})</h3><div className="space-y-2">
      {d.outgoing.map(m => row(m, <button className="rounded-xl border border-white/15 px-3 py-1 text-sm text-slate-300 hover:text-red-300" onClick={run(() => S.removeConn(m.connectionId))}>Cancel</button>))}</div></section>}</div>);
}
