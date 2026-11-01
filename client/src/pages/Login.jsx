import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../App.jsx';
import { Icon } from '../components/ui.jsx';

const DEMO = [
  { label: 'Principal / Admin', email: 'admin@Shule ya Msingi.ac.ke', password: 'admin123', icon: 'shield', color: 'from-emerald-500 to-teal-600' },
  { label: 'Teacher', email: 'teacher@Shule ya Msingi.ac.ke', password: 'teacher123', icon: 'book', color: 'from-sky-500 to-indigo-600' },
  { label: 'Bursar / Accounts', email: 'accounts@Shule ya Msingi.ac.ke', password: 'accounts123', icon: 'cash', color: 'from-amber-500 to-orange-600' },
  { label: 'Parent', email: 'parent@Shule ya Msingi.ac.ke', password: 'parent123', icon: 'heart', color: 'from-rose-500 to-pink-600' },
];

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const doLogin = async (em, pw) => {
    setBusy(true); setError('');
    try {
      const u = await login(em, pw);
      navigate(['Parent', 'Student'].includes(u.role) ? '/portal' : '/');
    } catch (e) {
      setError(e.message);
    } finally { setBusy(false); }
  };

  return (
    <div className="flex min-h-screen">
      {/* Brand panel */}
      <div className="relative hidden w-[46%] flex-col justify-between overflow-hidden bg-ink-900 p-10 text-white lg:flex">
        <div className="absolute -right-24 -top-24 h-80 w-80 rounded-full bg-brand-500/20 blur-3xl" />
        <div className="absolute -bottom-32 -left-16 h-96 w-96 rounded-full bg-teal-400/10 blur-3xl" />
        <div className="relative flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-brand-400 to-brand-600 text-xl font-black shadow-lg">E</span>
          <div>
            <p className="text-lg font-extrabold leading-none">Elimu360</p>
            <p className="text-xs text-slate-400">School Suite • Kenya 🇰🇪</p>
          </div>
        </div>
        <div className="relative">
          <h1 className="text-4xl font-black leading-tight">The complete CBC/CBE<br />school system.</h1>
          <p className="mt-3 max-w-md text-[15px] leading-relaxed text-slate-300">
            Zeraki-style exam analytics, M-Pesa fee management, CBC competency tracking,
            auto-timetables and intelligent learner insights — one platform for PP1 to Senior School.
          </p>
          <div className="mt-7 grid max-w-md grid-cols-2 gap-3 text-[13px]">
            {[
              ['chart', 'Analytics — merit lists, mean scores & subject analysis'],
              ['cash', 'Finance — fee structures, M-Pesa & balances'],
              ['layers', 'Learning — strands, projects & core competencies'],
              ['bulb', 'Insights — at-risk learners & grade prediction'],
            ].map(([icon, text]) => (
              <div key={text} className="flex gap-2.5 rounded-xl bg-white/5 p-3">
                <span className="mt-0.5 text-brand-300"><Icon name={icon} size={17} /></span>
                <span className="leading-snug text-slate-200">{text}</span>
              </div>
            ))}
          </div>
        </div>
        <p className="relative text-xs text-slate-500">KPSEA • KJSEA • STEM / Social Sciences / Arts & Sports pathways • NEMIS & UPI ready</p>
      </div>

      {/* Form panel */}
      <div className="flex flex-1 items-center justify-center bg-[#f1f5f4] p-6">
        <div className="w-full max-w-md animate-fadeUp">
          <div className="mb-6 flex items-center gap-3 lg:hidden">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-brand-400 to-brand-600 text-lg font-black text-white">E</span>
            <p className="text-lg font-extrabold text-slate-800">Elimu360 School Suite</p>
          </div>
          <h2 className="text-2xl font-extrabold text-slate-800">Karibu tena 👋</h2>
          <p className="mt-1 text-sm text-slate-500">Sign in to Shule ya Msingi Academy — Ruiru, Kiambu County</p>

          <form className="card mt-6 space-y-4 p-6" onSubmit={(e) => { e.preventDefault(); doLogin(email, password); }}>
            <label className="block">
              <span className="mb-1 block text-xs font-semibold text-slate-500">Email address</span>
              <input className="input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@school.ac.ke" required />
            </label>
            <label className="block">
              <span className="mb-1 block text-xs font-semibold text-slate-500">Password</span>
              <input className="input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" required />
            </label>
            {error && <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm font-medium text-rose-700">{error}</p>}
            <button className="btn-primary w-full justify-center py-2.5" disabled={busy}>{busy ? 'Signing in…' : 'Sign In'}</button>
          </form>

          <p className="mt-6 text-center text-xs font-bold uppercase tracking-widest text-slate-400">One-click demo accounts</p>
          <div className="mt-3 grid grid-cols-2 gap-3">
            {DEMO.map((d) => (
              <button key={d.email} disabled={busy} onClick={() => doLogin(d.email, d.password)}
                className="card group flex items-center gap-3 p-3 text-left transition hover:shadow-md">
                <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br text-white ${d.color}`}><Icon name={d.icon} size={16} /></span>
                <span className="min-w-0">
                  <span className="block truncate text-[13px] font-bold text-slate-700 group-hover:text-brand-700">{d.label}</span>
                  <span className="block truncate text-[11px] text-slate-400">{d.email}</span>
                </span>
              </button>
            ))}
          </div>
          <p className="mt-5 text-center text-xs text-slate-400">Demo passwords are shown on the login card after autofill — e.g. admin123, teacher123, parent123.</p>
        </div>
      </div>
    </div>
  );
}
