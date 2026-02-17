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

  const [form, setForm] = useState({
    date: new Date().toISOString().slice(0, 10),
    time: "09:00",
    name: "",
    ec: 1.0,
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
        <h1 className="text-2xl font-bold mb-6">
          SMART<span className="text-emerald-500">MIXER</span>
        </h1>

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

        <button
          onClick={() => router.replace("/")}
          className="mt-auto flex items-center gap-2 text-red-500"
        >
          <FaSignOutAlt /> ออกจากระบบ
        </button>
      </aside>

      {/* ================= MAIN ================= */}
      <main className="flex-1 p-8">
        <div className="flex justify-between mb-6">
          <h2 className="text-2xl font-bold text-blue-900">
            ตารางงานหลัก (Main Process)
          </h2>

          <button
            onClick={() => setOpen(true)}
            className="bg-emerald-500 text-white px-5 py-2 rounded-xl"
          >
            ＋ เพิ่มงาน
          </button>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <table className="w-full text-sm">
            <thead className="border-b text-slate-400">
              <tr>
                <th className="text-left py-3">วันที่</th>
                <th className="text-left py-3">เวลา</th>
                <th className="text-left py-3">งาน</th>
                <th className="text-left py-3">EC</th>
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
            <div className="bg-white rounded-xl p-6 w-[400px]">
              <h3 className="font-bold mb-4">เพิ่มงานใหม่</h3>

              <input
                type="date"
                value={form.date}
                onChange={(e) =>
                  setForm({ ...form, date: e.target.value })
                }
                className="w-full mb-3 border p-2 rounded"
              />

              <input
                type="time"
                value={form.time}
                onChange={(e) =>
                  setForm({ ...form, time: e.target.value })
                }
                className="w-full mb-3 border p-2 rounded"
              />

              <input
                placeholder="ชื่องาน"
                value={form.name}
                onChange={(e) =>
                  setForm({ ...form, name: e.target.value })
                }
                className="w-full mb-3 border p-2 rounded"
              />

              <input
                type="number"
                step="0.1"
                value={form.ec}
                onChange={(e) =>
                  setForm({ ...form, ec: +e.target.value })
                }
                className="w-full mb-4 border p-2 rounded"
              />

              <div className="flex gap-3">
                <button
                  onClick={() => setOpen(false)}
                  className="flex-1 bg-gray-200 py-2 rounded"
                >
                  ยกเลิก
                </button>

                <button
                  onClick={addTask}
                  className="flex-1 bg-emerald-500 text-white py-2 rounded"
                >
                  บันทึก
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
function SidebarItem({
  label,
  icon,
  href,
  active,
}: any) {
  const router = useRouter();
  return (
    <button
      onClick={() => router.push(href)}
      className={`flex items-center gap-3 w-full px-4 py-3 rounded-xl ${
        active ? "bg-emerald-500 text-white" : "text-slate-500"
      }`}
    >
      {icon}
      {label}
    </button>
  );
}
