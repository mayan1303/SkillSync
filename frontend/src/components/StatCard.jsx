import { motion } from 'framer-motion'; import CountUp from './CountUp';
export default function StatCard({ label, value, suffix, i = 0 }) {
  return (<motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }} whileHover={{ y: -3 }}
    className="rounded-2xl bg-card p-5"><div className="text-sm text-slate-400">{label}</div>
    <div className="mt-1 text-3xl font-semibold"><CountUp to={value} suffix={suffix}/></div></motion.div>);
}
