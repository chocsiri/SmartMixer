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
  FaPlus,
  FaTrash,
} from "react-icons/fa";

/* ================= TYPES ================= */

type TimeEntry = {
  id: string;
  time: string;
  ec: number | "";
  ph: number | "";
};

type Stage = {
  id: string;
  startDay: number | "";
  endDay: number | "";
  times: TimeEntry[];
};

type Recipe = {
  id: string;
  recipeName: string;
  stages: Stage[];
  totalDays: number;
};

const createEmptyTime = (): TimeEntry => ({
  id: Date.now().toString() + Math.random(),
  time: "",
  ec: "",
  ph: "",
});

export default function DashboardPage() {
  const router = useRouter();
  const pathname = usePathname();

  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [startDate, setStartDate] = useState("");

  const [form, setForm] = useState({
    recipeName: "",
    stages: [
      {
        id: Date.now().toString(),
        startDay: 1,
        endDay: "",
        times: [createEmptyTime()],
      },
    ],
  });

  /* ================= LOAD DB ================= */

  useEffect(() => {
    fetchRecipes();
  }, []);

  const fetchRecipes = async () => {
    const res = await fetch("http://localhost:5000/api/formula");
    const data = await res.json();
    setRecipes(data || []);
  };

  const filteredRecipes = recipes.filter((r: any) =>
  (r.name || r.recipeName || "")
    .toLowerCase()
    .includes(search.toLowerCase())
);


  /* ================= STAGE ================= */

  const addStage = () => {
    setForm((prev) => ({
      ...prev,
      stages: [
        ...prev.stages,
        {
          id: Date.now().toString(),
          startDay: "",
          endDay: "",
          times: [createEmptyTime()],
        },
      ],
    }));
  };

  const removeStage = (id: string) => {
    setForm((prev) => ({
      ...prev,
      stages: prev.stages.filter((s) => s.id !== id),
    }));
  };

  const updateStage = (
    id: string,
    key: "startDay" | "endDay",
    value: number | ""
  ) => {
    setForm((prev) => ({
      ...prev,
      stages: prev.stages.map((s) =>
        s.id === id ? { ...s, [key]: value } : s
      ),
    }));
  };

  const addTimeRow = (stageId: string) => {
    setForm((prev) => ({
      ...prev,
      stages: prev.stages.map((s) =>
        s.id === stageId
          ? { ...s, times: [...s.times, createEmptyTime()] }
          : s
      ),
    }));
  };

  const updateTimeRow = (
    stageId: string,
    rowId: string,
    key: "time" | "ec" | "ph",
    value: any
  ) => {
    setForm((prev) => ({
      ...prev,
      stages: prev.stages.map((s) =>
        s.id === stageId
          ? {
              ...s,
              times: s.times.map((t) =>
                t.id === rowId ? { ...t, [key]: value } : t
              ),
            }
          : s
      ),
    }));
  };

  const removeTimeRow = (stageId: string, rowId: string) => {
    setForm((prev) => ({
      ...prev,
      stages: prev.stages.map((s) =>
        s.id === stageId
          ? { ...s, times: s.times.filter((t) => t.id !== rowId) }
          : s
      ),
    }));
  };

  const totalDays =
    form.stages.length > 0
      ? Math.max(
          ...form.stages.map((s) =>
            s.endDay === "" ? 0 : Number(s.endDay)
          )
        )
      : 0;

  /* ================= ADD ================= */

  const addRecipe = async () => {
    if (!form.recipeName) return;

    await fetch("http://localhost:5000/api/formula", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    fetchRecipes();
    setOpen(false);
    resetForm();
  };

  const deleteRecipe = async (id: string) => {
    await fetch(`http://localhost:5000/api/formula/${id}`, {
      method: "DELETE",
    });
    fetchRecipes();
  };

  const resetForm = () => {
    setForm({
      recipeName: "",
      stages: [
        {
          id: Date.now().toString(),
          startDay: 1,
          endDay: "",
          times: [createEmptyTime()],
        },
      ],
    });
  };

  const confirmAddToSchedule = async () => {
    if (!selectedRecipe) return;

    const finalDate =
      startDate || new Date().toISOString().split("T")[0];

    await fetch("http://localhost:5000/api/main-process/generate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        formulaId: Number(selectedRecipe.id),
        startDate: finalDate,
      }),
    });

    setScheduleOpen(false);
    router.push("/dashboard/MainProcess");
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
        <div className="flex justify-between items-center">
          <h2 className="text-3xl font-bold text-blue-900 ml-5 mt-5">
            จัดการสูตรพืช
          </h2>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm mt-6">
          <div className="flex justify-between mb-6">
            <h3 className="font-bold text-blue-900 text-xl">
              รายการสูตรพืช
            </h3>

            <div className="flex gap-3">
              <div className="flex items-center bg-[#F1F4F9] px-4 h-[42px] rounded-xl w-[240px]">
                <FaSearch className="text-slate-400 mr-2" />
                <input
                  placeholder="ค้นหาสูตร..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="bg-transparent outline-none text-sm w-full"
                />
              </div>

              <button
                onClick={() => {
                  resetForm();
                  setOpen(true);
                }}
                className="w-[160px] h-[44px] bg-emerald-500 text-white text-sm font-medium rounded-xl"
              >
                ＋ สร้างสูตรพืชใหม่
              </button>
            </div>
          </div>

          <table className="w-full text-sm table-fixed">
            <thead className="border-b text-slate-400">
              <tr>
                <th className="text-left py-3">ชื่อสูตรพืช</th>
                <th className="text-left py-3">ระยะเวลา</th>
                <th className="text-left py-3">จัดการ</th>
              </tr>
            </thead>
            <tbody>
              {filteredRecipes.length === 0 && (
                <tr>
                  <td colSpan={3} className="text-center py-10 text-slate-400">
                    ยังไม่มีสูตรพืช
                  </td>
                </tr>
              )}

              {filteredRecipes.map((p) => (
                <tr key={p.id} className="border-b">
                  <td className="py-4 font-semibold text-[#1E2A69]">
                    {p.recipeName}
                  </td>

                  <td className="py-4">
                    <span className="px-3 py-1 bg-emerald-50 text-emerald-600 rounded-lg">
                      {p.totalDays} วัน
                    </span>
                  </td>

                  <td className="py-4">
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          setSelectedRecipe(p);
                          const today = new Date().toISOString().split("T")[0];
                          setStartDate(today);
                          setScheduleOpen(true);
                        }}
                        className="flex font-semibold items-center gap-2 px-4 h-[36px] bg-emerald-50 text-emerald-600 rounded-xl hover:bg-emerald-100 transition"
                      >
                        เพิ่มลงตาราง
                      </button>

                      <button
                        onClick={() => deleteRecipe(p.id)}
                        className="px-3 h-[36px] bg-red-50 text-red-500 rounded-xl hover:bg-red-100 transition"
                      >
                        <FaTrash />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* ================= CREATE MODAL ================= */}
        {open && (
          <div className="fixed inset-0 bg-black/30 flex items-center justify-center">
            <div className="bg-white rounded-2xl w-full max-w-[720px] p-8 shadow-xl">
              <h3 className="text-center text-xl font-semibold text-[#1E2A69] mb-6">
                สร้างสูตรพืชใหม่
              </h3>

              <input
                placeholder="ชื่อสูตรพืช"
                value={form.recipeName}
                onChange={(e) =>
                  setForm({ ...form, recipeName: e.target.value })
                }
                className="w-full h-[48px] px-4 rounded-xl border bg-[#F7F9FC] mb-6"
              />

              <div className="space-y-4">
                {form.stages.map((s) => (
                  <div key={s.id} className="border rounded-xl p-4 space-y-3">
                    <div className="flex gap-3">
                      <input
                        type="number"
                        placeholder="Start Day"
                        value={s.startDay}
                        onChange={(e) =>
                          updateStage(
                            s.id,
                            "startDay",
                            e.target.value === "" ? "" : Number(e.target.value)
                          )
                        }
                        className="flex-1 border rounded-lg px-3 py-2"
                      />
                      <input
                        type="number"
                        placeholder="End Day"
                        value={s.endDay}
                        onChange={(e) =>
                          updateStage(
                            s.id,
                            "endDay",
                            e.target.value === "" ? "" : Number(e.target.value)
                          )
                        }
                        className="flex-1 border rounded-lg px-3 py-2"
                      />
                      <button
                        onClick={() => removeStage(s.id)}
                        className="text-red-500"
                      >
                        <FaTrash />
                      </button>
                    </div>

                    {s.times.map((t) => (
                      <div key={t.id} className="flex gap-3">
                        <input
                          type="time"
                          value={t.time}
                          onChange={(e) =>
                            updateTimeRow(s.id, t.id, "time", e.target.value)
                          }
                          className="flex-1 border rounded-lg px-3 py-2"
                        />
                        <input
                          type="number"
                          placeholder="EC"
                          value={t.ec}
                          onChange={(e) =>
                            updateTimeRow(
                              s.id,
                              t.id,
                              "ec",
                              e.target.value === ""
                                ? ""
                                : Number(e.target.value)
                            )
                          }
                          className="flex-1 border rounded-lg px-3 py-2"
                        />
                        <input
                          type="number"
                          placeholder="pH"
                          value={t.ph}
                          onChange={(e) =>
                            updateTimeRow(
                              s.id,
                              t.id,
                              "ph",
                              e.target.value === ""
                                ? ""
                                : Number(e.target.value)
                            )
                          }
                          className="flex-1 border rounded-lg px-3 py-2"
                        />
                        <button
                          onClick={() => removeTimeRow(s.id, t.id)}
                          className="text-red-500"
                        >
                          <FaTrash />
                        </button>
                      </div>
                    ))}

                    <button
                      onClick={() => addTimeRow(s.id)}
                      className="text-emerald-600 flex items-center gap-2"
                    >
                      <FaPlus /> เพิ่มเวลา
                    </button>
                  </div>
                ))}
              </div>

              <button
                onClick={addStage}
                className="mt-4 text-emerald-600 flex items-center gap-2"
              >
                <FaPlus /> เพิ่มช่วงวัน
              </button>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setOpen(false)}
                  className="flex-1 bg-gray-200 rounded-xl h-[48px]"
                >
                  ยกเลิก
                </button>
                <button
                  onClick={addRecipe}
                  className="flex-1 bg-emerald-500 text-white rounded-xl h-[48px]"
                >
                  บันทึกสูตร
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ================= SCHEDULE MODAL ================= */}
        {scheduleOpen && selectedRecipe && (
          <div className="fixed inset-0 bg-black/30 flex items-center justify-center">
            <div className="bg-white rounded-2xl w-full max-w-[520px] p-8 shadow-xl">
              <h3 className="text-xl font-semibold text-center mb-6">
                เพิ่มลงตารางงานหลัก
              </h3>

              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full h-[48px] px-4 rounded-xl border bg-[#F7F9FC] mb-6"
              />

              <div className="flex gap-3">
                <button
                  onClick={() => setScheduleOpen(false)}
                  className="flex-1 bg-gray-200 rounded-xl h-[48px]"
                >
                  ยกเลิก
                </button>
                <button
                  onClick={confirmAddToSchedule}
                  className="flex-1 bg-emerald-500 text-white rounded-xl h-[48px]"
                >
                  ยืนยัน
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
        active ? "bg-[#05CD99] text-white" : "text-slate-500 hover:bg-slate-100"
      }`}
    >
      {icon}
      {label}
    </button>
  );
}
