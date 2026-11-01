import React, { useMemo, useState } from 'react';
import { api, toast } from '../lib/api.js';
import { fmtDate, studentName } from '../lib/utils.js';
import { useFetch, Spinner, PageHeader, Icon, Modal, Field, Tabs } from '../components/ui.jsx';

export default function Operations() {
  const [tab, setTab] = useState('library');
  const { data: books, reload: reloadBooks } = useFetch(() => api.get('/books'));
  const { data: routesData, reload: reloadRoutes } = useFetch(() => api.get('/routes'));
  const { data: discipline, reload: reloadDisc } = useFetch(() => api.get('/discipline'));
  const { data: events, reload: reloadEvents } = useFetch(() => api.get('/events'));
  const { data: students } = useFetch(() => api.get('/students'));
  const { data: classes } = useFetch(() => api.get('/classes'));

  const [bookModal, setBookModal] = useState(false);
  const [book, setBook] = useState({ title: '', author: '', category: 'English', copies: 1 });
  const [issueTo, setIssueTo] = useState(null);
  const [issueStudent, setIssueStudent] = useState('');
  const [routeModal, setRouteModal] = useState(false);
  const [route, setRoute] = useState({ name: '', vehicle: '', driver: '', driverPhone: '', capacity: 30, stopsText: '' });
  const [discModal, setDiscModal] = useState(false);
  const [disc, setDisc] = useState({ studentId: '', date: new Date().toISOString().slice(0, 10), category: 'Conduct', description: '', action: '', status: 'Open' });
  const [eventModal, setEventModal] = useState(false);
  const [evt, setEvt] = useState({ title: '', date: '', time: '9:00 AM', venue: '', category: 'Academics', description: '' });

  const studentById = useMemo(() => Object.fromEntries((students || []).map((s) => [s.id, s])), [students]);
  const className = (id) => (classes || []).find((c) => c.id === id)?.name || '';
  const routeLearners = (rid) => (students || []).filter((s) => s.transportRouteId === rid);

  const saveBook = async () => { await api.post('/books', { ...book, copies: Number(book.copies), issued: [], accessionNo: `LIB/${1000 + (books?.length || 0) * 7}` }); toast('📗 Book added to library'); setBookModal(false); reloadBooks(); };
  const issueBook = async () => { await api.post(`/books/${issueTo.id}/issue`, { studentId: issueStudent, dueDate: new Date(Date.now() + 14 * 86400000).toISOString().slice(0, 10) }); toast('Book issued — due in 14 days'); setIssueTo(null); reloadBooks(); };
  const returnBook = async (b, sid) => { await api.post(`/books/${b.id}/return`, { studentId: sid }); toast('Book returned ✓'); reloadBooks(); };
  const saveRoute = async () => { await api.post('/routes', { ...route, capacity: Number(route.capacity), stops: route.stopsText.split(',').map((x) => x.trim()).filter(Boolean) }); toast('🚌 Transport route created'); setRouteModal(false); reloadRoutes(); };
  const saveDisc = async () => { await api.post('/discipline', disc); toast('Case recorded'); setDiscModal(false); reloadDisc(); };
  const saveEvt = async () => { await api.post('/events', evt); toast('📅 Event added to school calendar'); setEventModal(false); reloadEvents(); };

  const removeItem = async (coll, id, reload) => { if (window.confirm('Delete this record?')) { await api.del(`/${coll}/${id}`); toast('Deleted'); reload(); } };

  return (
    <div>
      <PageHeader title="School Operations" subtitle="Library, transport, discipline & the school calendar in one place" />
      <Tabs tabs={[{ id: 'library', label: '📚 Library' }, { id: 'transport', label: '🚌 Transport' }, { id: 'discipline', label: '⚖️ Discipline' }, { id: 'events', label: '📅 School Calendar' }]} active={tab} onChange={setTab} />

      {tab === 'library' && (
        <>
          <div className="mb-3 flex justify-end"><button className="btn-primary" onClick={() => { setBook({ title: '', author: '', category: 'English', copies: 1 }); setBookModal(true); }}><Icon name="plus" size={15} /> Add Book</button></div>
          {!books ? <Spinner /> : (
            <div className="card overflow-x-auto">
              <table className="w-full min-w-[760px]"><thead><tr><th className="th">Book</th><th className="th">Category</th><th className="th">Accession</th><th className="th">Copies</th><th className="th">On Loan</th><th className="th no-print">Actions</th></tr></thead>
                <tbody>{books.map((b) => (
                  <tr key={b.id} className="hover:bg-slate-50">
                    <td className="td font-semibold">{b.title}<span className="block text-[11px] font-normal text-slate-400">{b.author}</span></td>
                    <td className="td">{b.category}</td><td className="td font-mono text-xs">{b.accessionNo}</td>
                    <td className="td">{b.copies} <span className="text-xs text-slate-400">({b.copies - (b.issued?.length || 0)} available)</span></td>
                    <td className="td">{(b.issued || []).map((i) => (
                      <span key={i.studentId} className="mb-0.5 mr-1 inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-bold text-amber-800">
                        {studentName(studentById[i.studentId])} • due {fmtDate(i.dueDate)}
                        <button title="Mark returned" onClick={() => returnBook(b, i.studentId)} className="text-amber-600 hover:text-emerald-700">↩</button>
                      </span>))}{!(b.issued || []).length && <span className="text-xs text-slate-300">—</span>}</td>
                    <td className="td no-print"><div className="flex gap-1.5">
                      <button className="btn-ghost px-2.5! py-1! text-xs" disabled={(b.issued?.length || 0) >= b.copies} onClick={() => { setIssueTo(b); setIssueStudent(students?.[0]?.id || ''); }}>Issue</button>
                      <button onClick={() => removeItem('books', b.id, reloadBooks)} className="rounded-lg p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600"><Icon name="trash" size={15} /></button>
                    </div></td>
                  </tr>
                ))}</tbody></table>
            </div>
          )}
        </>
      )}

      {tab === 'transport' && (
        <>
          <div className="mb-3 flex justify-end"><button className="btn-primary" onClick={() => setRouteModal(true)}><Icon name="plus" size={15} /> Add Route</button></div>
          <div className="grid gap-4 md:grid-cols-2">
            {(routesData || []).map((r) => {
              const learners = routeLearners(r.id);
              return (
                <div key={r.id} className="card p-5 animate-fadeUp">
                  <div className="flex items-start justify-between">
                    <h3 className="font-extrabold text-slate-800">🚌 {r.name}</h3>
                    <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold ${learners.length > r.capacity ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-700'}`}>{learners.length}/{r.capacity} seats</span>
                  </div>
                  <p className="mt-1.5 text-sm text-slate-500">{r.vehicle} • Driver: <b className="text-slate-700">{r.driver}</b> ({r.driverPhone})</p>
                  <div className="mt-3 flex flex-wrap items-center gap-1.5">
                    {(r.stops || []).map((st, i) => <span key={st} className="flex items-center gap-1.5 text-xs"><span className="rounded-full bg-brand-50 px-2.5 py-1 font-semibold text-brand-800">{st}</span>{i < r.stops.length - 1 && <span className="text-slate-300">→</span>}</span>)}
                  </div>
                  <div className="mt-3 flex items-center justify-between border-t border-slate-50 pt-3">
                    <p className="text-sm text-slate-500">{learners.length} learners use this route</p>
                    <button onClick={() => removeItem('routes', r.id, reloadRoutes)} className="rounded-lg p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600"><Icon name="trash" size={15} /></button>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {tab === 'discipline' && (
        <>
          <div className="mb-3 flex justify-end"><button className="btn-primary" onClick={() => { setDisc({ ...disc, studentId: students?.[0]?.id || '' }); setDiscModal(true); }}><Icon name="plus" size={15} /> Record Case</button></div>
          <div className="card overflow-x-auto">
            <table className="w-full min-w-[760px]"><thead><tr><th className="th">Date</th><th className="th">Learner</th><th className="th">Category</th><th className="th">Incident</th><th className="th">Action Taken</th><th className="th">Status</th><th className="th no-print"></th></tr></thead>
              <tbody>{(discipline || []).map((d) => (
                <tr key={d.id} className="hover:bg-slate-50">
                  <td className="td">{fmtDate(d.date)}</td>
                  <td className="td font-semibold">{studentName(studentById[d.studentId])}<span className="block text-[11px] font-normal text-slate-400">{className(studentById[d.studentId]?.classId)} {studentById[d.studentId]?.stream}</span></td>
                  <td className="td"><span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-bold">{d.category}</span></td>
                  <td className="td max-w-[240px]">{d.description}</td><td className="td max-w-[220px] text-slate-500">{d.action}</td>
                  <td className="td"><span className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${d.status === 'Closed' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>{d.status}</span></td>
                  <td className="td no-print"><div className="flex gap-1">
                    {d.status !== 'Closed' && <button className="btn-ghost px-2! py-1! text-xs" onClick={async () => { await api.put(`/discipline/${d.id}`, { status: 'Closed' }); toast('Case closed'); reloadDisc(); }}>Close</button>}
                    <button onClick={() => removeItem('discipline', d.id, reloadDisc)} className="rounded-lg p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600"><Icon name="trash" size={15} /></button>
                  </div></td>
                </tr>
              ))}</tbody></table>
          </div>
          <p className="mt-3 text-xs text-slate-400">Elimu360 promotes positive discipline — counselling, mentorship and restorative practices per Kenyan Basic Education guidelines.</p>
        </>
      )}

      {tab === 'events' && (
        <>
          <div className="mb-3 flex justify-end"><button className="btn-primary" onClick={() => setEventModal(true)}><Icon name="plus" size={15} /> Add Event</button></div>
          <div className="space-y-3">
            {[...(events || [])].sort((a, b) => a.date.localeCompare(b.date)).map((e) => (
              <div key={e.id} className="card flex gap-4 p-4 animate-fadeUp">
                <span className="flex h-14 w-14 shrink-0 flex-col items-center justify-center rounded-2xl bg-brand-600 text-white">
                  <span className="text-xl font-black leading-none">{new Date(e.date).getDate()}</span>
                  <span className="text-[10px] font-bold uppercase">{new Date(e.date).toLocaleString('en', { month: 'short' })} {new Date(e.date).getFullYear()}</span>
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2"><h3 className="font-bold text-slate-800">{e.title}</h3><span className="rounded-full bg-brand-50 px-2 py-0.5 text-[10px] font-bold text-brand-700">{e.category}</span></div>
                  <p className="mt-0.5 text-xs text-slate-400">🕘 {e.time} • 📍 {e.venue}</p>
                  <p className="mt-1 text-sm text-slate-500">{e.description}</p>
                </div>
                <button onClick={() => removeItem('events', e.id, reloadEvents)} className="self-start rounded-lg p-1.5 text-slate-300 hover:bg-rose-50 hover:text-rose-600"><Icon name="trash" size={15} /></button>
              </div>
            ))}
          </div>
        </>
      )}

      <Modal open={bookModal} onClose={() => setBookModal(false)} title="Add Book to Library">
        <div className="grid gap-4">
          <Field label="Title *"><input className="input" value={book.title} onChange={(e) => setBook({ ...book, title: e.target.value })} /></Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Author / Publisher"><input className="input" value={book.author} onChange={(e) => setBook({ ...book, author: e.target.value })} /></Field>
            <Field label="Copies"><input className="input" type="number" value={book.copies} onChange={(e) => setBook({ ...book, copies: e.target.value })} /></Field>
          </div>
          <Field label="Category"><select className="input" value={book.category} onChange={(e) => setBook({ ...book, category: e.target.value })}>{['English', 'Kiswahili', 'Mathematics', 'Science', 'Literature', 'Geography', 'Religious', 'Reference'].map((c) => <option key={c}>{c}</option>)}</select></Field>
        </div>
        <div className="mt-5 flex justify-end gap-2"><button className="btn-ghost" onClick={() => setBookModal(false)}>Cancel</button><button className="btn-primary" disabled={!book.title} onClick={saveBook}>Add Book</button></div>
      </Modal>

      <Modal open={!!issueTo} onClose={() => setIssueTo(null)} title={`Issue “${issueTo?.title || ''}”`}>
        <Field label="Issue to learner"><select className="input" value={issueStudent} onChange={(e) => setIssueStudent(e.target.value)}>{(students || []).map((s) => <option key={s.id} value={s.id}>{studentName(s)} — {className(s.classId)}</option>)}</select></Field>
        <div className="mt-5 flex justify-end gap-2"><button className="btn-ghost" onClick={() => setIssueTo(null)}>Cancel</button><button className="btn-primary" onClick={issueBook}>Issue Book (14 days)</button></div>
      </Modal>

      <Modal open={routeModal} onClose={() => setRouteModal(false)} title="New Transport Route">
        <div className="grid gap-4">
          <Field label="Route name *"><input className="input" value={route.name} onChange={(e) => setRoute({ ...route, name: e.target.value })} placeholder="Route 5 — Thika / Makongeni" /></Field>
          <Field label="Vehicle"><input className="input" value={route.vehicle} onChange={(e) => setRoute({ ...route, vehicle: e.target.value })} placeholder="Isuzu NQR — KDC 123A" /></Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Driver"><input className="input" value={route.driver} onChange={(e) => setRoute({ ...route, driver: e.target.value })} /></Field>
            <Field label="Driver phone"><input className="input" value={route.driverPhone} onChange={(e) => setRoute({ ...route, driverPhone: e.target.value })} /></Field>
          </div>
          <Field label="Seat capacity"><input className="input" type="number" value={route.capacity} onChange={(e) => setRoute({ ...route, capacity: e.target.value })} /></Field>
          <Field label="Stops (comma separated)"><input className="input" value={route.stopsText} onChange={(e) => setRoute({ ...route, stopsText: e.target.value })} placeholder="Thika Town, Makongeni, Landless" /></Field>
        </div>
        <div className="mt-5 flex justify-end gap-2"><button className="btn-ghost" onClick={() => setRouteModal(false)}>Cancel</button><button className="btn-primary" disabled={!route.name} onClick={saveRoute}>Save Route</button></div>
      </Modal>

      <Modal open={discModal} onClose={() => setDiscModal(false)} title="Record Discipline Case">
        <div className="grid gap-4">
          <Field label="Learner"><select className="input" value={disc.studentId} onChange={(e) => setDisc({ ...disc, studentId: e.target.value })}>{(students || []).map((s) => <option key={s.id} value={s.id}>{studentName(s)} — {className(s.classId)} {s.stream}</option>)}</select></Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Date"><input className="input" type="date" value={disc.date} onChange={(e) => setDisc({ ...disc, date: e.target.value })} /></Field>
            <Field label="Category"><select className="input" value={disc.category} onChange={(e) => setDisc({ ...disc, category: e.target.value })}>{['Conduct', 'Punctuality', 'Uniform', 'Academics', 'Bullying', 'Property Damage', 'Positive Behaviour ⭐'].map((c) => <option key={c}>{c}</option>)}</select></Field>
          </div>
          <Field label="Description"><textarea className="input" rows={3} value={disc.description} onChange={(e) => setDisc({ ...disc, description: e.target.value })} /></Field>
          <Field label="Action taken / guidance"><textarea className="input" rows={2} value={disc.action} onChange={(e) => setDisc({ ...disc, action: e.target.value })} placeholder="e.g. Counselling session; guardian informed via SMS" /></Field>
        </div>
        <div className="mt-5 flex justify-end gap-2"><button className="btn-ghost" onClick={() => setDiscModal(false)}>Cancel</button><button className="btn-primary" disabled={!disc.description} onClick={saveDisc}>Record Case</button></div>
      </Modal>

      <Modal open={eventModal} onClose={() => setEventModal(false)} title="Add Calendar Event">
        <div className="grid gap-4">
          <Field label="Title *"><input className="input" value={evt.title} onChange={(e) => setEvt({ ...evt, title: e.target.value })} /></Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Date"><input className="input" type="date" value={evt.date} onChange={(e) => setEvt({ ...evt, date: e.target.value })} /></Field>
            <Field label="Time"><input className="input" value={evt.time} onChange={(e) => setEvt({ ...evt, time: e.target.value })} /></Field>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Venue"><input className="input" value={evt.venue} onChange={(e) => setEvt({ ...evt, venue: e.target.value })} /></Field>
            <Field label="Category"><select className="input" value={evt.category} onChange={(e) => setEvt({ ...evt, category: e.target.value })}>{['Academics', 'Sports', 'Co-curricular', 'Administration', 'Religious', 'Parents'].map((c) => <option key={c}>{c}</option>)}</select></Field>
          </div>
          <Field label="Description"><textarea className="input" rows={3} value={evt.description} onChange={(e) => setEvt({ ...evt, description: e.target.value })} /></Field>
        </div>
        <div className="mt-5 flex justify-end gap-2"><button className="btn-ghost" onClick={() => setEventModal(false)}>Cancel</button><button className="btn-primary" disabled={!evt.title} onClick={saveEvt}>Add Event</button></div>
      </Modal>
    </div>
  );
}
