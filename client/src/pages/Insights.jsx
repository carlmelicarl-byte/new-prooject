import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ResponsiveContainer, LineChart, Line } from 'recharts';
import { api, toast } from '../lib/api.js';
import { fmtKES } from '../lib/utils.js';
import { useFetch, Spinner, PageHeader, StatCard, GradeChip, Avatar, Field } from '../components/ui.jsx';

const RISK_STYLE = {
  High: 'bg-rose-100 text-rose-800 border border-rose-200',
  Medium: 'bg-amber-100 text-amber-800 border border-amber-200',
  Low: 'bg-emerald-100 text-emerald-800 border border-emerald-200',
};

function Sparkline({ data }) {
  const pts = (data || []).map((v, i) => ({ i, v }));
  return (
    <div className="h-9 w-24">
      <ResponsiveContainer>
        <LineChart data={pts} margin={{ top: 2, bottom: 2, left: 0, right: 0 }}>
          <Line type="monotone" dataKey="v" stroke="#1a7c64" strokeWidth={2} dot={{ r: 2, fill: '#1a7c64' }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export default function Insights() {
  const { data, loading } = useFetch(() => api.get('/insights'));
  const { data: classes } = useFetch(() => api.get('/classes'));
  const [risk, setRisk] = useState('');
  const [classId, setClassId] = useState('');
  const [showAll, setShowAll] = useState(false);

  const rows = useMemo(() => {
    let r = showAll ? (data?.learners || []) : (data?.atRisk || []);
    if (risk) r = r.filter((l) => l.riskLevel === risk);
    if (classId) r = r.filter((l) => l.student.classId === classId);
    return r;
  }, [data, risk, classId, showAll]);

  const intervene = async (l) => {
    await api.post('/messages/send', {
      audience: 'Class', classId: l.student.classId,
      body: `Dear Parent of ${l.student.name}, we invite you for an academic clinic to discuss your child's progress and support plan. Please visit or call the school office. Shule ya Msingi Academy`,
    });
    toast(`📲 Intervention SMS sent to ${l.student.name}'s guardian`);
  };

  if (loading || !data) return <Spinner label="Running learner analytics engine…" />;

  return (
    <div>
      <PageHeader title="✨ Learner Insights & Early Warning" subtitle="Elimu360's unique engine — combines grades, attendance & fees to flag at-risk learners and predict their next grade" />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="High Risk" value={data.summary.high} sub="Need urgent intervention" icon="shield" color="bg-rose-50 text-rose-700" />
        <StatCard label="Medium Risk" value={data.summary.medium} sub="Monitor & support closely" icon="bulb" color="bg-amber-50 text-amber-700" />
        <StatCard label="On Track" value={data.summary.onTrack} sub="Performing to expectations" icon="check" color="bg-emerald-50 text-emerald-700" />
        <StatCard label="Learners Analysed" value={data.learners.length} sub="Excl. Pre-Primary checklist stage" icon="target" color="bg-sky-50 text-sky-700" />
      </div>

      <div className="my-4 rounded-2xl bg-gradient-to-r from-ink-900 to-brand-800 p-5 text-white">
        <h3 className="font-bold">How the Early-Warning Score Works</h3>
        <div className="mt-2 grid gap-3 text-[13px] leading-relaxed text-slate-200 md:grid-cols-4">
          <p>📉 <b>Academic:</b> mean below 40 or a drop of 8+ points between exams raises risk.</p>
          <p>🗓️ <b>Attendance:</b> register rate below 85% correlates strongly with KJSEA/KPSEA underperformance.</p>
          <p>💰 <b>Fees:</b> high arrears often precede absenteeism & dropout in Kenyan schools.</p>
          <p>🔮 <b>Prediction:</b> a linear trend across all exams projects the next assessment grade.</p>
        </div>
      </div>

      <div className="card mb-4 grid gap-3 p-4 sm:grid-cols-4 no-print">
        <Field label="Show"><select className="input" value={showAll ? 'all' : 'risk'} onChange={(e) => setShowAll(e.target.value === 'all')}><option value="risk">At-risk learners only</option><option value="all">All learners</option></select></Field>
        <Field label="Risk level"><select className="input" value={risk} onChange={(e) => setRisk(e.target.value)}><option value="">All levels</option><option>High</option><option>Medium</option><option>Low</option></select></Field>
        <Field label="Class"><select className="input" value={classId} onChange={(e) => setClassId(e.target.value)}><option value="">All Classes</option>{[...(classes || [])].sort((a, b) => a.order - b.order).map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></Field>
        <div className="flex items-end"><p className="text-sm font-semibold text-slate-500">{rows.length} learners shown</p></div>
      </div>

      <div className="card max-h-[680px] overflow-auto">
        <table className="w-full min-w-[900px]">
          <thead className="sticky top-0 z-10"><tr><th className="th">Learner</th><th className="th">Class</th><th className="th">Trend</th><th className="th">Current Mean</th><th className="th">🔮 Predicted</th><th className="th">Attendance</th><th className="th">Fee Balance</th><th className="th">Risk</th><th className="th">Flags</th><th className="th no-print">Action</th></tr></thead>
          <tbody>
            {rows.map((l) => (
              <tr key={l.student.id} className="hover:bg-slate-50">
                <td className="td"><Link to={`/students/${l.student.id}`} className="flex items-center gap-2 font-semibold text-slate-800 hover:text-brand-700"><Avatar name={l.student.name} size="h-8 w-8 text-[10px]" />{l.student.name}</Link></td>
                <td className="td whitespace-nowrap">{l.className} {l.student.stream}</td>
                <td className="td"><Sparkline data={l.trend} /></td>
                <td className="td font-extrabold">{l.currentMean}</td>
                <td className="td"><span className="font-bold">{l.predicted}</span> <GradeChip grade={l.predictedGrade?.grade} /></td>
                <td className={`td font-semibold ${l.attendance < 85 ? 'text-rose-600' : 'text-slate-600'}`}>{l.attendance}%</td>
                <td className="td">{l.feeBalance > 0 ? <span className="text-rose-600 font-semibold">{fmtKES(l.feeBalance)}</span> : <span className="text-emerald-600">Cleared ✓</span>}</td>
                <td className="td"><span className={`rounded-full px-2.5 py-0.5 text-[11px] font-black ${RISK_STYLE[l.riskLevel]}`}>{l.riskLevel.toUpperCase()} {l.riskScore}</span></td>
                <td className="td max-w-[220px]">{l.flags.map((f) => <span key={f} className="mb-0.5 mr-1 inline-block rounded-md bg-rose-50 px-1.5 py-0.5 text-[10px] font-bold text-rose-700">{f}</span>)}{!l.flags.length && <span className="text-xs text-slate-300">—</span>}</td>
                <td className="td no-print">{l.riskLevel !== 'Low' && <button className="btn-ghost px-2.5! py-1! text-xs" onClick={() => intervene(l)}>📲 Intervene</button>}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {!rows.length && <p className="py-10 text-center text-sm font-semibold text-emerald-600">🎉 No learners match — everyone is on track!</p>}
      </div>
      <p className="mt-3 text-xs text-slate-400">Recommended interventions: academic clinic invites, remedial timetable, mentorship pairing, bursary referral (CDF/county), and weekly attendance follow-up by class teachers.</p>
    </div>
  );
}
