import React, { useEffect, useMemo, useState } from 'react';
import { ResponsiveContainer, RadarChart, Radar, PolarGrid, PolarAngleAxis, Tooltip } from 'recharts';
import { api, toast } from '../lib/api.js';
import { fmtDate, studentName, CORE_COMPETENCIES, LEVEL_NAMES, LEVEL_LABELS } from '../lib/utils.js';
import { useFetch, Spinner, PageHeader, Icon, Modal, Field, Tabs, GradeChip } from '../components/ui.jsx';
import { useAuth } from '../App.jsx';

const asgBlank = { title: '', subjectId: '', classId: '', strand: '', subStrand: '', description: '', dueDate: '', totalMarks: 20, type: 'Homework' };

export default function Learning() {
  const { settings } = useAuth();
  const [tab, setTab] = useState('assignments');
  const { data: assignments, reload } = useFetch(() => api.get('/assignments'));
  const { data: subjects } = useFetch(() => api.get('/subjects'));
  const { data: classes } = useFetch(() => api.get('/classes'));
  const { data: students } = useFetch(() => api.get('/students'));
  const [asgModal, setAsgModal] = useState(false);
  const [aForm, setAForm] = useState(asgBlank);
  const [editId, setEditId] = useState(null);
  const [explorerSubject, setExplorerSubject] = useState('');

  // competency assessment state
  const [cmpClass, setCmpClass] = useState('');
  const [cmpStudent, setCmpStudent] = useState('');
  const [ratings, setRatings] = useState({});

  const sortedClasses = useMemo(() => [...(classes || [])].sort((a, b) => a.order - b.order), [classes]);
  useEffect(() => { if (!cmpClass && sortedClasses.length) setCmpClass(sortedClasses[5]?.id || sortedClasses[0].id); }, [sortedClasses, cmpClass]);
  useEffect(() => { if (!explorerSubject && subjects?.length) setExplorerSubject(subjects[2].id); }, [subjects, explorerSubject]);

  const cmpRoster = useMemo(() => (students || []).filter((s) => s.classId === cmpClass), [students, cmpClass]);
  useEffect(() => { if (cmpRoster.length && !cmpRoster.find((s) => s.id === cmpStudent)) setCmpStudent(cmpRoster[0].id); }, [cmpRoster, cmpStudent]);

  useEffect(() => {
    if (!cmpStudent) return;
    api.get(`/competencies?studentId=${cmpStudent}`).then((rows) => {
      const cur = rows.find((r) => r.year === settings.currentYear && r.term === settings.currentTerm) || rows[rows.length - 1];
      const init = {};
      CORE_COMPETENCIES.forEach((c) => { init[c] = cur?.ratings?.[c] || 3; });
      setRatings(init);
    });
  }, [cmpStudent]); // eslint-disable-line

  const saveAsg = async () => {
    try {
      if (editId) { await api.put(`/assignments/${editId}`, aForm); toast('Assignment updated'); }
      else { await api.post('/assignments', aForm); toast('📚 Assignment published to class'); }
      setAsgModal(false); reload();
    } catch (e) { toast(e.message, 'error'); }
  };

  const saveCompetencies = async () => {
    await api.post('/competencies', { studentId: cmpStudent, year: settings.currentYear, term: settings.currentTerm, ratings });
    toast('🌟 Competency assessment saved — appears on the report form');
  };

  const subjectName = (id) => (subjects || []).find((s) => s.id === id)?.name || '—';
  const className = (id) => (classes || []).find((c) => c.id === id)?.name || '—';
  const explorer = (subjects || []).find((s) => s.id === explorerSubject);
  const radarData = CORE_COMPETENCIES.map((c) => ({ competency: c.split(' & ')[0].split(' ')[0], full: c, level: ratings[c] || 0 }));

  if (!subjects || !classes || !students) return <Spinner />;

  return (
    <div>
      <PageHeader title="CBC Learning Centre" subtitle="Assignments & projects, strand explorer and core-competency assessment (Zeraki Learning style)"
        actions={tab === 'assignments' && <button className="btn-primary" onClick={() => { setAForm({ ...asgBlank, subjectId: subjects[0]?.id, classId: sortedClasses[0]?.id }); setEditId(null); setAsgModal(true); }}><Icon name="plus" size={15} /> New Assignment</button>} />
      <Tabs tabs={[{ id: 'assignments', label: '📝 Assignments & Projects' }, { id: 'strands', label: '🧭 Strand Explorer' }, { id: 'competencies', label: '🌟 Competency Assessment' }]} active={tab} onChange={setTab} />

      {tab === 'assignments' && (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {(assignments || []).map((a) => (
            <div key={a.id} className="card flex flex-col p-5 animate-fadeUp">
              <div className="mb-2 flex items-center gap-2">
                <span className={`rounded-full px-2 py-0.5 text-[10px] font-black uppercase ${a.type === 'Project' ? 'bg-violet-100 text-violet-800' : a.type === 'Classwork' ? 'bg-sky-100 text-sky-800' : 'bg-amber-100 text-amber-800'}`}>{a.type}</span>
                <span className="rounded-full bg-brand-50 px-2 py-0.5 text-[10px] font-bold text-brand-700">{subjectName(a.subjectId)}</span>
                <span className="text-[11px] font-semibold text-slate-400">{className(a.classId)}</span>
              </div>
              <h3 className="font-bold leading-snug text-slate-800">{a.title}</h3>
              <p className="mt-1 text-xs font-semibold text-brand-600">{a.strand}{a.subStrand ? ` → ${a.subStrand}` : ''}</p>
              <p className="mt-2 flex-1 text-sm leading-relaxed text-slate-500">{a.description}</p>
              <div className="mt-3 flex items-center justify-between border-t border-slate-50 pt-3 text-sm">
                <span className="text-slate-500">📅 Due <b>{fmtDate(a.dueDate)}</b> • {a.totalMarks} marks</span>
                <span className="flex gap-1">
                  <button onClick={() => { setAForm(a); setEditId(a.id); setAsgModal(true); }} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"><Icon name="edit" size={15} /></button>
                  <button onClick={async () => { if (window.confirm('Delete this assignment?')) { await api.del(`/assignments/${a.id}`); toast('Deleted'); reload(); } }} className="rounded-lg p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600"><Icon name="trash" size={15} /></button>
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === 'strands' && (
        <div className="grid gap-4 lg:grid-cols-3">
          <div className="card p-4">
            <h3 className="mb-3 font-bold text-slate-800">Learning Areas</h3>
            <div className="max-h-[480px] space-y-1 overflow-y-auto pr-1">
              {subjects.map((s) => (
                <button key={s.id} onClick={() => setExplorerSubject(s.id)} className={`w-full rounded-xl px-3 py-2 text-left text-sm font-semibold transition ${explorerSubject === s.id ? 'bg-brand-600 text-white' : 'hover:bg-slate-50 text-slate-600'}`}>
                  {s.name} <span className={`ml-1 text-[10px] ${explorerSubject === s.id ? 'text-brand-100' : 'text-slate-400'}`}>{s.levels.join(', ')}</span>
                </button>
              ))}
            </div>
          </div>
          <div className="card p-5 lg:col-span-2 animate-fadeUp">
            <h3 className="text-lg font-extrabold text-slate-800">{explorer?.name} <span className="text-sm font-semibold text-brand-600">({explorer?.code})</span></h3>
            <p className="text-sm text-slate-500">Offered at: {explorer?.levels.join(' • ')}{explorer?.pathway ? ` • ${explorer.pathway} pathway` : ''}</p>
            <h4 className="mb-2 mt-5 text-xs font-bold uppercase tracking-wider text-slate-400">Strands (CBC Curriculum Designs — KICD)</h4>
            <div className="grid gap-3 sm:grid-cols-2">
              {(explorer?.strands || []).map((strand, i) => (
                <div key={strand} className="rounded-xl border border-slate-100 bg-gradient-to-b from-slate-50 to-white p-4">
                  <p className="text-[10px] font-black uppercase tracking-wide text-brand-500">Strand {i + 1}.0</p>
                  <p className="mt-1 font-bold text-slate-800">{strand}</p>
                  <p className="mt-1 text-xs leading-relaxed text-slate-400">Learners explore concepts, apply skills and create outcomes assessed through observation, projects, oral & written tasks using EE/ME/AE/BE rubrics.</p>
                </div>
              ))}
            </div>
            <div className="mt-5 rounded-xl bg-brand-50 p-4 text-sm leading-relaxed text-brand-900">
              💡 <b>How CBC assessment works:</b> Every strand breaks into sub-strands with Specific Learning Outcomes (SLOs). School-Based Assessment (SBA) scores from these tasks contribute to KPSEA/KJSEA final results uploaded to the KNEC CBA portal.
            </div>
          </div>
        </div>
      )}

      {tab === 'competencies' && (
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="card p-5 animate-fadeUp">
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Class"><select className="input" value={cmpClass} onChange={(e) => setCmpClass(e.target.value)}>{sortedClasses.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></Field>
              <Field label="Learner"><select className="input" value={cmpStudent} onChange={(e) => setCmpStudent(e.target.value)}>{cmpRoster.map((s) => <option key={s.id} value={s.id}>{studentName(s)}</option>)}</select></Field>
            </div>
            <p className="mb-3 mt-4 text-sm text-slate-500">Rate each of the <b>7 CBC core competencies</b> for Term {settings.currentTerm} {settings.currentYear} using the national rubric:</p>
            <div className="space-y-3">
              {CORE_COMPETENCIES.map((c) => (
                <div key={c} className="flex flex-wrap items-center gap-2">
                  <span className="min-w-52 flex-1 text-sm font-semibold text-slate-700">{c}</span>
                  <div className="flex gap-1">
                    {[4, 3, 2, 1].map((v) => (
                      <button key={v} onClick={() => setRatings((r) => ({ ...r, [c]: v }))}
                        className={`rounded-lg px-3 py-1.5 text-xs font-black transition ${ratings[c] === v ? (v >= 3 ? 'bg-emerald-600 text-white' : v === 2 ? 'bg-amber-500 text-white' : 'bg-rose-600 text-white') : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}
                        title={LEVEL_LABELS[v]}>{LEVEL_NAMES[v]}</button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            <button className="btn-primary mt-5 w-full justify-center" onClick={saveCompetencies}>💾 Save Assessment</button>
            <p className="mt-2 text-center text-xs text-slate-400">EE = Exceeding • ME = Meeting • AE = Approaching • BE = Below Expectations</p>
          </div>
          <div className="card p-5 animate-fadeUp">
            <h3 className="mb-1 font-bold text-slate-800">Competency Profile{cmpStudent ? ` — ${studentName((students || []).find((s) => s.id === cmpStudent))}` : ''}</h3>
            <ResponsiveContainer width="100%" height={320}>
              <RadarChart data={radarData}>
                <PolarGrid stroke="#e2e8f0" />
                <PolarAngleAxis dataKey="competency" tick={{ fontSize: 11 }} />
                <Radar dataKey="level" stroke="#1a7c64" fill="#279a7c" fillOpacity={0.35} />
                <Tooltip formatter={(v, n, p) => [`${LEVEL_NAMES[v]} — ${LEVEL_LABELS[v]} Expectations`, p.payload.full]} />
              </RadarChart>
            </ResponsiveContainer>
            <div className="flex flex-wrap gap-1.5">
              {CORE_COMPETENCIES.map((c) => <span key={c} className="flex items-center gap-1.5 rounded-lg bg-slate-50 px-2 py-1 text-[11px]"><GradeChip grade={LEVEL_NAMES[ratings[c] || 3]} /> {c.split(' &')[0]}</span>)}
            </div>
          </div>
        </div>
      )}

      <Modal open={asgModal} onClose={() => setAsgModal(false)} title={editId ? 'Edit Assignment' : 'New Assignment'} wide>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Title *" className="sm:col-span-2"><input className="input" value={aForm.title} onChange={(e) => setAForm({ ...aForm, title: e.target.value })} placeholder="e.g. Fractions — Practice Sheet" /></Field>
          <Field label="Learning area"><select className="input" value={aForm.subjectId} onChange={(e) => setAForm({ ...aForm, subjectId: e.target.value })}>{subjects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}</select></Field>
          <Field label="Class"><select className="input" value={aForm.classId} onChange={(e) => setAForm({ ...aForm, classId: e.target.value })}>{sortedClasses.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></Field>
          <Field label="Strand"><input className="input" value={aForm.strand} onChange={(e) => setAForm({ ...aForm, strand: e.target.value })} placeholder="Numbers" /></Field>
          <Field label="Sub-strand"><input className="input" value={aForm.subStrand} onChange={(e) => setAForm({ ...aForm, subStrand: e.target.value })} placeholder="Fractions" /></Field>
          <Field label="Type"><select className="input" value={aForm.type} onChange={(e) => setAForm({ ...aForm, type: e.target.value })}>{['Homework', 'Classwork', 'Project', 'Group Task', 'Practical'].map((t) => <option key={t}>{t}</option>)}</select></Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Due date"><input className="input" type="date" value={aForm.dueDate} onChange={(e) => setAForm({ ...aForm, dueDate: e.target.value })} /></Field>
            <Field label="Total marks"><input className="input" type="number" value={aForm.totalMarks} onChange={(e) => setAForm({ ...aForm, totalMarks: Number(e.target.value) })} /></Field>
          </div>
          <Field label="Instructions" className="sm:col-span-2"><textarea className="input" rows={3} value={aForm.description} onChange={(e) => setAForm({ ...aForm, description: e.target.value })} /></Field>
        </div>
        <div className="mt-5 flex justify-end gap-2"><button className="btn-ghost" onClick={() => setAsgModal(false)}>Cancel</button><button className="btn-primary" disabled={!aForm.title} onClick={saveAsg}>Publish Assignment</button></div>
      </Modal>
    </div>
  );
}
