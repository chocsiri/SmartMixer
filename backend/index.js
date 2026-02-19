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

// ✅ GET ALL FORMULA
app.get("/api/formula", (req, res) => {
  db.all(
    `SELECT * FROM formula ORDER BY id DESC`,
    [],
    (err, rows) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ error: err.message });
      }
      res.json(rows);
    }
  );
});

// ✅ CREATE FORMULA + STAGES + TIMES
app.post("/api/formula", (req, res) => {
  const { recipeName, stages } = req.body;

  if (!recipeName || !Array.isArray(stages)) {
    return res.status(400).json({ success: false });
  }

  const totalDays = Math.max(
    ...stages.map((s) => Number(s.endDay || 0))
  );

  db.run(
    `INSERT INTO formula (name, totalDays)
     VALUES (?, ?)`,
    [recipeName, totalDays],
    function (err) {
      if (err) {
        console.error("Insert formula error:", err);
        return res.status(500).json({ error: err.message });
      }

      const formulaId = this.lastID;

      stages.forEach((stage) => {
        db.run(
          `INSERT INTO formula_stages (formula_id, startDay, endDay)
           VALUES (?, ?, ?)`,
          [formulaId, stage.startDay, stage.endDay],
          function (err) {
            if (err) {
              console.error("Insert stage error:", err);
              return;
            }

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

// ✅ DELETE FORMULA (cascade จะลบ stage/time ให้เอง)
app.delete("/api/formula/:id", (req, res) => {
  db.run(
    `DELETE FROM formula WHERE id = ?`,
    [req.params.id],
    function (err) {
      if (err) {
        console.error(err);
        return res.status(500).json({ error: err.message });
      }
      res.json({ success: true });
    }
  );
});


/* =====================================================
   =============== MAIN PROCESS ========================
   ===================================================== */

// ✅ GET ALL JOBS
app.get("/api/main-process", (req, res) => {
  db.all(
    `SELECT * FROM main_process_jobs ORDER BY date ASC, time ASC`,
    [],
    (err, rows) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ error: err.message });
      }
      res.json(rows);
    }
  );
});

// ✅ GENERATE FROM FORMULA
app.post("/api/main-process/generate", (req, res) => {
  const { formulaId, startDate } = req.body;

  if (!formulaId || !startDate) {
    return res.status(400).json({ error: "Missing data" });
  }

  db.all(
    `
    SELECT fs.startDay, fs.endDay, st.time, st.ec, st.ph
    FROM formula_stages fs
    JOIN stage_times st ON fs.id = st.stage_id
    WHERE fs.formula_id = ?
    `,
    [formulaId],
    (err, rows) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ error: err.message });
      }

      if (!rows.length) {
        return res.status(400).json({ error: "No stages found" });
      }

      rows.forEach((row) => {
        for (let day = row.startDay; day <= row.endDay; day++) {

          const realDate = dayjs(startDate)
            .add(day - 1, "day")
            .format("YYYY-MM-DD");

          db.run(
            `INSERT INTO main_process_jobs
             (task_name, date, time, ec, ph, status)
             VALUES (?, ?, ?, ?, ?, ?)`,
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

// ✅ DELETE JOB
app.delete("/api/main-process/:id", (req, res) => {
  db.run(
    `DELETE FROM main_process_jobs WHERE id = ?`,
    [req.params.id],
    function (err) {
      if (err) {
        console.error(err);
        return res.status(500).json({ error: err.message });
      }
      res.json({ success: true });
    }
  );
});


/* ================= START SERVER ================= */

const PORT = 5000;

server.listen(PORT, () => {
  console.log(`🚀 Backend running on port ${PORT}`);
});
