"use client";

import { useEffect, useState } from "react";
import { Check, Moon, Sun } from "lucide-react";
import { cn } from "@/lib/utils";

type ThemeMode = "light" | "dark";

const storageKey = "bytech-theme";

export function ThemeController() {
  useEffect(() => {
    const savedTheme = window.localStorage.getItem(storageKey);
    const theme: ThemeMode = savedTheme === "dark" ? "dark" : "light";
    applyTheme(theme);
  }, []);

  return null;
}

export function ThemeMenuItems() {
  const [theme, setTheme] = useState<ThemeMode>("light");

  useEffect(() => {
    const savedTheme = window.localStorage.getItem(storageKey);
    const nextTheme: ThemeMode = savedTheme === "dark" ? "dark" : "light";
    setTheme(nextTheme);
    applyTheme(nextTheme);
  }, []);

  function updateTheme(nextTheme: ThemeMode) {
    setTheme(nextTheme);
    window.localStorage.setItem(storageKey, nextTheme);
    applyTheme(nextTheme);
  }

  return (
    <div className="grid grid-cols-2 gap-2 px-3 pb-2 pt-1">
      <button
        type="button"
        onClick={() => updateTheme("light")}
        className={themeButtonClass(theme === "light")}
      >
        <Sun className="size-4" />
        <span>Light</span>
        {theme === "light" ? <Check className="ml-auto size-3.5" /> : null}
      </button>

      <button
        type="button"
        onClick={() => updateTheme("dark")}
        className={themeButtonClass(theme === "dark")}
      >
        <Moon className="size-4" />
        <span>Dark</span>
        {theme === "dark" ? <Check className="ml-auto size-3.5" /> : null}
      </button>
    </div>
  );
}

function applyTheme(theme: ThemeMode) {
  document.documentElement.classList.toggle("dark", theme === "dark");
  document.documentElement.dataset.theme = theme;
}

function themeButtonClass(active: boolean) {
  return cn(
    "flex h-9 items-center gap-2 rounded-xl px-2.5 text-xs font-semibold transition",
    active
      ? "bg-[#4F46E5] text-white shadow-sm shadow-indigo-200"
      : "bg-[#F1F0FC] text-slate-600 hover:bg-indigo-100"
  );
}
