import React, { useEffect, useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { Icon, Avatar } from './ui.jsx';
import { useAuth } from '../App.jsx';

export const NAV = [
  { to: '/', label: 'Dashboard', icon: 'home', roles: ['Admin', 'Teacher', 'Accountant'] },
  { to: '/students', label: 'Learners', icon: 'users', roles: ['Admin', 'Teacher', 'Accountant'] },
  { to: '/staff', label: 'Staff & Teachers', icon: 'briefcase', roles: ['Admin'] },
  { to: '/academics', label: 'Academics (CBC)', icon: 'book', roles: ['Admin', 'Teacher'] },
  { to: '/exams', label: 'Exams & Marks', icon: 'clipboard', roles: ['Admin', 'Teacher'] },
  { to: '/analytics', label: 'Analytics', icon: 'chart', roles: ['Admin', 'Teacher'] },
  { to: '/reports', label: 'Report Forms', icon: 'award', roles: ['Admin', 'Teacher'] },
  { to: '/finance', label: 'Finance & Fees', icon: 'cash', roles: ['Admin', 'Accountant'] },
  { to: '/attendance', label: 'Attendance', icon: 'check', roles: ['Admin', 'Teacher'] },
  { to: '/timetable', label: 'Timetable', icon: 'clock', roles: ['Admin', 'Teacher'] },
  { to: '/learning', label: 'CBC Learning', icon: 'layers', roles: ['Admin', 'Teacher'] },
  { to: '/insights', label: 'Learner Insights ✨', icon: 'bulb', roles: ['Admin', 'Teacher'] },
  { to: '/communications', label: 'SMS & Notices', icon: 'chat', roles: ['Admin', 'Accountant'] },
  { to: '/operations', label: 'Operations', icon: 'truck', roles: ['Admin', 'Teacher', 'Accountant'] },
  { to: '/portal', label: 'Parent Portal', icon: 'heart', roles: ['Admin', 'Parent', 'Student'] },
  { to: '/settings', label: 'Settings', icon: 'cog', roles: ['Admin'] },
];

function Toasts() {
  const [toasts, setToasts] = useState([]);
  useEffect(() => {
    const handler = (e) => {
      const t = e.detail;
      setToasts((prev) => [...prev, t]);
      setTimeout(() => setToasts((prev) => prev.filter((x) => x.id !== t.id)), 3400);
    };
    window.addEventListener('elimu-toast', handler);
    return () => window.removeEventListener('elimu-toast', handler);
  }, []);
  return (
    <div className="fixed bottom-4 right-4 z-[100] space-y-2 no-print">
      {toasts.map((t) => (
        <div key={t.id} className={`animate-toast flex max-w-sm items-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold text-white shadow-lg ${t.type === 'error' ? 'bg-rose-600' : 'bg-slate-800'}`}>
          <Icon name={t.type === 'error' ? 'x' : 'check'} size={16} /> {t.message}
        </div>
      ))}
    </div>
  );
}

export default function Layout() {
  const { user, settings, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const navigate = useNavigate();
  const items = NAV.filter((n) => n.roles.includes(user?.role));

  const Sidebar = (
    <div className="flex h-full flex-col bg-ink-900 text-slate-300">
      <div className="flex items-center gap-3 border-b border-white/10 px-5 py-4">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-brand-400 to-brand-600 text-lg font-black text-white shadow-lg">E</span>
        <div className="min-w-0">
          <p className="truncate text-[15px] font-extrabold text-white">Elimu360</p>
          <p className="truncate text-[11px] text-slate-400">{settings?.schoolName || 'School Suite'}</p>
        </div>
      </div>
      <nav className="flex-1 space-y-0.5 overflow-y-auto px-3 py-3">
        {items.map((n) => (
          <NavLink key={n.to} to={n.to} end={n.to === '/'} onClick={() => setMobileOpen(false)}
            className={({ isActive }) => `flex items-center gap-3 rounded-xl px-3 py-2 text-[13.5px] font-medium transition ${isActive ? 'bg-brand-600 text-white shadow-md' : 'hover:bg-white/10 hover:text-white'}`}>
            <Icon name={n.icon} size={17} /> {n.label}
          </NavLink>
        ))}
      </nav>
      <div className="border-t border-white/10 p-3">
        <div className="rounded-xl bg-white/5 px-3 py-2.5 text-[11px] leading-relaxed text-slate-400">
          🇰🇪 Kenyan CBC/CBE ready<br />
          <span className="text-slate-500">KPSEA • KJSEA • Senior School pathways</span>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-60 md:block no-print">{Sidebar}</aside>
      {/* Mobile sidebar */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 md:hidden no-print">
          <div className="absolute inset-0 bg-black/50" onClick={() => setMobileOpen(false)} />
          <aside className="absolute inset-y-0 left-0 w-64">{Sidebar}</aside>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col md:pl-60">
        <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-slate-200 bg-white/90 px-4 py-3 backdrop-blur no-print">
          <button className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 md:hidden" onClick={() => setMobileOpen(true)}><Icon name="menu" /></button>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-bold text-slate-800">{settings?.schoolName}</p>
            <p className="truncate text-xs text-slate-400">
              {settings?.motto} • Term {settings?.currentTerm}, {settings?.currentYear} • {settings?.county} County
            </p>
          </div>
          <span className="hidden rounded-full bg-brand-50 px-3 py-1 text-xs font-bold text-brand-700 sm:block">
            SMS Balance: {(settings?.smsBalance ?? 0).toLocaleString()}
          </span>
          <div className="flex items-center gap-2.5">
            <Avatar name={user?.name} />
            <div className="hidden leading-tight sm:block">
              <p className="max-w-[140px] truncate text-[13px] font-bold text-slate-700">{user?.name}</p>
              <p className="text-[11px] font-semibold uppercase tracking-wide text-brand-600">{user?.role}</p>
            </div>
            <button title="Log out" onClick={() => { logout(); navigate('/login'); }} className="rounded-lg p-2 text-slate-400 hover:bg-rose-50 hover:text-rose-600">
              <Icon name="logout" size={18} />
            </button>
          </div>
        </header>

        <main className="mx-auto w-full max-w-[1400px] flex-1 px-4 py-5 sm:px-6">
          <Outlet />
        </main>
        <footer className="px-6 pb-5 text-center text-[11px] text-slate-400 no-print">
          Elimu360 School Suite • Built for the Kenyan Competency Based Curriculum (CBC/CBE) • Inspired by Zeraki
        </footer>
      </div>
      <Toasts />
    </div>
  );
}
