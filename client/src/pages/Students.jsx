import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, toast } from '../lib/api.js';
import { useFetch, Spinner, PageHeader, Icon, Modal, Field, Avatar, EmptyState } from '../components/ui.jsx';
import { PATHWAYS, studentName } from '../lib/utils.js';

const blank = {
  firstName: '', lastName: '', gender: 'Female', dob: '', classId: '', stream: '',
  upi: '', nemis: '', birthCertNo: '', house: 'Simba', pathway: '', boarding: false,
  transportRouteId: '', county: 'Kiambu', estate: '', admNo: '', status: 'Active',
  guardian: { name: '', relation: 'Mother', phone: '', email: '' },
};

export default function Students() {
  const { data: students, loading, reload } = useFetch(() => api.get('/students'));
  const { data: classes } = useFetch(() => api.get('/classes'));
  const { data: routes } = useFetch(() => api.get('/routes'));
  const [search, setSearch] = useState('');
  const [classId, setClassId] = useState('');
  const [gender, setGender] = useState('');
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState(blank);
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);

  const classMap = useMemo(() => Object.fromEntries((classes || []).map((c) => [c.id, c])), [classes]);
  const sortedClasses = useMemo(() => [...(classes || [])].sort((a, b) => a.order - b.order), [classes]);

  const filtered = (students || []).filter((s) => {
    if (classId && s.classId !== classId) return false;
    if (gender && s.gender !== gender) return false;
    const q = search.toLowerCase();
    return !q || studentName(s).toLowerCase().includes(q) || s.admNo.toLowerCase().includes(q) || (s.upi || '').includes(q);
  });

  const openNew = () => { setForm({ ...blank, classId: sortedClasses[0]?.id || '' }); setEditingId(null); setModal(true); };
  const openEdit = (s) => { setForm({ ...blank, ...s, guardian: { ...blank.guardian, ...s.guardian } }); setEditingId(s.id); setModal(true); };

  const save = async () => {
    setSaving(true);
    try {
      if (editingId) { await api.put(`/students/${editingId}`, form); toast('Learner updated'); }
      else { await api.post('/students', { ...form, admNo: form.admNo || `ZA/${Date.now().toString().slice(-6)}` }); toast('Learner admitted successfully 🎉'); }
      setModal(false); reload();
    } catch (e) { toast(e.message, 'error'); } finally { setSaving(false); }
  };

  const remove = async (s) => {
    if (!window.confirm(`Delete ${studentName(s)}? Their marks will also be removed.`)) return;
    await api.del(`/students/${s.id}`); toast('Learner deleted'); reload();
  };

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const setG = (k, v) => setForm((f) => ({ ...f, guardian: { ...f.guardian, [k]: v } }));
  const selectedClass = classMap[form.classId];

  if (loading) return <Spinner />;

  return (
    <div>
      <PageHeader title="Learners" subtitle={`${filtered.length} learners • NEMIS / UPI ready`}
        actions={<button className="btn-primary" onClick={openNew}><Icon name="plus" size={16} /> Admit Learner</button>} />

      <div className="card mb-4 flex flex-wrap gap-3 p-4 no-print">
        <div className="relative min-w-56 flex-1">
          <span className="absolute left-3 top-2.5 text-slate-400"><Icon name="search" size={16} /></span>
          <input className="input pl-9" placeholder="Search name, admission no or UPI…" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <select className="input w-44" value={classId} onChange={(e) => setClassId(e.target.value)}>
          <option value="">All Classes</option>
          {sortedClasses.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <select className="input w-36" value={gender} onChange={(e) => setGender(e.target.value)}>
          <option value="">All Genders</option><option>Male</option><option>Female</option>
        </select>
      </div>

      <div className="card overflow-x-auto">
        <table className="w-full min-w-[820px]">
          <thead><tr><th className="th">Learner</th><th className="th">Adm No</th><th className="th">Class</th><th className="th">Gender</th><th className="th">Guardian</th><th className="th">Boarding / Bus</th><th className="th no-print">Actions</th></tr></thead>
          <tbody>
            {filtered.map((s) => (
              <tr key={s.id} className="hover:bg-slate-50">
                <td className="td">
                  <Link to={`/students/${s.id}`} className="flex items-center gap-2.5 font-semibold text-slate-800 hover:text-brand-700">
                    <Avatar name={studentName(s)} /> {studentName(s)}
                  </Link>
                </td>
                <td className="td font-mono text-xs">{s.admNo}<span className="block text-[10px] text-slate-400">{s.upi}</span></td>
                <td className="td">{classMap[s.classId]?.name} {s.stream}<span className="block text-[11px] text-slate-400">{classMap[s.classId]?.level}{s.pathway ? ` • ${s.pathway}` : ''}</span></td>
                <td className="td">{s.gender}</td>
                <td className="td">{s.guardian?.name}<span className="block text-[11px] text-slate-400">{s.guardian?.phone}</span></td>
                <td className="td">
                  {s.boarding ? <span className="mr-1 rounded-full bg-indigo-50 px-2 py-0.5 text-[11px] font-bold text-indigo-700">Boarder</span> : <span className="mr-1 rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-bold text-slate-500">Day</span>}
                  {s.transportRouteId && <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-bold text-amber-700">🚌 Bus</span>}
                </td>
                <td className="td no-print">
                  <div className="flex gap-1">
                    <Link to={`/students/${s.id}`} className="rounded-lg p-1.5 text-slate-400 hover:bg-brand-50 hover:text-brand-700"><Icon name="chart" size={16} /></Link>
                    <button onClick={() => openEdit(s)} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"><Icon name="edit" size={16} /></button>
                    <button onClick={() => remove(s)} className="rounded-lg p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600"><Icon name="trash" size={16} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!filtered.length && <EmptyState hint="Try a different search or admit a new learner." />}
      </div>

      <Modal open={modal} onClose={() => setModal(false)} title={editingId ? 'Edit Learner' : 'Admit New Learner'} wide>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="First name *"><input className="input" value={form.firstName} onChange={(e) => set('firstName', e.target.value)} /></Field>
          <Field label="Surname *"><input className="input" value={form.lastName} onChange={(e) => set('lastName', e.target.value)} /></Field>
          <Field label="Admission No"><input className="input" value={form.admNo} onChange={(e) => set('admNo', e.target.value)} placeholder="Auto-generated if blank" /></Field>
          <Field label="Gender"><select className="input" value={form.gender} onChange={(e) => set('gender', e.target.value)}><option>Female</option><option>Male</option></select></Field>
          <Field label="Date of birth"><input className="input" type="date" value={form.dob} onChange={(e) => set('dob', e.target.value)} /></Field>
          <Field label="Birth Certificate No"><input className="input" value={form.birthCertNo} onChange={(e) => set('birthCertNo', e.target.value)} /></Field>
          <Field label="UPI Number"><input className="input" value={form.upi} onChange={(e) => set('upi', e.target.value)} placeholder="UPI-…" /></Field>
          <Field label="NEMIS No"><input className="input" value={form.nemis} onChange={(e) => set('nemis', e.target.value)} /></Field>
          <Field label="Class *">
            <select className="input" value={form.classId} onChange={(e) => { set('classId', e.target.value); set('stream', classMap[e.target.value]?.streams?.[0] || ''); }}>
              {sortedClasses.map((c) => <option key={c.id} value={c.id}>{c.name} — {c.level}</option>)}
            </select>
          </Field>
          <Field label="Stream">
            <select className="input" value={form.stream} onChange={(e) => set('stream', e.target.value)}>
              {(selectedClass?.streams || []).map((st) => <option key={st}>{st}</option>)}
            </select>
          </Field>
          <Field label="House"><select className="input" value={form.house} onChange={(e) => set('house', e.target.value)}>{['Simba', 'Twiga', 'Tembo', 'Kifaru'].map((h) => <option key={h}>{h}</option>)}</select></Field>
          {selectedClass?.level === 'Senior School' && (
            <Field label="Senior School Pathway">
              <select className="input" value={form.pathway} onChange={(e) => set('pathway', e.target.value)}>
                <option value="">Select pathway…</option>{PATHWAYS.map((p) => <option key={p}>{p}</option>)}
              </select>
            </Field>
          )}
          <Field label="Transport route">
            <select className="input" value={form.transportRouteId} onChange={(e) => set('transportRouteId', e.target.value)}>
              <option value="">No school bus</option>{(routes || []).map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
            </select>
          </Field>
          <Field label="Home estate / area"><input className="input" value={form.estate} onChange={(e) => set('estate', e.target.value)} /></Field>
          <label className="flex items-center gap-2 pt-6 text-sm font-medium text-slate-600">
            <input type="checkbox" className="h-4 w-4 accent-emerald-600" checked={!!form.boarding} onChange={(e) => set('boarding', e.target.checked)} /> Boarding learner
          </label>
        </div>
        <h4 className="mb-2 mt-5 text-xs font-bold uppercase tracking-wider text-slate-400">Parent / Guardian</h4>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Guardian name"><input className="input" value={form.guardian.name} onChange={(e) => setG('name', e.target.value)} /></Field>
          <Field label="Relation"><select className="input" value={form.guardian.relation} onChange={(e) => setG('relation', e.target.value)}>{['Mother', 'Father', 'Guardian', 'Grandparent'].map((r) => <option key={r}>{r}</option>)}</select></Field>
          <Field label="Phone (M-Pesa / SMS)"><input className="input" value={form.guardian.phone} onChange={(e) => setG('phone', e.target.value)} placeholder="0712…" /></Field>
          <Field label="Email"><input className="input" value={form.guardian.email} onChange={(e) => setG('email', e.target.value)} /></Field>
        </div>
        <div className="mt-6 flex justify-end gap-2">
          <button className="btn-ghost" onClick={() => setModal(false)}>Cancel</button>
          <button className="btn-primary" disabled={saving || !form.firstName} onClick={save}>{saving ? 'Saving…' : editingId ? 'Save Changes' : 'Admit Learner'}</button>
        </div>
      </Modal>
    </div>
  );
}
