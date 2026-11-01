import React, { useEffect, useState } from 'react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { api } from '../lib/api.js';
import { fmtKES, fmtDate, studentName } from '../lib/utils.js';
import { useFetch, Spinner, Avatar, GradeChip, ProgressBar, Icon, Field } from '../components/ui.jsx';
import { useAuth } from '../App.jsx';
import { ReportCard } from './ReportForms.jsx';

export default function ParentPortal() {
  const { user, settings } = useAuth();
  const isStaff = user.role === 'Admin';
  const { data: students } = useFetch(() => (isStaff ? api.get('/students') : Promise.resolve([])));
  const [studentId, setStudentId] = useState(user.studentId || '');
  const [report, setReport] = useState(null);

  useEffect(() => { if (!studentId && students?.length) setStudentId(students[0].id); }, [students, studentId]);
  const { data, loading } = useFetch(() => (studentId ? api.get(`/students/${studentId}/profile`) : Promise.resolve(null)), [studentId]);
  const { data: announcements } = useFetch(() => api.get('/announcements'));
  const { data: assignments } = useFetch(() => (data ? api.get('/assignments') : Promise.resolve([])), [data]);

  const loadReport = async () => {
    const r = await api.get(`/students/${studentId}/report`);
    setReport(r);
    setTimeout(() => window.print(), 350);
  };

  if (loading || !data) return <Spinner label="Loading your child's portal…" />;
  const { student: s, class: cls, history, fees } = data;
  const latest = history[history.length - 1];
  const classAssignments = (assignments || []).filter((a) => a.classId === s.classId);

  return (
    <div>
      <div className="mb-5 animate-fadeUp">
        <h1 className="text-[22px] font-extrabold text-slate-800">{user.role === 'Parent' ? `Karibu, ${user.name.replace(/^(Mr|Mrs|Ms|Dr)\.?\s*/, '')} 👋` : 'Parent / Learner Portal'}</h1>
        <p className="text-sm text-slate-500">Follow your child's learning journey at {settings?.schoolName}</p>
      </div>

      {isStaff && (
        <div className="card mb-4 max-w-md p-4 no-print">
          <Field label="Preview portal as (admin view)">
            <select className="input" value={studentId} onChange={(e) => { setStudentId(e.target.value); setReport(null); }}>
              {(students || []).map((st) => <option key={st.id} value={st.id}>{studentName(st)} — {st.admNo}</option>)}
            </select>
          </Field>
        </div>
      )}

      <div className="card flex flex-wrap items-center gap-4 p-5 no-print">
        <Avatar name={studentName(s)} size="h-16 w-16 text-xl" />
        <div className="flex-1">
          <h2 className="text-xl font-extrabold text-slate-800">{studentName(s)}</h2>
          <p className="text-sm text-slate-500">{cls?.name} {s.stream} • {cls?.level} • Adm {s.admNo}</p>
        </div>
        <button className="btn-primary" onClick={loadReport}><Icon name="printer" size={15} /> Download Report Form</button>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-4 lg:grid-cols-4 no-print">
        <div className="card p-4"><p className="text-[11px] font-bold uppercase text-slate-400">Latest Mean</p><p className="mt-1 text-2xl font-extrabold">{latest?.mean ?? '—'} <GradeChip grade={latest?.meanGrade?.grade} /></p><p className="text-xs text-slate-400">{latest?.examName} • Pos {latest?.position}/{latest?.outOf}</p></div>
        <div className="card p-4"><p className="text-[11px] font-bold uppercase text-slate-400">Attendance</p><p className="mt-1 text-2xl font-extrabold">{data.attendanceRate}%</p><p className="text-xs text-slate-400">This term's register</p></div>
        <div className="card p-4"><p className="text-[11px] font-bold uppercase text-slate-400">Fee Balance</p><p className={`mt-1 text-2xl font-extrabold ${fees.balance > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>{fmtKES(fees.balance)}</p><p className="text-xs text-slate-400">Paybill {settings?.mpesaPaybill} • A/c {s.admNo}</p></div>
        <div className="card p-4"><p className="text-[11px] font-bold uppercase text-slate-400">Fees Paid</p><p className="mt-1 text-2xl font-extrabold text-emerald-700">{fmtKES(fees.paid)}</p><p className="text-xs text-slate-400">of {fmtKES(fees.billed)} billed</p></div>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-3 no-print">
        <div className="card p-5 lg:col-span-2">
          <h3 className="mb-3 font-bold text-slate-800">Academic Progress</h3>
          <ResponsiveContainer width="100%" height={210}>
            <LineChart data={history.map((h) => ({ name: h.examName.split('—')[1]?.trim() || h.examName, mean: h.mean }))}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="name" tick={{ fontSize: 10 }} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
              <Tooltip />
              <Line type="monotone" dataKey="mean" name="Mean score" stroke="#1a7c64" strokeWidth={3} dot={{ r: 4, fill: '#1a7c64' }} />
            </LineChart>
          </ResponsiveContainer>
          <table className="mt-4 w-full">
            <thead><tr><th className="th">Learning Area</th><th className="th">Score</th><th className="th">Grade</th><th className="th">Level</th></tr></thead>
            <tbody>{(latest?.subjects || []).map((r) => (
              <tr key={r.subjectId} className="hover:bg-slate-50"><td className="td font-medium">{r.subject}</td><td className="td font-bold">{r.score ?? '—'}</td><td className="td"><GradeChip grade={r.grade} /></td><td className="td text-slate-500">{r.label || ''}</td></tr>
            ))}</tbody>
          </table>
        </div>
        <div className="space-y-4">
          <div className="card p-5">
            <h3 className="mb-2 font-bold text-slate-800">Fee Payment</h3>
            <ProgressBar value={fees.billed ? (fees.paid / fees.billed) * 100 : 0} />
            <p className="mt-2 text-sm text-slate-500">{fees.billed ? Math.round((fees.paid / fees.billed) * 100) : 0}% paid for Term {fees.term}</p>
            <div className="mt-3 rounded-xl bg-brand-50 p-3 text-[13px] leading-relaxed text-brand-900">
              📱 <b>Pay with M-Pesa:</b><br />Lipa na M-Pesa → Paybill <b>{settings?.mpesaPaybill}</b><br />Account: <b>{s.admNo}</b>
            </div>
            {fees.payments.length > 0 && <p className="mt-3 text-xs text-slate-400">Last payment: {fmtKES(fees.payments[fees.payments.length - 1].amount)} via {fees.payments[fees.payments.length - 1].method} on {fmtDate(fees.payments[fees.payments.length - 1].date)}</p>}
          </div>
          <div className="card p-5">
            <h3 className="mb-2 font-bold text-slate-800">📝 Class Assignments</h3>
            {classAssignments.slice(0, 4).map((a) => (
              <div key={a.id} className="border-b border-slate-50 py-2"><p className="text-sm font-semibold text-slate-700">{a.title}</p><p className="text-xs text-slate-400">Due {fmtDate(a.dueDate)} • {a.totalMarks} marks • {a.type}</p></div>
            ))}
            {!classAssignments.length && <p className="text-sm text-slate-400">No assignments posted for this class yet.</p>}
          </div>
          <div className="card p-5">
            <h3 className="mb-2 font-bold text-slate-800">📢 School Notices</h3>
            {(announcements || []).slice(0, 3).map((a) => (
              <div key={a.id} className="border-b border-slate-50 py-2"><p className="text-sm font-semibold text-slate-700">{a.title}</p><p className="text-xs leading-relaxed text-slate-400">{a.body}</p></div>
            ))}
          </div>
        </div>
      </div>

      {report && <div className="mt-6"><ReportCard report={report} /></div>}
    </div>
  );
}
