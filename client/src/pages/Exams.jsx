import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, toast } from '../lib/api.js';
import { GRADING_LABELS, gradeOf, studentName } from '../lib/utils.js';
import { useFetch, Spinner, PageHeader, Icon, Modal, Field, Tabs, GradeChip, ProgressBar } from '../components/ui.jsx';

const examBlank = { name: '', type: 'End-Term', year: 2026, term: 1, grading: 'CBE8', status: 'Open', date: '' };

export default function Exams() {
  const [tab, setTab] = useState('marks');
  const { data: exams, reload: reloadExams } = useFetch(() => api.get('/exams'));
  const { data: classes } = useFetch(() => api.get('/classes'));
  const { data: subjects } = useFetch(() => api.get('/subjects'));
  const { data: students } = useFetch(() => api.get('/students'));

  const [examModal, setExamModal] = useState(false);
  const [eForm, setEForm] = useState(examBlank);
  const [editExam, setEditExam] = useState(null);

  // marks entry state
  const [selExam, setSelExam] = useState('');
  const [selClass, setSelClass] = useState('');
  const [selStream, setSelStream] = useState('');
  const [selSubject, setSelSubject] = useState('');
  const [scores, setScores] = useState({});
  const [savingMarks, setSavingMarks] = useState(false);
  const [marksLoading, setMarksLoading] = useState(false);

  const sortedClasses = useMemo(() => [...(classes || [])].filter((c) => c.level !== 'Pre-Primary').sort((a, b) => a.order - b.order), [classes]);
  const sortedExams = useMemo(() => [...(exams || [])].sort((a, b) => b.date.localeCompare(a.date)), [exams]);

  useEffect(() => { if (!selExam && sortedExams.length) setSelExam(sortedExams[0].id); }, [sortedExams, selExam]);
  useEffect(() => { if (!selClass && sortedClasses.length) { setSelClass(sortedClasses[3]?.id || sortedClasses[0].id); } }, [sortedClasses, selClass]);

  const cls = (classes || []).find((c) => c.id === selClass);
  const exam = (exams || []).find((e) => e.id === selExam);
  const classSubjects = useMemo(() => {
    if (!cls) return [];
    return (subjects || []).filter((s) => s.levels.includes(cls.level));
  }, [subjects, cls]);
  useEffect(() => { if (classSubjects.length && !classSubjects.find((s) => s.id === selSubject)) setSelSubject(classSubjects[0].id); }, [classSubjects, selSubject]);
  useEffect(() => { if (cls && !cls.streams.includes(selStream)) setSelStream(cls.streams[0] || ''); }, [cls, selStream]);

  const roster = useMemo(() => (students || []).filter((s) => s.classId === selClass && (!selStream || s.stream === selStream))
    .filter((s) => {
      const sub = (subjects || []).find((x) => x.id === selSubject);
      if (sub?.pathway && cls?.level === 'Senior School') return s.pathway === sub.pathway;
      return true;
    })
    .sort((a, b) => studentName(a).localeCompare(studentName(b))), [students, selClass, selStream, selSubject, subjects, cls]);

  // load existing marks for the current selection
  useEffect(() => {
    if (!selExam || !selClass || !selSubject) return;
    setMarksLoading(true);
    api.get(`/marks?examId=${selExam}&classId=${selClass}&subjectId=${selSubject}`)
      .then((rows) => {
        const map = {};
        rows.forEach((m) => { map[m.studentId] = String(m.score); });
        setScores(map);
      }).finally(() => setMarksLoading(false));
  }, [selExam, selClass, selSubject, selStream]);

  const saveMarks = async () => {
    setSavingMarks(true);
    try {
      const entries = roster.map((s) => ({ examId: selExam, studentId: s.id, subjectId: selSubject, score: scores[s.id] === undefined ? '' : scores[s.id] }));
      const r = await api.post('/marks/bulk', { entries });
      toast(`✅ Saved ${r.saved} marks for ${(subjects || []).find((x) => x.id === selSubject)?.name}`);
    } catch (e) { toast(e.message, 'error'); } finally { setSavingMarks(false); }
  };

  const saveExam = async () => {
    try {
      if (editExam) { await api.put(`/exams/${editExam}`, eForm); toast('Exam updated'); }
      else { const e = await api.post('/exams', { ...eForm, classIds: (classes || []).map((c) => c.id) }); setSelExam(e.id); toast('Exam created — now enter marks'); }
      setExamModal(false); reloadExams();
    } catch (e) { toast(e.message, 'error'); }
  };

  const togglePublish = async (e) => {
    const status = e.status === 'Published' ? 'Open' : 'Published';
    await api.put(`/exams/${e.id}`, { status });
    toast(status === 'Published' ? '📣 Results published — visible in Analytics & Reports' : 'Exam reopened for marks entry');
    reloadExams();
  };

  const entered = roster.filter((s) => scores[s.id] !== undefined && scores[s.id] !== '').length;
  const enteredScores = roster.map((s) => scores[s.id]).filter((v) => v !== undefined && v !== '').map(Number).filter((v) => !Number.isNaN(v));
  const classMean = enteredScores.length ? (enteredScores.reduce((a, b) => a + b, 0) / enteredScores.length).toFixed(1) : '—';

  if (!exams || !classes || !subjects || !students) return <Spinner />;

  return (
    <div>
      <PageHeader title="Exams & Marks Entry" subtitle="Create assessments, capture scores and publish results — powered by Elimu Analytics"
        actions={<button className="btn-primary" onClick={() => { setEForm(examBlank); setEditExam(null); setExamModal(true); }}><Icon name="plus" size={15} /> New Exam</button>} />
      <Tabs tabs={[{ id: 'marks', label: '✍️ Marks Entry' }, { id: 'exams', label: '🗂️ Manage Exams' }]} active={tab} onChange={setTab} />

      {tab === 'marks' && (
        <div className="card p-5 animate-fadeUp">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Field label="Examination"><select className="input" value={selExam} onChange={(e) => setSelExam(e.target.value)}>{sortedExams.map((e) => <option key={e.id} value={e.id}>{e.name} ({e.status})</option>)}</select></Field>
            <Field label="Class"><select className="input" value={selClass} onChange={(e) => setSelClass(e.target.value)}>{sortedClasses.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></Field>
            <Field label="Stream"><select className="input" value={selStream} onChange={(e) => setSelStream(e.target.value)}>{(cls?.streams || []).map((s) => <option key={s}>{s}</option>)}</select></Field>
            <Field label="Learning Area"><select className="input" value={selSubject} onChange={(e) => setSelSubject(e.target.value)}>{classSubjects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}</select></Field>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-4 rounded-xl bg-slate-50 px-4 py-3">
            <div className="min-w-40 flex-1">
              <p className="mb-1 text-xs font-bold text-slate-500">{entered} of {roster.length} marks entered • Class mean: <b className="text-slate-800">{classMean}</b></p>
              <ProgressBar value={roster.length ? (entered / roster.length) * 100 : 0} />
            </div>
            <span className="rounded-full bg-white px-3 py-1 text-xs font-bold text-brand-700 shadow-sm">{exam ? GRADING_LABELS[exam.grading] : ''}</span>
            <button className="btn-primary" disabled={savingMarks} onClick={saveMarks}>{savingMarks ? 'Saving…' : '💾 Save Marks'}</button>
            {exam && <button className="btn-ghost" onClick={() => togglePublish(exam)}>{exam.status === 'Published' ? '↩ Re-open Exam' : '📣 Publish Results'}</button>}
          </div>

          {marksLoading ? <Spinner label="Loading mark sheet…" /> : (
            <div className="mt-4 overflow-x-auto">
              <table className="w-full min-w-[560px]">
                <thead><tr><th className="th">#</th><th className="th">Learner</th><th className="th">Adm No</th><th className="th w-36">Score / 100</th><th className="th">Grade</th><th className="th">Performance Level</th></tr></thead>
                <tbody>
                  {roster.map((s, i) => {
                    const g = gradeOf(scores[s.id], exam?.grading);
                    return (
                      <tr key={s.id} className="hover:bg-slate-50">
                        <td className="td text-slate-400">{i + 1}</td>
                        <td className="td font-semibold text-slate-700">{studentName(s)}</td>
                        <td className="td font-mono text-xs">{s.admNo}</td>
                        <td className="td">
                          <input type="number" min="0" max="100" className="input w-24! py-1.5! text-center font-bold" placeholder="—"
                            value={scores[s.id] ?? ''} onChange={(e) => setScores((sc) => ({ ...sc, [s.id]: e.target.value }))} />
                        </td>
                        <td className="td"><GradeChip grade={g?.grade} /></td>
                        <td className="td text-slate-500">{g?.label || g?.grade || ''}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {!roster.length && <p className="py-8 text-center text-sm text-slate-400">No learners in this class/stream for this learning area.</p>}
            </div>
          )}
          <p className="mt-3 text-xs text-slate-400">Tip: grades update live as you type. Click <b>Save Marks</b>, then head to <Link className="font-bold text-brand-700" to="/analytics">Analytics</Link> for merit lists & subject analysis.</p>
        </div>
      )}

      {tab === 'exams' && (
        <div className="card overflow-x-auto animate-fadeUp">
          <table className="w-full min-w-[720px]">
            <thead><tr><th className="th">Examination</th><th className="th">Type</th><th className="th">Term</th><th className="th">Grading</th><th className="th">Status</th><th className="th no-print">Actions</th></tr></thead>
            <tbody>
              {sortedExams.map((e) => (
                <tr key={e.id} className="hover:bg-slate-50">
                  <td className="td font-semibold text-slate-800">{e.name}</td>
                  <td className="td">{e.type}</td>
                  <td className="td">Term {e.term} {e.year}</td>
                  <td className="td text-xs">{GRADING_LABELS[e.grading]}</td>
                  <td className="td"><span className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold ${e.status === 'Published' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>{e.status}</span></td>
                  <td className="td no-print"><div className="flex flex-wrap gap-1.5">
                    <button className="btn-ghost px-2.5! py-1! text-xs" onClick={() => togglePublish(e)}>{e.status === 'Published' ? 'Re-open' : 'Publish'}</button>
                    <Link className="btn-ghost px-2.5! py-1! text-xs" to={`/analytics?exam=${e.id}`}>Analyse</Link>
                    <button onClick={() => { setEForm(e); setEditExam(e.id); setExamModal(true); }} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"><Icon name="edit" size={15} /></button>
                    <button onClick={async () => { if (window.confirm(`Delete ${e.name} and ALL its marks?`)) { await api.del(`/exams/${e.id}`); toast('Exam deleted'); reloadExams(); } }} className="rounded-lg p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600"><Icon name="trash" size={15} /></button>
                  </div></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal open={examModal} onClose={() => setExamModal(false)} title={editExam ? 'Edit Exam' : 'Create Examination'}>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Exam name *" className="sm:col-span-2"><input className="input" value={eForm.name} onChange={(e) => setEForm({ ...eForm, name: e.target.value })} placeholder="CAT 1 — Term 2 2026" /></Field>
          <Field label="Type"><select className="input" value={eForm.type} onChange={(e) => setEForm({ ...eForm, type: e.target.value })}>{['Opener', 'CAT', 'Mid-Term', 'End-Term', 'Mock (KPSEA/KJSEA)', 'Project Assessment'].map((t) => <option key={t}>{t}</option>)}</select></Field>
          <Field label="Date"><input className="input" type="date" value={eForm.date} onChange={(e) => setEForm({ ...eForm, date: e.target.value })} /></Field>
          <Field label="Year"><input className="input" type="number" value={eForm.year} onChange={(e) => setEForm({ ...eForm, year: Number(e.target.value) })} /></Field>
          <Field label="Term"><select className="input" value={eForm.term} onChange={(e) => setEForm({ ...eForm, term: Number(e.target.value) })}>{[1, 2, 3].map((t) => <option key={t} value={t}>Term {t}</option>)}</select></Field>
          <Field label="Grading system" className="sm:col-span-2"><select className="input" value={eForm.grading} onChange={(e) => setEForm({ ...eForm, grading: e.target.value })}>{Object.entries(GRADING_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></Field>
        </div>
        <div className="mt-6 flex justify-end gap-2"><button className="btn-ghost" onClick={() => setExamModal(false)}>Cancel</button><button className="btn-primary" disabled={!eForm.name} onClick={saveExam}>Save Exam</button></div>
      </Modal>
    </div>
  );
}
