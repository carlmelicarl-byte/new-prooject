import React, { useMemo, useState } from 'react';
import { api, toast } from '../lib/api.js';
import { fmtDate } from '../lib/utils.js';
import { useFetch, Spinner, PageHeader, Icon, Modal, Field, Tabs } from '../components/ui.jsx';
import { useAuth } from '../App.jsx';

const TEMPLATES = [
  { name: 'Fee Reminder', body: 'Dear Parent, kindly clear the outstanding fee balance for your child before closing day. M-Pesa Paybill 400200, A/c = Admission No. Asante — Shule ya Msingi Academy' },
  { name: 'Report Collection', body: 'Dear Parent, report forms for this term are ready. Please collect from the class teacher and discuss your child\'s progress. — Shule ya Msingi Academy' },
  { name: 'Meeting Invite', body: 'Dear Parent, you are invited to a parents\' meeting at the school main hall. Your presence is highly valued. — Shule ya Msingi Academy' },
  { name: 'Absent Alert', body: 'Dear Parent, our register shows your child was absent today. Kindly inform the school if they are unwell. — Shule ya Msingi Academy' },
];

export default function Communications() {
  const { settings, refreshSettings } = useAuth();
  const [tab, setTab] = useState('sms');
  const { data: messages, reload } = useFetch(() => api.get('/messages'));
  const { data: announcements, reload: reloadAnn } = useFetch(() => api.get('/announcements'));
  const { data: classes } = useFetch(() => api.get('/classes'));
  const { data: students } = useFetch(() => api.get('/students'));

  const [audience, setAudience] = useState('All Parents');
  const [classId, setClassId] = useState('');
  const [body, setBody] = useState('');
  const [sending, setSending] = useState(false);
  const [annModal, setAnnModal] = useState(false);
  const [ann, setAnn] = useState({ title: '', body: '', audience: 'All Parents' });
  const [editAnn, setEditAnn] = useState(null);

  const recipientEstimate = useMemo(() => {
    const active = (students || []).filter((s) => s.status === 'Active');
    if (audience === 'Class' && classId) return active.filter((s) => s.classId === classId).length;
    if (audience === 'Boarders') return active.filter((s) => s.boarding).length;
    if (audience === 'Fee Defaulters') return 'Learners with a balance';
    return active.length;
  }, [students, audience, classId]);

  const send = async () => {
    setSending(true);
    try {
      const m = await api.post('/messages/send', { audience, classId, body });
      toast(`📲 SMS delivered to ${m.recipients} guardians`);
      setBody(''); reload(); refreshSettings();
    } catch (e) { toast(e.message, 'error'); } finally { setSending(false); }
  };

  const saveAnn = async () => {
    try {
      const payload = { ...ann, date: new Date().toISOString().slice(0, 10) };
      if (editAnn) { await api.put(`/announcements/${editAnn}`, payload); toast('Announcement updated'); }
      else { await api.post('/announcements', payload); toast('📢 Announcement posted'); }
      setAnnModal(false); reloadAnn();
    } catch (e) { toast(e.message, 'error'); }
  };

  const smsUnits = Math.max(1, Math.ceil(body.length / 160));

  return (
    <div>
      <PageHeader title="SMS & School Notices" subtitle={`Reach every guardian by SMS • Balance: ${(settings?.smsBalance ?? 0).toLocaleString()} messages`}
        actions={tab === 'notices' && <button className="btn-primary" onClick={() => { setAnn({ title: '', body: '', audience: 'All Parents' }); setEditAnn(null); setAnnModal(true); }}><Icon name="plus" size={15} /> New Notice</button>} />
      <Tabs tabs={[{ id: 'sms', label: '📱 Bulk SMS' }, { id: 'notices', label: '📢 Announcements' }]} active={tab} onChange={setTab} />

      {tab === 'sms' && (
        <div className="grid gap-4 lg:grid-cols-5">
          <div className="card p-5 lg:col-span-2 animate-fadeUp">
            <h3 className="mb-3 font-bold text-slate-800">Compose SMS</h3>
            <div className="grid gap-3">
              <Field label="Audience">
                <select className="input" value={audience} onChange={(e) => setAudience(e.target.value)}>
                  {['All Parents', 'Class', 'Fee Defaulters', 'Boarders'].map((a) => <option key={a}>{a}</option>)}
                </select>
              </Field>
              {audience === 'Class' && (
                <Field label="Select class"><select className="input" value={classId} onChange={(e) => setClassId(e.target.value)}><option value="">Choose…</option>{[...(classes || [])].sort((a, b) => a.order - b.order).map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></Field>
              )}
              <Field label="Message">
                <textarea className="input" rows={5} value={body} onChange={(e) => setBody(e.target.value)} placeholder="Dear Parent, …" />
              </Field>
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>{body.length} chars • {smsUnits} SMS unit{smsUnits > 1 ? 's' : ''} per recipient</span>
                <span>Recipients: <b className="text-slate-600">{recipientEstimate}</b></span>
              </div>
              <button className="btn-primary justify-center" disabled={sending || !body.trim()} onClick={send}><Icon name="send" size={15} /> {sending ? 'Sending…' : 'Send SMS'}</button>
              <div>
                <p className="mb-1.5 text-xs font-bold uppercase tracking-wide text-slate-400">Quick templates</p>
                <div className="flex flex-wrap gap-1.5">{TEMPLATES.map((t) => <button key={t.name} onClick={() => setBody(t.body)} className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600 hover:bg-brand-50 hover:text-brand-700">{t.name}</button>)}</div>
              </div>
            </div>
          </div>

          <div className="card overflow-hidden lg:col-span-3">
            <h3 className="p-5 pb-2 font-bold text-slate-800">Sent Messages Log</h3>
            {!messages ? <Spinner /> : (
              <div className="max-h-[560px] overflow-y-auto px-5 pb-5">
                {messages.map((m) => (
                  <div key={m.id} className="border-b border-slate-50 py-3">
                    <div className="flex flex-wrap items-center gap-2 text-xs">
                      <span className="rounded-full bg-brand-50 px-2 py-0.5 font-bold text-brand-700">{m.audience}</span>
                      <span className="text-slate-400">{fmtDate(m.date)} • By {m.by} • {m.recipients} recipients</span>
                      <span className="ml-auto rounded-full bg-emerald-50 px-2 py-0.5 font-bold text-emerald-700">✓ {m.status}</span>
                    </div>
                    <p className="mt-1.5 text-sm leading-relaxed text-slate-600">{m.body}</p>
                  </div>
                ))}
                {!messages.length && <p className="py-8 text-center text-sm text-slate-400">No messages sent yet.</p>}
              </div>
            )}
          </div>
        </div>
      )}

      {tab === 'notices' && (
        <div className="grid gap-4 md:grid-cols-2">
          {(announcements || []).map((a) => (
            <div key={a.id} className="card p-5 animate-fadeUp">
              <div className="flex items-start justify-between gap-2">
                <h3 className="font-bold leading-snug text-slate-800">{a.title}</h3>
                <span className="shrink-0 rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-700">{a.audience}</span>
              </div>
              <p className="mt-2 text-sm leading-relaxed text-slate-500">{a.body}</p>
              <div className="mt-3 flex items-center justify-between border-t border-slate-50 pt-3 text-xs text-slate-400">
                <span>{fmtDate(a.date)} • {a.by}</span>
                <span className="flex gap-1">
                  <button onClick={() => { setAnn(a); setEditAnn(a.id); setAnnModal(true); }} className="rounded-lg p-1.5 hover:bg-slate-100 hover:text-slate-700"><Icon name="edit" size={14} /></button>
                  <button onClick={async () => { if (window.confirm('Delete this notice?')) { await api.del(`/announcements/${a.id}`); toast('Deleted'); reloadAnn(); } }} className="rounded-lg p-1.5 hover:bg-rose-50 hover:text-rose-600"><Icon name="trash" size={14} /></button>
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal open={annModal} onClose={() => setAnnModal(false)} title={editAnn ? 'Edit Notice' : 'New Announcement'}>
        <div className="grid gap-4">
          <Field label="Title *"><input className="input" value={ann.title} onChange={(e) => setAnn({ ...ann, title: e.target.value })} /></Field>
          <Field label="Audience"><select className="input" value={ann.audience} onChange={(e) => setAnn({ ...ann, audience: e.target.value })}>{['All Parents', 'Grade 6 & 9 Parents', 'Staff', 'Boarding Parents', 'Whole School'].map((a) => <option key={a}>{a}</option>)}</select></Field>
          <Field label="Details"><textarea className="input" rows={4} value={ann.body} onChange={(e) => setAnn({ ...ann, body: e.target.value })} /></Field>
        </div>
        <div className="mt-5 flex justify-end gap-2"><button className="btn-ghost" onClick={() => setAnnModal(false)}>Cancel</button><button className="btn-primary" disabled={!ann.title} onClick={saveAnn}>Post Notice</button></div>
      </Modal>
    </div>
  );
}
