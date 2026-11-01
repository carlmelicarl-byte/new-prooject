# 🇰🇪 Elimu360 School Suite

A complete school management system built for the **Kenyan Competency Based Curriculum (CBC/CBE)** — inspired by **Zeraki** (Analytics, Finance & Learning) with unique extras like an **at-risk learner early-warning engine** and **grade prediction**.

Demo school: **Shule ya Msingi Academy, Ruiru (Kiambu)** — 144 learners from PP1 to Grade 11, pre-loaded with marks, fees, attendance and more.

## 🚀 Quick Start

```bash
npm run setup    # install root, server & client dependencies
npm run dev      # start API (port 4000) + web app (port 5173)
```

Open **http://localhost:5173** and sign in with a one-click demo account:

| Role | Email | Password |
|------|-------|----------|
| Principal / Admin | admin@Shule ya Msingi.ac.ke | admin123 |
| Teacher | teacher@Shule ya Msingi.ac.ke | teacher123 |
| Bursar / Accounts | accounts@Shule ya Msingi.ac.ke | accounts123 |
| Parent | parent@Shule ya Msingi.ac.ke | parent123 |

To wipe data back to the original demo school: `npm run reset-data` then restart the server.

## 📚 Kenyan Curriculum Coverage

- **Structure 2-6-3-3-3**: Pre-Primary (PP1–2) → Lower Primary (G1–3) → Upper Primary (G4–6) → Junior School (G7–9) → Senior School (G10–12)
- **National assessments**: KPSEA (Grade 6) & KJSEA (Grade 9) readiness, Senior School pathways — **STEM, Social Sciences, Arts & Sports Science**
- **Three grading engines** (choose per exam):
  - **CBC 4-level rubrics** — EE / ME / AE / BE (School-Based Assessment)
  - **CBE 8-band** — EE1…BE2 with 1–8 points (as used in KPSEA/KJSEA)
  - **KCSE 12-point** — A…E for legacy 8-4-4 classes
- **7 CBC Core Competencies** + national values tracking on every report form
- **NEMIS numbers, UPI, birth certificates, TSC numbers, KNEC centre code**
- Learning areas with **KICD strands** for every level

## 🧩 Modules

| Module | Highlights |
|--------|-----------|
| **Dashboard** | Enrolment, performance trend, fee collection, top learners, events |
| **Learners** | Full admission records, guardians, houses, transport, boarding; rich learner profile |
| **Staff** | TSC numbers, designations, subject allocation |
| **Academics** | Classes & streams, learning areas, CBC framework explorer |
| **Exams & Marks** | Spreadsheet-style marks entry with live grade chips, publish/un-publish |
| **Analytics** *(Zeraki-style)* | Merit lists, subject analysis, grade distribution, stream & gender comparison, most-improved (deviation) |
| **Report Forms** | Printable reports: descriptors, positions, competencies, auto-generated teacher/principal remarks, fee balance, term dates |
| **Finance** *(Zeraki-Finance-style)* | Vote-head fee structures per level/term, M-Pesa payments & receipts, balances, defaulter SMS |
| **Attendance** | Daily class registers, school trend chart, absentee guardian SMS |
| **Timetable** | **Auto-generation** + click-to-edit lessons, printable |
| **CBC Learning** | Assignments/projects by strand & sub-strand, strand explorer, competency rubric assessment with radar chart |
| **✨ Learner Insights** *(unique)* | Early-warning risk score (grades + attendance + fees), next-grade prediction, trend sparklines, one-click interventions |
| **SMS & Notices** | Bulk SMS to audiences (all/class/defaulters/boarders), templates, delivery log, announcements |
| **Operations** | Library issue/return, school-bus routes, positive-discipline casebook, school calendar |
| **Parent Portal** | Child's progress chart, results, fees + M-Pesa instructions, assignments, downloadable report |
| **Settings** | School profile, term dates, grading reference, role-based user accounts |

## 🏗️ Tech Stack

- **Frontend**: React 18 + Vite + Tailwind CSS 4 + Recharts + React Router
- **Backend**: Node.js + Express REST API with token auth & role guards
- **Data**: zero-config JSON datastore (`server/data/db.json`), seeded with a realistic Kenyan school on first run

## 🗂️ Project Structure

```
server/   index.js (API) • grading.js (CBC/CBE/KCSE engines) • seed.js • db.js
client/   src/pages/* (16 modules) • src/components/* • src/lib/*
```
