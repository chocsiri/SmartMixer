const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const http = require("http");

const config = require("./config");
const state = require("./state");
const db = require("./db");

const app = express();
app.use(cors());
app.use(bodyParser.json());

/* ================= CREATE SERVER ================= */
const server = http.createServer(app);

/* ================= INIT SOCKET ================= */
const socket = require("./socket");
socket.init(server);

/* ================= INIT MQTT ================= */
const mqtt = require("./mqtt");

/* ================= HEALTH CHECK ================= */
app.get("/", (req, res) => {
  res.send("SMART MIXER BACKEND ONLINE");
});

/* ================= STATUS ================= */
app.get("/status", (req, res) => {
  const now = Date.now();
  const offline = !state.lastUpdate || now - state.lastUpdate > 10000;

  res.json({
    config,
    state,
    offline,
  });
});

/* ================= DEVICE STATUS ================= */
app.get("/device/status", (req, res) => {
  res.json({
    mode: state.mode,
    pumpA: state.pumpA,
    pumpB: state.pumpB,
    pumpPhUp: state.pumpPhUp,
    pumpPhDown: state.pumpPhDown,
  });
});


/* ================= START / STOP PROCESS ================= */
app.post("/process/start", (req, res) => {
  mqtt.sendCommand({ start: true });
  res.json({ success: true });
});

app.post("/process/stop", (req, res) => {
  mqtt.sendCommand({ stop: true });
  res.json({ success: true });
});

/* ================= SENSOR POST ================= */
app.post("/sensor", (req, res) => {
  const { ec, ph, temperature, flow, waterLevel } = req.body;

  const ecVal = Number(ec);
  const phVal = Number(ph);

  if (isNaN(ecVal) || isNaN(phVal)) {
    return res.status(400).json({ success: false });
  }

  state.ec = ecVal;
  state.ph = phVal;
  state.temperature = Number(temperature) || state.temperature;
  state.flow = Number(flow) || state.flow;
  state.waterLevel = Number(waterLevel) || state.waterLevel;
  state.lastUpdate = Date.now();

  db.run(
    `INSERT INTO sensor_log (ec, ph, flow, waterLevel, temperature)
     VALUES (?,?,?,?,?)`,
    [
      state.ec,
      state.ph,
      state.flow,
      state.waterLevel,
      state.temperature,
    ]
  );

  res.json({ success: true });
});

/* ================= SENSOR LATEST ================= */
app.get("/sensor/latest", (req, res) => {
  db.get(
    `SELECT ec, ph, temperature, flow, waterLevel, created_at
     FROM sensor_log
     ORDER BY id DESC
     LIMIT 1`,
    [],
    (err, row) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(row || {});
    }
  );
});

/* ================= HISTORY ================= */
app.get("/history", (req, res) => {
  db.all(
    `SELECT id, created_at, ec, ph, flow, waterLevel, temperature
     FROM sensor_log
     ORDER BY id DESC`,
    [],
    (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(rows);
    }
  );
});

/* ================= MODE ================= */
app.post("/mode", (req, res) => {
  const { mode } = req.body;

  if (!["AUTO", "MANUAL"].includes(mode)) {
    return res.status(400).json({ success: false });
  }

  config.mode = mode;
  mqtt.publishConfig();

  res.json({ success: true, mode });
});

/* ================= CONFIG ================= */
app.post("/config", (req, res) => {
  Object.assign(config, req.body);
  mqtt.publishConfig();
  res.json({ success: true });
});

/* ================= COMMAND ================= */
app.post("/command", (req, res) => {
  mqtt.sendCommand(req.body);

  const { pumpA, pumpB, pumpPhUp, pumpPhDown } = req.body;

  db.run(
    `INSERT INTO manual_command
     (pumpA, pumpB, pumpPhUp, pumpPhDown)
     VALUES (?,?,?,?)`,
    [
      pumpA ? 1 : 0,
      pumpB ? 1 : 0,
      pumpPhUp ? 1 : 0,
      pumpPhDown ? 1 : 0,
    ]
  );

  res.json({ success: true });
});

/* ================= MAIN PROCESS ================= */
app.get("/main-process", (req, res) => {
  db.all(
    `SELECT * FROM main_process_jobs ORDER BY date, time`,
    (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(rows);
    }
  );
});

app.post("/main-process", (req, res) => {
  const { date, time, name, ecTarget, status } = req.body;

  db.run(
    `INSERT INTO main_process_jobs (date, time, name, ecTarget, status)
     VALUES (?,?,?,?,?)`,
    [date, time, name, ecTarget || "", status || "pending"],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ success: true, id: this.lastID });
    }
  );
});

app.put("/main-process/:id", (req, res) => {
  db.run(
    `UPDATE main_process_jobs SET status = ? WHERE id = ?`,
    [req.body.status, req.params.id],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ success: true });
    }
  );
});

app.delete("/main-process/:id", (req, res) => {
  db.run(
    `DELETE FROM main_process_jobs WHERE id = ?`,
    [req.params.id],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ success: true });
    }
  );
});

/* ================= FORMULA ================= */
app.get("/formula", (req, res) => {
  db.all(`SELECT * FROM formula ORDER BY created_at DESC`, (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

app.post("/formula", (req, res) => {
  const { name, ecTarget } = req.body;

  db.run(
    `INSERT INTO formula (name, ecTarget, status)
     VALUES (?,?,?)`,
    [name, ecTarget, "active"],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ success: true, id: this.lastID });
    }
  );
});

/* ================= ERROR PROTECTION ================= */
process.on("uncaughtException", console.error);
process.on("unhandledRejection", console.error);

/* ================= START SERVER ================= */
const PORT = 5000;

server.listen(PORT, () => {
  console.log(`🚀 Backend running on port ${PORT}`);
});
