"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";
import {
  FaChartPie,
  FaListAlt,
  FaSeedling,
  FaHistory,
  FaSignOutAlt,
} from "react-icons/fa";

/* ===================== TYPES ===================== */
type HistoryLog = {
  id: number;
  created_at: string;
  ec: number;
  ph: number;
  flow: number;
  waterLevel: number;
};

/* ===================== PAGE ===================== */
export default function HistoryPage() {
  const router = useRouter();
  const pathname = usePathname();

  const [isRunning] = useState(false);
  const [logs, setLogs] = useState<HistoryLog[]>([]);
  const [loading, setLoading] = useState(true);
  const isMounted = useRef(true);

  /* ================= FETCH FUNCTION ================= */
  const fetchHistory = async () => {
    try {
      const res = await fetch("http://localhost:5000/history", {
        cache: "no-store",
      });

      if (!res.ok) throw new Error("Fetch failed");

      const data = await res.json();

      if (isMounted.current) {
        setLogs(data);
      }
    } catch (err) {
      console.error("History load error:", err);
    } finally {
      if (isMounted.current) {
        setLoading(false);
      }
    }
  };

  /* ================= INITIAL LOAD ================= */
  useEffect(() => {
    fetchHistory();

    const interval = setInterval(fetchHistory, 5000);

    return () => {
      isMounted.current = false;
      clearInterval(interval);
    };
  }, []);

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
          <SidebarItem label="ประวัติย้อนหลัง" icon={<FaHistory />} href="/dashboard/history" active />
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
          <h2 className="text-3xl font-bold text-blue-900 ml-5 mb-2 mt-5">
            ประวัติย้อนหลัง
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

        <div className="bg-white rounded-2xl p-6 shadow-sm mt-6">
          <h3 className="font-bold text-blue-900 text-xl mb-6">
            ประวัติการสั่งงานจากอุปกรณ์
          </h3>

          <table className="w-full text-sm">
            <thead className="border-b text-slate-400">
              <tr>
                <th className="text-left py-3">วัน/เวลา</th>
                <th className="text-left py-3">EC</th>
                <th className="text-left py-3">pH</th>
                <th className="text-left py-3">Flow</th>
                <th className="text-left py-3">Water Level</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-6 text-center text-slate-400">
                    กำลังโหลดข้อมูล...
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-6 text-center text-slate-400">
                    ยังไม่มีข้อมูลจากอุปกรณ์
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="border-b last:border-none">
                    <td className="py-4">{log.created_at}</td>
                    <td>{log.ec}</td>
                    <td>{log.ph}</td>
                    <td>{log.flow}</td>
                    <td>{log.waterLevel}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}

/* ===================== SIDEBAR ===================== */
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
      className={`flex items-center gap-3 w-full px-5 py-4 rounded-xl text-[16px] font-medium transition ${
        active ? "bg-[#05CD99] text-white" : "text-slate-500 hover:bg-slate-100"
      }`}
    >
      {icon}
      {label}
    </button>
  );
}
