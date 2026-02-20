"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import {
  FaChartPie,
  FaListAlt,
  FaSeedling,
  FaHistory,
  FaSignOutAlt,
} from "react-icons/fa";
import {
  LightningIcon,
  DeviceIcon,
  TempIcon,
  WaterIcon,
  PumpAIcon,
  PhUpIcon,
  PhDownIcon,
  FanIcon,
} from "@/src/app/components/icons";

/* ===================== TYPES ===================== */
type SensorData = {
  ec?: number;
  ph?: number;
  temperature?: number;
};

type DeviceState = {
  pumpA: boolean;
  pumpB: boolean;
  phUp: boolean;
  phDown: boolean;
  checkEC: boolean;
};

type TankUsage = {
  used: number;
  max: number;
};

type MainProcessJob = {
  id: string;
  date: string;
  time: string;
  name: string;
  ecTarget: string;
  status: "pending" | "running" | "done";
};

/* ===================== PAGE ===================== */
export default function DashboardPage() {
  const router = useRouter();
  const pathname = usePathname();

  const [mode, setMode] = useState<"AUTO" | "MANUAL">("AUTO");
  const [isRunning, setIsRunning] = useState(false);

  const [devices, setDevices] = useState<DeviceState>({
    pumpA: false,
    pumpB: false,
    phUp: false,
    phDown: false,
    checkEC: false,
  });

  const [usage, setUsage] = useState<Record<string, TankUsage | undefined>>({
    A: undefined,
    B: undefined,
    acid: undefined,
    mix: undefined,
  });

  const [mainProcessJobs, setMainProcessJobs] = useState<MainProcessJob[]>([]);

  const todayJobs = mainProcessJobs.filter(
    (job) => job.date === new Date().toISOString().slice(0, 10)
  );

  const [confirmManual, setConfirmManual] = useState(false);
  const [pendingDevice, setPendingDevice] =
    useState<keyof DeviceState | null>(null);
  const [emergencyAlert, setEmergencyAlert] = useState(false);

  const [sensor, setSensor] = useState<SensorData>({
    ec: undefined,
    ph: undefined,
    temperature: undefined,
  });

  /* ===================== FETCH DATA (เพิ่มส่วนนี้) ===================== */
  useEffect(() => {
    const fetchAll = async () => {
      try {
        // SENSOR
        const sensorRes = await fetch(
          "http://localhost:5000/sensor/latest",
          { cache: "no-store" }
        );
        const sensorData = await sensorRes.json();
        setSensor(sensorData);

        // MAIN PROCESS
        const jobRes = await fetch(
          "http://localhost:5000/main-process",
          { cache: "no-store" }
        );
        const jobData = await jobRes.json();
        setMainProcessJobs(jobData);

        // TANK USAGE
        const tankRes = await fetch(
          "http://localhost:5000/tank/usage",
          { cache: "no-store" }
        );
        const tankData = await tankRes.json();
        setUsage(tankData);
        // DEVICE STATUS
        const deviceRes = await fetch(
          "http://localhost:5000/device/status",
          { cache: "no-store" }
        );
        const deviceData = await deviceRes.json();

        setMode(deviceData.mode);
        setDevices({
          pumpA: deviceData.pumpA,
          pumpB: deviceData.pumpB,
          phUp: deviceData.pumpPhUp,
          phDown: deviceData.pumpPhDown,
          checkEC: false,
});

      } catch (err) {
        console.error("Dashboard fetch error:", err);
      }
    };

    fetchAll();
    const interval = setInterval(fetchAll, 5000);
    return () => clearInterval(interval);
  }, []);
  /* ===================== END FETCH ===================== */

  useEffect(() => {
    if (localStorage.getItem("isLogin") !== "true") {
      router.replace("/");
    }
  }, [router]);

  const toggleDevice = (key: keyof DeviceState) => {
  if (mode === "AUTO") {
    setPendingDevice(key);
    setConfirmManual(true);
    return;
  }

  setDevices((prev) => {
    const updated = { ...prev, [key]: !prev[key] };

    // 🔥 ส่งไป backend
    sendCommandToBackend(updated);

    return updated;
  });
};


  const confirmManualMode = () => {
    setMode("MANUAL");
    if (pendingDevice) {
      setDevices((prev) => ({ ...prev, [pendingDevice]: true }));
    }
    setConfirmManual(false);
  };

  const emergencyStop = async () => {
  if (!isRunning) {
    setEmergencyAlert(true);
    return;
  }

  setIsRunning(false);
  await stopProcess();
};

  /* ===================== BACKEND CONTROL ===================== */

const sendCommandToBackend = async (updatedDevices: DeviceState) => {
  try {
    await fetch("http://localhost:5000/command", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        pumpA: updatedDevices.pumpA,
        pumpB: updatedDevices.pumpB,
        pumpPhUp: updatedDevices.phUp,
        pumpPhDown: updatedDevices.phDown,
      }),
    });
  } catch (err) {
    console.error("Command error:", err);
  }
};

const changeModeBackend = async (newMode: "AUTO" | "MANUAL") => {
  try {
    await fetch("http://localhost:5000/mode", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mode: newMode }),
    });
  } catch (err) {
    console.error("Mode error:", err);
  }
};

const startProcess = async () => {
  await fetch("http://localhost:5000/process/start", {
    method: "POST",
  });
};

const stopProcess = async () => {
  await fetch("http://localhost:5000/process/stop", {
    method: "POST",
  });
};

  /* ===================== UI ===================== */
  return (
<div className="flex min-h-screen bg-[#F4F7FE]">
      {/* Sidebar */}
      <aside className="w-64 bg-white px-6 py-6 flex flex-col">
        <div className="mb-8">
          <h1 className="mt-4 text-[32px] font-bold text-[#1E2A69]">
            SMART<span className="text-[#05CD99]">MIXER</span>
          </h1>
        </div>

        <nav className="space-y-2">
          <SidebarItem
            label="แดชบอร์ด"
            icon={<FaChartPie />}
            href="/dashboard"
            active={pathname === "/dashboard"}
          />

          <SidebarItem
            label="ตารางงานหลัก"
            icon={<FaListAlt />}
            href="/dashboard/MainProcess"
            active={pathname === "/dashboard/MainProcess"}
          />

          <SidebarItem
            label="จัดการสูตรพืช"
            icon={<FaSeedling />}
            href="/dashboard/Formula"
            active={pathname === "/dashboard/Formula"}
          />

          <SidebarItem
            label="ประวัติย้อนหลัง"
            icon={<FaHistory />}
            href="/dashboard/history"
            active={pathname === "/dashboard/history"}
          />
        </nav>

          <div className="mt-auto">
            <button
              onClick={() => {
                localStorage.removeItem("isLogin");
                router.replace("/");
              }}
              className="flex items-center gap-3 text-red-500 hover:bg-red-50 px-4 py-3 rounded-xl w-full"
            >
              <FaSignOutAlt /> ออกจากระบบ
            </button>
          </div>
        </aside>

      {/* ========== MAIN ========== */}
      <main className="flex-1 p-8 space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <h2 className="text-3xl font-bold text-blue-900 ml-5 mb-2 mt-5">ภาพรวมระบบ</h2>
          <span
            className={`px-4 py-1 rounded-full text-sm ${
              isRunning
                ? "bg-emerald-50 text-emerald-600"
                : "bg-red-50 text-red-600"
            }`}
          >
            ● {isRunning ? "Online" : "Offline"}
          </span>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <StatCard
            title="ค่าปุ๋ย (EC)"
            value={sensor.ec}
            unit="mS/cm"
            icon={<LightningIcon className="w-7 h-7 text-[#05CD99]" />}
            iconBg="bg-[#E9FAF5]"
          />

          <StatCard
            title="ค่า pH"
            value={sensor.ph}
            icon={<WaterIcon className="w-7 h-7 text-[#0400ff]" />}
            iconBg="bg-[#EAE6FF]"
          />

          <StatCard
            title="อุณหภูมิ"
            value={sensor.temperature}
            unit="°C"
            icon={<TempIcon className="w-7 h-7 text-[#FFCE20]" />}
            iconBg="bg-[#FFF7E6]"
          />

          <StatCard
            title="สถานะ"
            value={mode}
            icon={<DeviceIcon className="w-7 h-7 text-[#EE5D50]" />}
            iconBg="bg-[#FEEFEE]"
          />
        </div>

        {/* Device Control */}
        <Card>
          <div className="flex justify-between mb-4">
            <h1 className="font-semibold text-blue-900 text-xl">🎛️ แผงควบคุมอุปกรณ์ (Device Control)</h1>
            <div className="flex bg-slate-100 rounded-full p-1 w-max h-[40px]">
  {["AUTO", "MANUAL"].map((m) => {
    const active = mode === m;

    return (
      <button
        key={m}
        onClick={() => {
          setMode(m as "AUTO" | "MANUAL");
          changeModeBackend(m as "AUTO" | "MANUAL");
        }}
        className={`
          px-4 py-1 rounded-full text-sm font-medium
          transition-all duration-300
          ${
            active && m === "AUTO"
              ? "bg-emerald-500 text-white shadow"
              : active && m === "MANUAL"
              ? "bg-yellow-400 text-slate-800 shadow"
              : "text-slate-500"
          }
        `}
                    >
                      {m}
                    </button>
                  );
                })}
              </div>
          </div>

          <div className="grid md:grid-cols-5 gap-4">
              <Device
                label="ปั๊ม A"
                icon={<PumpAIcon className="w-9 h-9" />}
                on={devices.pumpA}
                onClick={() => toggleDevice("pumpA")}
              />

              <Device
                label="ปั๊ม B"
                icon={<PumpAIcon className="w-9 h-9" />}
                on={devices.pumpB}
                onClick={() => toggleDevice("pumpB")}
              />

              <Device
                label="pH Up"
                icon={<PhUpIcon className="w-9 h-9" />}
                on={devices.phUp}
                onClick={() => toggleDevice("phUp")}
              />

              <Device
                label="pH Down"
                icon={<PhDownIcon className="w-9 h-9" />}
                on={devices.phDown}
                onClick={() => toggleDevice("phDown")}
              />

              <Device
                label="เช็คค่าปุ๋ย"
                icon={<FanIcon className="w-9 h-9" />}
                on={devices.checkEC}
                onClick={() => toggleDevice("checkEC")}
              />
            </div>
        </Card>

        {/* Queue */}
        <Card>
          <div className="flex justify-between items-center mb-7">
            <h1 className="font-semibold text-blue-900 text-xl">
              📅 งานที่ต้องทำวันนี้ (Today's Queue)
            </h1>

            <button
              onClick={() => router.push("/dashboard/MainProcess")}
              className="
                px-4 py-2
                rounded-lg
                text-sm
                font-medium
                transition-all duration-200
                bg-[var(--background-today)]
                text-[var(--primary-color)]
              "
            >
              ดูตารางทั้งหมด
            </button>
          </div>

          <table className="w-full text-sm">
            <thead className="text-slate-400 border-b">
              <tr>
                <th className="text-left py-2">เวลา</th>
                <th className="text-left py-2">งาน</th>
                <th className="text-left py-2">EC เป้าหมาย</th>
                <th className="text-left py-2">สถานะ</th>
              </tr>
            </thead>

            <tbody>
              {todayJobs.length === 0 && (
                <tr>
                  <td
                    colSpan={4}
                    className="text-center py-6 text-slate-400"
                  >
                    ไม่มีงานสำหรับวันนี้
                  </td>
                </tr>
              )}

              {todayJobs.map((job) => (
                <tr key={job.id} className="border-b last:border-b-0">
                  <td className="py-3">{job.time}</td>
                  <td>{job.name}</td>
                  <td>{job.ecTarget}</td>
                  <td>
                    <span
                      className={`px-3 py-1 rounded-full text-xs
                        ${
                          job.status === "pending"
                            ? "bg-yellow-100 text-yellow-700"
                            : job.status === "running"
                            ? "bg-blue-100 text-blue-700"
                            : "bg-emerald-100 text-emerald-700"
                        }`}
                    >
                      {job.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>


        {/* Tanks */}
        <div className="grid md:grid-cols-4 gap-6">
          <Tank label="ปุ๋ย A" data={usage.A} color="bg-orange-400" />
          <Tank label="ปุ๋ย B" data={usage.B} color="bg-yellow-400" />
          <Tank label="กรด" data={usage.acid} color="bg-purple-500" />
          <Tank label="ถังผสม" data={usage.mix} color="bg-blue-500" />
        </div>

        {/* Control Buttons */}
        <div className="flex justify-end gap-4">
          <button
            onClick={emergencyStop}
            className="border border-red-500 text-red-500 bg-white px-6 py-3 rounded-xl hover:bg-red-500 hover:text-white hover:shadow-md hover:-translate-y-1 transition duration-300"
          >
            ■ หยุดฉุกเฉิน
          </button>
          <button
            onClick={async () => {
              setIsRunning(true);
              await startProcess();
            }}
            className="bg-emerald-500 text-white px-6 py-3 rounded-xl hover:bg-emerald-600 hover:shadow-md hover:-translate-y-1 transition duration-300"
          >
            ▶ เริ่มทำงาน
          </button>
        </div>
      </main>

      {/* ===== MODALS ===== */}
      {confirmManual && (
        <Modal
          title="เปลี่ยนเป็นโหมด Manual?"
          desc="ระบบอยู่ในโหมด Auto คุณต้องการเปลี่ยนเป็น Manual เพื่อควบคุมอุปกรณ์เองหรือไม่?"
          onConfirm={confirmManualMode}
          onCancel={() => setConfirmManual(false)}
        />
      )}

      {emergencyAlert && (
        <InfoModal
          title="ระบบไม่ได้ทำงาน"
          desc="ไม่มีการทำงานให้หยุด"
          onClose={() => setEmergencyAlert(false)}
        />
      )}
    </div>
  );
}

/* ===================== COMPONENTS ===================== */

  function SidebarItem({
  label,
  icon,
  href,
  active = false,
}: {
  label: string;
  icon: React.ReactNode;
  href: string;
  active?: boolean;
}) {
  const router = useRouter();

  return (
    <button
      onClick={() => router.push(href)}
      className={`flex items-center gap-3 w-full
        px-5 py-4 rounded-xl text-[16px] font-medium
        transition-all duration-200 transform hover:-translate-y-0.5
        ${
          active
            ? "bg-[#05CD99] text-white shadow"
            : "text-slate-500 hover:bg-slate-100"
        }`}
    >
      <span className="text-lg">{icon}</span>
      <span>{label}</span>
    </button>
  );
}

function Card({ children }: any) {
  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-md hover:-translate-y-1 transition duration-300">
      {children}
    </div>
  );
}


function StatCard({
  title,
  value,
  unit,
  icon,
  iconBg = "bg-slate-100",
}: {
  title: string;
  value?: number | string;
  unit?: string;
  icon: React.ReactNode;
  iconBg?: string;
}) {
  const isEmpty = value === undefined || value === null;

  return (
    <div
      className={`
        rounded-2xl p-5 h-[170px]
        flex flex-col justify-between
        transition-all duration-300
        ${
          isEmpty
            ? "bg-white shadow-sm hover:shadow-md hover:-translate-y-1"
            : "bg-white shadow-sm hover:shadow-md hover:-translate-y-1"
        }
      `}
    >
      {/* Top Row */}
      <div className="flex items-center justify-between">
        <span className="text-sm text-slate-400 font-medium">
          {title}
        </span>

        {/* Icon Box */}
        <div
          className={`
            w-11 h-11 flex items-center justify-center
            rounded-xl
            transition-all duration-300
            ${iconBg}
            ${!isEmpty && "group-hover:scale-110"}
          `}
        >
          {icon}
        </div>
      </div>

      {/* Value */}
      <div
        className={`
          text-3xl font-bold
          ${isEmpty ? "text-slate-300" : "text-blue-900"}
        `}
      >
        {isEmpty ? "--" : value}
        {unit && !isEmpty && (
          <span className="text-base ml-1 text-slate-400">{unit}</span>
        )}
      </div>
    </div>
  );
}

function Device({
  label,
  on,
  onClick,
  icon,
}: {
  label: string;
  on: boolean;
  onClick: () => void;
  icon: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`
        h-37 w-full
        border-2 rounded-xl p-4 text-center
        flex flex-col items-center justify-center
        transition-all duration-300
        hover:-translate-y-1 hover:shadow-md
        ${on ? "border-emerald-500" : "border-slate-200"}
      `}
    >
      {/* ICON */}
      <div
        className={`
          text-3xl mb-2 transition-all duration-300
          ${on ? "text-emerald-500 scale-110" : "text-slate-400"}
        `}
      >
        {icon}
      </div>
      {/* LABEL */}
      <div className={`font-medium ${on ? "text-emerald-600" : "text-slate-500"}`}>
        {label}
      </div>
      {/* STATUS */}
      <div className={`text-xs font-semibold ${on ? "text-emerald-600" : "text-slate-400"}`}>
        {on ? "ON" : "OFF"}
      </div>
    </button>
  );
}

function Tank({
  label,
  data,
  color,
}: {
  label: string;
  data?: TankUsage;
  color: string;
}) {
  const isEmpty = !data;

  const percent = data ? (data.used / data.max) * 100 : 0;

  return (
    <div className="bg-white rounded-2xl p-4 text-center shadow-sm hover:shadow-md hover:-translate-y-1 transition duration-300">
      {/* Tank Visual */}
      <div className="relative h-36 w-12 mx-auto bg-slate-100 rounded-full overflow-hidden">
        {/* น้ำ (Fill จากล่างขึ้นบน) */}
        <div
            className={`
              absolute bottom-0 left-0 w-full
              transition-all duration-700 ease-out
              ${color}
              before:absolute before:inset-0
              before:bg-white/20 before:animate-pulse
            `}
            style={{ height: `${percent}%` }}
          />
        </div>

      {/* Label */}
      <div className="mt-3 font-medium text-slate-700">
        {label}
      </div>

      {/* Value */}
      <div className="text-xs text-slate-400">
        {isEmpty ? "-- / -- ml" : `${data.used} / ${data.max} ml`}
      </div>
    </div>
  );
}

function Modal({ title, desc, onConfirm, onCancel }: any) {
  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center">
      <div className="bg-white rounded-xl w-[500px] h-[400px] p-[40px] animate-popIn shadow-[0_20px_60px_rgba(0,0,0,0.2)] text-center">
        <h3 className="font-bold mb-2 text-3xl">{title}</h3>
        <p className="text-slate-500 mb-4 text-xm">{desc}</p>
        <div className="flex gap-3">
          <button onClick={onConfirm} className="bg-yellow-400 text-white flex-1 py-2 rounded-lg hover:shadow-md hover:bg-yellow-500">
            ใช่, เปลี่ยนโหมด
          </button>
          <button onClick={onCancel} className="bg-red-500 text-white flex-1 py-2 rounded-lg hover:shadow-md hover:bg-red-600">
            ยกเลิก
          </button>
        </div>
      </div>
    </div>
  );
}

function InfoModal({ title, desc, onClose }: any) {
  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center">
      <div className="bg-white rounded-xl p-6 w-[360px] text-center">
        <h3 className="font-bold mb-2">{title}</h3>
        <p className="text-slate-500 mb-4">{desc}</p>
        <button onClick={onClose} className="bg-indigo-500 text-white px-6 py-2 rounded-lg">
          OK
        </button>
      </div>
    </div>
  );
}
