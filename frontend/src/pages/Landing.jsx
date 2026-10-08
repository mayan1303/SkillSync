import { Link } from 'react-router-dom'; import { motion } from 'framer-motion';
const FLOW = ['Industry Demand', 'Skill Forecast', 'Talent Gap', 'Intervention', 'Future Workforce'];
export default function Landing() {
  return (<div className="mx-auto grid min-h-screen max-w-5xl content-center gap-10 p-6">
    <div><h1 className="bg-gradient-to-r from-white to-cyan-300 bg-clip-text text-4xl font-bold text-transparent md:text-6xl">Predict Tomorrow's Workforce.<br/>Build It Today.</h1>
      <p className="mt-4 max-w-2xl text-slate-400">An intelligent ecosystem that detects emerging skill shortages, predicts future workforce demand, and coordinates talent, recruiters and training providers before the gap becomes a crisis.</p>
      <div className="mt-6 flex gap-3"><Link to="/register" className="btn">Get Started</Link><Link to="/login" className="rounded-xl border border-white/10 px-4 py-2">Login</Link></div></div>
    <div className="flex flex-col items-center gap-2 md:flex-row">{FLOW.map((n, i) => (<div key={n} className="flex items-center gap-2">
      <motion.div initial={{ opacity: 0, scale: 0.85 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.25 }} className="rounded-xl bg-card px-4 py-3 text-sm">{n}</motion.div>
      {i < FLOW.length - 1 && <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.25 + 0.15 }} className="text-electric">→</motion.span>}</div>))}</div>
    <div className="grid gap-3 sm:grid-cols-3">{[['🎓 Students', 'See your future readiness and close skill gaps.'], ['🏢 Recruiters', 'Spot talent risk before it hits hiring.'], ['🏫 Course Agencies', 'Know exactly what to teach next.']].map(([t, x]) => (
      <div key={t} className="rounded-2xl bg-card p-5"><b>{t}</b><p className="mt-1 text-sm text-slate-400">{x}</p></div>))}</div></div>);
}
