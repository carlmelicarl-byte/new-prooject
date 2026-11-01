import React, { createContext, useContext, useEffect, useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { api, getToken, getStoredUser, setSession, clearSession } from './lib/api.js';
import Layout from './components/Layout.jsx';
import Login from './pages/Login.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Students from './pages/Students.jsx';
import StudentProfile from './pages/StudentProfile.jsx';
import Staff from './pages/Staff.jsx';
import Academics from './pages/Academics.jsx';
import Exams from './pages/Exams.jsx';
import Analytics from './pages/Analytics.jsx';
import ReportForms from './pages/ReportForms.jsx';
import Finance from './pages/Finance.jsx';
import Attendance from './pages/Attendance.jsx';
import Timetable from './pages/Timetable.jsx';
import Learning from './pages/Learning.jsx';
import Insights from './pages/Insights.jsx';
import Communications from './pages/Communications.jsx';
import Operations from './pages/Operations.jsx';
import ParentPortal from './pages/ParentPortal.jsx';
import Settings from './pages/Settings.jsx';

const AuthCtx = createContext(null);
export const useAuth = () => useContext(AuthCtx);

// Which roles may open which route (mirrors Layout NAV)
const ROUTE_ROLES = {
  '/': ['Admin', 'Teacher', 'Accountant'],
  '/students': ['Admin', 'Teacher', 'Accountant'],
  '/staff': ['Admin'],
  '/academics': ['Admin', 'Teacher'],
  '/exams': ['Admin', 'Teacher'],
  '/analytics': ['Admin', 'Teacher'],
  '/reports': ['Admin', 'Teacher'],
  '/finance': ['Admin', 'Accountant'],
  '/attendance': ['Admin', 'Teacher'],
  '/timetable': ['Admin', 'Teacher'],
  '/learning': ['Admin', 'Teacher'],
  '/insights': ['Admin', 'Teacher'],
  '/communications': ['Admin', 'Accountant'],
  '/operations': ['Admin', 'Teacher', 'Accountant'],
  '/portal': ['Admin', 'Parent', 'Student'],
  '/settings': ['Admin'],
};

function Guard({ path, children }) {
  const { user } = useAuth();
  const allowed = ROUTE_ROLES[path] || ['Admin'];
  if (!allowed.includes(user.role)) {
    const home = ['Parent', 'Student'].includes(user.role) ? '/portal' : '/';
    return <Navigate to={home} replace />;
  }
  return children;
}

export default function App() {
  const [user, setUser] = useState(getStoredUser());
  const [settings, setSettings] = useState(null);

  const refreshSettings = () => api.get('/settings').then(setSettings).catch(() => {});

  useEffect(() => {
    if (user && getToken()) refreshSettings();
  }, [user]);

  const login = async (email, password) => {
    const { token, user: u } = await api.login(email, password);
    setSession(token, u);
    setUser(u);
    return u;
  };
  const logout = () => { clearSession(); setUser(null); setSettings(null); };

  return (
    <AuthCtx.Provider value={{ user, settings, login, logout, refreshSettings }}>
      <Routes>
        <Route path="/login" element={user ? <Navigate to={['Parent', 'Student'].includes(user.role) ? '/portal' : '/'} replace /> : <Login />} />
        <Route element={user ? <Layout /> : <Navigate to="/login" replace />}>
          <Route path="/" element={<Guard path="/"><Dashboard /></Guard>} />
          <Route path="/students" element={<Guard path="/students"><Students /></Guard>} />
          <Route path="/students/:id" element={<Guard path="/students"><StudentProfile /></Guard>} />
          <Route path="/staff" element={<Guard path="/staff"><Staff /></Guard>} />
          <Route path="/academics" element={<Guard path="/academics"><Academics /></Guard>} />
          <Route path="/exams" element={<Guard path="/exams"><Exams /></Guard>} />
          <Route path="/analytics" element={<Guard path="/analytics"><Analytics /></Guard>} />
          <Route path="/reports" element={<Guard path="/reports"><ReportForms /></Guard>} />
          <Route path="/finance" element={<Guard path="/finance"><Finance /></Guard>} />
          <Route path="/attendance" element={<Guard path="/attendance"><Attendance /></Guard>} />
          <Route path="/timetable" element={<Guard path="/timetable"><Timetable /></Guard>} />
          <Route path="/learning" element={<Guard path="/learning"><Learning /></Guard>} />
          <Route path="/insights" element={<Guard path="/insights"><Insights /></Guard>} />
          <Route path="/communications" element={<Guard path="/communications"><Communications /></Guard>} />
          <Route path="/operations" element={<Guard path="/operations"><Operations /></Guard>} />
          <Route path="/portal" element={<Guard path="/portal"><ParentPortal /></Guard>} />
          <Route path="/settings" element={<Guard path="/settings"><Settings /></Guard>} />
          <Route path="*" element={<Navigate to={['Parent', 'Student'].includes(user?.role) ? '/portal' : '/'} replace />} />
        </Route>
      </Routes>
    </AuthCtx.Provider>
  );
}
