"use client";

import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import {
  FaChartPie,
  FaListAlt,
  FaSeedling,
  FaHistory,
  FaSignOutAlt,
  FaSearch,
} from "react-icons/fa";

/* ===================== TYPES ===================== */
type Task = {
  id: string;
  date: string;
  time: string;
  name: string;
  ec: number;
  ph: number;
  status: "pending";
};

export default function DashboardPage() {
  const router = useRouter();
  const pathname = usePathname();

  const [isRunning] = useState(false);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const [form, setForm] = useState({
    date: "",
    time: "",
    name: "",
    ec: 1.0,
    ph: 6.0,
  });

  /* ================= LOAD DATA ================= */
  const loadTasks = async () => {
    try {
      const res = await fetch("http://localhost:5000/main-process");
      const data = await res.json();
      setTasks(data);
    } catch (err) {
      console.error("Load error:", err);
    }
  };

  useEffect(() => {
    loadTasks();
  }, []);

  /* ================= ADD TASK ================= */
  const addTask = async () => {
    if (!form.name) return;

    try {
      const res = await fetch("http://localhost:5000/main-process", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (!res.ok) throw new Error("Save failed");

      await loadTasks(); // โหลดใหม่จาก DB
      setOpen(false);
      setForm({ date: "", time: "", name: "", ec: 1, ph: 6 });
    } catch (err) {
      console.error("Add task error:", err);
    }
  };

  return (
    <div className="flex min-h-screen bg-[#F4F7FE]">
      {/* ================= SIDEBAR ================= */}
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
            onClick={() => router.replace("/")}
            className="flex items-center gap-3 text-red-500 hover:bg-red-50 px-4 py-3 rounded-xl w-full"
          >
            <FaSignOutAlt /> ออกจากระบบ
          </button>
        </div>
      </aside>

      {/* ================= MAIN ================= */}
      <main className="flex-1 p-8 space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-3xl font-bold text-blue-900">
            จัดการสูตรพืช
          </h2>

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

        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <div className="flex justify-between items-start mb-6">
            <h3 className="font-bold text-blue-900 text-xl">
              รายการสูตรพืช (Plant Recipes)
            </h3>

            <div className="flex gap-3">
              <div className="flex items-center bg-[#F1F4F9] px-4 h-[42px] rounded-xl w-[240px] border border-transparent focus-within:border-emerald-600 transition">
                <FaSearch className="text-slate-400 mr-2" />
                <input
                  placeholder="ค้นหาสูตร..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="bg-transparent outline-none text-sm w-full"
                />
              </div>

              <button
                onClick={() => setOpen(true)}
                className="w-[160px] h-[44px] bg-emerald-500 hover:bg-emerald-600 text-white px-5 py-2 rounded-xl text-sm font-medium transition"
              >
                ＋ สร้างสูตรพืชใหม่
              </button>
            </div>
          </div>

          <table className="w-full text-sm">
            <thead className="border-b text-slate-400">
              <tr>
                <th className="text-left py-3">วันที่</th>
                <th className="text-left py-3">เวลา</th>
                <th className="text-left py-3">ชื่อสูตร</th>
                <th className="text-left py-3">เป้าหมาย</th>
              </tr>
            </thead>
            <tbody>
              {tasks.length === 0 && (
                <tr>
                  <td colSpan={4} className="text-center py-10 text-slate-400">
                    ยังไม่มีรายการในตาราง
                  </td>
                </tr>
              )}

              {tasks.map((task) => (
                <tr key={task.id} className="border-b">
                  <td className="py-3">{task.date}</td>
                  <td className="py-3">{task.time}</td>
                  <td className="py-3">{task.name}</td>
                  <td className="py-3">
                    EC {task.ec} / pH {task.ph}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* ================= MODAL ================= */}
        {open && (
          <div className="fixed inset-0 z-50 bg-black/30 backdrop-blur-sm flex items-center justify-center">
            <div className="bg-white rounded-[28px] w-full max-w-[560px] px-10 py-9 shadow-[0_25px_70px_rgba(0,0,0,0.15)]">
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
                    onChange={(e) =>
                      setForm({ ...form, date: e.target.value })
                    }
                    className="w-full h-[52px] px-4 rounded-xl border border-[#E3E8F2] bg-[#F7F9FC]"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-[#1E2A69] block mb-2">
                    เวลา
                  </label>
                  <input
                    type="time"
                    value={form.time}
                    onChange={(e) =>
                      setForm({ ...form, time: e.target.value })
                    }
                    className="w-full h-[52px] px-4 rounded-xl border border-[#E3E8F2] bg-[#F7F9FC]"
                  />
                </div>
              </div>

              <div className="mb-5">
                <label className="text-sm font-medium text-[#1E2A69] block mb-2">
                  ชื่องาน
                </label>
                <input
                  value={form.name}
                  onChange={(e) =>
                    setForm({ ...form, name: e.target.value })
                  }
                  className="w-full h-[52px] px-4 rounded-xl border border-[#E3E8F2] bg-[#F7F9FC]"
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
                    onChange={(e) =>
                      setForm({ ...form, ec: +e.target.value })
                    }
                    className="w-full h-[52px] px-4 rounded-xl border border-[#E3E8F2] bg-[#F7F9FC]"
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
                    onChange={(e) =>
                      setForm({ ...form, ph: +e.target.value })
                    }
                    className="w-full h-[52px] px-4 rounded-xl border border-[#E3E8F2] bg-[#F7F9FC]"
                  />
                </div>
              </div>

              <div className="flex gap-4">
                <button
                  onClick={() => setOpen(false)}
                  className="flex-1 h-[54px] rounded-xl bg-[#EEF1F7] text-slate-500"
                >
                  ยกเลิก
                </button>

                <button
                  onClick={addTask}
                  className="flex-1 h-[54px] rounded-xl text-white bg-gradient-to-r from-[#59C173] to-[#2D9B73]"
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

function SidebarItem({ label, icon, href, active = false }: any) {
  const router = useRouter();
  return (
    <button
      onClick={() => router.push(href)}
      className={`flex items-center gap-3 w-full px-5 py-4 rounded-xl ${
        active
          ? "bg-[#05CD99] text-white shadow"
          : "text-slate-500 hover:bg-slate-100"
      }`}
    >
      <span>{icon}</span>
      <span>{label}</span>
    </button>
  );
}
