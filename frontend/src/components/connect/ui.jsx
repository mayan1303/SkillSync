import { useState } from 'react'; import { X } from 'lucide-react';
const GR = [['#22d3ee', '#818cf8'], ['#a78bfa', '#f472b6'], ['#34d399', '#22d3ee'], ['#fbbf24', '#f87171'], ['#60a5fa', '#a78bfa'], ['#f472b6', '#fb923c']];
export const initials = n => (n || '?').split(' ').filter(Boolean).map(w => w[0]).slice(0, 2).join('').toUpperCase();
export function Avatar({ name, size = 40 }) {
  const g = GR[[...(name || '?')].reduce((a, c) => a + c.charCodeAt(0), 0) % GR.length];
  return <div className="grid shrink-0 place-items-center rounded-full font-semibold text-slate-950" style={{ width: size, height: size, fontSize: size * 0.38, background: `linear-gradient(135deg,${g[0]},${g[1]})` }}>{initials(name)}</div>;
}
const TONE = { slate: 'border-white/10 bg-white/5 text-slate-300', cyan: 'border-cyan-400/40 bg-cyan-400/10 text-cyan-200', green: 'border-emerald-400/40 bg-emerald-400/10 text-emerald-200', violet: 'border-violet-400/40 bg-violet-400/10 text-violet-200', amber: 'border-amber-400/40 bg-amber-400/10 text-amber-200', dim: 'border-white/5 bg-transparent text-slate-500' };
export const Chip = ({ children, tone = 'slate', onRemove, className = '' }) => (
  <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs ${TONE[tone]} ${className}`}>{children}{onRemove && <button type="button" onClick={onRemove} aria-label="Remove"><X size={11}/></button>}</span>);
export const DemoBadge = () => <span title="Seeded from the Skill Connect dataset. Replies are automatic." className="rounded border border-amber-400/40 px-1 text-[10px] uppercase tracking-wide text-amber-300">demo</span>;
export function ScoreRing({ value, size = 56 }) {
  const r = size / 2 - 5, c = 2 * Math.PI * r, col = value >= 70 ? '#34d399' : value >= 45 ? '#22d3ee' : '#a78bfa';
  return (<div className="relative shrink-0" style={{ width: size, height: size }}><svg width={size} height={size} className="-rotate-90"><circle cx={size / 2} cy={size / 2} r={r} stroke="rgba(255,255,255,.1)" strokeWidth="4" fill="none"/>
    <circle cx={size / 2} cy={size / 2} r={r} stroke={col} strokeWidth="4" fill="none" strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c * (1 - Math.min(100, value) / 100)} style={{ transition: 'stroke-dashoffset .8s' }}/></svg>
    <div className="absolute inset-0 grid place-items-center text-xs font-semibold">{Math.round(value)}%</div></div>);
}
export const Bar = ({ label, value }) => (<div className="text-xs"><div className="mb-0.5 flex justify-between text-slate-400"><span>{label}</span><span>{Math.round(value)}</span></div>
  <div className="h-1.5 rounded-full bg-white/10"><div className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-violet-400" style={{ width: `${Math.min(100, value)}%`, transition: 'width .8s' }}/></div></div>);
export function timeAgo(iso) {
  if (!iso) return ''; const s = Math.max(0, (Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return 'just now'; if (s < 3600) return `${Math.floor(s / 60)}m`; if (s < 86400) return `${Math.floor(s / 3600)}h`; return `${Math.floor(s / 86400)}d`;
}
/** Chips + text box. Enter or comma adds. `suggestions` feeds a datalist. */
export function TagInput({ value, onChange, suggestions = [], placeholder, id }) {
  const [t, setT] = useState(''); const lid = `dl-${id}`;
  const add = () => { const v = t.trim().replace(/,$/, ''); if (v && !value.some(x => x.toLowerCase() === v.toLowerCase()) && value.length < 30) onChange([...value, v]); setT(''); };
  return (<div><div className="mb-2 flex flex-wrap gap-1.5">{value.map(v => <Chip key={v} tone="cyan" onRemove={() => onChange(value.filter(x => x !== v))}>{v}</Chip>)}</div>
    <input className="input" list={lid} value={t} placeholder={placeholder} maxLength={40} onChange={e => setT(e.target.value)} onBlur={add}
      onKeyDown={e => { if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); add(); } }}/>
    <datalist id={lid}>{suggestions.slice(0, 80).map(s => <option key={s} value={s}/>)}</datalist></div>);
}
export const TYPE_META = { LEARN: ['Wants to learn', 'violet'], TEACH: ['Can teach', 'green'], UPDATE: ['Update', 'slate'] };
