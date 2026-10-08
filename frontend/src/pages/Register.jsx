import { useState } from 'react'; import { Link, useNavigate } from 'react-router-dom'; import { motion } from 'framer-motion';
import { useAuth, HOME } from '../context/AuthContext';
const TYPOS = ['gmial.com', 'gmai.com', 'gamil.com', 'gmail.co', 'gmail.con', 'gnail.com', 'gmail.cm', 'gmil.com'];
function emailProblem(e) {
  if (!e) return ''; if (!/^[A-Za-z0-9._%+-]+@[A-Za-z0-9-]+(\.[A-Za-z0-9-]+)*\.[A-Za-z]{2,}$/.test(e)) return 'Enter a valid email address';
  const [l, d] = e.toLowerCase().split('@'); if (TYPOS.includes(d)) return `Did you mean ${l}@gmail.com?`;
  if (d === 'gmail.com' && (!/^[a-z0-9.]{6,30}$/.test(l) || l.startsWith('.') || l.endsWith('.') || l.includes('..'))) return 'Invalid Gmail address: 6-30 letters, numbers or dots, no leading, trailing or double dots';
  return '';
}
const ROLES = [['STUDENT', '🎓 Student'], ['RECRUITER', '🏢 Recruiter'], ['COURSE_AGENCY', '🏫 Course Agency']];
const FIELDS = {
  STUDENT: ['college', 'degree', 'branch', 'graduationYear', 'skills', 'interests'],
  RECRUITER: ['company', 'designation', 'industry', 'companySize', 'hiringDomains'],
  COURSE_AGENCY: ['contactPerson', 'specialization', 'trainingDomains', 'deliveryMode', 'location'] };
const LIST = ['skills', 'interests', 'hiringDomains', 'trainingDomains'];
const label = k => k.replace(/([A-Z])/g, ' $1').replace(/^./, c => c.toUpperCase());
export default function Register() {
  const { register } = useAuth(); const nav = useNavigate();
  const [role, setRole] = useState(null); const [b, setB] = useState({ name: '', email: '', password: '' }); const [p, setP] = useState({});
  const [err, setErr] = useState(''); const [busy, setBusy] = useState(false);
  const submit = async e => { e.preventDefault(); setErr(''); setBusy(true);
    const profile = Object.fromEntries(Object.entries(p).map(([k, v]) => [k, LIST.includes(k) ? v.split(',').map(s => s.trim()).filter(Boolean) : v]));
    try { const u = await register({ ...b, role, profile }); nav(HOME[u.role], { replace: true }); }
    catch (x) { const d = x.response?.data; setErr(d?.details ? Object.values(d.details).join(' · ') : d?.message || (x.response ? `Server ${x.response.status}` : `Cannot reach API (${x.message}) at ${import.meta.env.VITE_API_URL}`)); } finally { setBusy(false); } };
  if (!role) return (<div className="grid min-h-screen place-items-center p-4"><div className="w-full max-w-xl">
    <h1 className="mb-4 text-center text-xl font-semibold">Choose your role</h1>
    <div className="grid gap-3 sm:grid-cols-3">{ROLES.map(([r, t]) => (
      <motion.button whileHover={{ y: -3 }} key={r} onClick={() => setRole(r)} className="rounded-2xl bg-card p-6 text-lg">{t}</motion.button>))}</div>
    <p className="mt-4 text-center text-sm text-slate-400">Have an account? <Link className="text-electric" to="/login">Login</Link></p></div></div>);
  return (<div className="grid min-h-screen place-items-center p-4"><form onSubmit={submit} className="w-full max-w-md space-y-3 rounded-2xl bg-card p-6">
    <button type="button" onClick={() => setRole(null)} className="text-sm text-slate-400">← Change role</button>
    <input className="input" placeholder="Full name" required value={b.name} onChange={e => setB({ ...b, name: e.target.value })}/>
    <input className="input" type="email" placeholder="Email" required value={b.email} onChange={e => setB({ ...b, email: e.target.value })}/>
    {emailProblem(b.email) && <p className="text-xs text-amber-300">{emailProblem(b.email)}</p>}
    <input className="input" type="password" placeholder="Password (10+ chars, upper, lower, digit)" required minLength={10} value={b.password} onChange={e => setB({ ...b, password: e.target.value })}/>
    {FIELDS[role].map(k => <input key={k} className="input" placeholder={label(k) + (k === 'skills' ? ' e.g. Python:90, Docker:40' : LIST.includes(k) ? ' (comma separated)' : '')}
      required={!LIST.includes(k)} value={p[k] || ''} onChange={e => setP({ ...p, [k]: e.target.value })}/>)}
    {err && <p className="text-sm text-red-400">{err}</p>}<button className="btn w-full" disabled={busy || !!emailProblem(b.email)}>{busy ? 'Creating…' : 'Create account'}</button></form></div>);
}
