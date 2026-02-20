const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const http = require("http");
const dayjs = require("dayjs");

const db = require("./db");

const app = express();
app.use(cors());
app.use(bodyParser.json());

const server = http.createServer(app);

/* ================= HEALTH CHECK ================= */
app.get("/", (req, res) => {
  res.send("SMART MIXER BACKEND ONLINE");
});

/* =====================================================
   =================== FORMULA =========================
   ===================================================== */

/* ✅ GET ALL FORMULA (พร้อม stages + times) */
app.get("/api/formula", (req, res) => {
  db.all(`SELECT * FROM formula ORDER BY id DESC`, [], (err, formulas) => {
    if (err) return res.status(500).json({ error: err.message });

    if (!formulas.length) return res.json([]);

    const result = [];

    formulas.forEach((formula) => {
      db.all(
        `SELECT * FROM formula_stages WHERE formula_id = ?`,
        [formula.id],
        (err, stages) => {
          if (err) return res.status(500).json({ error: err.message });

          if (!stages.length) {
            result.push({
              id: formula.id,
              recipeName: formula.name,
              totalDays: formula.totalDays,
              stages: [],
            });

            if (result.length === formulas.length)
              return res.json(result);

            return;
          }

          const stagePromises = stages.map(
            (stage) =>
              new Promise((resolve) => {
                db.all(
                  `SELECT * FROM stage_times WHERE stage_id = ?`,
                  [stage.id],
                  (err, times) => {
                    resolve({
                      ...stage,
                      times: times || [],
                    });
                  }
                );
              })
          );

          Promise.all(stagePromises).then((fullStages) => {
            result.push({
              id: formula.id,
              recipeName: formula.name,
              totalDays: formula.totalDays,
              stages: fullStages,
            });

            if (result.length === formulas.length)
              res.json(result);
          });
        }
      );
    });
  });
});

/* ✅ CREATE FORMULA */
app.post("/api/formula", (req, res) => {
  const { recipeName, stages } = req.body;

  if (!recipeName || !Array.isArray(stages)) {
    return res.status(400).json({ success: false });
  }

  const totalDays = Math.max(...stages.map((s) => Number(s.endDay || 0)));

  db.run(
    `INSERT INTO formula (name, totalDays) VALUES (?, ?)`,
    [recipeName, totalDays],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });

      const formulaId = this.lastID;

      stages.forEach((stage) => {
        db.run(
          `INSERT INTO formula_stages (formula_id, startDay, endDay)
           VALUES (?, ?, ?)`,
          [formulaId, stage.startDay, stage.endDay],
          function (err) {
            if (err) return;

            const stageId = this.lastID;

            if (Array.isArray(stage.times)) {
              stage.times.forEach((t) => {
                db.run(
                  `INSERT INTO stage_times (stage_id, time, ec, ph)
                   VALUES (?, ?, ?, ?)`,
                  [stageId, t.time, t.ec, t.ph]
                );
              });
            }
          }
        );
      });

      res.json({ success: true });
    }
  );
});

/* ✅ DELETE FORMULA */
app.delete("/api/formula/:id", (req, res) => {
  db.run(
    `DELETE FROM formula WHERE id = ?`,
    [req.params.id],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ success: true });
    }
  );
});

/* =====================================================
   =============== MAIN PROCESS ========================
   ===================================================== */

/* ✅ GET ALL JOBS */
app.get("/api/main-process", (req, res) => {
  db.all(
    `
    SELECT 
      id,
      task_name AS name,
      date,
      time,
      ec AS ecTarget,
      ph AS phTarget,
      LOWER(status) AS status
    FROM main_process_jobs
    ORDER BY date ASC, time ASC
    `,
    [],
    (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(rows);
    }
  );
});

/* ✅ ADD JOB MANUAL */
app.post("/api/main-process", (req, res) => {
  const { date, time, name, ecTarget, phTarget, status } = req.body;

  if (!date || !time || !name) {
    return res.status(400).json({ error: "Missing fields" });
  }

  db.run(
    `
    INSERT INTO main_process_jobs
    (task_name, date, time, ec, ph, status)
    VALUES (?, ?, ?, ?, ?, ?)
    `,
    [
      name,
      date,
      time,
      ecTarget || 0,
      phTarget || 0,
      status ? status.toUpperCase() : "PENDING",
    ],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ success: true, id: this.lastID });
    }
  );
});

/* ✅ GENERATE FROM FORMULA */
app.post("/api/main-process/generate", (req, res) => {
  const { formulaId, startDate } = req.body;

  if (!formulaId || !startDate)
    return res.status(400).json({ error: "Missing data" });

  db.all(
    `
    SELECT fs.startDay, fs.endDay, st.time, st.ec, st.ph
    FROM formula_stages fs
    JOIN stage_times st ON fs.id = st.stage_id
    WHERE fs.formula_id = ?
    `,
    [formulaId],
    (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });

      rows.forEach((row) => {
        for (let day = row.startDay; day <= row.endDay; day++) {
          const realDate = dayjs(startDate)
            .add(day - 1, "day")
            .format("YYYY-MM-DD");

          db.run(
            `
            INSERT INTO main_process_jobs
            (task_name, date, time, ec, ph, status)
            VALUES (?, ?, ?, ?, ?, ?)
            `,
            [
              `Day ${day}`,
              realDate,
              row.time,
              row.ec,
              row.ph,
              "PENDING",
            ]
          );
        }
      });

      res.json({ success: true });
    }
  );
});

/* ✅ UPDATE STATUS */
app.put("/api/main-process/:id", (req, res) => {
  const { status } = req.body;

  if (!status)
    return res.status(400).json({ error: "Missing status" });

  db.run(
    `
    UPDATE main_process_jobs
    SET status = ?
    WHERE id = ?
    `,
    [status.toUpperCase(), req.params.id],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ success: true });
    }
  );
});

/* ✅ DELETE JOB */
app.delete("/api/main-process/:id", (req, res) => {
  db.run(
    `DELETE FROM main_process_jobs WHERE id = ?`,
    [req.params.id],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ success: true });
    }
  );
});

/* ================= START SERVER ================= */

const PORT = 5000;

server.listen(PORT, () => {
  console.log(`🚀 Backend running on port ${PORT}`);
});

// ===== DELETE ALL TASK =====
app.delete("/api/main-process/:id", (req, res) => {
  tasks = []; // เคลียร์ array ใน memory
  console.log("🗑 Clear all tasks");
  res.json({ success: true });
});
