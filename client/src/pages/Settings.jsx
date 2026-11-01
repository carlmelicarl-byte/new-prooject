import React, { useEffect, useState } from 'react';
import { api, toast } from '../lib/api.js';
import { GRADING, GRADING_LABELS, studentName } from '../lib/utils.js';
import { useFetch, Spinner, PageHeader, Icon, Modal, Field, Tabs, GradeChip } from '../components/ui.jsx';
import { useAuth } from '../App.jsx';

export default function Settings() {
  const { settings, refreshSettings } = useAuth();
  const [tab, setTab] = useState('school');
  const [form, setForm] = useState(null);
  const [saving, setSaving] = useState(false);
  const { data: users, reload: reloadUsers } = useFetch(() => api.get('/users'));
  const { data: students } = useFetch(() => api.get('/students'));
  const [userModal, setUserModal] = useState(false);
  const [nu, setNu] = useState({ name: '', email: '', password: '', role: 'Teacher', studentId: '' });

  useEffect(() => { if (settings) setForm({ ...settings, termDates: { ...settings.termDates } }); }, [settings]);
  if (!form) return <Spinner />;

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const setTD = (k, v) => setForm((f) => ({ ...f, termDates: { ...f.termDates, [k]: v } }));

  const save = async () => {
    setSaving(true);
    try { await api.put('/settings', form); await refreshSettings(); toast('⚙️ School settings saved'); }
    catch (e) { toast(e.message, 'error'); } finally { setSaving(false); }
  };

  const createUser = async () => {
    try {
      await api.post('/users', { ...nu, studentId: ['Parent', 'Student'].includes(nu.role) ? nu.studentId : undefined });
      toast('👤 User account created'); setUserModal(false); reloadUsers();
    } catch (e) { toast(e.message, 'error'); }
  };

  const ROLE_BADGE = { Admin: 'bg-violet-100 text-violet-800', Teacher: 'bg-sky-100 text-sky-800', Accountant: 'bg-amber-100 text-amber-800', Parent: 'bg-rose-100 text-rose-800', Student: 'bg-emerald-100 text-emerald-800' };

  return (
    <div>
      <PageHeader title="School Settings" subtitle="Profile, academic calendar, grading & user accounts" />
      <Tabs tabs={[{ id: 'school', label: '🏫 School Profile' }, { id: 'grading', label: '🎯 Grading Scales' }, { id: 'users', label: '👥 Users & Roles' }]} active={tab} onChange={setTab} />

      {tab === 'school' && (
        <div className="card p-6 animate-fadeUp">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="School name"><input className="input" value={form.schoolName} onChange={(e) => set('schoolName', e.target.value)} /></Field>
            <Field label="Motto"><input className="input" value={form.motto} onChange={(e) => set('motto', e.target.value)} /></Field>
            <Field label="County"><input className="input" value={form.county} onChange={(e) => set('county', e.target.value)} /></Field>
            <Field label="Sub-county"><input className="input" value={form.subCounty} onChange={(e) => set('subCounty', e.target.value)} /></Field>
            <Field label="Postal address" className="sm:col-span-2"><input className="input" value={form.address} onChange={(e) => set('address', e.target.value)} /></Field>
            <Field label="Phone"><input className="input" value={form.phone} onChange={(e) => set('phone', e.target.value)} /></Field>
            <Field label="Email"><input className="input" value={form.email} onChange={(e) => set('email', e.target.value)} /></Field>
            <Field label="KNEC centre code"><input className="input" value={form.knECCentreCode} onChange={(e) => set('knECCentreCode', e.target.value)} /></Field>
            <Field label="M-Pesa Paybill number"><input className="input font-mono" value={form.mpesaPaybill} onChange={(e) => set('mpesaPaybill', e.target.value)} /></Field>
          </div>
          <h3 className="mb-3 mt-6 font-bold text-slate-800">Academic Calendar</h3>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            <Field label="Current year"><input className="input" type="number" value={form.currentYear} onChange={(e) => set('currentYear', Number(e.target.value))} /></Field>
            <Field label="Current term"><select className="input" value={form.currentTerm} onChange={(e) => set('currentTerm', Number(e.target.value))}>{[1, 2, 3].map((t) => <option key={t} value={t}>Term {t}</option>)}</select></Field>
            <Field label="Term opens"><input className="input" type="date" value={form.termDates.opens} onChange={(e) => setTD('opens', e.target.value)} /></Field>
            <Field label="Term closes"><input className="input" type="date" value={form.termDates.closes} onChange={(e) => setTD('closes', e.target.value)} /></Field>
            <Field label="Next term opens"><input className="input" type="date" value={form.termDates.nextOpens} onChange={(e) => setTD('nextOpens', e.target.value)} /></Field>
          </div>
          <h3 className="mb-3 mt-6 font-bold text-slate-800">Defaults</h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Default grading system for new exams">
              <select className="input" value={form.gradingSystem} onChange={(e) => set('gradingSystem', e.target.value)}>{Object.entries(GRADING_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select>
            </Field>
            <Field label="SMS credit balance"><input className="input" type="number" value={form.smsBalance} onChange={(e) => set('smsBalance', Number(e.target.value))} /></Field>
          </div>
          <div className="mt-6 flex justify-end"><button className="btn-primary" disabled={saving} onClick={save}>💾 {saving ? 'Saving…' : 'Save Settings'}</button></div>
        </div>
      )}

      {tab === 'grading' && (
        <div className="grid gap-4 lg:grid-cols-3">
          {Object.entries(GRADING).map(([key, rows]) => (
            <div key={key} className="card p-5 animate-fadeUp">
              <h3 className="font-extrabold text-slate-800">{GRADING_LABELS[key]}</h3>
              <p className="mb-3 text-xs text-slate-400">{key === 'CBC4' ? 'School-Based Assessment rubrics (formative).' : key === 'CBE8' ? 'KNEC national assessment bands for KPSEA & KJSEA.' : 'Legacy 8-4-4 KCSE grading (for transition classes).'}</p>
              <table className="w-full"><thead><tr><th className="th">Grade</th><th className="th">Range</th><th className="th">Points</th></tr></thead>
                <tbody>{rows.map((r, i) => (
                  <tr key={r.grade}><td className="td"><GradeChip grade={r.grade} /></td><td className="td">{r.min} – {i === 0 ? 100 : rows[i - 1].min - 1}</td><td className="td font-bold">{r.points}</td></tr>
                ))}</tbody></table>
            </div>
          ))}
        </div>
      )}

      {tab === 'users' && (
        <>
          <div className="mb-3 flex justify-end"><button className="btn-primary" onClick={() => { setNu({ name: '', email: '', password: '', role: 'Teacher', studentId: students?.[0]?.id || '' }); setUserModal(true); }}><Icon name="plus" size={15} /> Add User</button></div>
          <div className="card overflow-x-auto">
            <table className="w-full min-w-[640px]"><thead><tr><th className="th">Name</th><th className="th">Email</th><th className="th">Role</th><th className="th">Linked Learner</th><th className="th no-print">Actions</th></tr></thead>
              <tbody>{(users || []).map((u) => (
                <tr key={u.id} className="hover:bg-slate-50">
                  <td className="td font-semibold">{u.name}</td><td className="td">{u.email}</td>
                  <td className="td"><span className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold ${ROLE_BADGE[u.role] || 'bg-slate-100'}`}>{u.role}</span></td>
                  <td className="td">{u.studentId ? studentName((students || []).find((s) => s.id === u.studentId)) : '—'}</td>
                  <td className="td no-print"><button onClick={async () => { if (window.confirm(`Delete account for ${u.name}?`)) { await api.del(`/users/${u.id}`); toast('User deleted'); reloadUsers(); } }} className="rounded-lg p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600"><Icon name="trash" size={15} /></button></td>
                </tr>
              ))}</tbody></table>
          </div>
          <div className="card mt-4 p-5 text-sm leading-relaxed text-slate-500">
            <b className="text-slate-700">Role permissions:</b> <b>Admin</b> — everything • <b>Teacher</b> — learners, marks, analytics, attendance, learning • <b>Accountant/Bursar</b> — finance, balances, SMS • <b>Parent & Student</b> — personal portal with results, fees & assignments.
          </div>
        </>
      )}

      <Modal open={userModal} onClose={() => setUserModal(false)} title="Create User Account">
        <div className="grid gap-4">
          <Field label="Full name *"><input className="input" value={nu.name} onChange={(e) => setNu({ ...nu, name: e.target.value })} /></Field>
          <Field label="Email (login) *"><input className="input" type="email" value={nu.email} onChange={(e) => setNu({ ...nu, email: e.target.value })} /></Field>
          <Field label="Password *"><input className="input" value={nu.password} onChange={(e) => setNu({ ...nu, password: e.target.value })} placeholder="Set an initial password" /></Field>
          <Field label="Role"><select className="input" value={nu.role} onChange={(e) => setNu({ ...nu, role: e.target.value })}>{['Admin', 'Teacher', 'Accountant', 'Parent', 'Student'].map((r) => <option key={r}>{r}</option>)}</select></Field>
          {['Parent', 'Student'].includes(nu.role) && (
            <Field label="Linked learner"><select className="input" value={nu.studentId} onChange={(e) => setNu({ ...nu, studentId: e.target.value })}>{(students || []).map((s) => <option key={s.id} value={s.id}>{studentName(s)} — {s.admNo}</option>)}</select></Field>
          )}
        </div>
        <div className="mt-5 flex justify-end gap-2"><button className="btn-ghost" onClick={() => setUserModal(false)}>Cancel</button><button className="btn-primary" disabled={!nu.name || !nu.email || !nu.password} onClick={createUser}>Create Account</button></div>
      </Modal>
    </div>
  );
}
