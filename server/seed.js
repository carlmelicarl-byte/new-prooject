/**
 * Seed data for Elimu360 — a realistic Kenyan school.
 * Deterministic pseudo-random so every fresh install gets the same school.
 */

// mulberry32 deterministic RNG
function rng(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rand = rng(20261101);
const pick = (arr) => arr[Math.floor(rand() * arr.length)];
const ri = (min, max) => Math.floor(rand() * (max - min + 1)) + min;
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

const GIRLS = ['Amina','Wanjiru','Wafula','Atieno','Chebet','Njeri','Moraa','Wambui','Achieng','Nyambura','Mwikali','Kadzo','Nekesa','Mwende','Nyokabi','Chao','Wanjiku','Khadija','Naliaka','Anyango','Gathoni','Muthoni','Zainabu','Rehema','Waithera'];
const BOYS = ['Kamau','Otieno','Mutua','Kiprop','Ochieng','Maina','Karanja','Omondi','Mwangi','Barasa','Njoroge','Wekesa','Gitau','Onyango','Kibet','Mbugua','Odhiambo','Kimani','Simiyu','Kariuki','Abdalla','Juma','Kiptoo','Wafula','Owino'];
const SURNAMES = ['Mwangi','Otieno','Kamau','Wanjiru','Njoroge','Achieng','Mutiso','Chepkirui','Omondi','Wafula','Karanja','Nyambura','Ochieng','Muthoni','Barasa','Kilonzo','Atieno','Maina','Kiprop','Moraa','Gitonga','Wekesa','Nyokabi','Odhiambo','Mwikali','Korir','Ali','Hassan','Wambui','Kimeu'];
const COUNTIES = ['Nairobi','Kiambu','Kajiado','Machakos','Muranga','Nakuru'];
const ESTATES = ['Kahawa West','Ruiru','Zimmerman','Roysambu','Githurai','Kasarani','Thika Road','Juja','Witeithie','Kimbo'];

const LEVELS = ['Pre-Primary', 'Lower Primary', 'Upper Primary', 'Junior School', 'Senior School'];

const CLASS_DEFS = [
  { id: 'cls_pp1', name: 'PP1', level: 'Pre-Primary', streams: ['Red'], order: 0 },
  { id: 'cls_g2', name: 'Grade 2', level: 'Lower Primary', streams: ['Blue'], order: 2 },
  { id: 'cls_g4', name: 'Grade 4', level: 'Upper Primary', streams: ['North'], order: 4 },
  { id: 'cls_g5', name: 'Grade 5', level: 'Upper Primary', streams: ['North'], order: 5 },
  { id: 'cls_g6', name: 'Grade 6', level: 'Upper Primary', streams: ['North', 'South'], order: 6 },
  { id: 'cls_g7', name: 'Grade 7', level: 'Junior School', streams: ['East', 'West'], order: 7 },
  { id: 'cls_g8', name: 'Grade 8', level: 'Junior School', streams: ['East', 'West'], order: 8 },
  { id: 'cls_g9', name: 'Grade 9', level: 'Junior School', streams: ['East'], order: 9 },
  { id: 'cls_g10', name: 'Grade 10', level: 'Senior School', streams: ['STEM', 'Social Sciences'], order: 10 },
  { id: 'cls_g11', name: 'Grade 11', level: 'Senior School', streams: ['STEM'], order: 11 },
];

const SUBJECT_DEFS = [
  // Upper Primary (KPSEA)
  { id: 'sub_eng', name: 'English', code: 'ENG', levels: ['Lower Primary','Upper Primary','Junior School','Senior School'], strands: ['Listening & Speaking','Reading','Grammar in Use','Writing'] },
  { id: 'sub_kis', name: 'Kiswahili', code: 'KIS', levels: ['Lower Primary','Upper Primary','Junior School','Senior School'], strands: ['Kusikiliza na Kuzungumza','Kusoma','Sarufi','Kuandika'] },
  { id: 'sub_mat', name: 'Mathematics', code: 'MAT', levels: ['Lower Primary','Upper Primary','Junior School','Senior School'], strands: ['Numbers','Algebra','Geometry','Measurement','Data Handling'] },
  { id: 'sub_sci', name: 'Science & Technology', code: 'SCI', levels: ['Upper Primary'], strands: ['Living Things','Physical Science','Earth & Space','Digital Technology'] },
  { id: 'sub_soc_p', name: 'Social Studies', code: 'SST', levels: ['Upper Primary'], strands: ['Our Environment','People & Relationships','Resources & Economic Activities'] },
  { id: 'sub_cre_p', name: 'Religious Education (CRE)', code: 'CRE', levels: ['Upper Primary','Junior School','Senior School'], strands: ['Creation','The Bible','Faith & God','Christian Values'] },
  { id: 'sub_agr_p', name: 'Agriculture & Nutrition', code: 'AGR', levels: ['Upper Primary','Junior School'], strands: ['Conserving Our Environment','Gardening Practices','Animal Care','Food & Nutrition'] },
  { id: 'sub_art_p', name: 'Creative Arts', code: 'CART', levels: ['Upper Primary'], strands: ['Drawing & Painting','Crafts','Music & Dance','Physical Education'] },
  // Junior School (KJSEA)
  { id: 'sub_intsci', name: 'Integrated Science', code: 'ISC', levels: ['Junior School'], strands: ['Mixtures & Elements','Living Things','Force & Energy','Earth Science'] },
  { id: 'sub_soc_j', name: 'Social Studies', code: 'SST', levels: ['Junior School'], strands: ['Historical Concepts','Maps & Graphs','Citizenship','Governance'] },
  { id: 'sub_pret', name: 'Pre-Technical & Pre-Career', code: 'PTC', levels: ['Junior School'], strands: ['Foundations of Pre-Technical Studies','Woodwork & Metalwork','Computing','Business Studies'] },
  { id: 'sub_cas', name: 'Creative Arts & Sports', code: 'CAS', levels: ['Junior School'], strands: ['Visual Arts','Performing Arts','Sports & Games'] },
  // Senior School pathways
  { id: 'sub_bio', name: 'Biology', code: 'BIO', levels: ['Senior School'], pathway: 'STEM', strands: ['Cell Biology','Plant Nutrition','Transport in Living Things','Homeostasis'] },
  { id: 'sub_che', name: 'Chemistry', code: 'CHE', levels: ['Senior School'], pathway: 'STEM', strands: ['Atomic Structure','Periodic Trends','Organic Chemistry','Mole Concept'] },
  { id: 'sub_phy', name: 'Physics', code: 'PHY', levels: ['Senior School'], pathway: 'STEM', strands: ['Measurements','Mechanics','Waves','Electricity'] },
  { id: 'sub_com', name: 'Computer Studies', code: 'CMP', levels: ['Senior School'], pathway: 'STEM', strands: ['Computer Systems','Programming','Data Representation','Networks'] },
  { id: 'sub_geo', name: 'Geography', code: 'GEO', levels: ['Senior School'], pathway: 'Social Sciences', strands: ['The Earth','Weather & Climate','Map Work','Field Work'] },
  { id: 'sub_his', name: 'History & Citizenship', code: 'HIS', levels: ['Senior School'], pathway: 'Social Sciences', strands: ['Pre-History','Kenyan History','Citizenship','Governance'] },
  { id: 'sub_bus', name: 'Business Studies', code: 'BUS', levels: ['Senior School'], pathway: 'Social Sciences', strands: ['Introduction to Business','Entrepreneurship','Marketing','Financial Literacy'] },
];

const CORE_COMPETENCIES = [
  'Communication & Collaboration',
  'Critical Thinking & Problem Solving',
  'Creativity & Imagination',
  'Citizenship',
  'Digital Literacy',
  'Learning to Learn',
  'Self-Efficacy',
];

const VALUES = ['Love', 'Responsibility', 'Respect', 'Unity', 'Peace', 'Patriotism', 'Social Justice', 'Integrity'];

const STAFF_DEFS = [
  { name: 'Mrs. Grace Nyokabi', designation: 'Principal', role: 'Admin', subjects: ['sub_eng'] },
  { name: 'Mr. Peter Ochieng', designation: 'Deputy Principal (Academics)', role: 'Admin', subjects: ['sub_mat'] },
  { name: 'Ms. Faith Chepkirui', designation: 'Head of Junior School', role: 'Teacher', subjects: ['sub_intsci', 'sub_sci'] },
  { name: 'Mr. David Kimani', designation: 'HOD Mathematics', role: 'Teacher', subjects: ['sub_mat'] },
  { name: 'Mrs. Anne Wambui', designation: 'HOD Languages', role: 'Teacher', subjects: ['sub_eng'] },
  { name: 'Mr. Joseph Barasa', designation: 'Teacher', role: 'Teacher', subjects: ['sub_kis'] },
  { name: 'Ms. Mary Atieno', designation: 'Teacher', role: 'Teacher', subjects: ['sub_soc_j', 'sub_soc_p', 'sub_his'] },
  { name: 'Mr. Samuel Turkana', designation: 'HOD Sciences', role: 'Teacher', subjects: ['sub_bio', 'sub_che'] },
  { name: 'Ms. Lucy Moraa', designation: 'Teacher', role: 'Teacher', subjects: ['sub_cre_p'] },
  { name: 'Mr. Brian Owino', designation: 'Teacher / ICT Champion', role: 'Teacher', subjects: ['sub_com', 'sub_pret'] },
  { name: 'Mrs. Esther Wanjiru', designation: 'Teacher', role: 'Teacher', subjects: ['sub_phy', 'sub_mat'] },
  { name: 'Mr. Collins Kiprop', designation: 'Games & Sports Master', role: 'Teacher', subjects: ['sub_cas', 'sub_art_p'] },
  { name: 'Ms. Beatrice Njeri', designation: 'Teacher', role: 'Teacher', subjects: ['sub_geo', 'sub_bus'] },
  { name: 'Mr. Henry Kilonzo', designation: 'Teacher', role: 'Teacher', subjects: ['sub_agr_p'] },
  { name: 'Mrs. Sarah Mbugua', designation: 'Bursar / Accountant', role: 'Accountant', subjects: [] },
  { name: 'Ms. Judith Awino', designation: 'School Secretary', role: 'Admin', subjects: [] },
  { name: 'Mr. George Kariuki', designation: 'Librarian', role: 'Non-Teaching', subjects: [] },
];

const HOUSES = ['Simba', 'Twiga', 'Tembo', 'Kifaru'];

function buildSeed() {
  const settings = {
    schoolName: 'Shule ya Msingi Academy',
    motto: 'Elimu ni Ufunguo — Knowledge is the Key',
    county: 'Kiambu',
    subCounty: 'Ruiru',
    address: 'P.O. Box 1234 - 00232, Ruiru, Kiambu County',
    phone: '+254 712 345 678',
    email: 'info@Shule ya Msingi.ac.ke',
    website: 'www.Shule ya Msingi.ac.ke',
    knECCentreCode: '11207123',
    currentYear: 2026,
    currentTerm: 1,
    termDates: { opens: '2026-01-05', closes: '2026-04-02', nextOpens: '2026-04-27' },
    mpesaPaybill: '400200',
    gradingSystem: 'CBE8',
    smsBalance: 4250,
    levels: LEVELS,
    pathways: ['STEM', 'Social Sciences', 'Arts & Sports Science'],
    coreCompetencies: CORE_COMPETENCIES,
    values: VALUES,
  };

  const staff = STAFF_DEFS.map((s, i) => ({
    id: `stf_${i + 1}`,
    name: s.name,
    tscNo: s.role === 'Non-Teaching' || s.role === 'Accountant' ? '' : `TSC/${100000 + i * 137}/2015`,
    designation: s.designation,
    role: s.role,
    subjects: s.subjects,
    phone: `07${ri(10, 99)} ${ri(100, 999)} ${ri(100, 999)}`,
    email: s.name.toLowerCase().replace(/[^a-z ]/g, '').trim().split(' ').slice(-2).join('.') + '@Shule ya Msingi.ac.ke',
    gender: s.name.startsWith('Mr.') ? 'Male' : 'Female',
    qualification: pick(['B.Ed (KU)', 'B.Ed (UoN)', 'M.Ed (KU)', 'Diploma in Education', 'B.Com, CPA-K', 'B.Sc, PGDE']),
    status: 'Active',
  }));

  const classes = CLASS_DEFS.map((c, i) => ({
    ...c,
    classTeacherId: staff[2 + (i % 12)].id,
    capacity: 45,
  }));

  const subjects = SUBJECT_DEFS.map((s) => ({ ...s, teacherIds: staff.filter((t) => t.subjects.includes(s.id)).map((t) => t.id) }));

  // ---- Students ----
  const students = [];
  let adm = 2023001;
  const classSizes = { cls_pp1: 10, cls_g2: 12, cls_g4: 14, cls_g5: 14, cls_g6: 16, cls_g7: 18, cls_g8: 18, cls_g9: 14, cls_g10: 16, cls_g11: 12 };
  const usedNames = new Set();
  for (const c of classes) {
    const n = classSizes[c.id] || 12;
    for (let i = 0; i < n; i++) {
      const gender = rand() > 0.5 ? 'Female' : 'Male';
      let first = pick(gender === 'Female' ? GIRLS : BOYS);
      let surname = pick(SURNAMES);
      let guard = 0;
      while (usedNames.has(`${first} ${surname}`) && guard++ < 20) { first = pick(gender === 'Female' ? GIRLS : BOYS); surname = pick(SURNAMES); }
      usedNames.add(`${first} ${surname}`);
      const ageBase = { 'Pre-Primary': 4, 'Lower Primary': 7, 'Upper Primary': 9 + (c.order - 4), 'Junior School': 12 + (c.order - 7), 'Senior School': 15 + (c.order - 10) }[c.level];
      const stream = c.streams[i % c.streams.length];
      const guardianFirst = pick(gender === 'Female' ? BOYS : GIRLS);
      students.push({
        id: `stu_${adm}`,
        admNo: `ZA/${adm}`,
        firstName: first,
        lastName: surname,
        gender,
        dob: `${2026 - ageBase}-${String(ri(1, 12)).padStart(2, '0')}-${String(ri(1, 28)).padStart(2, '0')}`,
        classId: c.id,
        stream,
        upi: `UPI-${(40000000 + adm).toString()}`,
        nemis: `${ri(1000000, 9999999)}`,
        birthCertNo: `${ri(10000000, 99999999)}`,
        house: pick(HOUSES),
        pathway: c.level === 'Senior School' ? (stream === 'STEM' ? 'STEM' : stream === 'Social Sciences' ? 'Social Sciences' : pick(['STEM', 'Social Sciences'])) : '',
        kpseaScore: ['Junior School', 'Senior School'].includes(c.level) ? ri(18, 40) : null, // out of 40 (5 subjects x 8pts)
        boarding: ['Junior School', 'Senior School'].includes(c.level) ? rand() > 0.45 : false,
        transportRouteId: rand() > 0.55 ? `rte_${ri(1, 4)}` : '',
        county: pick(COUNTIES),
        estate: pick(ESTATES),
        guardian: {
          name: `${rand() > 0.4 ? 'Mr.' : 'Mrs.'} ${guardianFirst} ${surname}`,
          relation: pick(['Father', 'Mother', 'Mother', 'Guardian']),
          phone: `07${ri(10, 99)}${ri(100000, 999999)}`,
          email: `${guardianFirst.toLowerCase()}.${surname.toLowerCase()}@gmail.com`,
        },
        status: 'Active',
        dateAdmitted: `${2026 - ri(0, 3)}-01-${String(ri(5, 20)).padStart(2, '0')}`,
        // hidden learning profile used by the seeder to generate realistic marks
        _ability: clamp(0.25 + rand() * 0.72, 0.1, 0.98),
        _growth: (rand() - 0.35) * 8, // trend per exam
      });
      adm += 1;
    }
  }

  const classOf = (id) => classes.find((c) => c.id === id);
  const subjectsForClass = (cls, pathway) =>
    subjects.filter(
      (s) => s.levels.includes(cls.level) && (!s.pathway || cls.level !== 'Senior School' || s.pathway === pathway || s.pathway === undefined)
    );

  // ---- Exams & Marks ----
  const exams = [
    { id: 'exm_1', name: 'End Term Exam — Term 3 2025', type: 'End-Term', year: 2025, term: 3, grading: 'CBE8', classIds: classes.map((c) => c.id), status: 'Published', date: '2025-11-10' },
    { id: 'exm_2', name: 'Opener Exam — Term 1 2026', type: 'Opener', year: 2026, term: 1, grading: 'CBE8', classIds: classes.map((c) => c.id), status: 'Published', date: '2026-01-19' },
    { id: 'exm_3', name: 'End Term Exam — Term 1 2026', type: 'End-Term', year: 2026, term: 1, grading: 'CBE8', classIds: classes.map((c) => c.id), status: 'Published', date: '2026-03-16' },
    { id: 'exm_4', name: 'Opener Exam — Term 2 2026', type: 'Opener', year: 2026, term: 2, grading: 'CBE8', classIds: classes.map((c) => c.id), status: 'Open', date: '2026-05-04' },
  ];

  const marks = [];
  exams.filter((e) => e.status === 'Published').forEach((exam, ei) => {
    for (const stu of students) {
      const cls = classOf(stu.classId);
      if (cls.level === 'Pre-Primary') continue; // PP assessed via checklists, no % marks
      for (const sub of subjectsForClass(cls, stu.pathway)) {
        const affinitySeed = parseInt(sub.id.replace(/\D/g, '') || sub.id.length * 7, 10);
        const affinity = ((Math.sin(affinitySeed * 13.7 + stu.admNo.length * 3.1 + stu.firstName.length) + 1) / 2) * 0.2 - 0.1;
        const raw = (stu._ability + affinity) * 100 + stu._growth * ei + (rand() - 0.5) * 14;
        marks.push({
          id: `mrk_${exam.id}_${stu.id}_${sub.id}`,
          examId: exam.id,
          studentId: stu.id,
          subjectId: sub.id,
          score: clamp(Math.round(raw), 3, 100),
        });
      }
    }
  });

  // ---- Fees ----
  const FEE_TABLE = {
    'Pre-Primary': [['Tuition', 14500], ['Meals', 6000], ['Activity', 1500], ['Development', 2000]],
    'Lower Primary': [['Tuition', 16500], ['Meals', 7000], ['Activity', 2000], ['Exam & Printing', 1200], ['Development', 2500]],
    'Upper Primary': [['Tuition', 18500], ['Meals', 7500], ['Activity', 2500], ['Exam & Printing', 1500], ['Development', 3000], ['PTA', 500]],
    'Junior School': [['Tuition', 24000], ['Boarding & Meals', 15000], ['Activity', 3000], ['Exam & Printing', 2000], ['PTA', 1000], ['Development', 3500], ['Computer / Lab', 2500]],
    'Senior School': [['Tuition', 29500], ['Boarding & Meals', 17000], ['Activity', 3500], ['Exam & Printing', 2500], ['PTA', 1000], ['Development', 4000], ['Science Practicals', 3000]],
  };
  const feeStructures = [];
  for (const term of [1, 2, 3]) {
    for (const [level, heads] of Object.entries(FEE_TABLE)) {
      feeStructures.push({
        id: `fee_2026_${term}_${level.replace(/[^A-Z]/gi, '')}`,
        year: 2026, term, level,
        voteHeads: heads.map(([name, amount]) => ({ name, amount })),
      });
    }
  }

  const payments = [];
  const MPESA = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  for (const stu of students) {
    const cls = classOf(stu.classId);
    const struct = feeStructures.find((f) => f.year === 2026 && f.term === 1 && f.level === cls.level);
    const billed = struct.voteHeads.reduce((a, v) => a + v.amount, 0);
    const pctPaid = rand() < 0.35 ? 1 : clamp(0.15 + rand() * 0.8, 0.05, 0.97); // ~35% fully paid
    let remaining = Math.round(billed * pctPaid);
    const instalments = remaining > 0 ? ri(1, 3) : 0;
    for (let k = 0; k < instalments && remaining > 0; k++) {
      const amt = k === instalments - 1 ? remaining : Math.round(remaining * (0.3 + rand() * 0.4));
      remaining -= amt;
      const method = rand() > 0.25 ? 'M-Pesa' : pick(['Bank Deposit', 'Cash', 'KCB Mtaani']);
      payments.push({
        id: `pay_${payments.length + 1}`,
        studentId: stu.id,
        amount: amt,
        method,
        ref: method === 'M-Pesa' ? Array.from({ length: 10 }, () => MPESA[ri(0, 35)]).join('') : `RCPT-${1000 + payments.length}`,
        year: 2026, term: 1,
        date: `2026-0${ri(1, 3)}-${String(ri(1, 28)).padStart(2, '0')}`,
        receivedBy: 'Mrs. Sarah Mbugua',
      });
    }
  }

  // ---- Attendance (last 8 school days) ----
  const attendance = [];
  const days = ['2026-03-09', '2026-03-10', '2026-03-11', '2026-03-12', '2026-03-13', '2026-03-16', '2026-03-17', '2026-03-18'];
  for (const date of days) {
    for (const c of classes) {
      for (const stream of c.streams) {
        const records = {};
        students.filter((s) => s.classId === c.id && s.stream === stream).forEach((s) => {
          const r = rand();
          records[s.id] = r < 0.88 ? 'Present' : r < 0.94 ? 'Late' : 'Absent';
        });
        attendance.push({ id: `att_${date}_${c.id}_${stream}`, date, classId: c.id, stream, records, takenBy: staff[2].id });
      }
    }
  }

  // ---- Competency assessments (CBC core competencies, EE=4..BE=1) ----
  const competencies = [];
  for (const stu of students) {
    const ratings = {};
    CORE_COMPETENCIES.forEach((comp, i) => {
      ratings[comp] = clamp(Math.round(stu._ability * 4 + (rand() - 0.5) * 1.6), 1, 4);
    });
    competencies.push({ id: `cmp_${stu.id}_2026_1`, studentId: stu.id, year: 2026, term: 1, ratings });
    delete stu._ability; delete stu._growth;
  }

  // ---- Timetable (auto-generated seed for every class/stream) ----
  const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
  const PERIODS = ['8:00–8:40', '8:40–9:20', '9:40–10:20', '10:20–11:00', '11:20–12:00', '12:00–12:40', '2:00–2:40', '2:40–3:20'];
  const timetable = [];
  for (const c of classes) {
    if (c.level === 'Pre-Primary') continue;
    for (const stream of c.streams) {
      const subs = subjectsForClass(c, stream === 'STEM' ? 'STEM' : 'Social Sciences');
      const slots = [];
      DAYS.forEach((day, di) => {
        PERIODS.forEach((_, pi) => {
          const sub = subs[(di * 3 + pi) % subs.length];
          const teacher = staff.find((t) => t.subjects.includes(sub.id));
          slots.push({ day, period: pi + 1, subjectId: sub.id, teacherId: teacher ? teacher.id : '' });
        });
      });
      timetable.push({ id: `tt_${c.id}_${stream}`, classId: c.id, stream, slots });
    }
  }

  // ---- Assignments / Learning tasks ----
  const assignments = [
    { id: 'asg_1', title: 'Fractions of a Whole — Practice Sheet', subjectId: 'sub_mat', classId: 'cls_g6', strand: 'Numbers', subStrand: 'Fractions', description: 'Complete questions 1–15 from the workbook. Show all working.', dueDate: '2026-03-20', totalMarks: 20, type: 'Homework' },
    { id: 'asg_2', title: 'Insha: Safari Yangu ya Likizo', subjectId: 'sub_kis', classId: 'cls_g7', strand: 'Kuandika', subStrand: 'Insha ya Kubuni', description: 'Andika insha ya maneno 300 kuhusu safari uliyoifanya wakati wa likizo.', dueDate: '2026-03-22', totalMarks: 20, type: 'Classwork' },
    { id: 'asg_3', title: 'Simple Electric Circuit Project', subjectId: 'sub_intsci', classId: 'cls_g8', strand: 'Force & Energy', subStrand: 'Electricity', description: 'In groups, build a working circuit with a switch and two bulbs. Present findings on Friday.', dueDate: '2026-03-27', totalMarks: 30, type: 'Project' },
    { id: 'asg_4', title: 'Comprehension: "The Greedy Hyena"', subjectId: 'sub_eng', classId: 'cls_g4', strand: 'Reading', subStrand: 'Comprehension', description: 'Read the passage on page 42 and answer all questions in full sentences.', dueDate: '2026-03-19', totalMarks: 15, type: 'Homework' },
    { id: 'asg_5', title: 'Mole Concept Problem Set', subjectId: 'sub_che', classId: 'cls_g10', strand: 'Mole Concept', subStrand: 'Stoichiometry', description: 'Attempt all 10 problems. Remember to include units and R.A.M values.', dueDate: '2026-03-24', totalMarks: 25, type: 'Homework' },
    { id: 'asg_6', title: 'Vegetable Garden Records', subjectId: 'sub_agr_p', classId: 'cls_g7', strand: 'Gardening Practices', subStrand: 'Crop Production', description: 'Record germination rates for your kale (sukuma wiki) seedlings over two weeks.', dueDate: '2026-04-01', totalMarks: 20, type: 'Project' },
  ];

  // ---- Library ----
  const books = [
    ['Kamusi ya Karne ya 21', 'Longhorn Publishers', 'Kiswahili', 25],
    ['The River and the Source', 'Margaret Ogola', 'Literature', 18],
    ['Primary Mathematics Grade 6', 'KLB', 'Mathematics', 60],
    ['Integrated Science Grade 8', 'Oxford University Press', 'Science', 45],
    ['Fasihi Simulizi', 'Wallah bin Wallah', 'Kiswahili', 20],
    ['A Grain of Wheat', 'Ngugi wa Thiong\'o', 'Literature', 12],
    ['Secondary Biology Form 3', 'KLB', 'Science', 30],
    ['Kenya Secondary Atlas', 'Macmillan', 'Geography', 40],
    ['Skills in English Grade 9', 'Longhorn Publishers', 'English', 50],
    ['Broken Monkeys & Other Stories', 'Kithaka wa Mberia', 'Literature', 8],
  ].map(([title, author, category, copies], i) => ({
    id: `bok_${i + 1}`, title, author, category, copies,
    accessionNo: `LIB/${1000 + i * 7}`,
    issued: rand() > 0.4 ? [{ studentId: students[ri(10, students.length - 1)].id, issueDate: '2026-03-10', dueDate: '2026-03-24' }] : [],
  }));

  // ---- Transport ----
  const routes = [
    { id: 'rte_1', name: 'Route 1 — Githurai / Zimmerman', vehicle: 'Isuzu NQR — KDC 456B', driver: 'Mr. Faith Waweru', driverPhone: '0722 111 222', capacity: 33, stops: ['Githurai 44', 'Zimmerman', 'Roysambu', 'TRM'] },
    { id: 'rte_2', name: 'Route 2 — Kahawa West / Sukari', vehicle: 'Toyota Coaster — KDK 789C', driver: 'Ms. Grace Njoki', driverPhone: '0733 444 555', capacity: 29, stops: ['Kahawa West', 'Kamae', 'Kahawa Sukari', 'KU Gate'] },
    { id: 'rte_3', name: 'Route 3 — Ruiru Town / Kimbo', vehicle: 'Isuzu FRR — KCW 234D', driver: 'Mr. John Kamau', driverPhone: '0711 777 888', capacity: 37, stops: ['Ruiru Town', 'Rainbow', 'Kimbo', 'Matangi'] },
    { id: 'rte_4', name: 'Route 4 — Juja / Witeithie', vehicle: 'Nissan Civilian — KDL 567E', driver: 'Mr. Paul Onyango', driverPhone: '0700 999 000', capacity: 26, stops: ['Juja Stage', 'JKUAT Gate', 'Witeithie', 'Ndarugu'] },
  ];

  // ---- Discipline ----
  const discipline = [
    { id: 'dsc_1', studentId: students[30].id, date: '2026-02-12', category: 'Punctuality', description: 'Reported late to school three times this week.', action: 'Verbal warning; parent notified via SMS.', recordedBy: 'Mr. Peter Ochieng', status: 'Closed' },
    { id: 'dsc_2', studentId: students[55].id, date: '2026-02-25', category: 'Conduct', description: 'Noise making during evening preps.', action: 'Counselling session with class teacher.', recordedBy: 'Ms. Faith Chepkirui', status: 'Closed' },
    { id: 'dsc_3', studentId: students[72].id, date: '2026-03-05', category: 'Uniform', description: 'Came without proper school uniform.', action: 'Parent to provide uniform by Monday.', recordedBy: 'Mr. Collins Kiprop', status: 'Open' },
  ];

  // ---- Events / Announcements / Messages ----
  const events = [
    { id: 'evt_1', title: 'Inter-House Athletics Championships', date: '2026-03-27', time: '9:00 AM', venue: 'School Field', category: 'Sports', description: 'Simba, Twiga, Tembo and Kifaru battle for the championship trophy. Parents are welcome.' },
    { id: 'evt_2', title: 'Grade 9 KJSEA Prayer & Briefing Day', date: '2026-04-10', time: '10:00 AM', venue: 'Main Hall', category: 'Academics', description: 'Career guidance and pathway selection briefing for Grade 9 parents ahead of Senior School placement.' },
    { id: 'evt_3', title: 'Term 1 Closing Day & Report Collection', date: '2026-04-02', time: '8:00 AM', venue: 'Whole School', category: 'Administration', description: 'Parents to collect report forms and discuss learner progress with class teachers.' },
    { id: 'evt_4', title: 'County Music Festivals — Sub-County Level', date: '2026-05-15', time: '8:00 AM', venue: 'Ruiru Stadium', category: 'Co-curricular', description: 'School choir and elocution teams to represent the school. Wishing them success!' },
    { id: 'evt_5', title: 'Science & Engineering Fair (KSEF)', date: '2026-05-22', time: '9:00 AM', venue: 'Science Block', category: 'Academics', description: 'Junior School innovations showcase. Winning projects proceed to county level.' },
  ];

  const announcements = [
    { id: 'ann_1', title: 'KPSEA & KJSEA Registration Ongoing', body: 'Parents of Grade 6 and Grade 9 learners are requested to confirm candidate details (assessment numbers & birth certificates) at the school office before 30th March.', audience: 'Grade 6 & 9 Parents', date: '2026-03-15', by: 'Mrs. Grace Nyokabi' },
    { id: 'ann_2', title: 'New M-Pesa Paybill for Fees', body: 'Fees should now be paid via M-Pesa Paybill 400200, Account = Learner Admission Number. Cash payments at the office will no longer be accepted from Term 2.', audience: 'All Parents', date: '2026-03-10', by: 'Mrs. Sarah Mbugua' },
  ];

  const messages = [
    { id: 'msg_1', channel: 'SMS', audience: 'All Parents', body: 'Dear Parent, Term 1 closes on 2nd April. Report forms will be issued on closing day. - Shule ya Msingi Academy', recipients: students.length, date: '2026-03-16', by: 'Ms. Judith Awino', status: 'Delivered' },
    { id: 'msg_2', channel: 'SMS', audience: 'Fee Defaulters', body: 'Reminder: Kindly clear Term 1 fee balance before closing day. Paybill 400200, A/c = Admission No. Thank you.', recipients: 38, date: '2026-03-12', by: 'Mrs. Sarah Mbugua', status: 'Delivered' },
  ];

  // ---- Users (login accounts) ----
  const demoStudent = students.find((s) => s.classId === 'cls_g7') || students[0];
  const users = [
    { id: 'usr_admin', name: 'Grace Nyokabi', email: 'admin@Shule ya Msingi.ac.ke', password: 'admin123', role: 'Admin' },
    { id: 'usr_teacher', name: 'Faith Chepkirui', email: 'teacher@Shule ya Msingi.ac.ke', password: 'teacher123', role: 'Teacher' },
    { id: 'usr_accountant', name: 'Sarah Mbugua', email: 'accounts@Shule ya Msingi.ac.ke', password: 'accounts123', role: 'Accountant' },
    { id: 'usr_parent', name: demoStudent.guardian.name, email: 'parent@Shule ya Msingi.ac.ke', password: 'parent123', role: 'Parent', studentId: demoStudent.id },
    { id: 'usr_student', name: `${demoStudent.firstName} ${demoStudent.lastName}`, email: 'student@Shule ya Msingi.ac.ke', password: 'student123', role: 'Student', studentId: demoStudent.id },
  ];

  return {
    settings, users, staff, classes, subjects, students, exams, marks,
    feeStructures, payments, attendance, competencies, timetable,
    assignments, books, routes, discipline, events, announcements, messages,
    meta: { days: DAYS, periods: PERIODS },
  };
}

module.exports = { buildSeed };
