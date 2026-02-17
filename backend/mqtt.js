const mqtt = require("mqtt");
const config = require("./config");
const state = require("./state");
const db = require("./db");
const socket = require("./socket");

const client = mqtt.connect("mqtt://localhost:1883", {
  clientId: "backend_server",
  clean: true,
  reconnectPeriod: 2000,
  connectTimeout: 5000,
  keepalive: 30,
});

client.on("connect", () => {
  console.log("✅ MQTT Connected");

  client.subscribe("sensor/data", { qos: 1 });
  client.subscribe("system/status", { qos: 1 });

  publishConfig();
});

client.on("error", (err) => {
  console.error("❌ MQTT Error:", err.message);
});

client.on("message", (topic, message) => {
  let data;
  try {
    data = JSON.parse(message.toString());
  } catch {
    return;
  }

  // ================= SENSOR DATA =================
  if (topic === "sensor/data") {
    state.ec = data.ec ?? state.ec;
    state.ph = data.ph ?? state.ph;
    state.flow = data.flow ?? state.flow;
    state.waterLevel = data.waterLevel ?? state.waterLevel;
    state.temperature = data.temperature ?? state.temperature;
    state.lastUpdate = new Date();

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

    // 🔥 realtime to frontend
    if (socket.io) {
      socket.io.emit("sensor-update", state);
    }
  }

  // ================= SYSTEM STATUS =================
  if (topic === "system/status") {
  state.mode = data.mode;
  state.pumpA = data.pumpA;
  state.pumpB = data.pumpB;
  state.pumpPhUp = data.pumpPhUp;
  state.pumpPhDown = data.pumpPhDown;

  socket.io.emit("device-update", {
    mode: state.mode,
    pumpA: state.pumpA,
    pumpB: state.pumpB,
    pumpPhUp: state.pumpPhUp,
    pumpPhDown: state.pumpPhDown,
  }


    );

    if (socket.io) {
      socket.io.emit("device-update", state);
    }
  }
});

// ================= SEND CONFIG =================
function publishConfig() {
  if (!client.connected) return;

  client.publish(
    "system/config",
    JSON.stringify(config),
    { qos: 1, retain: true }
  );
}

// ================= SEND COMMAND =================
function sendCommand(cmd) {
  if (!client.connected) return;

  client.publish(
    "system/command",
    JSON.stringify(cmd),
    { qos: 1 }
  );

  console.log("📤 Command sent:", cmd);
}

module.exports = {
  publishConfig,
  sendCommand,
};
