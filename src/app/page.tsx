"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(false);
  const [error, setError] = useState("");

  // 🔁 โหลดข้อมูลที่จำไว้
  useEffect(() => {
    const savedUser = localStorage.getItem("rememberUser");
    const savedPass = localStorage.getItem("rememberPass");

    if (savedUser && savedPass) {
      setUsername(savedUser);
      setPassword(savedPass);
      setRemember(true);
    }

    // auto login ถ้ายังไม่ logout
    if (localStorage.getItem("isLogin") === "true") {
      router.replace("/dashboard");
    }
  }, [router]);

  // 🔐 Login
  const handleLogin = () => {
    if (username === "admin" && password === "admin") {
      localStorage.setItem("isLogin", "true");

      if (remember) {
        localStorage.setItem("rememberUser", username);
        localStorage.setItem("rememberPass", password);
      } else {
        localStorage.removeItem("rememberUser");
        localStorage.removeItem("rememberPass");
      }

      router.push("/dashboard");
    } else {
      setError("ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง");
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center
      bg-gradient-to-br from-[#E4F0F8] via-[#EAF2F9] to-[#E3F1F8]">

      <div className="h-[480px] w-[420px] rounded-[28px]
        bg-white px-10 py-10 text-center
        shadow-[0_30px_80px_rgba(0,0,0,0.08)]">

        <h1 className="mt-4 text-[32px] font-bold text-[#1E2A69]">
          SMART<span className="text-[#05CD99]">MIXER</span>
        </h1>

        <p className="mb-8 mt-3 text-[17px] text-[#8F9BBA]">
          ระบบควบคุมการผสมปุ๋ยอัตโนมัติ
        </p>

        <input
          type="text"
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className="mb-4 h-[63px] w-full rounded-[16px]
            border border-[#E3EAF6] bg-[#F6F9FF]
            px-4 text-[15px]
            focus:outline-none focus:ring-2 focus:ring-[#05CD99]"
        />

        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="mb-3 h-[63px] w-full rounded-[16px]
            border border-[#E3EAF6] bg-[#F4F7FE]
            px-4 text-[15px]
            focus:outline-none focus:ring-2 focus:ring-[#05CD99]"
        />

        {error && (
          <div className="mb-3 text-sm text-red-500">{error}</div>
        )}

        <label className="mb-6 flex items-center gap-2 text-[14px] text-[#8F9BBA]">
          <input
            type="checkbox"
            checked={remember}
            onChange={(e) => setRemember(e.target.checked)}
            className="h-[18px] w-[18px] accent-[#05CD99]"
          />
          จำชื่อผู้ใช้และรหัสผ่าน
        </label>

        <button
          onClick={handleLogin}
          className="h-[54px] w-full rounded-[16px]
            bg-gradient-to-r from-[#05CD99] to-[#00B884]
            text-[16px] font-semibold text-white
            shadow-[0_10px_30px_rgba(5,205,153,0.45)]
            transition hover:-translate-y-0.5"
        >
          เข้าสู่ระบบ
        </button>
      </div>
    </div>
  );
}
