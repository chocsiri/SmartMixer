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
import { AddIcon, TrashIcon } from "../../components/icons";


/* ===================== TYPES ===================== */
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

/* ===================== HELPERS ===================== */
const createEmptyTime = (): TimeEntry => ({
  id: Date.now().toString() + Math.random(),
  time: "",
  ec: "",
  ph: "",
});


export default function DashboardPage() {
  const router = useRouter();
  const pathname = usePathname();
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [scheduleOpen, setScheduleOpen] = useState(false);

  const [startDate, setStartDate] = useState("");
  const [timeInput, setTimeInput] = useState("");
  const [times, setTimes] = useState<string[]>([]);
  const [recipes, setRecipes] = useState<Recipe[]>([]); 
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
    /* ================= LOAD FROM BACKEND ================= */
useEffect(() => {
  fetchRecipes();
}, []);

const fetchRecipes = async () => {
  try {
    const res = await fetch("http://localhost:5000/api/formula");
    const data = await res.json();
    setRecipes(data || []);
  } catch (err) {
    console.error("Fetch formula error:", err);
  }
};

const deleteRecipe = async (id: string) => {
  try {
    await fetch(`http://localhost:5000/api/formula/${id}`, {
      method: "DELETE",
    });

    await fetchRecipes();
  } catch (err) {
    console.error("Delete formula error:", err);
  }
};



  const [form, setForm] = useState<{
  recipeName: string;
  stages: Stage[];
}>({
  recipeName: "",
  stages: [
    {
      id: Date.now().toString(),
      startDay: 1,
      endDay: "",
      times: [createEmptyTime()],   // ✅ มีแถว แต่ยังว่าง
    },
  ],
});




  /* ================= STAGE CONTROL ================= */
 const addStage = () => {
  setForm((prev) => ({
    ...prev,
    stages: [
      ...prev.stages,
      {
        id: Date.now().toString(),
        startDay: "",
        endDay: "",
        times: [createEmptyTime()], // ← ต้องมี
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

  const addTimeRow = (stageId: string) => {
  setForm((prev) => ({
      ...prev,
      stages: prev.stages.map((s) =>
        s.id === stageId
          ? {
              ...s,
              times: [...s.times, createEmptyTime()], // ใช้ helper
            }
          : s
      ),
    }));
  };

const updateTimeRow = (
  stageId: string,
  rowId: string,
  key: "time" | "ec" | "ph",
  value: string | number
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

  const updateStage = (id: string, value: number | "") => {
  setForm((prev) => ({
    ...prev,
    stages: prev.stages.map((s) =>
      s.id === id ? { ...s, endDay: value } : s
      ),
    }));
  };

  const updateStageStart = (id: string, value: number | "") => {
    setForm((prev) => ({
      ...prev,
      stages: prev.stages.map((s) =>
        s.id === id ? { ...s, startDay: value } : s
      ),
    }));
  };

  const totalDays =
  form.stages.length > 0
    ? Math.max(
        ...form.stages.map((s) => (s.endDay === "" ? 0 : Number(s.endDay)))
      )
    : 0;

  /* ================= ADD RECIPE ================= */
  const resetForm = () => {
    setForm({
      recipeName: "",
      stages: [
        {
          id: Date.now().toString(),
          startDay: "",
          endDay: "",
          times: [createEmptyTime()],
        },
      ],
    });
  };

  const addRecipe = async () => {
  if (!form.recipeName) return;

  try {
    await fetch("http://localhost:5000/api/formula", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        recipeName: form.recipeName,
        stages: form.stages,
      }),
    });

    await fetchRecipes();
    setOpen(false);
    resetForm();
  } catch (err) {
    console.error("Add formula error:", err);
  }
};


  const filteredRecipes = recipes.filter((r: any) =>
  (r.recipeName || r.name || "")
    .toLowerCase()
    .includes(search.toLowerCase())
);

    const addTime = () => {
    if (!timeInput) return;
    if (times.includes(timeInput)) return;

    setTimes([...times, timeInput]);
    setTimeInput("");
  };

  const removeTime = (t: string) => {
    setTimes(times.filter((x) => x !== t));
  };

  const getToday = () => {
    const today = new Date();
    return today.toISOString().split("T")[0]; // YYYY-MM-DD
  };

  const confirmAddToSchedule = async () => {
  if (!selectedRecipe) return;

  const finalStartDate =
    startDate && startDate !== ""
      ? startDate
      : new Date().toISOString().split("T")[0];

  try {
    await fetch("http://localhost:5000/api/main-process/generate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        formulaId: Number(selectedRecipe.id),
        startDate: finalStartDate,
      }),
    });

    setScheduleOpen(false);
    setStartDate("");
    router.push("/dashboard/MainProcess");
  } catch (err) {
    console.error("Generate main process error:", err);
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
        <div className="flex justify-between items-center">
          <h2 className="text-3xl font-bold text-blue-900 ml-5 mt-5">
            จัดการสูตรพืช
          </h2>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm mt-6 hover:shadow-md hover:-translate-y-0.5 transition duration-300">
          <div className="flex justify-between mb-6">
            <h3 className="font-bold text-blue-900 text-xl">
              รายการสูตรพืช (Plant Recipes)
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
                onClick={() => 
                  {resetForm();   // ← ล้างก่อนเปิด
                  setOpen(true);
                }}
                className="w-[160px] h-[44px] bg-emerald-500 text-white text-sm font-medium rounded-xl hover:shadow-md hover:-translate-y-1 transition duration-300"
              >
                ＋ สร้างสูตรพืชใหม่
              </button>
            </div>
          </div>

          {/* ================= TABLE ================= */}
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
                        {/* รายละเอียด */}
                        <button
                          onClick={() => {
                            setSelectedRecipe(p);
                            setDetailOpen(true);
                          }}
                          className="flex font-semibold items-center gap-2 px-4 h-[36px] bg-[#EEF1F7] text-[#1E2A69] rounded-xl hover:bg-[#E3E8F2] transition"
                        >
                          <span className="text-xl">👁</span>
                          รายละเอียด
                        </button>

                        {/* เพิ่มลงตาราง */}
                        <button
                          onClick={() => {
                            setSelectedRecipe(p);

                            // 👉 ใส่วันที่ปัจจุบันเป็นค่า default
                            const today = new Date().toISOString().split("T")[0];
                            setStartDate(today);

                            setScheduleOpen(true);
                          }}
                          className="flex font-semibold items-center gap-2 px-4 h-[36px] bg-emerald-50 text-emerald-600 rounded-xl hover:bg-emerald-100 transition"
                        >
                          ＋ เพิ่มลงตาราง
                        </button>

                        {/* ลบ (ของเดิมเก็บไว้) */}
                        <button
                          onClick={() => deleteRecipe(p.id)}
                          className="px-3 h-[36px] bg-red-50 text-red-500 rounded-xl hover:bg-red-100 transition"
                        >
                          <TrashIcon className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* ================= MODAL ================= */}
        {open && (
          <div className="fixed inset-0 bg-black/30 flex items-start justify-center overflow-y-auto py-10">
            <div className="bg-white rounded-2xl w-full max-w-[720px] max-h-[90vh]
                p-8 overflow-y-auto shadow-xl animate-popIn shadow-[0_25px_70px_rgba(0,0,0,0.15)]">
              <h3 className="text-center text-xl font-semibold text-[#1E2A69] mb-6">
                สร้างสูตรพืชใหม่ (Custom)
              </h3>

              <div className="mb-5">
                <label className="text-sm font-medium block mb-2 text-[#1E2A69]">
                  ชื่อสูตรพืช
                </label>
                <input
                  placeholder="เช่น ผักสลัด"
                  value={form.recipeName}
                  onChange={(e) =>
                    setForm({ ...form, recipeName: e.target.value })
                  }
                  className="w-full h-[48px] px-4 rounded-xl border bg-[#F7F9FC]"
                />
              </div>

              <div className="space-y-4">
                {/* ===== Date Ranges UI (NEW DESIGN) ===== */}
                <div className="space-y-4">
                  {/* Header */}
                  <div className="flex justify-between items-center">
                    <label className="text-sm font-semibold text-[#1E2A69]">
                      ช่วงการให้ปุ๋ย (Date Ranges)
                    </label>

                    <button
                      type="button"
                      onClick={addStage}
                      className="px-4 h-[36px] text-sm rounded-lg border border-emerald-500 text-emerald-600 hover:bg-emerald-50 transition"
                    >
                      + เพิ่มช่วงวัน
                    </button>
                  </div>

                  {/* Stage List */}
                  <div className="space-y-3">
                    {form.stages.map((s) => (
                      <div
                        key={s.id}
                        className="border border-[#E6ECF5] rounded-2xl p-5 bg-[#FAFCFE]
                        space-y-4 hover:border-emerald-400 hover:bg-white transition"
                      >
                        {/* DAY RANGE */}
                        <div className="flex gap-3 items-end">
                          {/* START DAY */}
                          <div className="flex-1">
                            <label className="text-xs font-medium text-slate-500 block mb-1">
                              เริ่มวันที่ (Start Day)
                            </label>
                            <input
                              type="number"
                              value={s.startDay}
                              onChange={(e) =>
                                updateStageStart(
                                  s.id,
                                  e.target.value === "" ? "" : Number(e.target.value)
                                )
                              }
                              className="w-full h-[50px] px-3 rounded-xl border border-[#E3E8F2]
                              bg-[#F7F9FC] focus:bg-white focus:ring-2 focus:ring-emerald-400 outline-none"
                            />
                          </div>

                          {/* DASH */}
                          <div className="w-[20px] text-center text-slate-400 pb-2">-</div>

                          {/* END DAY */}
                          <div className="flex-1">
                            <label className="text-xs font-medium text-slate-500 block mb-1">
                              ถึงวันที่ (End Day)
                            </label>
                            <input
                              type="number"
                              value={s.endDay}
                              onChange={(e) =>
                                updateStage(
                                  s.id,
                                  e.target.value === "" ? "" : Number(e.target.value)
                                )
                              }
                              className="w-full h-[50px] px-3 rounded-xl border border-[#E3E8F2]
                              bg-[#F7F9FC] focus:bg-white focus:ring-2 focus:ring-emerald-400 outline-none"
                            />
                          </div>

                          {/* DELETE */}
                          <button
                            onClick={() => removeStage(s.id)}
                            className="w-[44px] h-[44px] bg-red-50 text-red-500 rounded-xl hover:bg-red-100 shrink-0"
                          >
                            <TrashIcon className="w-4 h-4 mx-auto" />
                          </button>
                        </div>
                        {/* TIME HEADER */}
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-slate-400 font-semibold">
                            เวลาที่รดน้ำ:
                          </span>

                          <button
                            onClick={() => addTimeRow(s.id)}
                            className="w-8 h-8 text-xs bg-emerald-100 text-emerald-600 rounded-xl hover:bg-emerald-200 shrink-0 "
                          >
                            <AddIcon className="w-4 h-4 mx-auto" />
                          </button>
                        </div>

                        {/* TIME ROWS */}
                        {s.times.map((t) => (
                          <div key={t.id} className="flex gap-3 items-center">
                            {/* TIME (ให้กว้างขึ้น) */}
                            <input
                              type="time"
                              value={t.time}
                              onChange={(e) =>
                                updateTimeRow(s.id, t.id, "time", e.target.value)
                              }
                              className="flex-[2] h-[50px] px-3 rounded-lg border border-[#E3E8F2]
                              bg-white focus:ring-emerald-400 focus:ring-2 outline-none min-w-[180px]"
                            />

                            {/* EC */}
                            <input
                              type="number"
                              step="0.1"
                              placeholder="EC"
                              value={t.ec}
                              onChange={(e) =>
                                updateTimeRow(
                                  s.id,
                                  t.id,
                                  "ec",
                                  e.target.value === "" ? "" : Number(e.target.value)
                                )
                              }
                              className="flex-1 h-[50px] px-3 rounded-lg border border-[#E3E8F2]
                              bg-white focus:ring-emerald-400 focus:ring-2 outline-none w-[150px]"
                            />

                            {/* PH */}
                            <input
                              type="number"
                              step="0.1"
                              placeholder="pH"
                              value={t.ph}
                              onChange={(e) =>
                                updateTimeRow(
                                  s.id,
                                  t.id,
                                  "ph",
                                  e.target.value === "" ? "" : Number(e.target.value)
                                )
                              }
                              className="flex-1 h-[50px] px-3 rounded-lg border border-[#E3E8F2]
                              bg-white focus:ring-emerald-400 focus:ring-2 outline-none w-[150px]"
                            />
                              <button
                                onClick={() => removeTimeRow(s.id, t.id)}
                                className="w-[44px] h-[44px] bg-red-50 text-red-500 rounded-xl hover:bg-red-100 shrink-0"
                              >
                                <TrashIcon className="w-4 h-4 mx-auto" />
                            </button>
                            </div>
                        ))}
                      </div>
                    ))}
                  </div>

                </div>
              </div>

              <div className="text-right mt-4 border-t pt-3 text-sm">
                รวมระยะเวลาปลูก:
                <span className="text-emerald-600 font-semibold ml-1">
                  {totalDays}
                </span>{" "}
                วัน
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => {
                  setOpen(false);
                  resetForm();   // ← ล้างค่าที่กรอกทิ้ง
                }}
                  className="flex-1 h-[48px] bg-[#EEF1F7] rounded-xl hover:scale-[1.02] hover:shadow-lg
                  transition-all duration-200"
                >
                  ยกเลิก
                </button>

                <button
                  onClick={addRecipe}
                  className="flex-1 h-[48px] text-white rounded-xl bg-gradient-to-r from-[#59C173] to-[#2D9B73] hover:scale-[1.02] hover:shadow-lg
                  transition-all duration-200"
                >
                  บันทึกสูตร
                </button>
              </div>
            </div>
          </div>
          )}

          {/* ================= DETAIL MODAL ================= */}
      {detailOpen && selectedRecipe && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center">
          <div className="bg-white rounded-2xl w-full max-w-[520px] p-8 animate-popIn shadow-[0_25px_70px_rgba(0,0,0,0.15)]">
            <h3 className="text-center text-xl font-semibold text-[#1E2A69] mb-6">
              รายละเอียดสูตร: {selectedRecipe.recipeName}
            </h3>

            <div className="bg-[#F4F7FE] rounded-2xl overflow-hidden">
              <div className="grid grid-cols-3 px-6 py-3 text-sm text-slate-500 font-medium">
                <div>ระยะ (วัน)</div>
                <div>ค่า EC</div>
                <div>ค่า PH</div>
              </div>

              {selectedRecipe.stages.map((s) => {
              // ✅ เรียงเวลาก่อนแสดงผล
              const sortedTimes = [...s.times]
                .filter((t) => t.time) // ตัดแถวว่างออกก่อน
                .sort((a, b) => a.time.localeCompare(b.time)); // เรียงแบบ HH:mm

              return (
                <div key={s.id} className="border-t px-6 py-4 text-[#1E2A69]">
                  <div className="font-semibold mb-2">
                    วันที่{" "}
                    {s.startDay === s.endDay
                      ? s.startDay
                      : `${s.startDay} - ${s.endDay}`}
                  </div>
                  {sortedTimes.length === 0 && (
                    <div className="text-sm text-slate-400">ไม่มีเวลาที่ตั้งไว้</div>
                  )}

                  {sortedTimes.map((t) => (
                    <div key={t.id} className="grid grid-cols-3 text-sm py-1">
                      <div>{t.time}</div>
                      <div className="text-emerald-500 font-medium">{t.ec || "-"}</div>
                      <div>{t.ph || "-"}</div>
                    </div>
                  ))}
                </div>
              );
            })}
            </div>

            <button
              onClick={() => setDetailOpen(false)}
              className="mt-6 w-full h-[48px] bg-[#E9EDF5] rounded-xl hover:scale-[1.02] hover:shadow-lg
                  transition-all duration-200"
            >
              ปิด
            </button>
          </div>
        </div>
      )}
      {scheduleOpen && selectedRecipe && (
  <div className="fixed inset-0 bg-black/30 flex items-center justify-center">
    <div className="bg-white rounded-2xl w-full max-w-[520px] p-8 animate-popIn shadow-[0_25px_70px_rgba(0,0,0,0.15)]">
      <h3 className="text-xl font-semibold text-center text-[#1E2A69] mb-2">
        เพิ่มลงตารางงานหลัก
      </h3>

      <p className="text-center text-slate-500 mb-6">
        คุณกำลังจะเพิ่มสูตร{" "}
        <span className="text-emerald-600 font-semibold">
          {selectedRecipe.recipeName}
        </span>{" "}
        ลงในตารางงาน
      </p>

      {/* วันที่เริ่ม */}
      <label className="text-sm font-medium text-[#1E2A69]">เริ่มปลูกวันที่</label>
      <input
        type="date"
        value={startDate}
        onChange={(e) => setStartDate(e.target.value)}
        className="w-full h-[48px] px-4 rounded-xl border bg-[#F7F9FC] mb-5 mt-3"
      />
      {/* แสดงเวลาที่เพิ่ม */}
          <div className="flex gap-2 mt-4 flex-wrap">
            {times.map((t) => (
              <div
                key={t}
                className="px-4 py-2 bg-emerald-50 text-emerald-600 rounded-full flex items-center gap-2"
              >
                {t}
                <button onClick={() => removeTime(t)}>×</button>
              </div>
            ))}
          </div>

          {/* ปุ่ม */}
          <div className="flex gap-3 mt-8">
            <button
              onClick={() => setScheduleOpen(false)}
              className="flex-1 h-[48px] bg-[#EEF1F7] rounded-xl hover:scale-[1.02] hover:shadow-lg
                  transition-all duration-200"
            >
              ยกเลิก
            </button>

            <button
              onClick={confirmAddToSchedule}
              className="flex-1 h-[48px] text-white rounded-xl bg-gradient-to-r from-[#59C173] to-[#2D9B73] hover:scale-[1.02] hover:shadow-lg
                  transition-all duration-200"
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