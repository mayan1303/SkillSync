import { useEffect, useState } from 'react'; import { AnimatePresence, motion } from 'framer-motion'; import { Sparkles, Trash2 } from 'lucide-react';
import { createCourse, deleteCourse, draftCourse, myCourses } from '../services/courseService'; import { Spinner } from '../components/States';
const EMPTY = { title: '', skill: '', level: 'Beginner', weeks: 6, mode: 'Online', description: '' };
export default function AgencyCourses() {
  const [f, setF] = useState(EMPTY); const [list, setList] = useState(null); const [err, setErr] = useState(''); const [busy, setBusy] = useState(false); const [drafting, setDrafting] = useState(false);
  const load = () => myCourses().then(setList).catch(() => setErr('Could not load courses')); useEffect(() => { load(); }, []);
  const set = k => e => setF({ ...f, [k]: e.target.value });
  const draft = async () => { if (f.skill.trim().length < 2) return setErr('Enter the skill first'); setDrafting(true); setErr('');
    try { const { text } = await draftCourse(f.skill.trim()); setF(x => ({ ...x, description: text.slice(0, 600) })); } catch (e) { setErr(e.response?.data?.message || 'AI unavailable'); } finally { setDrafting(false); } };
  const save = async () => { setBusy(true); setErr('');
    try { await createCourse({ ...f, weeks: +f.weeks }); setF(EMPTY); load(); } catch (e) { const d = e.response?.data; setErr(d?.details ? Object.values(d.details).join(' · ') : d?.message || 'Network error'); } finally { setBusy(false); } };
  const del = async id => { await deleteCourse(id); load(); };
  return (<div className="space-y-6"><h1 className="text-2xl font-semibold">My Courses</h1>
    <div className="grid gap-6 md:grid-cols-2"><div className="space-y-3 rounded-2xl bg-card p-5"><h2 className="font-semibold">Create a course</h2>
      <input className="input" placeholder="Course title" maxLength={80} value={f.title} onChange={set('title')}/><input className="input" placeholder="Skill taught (e.g. Edge AI)" maxLength={40} value={f.skill} onChange={set('skill')}/>
      <div className="grid grid-cols-3 gap-2"><select className="input" value={f.level} onChange={set('level')}>{['Beginner', 'Intermediate', 'Advanced'].map(x => <option key={x} className="bg-slate-900">{x}</option>)}</select>
        <input className="input" type="number" min="1" max="104" value={f.weeks} onChange={set('weeks')} title="Weeks"/><select className="input" value={f.mode} onChange={set('mode')}>{['Online', 'Offline', 'Hybrid'].map(x => <option key={x} className="bg-slate-900">{x}</option>)}</select></div>
      <textarea className="input h-28" placeholder="Description" maxLength={600} value={f.description} onChange={set('description')}/>
      <div className="flex gap-2"><button className="rounded-xl border border-cyan-400/40 px-3 py-2 text-sm text-cyan-300" onClick={draft} disabled={drafting}><Sparkles size={14} className="mr-1 inline"/>{drafting ? 'Writing…' : 'AI draft'}</button>
        <button className="btn flex-1" onClick={save} disabled={busy || !f.title.trim() || !f.skill.trim()}>{busy ? 'Publishing…' : 'Publish course'}</button></div>
      {err && <p className="text-sm text-red-400">{err}</p>}</div>
    <div className="space-y-3">{!list ? <Spinner/> : !list.length ? <div className="rounded-2xl bg-card p-6 text-slate-400">No courses yet. Publish your first one. Students see it instantly in their catalog and news feed.</div>
      : <AnimatePresence>{list.map(c => (<motion.div key={c.id} layout initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: 40 }} className="rounded-2xl bg-card p-4">
        <div className="flex items-start justify-between"><div><b>{c.title}</b><div className="text-xs text-slate-400">{c.skill} · {c.level} · {c.weeks} wks · {c.mode}</div></div>
          <button onClick={() => del(c.id)} className="text-slate-500 hover:text-red-400"><Trash2 size={16}/></button></div>
        {c.description && <p className="mt-2 text-sm text-slate-300">{c.description}</p>}<div className="mt-2 text-xs text-cyan-300">{c.enrolledCount} enrolled</div></motion.div>))}</AnimatePresence>}</div></div></div>);
}
