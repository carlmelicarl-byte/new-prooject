import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, RadarChart, Radar, PolarGrid, PolarAngleAxis } from 'recharts';
import { api } from '../lib/api.js';
import { fmtKES, fmtDate, LEVEL_NAMES, studentName } from '../lib/utils.js';
import { useFetch, Spinner, Avatar, GradeChip, Tabs, ProgressBar, Icon } from '../components/ui.jsx';

export default function StudentProfile() {
  const { id } = useParams();
  const [tab, setTab] = useState('academics');
  const { data, loading, error } = useFetch(() => api.get(`/students/${id}/profile`), [id]);
  if (loading) return <Spinner />;
  if (error || !data) return <p className="text-rose-600">{error || 'Not found'}</p>;
  const { student: s, class: cls, history, fees, competency } = data;
  const latest = history[history.length - 1];

  const radarData = competency
    ? Object.entries(competency.ratings).map(([k, v]) => ({ competency: k.split(' & ')[0].split(' ')[0], full: k, level: v }))
    : [];

  const Info = ({ label, value }) => (
    <div><p className="text-[11px] font-bold uppercase tracking-wide text-slate-400">{label}</p><p className="mt-0.5 text-sm font-semibold text-slate-700">{value || '—'}</p></div>
  );

  return (
    <div>
      <Link to="/students" className="mb-3 inline-block text-sm font-semibold text-brand-700 hover:underline no-print">← All learners</Link>
      <div className="card flex flex-wrap items-center gap-4 p-5 animate-fadeUp">
        <Avatar name={studentName(s)} size="h-16 w-16 text-xl" />
        <div className="min-w-0 flex-1">
          <h1 className="text-xl font-extrabold text-slate-800">{studentName(s)}</h1>
          <p className="text-sm text-slate-500">{cls?.name} {s.stream} • {cls?.level}{s.pathway ? ` • ${s.pathway} pathway` : ''} • {s.house} House</p>
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-bold text-slate-600">{s.admNo}</span>
            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-bold text-slate-600">{s.upi}</span>
            {s.boarding && <span className="rounded-full bg-indigo-50 px-2 py-0.5 text-[11px] font-bold text-indigo-700">Boarder</span>}
            {s.kpseaScore && <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-bold text-amber-700">KPSEA: {s.kpseaScore}/40 pts</span>}
          </div>
        </div>
        <div className="flex gap-5 text-center">
          <div><p className="text-2xl font-extrabold text-slate-800">{latest?.mean ?? '—'}</p><p className="text-[11px] font-bold uppercase text-slate-400">Latest mean</p>{latest?.meanGrade && <GradeChip grade={latest.meanGrade.grade} />}</div>
          <div><p className="text-2xl font-extrabold text-slate-800">{data.attendanceRate}%</p><p className="text-[11px] font-bold uppercase text-slate-400">Attendance</p></div>
          <div><p className={`text-2xl font-extrabold ${fees.balance > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>{fmtKES(fees.balance)}</p><p className="text-[11px] font-bold uppercase text-slate-400">Fee balance</p></div>
        </div>
      </div>

      <div className="mt-4">
        <Tabs tabs={[
          { id: 'academics', label: '📈 Academics' },
          { id: 'competencies', label: '🌟 CBC Competencies' },
          { id: 'fees', label: '💰 Fee Statement' },
          { id: 'biodata', label: '🧾 Bio-Data' },
        ]} active={tab} onChange={setTab} />
      </div>

      {tab === 'academics' && (
        <div className="grid gap-4 lg:grid-cols-5">
          <div className="card p-5 lg:col-span-2">
            <h3 className="mb-3 font-bold text-slate-800">Performance Trend</h3>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={history.map((h) => ({ name: h.examName.split('—')[1]?.trim() || h.examName, mean: h.mean }))}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="name" tick={{ fontSize: 10 }} interval={0} angle={-12} textAnchor="end" height={46} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Line type="monotone" dataKey="mean" stroke="#1a7c64" strokeWidth={3} dot={{ r: 4, fill: '#1a7c64' }} />
              </LineChart>
            </ResponsiveContainer>
            <div className="mt-3 space-y-2">
              {history.map((h) => (
                <div key={h.examId} className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2 text-sm">
                  <span className="font-semibold text-slate-600">{h.examName}</span>
                  <span className="flex items-center gap-2"><span className="text-xs text-slate-400">Pos {h.position ?? '—'}/{h.outOf}</span><b>{h.mean}</b><GradeChip grade={h.meanGrade?.grade} /></span>
                </div>
              ))}
            </div>
          </div>
          <div className="card overflow-x-auto p-0 lg:col-span-3">
            <h3 className="p-5 pb-2 font-bold text-slate-800">Latest Results — {latest?.examName}</h3>
            <table className="w-full">
              <thead><tr><th className="th">Learning Area</th><th className="th">Score</th><th className="th">Grade</th><th className="th">Performance Level</th></tr></thead>
              <tbody>
                {(latest?.subjects || []).map((r) => (
                  <tr key={r.subjectId} className="hover:bg-slate-50">
                    <td className="td font-medium">{r.subject}</td>
                    <td className="td font-bold">{r.score ?? '—'}</td>
                    <td className="td"><GradeChip grade={r.grade} /></td>
                    <td className="td text-slate-500">{r.label || ''}</td>
                  </tr>
                ))}
                <tr className="bg-brand-50/60"><td className="td font-bold">MEAN</td><td className="td font-extrabold">{latest?.mean}</td><td className="td"><GradeChip grade={latest?.meanGrade?.grade} /></td><td className="td">Position {latest?.position} of {latest?.outOf}</td></tr>
              </tbody>
            </table>
            <div className="p-4 no-print"><Link className="btn-ghost" to={`/reports?student=${s.id}&exam=${latest?.examId}`}><Icon name="printer" size={15} /> Generate Report Form</Link></div>
          </div>
        </div>
      )}

      {tab === 'competencies' && (
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="card p-5">
            <h3 className="mb-1 font-bold text-slate-800">Core Competencies — Term {competency?.term} {competency?.year}</h3>
            <p className="mb-3 text-xs text-slate-400">CBC rubric: EE Exceeding • ME Meeting • AE Approaching • BE Below</p>
            {competency ? (
              <div className="space-y-3">
                {Object.entries(competency.ratings).map(([k, v]) => (
                  <div key={k} className="flex items-center gap-3">
                    <span className="w-56 text-sm font-medium text-slate-600">{k}</span>
                    <div className="flex-1"><ProgressBar value={(v / 4) * 100} color={v >= 3 ? 'bg-emerald-500' : v === 2 ? 'bg-amber-500' : 'bg-rose-500'} /></div>
                    <GradeChip grade={LEVEL_NAMES[v]} />
                  </div>
                ))}
              </div>
            ) : <p className="text-slate-500">No competency assessment yet.</p>}
          </div>
          <div className="card p-5">
            <h3 className="mb-2 font-bold text-slate-800">Competency Radar</h3>
            <ResponsiveContainer width="100%" height={300}>
              <RadarChart data={radarData}>
                <PolarGrid stroke="#e2e8f0" />
                <PolarAngleAxis dataKey="competency" tick={{ fontSize: 11 }} />
                <Radar dataKey="level" stroke="#1a7c64" fill="#279a7c" fillOpacity={0.35} />
                <Tooltip formatter={(v, n, p) => [LEVEL_NAMES[v], p.payload.full]} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {tab === 'fees' && (
        <div className="grid gap-4 lg:grid-cols-3">
          <div className="card p-5">
            <h3 className="mb-3 font-bold text-slate-800">Fee Structure — Term {fees.term} {fees.year}</h3>
            {(fees.structure?.voteHeads || []).map((v) => (
              <div key={v.name} className="flex justify-between border-b border-slate-50 py-1.5 text-sm"><span className="text-slate-600">{v.name}</span><b>{fmtKES(v.amount)}</b></div>
            ))}
            <div className="flex justify-between py-2 text-sm font-extrabold"><span>Total Billed</span><span>{fmtKES(fees.billed)}</span></div>
            <div className="flex justify-between text-sm font-bold text-emerald-700"><span>Paid</span><span>{fmtKES(fees.paid)}</span></div>
            <div className="flex justify-between text-sm font-bold text-rose-600"><span>Balance</span><span>{fmtKES(fees.balance)}</span></div>
            <div className="mt-3"><ProgressBar value={fees.billed ? (fees.paid / fees.billed) * 100 : 0} /></div>
          </div>
          <div className="card overflow-x-auto lg:col-span-2">
            <h3 className="p-5 pb-2 font-bold text-slate-800">Payment History</h3>
            <table className="w-full"><thead><tr><th className="th">Date</th><th className="th">Method</th><th className="th">Reference</th><th className="th">Amount</th></tr></thead>
              <tbody>{fees.payments.map((p) => (
                <tr key={p.id} className="hover:bg-slate-50"><td className="td">{fmtDate(p.date)}</td><td className="td">{p.method}</td><td className="td font-mono text-xs">{p.ref}</td><td className="td font-bold text-emerald-700">{fmtKES(p.amount)}</td></tr>
              ))}</tbody></table>
            {!fees.payments.length && <p className="p-5 text-sm text-slate-400">No payments recorded this term.</p>}
          </div>
        </div>
      )}

      {tab === 'biodata' && (
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="card grid grid-cols-2 gap-4 p-5">
            <h3 className="col-span-2 font-bold text-slate-800">Learner Details</h3>
            <Info label="Gender" value={s.gender} /><Info label="Date of Birth" value={fmtDate(s.dob)} />
            <Info label="UPI Number" value={s.upi} /><Info label="NEMIS Number" value={s.nemis} />
            <Info label="Birth Certificate" value={s.birthCertNo} /><Info label="Date Admitted" value={fmtDate(s.dateAdmitted)} />
            <Info label="County" value={s.county} /><Info label="Estate / Area" value={s.estate} />
            <Info label="House" value={s.house} /><Info label="Status" value={s.status} />
          </div>
          <div className="card grid grid-cols-2 gap-4 p-5">
            <h3 className="col-span-2 font-bold text-slate-800">Parent / Guardian</h3>
            <Info label="Name" value={s.guardian?.name} /><Info label="Relation" value={s.guardian?.relation} />
            <Info label="Phone" value={s.guardian?.phone} /><Info label="Email" value={s.guardian?.email} />
            <div className="col-span-2 mt-2 flex gap-2 no-print">
              <a className="btn-ghost" href={`tel:${s.guardian?.phone}`}><Icon name="phone" size={15} /> Call Guardian</a>
              <Link className="btn-ghost" to="/communications"><Icon name="chat" size={15} /> Send SMS</Link>
            </div>
          </div>
          {data.discipline?.length > 0 && (
            <div className="card p-5 lg:col-span-2">
              <h3 className="mb-3 font-bold text-slate-800">Discipline Record</h3>
              {data.discipline.map((d) => (
                <div key={d.id} className="border-b border-slate-50 py-2 text-sm"><b>{fmtDate(d.date)} — {d.category}:</b> {d.description} <span className="text-slate-400">({d.action})</span></div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
