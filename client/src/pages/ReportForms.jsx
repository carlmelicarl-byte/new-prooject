import React, { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api } from '../lib/api.js';
import { fmtKES, fmtDate, studentName, LEVEL_NAMES, LEVEL_LABELS } from '../lib/utils.js';
import { useFetch, Spinner, PageHeader, Icon, Field, GradeChip } from '../components/ui.jsx';

export function ReportCard({ report }) {
  const r = report;
  const s = r.student;
  return (
    <div className="print-area mx-auto max-w-[860px] rounded-2xl border-2 border-brand-700/80 bg-white p-6 shadow-sm sm:p-8">
      {/* Header */}
      <div className="flex items-center gap-4 border-b-4 border-double border-brand-700 pb-4">
        <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-500 to-brand-700 text-3xl font-black text-white">E</span>
        <div className="flex-1 text-center">
          <h1 className="text-xl font-black uppercase tracking-wide text-brand-900 sm:text-2xl">{r.school.schoolName}</h1>
          <p className="text-sm italic text-slate-500">"{r.school.motto}"</p>
          <p className="mt-0.5 text-xs text-slate-500">{r.school.address} • Tel: {r.school.phone} • {r.school.email} • KNEC Centre: {r.school.knECCentreCode}</p>
        </div>
        <span className="hidden h-16 w-16 shrink-0 items-center justify-center rounded-full border-2 border-dashed border-brand-300 text-[10px] font-bold text-brand-600 sm:flex">SCHOOL<br />STAMP</span>
      </div>
      <h2 className="my-3 text-center text-base font-extrabold uppercase tracking-widest text-slate-700">
        Learner Progress Report — Term {r.exam.term} {r.exam.year} ({r.exam.type})
      </h2>

      {/* Learner details */}
      <div className="grid grid-cols-2 gap-x-6 gap-y-1.5 rounded-xl bg-brand-50/60 p-4 text-sm sm:grid-cols-4">
        <p><span className="text-slate-400">Learner:</span> <b>{studentName(s)}</b></p>
        <p><span className="text-slate-400">Adm No:</span> <b>{s.admNo}</b></p>
        <p><span className="text-slate-400">Class:</span> <b>{r.class?.name} {s.stream}</b></p>
        <p><span className="text-slate-400">Level:</span> <b>{r.class?.level}</b></p>
        <p><span className="text-slate-400">UPI:</span> <b>{s.upi}</b></p>
        <p><span className="text-slate-400">House:</span> <b>{s.house}</b></p>
        <p><span className="text-slate-400">Gender:</span> <b>{s.gender}</b></p>
        <p><span className="text-slate-400">Attendance:</span> <b>{r.attendanceRate}%</b></p>
        {s.pathway && <p><span className="text-slate-400">Pathway:</span> <b>{s.pathway}</b></p>}
        {s.kpseaScore ? <p><span className="text-slate-400">KPSEA Points:</span> <b>{s.kpseaScore}/40</b></p> : null}
      </div>

      {/* Results */}
      <table className="mt-5 w-full">
        <thead><tr><th className="th bg-brand-700! text-white!">Learning Area</th><th className="th bg-brand-700! text-white!">Score %</th><th className="th bg-brand-700! text-white!">Grade</th><th className="th bg-brand-700! text-white!">Points</th><th className="th bg-brand-700! text-white!">Performance Descriptor</th></tr></thead>
        <tbody>
          {r.results.subjects.map((sub) => (
            <tr key={sub.subjectId}>
              <td className="td font-medium">{sub.subject}</td>
              <td className="td font-bold">{sub.score ?? '—'}</td>
              <td className="td"><GradeChip grade={sub.grade} /></td>
              <td className="td">{sub.points ?? '—'}</td>
              <td className="td text-xs leading-relaxed text-slate-500">{sub.label}{sub.descriptor ? ` — ${sub.descriptor}` : ''}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Summary band */}
      <div className="mt-4 grid grid-cols-2 gap-3 text-center sm:grid-cols-4">
        {[
          ['Total Marks', `${r.results.total} / ${r.results.count * 100}`],
          ['Mean Score', r.results.mean],
          ['Mean Grade', r.results.meanGrade ? `${r.results.meanGrade.grade} (${r.results.avgPoints} pts)` : '—'],
          ['Deviation', r.deviation === null ? '—' : `${r.deviation >= 0 ? '+' : ''}${r.deviation}`],
          ['Class Position', r.position ? `${r.position} of ${r.outOf}` : '—'],
          ['Stream Position', r.streamPosition ? `${r.streamPosition} of ${r.streamOutOf}` : '—'],
          ['Class Mean', r.classMean],
          ['Grading', r.exam.grading],
        ].map(([k, v]) => (
          <div key={k} className="rounded-xl border border-slate-100 bg-slate-50 px-2 py-2.5">
            <p className="text-base font-extrabold text-slate-800">{v}</p>
            <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">{k}</p>
          </div>
        ))}
      </div>

      {/* Competencies */}
      {r.competency && (
        <>
          <h3 className="mb-2 mt-5 font-bold text-slate-800">Core Competencies Assessment (CBC)</h3>
          <div className="grid gap-x-6 gap-y-1.5 sm:grid-cols-2">
            {Object.entries(r.competency.ratings).map(([k, v]) => (
              <div key={k} className="flex items-center justify-between border-b border-slate-50 py-1 text-sm">
                <span className="text-slate-600">{k}</span>
                <span className="flex items-center gap-2"><span className="text-xs text-slate-400">{LEVEL_LABELS[v]} Expectations</span><GradeChip grade={LEVEL_NAMES[v]} /></span>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Remarks */}
      <div className="mt-5 space-y-3 text-sm">
        <div className="rounded-xl bg-slate-50 p-4">
          <p className="font-bold text-slate-700">Class Teacher's Remarks — {r.classTeacher}</p>
          <p className="mt-1 leading-relaxed text-slate-600">{r.teacherRemark}</p>
          <p className="mt-3 text-slate-400">Signature: ……………………………… &nbsp;&nbsp; Date: ………………</p>
        </div>
        <div className="rounded-xl bg-slate-50 p-4">
          <p className="font-bold text-slate-700">Head of Institution's Remarks</p>
          <p className="mt-1 leading-relaxed text-slate-600">{r.principalRemark}</p>
          <p className="mt-3 text-slate-400">Signature: ……………………………… &nbsp;&nbsp; Date: ………………</p>
        </div>
      </div>

      {/* Footer: fees + next term */}
      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <div className={`rounded-xl p-4 text-sm ${r.fees.balance > 0 ? 'bg-rose-50 text-rose-800' : 'bg-emerald-50 text-emerald-800'}`}>
          <p className="font-bold">Fee Statement — Term {r.fees.term} {r.fees.year}</p>
          <p className="mt-1">Billed: {fmtKES(r.fees.billed)} • Paid: {fmtKES(r.fees.paid)} • <b>Balance: {fmtKES(r.fees.balance)}</b></p>
          <p className="mt-1 text-xs">Pay via M-Pesa Paybill <b>{r.school.mpesaPaybill}</b>, Account No: <b>{s.admNo}</b></p>
        </div>
        <div className="rounded-xl bg-brand-50 p-4 text-sm text-brand-900">
          <p className="font-bold">Term Dates</p>
          <p className="mt-1">Closing date: <b>{fmtDate(r.school.termDates.closes)}</b></p>
          <p>Next term opens: <b>{fmtDate(r.school.termDates.nextOpens)}</b> at 8:00 AM. Learners to report in full school uniform.</p>
        </div>
      </div>
      <p className="mt-4 border-t border-slate-100 pt-3 text-center text-[11px] text-slate-400">
        Generated by Elimu360 School Suite • This report is not valid without the official school stamp.
      </p>
    </div>
  );
}

export default function ReportForms() {
  const [params] = useSearchParams();
  const { data: exams } = useFetch(() => api.get('/exams'));
  const { data: classes } = useFetch(() => api.get('/classes'));
  const { data: students } = useFetch(() => api.get('/students'));
  const [examId, setExamId] = useState(params.get('exam') || '');
  const [classId, setClassId] = useState('');
  const [studentId, setStudentId] = useState(params.get('student') || '');
  const [report, setReport] = useState(null);
  const [loadingReport, setLoadingReport] = useState(false);

  const published = useMemo(() => [...(exams || [])].filter((e) => e.status === 'Published').sort((a, b) => b.date.localeCompare(a.date)), [exams]);
  useEffect(() => { if (!examId && published.length) setExamId(published[0].id); }, [published, examId]);

  const classStudents = useMemo(() => (students || []).filter((s) => !classId || s.classId === classId)
    .sort((a, b) => studentName(a).localeCompare(studentName(b))), [students, classId]);

  useEffect(() => {
    if (studentId && students) {
      const st = students.find((s) => s.id === studentId);
      if (st && st.classId !== classId) setClassId(st.classId);
    }
  }, [studentId, students]); // eslint-disable-line

  useEffect(() => {
    if (!studentId || !examId) { setReport(null); return; }
    setLoadingReport(true);
    api.get(`/students/${studentId}/report?examId=${examId}`).then(setReport)
      .catch(() => setReport(null)).finally(() => setLoadingReport(false));
  }, [studentId, examId]);

  return (
    <div>
      <PageHeader title="Report Forms" subtitle="Printable CBC learner progress reports with competencies, remarks & fee statement"
        actions={report && <button className="btn-primary" onClick={() => window.print()}><Icon name="printer" size={15} /> Print / Save PDF</button>} />

      <div className="card mb-4 grid gap-3 p-4 sm:grid-cols-3 no-print">
        <Field label="Examination"><select className="input" value={examId} onChange={(e) => setExamId(e.target.value)}>{published.map((e) => <option key={e.id} value={e.id}>{e.name}</option>)}</select></Field>
        <Field label="Class"><select className="input" value={classId} onChange={(e) => { setClassId(e.target.value); setStudentId(''); }}><option value="">All Classes</option>{[...(classes || [])].sort((a, b) => a.order - b.order).map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></Field>
        <Field label="Learner"><select className="input" value={studentId} onChange={(e) => setStudentId(e.target.value)}><option value="">Select learner…</option>{classStudents.map((s) => <option key={s.id} value={s.id}>{studentName(s)} — {s.admNo}</option>)}</select></Field>
      </div>

      {loadingReport && <Spinner label="Generating report…" />}
      {!loadingReport && report && <div className="animate-fadeUp"><ReportCard report={report} /></div>}
      {!loadingReport && !report && (
        <div className="card p-10 text-center text-slate-400 no-print">
          <p className="text-lg font-bold text-slate-500">Select a learner to generate their report form</p>
          <p className="mt-1 text-sm">Reports include subject grades with CBC descriptors, positions, core competencies, teacher remarks and fee balance.</p>
        </div>
      )}
    </div>
  );
}
