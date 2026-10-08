import { useCallback, useEffect, useState } from 'react'; import { Handshake, MessageCircle, Newspaper, UserCog, Users, UsersRound } from 'lucide-react';
import { Spinner } from '../components/States'; import * as S from '../services/connectService';
import FeedTab from '../components/connect/FeedTab'; import MatchesTab from '../components/connect/MatchesTab'; import NetworkTab from '../components/connect/NetworkTab'; import MessagesTab from '../components/connect/MessagesTab'; import ProfileTab from '../components/connect/ProfileTab'; import MemberModal from '../components/connect/MemberModal';
const TABS = [['feed', 'Feed', Newspaper], ['matches', 'Matches', Users], ['network', 'Network', UsersRound], ['messages', 'Messages', MessageCircle], ['profile', 'My profile', UserCog]];
export default function SkillConnect() {
  const [me, setMe] = useState(null); const [err, setErr] = useState(''); const [tab, setTab] = useState('feed'); const [badges, setBadges] = useState({ incoming: 0, unread: 0 });
  const [skills, setSkills] = useState({ market: [], community: [] }); const [viewing, setViewing] = useState(null); const [chatWith, setChatWith] = useState(null); const [top, setTop] = useState(null); const [version, setVersion] = useState(0);
  useEffect(() => { S.getMe().then(setMe).catch(e => setErr(S.errMsg(e))); S.skillList().then(setSkills).catch(() => {}); }, []);
  const hasProfile = !!me?.profile;
  const refreshBadges = useCallback(() => S.badges().then(setBadges).catch(() => {}), []);
  const refreshTop = useCallback(() => S.matches().then(setTop).catch(() => setTop([])), []);
  useEffect(() => { if (!hasProfile) return; refreshBadges(); refreshTop(); const t = setInterval(refreshBadges, 5000); return () => clearInterval(t); }, [hasProfile, refreshBadges, refreshTop]);
  const changed = () => { setVersion(v => v + 1); refreshBadges(); refreshTop(); };
  const openChat = id => { setViewing(null); setChatWith(id); setTab('messages'); };
  const goTab = t => { if (t !== 'messages') setChatWith(null); setTab(t); };
  const saved = m => { const first = !hasProfile; setMe(m); S.skillList().then(setSkills).catch(() => {}); if (first) setTab('feed'); changed(); };
  return (<>{err && !me ? <div className="rounded-2xl bg-card p-6 text-red-300">{err}</div> : !me ? <Spinner/> :
    !hasProfile ? <ProfileTab me={me} skills={skills} onSaved={saved} onboarding/> :
    <div className="space-y-5"><div className="flex flex-wrap items-center justify-between gap-3"><h1 className="flex items-center gap-2 text-2xl font-semibold"><Handshake className="text-electric"/> Skill Connect</h1>
      <nav className="flex flex-wrap gap-1 rounded-2xl border border-white/10 bg-white/5 p-1" aria-label="Skill Connect sections">{TABS.map(([k, l, I]) => { const n = k === 'network' ? badges.incoming : k === 'messages' ? badges.unread : 0;
        return (<button key={k} onClick={() => goTab(k)} aria-current={tab === k} className={`relative flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-sm transition ${tab === k ? 'bg-cyan-400/20 text-cyan-100' : 'text-slate-400 hover:text-white'}`}><I size={15}/> {l}
          {n > 0 && <span className="grid h-4 min-w-4 place-items-center rounded-full bg-cyan-400 px-1 text-[10px] font-bold text-slate-950">{n}</span>}</button>); })}</nav></div>
      {tab === 'feed' && <FeedTab me={me} skills={skills} onView={setViewing} topMatches={top}/>}
      {tab === 'matches' && <MatchesTab onView={setViewing} onChat={openChat} onChanged={changed} version={version}/>}
      {tab === 'network' && <NetworkTab onView={setViewing} onChat={openChat} onChanged={changed} version={version}/>}
      {tab === 'messages' && <MessagesTab initialPeer={chatWith} onRead={refreshBadges}/>}
      {tab === 'profile' && <ProfileTab me={me} skills={skills} onSaved={saved}/>}
      {viewing && <MemberModal id={viewing} onClose={() => setViewing(null)} onChat={openChat} onChanged={changed}/>}</div>}</>);
}
