import { useState } from 'react'; import { Link, useLocation, useNavigate } from 'react-router-dom'; import { useAuth, HOME } from '../context/AuthContext';
export default function Login() {
  const { login } = useAuth(); const nav = useNavigate(); const loc = useLocation();
  const [f, setF] = useState({ email: '', password: '' }); const [err, setErr] = useState(''); const [busy, setBusy] = useState(false);
  const submit = async e => { e.preventDefault(); setBusy(true); setErr('');
    try { const u = await login(f.email, f.password); nav(HOME[u.role], { replace: true }); }
    catch (x) { setErr(x.response ? `Server ${x.response.status}: ${x.response.data?.message || 'no message'}` : `Cannot reach API (${x.message}) at ${import.meta.env.VITE_API_URL}`); } finally { setBusy(false); } };
  return (<div className="grid min-h-screen place-items-center p-4"><form onSubmit={submit} className="w-full max-w-sm space-y-3 rounded-2xl bg-card p-6">
    <h1 className="text-xl font-semibold">Welcome back</h1>
    {loc.state?.expired && <p className="rounded-lg bg-amber-500/10 p-2 text-sm text-amber-300">Session expired. Please log in again.</p>}
    <input className="input" type="email" placeholder="Email" required value={f.email} onChange={e => setF({ ...f, email: e.target.value })}/>
    <input className="input" type="password" placeholder="Password" required value={f.password} onChange={e => setF({ ...f, password: e.target.value })}/>
    {err && <p className="text-sm text-red-400">{err}</p>}
    <button className="btn w-full" disabled={busy}>{busy ? 'Signing in…' : 'Login'}</button>
    <p className="text-center text-sm text-slate-400">New here? <Link className="text-electric" to="/register">Register</Link></p></form></div>);
}
