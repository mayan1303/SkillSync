import { animate } from 'framer-motion'; import { useEffect, useRef, useState } from 'react';
export default function CountUp({ to, suffix = '', decimals = 0 }) {
  const from = useRef(0); const [v, setV] = useState(0);
  useEffect(() => { const c = animate(from.current, to, { duration: 1.2, onUpdate: x => { from.current = x; setV(x); } }); return () => c.stop(); }, [to]);
  return <>{v.toFixed(decimals)}{suffix}</>;
}
