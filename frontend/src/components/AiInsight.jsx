import { useEffect, useState } from 'react'; import { motion } from 'framer-motion'; import { RefreshCw, Sparkles } from 'lucide-react'; import api from '../services/api'; import { useAuth } from '../context/AuthContext';
export default function AiInsight() {
  const { user } = useAuth(); const key = `wie.insight.${user.id}`; const [t, setT] = useState(sessionStorage.getItem(key) || ''); const [busy, setBusy] = useState(false); const [err, setErr] = useState('');
  const run = async () => { setBusy(true); setErr('');
    try { const { data } = await api.post('/ai/insight'); setT(data.insight); sessionStorage.setItem(key, data.insight); }
    catch (e) { setErr(e.response?.data?.message || 'Could not reach the AI.'); } finally { setBusy(false); } };
  useEffect(() => { if (!t) run(); }, []);
  return (<motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="mb-6 rounded-2xl bg-card p-4">
    <div className="mb-2 flex items-center justify-between"><b className="flex items-center gap-2 text-sm text-cyan-300"><Sparkles size={16}/> AI Briefing <span className="live-dot"/></b>
      <button onClick={run} disabled={busy} className="text-slate-400 hover:text-white"><RefreshCw size={14} className={busy ? 'animate-spin' : ''}/></button></div>
    {err ? <p className="text-sm text-amber-300">{err}</p> : t ? t.split('\n').filter(Boolean).map((l, i) => <motion.p key={l} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.15 }} className="text-sm text-slate-200">{l}</motion.p>)
      : <p className="text-sm text-slate-400">Analysing your data…</p>}</motion.div>);
}
