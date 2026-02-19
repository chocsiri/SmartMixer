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
  phTarget?: string;
  status: "pending" | "running" | "done";
};

/* ===================== PAGE ===================== */
export default function MainProcessPage() {
  const router = useRouter();
  const pathname = usePathname();

  const [tasks, setTasks] = useState<Task[]>([]);
  const [open, setOpen] = useState(false);

  // 🔥 เพิ่ม state สำหรับรายละเอียด
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

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
      const res = await fetch("http://localhost:5000/api/main-process");
      if (!res.ok) throw new Error("Fetch failed");
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
      const res = await fetch("http://localhost:5000/api/main-process", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date: form.date,
          time: form.time,
          name: form.name,
          ecTarget: form.ec,
          phTarget: form.ph,
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
      await fetch(`http://localhost:5000/api/main-process/${id}`, {
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
      await fetch(`http://localhost:5000/api/main-process/${id}`, {
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
        <h2 className="text-3xl font-bold text-blue-900 ml-5 mt-5">
          ตารางงานหลัก (Main Process)
        </h2>

        <div className="bg-white rounded-2xl p-6 shadow-sm mt-6">
          <div className="flex justify-between mb-6">
            <button
              onClick={() => setOpen(true)}
              className="bg-emerald-500 text-white px-5 py-2 rounded-xl"
            >
              ＋ เพิ่มงาน
            </button>
          </div>

          <table className="w-full text-sm">
            <thead className="border-b text-slate-400">
              <tr>
                <th className="text-left py-3">วันที่</th>
                <th className="text-left py-3">เวลา</th>
                <th className="text-left py-3">งาน</th>
                <th className="text-left py-3">EC / pH</th>
                <th className="text-left py-3">สถานะ</th>
                <th className="text-left py-3">จัดการ</th>
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
                  <td>{task.ecTarget} / {task.phTarget || "-"}</td>
                  <td>
                    <span className="px-3 py-1 rounded-full bg-yellow-100 text-yellow-700 text-xs">
                      {task.status.toUpperCase()}
                    </span>
                  </td>
                  <td className="space-x-3">
                    <button
                      onClick={() => {
                        setSelectedTask(task);
                        setDetailOpen(true);
                      }}
                      className="text-gray-600 text-xs"
                    >
                      👁
                    </button>

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

        {/* ================= ADD MODAL ================= */}
        {open && (
          <div className="fixed inset-0 bg-black/30 flex items-center justify-center">
            <div className="bg-white rounded-2xl w-full max-w-[500px] p-8">
              <h3 className="text-center font-semibold mb-6">
                เพิ่มงานใหม่
              </h3>

              <input type="date" value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
                className="w-full mb-3 border p-2 rounded" />

              <input type="time" value={form.time}
                onChange={(e) => setForm({ ...form, time: e.target.value })}
                className="w-full mb-3 border p-2 rounded" />

              <input placeholder="ชื่องาน"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full mb-3 border p-2 rounded" />

              <input type="number" step="0.1"
                value={form.ec}
                onChange={(e) => setForm({ ...form, ec: +e.target.value })}
                className="w-full mb-3 border p-2 rounded" />

              <input type="number" step="0.1"
                value={form.ph}
                onChange={(e) => setForm({ ...form, ph: +e.target.value })}
                className="w-full mb-5 border p-2 rounded" />

              <div className="flex gap-4">
                <button onClick={() => setOpen(false)}
                  className="flex-1 bg-gray-200 p-2 rounded">
                  ยกเลิก
                </button>

                <button onClick={addTask}
                  className="flex-1 bg-emerald-500 text-white p-2 rounded">
                  เพิ่มงาน
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ================= DETAIL MODAL ================= */}
        {detailOpen && selectedTask && (
          <div className="fixed inset-0 bg-black/30 flex items-center justify-center">
            <div className="bg-white rounded-2xl w-full max-w-[500px] p-8">
              <h3 className="text-xl font-semibold text-center mb-6">
                รายละเอียดงาน
              </h3>

              <div className="space-y-3 text-sm">
                <div><b>วันที่:</b> {selectedTask.date}</div>
                <div><b>เวลา:</b> {selectedTask.time}</div>
                <div><b>ชื่องาน:</b> {selectedTask.name}</div>
                <div><b>EC:</b> {selectedTask.ecTarget}</div>
                <div><b>pH:</b> {selectedTask.phTarget || "-"}</div>
                <div><b>สถานะ:</b> {selectedTask.status.toUpperCase()}</div>
              </div>

              <button
                onClick={() => setDetailOpen(false)}
                className="mt-6 w-full bg-gray-200 p-2 rounded"
              >
                ปิด
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

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
