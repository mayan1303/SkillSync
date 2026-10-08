import { motion } from 'framer-motion';
const tone = { STUDENT: 'border-blue-400', COLLEGE: 'border-purple-400', RECRUITER: 'border-emerald-400', COURSE_AGENCY: 'border-amber-400' };
export default function InterventionCards({ items }) {
  return (<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{items.map((x, i) => (
    <motion.div key={x.stakeholder} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }} whileHover={{ y: -3 }}
      className={`rounded-2xl border-t-2 bg-card p-4 ${tone[x.stakeholder]}`}>
      <div className="text-xs tracking-wide text-slate-400">{x.stakeholder.replace('_', ' ')}</div><p className="mt-1 text-sm">{x.action}</p></motion.div>))}</div>);
}
