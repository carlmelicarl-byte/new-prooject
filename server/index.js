const express = require('express');
const cors = require('cors');
const crypto = require('crypto');
const { db, uid } = require('./db');
const { SYSTEMS, gradeOf, meanGrade, teacherRemark, principalRemark } = require('./grading');

const app = express();
app.use(cors());
app.use(express.json({ limit: '5mb' }));

const PORT = process.env.PORT || 4000;
const SECRET = 'elimu360-secret-key';

/* ---------------- helpers ---------------- */
const sign = (payload) => {
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const sig = crypto.createHmac('sha256', SECRET).update(body).digest('base64url');
  return `${body}.${sig}`;
};
const verify = (token) => {
  if (!token) return null;
  const [body, sig] = token.split('.');
  if (!body || !sig) return null;
  const expected = crypto.createHmac('sha256', SECRET).update(body).digest('base64url');
  if (sig !== expected) return null;
  try { return JSON.parse(Buffer.from(body, 'base64url').toString()); } catch { return null; }
};

function auth(req, res, next) {
  const token = (req.headers.authorization || '').replace('Bearer ', '');
  const user = verify(token);
  if (!user) return res.status(401).json({ error: 'Unauthorised — please log in' });
  req.user = user;
  next();
}

const avg = (arr) => (arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0);
const round1 = (v) => Math.round(v * 10) / 10;

const classById = (id) => db.get('classes', id);
const studentName = (s) => (s ? `${s.firstName} ${s.lastName}` : '—');
const subjectsForStudent = (stu) => {
  const cls = classById(stu.classId);
  if (!cls) return [];
  return db.all('subjects').filter(
    (s) => s.levels.includes(cls.level) && (!s.pathway || cls.level !== 'Senior School' || s.pathway === stu.pathway)
  );
};

/** Full results for one student in one exam. */
function studentExamResults(studentId, examId) {
  const exam = db.get('exams', examId);
  const stu = db.get('students', studentId);
  if (!exam || !stu) return null;
  const rows = db.find('marks', (m) => m.examId === examId && m.studentId === studentId);
  const bySubject = subjectsForStudent(stu).map((sub) => {
    const m = rows.find((r) => r.subjectId === sub.id);
    const g = m ? gradeOf(m.score, exam.grading) : null;
    return { subjectId: sub.id, subject: sub.name, code: sub.code, score: m ? m.score : null, ...(g || {}) };
  });
  const done = bySubject.filter((r) => r.score !== null);
  const total = done.reduce((a, r) => a + r.score, 0);
  const mean = done.length ? avg(done.map((r) => r.score)) : 0;
  const avgPoints = done.length ? avg(done.map((r) => r.points)) : 0;
  return { subjects: bySubject, total, mean: round1(mean), avgPoints: round1(avgPoints), meanGrade: meanGrade(avgPoints, exam.grading), count: done.length };
}

/** Ranked list (merit order) for a class (+optional stream) in an exam. */
function meritList(examId, classId, stream) {
  let students = db.find('students', (s) => s.classId === classId && s.status === 'Active');
  if (stream) students = students.filter((s) => s.stream === stream);
  const rows = students.map((s) => {
    const r = studentExamResults(s.id, examId);
    return { student: { id: s.id, name: studentName(s), admNo: s.admNo, gender: s.gender, stream: s.stream, classId: s.classId }, total: r.total, mean: r.mean, avgPoints: r.avgPoints, meanGrade: r.meanGrade, count: r.count };
  }).filter((r) => r.count > 0).sort((a, b) => b.total - a.total);
  rows.forEach((r, i) => { r.position = i + 1; });
  return rows;
}

function studentFeeAccount(studentId, year, term) {
  const stu = db.get('students', studentId);
  const cls = classById(stu?.classId);
  if (!stu || !cls) return null;
  const settings = db.settings();
  year = year || settings.currentYear; term = term || settings.currentTerm;
  const struct = db.find('feeStructures', (f) => f.year === Number(year) && f.term === Number(term) && f.level === cls.level)[0];
  const billed = struct ? struct.voteHeads.reduce((a, v) => a + v.amount, 0) : 0;
  const pays = db.find('payments', (p) => p.studentId === studentId && p.year === Number(year) && p.term === Number(term)).sort((a, b) => a.date.localeCompare(b.date));
  const paid = pays.reduce((a, p) => a + p.amount, 0);
  return { structure: struct || null, billed, paid, balance: billed - paid, payments: pays, year: Number(year), term: Number(term) };
}

function attendanceRate(studentId) {
  const recs = db.all('attendance');
  let present = 0, total = 0;
  recs.forEach((a) => {
    const v = a.records?.[studentId];
    if (v) { total += 1; if (v === 'Present' || v === 'Late') present += 1; }
  });
  return total ? round1((present / total) * 100) : 100;
}

/* ---------------- auth ---------------- */
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body || {};
  const user = db.find('users', (u) => u.email.toLowerCase() === String(email || '').toLowerCase() && u.password === password)[0];
  if (!user) return res.status(401).json({ error: 'Invalid email or password' });
  const payload = { id: user.id, name: user.name, email: user.email, role: user.role, studentId: user.studentId || null };
  res.json({ token: sign(payload), user: payload });
});

app.get('/api/auth/me', auth, (req, res) => res.json({ user: req.user }));

/* ---------------- meta / settings ---------------- */
app.get('/api/settings', auth, (req, res) => res.json(db.settings()));
app.put('/api/settings', auth, (req, res) => res.json(db.setSettings(req.body || {})));
app.get('/api/meta', auth, (req, res) => res.json({ ...db.raw().meta, gradingSystems: SYSTEMS }));
app.get('/api/grading', (req, res) => res.json(SYSTEMS));

/* ---------------- generic CRUD ---------------- */
const CRUD = ['students', 'staff', 'classes', 'subjects', 'exams', 'feeStructures', 'assignments', 'books', 'routes', 'discipline', 'events', 'announcements', 'users'];
for (const name of CRUD) {
  app.get(`/api/${name}`, auth, (req, res) => {
    let rows = db.all(name);
    if (name === 'users') rows = rows.map(({ password, ...u }) => u);
    res.json(rows);
  });
  app.get(`/api/${name}/:id`, auth, (req, res) => {
    const r = db.get(name, req.params.id);
    if (!r) return res.status(404).json({ error: 'Not found' });
    res.json(name === 'users' ? (({ password, ...u }) => u)(r) : r);
  });
  app.post(`/api/${name}`, auth, (req, res) => res.status(201).json(db.insert(name, req.body || {})));
  app.put(`/api/${name}/:id`, auth, (req, res) => {
    const r = db.update(name, req.params.id, req.body || {});
    if (!r) return res.status(404).json({ error: 'Not found' });
    res.json(r);
  });
  app.delete(`/api/${name}/:id`, auth, (req, res) => {
    if (!db.remove(name, req.params.id)) return res.status(404).json({ error: 'Not found' });
    // cascade: remove marks when a student/exam is deleted
    if (name === 'students') db.find('marks', (m) => m.studentId === req.params.id).forEach((m) => db.remove('marks', m.id));
    if (name === 'exams') db.find('marks', (m) => m.examId === req.params.id).forEach((m) => db.remove('marks', m.id));
    res.json({ ok: true });
  });
}

/* ---------------- exams & marks ---------------- */
app.get('/api/marks', auth, (req, res) => {
  const { examId, classId, subjectId, studentId } = req.query;
  let rows = db.all('marks');
  if (examId) rows = rows.filter((m) => m.examId === examId);
  if (subjectId) rows = rows.filter((m) => m.subjectId === subjectId);
  if (studentId) rows = rows.filter((m) => m.studentId === studentId);
  if (classId) {
    const ids = new Set(db.find('students', (s) => s.classId === classId).map((s) => s.id));
    rows = rows.filter((m) => ids.has(m.studentId));
  }
  res.json(rows);
});

/** Bulk marks entry — [{examId, studentId, subjectId, score}] */
app.post('/api/marks/bulk', auth, (req, res) => {
  const entries = Array.isArray(req.body?.entries) ? req.body.entries : [];
  let saved = 0;
  for (const e of entries) {
    if (!e.examId || !e.studentId || !e.subjectId) continue;
    const id = `mrk_${e.examId}_${e.studentId}_${e.subjectId}`;
    if (e.score === '' || e.score === null || e.score === undefined) { db.remove('marks', id); continue; }
    const score = Math.max(0, Math.min(100, Number(e.score)));
    if (db.get('marks', id)) db.update('marks', id, { score });
    else db.insert('marks', { id, examId: e.examId, studentId: e.studentId, subjectId: e.subjectId, score });
    saved += 1;
  }
  res.json({ ok: true, saved });
});

/* ---------------- analytics (Zeraki-style) ---------------- */
app.get('/api/analytics/exam/:examId', auth, (req, res) => {
  const exam = db.get('exams', req.params.examId);
  if (!exam) return res.status(404).json({ error: 'Exam not found' });
  const classId = req.query.classId;
  const classes = db.all('classes').filter((c) => !classId || c.id === classId);

  // per-class merit + school aggregates
  const classSummaries = [];
  const allMeans = [];
  const subjectScores = {}; // subjectId -> [scores]
  const gradeCounts = {};
  const genderPerf = { Male: [], Female: [] };

  for (const cls of classes) {
    const merit = meritList(exam.id, cls.id);
    if (!merit.length) continue;
    const means = merit.map((r) => r.mean);
    allMeans.push(...means);
    merit.forEach((r) => {
      if (r.meanGrade) gradeCounts[r.meanGrade.grade] = (gradeCounts[r.meanGrade.grade] || 0) + 1;
      genderPerf[r.student.gender]?.push(r.mean);
    });
    // stream comparison
    const streams = {};
    for (const stream of cls.streams) {
      const sm = meritList(exam.id, cls.id, stream);
      if (sm.length) streams[stream] = { learners: sm.length, mean: round1(avg(sm.map((x) => x.mean))), meanPoints: round1(avg(sm.map((x) => x.avgPoints))) };
    }
    classSummaries.push({
      classId: cls.id, className: cls.name, level: cls.level,
      learners: merit.length, mean: round1(avg(means)),
      meanPoints: round1(avg(merit.map((r) => r.avgPoints))),
      meanGrade: meanGrade(avg(merit.map((r) => r.avgPoints)), exam.grading),
      top: merit[0], bottom: merit[merit.length - 1], streams,
      merit,
    });
  }

  // subject analysis
  const marks = db.find('marks', (m) => m.examId === exam.id);
  const classStudentIds = classId ? new Set(db.find('students', (s) => s.classId === classId).map((s) => s.id)) : null;
  marks.forEach((m) => {
    if (classStudentIds && !classStudentIds.has(m.studentId)) return;
    (subjectScores[m.subjectId] ||= []).push(m.score);
  });
  const subjectAnalysis = Object.entries(subjectScores).map(([subjectId, scores]) => {
    const sub = db.get('subjects', subjectId);
    const mean = avg(scores);
    const dist = {};
    scores.forEach((s) => { const g = gradeOf(s, exam.grading); dist[g.grade] = (dist[g.grade] || 0) + 1; });
    return { subjectId, subject: sub?.name || subjectId, code: sub?.code || '', entries: scores.length, mean: round1(mean), grade: gradeOf(mean, exam.grading), highest: Math.max(...scores), lowest: Math.min(...scores), distribution: dist };
  }).sort((a, b) => b.mean - a.mean);

  // most improved vs previous published exam
  const prevExams = db.all('exams').filter((e) => e.status === 'Published' && e.id !== exam.id && (e.year < exam.year || (e.year === exam.year && e.term <= exam.term))).sort((a, b) => b.year - a.year || b.term - a.term);
  let mostImproved = [];
  if (prevExams.length) {
    const prev = prevExams[0];
    const deltas = [];
    for (const cs of classSummaries) {
      for (const r of cs.merit) {
        const before = studentExamResults(r.student.id, prev.id);
        if (before && before.count) deltas.push({ student: r.student, className: cs.className, from: before.mean, to: r.mean, deviation: round1(r.mean - before.mean) });
      }
    }
    mostImproved = deltas.sort((a, b) => b.deviation - a.deviation).slice(0, 10);
  }

  res.json({
    exam,
    schoolMean: round1(avg(allMeans)),
    learnersAssessed: allMeans.length,
    gradeDistribution: Object.entries(gradeCounts).map(([grade, count]) => ({ grade, count })),
    gender: { Male: round1(avg(genderPerf.Male)), Female: round1(avg(genderPerf.Female)) },
    classSummaries,
    subjectAnalysis,
    mostImproved,
    topOverall: classSummaries.flatMap((c) => c.merit.map((m) => ({ ...m, className: c.className }))).sort((a, b) => b.mean - a.mean).slice(0, 10),
  });
});

/* ---------------- student profile & report ---------------- */
app.get('/api/students/:id/profile', auth, (req, res) => {
  const stu = db.get('students', req.params.id);
  if (!stu) return res.status(404).json({ error: 'Student not found' });
  const exams = db.all('exams').filter((e) => e.status === 'Published').sort((a, b) => a.year - b.year || a.term - b.term || a.date.localeCompare(b.date));
  const history = exams.map((e) => {
    const r = studentExamResults(stu.id, e.id);
    const merit = meritList(e.id, stu.classId);
    const pos = merit.find((m) => m.student.id === stu.id);
    return { examId: e.id, examName: e.name, mean: r.mean, total: r.total, avgPoints: r.avgPoints, meanGrade: r.meanGrade, position: pos?.position || null, outOf: merit.length, subjects: r.subjects };
  });
  const fees = studentFeeAccount(stu.id);
  const competency = db.find('competencies', (c) => c.studentId === stu.id).sort((a, b) => b.year - a.year || b.term - a.term)[0] || null;
  res.json({
    student: stu,
    class: classById(stu.classId),
    history,
    attendanceRate: attendanceRate(stu.id),
    fees,
    competency,
    discipline: db.find('discipline', (d) => d.studentId === stu.id),
  });
});

app.get('/api/students/:id/report', auth, (req, res) => {
  const stu = db.get('students', req.params.id);
  if (!stu) return res.status(404).json({ error: 'Student not found' });
  const examId = req.query.examId;
  const exam = examId ? db.get('exams', examId) : db.all('exams').filter((e) => e.status === 'Published').sort((a, b) => b.date.localeCompare(a.date))[0];
  if (!exam) return res.status(404).json({ error: 'No exam available' });
  const results = studentExamResults(stu.id, exam.id);
  const merit = meritList(exam.id, stu.classId);
  const streamMerit = meritList(exam.id, stu.classId, stu.stream);
  const pos = merit.find((m) => m.student.id === stu.id);
  const streamPos = streamMerit.find((m) => m.student.id === stu.id);
  const cls = classById(stu.classId);
  const classTeacher = db.get('staff', cls?.classTeacherId);
  const competency = db.find('competencies', (c) => c.studentId === stu.id && c.year === exam.year && c.term === exam.term)[0]
    || db.find('competencies', (c) => c.studentId === stu.id)[0] || null;

  // progress vs previous exam
  const ordered = db.all('exams').filter((e) => e.status === 'Published').sort((a, b) => a.date.localeCompare(b.date));
  const idx = ordered.findIndex((e) => e.id === exam.id);
  const prevMean = idx > 0 ? studentExamResults(stu.id, ordered[idx - 1].id)?.mean : null;

  res.json({
    school: db.settings(),
    student: stu,
    class: cls,
    classTeacher: classTeacher?.name || '',
    exam,
    results,
    position: pos?.position || null, outOf: merit.length,
    streamPosition: streamPos?.position || null, streamOutOf: streamMerit.length,
    classMean: round1(avg(merit.map((m) => m.mean))),
    deviation: prevMean !== null && prevMean !== undefined ? round1(results.mean - prevMean) : null,
    attendanceRate: attendanceRate(stu.id),
    fees: studentFeeAccount(stu.id, exam.year, exam.term),
    competency,
    teacherRemark: teacherRemark(results.mean, exam.grading, stu.firstName),
    principalRemark: principalRemark(results.mean),
  });
});

/* ---------------- finance ---------------- */
app.get('/api/fees/summary', auth, (req, res) => {
  const settings = db.settings();
  const year = Number(req.query.year || settings.currentYear);
  const term = Number(req.query.term || settings.currentTerm);
  const students = db.find('students', (s) => s.status === 'Active');
  let billed = 0, collected = 0;
  const byClass = {};
  const balances = [];
  for (const s of students) {
    const acc = studentFeeAccount(s.id, year, term);
    billed += acc.billed; collected += acc.paid;
    const cls = classById(s.classId);
    byClass[cls?.name || '—'] ||= { className: cls?.name || '—', billed: 0, collected: 0 };
    byClass[cls?.name || '—'].billed += acc.billed;
    byClass[cls?.name || '—'].collected += acc.paid;
    balances.push({ student: { id: s.id, name: studentName(s), admNo: s.admNo, classId: s.classId, stream: s.stream, guardianPhone: s.guardian?.phone }, className: cls?.name, billed: acc.billed, paid: acc.paid, balance: acc.balance });
  }
  const recentPayments = db.find('payments', (p) => p.year === year && p.term === term)
    .sort((a, b) => b.date.localeCompare(a.date)).slice(0, 15)
    .map((p) => ({ ...p, studentName: studentName(db.get('students', p.studentId)) }));
  const monthly = {};
  db.find('payments', (p) => p.year === year).forEach((p) => { const m = p.date.slice(0, 7); monthly[m] = (monthly[m] || 0) + p.amount; });
  res.json({
    year, term, billed, collected, outstanding: billed - collected,
    collectionRate: billed ? round1((collected / billed) * 100) : 0,
    byClass: Object.values(byClass),
    balances: balances.sort((a, b) => b.balance - a.balance),
    defaulters: balances.filter((b) => b.balance > 0).length,
    recentPayments,
    monthlyTrend: Object.entries(monthly).sort().map(([month, amount]) => ({ month, amount })),
  });
});

app.get('/api/students/:id/fees', auth, (req, res) => {
  const acc = studentFeeAccount(req.params.id, req.query.year, req.query.term);
  if (!acc) return res.status(404).json({ error: 'Student not found' });
  res.json(acc);
});

app.get('/api/payments', auth, (req, res) => {
  let rows = db.all('payments');
  if (req.query.studentId) rows = rows.filter((p) => p.studentId === req.query.studentId);
  res.json(rows.sort((a, b) => b.date.localeCompare(a.date)).map((p) => ({ ...p, studentName: studentName(db.get('students', p.studentId)) })));
});

app.post('/api/payments', auth, (req, res) => {
  const settings = db.settings();
  const { studentId, amount, method, ref, date } = req.body || {};
  if (!studentId || !amount) return res.status(400).json({ error: 'studentId and amount are required' });
  const p = db.insert('payments', {
    id: uid('pay'), studentId, amount: Number(amount),
    method: method || 'M-Pesa',
    ref: ref || `RCPT-${Date.now().toString().slice(-6)}`,
    year: settings.currentYear, term: settings.currentTerm,
    date: date || new Date().toISOString().slice(0, 10),
    receivedBy: req.user.name,
  });
  res.status(201).json(p);
});
app.delete('/api/payments/:id', auth, (req, res) => res.json({ ok: db.remove('payments', req.params.id) }));

/* ---------------- attendance ---------------- */
app.get('/api/attendance', auth, (req, res) => {
  const { date, classId, stream } = req.query;
  let rows = db.all('attendance');
  if (date) rows = rows.filter((a) => a.date === date);
  if (classId) rows = rows.filter((a) => a.classId === classId);
  if (stream) rows = rows.filter((a) => a.stream === stream);
  res.json(rows);
});

app.post('/api/attendance', auth, (req, res) => {
  const { date, classId, stream, records } = req.body || {};
  if (!date || !classId) return res.status(400).json({ error: 'date and classId required' });
  const id = `att_${date}_${classId}_${stream || ''}`;
  const rec = { id, date, classId, stream: stream || '', records: records || {}, takenBy: req.user.name };
  if (db.get('attendance', id)) db.update('attendance', id, rec); else db.insert('attendance', rec);
  res.json(rec);
});

app.get('/api/attendance/summary', auth, (req, res) => {
  const dates = [...new Set(db.all('attendance').map((a) => a.date))].sort();
  const trend = dates.map((d) => {
    const rows = db.find('attendance', (a) => a.date === d);
    let present = 0, total = 0, absent = 0, late = 0;
    rows.forEach((r) => Object.values(r.records).forEach((v) => { total += 1; if (v === 'Present') present += 1; else if (v === 'Late') { present += 1; late += 1; } else absent += 1; }));
    return { date: d, rate: total ? round1((present / total) * 100) : 0, present, absent, late, total };
  });
  res.json({ trend, latest: trend[trend.length - 1] || null });
});

/* ---------------- timetable ---------------- */
app.get('/api/timetable', auth, (req, res) => {
  const { classId, stream } = req.query;
  let rows = db.all('timetable');
  if (classId) rows = rows.filter((t) => t.classId === classId);
  if (stream) rows = rows.filter((t) => t.stream === stream);
  res.json(rows);
});

app.put('/api/timetable/slot', auth, (req, res) => {
  const { timetableId, day, period, subjectId, teacherId } = req.body || {};
  const tt = db.get('timetable', timetableId);
  if (!tt) return res.status(404).json({ error: 'Timetable not found' });
  const slot = tt.slots.find((s) => s.day === day && s.period === Number(period));
  if (slot) { slot.subjectId = subjectId; slot.teacherId = teacherId || slot.teacherId; }
  else tt.slots.push({ day, period: Number(period), subjectId, teacherId });
  db.update('timetable', tt.id, { slots: tt.slots });
  res.json(tt);
});

/** Auto-generate a weekly timetable for a class/stream. */
app.post('/api/timetable/generate', auth, (req, res) => {
  const { classId, stream } = req.body || {};
  const cls = classById(classId);
  if (!cls) return res.status(404).json({ error: 'Class not found' });
  const meta = db.raw().meta;
  const pathway = stream === 'STEM' ? 'STEM' : stream === 'Social Sciences' ? 'Social Sciences' : undefined;
  const subs = db.all('subjects').filter((s) => s.levels.includes(cls.level) && (!s.pathway || cls.level !== 'Senior School' || s.pathway === pathway));
  // weight: languages & maths get more lessons per week
  const weights = { MAT: 6, ENG: 5, KIS: 5, ISC: 4, SCI: 4 };
  const bag = [];
  subs.forEach((s) => { const w = weights[s.code] || 3; for (let i = 0; i < w; i++) bag.push(s); });
  const totalSlots = meta.days.length * meta.periods.length;
  const slots = [];
  let idx = Math.floor(Math.random() * bag.length);
  const perDayCount = {};
  meta.days.forEach((day) => {
    perDayCount[day] = {};
    for (let p = 1; p <= meta.periods.length; p++) {
      let sub = bag[idx % bag.length]; idx += 7; // stride to spread subjects
      let guard = 0;
      while ((perDayCount[day][sub.id] || 0) >= 2 && guard++ < bag.length) { sub = bag[idx % bag.length]; idx += 3; }
      perDayCount[day][sub.id] = (perDayCount[day][sub.id] || 0) + 1;
      const teacher = db.find('staff', (t) => (t.subjects || []).includes(sub.id))[0];
      slots.push({ day, period: p, subjectId: sub.id, teacherId: teacher?.id || '' });
    }
  });
  const id = `tt_${classId}_${stream || cls.streams[0]}`;
  const tt = { id, classId, stream: stream || cls.streams[0], slots };
  if (db.get('timetable', id)) db.update('timetable', id, tt); else db.insert('timetable', tt);
  res.json(tt);
});

/* ---------------- competencies ---------------- */
app.get('/api/competencies', auth, (req, res) => {
  let rows = db.all('competencies');
  if (req.query.studentId) rows = rows.filter((c) => c.studentId === req.query.studentId);
  res.json(rows);
});
app.post('/api/competencies', auth, (req, res) => {
  const { studentId, year, term, ratings } = req.body || {};
  const id = `cmp_${studentId}_${year}_${term}`;
  const rec = { id, studentId, year: Number(year), term: Number(term), ratings: ratings || {} };
  if (db.get('competencies', id)) db.update('competencies', id, rec); else db.insert('competencies', rec);
  res.json(rec);
});

/* ---------------- communications ---------------- */
app.get('/api/messages', auth, (req, res) => res.json(db.all('messages').sort((a, b) => b.date.localeCompare(a.date))));
app.post('/api/messages/send', auth, (req, res) => {
  const { audience, body, classId } = req.body || {};
  if (!body) return res.status(400).json({ error: 'Message body is required' });
  let recipients = db.find('students', (s) => s.status === 'Active');
  if (audience === 'Class' && classId) recipients = recipients.filter((s) => s.classId === classId);
  if (audience === 'Fee Defaulters') recipients = recipients.filter((s) => studentFeeAccount(s.id).balance > 0);
  if (audience === 'Boarders') recipients = recipients.filter((s) => s.boarding);
  const msg = db.insert('messages', {
    id: uid('msg'), channel: 'SMS', audience: audience || 'All Parents', body,
    recipients: recipients.length, date: new Date().toISOString().slice(0, 10), by: req.user.name, status: 'Delivered',
  });
  const settings = db.settings();
  db.setSettings({ smsBalance: Math.max(0, (settings.smsBalance || 0) - recipients.length) });
  res.status(201).json(msg);
});

/* ---------------- library issue/return ---------------- */
app.post('/api/books/:id/issue', auth, (req, res) => {
  const book = db.get('books', req.params.id);
  if (!book) return res.status(404).json({ error: 'Book not found' });
  book.issued = book.issued || [];
  book.issued.push({ studentId: req.body.studentId, issueDate: new Date().toISOString().slice(0, 10), dueDate: req.body.dueDate || '' });
  db.update('books', book.id, { issued: book.issued });
  res.json(book);
});
app.post('/api/books/:id/return', auth, (req, res) => {
  const book = db.get('books', req.params.id);
  if (!book) return res.status(404).json({ error: 'Book not found' });
  book.issued = (book.issued || []).filter((i) => i.studentId !== req.body.studentId);
  db.update('books', book.id, { issued: book.issued });
  res.json(book);
});

/* ---------------- insights (unique Elimu360 feature) ---------------- */
app.get('/api/insights', auth, (req, res) => {
  const exams = db.all('exams').filter((e) => e.status === 'Published').sort((a, b) => a.date.localeCompare(b.date));
  const latest = exams[exams.length - 1];
  const learners = [];
  for (const stu of db.find('students', (s) => s.status === 'Active')) {
    const cls = classById(stu.classId);
    if (cls?.level === 'Pre-Primary') continue;
    const means = exams.map((e) => studentExamResults(stu.id, e.id)?.mean || 0).filter((m) => m > 0);
    if (!means.length) continue;
    const currentMean = means[means.length - 1];
    // simple linear-trend projection for next assessment
    let predicted = currentMean;
    if (means.length >= 2) {
      const slope = (means[means.length - 1] - means[0]) / (means.length - 1);
      predicted = Math.max(0, Math.min(100, currentMean + slope));
    }
    const att = attendanceRate(stu.id);
    const fees = studentFeeAccount(stu.id);
    const feeRatio = fees.billed ? fees.paid / fees.billed : 1;
    const flags = [];
    if (currentMean < 40) flags.push('Below expectations academically');
    if (means.length >= 2 && means[means.length - 1] - means[means.length - 2] <= -8) flags.push('Sharp decline in last exam');
    if (att < 85) flags.push(`Low attendance (${att}%)`);
    if (feeRatio < 0.4) flags.push('High fee arrears');
    const riskScore = (currentMean < 40 ? 40 : currentMean < 55 ? 20 : 0) + (att < 85 ? 25 : att < 92 ? 10 : 0) + (feeRatio < 0.4 ? 20 : feeRatio < 0.7 ? 8 : 0) + (flags.includes('Sharp decline in last exam') ? 15 : 0);
    learners.push({
      student: { id: stu.id, name: studentName(stu), admNo: stu.admNo, classId: stu.classId, stream: stu.stream },
      className: cls?.name, currentMean, predicted: round1(predicted),
      predictedGrade: latest ? gradeOf(predicted, latest.grading) : null,
      attendance: att, feeBalance: fees.balance, riskScore, flags,
      riskLevel: riskScore >= 45 ? 'High' : riskScore >= 20 ? 'Medium' : 'Low',
      trend: means,
    });
  }
  learners.sort((a, b) => b.riskScore - a.riskScore);
  res.json({
    learners,
    atRisk: learners.filter((l) => l.riskLevel !== 'Low'),
    summary: {
      high: learners.filter((l) => l.riskLevel === 'High').length,
      medium: learners.filter((l) => l.riskLevel === 'Medium').length,
      onTrack: learners.filter((l) => l.riskLevel === 'Low').length,
    },
  });
});

/* ---------------- dashboard ---------------- */
app.get('/api/dashboard', auth, (req, res) => {
  const settings = db.settings();
  const students = db.find('students', (s) => s.status === 'Active');
  const byLevel = {};
  const byClass = {};
  const gender = { Male: 0, Female: 0 };
  students.forEach((s) => {
    const cls = classById(s.classId);
    if (cls) { byLevel[cls.level] = (byLevel[cls.level] || 0) + 1; byClass[cls.name] = (byClass[cls.name] || 0) + 1; }
    gender[s.gender] = (gender[s.gender] || 0) + 1;
  });

  const exams = db.all('exams').filter((e) => e.status === 'Published').sort((a, b) => a.date.localeCompare(b.date));
  const performanceTrend = exams.map((e) => {
    const rows = db.find('marks', (m) => m.examId === e.id);
    return { exam: e.name.replace(/ — .*/, ''), term: `T${e.term} ${e.year}`, mean: round1(avg(rows.map((r) => r.score))) };
  });
  const latestExam = exams[exams.length - 1];
  const topLearners = latestExam
    ? db.all('classes').flatMap((c) => meritList(latestExam.id, c.id).slice(0, 1).map((m) => ({ ...m, className: c.name }))).sort((a, b) => b.mean - a.mean).slice(0, 5)
    : [];

  let billed = 0, collected = 0;
  students.forEach((s) => { const a = studentFeeAccount(s.id); billed += a.billed; collected += a.paid; });

  const dates = [...new Set(db.all('attendance').map((a) => a.date))].sort();
  const latestDate = dates[dates.length - 1];
  let attRate = 0, absenteesToday = 0;
  if (latestDate) {
    let present = 0, total = 0;
    db.find('attendance', (a) => a.date === latestDate).forEach((r) => Object.values(r.records).forEach((v) => { total += 1; if (v !== 'Absent') present += 1; else absenteesToday += 1; }));
    attRate = total ? round1((present / total) * 100) : 0;
  }

  res.json({
    totalStudents: students.length,
    totalStaff: db.find('staff', (s) => s.status === 'Active').length,
    teachers: db.find('staff', (s) => ['Teacher', 'Admin'].includes(s.role) && s.subjects?.length).length,
    gender,
    byLevel: Object.entries(byLevel).map(([level, count]) => ({ level, count })),
    byClass: Object.entries(byClass).map(([name, count]) => ({ name, count })),
    fees: { billed, collected, outstanding: billed - collected, rate: billed ? round1((collected / billed) * 100) : 0, term: settings.currentTerm, year: settings.currentYear },
    attendanceToday: { date: latestDate, rate: attRate, absentees: absenteesToday },
    performanceTrend,
    schoolMean: performanceTrend.length ? performanceTrend[performanceTrend.length - 1].mean : 0,
    topLearners,
    upcomingEvents: db.all('events').sort((a, b) => a.date.localeCompare(b.date)).slice(0, 4),
    recentPayments: db.all('payments').sort((a, b) => b.date.localeCompare(a.date)).slice(0, 6).map((p) => ({ ...p, studentName: studentName(db.get('students', p.studentId)) })),
    boarding: students.filter((s) => s.boarding).length,
    transport: students.filter((s) => s.transportRouteId).length,
    smsBalance: settings.smsBalance,
  });
});

app.get('/api/health', (req, res) => res.json({ ok: true, app: 'Elimu360 API' }));

app.listen(PORT, '0.0.0.0', () => console.log(`✅ Elimu360 API running on http://localhost:${PORT}`));
