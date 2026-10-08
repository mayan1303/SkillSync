import { createContext, useContext, useEffect, useState } from 'react';
import * as auth from '../services/authService';
const Ctx = createContext(null); export const useAuth = () => useContext(Ctx);
export const HOME = { STUDENT: '/student', RECRUITER: '/recruiter', COURSE_AGENCY: '/agency' };
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null); const [loading, setLoading] = useState(true); const [expired, setExpired] = useState(false);
  useEffect(() => {
    auth.restore().then(setUser).catch(() => {}).finally(() => setLoading(false));
    const h = () => { setUser(null); setExpired(true); };
    window.addEventListener('wie:expired', h); return () => window.removeEventListener('wie:expired', h);
  }, []);
  const value = {
    user, loading, expired,
    login: async (e, p) => { const u = await auth.login(e, p); setExpired(false); setUser(u); return u; },
    register: async b => { const u = await auth.register(b); setExpired(false); setUser(u); return u; },
    logout: async () => { await auth.logout(); setUser(null); },
  };
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
