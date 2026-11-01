import React, { useMemo, useState } from 'react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, AreaChart, Area } from 'recharts';
import { api, toast } from '../lib/api.js';
import { fmtKES, fmtDate, studentName } from '../lib/utils.js';
import { useFetch, Spinner, PageHeader, Icon, Modal, Field, Tabs, StatCard, ProgressBar } from '../components/ui.jsx';
import { useAuth } from '../App.jsx';

export default function Finance() {
  const { settings, user } = useAuth();
  const [tab, setTab] = useState('overview');
  const [year, setYear] = useState(settings?.currentYear || 2026);
  const [term, setTerm] = useState(settings?.currentTerm || 1);
  const { data, loading, reload } = useFetch(() => api.get(`/fees/summary?year=${year}&term=${term}`), [year, term]);
  const { data: students } = useFetch(() => api.get('/students'));
  const { data: classes } = useFetch(() => api.get('/classes'));
  const { data: structures, reload: reloadStruct } = useFetch(() => api.get('/feeStructures'));

  const [payModal, setPayModal] = useState(false);
  const [pay, setPay] = useState({ studentId: '', amount: '', method: 'M-Pesa', ref: '' });
  const [receipt, setReceipt] = useState(null);
  const [search, setSearch] = useState('');
  const [structModal, setStructModal] = useState(false);
  const [editStruct, setEditStruct] = useState(null);
  const [heads, setHeads] = useState([]);

  const classMap = useMemo(() => Object.fromEntries((classes || []).map((c) => [c.id, c])), [classes]);
  const balanceRows = useMemo(() => (data?.balances || []).filter((b) => !search || b.student.name.toLowerCase().includes(search.toLowerCase()) || b.student.admNo.toLowerCase().includes(search.toLowerCase())), [data, search]);

  const recordPayment = async () => {
    try {
      const p = await api.post('/payments', { ...pay, amount: Number(pay.amount) });
      const stu = (students || []).find((s) => s.id === pay.studentId);
      setReceipt({ ...p, studentName: studentName(stu), admNo: stu?.admNo, className: classMap[stu?.classId]?.name });
      toast('💰 Payment recorded successfully');
      setPayModal(false); reload();
    } catch (e) { toast(e.message, 'error'); }
  };

  const smsDefaulters = async () => {
    if (!window.confirm(`Send fee reminder SMS to ${data.defaulters} defaulters?`)) return;
    await api.post('/messages/send', { audience: 'Fee Defaulters', body: `Dear Parent, kindly clear the Term ${term} fee balance for your child. Pay M-Pesa Paybill ${settings.mpesaPaybill}, A/c = Admission No. Asante. ${settings.schoolName}` });
    toast('📲 Fee reminders sent via SMS');
  };

  const saveStructure = async () => {
    try {
      await api.put(`/feeStructures/${editStruct.id}`, { voteHeads: heads.map((h) => ({ name: h.name, amount: Number(h.amount) })) });
      toast('Fee structure updated'); setStructModal(false); reloadStruct(); reload();
    } catch (e) { toast(e.message, 'error'); }
  };

  if (loading || !data) return <Spinner />;

  return (
    <div>
      <PageHeader title="Finance & School Fees" subtitle={`Zeraki-Finance style • M-Pesa Paybill ${settings?.mpesaPaybill} • Vote-head based billing`}
        actions={<>
          <button className="btn-ghost" onClick={smsDefaulters}><Icon name="send" size={15} /> SMS Defaulters ({data.defaulters})</button>
          <button className="btn-primary" onClick={() => { setPay({ studentId: students?.[0]?.id || '', amount: '', method: 'M-Pesa', ref: '' }); setPayModal(true); }}><Icon name="plus" size={15} /> Record Payment</button>
        </>} />
      <Tabs tabs={[{ id: 'overview', label: '📊 Overview' }, { id: 'balances', label: '🧾 Student Balances' }, { id: 'structures', label: '🏷️ Fee Structures' }]} active={tab} onChange={setTab} />

      {tab === 'overview' && (
        <>
          <div className="mb-4 flex flex-wrap gap-3">
            <select className="input w-36" value={year} onChange={(e) => setYear(Number(e.target.value))}>{[2025, 2026, 2027].map((y) => <option key={y}>{y}</option>)}</select>
            <select className="input w-36" value={term} onChange={(e) => setTerm(Number(e.target.value))}>{[1, 2, 3].map((t) => <option key={t} value={t}>Term {t}</option>)}</select>
          </div>
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <StatCard label="Total Billed" value={fmtKES(data.billed)} sub={`Term ${term} ${year}`} icon="cash" />
            <StatCard label="Collected" value={fmtKES(data.collected)} sub={`${data.collectionRate}% collection rate`} icon="check" color="bg-emerald-50 text-emerald-700" />
            <StatCard label="Outstanding" value={fmtKES(data.outstanding)} sub={`${data.defaulters} learners with balances`} icon="clock" color="bg-rose-50 text-rose-700" />
            <StatCard label="Collection Rate" value={`${data.collectionRate}%`} sub="Target: 95% by closing day" icon="target" color="bg-amber-50 text-amber-700" />
          </div>
          <div className="card mt-4 p-5"><p className="mb-2 text-sm font-bold text-slate-600">Overall collection progress</p><ProgressBar value={data.collectionRate} color={data.collectionRate >= 80 ? 'bg-emerald-500' : data.collectionRate >= 50 ? 'bg-amber-500' : 'bg-rose-500'} /></div>
          <div className="mt-4 grid gap-4 lg:grid-cols-2">
            <div className="card p-5">
              <h3 className="mb-3 font-bold text-slate-800">Collection by Class</h3>
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={data.byClass}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="className" tick={{ fontSize: 10 }} interval={0} angle={-20} textAnchor="end" height={46} />
                  <YAxis tick={{ fontSize: 10 }} tickFormatter={(v) => `${Math.round(v / 1000)}k`} />
                  <Tooltip formatter={(v) => fmtKES(v)} />
                  <Bar dataKey="billed" name="Billed" fill="#cbd5e1" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="collected" name="Collected" fill="#279a7c" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="card p-5">
              <h3 className="mb-3 font-bold text-slate-800">Monthly Collections ({year})</h3>
              <ResponsiveContainer width="100%" height={240}>
                <AreaChart data={data.monthlyTrend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 10 }} tickFormatter={(v) => `${Math.round(v / 1000)}k`} />
                  <Tooltip formatter={(v) => fmtKES(v)} />
                  <Area type="monotone" dataKey="amount" name="Collected" stroke="#1a7c64" fill="#279a7c" fillOpacity={0.25} strokeWidth={2.5} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="card mt-4 overflow-x-auto">
            <h3 className="p-5 pb-2 font-bold text-slate-800">Recent Payments</h3>
            <table className="w-full min-w-[640px]"><thead><tr><th className="th">Date</th><th className="th">Learner</th><th className="th">Method</th><th className="th">Reference</th><th className="th">Amount</th><th className="th">Received By</th></tr></thead>
              <tbody>{data.recentPayments.map((p) => (
                <tr key={p.id} className="hover:bg-slate-50"><td className="td">{fmtDate(p.date)}</td><td className="td font-semibold">{p.studentName}</td><td className="td">{p.method === 'M-Pesa' ? '📱 M-Pesa' : p.method}</td><td className="td font-mono text-xs">{p.ref}</td><td className="td font-bold text-emerald-700">{fmtKES(p.amount)}</td><td className="td text-xs text-slate-400">{p.receivedBy}</td></tr>
              ))}</tbody></table>
          </div>
        </>
      )}

      {tab === 'balances' && (
        <>
          <div className="card mb-4 p-4 no-print"><input className="input" placeholder="Search learner or admission no…" value={search} onChange={(e) => setSearch(e.target.value)} /></div>
          <div className="card max-h-[640px] overflow-auto">
            <table className="w-full min-w-[760px]"><thead className="sticky top-0"><tr><th className="th">Learner</th><th className="th">Class</th><th className="th">Billed</th><th className="th">Paid</th><th className="th">Balance</th><th className="th">% Paid</th><th className="th no-print">Action</th></tr></thead>
              <tbody>{balanceRows.map((b) => (
                <tr key={b.student.id} className="hover:bg-slate-50">
                  <td className="td font-semibold">{b.student.name}<span className="block text-[11px] font-normal text-slate-400">{b.student.admNo}</span></td>
                  <td className="td">{b.className} {b.student.stream}</td>
                  <td className="td">{fmtKES(b.billed)}</td><td className="td text-emerald-700">{fmtKES(b.paid)}</td>
                  <td className={`td font-extrabold ${b.balance > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>{fmtKES(b.balance)}</td>
                  <td className="td w-36"><span className="mb-1 block text-xs font-bold">{b.billed ? Math.round((b.paid / b.billed) * 100) : 0}%</span><ProgressBar value={b.billed ? (b.paid / b.billed) * 100 : 0} color={b.balance <= 0 ? 'bg-emerald-500' : 'bg-amber-500'} /></td>
                  <td className="td no-print"><button className="btn-ghost px-2.5! py-1! text-xs" onClick={() => { setPay({ studentId: b.student.id, amount: '', method: 'M-Pesa', ref: '' }); setPayModal(true); }}>💰 Pay</button></td>
                </tr>
              ))}</tbody></table>
          </div>
        </>
      )}

      {tab === 'structures' && (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {(structures || []).filter((f) => f.year === Number(year) && f.term === Number(term)).map((f) => {
            const total = f.voteHeads.reduce((a, v) => a + v.amount, 0);
            return (
              <div key={f.id} className="card p-5 animate-fadeUp">
                <div className="flex items-start justify-between">
                  <h3 className="font-extrabold text-slate-800">{f.level}</h3>
                  <span className="rounded-full bg-brand-50 px-2 py-0.5 text-[11px] font-bold text-brand-700">Term {f.term} {f.year}</span>
                </div>
                <div className="mt-3 space-y-1.5">{f.voteHeads.map((v) => <div key={v.name} className="flex justify-between border-b border-slate-50 py-1 text-sm"><span className="text-slate-600">{v.name}</span><b>{fmtKES(v.amount)}</b></div>)}</div>
                <div className="flex justify-between py-2 font-extrabold"><span>Total per learner</span><span>{fmtKES(total)}</span></div>
                <button className="btn-ghost mt-1 w-full justify-center text-xs" onClick={() => { setEditStruct(f); setHeads(f.voteHeads.map((v) => ({ ...v }))); setStructModal(true); }}><Icon name="edit" size={13} /> Edit Vote Heads</button>
              </div>
            );
          })}
        </div>
      )}

      <Modal open={payModal} onClose={() => setPayModal(false)} title="Record Fee Payment">
        <div className="grid gap-4">
          <Field label="Learner *"><select className="input" value={pay.studentId} onChange={(e) => setPay({ ...pay, studentId: e.target.value })}>{(students || []).sort((a, b) => studentName(a).localeCompare(studentName(b))).map((s) => <option key={s.id} value={s.id}>{studentName(s)} — {s.admNo} ({classMap[s.classId]?.name})</option>)}</select></Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Amount (KES) *"><input className="input" type="number" value={pay.amount} onChange={(e) => setPay({ ...pay, amount: e.target.value })} placeholder="e.g. 15000" /></Field>
            <Field label="Method"><select className="input" value={pay.method} onChange={(e) => setPay({ ...pay, method: e.target.value })}>{['M-Pesa', 'Bank Deposit', 'KCB Mtaani', 'Equity Agent', 'Cash', 'Cheque', 'HELB/Bursary'].map((m) => <option key={m}>{m}</option>)}</select></Field>
          </div>
          <Field label={pay.method === 'M-Pesa' ? 'M-Pesa Transaction Code' : 'Reference / Receipt No'}><input className="input font-mono uppercase" value={pay.ref} onChange={(e) => setPay({ ...pay, ref: e.target.value.toUpperCase() })} placeholder={pay.method === 'M-Pesa' ? 'e.g. QK7H2M9XYZ' : 'Reference'} /></Field>
          <p className="rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-500">Payments are applied to Term {settings?.currentTerm} {settings?.currentYear}. A receipt will be generated and an SMS sent to the guardian.</p>
        </div>
        <div className="mt-5 flex justify-end gap-2"><button className="btn-ghost" onClick={() => setPayModal(false)}>Cancel</button><button className="btn-primary" disabled={!pay.studentId || !pay.amount} onClick={recordPayment}>Record Payment</button></div>
      </Modal>

      <Modal open={!!receipt} onClose={() => setReceipt(null)} title="Official Receipt">
        {receipt && (
          <div className="print-area">
            <div className="rounded-xl border-2 border-dashed border-brand-300 p-5 text-sm">
              <p className="text-center text-lg font-black uppercase text-brand-800">{settings?.schoolName}</p>
              <p className="text-center text-xs text-slate-500">{settings?.address} • {settings?.phone}</p>
              <p className="my-3 border-y border-slate-200 py-1 text-center font-bold tracking-widest">FEE PAYMENT RECEIPT</p>
              <div className="space-y-1.5">
                <p className="flex justify-between"><span className="text-slate-500">Received from:</span><b>{receipt.studentName} ({receipt.admNo})</b></p>
                <p className="flex justify-between"><span className="text-slate-500">Class:</span><b>{receipt.className}</b></p>
                <p className="flex justify-between"><span className="text-slate-500">Amount:</span><b className="text-base text-emerald-700">{fmtKES(receipt.amount)}</b></p>
                <p className="flex justify-between"><span className="text-slate-500">Via:</span><b>{receipt.method}</b></p>
                <p className="flex justify-between"><span className="text-slate-500">Transaction code:</span><b className="font-mono">{receipt.ref}</b></p>
                <p className="flex justify-between"><span className="text-slate-500">Date:</span><b>{fmtDate(receipt.date)}</b></p>
                <p className="flex justify-between"><span className="text-slate-500">Served by:</span><b>{receipt.receivedBy || user.name}</b></p>
              </div>
              <p className="mt-4 text-center text-[11px] text-slate-400">Asante sana for investing in education 🇰🇪 • Elimu360</p>
            </div>
            <button className="btn-primary mt-4 w-full justify-center no-print" onClick={() => window.print()}><Icon name="printer" size={15} /> Print Receipt</button>
          </div>
        )}
      </Modal>

      <Modal open={structModal} onClose={() => setStructModal(false)} title={`Edit Vote Heads — ${editStruct?.level || ''}`}>
        <div className="space-y-2">
          {heads.map((h, i) => (
            <div key={i} className="flex gap-2">
              <input className="input flex-1" value={h.name} onChange={(e) => setHeads(heads.map((x, j) => (j === i ? { ...x, name: e.target.value } : x)))} placeholder="Vote head e.g. Tuition" />
              <input className="input w-32" type="number" value={h.amount} onChange={(e) => setHeads(heads.map((x, j) => (j === i ? { ...x, amount: e.target.value } : x)))} placeholder="KES" />
              <button className="rounded-lg px-2 text-slate-300 hover:text-rose-600" onClick={() => setHeads(heads.filter((_, j) => j !== i))}><Icon name="trash" size={15} /></button>
            </div>
          ))}
          <button className="btn-ghost w-full justify-center text-xs" onClick={() => setHeads([...heads, { name: '', amount: 0 }])}><Icon name="plus" size={13} /> Add Vote Head</button>
          <p className="pt-2 text-right font-extrabold">Total: {fmtKES(heads.reduce((a, h) => a + Number(h.amount || 0), 0))}</p>
        </div>
        <div className="mt-4 flex justify-end gap-2"><button className="btn-ghost" onClick={() => setStructModal(false)}>Cancel</button><button className="btn-primary" onClick={saveStructure}>Save Structure</button></div>
      </Modal>
    </div>
  );
}
