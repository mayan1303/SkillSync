import { Navigate } from 'react-router-dom'; import { useAuth, HOME } from '../context/AuthContext';
import Layout from './Layout'; import { Spinner, Notice } from './States';
/** UX guard only. The backend independently enforces every role. */
export default function ProtectedRoute({ role, children }) {
  const { user, loading, expired } = useAuth();
  if (loading) return <Spinner/>;
  if (!user) return <Navigate to="/login" replace state={{ expired }}/>;
  if (role && user.role !== role) return <Notice title="Access denied" text="This area belongs to another role." to={HOME[user.role]} cta="Go to my dashboard"/>;
  return <Layout>{children}</Layout>;
}
