import React, { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Cell } from 'recharts';
import { api } from '../lib/api.js';
import { GRADING, GRADING_LABELS } from '../lib/utils.js';
import { useFetch, Spinner, PageHeader, Icon, StatCard, GradeChip, Avatar, Field } from '../components/ui.jsx';
import { useAuth } from '../App.jsx';

const BAR_COLORS = ['#1a7c64', '#279a7c', '#38bdf8', '#818cf8', '#f59e0b', '#f97316', '#fb7185', '#e11d48', '#94a3b8', '#64748b', '#475569', '#334155'];

export default function Analytics() {
  const { settings } = useAuth();
  const [params] = useSearchParams();
  const { data: exams } = useFetch(() => api.get('/exams'));
  const { data: classes } = useFetch(() => api.get('/classes'));
  const [examId, setExamId] = useState(params.get('exam') || '');
  const [classId, setClassId] = useState('');
  const [meritClass, setMeritClass] = useState('');

  const published = useMemo(() => [...(exams || [])].sort((a, b) => b.date.localeCompare(a.date)), [exams]);
  useEffect(() => { if (!examId && published.length) setExamId(published.find((e) => e.status === 'Published')?.id || published[0].id); }, [published, examId]);

  const { data, loading } = useFetch(
    () => (examId ? api.get(`/analytics/exam/${examId}${classId ? `?classId=${classId}` : ''}`) : Promise.resolve(null)),
    [examId, classId]
  );

  const sortedClasses = useMemo(() => [...(classes || [])].sort((a, b) => a.order - b.order), [classes]);
  const meritSummary = data?.classSummaries.find((c) => c.classId === meritClass) || data?.classSummaries[0];

  const gradeOrder = (GRADING[data?.exam.grading] || []).map((g) => g.grade);
  const gradeDist = useMemo(() => {
    if (!data) return [];
    return gradeOrder.map((g) => ({ grade: g, count: data.gradeDistribution.find((x) => x.grade === g)?.count || 0 }));
  }, [data]); // eslint-disable-line

  return (
    <div>
      <PageHeader title="Exam Analytics" subtitle="Zeraki-style analysis — merit lists, subject & stream comparison, most improved learners"
        actions={<button className="btn-ghost" onClick={() => window.print()}><Icon name="printer" size={15} /> Print Analysis</button>} />

      <div className="card mb-4 grid gap-3 p-4 sm:grid-cols-3 no-print">
        <Field label="Examination"><select className="input" value={examId} onChange={(e) => setExamId(e.target.value)}>{published.map((e) => <option key={e.id} value={e.id}>{e.name}</option>)}</select></Field>
        <Field label="Filter by class (optional)"><select className="input" value={classId} onChange={(e) => setClassId(e.target.value)}><option value="">Whole School</option>{sortedClasses.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></Field>
        <div className="flex items-end"><span className="rounded-xl bg-brand-50 px-3 py-2 text-sm font-bold text-brand-800">{data ? GRADING_LABELS[data.exam.grading] : ''}</span></div>
      </div>

      {loading || !data ? <Spinner label="Crunching results…" /> : (
        <>
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <StatCard label="School Mean Score" value={data.schoolMean} sub={data.exam.name} icon="target" />
            <StatCard label="Learners Assessed" value={data.learnersAssessed} sub="Across all classes" icon="users" color="bg-sky-50 text-sky-700" />
            <StatCard label="Girls' Mean" value={data.gender.Female} sub={`Boys' mean: ${data.gender.Male}`} icon="award" color="bg-rose-50 text-rose-700" />
            <StatCard label="Best Subject" value={data.subjectAnalysis[0]?.code || '—'} sub={`${data.subjectAnalysis[0]?.subject || ''} • mean ${data.subjectAnalysis[0]?.mean ?? ''}`} icon="chart" color="bg-amber-50 text-amber-700" />
          </div>

          <div className="mt-4 grid gap-4 lg:grid-cols-2">
            <div className="card p-5">
              <h3 className="mb-3 font-bold text-slate-800">Grade Distribution (Mean Grades)</h3>
              <ResponsiveContainer width="100%" height={230}>
                <BarChart data={gradeDist}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="grade" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="count" name="Learners" radius={[6, 6, 0, 0]}>{gradeDist.map((_, i) => <Cell key={i} fill={BAR_COLORS[i % BAR_COLORS.length]} />)}</Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="card p-5">
              <h3 className="mb-3 font-bold text-slate-800">Subject Mean Scores</h3>
              <ResponsiveContainer width="100%" height={230}>
                <BarChart data={data.subjectAnalysis.map((s) => ({ name: s.code, mean: s.mean }))}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} interval={0} angle={-25} textAnchor="end" height={48} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="mean" name="Mean score" fill="#279a7c" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="card mt-4 overflow-x-auto">
            <h3 className="p-5 pb-2 font-bold text-slate-800">Subject Analysis Table</h3>
            <table className="w-full min-w-[680px]">
              <thead><tr><th className="th">Learning Area</th><th className="th">Entries</th><th className="th">Mean</th><th className="th">Mean Grade</th><th className="th">Highest</th><th className="th">Lowest</th><th className="th">Grade Spread</th></tr></thead>
              <tbody>
                {data.subjectAnalysis.map((s) => (
                  <tr key={s.subjectId} className="hover:bg-slate-50">
                    <td className="td font-semibold">{s.subject} <span className="text-xs text-slate-400">({s.code})</span></td>
                    <td className="td">{s.entries}</td><td className="td font-extrabold">{s.mean}</td>
                    <td className="td"><GradeChip grade={s.grade?.grade} /></td>
                    <td className="td text-emerald-700">{s.highest}</td><td className="td text-rose-600">{s.lowest}</td>
                    <td className="td">{Object.entries(s.distribution).sort((a, b) => gradeOrder.indexOf(a[0]) - gradeOrder.indexOf(b[0])).map(([g, n]) => <span key={g} className="mr-1 text-[11px]"><GradeChip grade={g} />×{n}</span>)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-4 grid gap-4 lg:grid-cols-3">
            <div className="card p-5 lg:col-span-1">
              <h3 className="mb-3 font-bold text-slate-800">Class & Stream Comparison</h3>
              <div className="space-y-3">
                {data.classSummaries.map((c) => (
                  <div key={c.classId} className="rounded-xl bg-slate-50 p-3">
                    <div className="flex items-center justify-between">
                      <button className="font-bold text-slate-800 hover:text-brand-700" onClick={() => setMeritClass(c.classId)}>{c.className}</button>
                      <span className="flex items-center gap-2 text-sm"><b>{c.mean}</b><GradeChip grade={c.meanGrade?.grade} /></span>
                    </div>
                    <p className="text-xs text-slate-400">{c.learners} learners • {c.level} • Mean points {c.meanPoints}</p>
                    <div className="mt-1.5 flex flex-wrap gap-1">
                      {Object.entries(c.streams).map(([st, v]) => <span key={st} className="rounded-md bg-white px-2 py-0.5 text-[11px] font-semibold text-slate-600 shadow-sm">{st}: {v.mean}</span>)}
                    </div>
                  </div>
                ))}
              </div>
              <h3 className="mb-2 mt-5 font-bold text-slate-800">🚀 Most Improved</h3>
              <div className="space-y-2">
                {data.mostImproved.slice(0, 6).map((m, i) => (
                  <div key={m.student.id} className="flex items-center gap-2 text-sm">
                    <span className="w-4 font-black text-slate-300">{i + 1}</span>
                    <Avatar name={m.student.name} size="h-7 w-7 text-[10px]" />
                    <span className="min-w-0 flex-1 truncate font-medium text-slate-700">{m.student.name} <span className="text-xs text-slate-400">{m.className}</span></span>
                    <span className={`font-bold ${m.deviation >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>{m.deviation >= 0 ? '+' : ''}{m.deviation}</span>
                    <span className="text-xs text-slate-400">{m.from} → {m.to}</span>
                  </div>
                ))}
                {!data.mostImproved.length && <p className="text-sm text-slate-400">Needs at least two published exams.</p>}
              </div>
            </div>

            <div className="card overflow-hidden lg:col-span-2 print-area">
              <div className="flex flex-wrap items-center justify-between gap-2 p-5 pb-2">
                <div>
                  <h3 className="font-bold text-slate-800">📋 Merit List — {meritSummary?.className}</h3>
                  <p className="text-xs text-slate-400">{settings?.schoolName} • {data.exam.name}</p>
                </div>
                <select className="input w-44 no-print" value={meritSummary?.classId || ''} onChange={(e) => setMeritClass(e.target.value)}>
                  {data.classSummaries.map((c) => <option key={c.classId} value={c.classId}>{c.className}</option>)}
                </select>
              </div>
              <div className="max-h-[520px] overflow-auto">
                <table className="w-full min-w-[640px]">
                  <thead className="sticky top-0"><tr><th className="th">Pos</th><th className="th">Learner</th><th className="th">Adm</th><th className="th">Stream</th><th className="th">Total</th><th className="th">Mean</th><th className="th">Mean Grade</th><th className="th no-print">Report</th></tr></thead>
                  <tbody>
                    {(meritSummary?.merit || []).map((m) => (
                      <tr key={m.student.id} className={m.position <= 3 ? 'bg-amber-50/60 hover:bg-amber-50' : 'hover:bg-slate-50'}>
                        <td className="td font-extrabold">{m.position <= 3 ? ['🥇', '🥈', '🥉'][m.position - 1] : m.position}</td>
                        <td className="td"><Link to={`/students/${m.student.id}`} className="font-semibold text-slate-800 hover:text-brand-700">{m.student.name}</Link></td>
                        <td className="td font-mono text-xs">{m.student.admNo}</td>
                        <td className="td">{m.student.stream}</td>
                        <td className="td font-bold">{m.total}</td><td className="td font-extrabold">{m.mean}</td>
                        <td className="td"><GradeChip grade={m.meanGrade?.grade} /> <span className="ml-1 text-[11px] text-slate-400">{m.avgPoints} pts</span></td>
                        <td className="td no-print"><Link className="text-xs font-bold text-brand-700 hover:underline" to={`/reports?student=${m.student.id}&exam=${data.exam.id}`}>Report →</Link></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
