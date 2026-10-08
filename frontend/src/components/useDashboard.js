import { useEffect, useState } from 'react'; import { dashboard } from '../services/authService';
export default function useDashboard(path) {
  const [s, set] = useState({ data: null, error: null }); const [n, setN] = useState(0);
  useEffect(() => { const t = setInterval(() => setN(x => x + 1), 15000); return () => clearInterval(t); }, []);   // live refresh
  useEffect(() => { dashboard(path).then(data => set({ data, error: null }))
    .catch(e => set({ data: null, error: e.response ? (e.response.data?.message || 'Request failed') : 'Network error. Is the API running?' })); }, [path, n]);
  return { ...s, reload: () => setN(x => x + 1) };
}
