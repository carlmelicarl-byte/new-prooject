import React, { useState } from 'react';
import { api, toast } from '../lib/api.js';
import { useFetch, Spinner, PageHeader, Icon, Modal, Field, Avatar, EmptyState } from '../components/ui.jsx';

const blank = { name: '', tscNo: '', designation: 'Teacher', role: 'Teacher', subjects: [], phone: '', email: '', gender: 'Female', qualification: '', status: 'Active' };

export default function Staff() {
  const { data: staff, loading, reload } = useFetch(() => api.get('/staff'));
  const { data: subjects } = useFetch(() => api.get('/subjects'));
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState(blank);
  const [editingId, setEditingId] = useState(null);

  const filtered = (staff || []).filter((s) => !search || s.name.toLowerCase().includes(search.toLowerCase()) || (s.tscNo || '').toLowerCase().includes(search.toLowerCase()));
  const subName = (id) => (subjects || []).find((x) => x.id === id)?.code || id;

  const save = async () => {
    try {
      if (editingId) { await api.put(`/staff/${editingId}`, form); toast('Staff member updated'); }
      else { await api.post('/staff', form); toast('Staff member added'); }
      setModal(false); reload();
    } catch (e) { toast(e.message, 'error'); }
  };
  const remove = async (s) => { if (window.confirm(`Remove ${s.name}?`)) { await api.del(`/staff/${s.id}`); toast('Removed'); reload(); } };
  const toggleSubject = (id) => setForm((f) => ({ ...f, subjects: f.subjects.includes(id) ? f.subjects.filter((x) => x !== id) : [...f.subjects, id] }));

  if (loading) return <Spinner />;

  return (
    <div>
      <PageHeader title="Staff & Teachers" subtitle={`${filtered.length} staff members • TSC registered`}
        actions={<button className="btn-primary" onClick={() => { setForm(blank); setEditingId(null); setModal(true); }}><Icon name="plus" size={16} /> Add Staff</button>} />
      <div className="card mb-4 p-4 no-print">
        <input className="input" placeholder="Search by name or TSC number…" value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>
      <div className="card overflow-x-auto">
        <table className="w-full min-w-[760px]">
          <thead><tr><th className="th">Name</th><th className="th">Designation</th><th className="th">TSC No</th><th className="th">Subjects</th><th className="th">Contact</th><th className="th">Qualification</th><th className="th no-print">Actions</th></tr></thead>
          <tbody>
            {filtered.map((s) => (
              <tr key={s.id} className="hover:bg-slate-50">
                <td className="td"><span className="flex items-center gap-2.5 font-semibold text-slate-800"><Avatar name={s.name.replace(/^(Mr|Mrs|Ms|Dr)\.?\s*/, '')} />{s.name}</span></td>
                <td className="td">{s.designation}<span className="block text-[11px] text-slate-400">{s.role}</span></td>
                <td className="td font-mono text-xs">{s.tscNo || '—'}</td>
                <td className="td">{(s.subjects || []).map((id) => <span key={id} className="mb-0.5 mr-1 inline-block rounded-md bg-brand-50 px-1.5 py-0.5 text-[11px] font-bold text-brand-700">{subName(id)}</span>)}</td>
                <td className="td text-xs">{s.phone}<span className="block text-slate-400">{s.email}</span></td>
                <td className="td">{s.qualification}</td>
                <td className="td no-print"><div className="flex gap-1">
                  <button onClick={() => { setForm({ ...blank, ...s }); setEditingId(s.id); setModal(true); }} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"><Icon name="edit" size={16} /></button>
                  <button onClick={() => remove(s)} className="rounded-lg p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600"><Icon name="trash" size={16} /></button>
                </div></td>
              </tr>
            ))}
          </tbody>
        </table>
        {!filtered.length && <EmptyState />}
      </div>

      <Modal open={modal} onClose={() => setModal(false)} title={editingId ? 'Edit Staff Member' : 'Add Staff Member'} wide>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Full name (incl. title) *"><input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Mrs. Jane Wafula" /></Field>
          <Field label="TSC Number"><input className="input" value={form.tscNo} onChange={(e) => setForm({ ...form, tscNo: e.target.value })} placeholder="TSC/123456/2018" /></Field>
          <Field label="Designation"><input className="input" value={form.designation} onChange={(e) => setForm({ ...form, designation: e.target.value })} /></Field>
          <Field label="System role"><select className="input" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>{['Admin', 'Teacher', 'Accountant', 'Non-Teaching'].map((r) => <option key={r}>{r}</option>)}</select></Field>
          <Field label="Phone"><input className="input" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></Field>
          <Field label="Email"><input className="input" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></Field>
          <Field label="Gender"><select className="input" value={form.gender} onChange={(e) => setForm({ ...form, gender: e.target.value })}><option>Female</option><option>Male</option></select></Field>
          <Field label="Qualification"><input className="input" value={form.qualification} onChange={(e) => setForm({ ...form, qualification: e.target.value })} placeholder="B.Ed (Kenyatta University)" /></Field>
        </div>
        <p className="mb-2 mt-5 text-xs font-bold uppercase tracking-wider text-slate-400">Teaching subjects</p>
        <div className="flex flex-wrap gap-1.5">
          {(subjects || []).map((s) => (
            <button key={s.id} onClick={() => toggleSubject(s.id)} className={`rounded-full px-3 py-1 text-xs font-semibold transition ${form.subjects.includes(s.id) ? 'bg-brand-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>{s.name}</button>
          ))}
        </div>
        <div className="mt-6 flex justify-end gap-2">
          <button className="btn-ghost" onClick={() => setModal(false)}>Cancel</button>
          <button className="btn-primary" disabled={!form.name} onClick={save}>Save</button>
        </div>
      </Modal>
    </div>
  );
}
