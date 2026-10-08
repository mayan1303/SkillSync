import { useState } from 'react'; import { Check, Clock, MessageCircle, UserPlus } from 'lucide-react'; import * as S from '../../services/connectService';
/** One button for every connection state. `conn` is {status, id}. onChanged() should reload the parent data. */
export default function ConnectButton({ memberId, conn, onChanged, onChat, small }) {
  const [busy, setBusy] = useState(false); const [err, setErr] = useState('');
  const run = async f => { setBusy(true); setErr(''); try { await f(); await onChanged?.(); } catch (e) { setErr(S.errMsg(e)); } finally { setBusy(false); } };
  const cls = small ? 'px-3 py-1 text-sm' : 'px-4 py-2';
  const st = conn?.status || 'NONE';
  return (<span className="inline-flex flex-col items-start gap-1">
    {st === 'CONNECTED' && <button className={`btn ${cls} inline-flex items-center gap-1.5`} onClick={() => onChat(memberId)}><MessageCircle size={15}/> Message</button>}
    {st === 'NONE' && <button disabled={busy} className={`btn ${cls} inline-flex items-center gap-1.5`} onClick={() => run(() => S.connect(memberId))}><UserPlus size={15}/> Connect</button>}
    {st === 'PENDING_OUT' && <button disabled={busy} title="Click to cancel" className={`rounded-xl border border-white/15 ${cls} text-slate-300 hover:border-red-400/60 hover:text-red-300`} onClick={() => run(() => S.removeConn(conn.id))}><Clock size={14} className="mr-1 inline"/>Requested</button>}
    {st === 'PENDING_IN' && <button disabled={busy} className={`btn ${cls} inline-flex items-center gap-1.5`} onClick={() => run(() => S.acceptConn(conn.id))}><Check size={15}/> Accept request</button>}
    {err && <span className="text-xs text-red-300">{err}</span>}</span>);
}
