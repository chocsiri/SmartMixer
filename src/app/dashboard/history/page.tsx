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

/* ===================== TYPES ===================== */
type Task = {
  id: number;
  date: string;
  time: string;
  name: string;
  ecTarget: string;
  status: "pending" | "running" | "done";
};

/* ===================== PAGE ===================== */
export default function MainProcessPage() {
  const router = useRouter();
  const pathname = usePathname();

  const [tasks, setTasks] = useState<Task[]>([]);
  const [open, setOpen] = useState(false);

  const [schedule, setSchedule] = useState<any[]>([]);
  

  useEffect(() => {
    const data = JSON.parse(localStorage.getItem("smartmixer_schedule") || "[]");
    setSchedule(data);
  }, []);

    const [form, setForm] = useState({
    date: new Date().toISOString().slice(0, 10),
    time: "09:00",
    name: "",
    ec: 1.0,
    ph: 6.0,
  });

  /* ================= FETCH DATA ================= */
  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    try {
      const res = await fetch("http://localhost:5000/main-process");
      const data = await res.json();
      setTasks(data);
    } catch (err) {
      console.error("Fetch main process error:", err);
    }
  };

  /* ================= ADD TASK ================= */
  const addTask = async () => {
    if (!form.name) return;

    try {
      const res = await fetch("http://localhost:5000/main-process", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date: form.date,
          time: form.time,
          name: form.name,
          ecTarget: form.ec.toString(),
          status: "pending",
        }),
      });

      const data = await res.json();

      if (data.success) {
        await fetchTasks();
        setOpen(false);
        setForm({ ...form, name: "" });
      }
    } catch (err) {
      console.error("Add task error:", err);
    }
  };

  /* ================= DELETE TASK ================= */
  const deleteTask = async (id: number) => {
    try {
      await fetch(`http://localhost:5000/main-process/${id}`, {
        method: "DELETE",
      });
      fetchTasks();
    } catch (err) {
      console.error("Delete error:", err);
    }
  };

  /* ================= UPDATE STATUS ================= */
  const updateStatus = async (id: number, status: string) => {
    try {
      await fetch(`http://localhost:5000/main-process/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      fetchTasks();
    } catch (err) {
      console.error("Update status error:", err);
    }
  };

  return (
    <div className="flex min-h-screen bg-[#F4F7FE]">
      {/* ================= SIDEBAR ================= */}
      <aside className="w-64 bg-white px-6 py-6 flex flex-col">
              <h1 className="mt-4 text-[32px] font-bold text-[#1E2A69]">
                SMART<span className="text-[#05CD99]">MIXER</span>
              </h1>
      
              <nav className="space-y-2 mt-8">
                <SidebarItem label="แดชบอร์ด" icon={<FaChartPie />} href="/dashboard" active={pathname === "/dashboard"} />
                <SidebarItem label="ตารางงานหลัก" icon={<FaListAlt />} href="/dashboard/MainProcess" active={pathname === "/dashboard/MainProcess"} />
                <SidebarItem label="จัดการสูตรพืช" icon={<FaSeedling />} href="/dashboard/Formula" active={pathname === "/dashboard/Formula"} />
                <SidebarItem label="ประวัติย้อนหลัง" icon={<FaHistory />} href="/dashboard/history" active={pathname === "/dashboard/history"} />
              </nav>
      
              <div className="mt-auto">
                <button
                  onClick={() => router.replace("/")}
                  className="flex items-center gap-3 text-red-500 hover:bg-red-50 px-4 py-3 rounded-xl w-full"
                >
                  <FaSignOutAlt /> ออกจากระบบ
                </button>
              </div>
            </aside>

      {/* ================= MAIN ================= */}
      <main className="flex-1 p-8">
        <div className="flex justify-between mb-6">
          <h2 className="text-3xl font-bold text-blue-900 ml-5 mb-2 mt-5">
            ตารางงานหลัก (Main Process)
          </h2>


        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm mt-6 hover:shadow-md hover:-translate-y-0.5 transition duration-300">
          <div className="flex justify-between items-start mb-6">
          <div>
              <h3 className="font-bold text-blue-900 text-xl">
                📋 ตารางงานหลัก (Main Process)
              </h3>
              <p className="text-sm text-slate-400 mt-1 mb-6">
                เครื่องจะทำงานตามรายการนี้ตามลำดับเวลา (สามารถ 1 วันทำหลายรอบได้)
              </p>
            </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setOpen(true)}
                  className="w-[120px] h-[44px] bg-emerald-500 hover:bg-emerald-600 text-white px-5 py-2 rounded-xl text-sm font-medium hover:shadow-md hover:-translate-y-1 transition duration-300"
                >
                  ＋ เพิ่มงาน
                </button>

                <button
                  onClick={() => setTasks([])}
                  className="w-[120px] h-[44px] border-2 border-red-400 text-red-500 px-5 py-2 rounded-xl text-[14px] font-medium hover:bg-red-500 hover:text-white hover:shadow-md hover:-translate-y-1 transition duration-300"
                >
                  🗑 ล้างตาราง
                </button>
              </div>
            </div>

          <table className="w-full text-sm">
            <thead className="border-b text-slate-400">
              <tr>
                <th className="text-left py-3">วันที่ (Date)</th>
                <th className="text-left py-3">เวลา (Time)</th>
                <th className="text-left py-3">งาน/สูตร (Task Name)</th>
                <th className="text-left py-3">EC / pH</th>
                <th className="text-left py-3">สถานะ</th>
                <th className="text-left py-3">จัดการ (Custom)</th>
              </tr>
            </thead>

            <tbody>
              {tasks.length === 0 && (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-slate-400">
                    ยังไม่มีรายการ
                  </td>
                </tr>
              )}

              {tasks.map((task) => (
                <tr key={task.id} className="border-b">
                  <td className="py-3">{task.date}</td>
                  <td>{task.time}</td>
                  <td>{task.name}</td>
                  <td>{task.ecTarget}</td>
                  <td>
                    <span className="px-3 py-1 rounded-full bg-yellow-100 text-yellow-700 text-xs">
                      {task.status.toUpperCase()}
                    </span>
                  </td>
                  <td className="space-x-3">
                    <button
                      onClick={() => updateStatus(task.id, "running")}
                      className="text-blue-500 text-xs"
                    >
                      RUN
                    </button>
                    <button
                      onClick={() => updateStatus(task.id, "done")}
                      className="text-emerald-500 text-xs"
                    >
                      DONE
                    </button>
                    <button
                      onClick={() => deleteTask(task.id)}
                      className="text-red-500 text-xs"
                    >
                      ลบ
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* ================= MODAL ================= */}
        {open && (
          <div className="fixed inset-0 bg-black/30 flex items-center justify-center">
            <div className="bg-white rounded-[28px] w-full max-w-[560px] px-10 py-9 animate-popIn shadow-[0_25px_70px_rgba(0,0,0,0.15)]">
              <h3 className="text-center font-semibold text-[22px] text-[#1E2A69] mb-8">
                เพิ่มงานใหม่ (Manual Add)
              </h3>
          <div className="grid grid-cols-2 gap-5 mb-5">
            <div>
              <label className="text-sm font-medium text-[#1E2A69] block mb-2">
                วันที่
              </label>
              <input
                type="date"
                value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
                className="w-full h-[52px] px-4 rounded-xl border border-[#E3E8F2]
                bg-[#F7F9FC] text-slate-700
                focus:outline-none focus:ring-2 focus:ring-emerald-400"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-[#1E2A69] block mb-2">
                เวลา
              </label>
              <input
                type="time"
                value={form.time}
                onChange={(e) => setForm({ ...form, time: e.target.value })}
                className="w-full h-[52px] px-4 rounded-xl border border-[#E3E8F2]
                bg-[#F7F9FC]
                focus:outline-none focus:ring-2 focus:ring-emerald-400"
              />
            </div>
          </div>
            <div className="mb-5">
              <label className="text-sm font-medium text-[#1E2A69] block mb-2">
                ชื่องาน
              </label>
              <input
                placeholder="เช่น รดน้ำรอบพิเศษ"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full h-[52px] px-4 rounded-xl border border-[#E3E8F2]
                bg-[#F7F9FC]
                focus:outline-none focus:ring-2 focus:ring-emerald-400"
              />
            </div>

          <div className="grid grid-cols-2 gap-5 mb-8">
            <div>
              <label className="text-sm font-medium text-[#1E2A69] block mb-2">
                Target EC
              </label>
                <input
                  type="number"
                  step="0.1"
                  value={form.ec}
                  onChange={(e) => setForm({ ...form, ec: +e.target.value })}
                  className="w-full h-[52px] px-4 rounded-xl border border-[#E3E8F2]
                  bg-[#F7F9FC]
                  focus:outline-none focus:ring-2 focus:ring-emerald-400"
                  />
                </div>

              <div>
                <label className="text-sm font-medium text-[#1E2A69] block mb-2">
                  Target pH
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={form.ph}
                  onChange={(e) => setForm({ ...form, ph: +e.target.value })}
                  className="w-full h-[52px] px-4 rounded-xl border border-[#E3E8F2]
                  bg-[#F7F9FC]
                  focus:outline-none focus:ring-2 focus:ring-emerald-400"
                />
              </div>
          </div>

              <div className="flex gap-4">
                <button
                  onClick={() => setOpen(false)}
                  className="flex-1 h-[54px] rounded-xl bg-[#EEF1F7]
                  text-slate-500 font-medium
                  hover:bg-slate-200 transition
                  hover:scale-[1.02] hover:shadow-lg"
                >
                  ยกเลิก
                </button>

                <button
                  onClick={addTask}
                  className="flex-1 h-[54px] rounded-xl text-white font-medium
                  bg-gradient-to-r from-[#59C173] to-[#2D9B73]
                  hover:scale-[1.02] hover:shadow-lg
                  transition-all duration-200"
                >
                  เพิ่มงาน
                </button>
              </div>
            </div>
          </div>
          
        )}
      </main>
    </div>
  );
}

/* ================= SIDEBAR ================= */
function SidebarItem({ label, icon, href, active = false }: any) {
  const router = useRouter();
  return (
    <button
      onClick={() => router.push(href)}
      className={`flex items-center gap-3 w-full px-5 py-4 rounded-xl ${
        active ? "bg-[#05CD99] text-white" : "text-slate-500 hover:bg-slate-100"
      }`}
    >
      {icon}
      {label}
    </button>
  );
}