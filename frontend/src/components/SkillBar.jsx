import { motion } from 'framer-motion';
export default function SkillBar({ name, level }) {
  return (<div className="mb-3"><div className="mb-1 flex justify-between text-sm"><span>{name}</span><span className="text-slate-400">{level}%</span></div>
    <div className="h-2 rounded-full bg-white/10"><motion.div className="h-2 rounded-full bg-gradient-to-r from-electric to-purple-500"
      initial={{ width: 0 }} animate={{ width: `${level}%` }} transition={{ duration: 1 }}/></div></div>);
}
