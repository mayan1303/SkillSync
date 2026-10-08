import { useEffect, useRef, useState } from 'react'; import { AnimatePresence, motion } from 'framer-motion'; import { Bot, Send, X } from 'lucide-react';
import api from '../services/api'; import { useAuth } from '../context/AuthContext';
const CHIPS = {
  STUDENT: ['Which skills are most in demand?', 'What drives a high salary hike?', 'Which city has the most jobs?'],
  RECRUITER: ['What traits predict senior success?', 'Which companies hire the most?', 'What separates top junior hires?'],
  COURSE_AGENCY: ['What should we teach first?', 'Which skills are most requested?', 'What salary bands dominate jobs?'] };
export default function ChatWidget() {
  const { user } = useAuth(); const [open, setOpen] = useState(false); const [msgs, setMsgs] = useState([]); const [val, setVal] = useState(''); const [busy, setBusy] = useState(false); const end = useRef();
  useEffect(() => { end.current?.scrollIntoView({ behavior: 'smooth' }); }, [msgs, open, busy]);
  const send = async text => {
    const t = (text ?? val).trim(); if (!t || busy) return; const next = [...msgs, { role: 'user', content: t }]; setMsgs(next); setVal(''); setBusy(true);
    const hist = next.filter(m => !m.error).slice(-10).map(({ role, content }) => ({ role, content })); while (hist[0]?.role === 'assistant') hist.shift();
    try { const { data } = await api.post('/ai/chat', { messages: hist }); setMsgs(m => [...m, { role: 'assistant', content: data.reply }]); }
    catch (e) { setMsgs(m => [...m, { role: 'assistant', error: true, content: e.response?.data?.message || 'Could not reach the AI.' }]); }
    finally { setBusy(false); } };
  return (<div className="fixed bottom-4 right-4 z-50">
    <AnimatePresence>{open && (<motion.div initial={{ opacity: 0, y: 16, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 16 }}
      className="mb-3 flex h-[28rem] w-[22rem] max-w-[calc(100vw-2rem)] flex-col overflow-hidden rounded-2xl border border-white/10 bg-card shadow-2xl">
      <div className="flex items-center justify-between border-b border-white/10 px-4 py-3"><b className="flex items-center gap-2 text-sm"><Bot size={16} className="text-electric"/> AI Coach</b>
        <button onClick={() => setOpen(false)}><X size={16}/></button></div>
      <div className="flex-1 space-y-2 overflow-y-auto p-3 text-sm">
        {!msgs.length && <><p className="text-slate-400">Hi {user.name.split(' ')[0]}! Ask me anything about skills, careers or hiring.</p>
          <div className="flex flex-wrap gap-2">{CHIPS[user.role].map(c => <button key={c} onClick={() => send(c)} className="rounded-full border border-white/10 px-3 py-1 text-xs text-slate-300 hover:border-electric">{c}</button>)}</div></>}
        {msgs.map((m, i) => <div key={i} className={`max-w-[88%] whitespace-pre-wrap rounded-2xl px-3 py-2 ${m.role === 'user' ? 'ml-auto bg-electric' : m.error ? 'bg-red-500/15 text-red-300' : 'bg-white/5'}`}>{m.content}</div>)}
        {busy && <div className="w-fit rounded-2xl bg-white/5 px-3 py-2 text-slate-400">Thinking…</div>}<div ref={end}/></div>
      <div className="flex gap-2 border-t border-white/10 p-3"><input className="input" placeholder="Ask the AI coach…" value={val} maxLength={1000} onChange={e => setVal(e.target.value)} onKeyDown={e => e.key === 'Enter' && send()}/>
        <button className="btn px-3" onClick={() => send()} disabled={busy}><Send size={16}/></button></div></motion.div>)}</AnimatePresence>
    <button onClick={() => setOpen(o => !o)} className="ml-auto grid h-12 w-12 place-items-center rounded-full bg-electric shadow-lg transition hover:scale-105 active:scale-95"><Bot/></button></div>);
}
