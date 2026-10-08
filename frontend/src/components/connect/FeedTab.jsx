import { useCallback, useEffect, useState } from 'react'; import { motion } from 'framer-motion'; import { CheckCircle2, Heart, MessageSquare, Send, Sparkles, Trash2 } from 'lucide-react'; import * as S from '../../services/connectService';
import { Avatar, Chip, DemoBadge, ScoreRing, TYPE_META, TagInput, timeAgo } from './ui';
const KINDS = [['LEARN', 'I want to learn'], ['TEACH', 'I can teach'], ['UPDATE', 'Update']];
function Composer({ skills, onPosted }) {
  const [type, setType] = useState('LEARN'); const [skill, setSkill] = useState(''); const [msg, setMsg] = useState(''); const [busy, setBusy] = useState(false); const [err, setErr] = useState('');
  const post = async e => { e.preventDefault(); if (!msg.trim()) return; setBusy(true); setErr('');
    try { await S.createPost({ type, skill, message: msg }); setMsg(''); setSkill(''); onPosted(); } catch (x) { setErr(S.errMsg(x)); } finally { setBusy(false); } };
  const all = [...new Set([...(skills.market || []), ...(skills.community || [])])];
  return (<form onSubmit={post} className="space-y-3 rounded-2xl bg-card p-4">
    <div className="flex flex-wrap gap-2">{KINDS.map(([k, l]) => <button type="button" key={k} onClick={() => setType(k)} className={`rounded-full border px-3 py-1 text-sm ${type === k ? 'border-cyan-400 bg-cyan-400/15 text-cyan-200' : 'border-white/10 text-slate-400 hover:text-white'}`}>{l}</button>)}</div>
    <textarea className="input min-h-[70px]" maxLength={600} value={msg} onChange={e => setMsg(e.target.value)} placeholder={type === 'LEARN' ? 'What do you want to learn, and what can you offer in return?' : type === 'TEACH' ? 'What can you help others with?' : 'Share an update, a project or a question'}/>
    <div className="flex flex-wrap items-center gap-2"><input className="input !w-56" list="dl-post" maxLength={40} value={skill} onChange={e => setSkill(e.target.value)} placeholder="Skill (optional)"/>
      <datalist id="dl-post">{all.slice(0, 100).map(s => <option key={s} value={s}/>)}</datalist><span className="text-xs text-slate-500">{msg.length}/600</span>
      <button disabled={busy || !msg.trim()} className="btn ml-auto inline-flex items-center gap-1.5"><Send size={15}/> Post</button></div>{err && <p className="text-sm text-red-300">{err}</p>}</form>);
}
function PostCard({ p, onView, onChanged, i }) {
  const [open, setOpen] = useState(false); const [txt, setTxt] = useState(''); const [err, setErr] = useState(''); const [liked, setLiked] = useState(p.likedByMe); const [n, setN] = useState(p.likeCount);
  useEffect(() => { setLiked(p.likedByMe); setN(p.likeCount); }, [p.likedByMe, p.likeCount]);
  const act = f => async () => { setErr(''); try { await f(); await onChanged(); } catch (e) { setErr(S.errMsg(e)); } };
  const like = async () => { setLiked(!liked); setN(n + (liked ? -1 : 1)); try { const r = await S.likePost(p.id); setLiked(r.likedByMe); setN(r.likeCount); } catch { setLiked(liked); setN(n); } };
  const comment = async e => { e.preventDefault(); if (!txt.trim()) return; setErr(''); try { await S.commentPost(p.id, txt); setTxt(''); await onChanged(); } catch (x) { setErr(S.errMsg(x)); } };
  const [lbl, tone] = TYPE_META[p.type] || TYPE_META.UPDATE;
  return (<motion.article initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(i, 8) * 0.04 }} className={`rounded-2xl bg-card p-4 ${p.status === 'CLOSED' ? 'opacity-70' : ''}`}>
    <div className="flex items-start gap-3"><button onClick={() => !p.mine && onView(p.authorId)} aria-label={`View ${p.authorName}`}><Avatar name={p.authorName} size={44}/></button>
      <div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-x-2"><button onClick={() => !p.mine && onView(p.authorId)} className="font-semibold hover:text-cyan-300">{p.mine ? 'You' : p.authorName}</button>{p.authorDemo && <DemoBadge/>}<span className="text-xs text-slate-500">· {timeAgo(p.createdAt)}</span></div>
        <div className="truncate text-xs text-slate-400">{p.authorGoal}</div></div>
      {p.mine && <div className="flex gap-2 text-slate-500"><button title={p.status === 'OPEN' ? 'Mark as resolved' : 'Reopen'} onClick={act(() => S.togglePost(p.id))} className="hover:text-emerald-300"><CheckCircle2 size={17}/></button>
        <button title="Delete post" onClick={act(() => S.deletePost(p.id))} className="hover:text-red-300"><Trash2 size={17}/></button></div>}</div>
    <div className="mt-3 flex flex-wrap items-center gap-1.5"><Chip tone={tone}>{lbl}{p.skill ? ` · ${p.skill}` : ''}</Chip>{p.status === 'CLOSED' && <Chip tone="dim">Resolved</Chip>}{p.relevance && <Chip tone="amber"><Sparkles size={11}/> {p.relevance}</Chip>}</div>
    <p className="mt-2 whitespace-pre-wrap break-words text-sm text-slate-200">{p.message}</p>
    <div className="mt-3 flex items-center gap-4 border-t border-white/5 pt-2 text-sm text-slate-400">
      <button onClick={like} className={`flex items-center gap-1 hover:text-pink-300 ${liked ? 'text-pink-400' : ''}`} aria-pressed={liked}><Heart size={16} fill={liked ? 'currentColor' : 'none'}/> {n}</button>
      <button onClick={() => setOpen(!open)} className="flex items-center gap-1 hover:text-cyan-300"><MessageSquare size={16}/> {p.comments.length}</button>
      {!p.mine && <button onClick={() => onView(p.authorId)} className="ml-auto text-cyan-300 hover:underline">{p.type === 'LEARN' ? 'Offer help' : 'Connect'}</button>}</div>
    {open && <div className="mt-2 space-y-2">{p.comments.map(c => <div key={c.id} className="flex gap-2 text-sm"><Avatar name={c.authorName} size={26}/><div className="rounded-xl bg-white/5 px-3 py-1.5"><span className="font-medium">{c.authorName}</span> <span className="text-xs text-slate-500">{timeAgo(c.createdAt)}</span><div className="text-slate-300">{c.text}</div></div></div>)}
      {p.canComment ? <form onSubmit={comment} className="flex gap-2"><input className="input" maxLength={1000} value={txt} onChange={e => setTxt(e.target.value)} placeholder="Write a reply"/><button className="btn !px-3" aria-label="Send reply"><Send size={15}/></button></form>
        : <p className="text-xs text-amber-300">{p.authorName} has turned off public replies. Connect and message them instead.</p>}</div>}
    {err && <p className="mt-1 text-xs text-red-300">{err}</p>}</motion.article>);
}
export default function FeedTab({ me, skills, onView, topMatches }) {
  const [posts, setPosts] = useState(null); const [type, setType] = useState('ALL'); const [mineOnly, setMine] = useState(false); const [sort, setSort] = useState('recent'); const [q, setQ] = useState(''); const [err, setErr] = useState('');
  const load = useCallback(() => S.feed({ type, mineOnly, sort, skill: q.trim() || undefined }).then(d => { setPosts(d); setErr(''); }).catch(e => setErr(S.errMsg(e))), [type, mineOnly, sort, q]);
  useEffect(() => { const t = setTimeout(load, q ? 300 : 0); return () => clearTimeout(t); }, [load]);
  useEffect(() => { const t = setInterval(load, 20000); return () => clearInterval(t); }, [load]);
  const pill = (on) => `rounded-full border px-3 py-1 text-sm ${on ? 'border-cyan-400 bg-cyan-400/15 text-cyan-200' : 'border-white/10 text-slate-400 hover:text-white'}`;
  const p = me.profile;
  return (<div className="grid gap-5 lg:grid-cols-[250px_minmax(0,1fr)_280px]">
    <aside className="hidden space-y-3 lg:block"><div className="rounded-2xl bg-card p-4 text-center"><div className="mx-auto w-fit"><Avatar name={p.name} size={64}/></div><div className="mt-2 font-semibold">{p.name}</div><div className="text-xs text-slate-400">{p.careerGoal || 'Add a career goal'}</div>
      <div className="mt-3 flex flex-wrap justify-center gap-1">{p.currentSkills.slice(0, 5).map(s => <Chip key={s.name} tone="cyan">{s.name}</Chip>)}</div></div>
      <div className="rounded-2xl bg-card p-4 text-sm"><div className="mb-1 text-slate-400">Learning</div><div className="flex flex-wrap gap-1">{p.learningSkills.length ? p.learningSkills.map(s => <Chip key={s} tone="violet">{s}</Chip>) : <span className="text-slate-500">Nothing yet</span>}</div></div></aside>
    <section className="space-y-3"><Composer skills={skills} onPosted={load}/>
      <div className="flex flex-wrap items-center gap-2"><button className={pill(type === 'ALL' && !mineOnly)} onClick={() => { setType('ALL'); setMine(false); }}>All</button>
        <button className={pill(type === 'LEARN')} onClick={() => { setType('LEARN'); setMine(false); }}>Learning</button><button className={pill(type === 'TEACH')} onClick={() => { setType('TEACH'); setMine(false); }}>Teaching</button>
        <button className={pill(mineOnly)} onClick={() => { setMine(!mineOnly); setType('ALL'); }}>My posts</button>
        <button className={`${pill(sort === 'relevant')} ml-auto inline-flex items-center gap-1`} onClick={() => setSort(sort === 'relevant' ? 'recent' : 'relevant')}><Sparkles size={13}/> For you first</button></div>
      <input className="input" value={q} onChange={e => setQ(e.target.value)} placeholder="Search posts by skill, e.g. Python" aria-label="Search posts"/>
      {err && !posts && <p className="text-red-300">{err}</p>}{!posts && !err && <p className="text-slate-400">Loading feed...</p>}
      {posts && posts.length === 0 && <div className="rounded-2xl bg-card p-8 text-center text-slate-400">No posts here yet. Be the first to post what you want to learn or teach.</div>}
      {posts && posts.map((x, i) => <PostCard key={x.id} p={x} i={i} onView={onView} onChanged={load}/>)}</section>
    <aside className="space-y-3"><div className="rounded-2xl bg-card p-4"><h3 className="mb-3 font-semibold">Best matches for you</h3>
      {!topMatches && <p className="text-sm text-slate-500">Loading...</p>}{topMatches && topMatches.length === 0 && <p className="text-sm text-slate-500">Add skills you want to learn to see matches.</p>}
      <div className="space-y-3">{(topMatches || []).slice(0, 5).map(m => (<button key={m.id} onClick={() => onView(m.id)} className="flex w-full items-center gap-3 text-left"><Avatar name={m.name} size={38}/>
        <div className="min-w-0 flex-1"><div className="truncate text-sm font-medium">{m.name}</div><div className="truncate text-xs text-slate-400">{m.match.matched.length ? m.match.matched.join(', ') : m.careerGoal}</div></div><ScoreRing value={m.match.score} size={42}/></button>))}</div></div></aside></div>);
}
