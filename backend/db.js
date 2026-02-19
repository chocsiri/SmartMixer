const sqlite3 = require("sqlite3").verbose();
const path = require("path");

// ================= DB INIT =================
const dbPath = path.join(__dirname, "smart_mixer.db");
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error("❌ Database connection error:", err.message);
  } else {
    console.log("✅ Connected to SQLite database");
  }
});

// เปิด foreign key support
db.run("PRAGMA foreign_keys = ON");


// ================= CREATE TABLE =================
db.serialize(() => {

  // ===== SENSOR LOG =====
  db.run(`
    CREATE TABLE IF NOT EXISTS sensor_log (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      ec REAL,
      ph REAL,
      flow REAL,
      waterLevel REAL,
      temperature REAL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // ===== SYSTEM STATUS =====
  db.run(`
    CREATE TABLE IF NOT EXISTS system_status (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      mode TEXT,
      pumpA INTEGER,
      pumpB INTEGER,
      pumpPhUp INTEGER,
      pumpPhDown INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // ===== MANUAL COMMAND =====
  db.run(`
    CREATE TABLE IF NOT EXISTS manual_command (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      pumpA INTEGER,
      pumpB INTEGER,
      pumpPhUp INTEGER,
      pumpPhDown INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // ===== FORMULA =====
  db.run(`
    CREATE TABLE IF NOT EXISTS formula (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      totalDays INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // ===== FORMULA STAGES =====
  db.run(`
    CREATE TABLE IF NOT EXISTS formula_stages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      formula_id INTEGER,
      startDay INTEGER,
      endDay INTEGER,
      FOREIGN KEY(formula_id) REFERENCES formula(id) ON DELETE CASCADE
    )
  `);

  // ===== STAGE TIMES =====
  db.run(`
    CREATE TABLE IF NOT EXISTS stage_times (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      stage_id INTEGER,
      time TEXT,
      ec REAL,
      ph REAL,
      FOREIGN KEY(stage_id) REFERENCES formula_stages(id) ON DELETE CASCADE
    )
  `);

  // ===== MAIN PROCESS JOBS =====
  db.run(`
    CREATE TABLE IF NOT EXISTS main_process_jobs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      task_name TEXT,
      date TEXT,
      time TEXT,
      ec REAL,
      ph REAL,
      status TEXT DEFAULT 'PENDING',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // ===== HISTORY =====
  db.run(`
    CREATE TABLE IF NOT EXISTS history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date TEXT,
      time TEXT,
      name TEXT,
      ec REAL,
      ph REAL,
      status TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

});

module.exports = db;
