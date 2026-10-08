import { useEffect, useRef, useState } from 'react'; import { Link } from 'react-router-dom'; import { motion } from 'framer-motion';
import { assessAnswer, assessSkills, assessStart } from '../services/assessmentService'; import CountUp from '../components/CountUp';
const LIMIT = 12000;
export default function Assessment() {
  const [skills, setSkills] = useState([]); const [custom, setCustom] = useState(''); const [gen, setGen] = useState(false); const [chat, setChat] = useState([]); const [q, setQ] = useState(null); const [val, setVal] = useState('');
  const [left, setLeft] = useState(LIMIT); const [result, setResult] = useState(null); const [err, setErr] = useState(''); const [meta, setMeta] = useState({ i: 0, total: 5 });
  const sid = useRef(null), busy = useRef(false), valRef = useRef(''), t0 = useRef(0), submitRef = useRef(), inputRef = useRef(), awayRef = useRef(false);
  useEffect(() => { assessSkills().then(setSkills).catch(() => setErr('Could not load skills')); }, []);
  const show = r => { setMeta({ i: r.index, total: r.total }); setChat(c => [...c, { who: 'bot', text: r.question }]); setQ({ n: r.index }); };
  const start = async skill => { setErr(''); setResult(null); setChat([]);
    setGen(true); try { const r = await assessStart(skill); sid.current = r.sessionId; busy.current = false; show(r); } catch (e) { setErr(e.response?.data?.message || 'Network error'); } finally { setGen(false); } };
  submitRef.current = async () => {
    if (busy.current) return; busy.current = true; const a = valRef.current; valRef.current = ''; setVal(''); setQ(null);
    setChat(c => [...c, { who: 'me', text: a || '(no answer)' }]);
    try { const r = await assessAnswer(sid.current, a, awayRef.current);
      setChat(c => [...c, { who: 'sys', text: r.away ? '⚠ You left the tab: answer void' : r.timedOut ? '⏱ Too slow' : r.lastCorrect ? '✓ Correct' : '✗ Incorrect' }]);
      if (r.done) setResult(r); else { busy.current = false; show(r); }
    } catch (e) { setErr(e.response?.data?.message || 'Network error'); } };
  useEffect(() => { if (!q) return; t0.current = performance.now(); setLeft(LIMIT); inputRef.current?.focus(); awayRef.current = false; const away = () => { awayRef.current = true; }; window.addEventListener('blur', away); document.addEventListener('visibilitychange', away);
    const id = setInterval(() => { const l = LIMIT - (performance.now() - t0.current); setLeft(Math.max(0, l)); if (l <= 0) { clearInterval(id); submitRef.current(); } }, 100);
    return () => { clearInterval(id); window.removeEventListener('blur', away); document.removeEventListener('visibilitychange', away); }; }, [q]);
  if (!sid.current && !chat.length) return (<div className="space-y-4"><h1 className="text-2xl font-semibold">Skill Assessment</h1>
    <p className="text-slate-400">Up to 8 questions of rising difficulty. You get <b className="text-white">12 seconds</b> per answer, enforced by the server. Pasting is disabled, leaving the tab voids the answer, and a skill can be retaken after 5 minutes. Type any skill and the AI writes fresh questions for it. Your verified score replaces your self-rated level.</p>
    {err && <p className="text-red-400">{err}</p>}<div className="flex gap-2"><input className="input" placeholder="Type ANY skill (e.g. Kubernetes, SQL, Figma)" value={custom} maxLength={40} onChange={e => setCustom(e.target.value)} onKeyDown={e => e.key === 'Enter' && custom.trim() && start(custom.trim())}/><button className="btn" disabled={gen || custom.trim().length < 2} onClick={() => start(custom.trim())}>{gen ? 'Writing questions…' : 'Start'}</button></div>
    <div className="flex flex-wrap gap-2">{skills.map(s => <button key={s} disabled={gen} className="rounded-xl border border-white/10 px-3 py-1.5 text-sm" onClick={() => start(s)}>{s}</button>)}</div></div>);
  return (<div className="mx-auto max-w-xl space-y-3"><div className="text-sm text-slate-400">Question {Math.min(meta.i + 1, meta.total)} of {meta.total}</div>
    <div className="space-y-2">{chat.map((m, i) => (<motion.div key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
      className={`max-w-[85%] rounded-2xl px-4 py-2 text-sm ${m.who === 'me' ? 'ml-auto bg-electric' : m.who === 'sys' ? 'bg-transparent text-slate-400' : 'bg-card'}`}>{m.text}</motion.div>))}</div>
    {q && <><div className="h-2 rounded-full bg-white/10"><div className={`h-2 rounded-full ${left < 2000 ? 'bg-red-400' : 'bg-electric'}`} style={{ width: `${(left / LIMIT) * 100}%`, transition: 'width 100ms linear' }}/></div>
      <input ref={inputRef} className="input" maxLength={40} autoComplete="off" placeholder="Type your answer, press Enter" value={val}
        onChange={e => { setVal(e.target.value); valRef.current = e.target.value; }} onPaste={e => e.preventDefault()} onDrop={e => e.preventDefault()}
        onKeyDown={e => e.key === 'Enter' && submitRef.current()}/></>}
    {err && <p className="text-red-400">{err}</p>}
    {result && <div className="rounded-2xl bg-card p-5 text-center"><div className="text-sm text-slate-400">{result.skill} verified level</div>
      <div className="text-4xl font-semibold"><CountUp to={result.level} suffix="%"/></div><p className="text-sm text-slate-400">{result.correct}/{result.total} weighted points (harder questions count more)</p>
      <div className="mt-3 flex justify-center gap-2"><Link to="/student" className="btn">See my dashboard</Link><button className="rounded-xl border border-white/10 px-4 py-2" onClick={() => { sid.current = null; setChat([]); setResult(null); }}>Another skill</button></div></div>}</div>);
}
