import { useEffect, useState } from 'react'; import { motion } from 'framer-motion'; import { catalog, enroll } from '../services/courseService'; import { Notice, Spinner } from '../components/States';
export default function Catalog() {
  const [list, setList] = useState(null); const [err, setErr] = useState(''); const [busy, setBusy] = useState('');
  const load = () => catalog().then(setList).catch(() => setErr('Could not load courses')); useEffect(() => { load(); }, []);
  const join = async id => { setBusy(id); try { await enroll(id); await load(); } catch { setErr('Could not enroll'); } finally { setBusy(''); } };
  if (err && !list) return <Notice title="Something went wrong" text={err}/>; if (!list) return <Spinner/>;
  return (<div className="space-y-4"><h1 className="text-2xl font-semibold">Course Catalog</h1>
    {!list.length ? <div className="rounded-2xl bg-card p-6 text-slate-400">No courses published yet. Log in as an agency (agency@demo.com) to create one.</div> :
    <div className="grid gap-4 sm:grid-cols-2">{list.map((c, i) => (<motion.div key={c.id} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }} whileHover={{ y: -3 }} className="rounded-2xl bg-card p-5">
      {c.recommended && !c.enrolled && <span className="mb-2 inline-block rounded-full bg-cyan-400/15 px-2 py-0.5 text-xs text-cyan-300">Recommended: closes your {c.skill} gap</span>}
      <div className="font-semibold">{c.title}</div><div className="text-xs text-slate-400">{c.agency} · {c.skill} · {c.level} · {c.weeks} wks · {c.mode}</div>
      {c.description && <p className="mt-2 text-sm text-slate-300">{c.description}</p>}
      <button className="btn mt-3" disabled={c.enrolled || busy === c.id} onClick={() => join(c.id)}>{c.enrolled ? 'Enrolled ✓' : busy === c.id ? 'Enrolling…' : 'Enroll'}</button></motion.div>))}</div>}</div>);
}
