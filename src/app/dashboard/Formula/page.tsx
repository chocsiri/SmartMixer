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
import { TrashIcon } from "../../components/icons";

/* ===================== TYPES ===================== */
type Stage = {
  id: string;
  day: number | "";
  ec: number | "";
  ph: number | "";
};

type Recipe = {
  id: string;
  recipeName: string;
  stages: Stage[];
  totalDays: number;
};

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
    /* ================= LOAD MOCK DATA (แทน GET API) ================= */
    useEffect(() => {
      const saved = localStorage.getItem("smartmixer_recipes");
      if (saved) {
        setRecipes(JSON.parse(saved));
      }
    }, []);
    /* ================= SAVE MOCK DATA (แทน POST / PUT API) ================= */
    const persistRecipes = (data: Recipe[]) => {
      localStorage.setItem("smartmixer_recipes", JSON.stringify(data));
    };


  const [form, setForm] = useState({
    recipeName: "",
    stages: [{ id: Date.now().toString(), day: "", ec: "", ph: "" }],
  });

  /* ================= STAGE CONTROL ================= */
  const addStage = () => {
    setForm((prev) => ({
      ...prev,
      stages: [
        ...prev.stages,
        { id: Date.now().toString(), day: "", ec: "", ph: "" },
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
    key: keyof Stage,
    value: number | ""
  ) => {
    setForm((prev) => ({
      ...prev,
      stages: prev.stages.map((s) =>
        s.id === id ? { ...s, [key]: value } : s
      ),
    }));
  };

  const totalDays =
    form.stages.length > 0
      ? Math.max(
          ...form.stages.map((s) => (s.day === "" ? 0 : Number(s.day)))
        )
      : 0;

  /* ================= ADD RECIPE ================= */
  const addRecipe = () => {
    if (!form.recipeName) return;

    const newRecipe: Recipe = {
      id: Date.now().toString(),
      recipeName: form.recipeName,
      stages: form.stages,
      totalDays,
    };

    setRecipes((prev) => {
      const updated = [...prev, newRecipe];
      persistRecipes(updated);
      return updated;
    });


    setOpen(false);
    setForm({
      recipeName: "",
      stages: [{ id: Date.now().toString(), day: "", ec: "", ph: "" }],
    });
  };

  const deleteRecipe = (id: string) => {
    setRecipes((prev) => {
    const updated = prev.filter((r) => r.id !== id);
    persistRecipes(updated);
    return updated;
  });
  };

  const filteredRecipes = recipes.filter((r) =>
    r.recipeName.toLowerCase().includes(search.toLowerCase())
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

  const confirmAddToSchedule = () => {
    if (!selectedRecipe || !startDate || times.length === 0) return;

    const old = JSON.parse(localStorage.getItem("smartmixer_schedule") || "[]");

    const newItem = {
      id: Date.now(),
      recipeId: selectedRecipe.id,
      recipeName: selectedRecipe.recipeName,
      startDate,
      times,
      stages: selectedRecipe.stages,
      totalDays: selectedRecipe.totalDays,
    };

    localStorage.setItem(
      "smartmixer_schedule",
      JSON.stringify([...old, newItem])
    );

    setScheduleOpen(false);
    setTimes([]);
    setStartDate("");

    router.push("/dashboard/MainProcess"); // ไปหน้าตารางงานหลัก
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
                onClick={() => setOpen(true)}
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
          <div className="fixed inset-0 bg-black/30 flex items-center justify-center">
            <div className="bg-white rounded-2xl w-full max-w-[600px] p-8 shadow-xl animate-popIn shadow-[0_25px_70px_rgba(0,0,0,0.15)]">
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

              <div className="space-y-3 max-h-[200px] overflow-y-auto">
                {/* ===== Stage Header ===== */}
                <div className="flex justify-between items-center mb-2">
                  <label className="text-sm font-medium text-[#1E2A69]">
                    ระยะการให้ปุ๋ย (Stages)
                  </label>

                  <button
                    type="button"
                    onClick={addStage}
                    className="px-3 py-1 bg-emerald-50 text-emerald-600 rounded-lg text-sm hover:bg-emerald-100 transition"
                  >
                    + เพิ่มระยะ
                  </button>
                </div>
                {form.stages.map((s) => (
                    <div
                      key={s.id}
                      className="grid gap-3"
                      style={{ gridTemplateColumns: "1fr 1fr 1fr 44px" }}
                    >
                      {/* Day */}
                      <div className="flex flex-col">
                        <label className="text-xs text-slate-500 mb-1">
                          สิ้นสุดวันที่ (Day)
                        </label>
                        <input
                          type="number"
                          placeholder="เช่น 15"
                          value={s.day}
                          onChange={(e) =>
                            updateStage(
                              s.id,
                              "day",
                              e.target.value === "" ? "" : Number(e.target.value)
                            )
                          }
                          className="h-[44px] px-3 rounded-xl border bg-[#F7F9FC] w-full"
                        />
                      </div>

                      {/* EC */}
                      <div className="flex flex-col">
                        <label className="text-xs text-slate-500 mb-1">ค่า EC</label>
                        <input
                          type="number"
                          step="0.1"
                          placeholder="EC"
                          value={s.ec}
                          onChange={(e) =>
                            updateStage(
                              s.id,
                              "ec",
                              e.target.value === "" ? "" : Number(e.target.value)
                            )
                          }
                          className="h-[44px] px-3 rounded-xl border bg-[#F7F9FC] w-full"
                        />
                      </div>

                      {/* pH */}
                      <div className="flex flex-col">
                        <label className="text-xs text-slate-500 mb-1">ค่า pH</label>
                        <input
                          type="number"
                          step="0.1"
                          placeholder="pH"
                          value={s.ph}
                          onChange={(e) =>
                            updateStage(
                              s.id,
                              "ph",
                              e.target.value === "" ? "" : Number(e.target.value)
                            )
                          }
                          className="h-[44px] px-3 rounded-xl border bg-[#F7F9FC] w-full"
                        />
                      </div>

                      {/* Delete */}
                      <div className="flex items-end">
                        <button
                          onClick={() => removeStage(s.id)}
                          className="bg-red-50 text-red-500 rounded-xl w-[44px] h-[44px] flex items-center justify-center"
                        >
                          <TrashIcon className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  ))}
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
                  onClick={() => setOpen(false)}
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

              {selectedRecipe.stages.map((s, index) => {
                const startDay =
                  index === 0
                    ? 1
                    : Number(selectedRecipe.stages[index - 1].day) + 1;

                return (
                  <div key={s.id} className="grid grid-cols-3 px-6 py-4 border-t text-[#1E2A69]">
                    <div>วันที่ {startDay} - {s.day}</div>
                    <div className="text-emerald-500 font-semibold">{s.ec}</div>
                    <div>{s.ph}</div>
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

      {/* เวลา */}
      <label className="text-sm font-medium text-[#1E2A69]">กำหนดเวลาทำงานในแต่ละวัน</label>

      <div className="flex gap-3 mt-2 mb-5">
        <input
          type="time"
          value={timeInput}
          onChange={(e) => setTimeInput(e.target.value)}
          className="flex-1 h-[48px] px-4 rounded-xl border bg-[#F7F9FC]"
        />

        <button
          onClick={addTime}
          className="px-5 bg-emerald-500 text-white rounded-xl hover:bg-emerald-600 transition"
        >
          + เพิ่ม
        </button>
      </div>
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
