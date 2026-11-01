/**
 * Tiny persistent JSON data store (zero native deps).
 * Data lives in server/data/db.json and is seeded on first run.
 */
const fs = require('fs');
const path = require('path');
const { buildSeed } = require('./seed');

const DATA_DIR = path.join(__dirname, 'data');
const DB_FILE = path.join(DATA_DIR, 'db.json');

let state = null;
let saveTimer = null;

function load() {
  if (state) return state;
  try {
    if (fs.existsSync(DB_FILE)) {
      state = JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
      return state;
    }
  } catch (e) {
    console.error('Failed to read db.json, reseeding:', e.message);
  }
  state = buildSeed();
  saveNow();
  return state;
}

function saveNow() {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.writeFileSync(DB_FILE, JSON.stringify(state, null, 2));
}

function save() {
  clearTimeout(saveTimer);
  saveTimer = setTimeout(saveNow, 150);
}

let counter = Date.now() % 100000;
function uid(prefix = 'id') {
  counter += 1;
  return `${prefix}_${counter.toString(36)}${Math.random().toString(36).slice(2, 7)}`;
}

function collection(name) {
  const db = load();
  if (!Array.isArray(db[name])) db[name] = [];
  return db[name];
}

const db = {
  all: (name) => collection(name),
  get: (name, id) => collection(name).find((r) => String(r.id) === String(id)),
  find: (name, fn) => collection(name).filter(fn),
  insert: (name, rec) => {
    const r = { id: rec.id || uid(name.slice(0, 4)), ...rec };
    collection(name).push(r);
    save();
    return r;
  },
  update: (name, id, patch) => {
    const r = db.get(name, id);
    if (!r) return null;
    Object.assign(r, patch, { id: r.id });
    save();
    return r;
  },
  remove: (name, id) => {
    const rows = collection(name);
    const idx = rows.findIndex((r) => String(r.id) === String(id));
    if (idx === -1) return false;
    rows.splice(idx, 1);
    save();
    return true;
  },
  settings: () => load().settings,
  setSettings: (patch) => {
    Object.assign(load().settings, patch);
    save();
    return load().settings;
  },
  raw: load,
};

module.exports = { db, uid };
