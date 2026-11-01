import React, { useMemo, useState } from 'react';
import { api, toast } from '../lib/api.js';
import { LEVELS, PATHWAYS, GRADING, GRADING_LABELS } from '../lib/utils.js';
import { useFetch, Spinner, PageHeader, Icon, Modal, Field, Tabs, GradeChip } from '../components/ui.jsx';
import { useAuth } from '../App.jsx';

export default function Academics() {
  const { settings } = useAuth();
  const [tab, setTab] = useState('classes');
  const { data: classes, reload: reloadC } = useFetch(() => api.get('/classes'));
  const { data: subjects, reload: reloadS } = useFetch(() => api.get('/subjects'));
  const { data: staff } = useFetch(() => api.get('/staff'));
  const { data: students } = useFetch(() => api.get('/students'));
  const [classModal, setClassModal] = useState(false);
  const [subModal, setSubModal] = useState(false);
  const [cForm, setCForm] = useState({ name: '', level: 'Junior School', streamsText: 'East, West', classTeacherId: '', capacity: 45, order: 7 });
  const [sForm, setSForm] = useState({ name: '', code: '', levels: ['Junior School'], pathway: '', strandsText: '' });
  const [editC, setEditC] = useState(null);
  const [editS, setEditS] = useState(null);

  const countIn = (cid) => (students || []).filter((s) => s.classId === cid).length;
  const sorted = useMemo(() => [...(classes || [])].sort((a, b) => a.order - b.order), [classes]);

  const saveClass = async () => {
    const payload = { name: cForm.name, level: cForm.level, streams: cForm.streamsText.split(',').map((x) => x.trim()).filter(Boolean), classTeacherId: cForm.classTeacherId, capacity: Number(cForm.capacity), order: Number(cForm.order) };
    try {
      if (editC) { await api.put(`/classes/${editC}`, payload); toast('Class updated'); } else { await api.post('/classes', payload); toast('Class created'); }
      setClassModal(false); reloadC();
    } catch (e) { toast(e.message, 'error'); }
  };
  const saveSubject = async () => {
    const payload = { name: sForm.name, code: sForm.code.toUpperCase(), levels: sForm.levels, pathway: sForm.levels.includes('Senior School') ? sForm.pathway || undefined : undefined, strands: sForm.strandsText.split(',').map((x) => x.trim()).filter(Boolean) };
    try {
      if (editS) { await api.put(`/subjects/${editS}`, payload); toast('Subject updated'); } else { await api.post('/subjects', payload); toast('Subject / learning area added'); }
      setSubModal(false); reloadS();
    } catch (e) { toast(e.message, 'error'); }
  };
  const toggleLevel = (l) => setSForm((f) => ({ ...f, levels: f.levels.includes(l) ? f.levels.filter((x) => x !== l) : [...f.levels, l] }));

  if (!classes || !subjects) return <Spinner />;

  return (
    <div>
      <PageHeader title="Academics — CBC Setup" subtitle="Classes, learning areas & the Kenyan competency-based framework structure" />
      <Tabs tabs={[{ id: 'classes', label: '🏫 Classes & Streams' }, { id: 'subjects', label: '📚 Learning Areas' }, { id: 'framework', label: '🇰🇪 CBC Framework' }]} active={tab} onChange={setTab} />

      {tab === 'classes' && (
        <>
          <div className="mb-3 flex justify-end"><button className="btn-primary" onClick={() => { setCForm({ name: '', level: 'Junior School', streamsText: 'East', classTeacherId: staff?.[0]?.id || '', capacity: 45, order: 7 }); setEditC(null); setClassModal(true); }}><Icon name="plus" size={15} /> Add Class</button></div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {sorted.map((c) => (
              <div key={c.id} className="card p-4 animate-fadeUp">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-lg font-extrabold text-slate-800">{c.name}</h3>
                    <p className="text-xs font-semibold text-brand-600">{c.level}</p>
                  </div>
                  <span className="rounded-xl bg-brand-50 px-2.5 py-1 text-sm font-extrabold text-brand-700">{countIn(c.id)} learners</span>
                </div>
                <p className="mt-2 text-sm text-slate-500">Streams: <b className="text-slate-700">{c.streams.join(', ')}</b></p>
                <p className="text-sm text-slate-500">Class teacher: <b className="text-slate-700">{(staff || []).find((t) => t.id === c.classTeacherId)?.name || '—'}</b></p>
                <div className="mt-3 flex gap-2">
                  <button className="btn-ghost py-1.5! text-xs" onClick={() => { setCForm({ ...c, streamsText: c.streams.join(', ') }); setEditC(c.id); setClassModal(true); }}><Icon name="edit" size={13} /> Edit</button>
                  <button className="btn-ghost py-1.5! text-xs hover:bg-rose-50! hover:text-rose-600" onClick={async () => { if (window.confirm(`Delete ${c.name}?`)) { await api.del(`/classes/${c.id}`); toast('Class deleted'); reloadC(); } }}><Icon name="trash" size={13} /> Delete</button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {tab === 'subjects' && (
        <>
          <div className="mb-3 flex justify-end"><button className="btn-primary" onClick={() => { setSForm({ name: '', code: '', levels: ['Junior School'], pathway: '', strandsText: '' }); setEditS(null); setSubModal(true); }}><Icon name="plus" size={15} /> Add Learning Area</button></div>
          <div className="card overflow-x-auto">
            <table className="w-full min-w-[720px]">
              <thead><tr><th className="th">Code</th><th className="th">Learning Area</th><th className="th">Levels</th><th className="th">Pathway</th><th className="th">Strands</th><th className="th no-print">Actions</th></tr></thead>
              <tbody>
                {subjects.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50">
                    <td className="td"><span className="rounded-md bg-slate-100 px-2 py-0.5 font-mono text-xs font-bold">{s.code}</span></td>
                    <td className="td font-semibold text-slate-800">{s.name}</td>
                    <td className="td">{s.levels.map((l) => <span key={l} className="mb-0.5 mr-1 inline-block rounded-full bg-brand-50 px-2 py-0.5 text-[10px] font-bold text-brand-700">{l}</span>)}</td>
                    <td className="td">{s.pathway || <span className="text-slate-300">—</span>}</td>
                    <td className="td max-w-[260px] truncate text-xs text-slate-500">{(s.strands || []).join(' • ')}</td>
                    <td className="td no-print"><div className="flex gap-1">
                      <button onClick={() => { setSForm({ name: s.name, code: s.code, levels: s.levels, pathway: s.pathway || '', strandsText: (s.strands || []).join(', ') }); setEditS(s.id); setSubModal(true); }} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"><Icon name="edit" size={15} /></button>
                      <button onClick={async () => { if (window.confirm(`Delete ${s.name}?`)) { await api.del(`/subjects/${s.id}`); toast('Deleted'); reloadS(); } }} className="rounded-lg p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600"><Icon name="trash" size={15} /></button>
                    </div></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {tab === 'framework' && (
        <div className="space-y-4">
          <div className="card p-5">
            <h3 className="mb-1 font-bold text-slate-800">Structure of Basic Education — 2-6-3-3-3</h3>
            <p className="mb-4 text-sm text-slate-500">Under the Competency Based Curriculum (CBE framework), learners progress through five levels. National assessments: <b>KPSEA</b> (end of Grade 6) and <b>KJSEA</b> (end of Grade 9) for Senior School pathway placement.</p>
            <div className="grid gap-3 md:grid-cols-5">
              {[
                ['Pre-Primary', 'PP1 – PP2', '2 years • Ages 4–5'],
                ['Lower Primary', 'Grade 1 – 3', '3 years • Literacy & numeracy'],
                ['Upper Primary', 'Grade 4 – 6', '3 years • KPSEA at Grade 6'],
                ['Junior School', 'Grade 7 – 9', '3 years • KJSEA at Grade 9'],
                ['Senior School', 'Grade 10 – 12', '3 years • Pathway specialisation'],
              ].map(([lvl, grades, note], i) => (
                <div key={lvl} className="rounded-xl border border-slate-100 bg-gradient-to-b from-brand-50/70 to-white p-3 text-center">
                  <p className="text-[10px] font-black uppercase tracking-wide text-slate-400">Level {i + 1}</p>
                  <p className="mt-1 font-extrabold text-brand-800">{lvl}</p>
                  <p className="text-sm font-semibold text-slate-600">{grades}</p>
                  <p className="mt-1 text-[11px] text-slate-400">{note}</p>
                  <p className="mt-2 text-xs font-bold text-slate-500">{(students || []).filter((s) => classes.find((c) => c.id === s.classId)?.level === lvl).length} learners enrolled</p>
                </div>
              ))}
            </div>
            <h4 className="mb-2 mt-6 font-bold text-slate-700">Senior School Pathways (Grade 10–12)</h4>
            <div className="grid gap-3 md:grid-cols-3">
              {[
                ['🔬 STEM', 'Pure Sciences, Applied Sciences, Technical Studies — for aspiring engineers, doctors, technologists.'],
                ['🌍 Social Sciences', 'Humanities & Business Studies, Languages & Literature — law, business, teaching, journalism.'],
                ['🎨 Arts & Sports Science', 'Arts and Sports Science tracks — music, fine art, theatre, professional sports & recreation.'],
              ].map(([t, d]) => (
                <div key={t} className="rounded-xl bg-slate-50 p-4"><p className="font-bold text-slate-800">{t}</p><p className="mt-1 text-sm leading-relaxed text-slate-500">{d}</p></div>
              ))}
            </div>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <div className="card p-5">
              <h3 className="mb-3 font-bold text-slate-800">7 Core Competencies of CBC</h3>
              <div className="flex flex-wrap gap-2">
                {(settings?.coreCompetencies || []).map((c) => <span key={c} className="rounded-full bg-brand-50 px-3 py-1.5 text-[13px] font-semibold text-brand-800">{c}</span>)}
              </div>
              <h3 className="mb-3 mt-5 font-bold text-slate-800">National Values & Principles</h3>
              <div className="flex flex-wrap gap-2">
                {(settings?.values || []).map((v) => <span key={v} className="rounded-full bg-amber-50 px-3 py-1.5 text-[13px] font-semibold text-amber-800">{v}</span>)}
              </div>
              <p className="mt-4 text-sm leading-relaxed text-slate-500">Assessment in CBC is continuous: formative (classroom) + summative (KNEC national assessments). Elimu360 tracks both — scores, rubrics (EE/ME/AE/BE) and competency growth per learner.</p>
            </div>
            <div className="card p-5">
              <h3 className="mb-3 font-bold text-slate-800">Grading Systems Supported</h3>
              {Object.entries(GRADING).map(([key, rows]) => (
                <div key={key} className="mb-4">
                  <p className="mb-1.5 text-sm font-bold text-slate-700">{GRADING_LABELS[key]}</p>
                  <div className="flex flex-wrap gap-1.5">
                    {rows.map((r) => <span key={r.grade} className="flex items-center gap-1.5 rounded-lg bg-slate-50 px-2 py-1 text-xs"><GradeChip grade={r.grade} /><span className="text-slate-500">{r.min}+ • {r.points} pts</span></span>)}
                  </div>
                </div>
              ))}
              <p className="text-sm text-slate-500">Each examination can use a different system — e.g. CBE 8-band for KJSEA mock exams, CBC 4-level rubrics for school-based assessment, KCSE grading for legacy 8-4-4 classes.</p>
            </div>
          </div>
        </div>
      )}

      <Modal open={classModal} onClose={() => setClassModal(false)} title={editC ? 'Edit Class' : 'Add Class'}>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Class name *"><input className="input" value={cForm.name} onChange={(e) => setCForm({ ...cForm, name: e.target.value })} placeholder="Grade 7" /></Field>
          <Field label="CBC Level"><select className="input" value={cForm.level} onChange={(e) => setCForm({ ...cForm, level: e.target.value })}>{LEVELS.map((l) => <option key={l}>{l}</option>)}</select></Field>
          <Field label="Streams (comma separated)"><input className="input" value={cForm.streamsText} onChange={(e) => setCForm({ ...cForm, streamsText: e.target.value })} placeholder="East, West" /></Field>
          <Field label="Class teacher"><select className="input" value={cForm.classTeacherId} onChange={(e) => setCForm({ ...cForm, classTeacherId: e.target.value })}>{(staff || []).map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}</select></Field>
          <Field label="Capacity"><input className="input" type="number" value={cForm.capacity} onChange={(e) => setCForm({ ...cForm, capacity: e.target.value })} /></Field>
          <Field label="Sort order (grade number)"><input className="input" type="number" value={cForm.order} onChange={(e) => setCForm({ ...cForm, order: e.target.value })} /></Field>
        </div>
        <div className="mt-6 flex justify-end gap-2"><button className="btn-ghost" onClick={() => setClassModal(false)}>Cancel</button><button className="btn-primary" disabled={!cForm.name} onClick={saveClass}>Save Class</button></div>
      </Modal>

      <Modal open={subModal} onClose={() => setSubModal(false)} title={editS ? 'Edit Learning Area' : 'Add Learning Area'}>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Name *"><input className="input" value={sForm.name} onChange={(e) => setSForm({ ...sForm, name: e.target.value })} placeholder="Integrated Science" /></Field>
          <Field label="Code *"><input className="input" value={sForm.code} onChange={(e) => setSForm({ ...sForm, code: e.target.value })} placeholder="ISC" /></Field>
        </div>
        <p className="mb-2 mt-4 text-xs font-bold uppercase tracking-wider text-slate-400">Offered at levels</p>
        <div className="flex flex-wrap gap-1.5">
          {LEVELS.map((l) => <button key={l} onClick={() => toggleLevel(l)} className={`rounded-full px-3 py-1 text-xs font-semibold ${sForm.levels.includes(l) ? 'bg-brand-600 text-white' : 'bg-slate-100 text-slate-600'}`}>{l}</button>)}
        </div>
        {sForm.levels.includes('Senior School') && (
          <Field label="Senior pathway" className="mt-4"><select className="input" value={sForm.pathway} onChange={(e) => setSForm({ ...sForm, pathway: e.target.value })}><option value="">Core (all pathways)</option>{PATHWAYS.map((p) => <option key={p}>{p}</option>)}</select></Field>
        )}
        <Field label="Strands (comma separated)" className="mt-4"><input className="input" value={sForm.strandsText} onChange={(e) => setSForm({ ...sForm, strandsText: e.target.value })} placeholder="Numbers, Algebra, Geometry…" /></Field>
        <div className="mt-6 flex justify-end gap-2"><button className="btn-ghost" onClick={() => setSubModal(false)}>Cancel</button><button className="btn-primary" disabled={!sForm.name || !sForm.code} onClick={saveSubject}>Save</button></div>
      </Modal>
    </div>
  );
}
