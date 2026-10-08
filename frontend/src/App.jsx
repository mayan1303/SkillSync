import { Navigate, Route, Routes } from 'react-router-dom'; import { useAuth, HOME } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute'; import { Spinner } from './components/States';
import Landing from './pages/Landing'; import Login from './pages/Login'; import Register from './pages/Register';
import StudentDashboard from './pages/StudentDashboard'; import RecruiterDashboard from './pages/RecruiterDashboard'; import AgencyDashboard from './pages/AgencyDashboard';
import Simulator from './pages/Simulator'; import StudentWhatIf from './pages/StudentWhatIf'; import Assessment from './pages/Assessment'; import AgencyCourses from './pages/AgencyCourses'; import Catalog from './pages/Catalog'; import Feed from './pages/Feed'; import Market from './pages/Market'; import Predictor from './pages/Predictor'; import Alerts from './pages/Alerts'; import Outcomes from './pages/Outcomes'; import SkillConnect from './pages/SkillConnect';
function Home() { const { user, loading } = useAuth(); if (loading) return <Spinner/>; return user ? <Navigate to={HOME[user.role]} replace/> : <Landing/>; }
const P = ({ role, children }) => <ProtectedRoute role={role}>{children}</ProtectedRoute>;
export default function App() {
  return (<Routes><Route path="/" element={<Home/>}/><Route path="/login" element={<Login/>}/><Route path="/register" element={<Register/>}/>
    <Route path="/student" element={<P role="STUDENT"><StudentDashboard/></P>}/><Route path="/whatif" element={<P role="STUDENT"><StudentWhatIf/></P>}/>
    <Route path="/assessment" element={<P role="STUDENT"><Assessment/></P>}/>
    <Route path="/feed" element={<P role="STUDENT"><Feed/></P>}/><Route path="/connect" element={<P role="STUDENT"><SkillConnect/></P>}/><Route path="/catalog" element={<P role="STUDENT"><Catalog/></P>}/>
    <Route path="/agency/courses" element={<P role="COURSE_AGENCY"><AgencyCourses/></P>}/>
    <Route path="/recruiter" element={<P role="RECRUITER"><RecruiterDashboard/></P>}/><Route path="/agency" element={<P role="COURSE_AGENCY"><AgencyDashboard/></P>}/>
    <Route path="/market" element={<P><Market/></P>}/><Route path="/predictor" element={<P><Predictor/></P>}/>
    <Route path="/simulator" element={<P><Simulator/></P>}/><Route path="/alerts" element={<P><Alerts/></P>}/><Route path="/outcomes" element={<P><Outcomes/></P>}/>
    <Route path="*" element={<Navigate to="/" replace/>}/></Routes>);
}
