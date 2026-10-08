import { useCallback, useEffect, useRef, useState } from 'react'; import { ArrowLeft, Send } from 'lucide-react'; import * as S from '../../services/connectService'; import { Avatar, DemoBadge, timeAgo } from './ui';
export default function MessagesTab({ initialPeer, onRead }) {
  const [list, setList] = useState(null); const [peerId, setPeerId] = useState(initialPeer || null); const [msgs, setMsgs] = useState([]); const [text, setText] = useState(''); const [err, setErr] = useState(''); const [busy, setBusy] = useState(false); const end = useRef(null);
  const loadList = useCallback(() => S.chats().then(setList).catch(e => setErr(S.errMsg(e))), []);
  const loadMsgs = useCallback(() => peerId ? S.messages(peerId).then(m => { setMsgs(m); setErr(''); onRead?.(); loadList(); }).catch(e => setErr(S.errMsg(e))) : Promise.resolve(), [peerId]);
  useEffect(() => { loadList(); const t = setInterval(loadList, 6000); return () => clearInterval(t); }, [loadList]);
  useEffect(() => { setMsgs([]); loadMsgs(); const t = setInterval(loadMsgs, 3000); return () => clearInterval(t); }, [loadMsgs]);
  useEffect(() => { end.current?.scrollIntoView({ behavior: 'smooth' }); }, [msgs.length, peerId]);
  const active = list?.find(c => c.peer.id === peerId)?.peer;
  const send = async e => { e.preventDefault(); const t = text.trim(); if (!t || busy) return; setBusy(true); setErr('');
    try { await S.sendMessage(peerId, t); setText(''); await loadMsgs(); } catch (x) { setErr(S.errMsg(x)); } finally { setBusy(false); } };
  if (!list) return <p className="text-slate-400">{err || 'Loading chats...'}</p>;
  return (<div className="grid h-[70vh] min-h-[420px] overflow-hidden rounded-2xl border border-white/10 bg-card md:grid-cols-[300px_1fr]">
    <div className={`overflow-y-auto border-white/10 md:border-r ${peerId ? 'hidden md:block' : ''}`}>
      {list.length === 0 && <p className="p-5 text-sm text-slate-400">You can chat once someone accepts your connection request. Open Matches to find people.</p>}
      {list.map(c => (<button key={c.peer.id} onClick={() => setPeerId(c.peer.id)} className={`flex w-full items-center gap-3 border-b border-white/5 p-3 text-left hover:bg-white/5 ${c.peer.id === peerId ? 'bg-white/10' : ''}`}><Avatar name={c.peer.name} size={42}/>
        <div className="min-w-0 flex-1"><div className="flex items-center justify-between gap-2"><span className="truncate font-medium">{c.peer.name}</span><span className="text-[11px] text-slate-500">{timeAgo(c.lastAt)}</span></div>
          <div className="truncate text-xs text-slate-400">{c.lastText ? `${c.lastMine ? 'You: ' : ''}${c.lastText}` : 'Say hello'}</div></div>{c.unread > 0 && <span className="grid h-5 min-w-5 place-items-center rounded-full bg-cyan-400 px-1 text-[11px] font-bold text-slate-950">{c.unread}</span>}</button>))}</div>
    <div className={`flex min-h-0 flex-col ${peerId ? '' : 'hidden md:flex'}`}>
      {!peerId && <div className="grid flex-1 place-items-center p-6 text-center text-slate-400">Pick a conversation to start chatting.</div>}
      {peerId && <><div className="flex items-center gap-3 border-b border-white/10 p-3"><button className="md:hidden" onClick={() => setPeerId(null)} aria-label="Back"><ArrowLeft/></button>{active && <><Avatar name={active.name} size={36}/><div className="font-medium">{active.name}</div>{active.demo && <DemoBadge/>}</>}</div>
        <div className="flex-1 space-y-2 overflow-y-auto p-4">{msgs.length === 0 && <p className="text-center text-sm text-slate-500">No messages yet. Introduce yourself and say what you want to learn.</p>}
          {msgs.map(m => (<div key={m.id} className={`flex ${m.mine ? 'justify-end' : ''}`}><div className={`max-w-[80%] whitespace-pre-wrap break-words rounded-2xl px-3 py-2 text-sm ${m.mine ? 'bg-gradient-to-r from-cyan-400 to-violet-400 text-slate-950' : 'bg-white/10'}`}>{m.text}<div className={`mt-0.5 text-[10px] ${m.mine ? 'text-slate-800' : 'text-slate-500'}`}>{timeAgo(m.createdAt)}</div></div></div>))}<div ref={end}/></div>
        {err && <p className="px-4 text-xs text-red-300">{err}</p>}
        {active && !active.privateChat ? <p className="border-t border-white/10 p-3 text-center text-sm text-amber-300">{active.name} has turned off private messages.</p>
          : <form onSubmit={send} className="flex gap-2 border-t border-white/10 p-3"><input className="input" maxLength={1000} value={text} onChange={e => setText(e.target.value)} placeholder="Write a message" aria-label="Message"/><button disabled={busy || !text.trim()} className="btn !px-4" aria-label="Send"><Send size={16}/></button></form>}</>}</div></div>);
}
