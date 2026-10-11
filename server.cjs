const path = require("node:path");
const fs = require("node:fs");
const express = require("express");
const Database = require("better-sqlite3");

const DB_PATH = process.env.DB_PATH || path.join(__dirname, "data", "kinoderrn.sqlite");
fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });

const db = new Database(DB_PATH);
db.pragma("journal_mode = WAL");
db.exec(fs.readFileSync(path.join(__dirname, "schema.sql"), "utf8"));

function cleanInitials(v) {
  if (typeof v !== "string") return null;
  const t = v.trim().toUpperCase().slice(0, 3);
  return /^[A-Z]{1,3}$/.test(t) ? t.padEnd(3, "A") : null;
}

function cleanInt(v, min, max) {
  const n = Number(v);
  if (!Number.isInteger(n) || n < min || n > max) return null;
  return n;
}

const app = express();
app.use(express.json());

const api = express.Router();

api.get("/scores", (req, res) => {
  const limit = cleanInt(req.query.limit, 1, 100) || 10;
  const rows = db
    .prepare("SELECT initials, score, wave, created_at FROM scores ORDER BY score DESC, created_at ASC LIMIT ?")
    .all(limit);
  res.json({ scores: rows });
});

const MAX_SCORES = 100;

const insertAndPrune = db.transaction((initials, score, wave) => {
  db.prepare("INSERT INTO scores (initials, score, wave) VALUES (?, ?, ?)").run(initials, score, wave);

  // Local, bounded file — only the top 100 ever persist.
  db.prepare(
    `DELETE FROM scores WHERE id NOT IN (
       SELECT id FROM scores ORDER BY score DESC, created_at ASC LIMIT ?
     )`
  ).run(MAX_SCORES);

  const rank = db.prepare("SELECT COUNT(*) + 1 AS rank FROM scores WHERE score > ?").get(score).rank;
  const madeTop100 = db.prepare("SELECT 1 FROM scores WHERE score = ? LIMIT 1").get(score) !== undefined;
  return { rank, madeTop100 };
});

api.post("/scores", (req, res) => {
  const initials = cleanInitials(req.body && req.body.initials);
  const score = cleanInt(req.body && req.body.score, 0, 1000000);
  const wave = cleanInt(req.body && req.body.wave, 0, 10000);

  if (initials === null || score === null || wave === null) {
    return res.status(400).json({ error: "invalid payload" });
  }

  const { rank, madeTop100 } = insertAndPrune(initials, score, wave);
  res.status(201).json({ ok: true, rank, madeTop100 });
});

app.use("/api", api);
app.use(express.static(path.join(__dirname, "public")));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`KinoDerRN listening on :${PORT}`);
});
