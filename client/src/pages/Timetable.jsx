import React, { useEffect, useMemo, useState } from 'react';
import { api, toast } from '../lib/api.js';
import { useFetch, Spinner, PageHeader, Icon, Modal, Field } from '../components/ui.jsx';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
const PERIODS = ['8:00–8:40', '8:40–9:20', '9:40–10:20', '10:20–11:00', '11:20–12:00', '12:00–12:40', '2:00–2:40', '2:40–3:20'];
const CELL_COLORS = ['bg-emerald-50 text-emerald-900 border-emerald-100', 'bg-sky-50 text-sky-900 border-sky-100', 'bg-violet-50 text-violet-900 border-violet-100', 'bg-amber-50 text-amber-900 border-amber-100', 'bg-rose-50 text-rose-900 border-rose-100', 'bg-teal-50 text-teal-900 border-teal-100', 'bg-indigo-50 text-indigo-900 border-indigo-100', 'bg-orange-50 text-orange-900 border-orange-100'];
const colorFor = (id) => { let h = 0; for (const c of String(id || '')) h = (h * 31 + c.charCodeAt(0)) % 997; return CELL_COLORS[h % CELL_COLORS.length]; };

export default function Timetable() {
  const { data: classes } = useFetch(() => api.get('/classes'));
  const { data: subjects } = useFetch(() => api.get('/subjects'));
  const { data: staff } = useFetch(() => api.get('/staff'));
  const [classId, setClassId] = useState('');
  const [stream, setStream] = useState('');
  const [tt, setTt] = useState(null);
  const [generating, setGenerating] = useState(false);
  const [editSlot, setEditSlot] = useState(null);
  const [slotSubject, setSlotSubject] = useState('');
  const [slotTeacher, setSlotTeacher] = useState('');

  const sorted = useMemo(() => [...(classes || [])].filter((c) => c.level !== 'Pre-Primary').sort((a, b) => a.order - b.order), [classes]);
  useEffect(() => { if (!classId && sorted.length) setClassId(sorted.find((c) => c.name === 'Grade 7')?.id || sorted[0].id); }, [sorted, classId]);
  const cls = sorted.find((c) => c.id === classId);
  useEffect(() => { if (cls && !cls.streams.includes(stream)) setStream(cls.streams[0] || ''); }, [cls, stream]);

  const load = () => { if (classId) api.get(`/timetable?classId=${classId}&stream=${encodeURIComponent(stream || '')}`).then((rows) => setTt(rows[0] || null)); };
  useEffect(load, [classId, stream]); // eslint-disable-line

  const subj = (id) => (subjects || []).find((s) => s.id === id);
  const teacherName = (id) => { const t = (staff || []).find((x) => x.id === id); return t ? t.name.replace(/^(Mr|Mrs|Ms|Dr)\.?\s*/, '') : ''; };
  const slotAt = (day, p) => tt?.slots.find((s) => s.day === day && s.period === p);

  const generate = async () => {
    setGenerating(true);
    try {
      const t = await api.post('/timetable/generate', { classId, stream });
      setTt(t); toast('🪄 Timetable auto-generated — subjects balanced across the week');
    } catch (e) { toast(e.message, 'error'); } finally { setGenerating(false); }
  };

  const saveSlot = async () => {
    await api.put('/timetable/slot', { timetableId: tt.id, day: editSlot.day, period: editSlot.period, subjectId: slotSubject, teacherId: slotTeacher });
    toast('Lesson updated'); setEditSlot(null); load();
  };

  const classSubjects = (subjects || []).filter((s) => cls && s.levels.includes(cls.level));

  if (!classes || !subjects || !staff) return <Spinner />;

  return (
    <div>
      <PageHeader title="School Timetable" subtitle="Weekly lesson schedule per class — click any lesson to change it, or auto-generate"
        actions={<>
          <button className="btn-ghost" onClick={() => window.print()}><Icon name="printer" size={15} /> Print</button>
          <button className="btn-primary" disabled={generating} onClick={generate}><Icon name="refresh" size={15} /> {generating ? 'Generating…' : 'Auto-Generate'}</button>
        </>} />

      <div className="card mb-4 grid gap-3 p-4 sm:grid-cols-2 no-print">
        <Field label="Class"><select className="input" value={classId} onChange={(e) => setClassId(e.target.value)}>{sorted.map((c) => <option key={c.id} value={c.id}>{c.name} — {c.level}</option>)}</select></Field>
        <Field label="Stream"><select className="input" value={stream} onChange={(e) => setStream(e.target.value)}>{(cls?.streams || []).map((s) => <option key={s}>{s}</option>)}</select></Field>
      </div>

      <div className="card overflow-x-auto p-4 print-area">
        <h3 className="mb-3 text-center font-extrabold text-slate-800">{cls?.name} {stream} — Weekly Timetable</h3>
        {!tt ? <p className="py-10 text-center text-slate-400">No timetable yet for this class. Click <b>Auto-Generate</b> to create one.</p> : (
          <table className="w-full min-w-[860px] border-collapse">
            <thead><tr>
              <th className="th">Day / Time</th>
              {PERIODS.map((p, i) => <th key={p} className="th text-center">P{i + 1}<span className="block text-[9px] font-medium normal-case">{p}</span></th>)}
            </tr></thead>
            <tbody>
              {DAYS.map((day) => (
                <tr key={day}>
                  <td className="td font-bold text-slate-600">{day.slice(0, 3)}</td>
                  {PERIODS.map((_, pi) => {
                    const slot = slotAt(day, pi + 1);
                    const sub = slot && subj(slot.subjectId);
                    return (
                      <td key={pi} className="td p-1.5!">
                        <button onClick={() => { setEditSlot({ day, period: pi + 1 }); setSlotSubject(slot?.subjectId || classSubjects[0]?.id || ''); setSlotTeacher(slot?.teacherId || ''); }}
                          className={`w-full rounded-lg border px-2 py-2 text-center transition hover:shadow-md ${sub ? colorFor(sub.id) : 'bg-slate-50 text-slate-300 border-slate-100'}`}>
                          <span className="block text-xs font-extrabold">{sub ? sub.code : '—'}</span>
                          <span className="block text-[9px] opacity-70">{sub ? sub.name.slice(0, 18) : 'Free'}</span>
                          <span className="block text-[9px] font-semibold opacity-60">{slot?.teacherId ? teacherName(slot.teacherId) : ''}</span>
                        </button>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        )}
        <p className="mt-3 text-center text-[11px] text-slate-400">Breaks: 9:20–9:40 (short) • 11:00–11:20 (porridge) • 12:40–2:00 (lunch) • Games & clubs: Fri 3:20–4:30</p>
      </div>

      <Modal open={!!editSlot} onClose={() => setEditSlot(null)} title={editSlot ? `Edit Lesson — ${editSlot.day}, Period ${editSlot.period}` : ''}>
        <div className="grid gap-4">
          <Field label="Learning area"><select className="input" value={slotSubject} onChange={(e) => { setSlotSubject(e.target.value); const t = (staff || []).find((x) => (x.subjects || []).includes(e.target.value)); if (t) setSlotTeacher(t.id); }}>{classSubjects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}</select></Field>
          <Field label="Teacher"><select className="input" value={slotTeacher} onChange={(e) => setSlotTeacher(e.target.value)}><option value="">— Unassigned —</option>{(staff || []).filter((t) => (t.subjects || []).length).map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}</select></Field>
        </div>
        <div className="mt-5 flex justify-end gap-2"><button className="btn-ghost" onClick={() => setEditSlot(null)}>Cancel</button><button className="btn-primary" onClick={saveSlot}>Save Lesson</button></div>
      </Modal>
    </div>
  );
}
