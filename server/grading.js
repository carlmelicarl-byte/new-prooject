/**
 * Kenyan curriculum grading engines.
 *  - CBC4 : CBC school-based assessment (EE / ME / AE / BE) — 4 levels
 *  - CBE8 : CBE national assessment bands as used in KPSEA & KJSEA (EE1..BE2) — 8 points
 *  - KCSE : 8-4-4 KCSE grades (A .. E) — 12 points
 */

const CBC4 = [
  { min: 75, grade: 'EE', label: 'Exceeding Expectations', points: 4, descriptor: 'Consistently produces high quality work, applies knowledge and skills in new situations.' },
  { min: 50, grade: 'ME', label: 'Meeting Expectations', points: 3, descriptor: 'Produces quality work, applies knowledge and skills correctly in most situations.' },
  { min: 25, grade: 'AE', label: 'Approaching Expectations', points: 2, descriptor: 'Work is developing; needs support to apply knowledge and skills correctly.' },
  { min: 0,  grade: 'BE', label: 'Below Expectations', points: 1, descriptor: 'Produces low quality work; needs a lot of support to apply knowledge and skills.' },
];

const CBE8 = [
  { min: 90, grade: 'EE1', label: 'Exceeding Expectation 1', points: 8 },
  { min: 75, grade: 'EE2', label: 'Exceeding Expectation 2', points: 7 },
  { min: 58, grade: 'ME1', label: 'Meeting Expectation 1', points: 6 },
  { min: 41, grade: 'ME2', label: 'Meeting Expectation 2', points: 5 },
  { min: 31, grade: 'AE1', label: 'Approaching Expectation 1', points: 4 },
  { min: 21, grade: 'AE2', label: 'Approaching Expectation 2', points: 3 },
  { min: 11, grade: 'BE1', label: 'Below Expectation 1', points: 2 },
  { min: 0,  grade: 'BE2', label: 'Below Expectation 2', points: 1 },
];

const KCSE = [
  { min: 85, grade: 'A',  points: 12 },
  { min: 80, grade: 'A-', points: 11 },
  { min: 75, grade: 'B+', points: 10 },
  { min: 70, grade: 'B',  points: 9 },
  { min: 65, grade: 'B-', points: 8 },
  { min: 60, grade: 'C+', points: 7 },
  { min: 55, grade: 'C',  points: 6 },
  { min: 50, grade: 'C-', points: 5 },
  { min: 45, grade: 'D+', points: 4 },
  { min: 40, grade: 'D',  points: 3 },
  { min: 35, grade: 'D-', points: 2 },
  { min: 0,  grade: 'E',  points: 1 },
];

const SYSTEMS = { CBC4, CBE8, KCSE };

function gradeOf(score, system = 'CBC4') {
  const table = SYSTEMS[system] || CBC4;
  if (score === null || score === undefined || score === '') return null;
  const s = Math.max(0, Math.min(100, Number(score)));
  const row = table.find((r) => s >= r.min) || table[table.length - 1];
  return { score: Math.round(s * 10) / 10, grade: row.grade, label: row.label || row.grade, points: row.points, descriptor: row.descriptor || '' };
}

/** Mean grade label from average points, for a given grading system. */
function meanGrade(avgPoints, system = 'CBC4') {
  const table = SYSTEMS[system] || CBC4;
  if (avgPoints === null || avgPoints === undefined || Number.isNaN(avgPoints)) return null;
  const p = Math.round(avgPoints);
  const row = table.find((r) => r.points === p) || table[table.length - 1];
  return { grade: row.grade, label: row.label || row.grade, points: p };
}

/** Auto remarks for report forms (Zeraki-style generated comments). */
function teacherRemark(meanScore, system, firstName) {
  if (meanScore >= 80) return `${firstName} is an outstanding learner who consistently exceeds expectations. Keep aiming high.`;
  if (meanScore >= 65) return `${firstName} has performed very well this term and meets expectations in most learning areas. With more consistency, excellence is within reach.`;
  if (meanScore >= 50) return `${firstName} has shown fair progress. Encourage more revision and timely completion of assignments to improve further.`;
  if (meanScore >= 35) return `${firstName}'s performance is below average. Close supervision, extra practice and consultation with teachers is advised.`;
  return `${firstName} is struggling in most learning areas. A meeting with the parent/guardian is recommended to agree on an intervention plan.`;
}

function principalRemark(meanScore) {
  if (meanScore >= 80) return 'Excellent performance. The learner is a role model to others. Hongera!';
  if (meanScore >= 65) return 'Good performance. Keep up the hard work and discipline.';
  if (meanScore >= 50) return 'Fair performance. More effort and focus is needed next term.';
  if (meanScore >= 35) return 'Performance needs serious improvement. Let us work together to support the learner.';
  return 'Poor performance. Parent is requested to visit the school for consultation.';
}

module.exports = { SYSTEMS, gradeOf, meanGrade, teacherRemark, principalRemark };
