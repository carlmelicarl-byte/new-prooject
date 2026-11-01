import React, { useEffect, useMemo, useState } from 'react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { api, toast } from '../lib/api.js';
import { fmtDate, studentName } from '../lib/utils.js';
import { useFetch, Spinner, PageHeader, Icon, Field, Avatar, StatCard } from '../components/ui.jsx';

const STATUSES = ['Present', 'Late', 'Absent'];
const STATUS_STYLE = {
  Present: 'bg-emerald-600 text-white',
  Late: 'bg-amber-500 text-white',
  Absent: 'bg-rose-600 text-white',
};

export default function Attendance() {
  const { data: classes } = useFetch(() => api.get('/classes'));
  const { data: students } = useFetch(() => api.get('/students'));
  const { data: summary, reload: reloadSummary } = useFetch(() => api.get('/attendance/summary'));
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [classId, setClassId] = useState('');
  const [stream, setStream] = useState('');
  const [records, setRecords] = useState({});
  const [loadingRec, setLoadingRec] = useState(false);
  const [saving, setSaving] = useState(false);

  const sortedClasses = useMemo(() => [...(classes || [])].sort((a, b) => a.order - b.order), [classes]);
  useEffect(() => { if (!classId && sortedClasses.length) setClassId(sortedClasses[4]?.id || sortedClasses[0].id); }, [sortedClasses, classId]);
  const cls = sortedClasses.find((c) => c.id === classId);
  useEffect(() => { if (cls && !cls.streams.includes(stream)) setStream(cls.streams[0] || ''); }, [cls, stream]);

  const roster = useMemo(() => (students || []).filter((s) => s.classId === classId && s.stream === stream)
    .sort((a, b) => studentName(a).localeCompare(studentName(b))), [students, classId, stream]);

  useEffect(() => {
    if (!classId) return;
    setLoadingRec(true);
    api.get(`/attendance?date=${date}&classId=${classId}&stream=${encodeURIComponent(stream || '')}`)
      .then((rows) => {
        const existing = rows[0]?.records || {};
        const init = {};
        roster.forEach((s) => { init[s.id] = existing[s.id] || 'Present'; });
        setRecords(init);
      }).finally(() => setLoadingRec(false));
  }, [date, classId, stream]); // eslint-disable-line

  const counts = useMemo(() => {
    const c = { Present: 0, Late: 0, Absent: 0 };
    roster.forEach((s) => { c[records[s.id] || 'Present'] += 1; });
    return c;
  }, [records, roster]);

  const absentees = roster.filter((s) => records[s.id] === 'Absent');

  const save = async () => {
    setSaving(true);
    try {
      await api.post('/attendance', { date, classId, stream, records });
      toast(`✅ Register saved — ${counts.Present} present, ${counts.Late} late, ${counts.Absent} absent`);
      reloadSummary();
    } catch (e) { toast(e.message, 'error'); } finally { setSaving(false); }
  };

  const smsAbsentees = async () => {
    if (!absentees.length) return toast('No absentees to notify');
    await api.post('/messages/send', {
      audience: 'Class', classId,
      body: `Dear Parent, our register for ${fmtDate(date)} shows your child was absent today. Kindly contact the school if unwell. Shule ya Msingi Academy`,
    });
    toast(`📲 Absentee alerts queued for ${absentees.length} guardians`);
  };

  if (!classes || !students) return <Spinner />;

  return (
    <div>
      <PageHeader title="Attendance Register" subtitle="Mark daily registers per class — absentee SMS alerts included"
        actions={<>
          <button className="btn-ghost" onClick={smsAbsentees}><Icon name="send" size={15} /> SMS Absentee Guardians ({absentees.length})</button>
          <button className="btn-primary" disabled={saving} onClick={save}>💾 Save Register</button>
        </>} />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="School Attendance (Latest)" value={`${summary?.latest?.rate ?? '—'}%`} sub={fmtDate(summary?.latest?.date)} icon="check" />
        <StatCard label="Present (this register)" value={counts.Present} sub={`${cls?.name} ${stream}`} icon="users" color="bg-emerald-50 text-emerald-700" />
        <StatCard label="Late" value={counts.Late} sub="Reported after 8:00 AM" icon="clock" color="bg-amber-50 text-amber-700" />
        <StatCard label="Absent" value={counts.Absent} sub="Guardians will be alerted" icon="x" color="bg-rose-50 text-rose-700" />
      </div>

      <div className="card mt-4 p-5">
        <div className="grid gap-3 sm:grid-cols-3">
          <Field label="Date"><input className="input" type="date" value={date} onChange={(e) => setDate(e.target.value)} /></Field>
          <Field label="Class"><select className="input" value={classId} onChange={(e) => setClassId(e.target.value)}>{sortedClasses.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></Field>
          <Field label="Stream"><select className="input" value={stream} onChange={(e) => setStream(e.target.value)}>{(cls?.streams || []).map((s) => <option key={s}>{s}</option>)}</select></Field>
        </div>
        <div className="mt-3 flex gap-2">
          <button className="btn-ghost text-xs" onClick={() => { const all = {}; roster.forEach((s) => { all[s.id] = 'Present'; }); setRecords(all); }}>✓ Mark all present</button>
        </div>

        {loadingRec ? <Spinner label="Loading class register…" /> : (
          <div className="mt-4 space-y-1.5">
            {roster.map((s, i) => (
              <div key={s.id} className="flex flex-wrap items-center gap-3 rounded-xl border border-slate-100 px-3 py-2 hover:bg-slate-50">
                <span className="w-6 text-sm font-bold text-slate-300">{i + 1}</span>
                <Avatar name={studentName(s)} size="h-8 w-8 text-[11px]" />
                <span className="min-w-40 flex-1">
                  <span className="block text-sm font-semibold text-slate-700">{studentName(s)}</span>
                  <span className="block text-[11px] text-slate-400">{s.admNo} • {s.gender}</span>
                </span>
                <span className="hidden text-xs text-slate-400 md:block">{s.guardian?.phone}</span>
                <div className="flex overflow-hidden rounded-lg border border-slate-200">
                  {STATUSES.map((st) => (
                    <button key={st} onClick={() => setRecords((r) => ({ ...r, [s.id]: st }))}
                      className={`px-3 py-1.5 text-xs font-bold transition ${(records[s.id] || 'Present') === st ? STATUS_STYLE[st] : 'bg-white text-slate-500 hover:bg-slate-50'}`}>{st}</button>
                  ))}
                </div>
              </div>
            ))}
            {!roster.length && <p className="py-8 text-center text-sm text-slate-400">No learners in this stream.</p>}
          </div>
        )}
      </div>

      <div className="card mt-4 p-5">
        <h3 className="mb-3 font-bold text-slate-800">Whole-School Attendance Trend</h3>
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={(summary?.trend || []).map((t) => ({ ...t, label: fmtDate(t.date) }))}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="label" tick={{ fontSize: 10 }} />
            <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} unit="%" />
            <Tooltip formatter={(v) => `${v}%`} />
            <Line type="monotone" dataKey="rate" name="Attendance" stroke="#1a7c64" strokeWidth={3} dot={{ r: 4, fill: '#1a7c64' }} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
