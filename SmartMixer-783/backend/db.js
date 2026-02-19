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

  // 🔥 ถ้า column temperature ยังไม่มี ให้เพิ่ม
  db.run(`
    ALTER TABLE sensor_log ADD COLUMN temperature REAL
  `, (err) => {
    if (err && !err.message.includes("duplicate column")) {
      console.error("❌ Add temperature column error:", err.message);
    }
  });

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

  // ===== MAIN PROCESS JOBS =====
  db.run(`
    CREATE TABLE IF NOT EXISTS main_process_jobs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date TEXT,
      time TEXT,
      name TEXT,
      ecTarget TEXT,
      status TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // ===== FORMULA =====
  db.run(`
    CREATE TABLE IF NOT EXISTS formula (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT,
      ecTarget TEXT,
      status TEXT,
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
      ecTarget TEXT,
      status TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

});

module.exports = db;
