import React from 'react';
import { Link } from 'react-router-dom';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';
import { api } from '../lib/api.js';
import { fmtKES, fmtDate } from '../lib/utils.js';
import { useFetch, Spinner, PageHeader, StatCard, Avatar, GradeChip, Icon, ProgressBar } from '../components/ui.jsx';
import { useAuth } from '../App.jsx';

const PIE_COLORS = ['#279a7c', '#f59e0b'];

export default function Dashboard() {
  const { user, settings } = useAuth();
  const { data, loading, error } = useFetch(() => api.get('/dashboard'));
  if (loading) return <Spinner />;
  if (error) return <p className="text-rose-600">{error}</p>;
  const d = data;

  return (
    <div>
      <PageHeader
        title={`Habari, ${user.name.split(' ').slice(-1)[0]} 👋`}
        subtitle={`${settings?.schoolName} — Term ${d.fees.term} ${d.fees.year} at a glance`}
        actions={<>
          <Link className="btn-ghost" to="/exams"><Icon name="clipboard" size={16} /> Enter Marks</Link>
          <Link className="btn-primary" to="/analytics"><Icon name="chart" size={16} /> View Analytics</Link>
        </>}
      />

      <div className="grid grid-cols-2 gap-4 xl:grid-cols-6 lg:grid-cols-3">
        <StatCard label="Total Learners" value={d.totalStudents} sub={`${d.gender.Male} boys • ${d.gender.Female} girls`} icon="users" />
        <StatCard label="Staff" value={d.totalStaff} sub={`${d.teachers} teaching staff`} icon="briefcase" color="bg-sky-50 text-sky-700" />
        <StatCard label="Attendance Today" value={`${d.attendanceToday.rate}%`} sub={`${d.attendanceToday.absentees} absent • ${fmtDate(d.attendanceToday.date)}`} icon="check" color="bg-violet-50 text-violet-700" />
        <StatCard label="School Mean" value={d.schoolMean} sub="Latest published exam" icon="target" color="bg-amber-50 text-amber-700" />
        <StatCard label="Fees Collected" value={`${d.fees.rate}%`} sub={`${fmtKES(d.fees.collected)} of ${fmtKES(d.fees.billed)}`} icon="cash" color="bg-emerald-50 text-emerald-700" />
        <StatCard label="Boarders / Transport" value={`${d.boarding} / ${d.transport}`} sub="Boarding & school bus learners" icon="truck" color="bg-rose-50 text-rose-700" />
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <div className="card p-5 lg:col-span-2">
          <h3 className="font-bold text-slate-800">School Performance Trend</h3>
          <p className="mb-3 text-xs text-slate-400">Mean score across all published assessments</p>
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={d.performanceTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="term" tick={{ fontSize: 12 }} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} />
              <Tooltip />
              <Line type="monotone" dataKey="mean" name="School mean" stroke="#1a7c64" strokeWidth={3} dot={{ r: 5, fill: '#1a7c64' }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="card p-5">
          <h3 className="font-bold text-slate-800">🏆 Top Learners</h3>
          <p className="mb-3 text-xs text-slate-400">Best in class — latest exam</p>
          <div className="space-y-3">
            {d.topLearners.map((t, i) => (
              <Link key={t.student.id} to={`/students/${t.student.id}`} className="flex items-center gap-3 rounded-xl p-1.5 transition hover:bg-slate-50">
                <span className="w-5 text-center text-sm font-black text-slate-300">{i + 1}</span>
                <Avatar name={t.student.name} />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-bold text-slate-700">{t.student.name}</span>
                  <span className="block text-xs text-slate-400">{t.className} {t.student.stream}</span>
                </span>
                <span className="text-right">
                  <span className="block text-sm font-extrabold text-slate-800">{t.mean}</span>
                  <GradeChip grade={t.meanGrade?.grade} />
                </span>
              </Link>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <div className="card p-5">
          <h3 className="mb-3 font-bold text-slate-800">Enrolment by Level (CBC)</h3>
          <ResponsiveContainer width="100%" height={210}>
            <BarChart data={d.byLevel} layout="vertical" margin={{ left: 24 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis type="number" tick={{ fontSize: 11 }} />
              <YAxis type="category" dataKey="level" tick={{ fontSize: 11 }} width={95} />
              <Tooltip />
              <Bar dataKey="count" name="Learners" fill="#279a7c" radius={[0, 6, 6, 0]} />
            </BarChart>
          </ResponsiveContainer>
          <div className="mt-2 flex items-center justify-center gap-6">
            <div className="h-[110px] w-[110px]">
              <ResponsiveContainer>
                <PieChart>
                  <Pie data={[{ name: 'Boys', value: d.gender.Male }, { name: 'Girls', value: d.gender.Female }]} dataKey="value" innerRadius={32} outerRadius={50} paddingAngle={3}>
                    {PIE_COLORS.map((c, i) => <Cell key={i} fill={c} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-1 text-sm">
              <p><span className="mr-2 inline-block h-2.5 w-2.5 rounded-full bg-brand-500" />Boys — {d.gender.Male}</p>
              <p><span className="mr-2 inline-block h-2.5 w-2.5 rounded-full bg-amber-500" />Girls — {d.gender.Female}</p>
            </div>
          </div>
        </div>

        <div className="card p-5">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="font-bold text-slate-800">Fee Collection — Term {d.fees.term}</h3>
            <Link to="/finance" className="text-xs font-bold text-brand-700 hover:underline">Open Finance →</Link>
          </div>
          <p className="text-3xl font-extrabold text-slate-800">{fmtKES(d.fees.collected)}</p>
          <p className="mb-2 text-sm text-slate-500">collected of {fmtKES(d.fees.billed)} billed • <span className="font-semibold text-rose-600">{fmtKES(d.fees.outstanding)} outstanding</span></p>
          <ProgressBar value={d.fees.rate} />
          <h4 className="mb-2 mt-5 text-xs font-bold uppercase tracking-wider text-slate-400">Recent payments</h4>
          <div className="space-y-2.5">
            {d.recentPayments.map((p) => (
              <div key={p.id} className="flex items-center justify-between gap-2 text-sm">
                <span className="min-w-0">
                  <span className="block truncate font-semibold text-slate-700">{p.studentName}</span>
                  <span className="block text-[11px] text-slate-400">{p.method} • {p.ref} • {fmtDate(p.date)}</span>
                </span>
                <span className="shrink-0 font-bold text-emerald-700">{fmtKES(p.amount)}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="card p-5">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="font-bold text-slate-800">Upcoming Events</h3>
            <Link to="/operations" className="text-xs font-bold text-brand-700 hover:underline">Calendar →</Link>
          </div>
          <div className="space-y-3">
            {d.upcomingEvents.map((e) => (
              <div key={e.id} className="flex gap-3">
                <span className="flex h-11 w-11 shrink-0 flex-col items-center justify-center rounded-xl bg-brand-50 text-brand-700">
                  <span className="text-base font-extrabold leading-none">{new Date(e.date).getDate()}</span>
                  <span className="text-[9px] font-bold uppercase">{new Date(e.date).toLocaleString('en', { month: 'short' })}</span>
                </span>
                <span className="min-w-0">
                  <span className="block truncate text-sm font-bold text-slate-700">{e.title}</span>
                  <span className="block text-xs text-slate-400">{e.time} • {e.venue} • {e.category}</span>
                </span>
              </div>
            ))}
          </div>
          <div className="mt-5 rounded-xl bg-gradient-to-br from-brand-600 to-teal-700 p-4 text-white">
            <p className="text-sm font-bold">✨ Elimu Insights</p>
            <p className="mt-1 text-xs leading-relaxed text-teal-100">Our engine flags learners at risk from grades, attendance & fees — and predicts their next grade.</p>
            <Link to="/insights" className="mt-3 inline-block rounded-lg bg-white/20 px-3 py-1.5 text-xs font-bold hover:bg-white/30">Open Insights →</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
