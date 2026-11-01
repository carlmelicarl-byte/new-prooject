export const fmtKES = (v) => 'KES ' + Number(v || 0).toLocaleString('en-KE');
export const fmtDate = (d) => {
  if (!d) return '—';
  const dt = new Date(d);
  return Number.isNaN(dt.getTime()) ? d : dt.toLocaleDateString('en-KE', { day: 'numeric', month: 'short', year: 'numeric' });
};
export const studentName = (s) => (s ? `${s.firstName} ${s.lastName}` : '—');

export const LEVELS = ['Pre-Primary', 'Lower Primary', 'Upper Primary', 'Junior School', 'Senior School'];
export const PATHWAYS = ['STEM', 'Social Sciences', 'Arts & Sports Science'];
export const CORE_COMPETENCIES = [
  'Communication & Collaboration',
  'Critical Thinking & Problem Solving',
  'Creativity & Imagination',
  'Citizenship',
  'Digital Literacy',
  'Learning to Learn',
  'Self-Efficacy',
];

/* Client-side copy of the Kenyan grading engines (mirrors server/grading.js) */
export const GRADING = {
  CBC4: [
    { min: 75, grade: 'EE', label: 'Exceeding Expectations', points: 4 },
    { min: 50, grade: 'ME', label: 'Meeting Expectations', points: 3 },
    { min: 25, grade: 'AE', label: 'Approaching Expectations', points: 2 },
    { min: 0, grade: 'BE', label: 'Below Expectations', points: 1 },
  ],
  CBE8: [
    { min: 90, grade: 'EE1', label: 'Exceeding Expectation 1', points: 8 },
    { min: 75, grade: 'EE2', label: 'Exceeding Expectation 2', points: 7 },
    { min: 58, grade: 'ME1', label: 'Meeting Expectation 1', points: 6 },
    { min: 41, grade: 'ME2', label: 'Meeting Expectation 2', points: 5 },
    { min: 31, grade: 'AE1', label: 'Approaching Expectation 1', points: 4 },
    { min: 21, grade: 'AE2', label: 'Approaching Expectation 2', points: 3 },
    { min: 11, grade: 'BE1', label: 'Below Expectation 1', points: 2 },
    { min: 0, grade: 'BE2', label: 'Below Expectation 2', points: 1 },
  ],
  KCSE: [
    { min: 85, grade: 'A', points: 12 }, { min: 80, grade: 'A-', points: 11 },
    { min: 75, grade: 'B+', points: 10 }, { min: 70, grade: 'B', points: 9 },
    { min: 65, grade: 'B-', points: 8 }, { min: 60, grade: 'C+', points: 7 },
    { min: 55, grade: 'C', points: 6 }, { min: 50, grade: 'C-', points: 5 },
    { min: 45, grade: 'D+', points: 4 }, { min: 40, grade: 'D', points: 3 },
    { min: 35, grade: 'D-', points: 2 }, { min: 0, grade: 'E', points: 1 },
  ],
};

export const GRADING_LABELS = {
  CBC4: 'CBC 4-Level (EE–BE)',
  CBE8: 'CBE 8-Band (KPSEA / KJSEA)',
  KCSE: 'KCSE 12-Point (8-4-4)',
};

export function gradeOf(score, system = 'CBE8') {
  if (score === null || score === undefined || score === '') return null;
  const table = GRADING[system] || GRADING.CBE8;
  const s = Math.max(0, Math.min(100, Number(score)));
  return table.find((r) => s >= r.min) || table[table.length - 1];
}

export function gradeColor(grade) {
  if (!grade) return 'bg-slate-100 text-slate-500';
  const g = String(grade);
  if (g.startsWith('EE')) return 'bg-emerald-100 text-emerald-800 border border-emerald-200';
  if (g.startsWith('ME')) return 'bg-sky-100 text-sky-800 border border-sky-200';
  if (g.startsWith('AE')) return 'bg-amber-100 text-amber-800 border border-amber-200';
  if (g.startsWith('BE')) return 'bg-rose-100 text-rose-800 border border-rose-200';
  if (g.startsWith('A')) return 'bg-emerald-100 text-emerald-800 border border-emerald-200';
  if (g.startsWith('B')) return 'bg-sky-100 text-sky-800 border border-sky-200';
  if (g.startsWith('C')) return 'bg-amber-100 text-amber-800 border border-amber-200';
  return 'bg-rose-100 text-rose-800 border border-rose-200';
}

export const LEVEL_NAMES = { 4: 'EE', 3: 'ME', 2: 'AE', 1: 'BE' };
export const LEVEL_LABELS = { 4: 'Exceeding', 3: 'Meeting', 2: 'Approaching', 1: 'Below' };

export const initials = (name) =>
  String(name || '?').split(' ').map((w) => w[0]).filter(Boolean).slice(0, 2).join('').toUpperCase();

export const AVATAR_COLORS = ['bg-emerald-500', 'bg-teal-500', 'bg-sky-500', 'bg-indigo-500', 'bg-violet-500', 'bg-rose-500', 'bg-amber-500', 'bg-cyan-600'];
export const avatarColor = (seedStr) => {
  let h = 0;
  for (const c of String(seedStr || '')) h = (h * 31 + c.charCodeAt(0)) % 997;
  return AVATAR_COLORS[h % AVATAR_COLORS.length];
};
