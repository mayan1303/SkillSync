import { Link } from 'react-router-dom'; import { Loader2 } from 'lucide-react';
export const Spinner = () => <div className="grid h-60 place-items-center"><Loader2 className="animate-spin text-electric"/></div>;
export const Notice = ({ title, text, to, cta }) => (
  <div className="grid min-h-[60vh] place-items-center text-center"><div><h2 className="text-xl font-semibold">{title}</h2>
  <p className="my-2 text-slate-400">{text}</p>{to && <Link to={to} className="btn inline-block">{cta}</Link>}</div></div>);
