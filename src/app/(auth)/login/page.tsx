import { redirect } from "next/navigation";
import {
  BarChart3,
  CheckSquare,
  Globe2,
  LockKeyhole,
  Moon,
  PieChart,
  UsersRound,
} from "lucide-react";
import { LoginForm } from "@/components/forms/login-form";
import { getUser } from "@/lib/auth/get-user";

const featureItems = [
  {
    title: "Customer Management",
    description: "Organize leads, customers, and interactions all in one place.",
    icon: UsersRound,
  },
  {
    title: "Sales Tracking",
    description: "Track your pipeline and close deals faster with insights.",
    icon: BarChart3,
  },
  {
    title: "Task & Activity Management",
    description: "Stay on top of tasks, follow-ups, and team activities.",
    icon: CheckSquare,
  },
  {
    title: "Powerful Reports",
    description: "Make data-driven decisions with beautiful reports.",
    icon: PieChart,
  },
];

export default async function LoginPage() {
  const user = await getUser();

  if (user) {
    redirect("/dashboard");
  }

  return (
    <main className="grid min-h-screen bg-white lg:grid-cols-[0.65fr_1fr]">
      <section className="relative hidden min-h-screen overflow-hidden bg-[#030622] px-14 py-20 text-white lg:flex lg:flex-col">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_40%,rgba(79,0,255,0.45),transparent_34%),linear-gradient(135deg,#030622_0%,#07003F_48%,#4A00D7_100%)]" />
        <div className="absolute -bottom-28 -right-24 h-[26rem] w-[42rem] rotate-[-12deg] rounded-[50%] border border-violet-400/20 bg-[radial-gradient(circle,rgba(124,58,237,0.18),transparent_60%)]" />
        <div className="absolute bottom-0 right-0 h-80 w-[38rem] bg-[radial-gradient(circle_at_30%_30%,rgba(139,92,246,0.42)_1px,transparent_1.5px)] [background-size:10px_10px] opacity-45" />

        <div className="relative z-10 flex h-full flex-col">
          <div className="flex items-center gap-4">
            <div className="flex size-16 items-center justify-center rounded-[1.25rem] bg-gradient-to-br from-indigo-200 via-indigo-500 to-violet-700 text-3xl font-black text-white shadow-xl shadow-indigo-950">
              B
            </div>
            <div className="text-3xl font-black tracking-tight">
              BYTECH <span className="text-[#7C3BFF]">CRM</span>
            </div>
          </div>

          <div className="mt-24 max-w-xl">
            <h1 className="text-5xl font-black leading-tight tracking-tight">
              Manage Relationships.
              <br />
              <span className="text-[#7C3BFF]">Drive Growth.</span>
            </h1>
            <p className="mt-8 max-w-lg text-xl font-medium leading-9 text-white/86">
              BYTECH CRM helps you streamline your sales, manage customers, and
              grow your business from one powerful platform.
            </p>
          </div>

          <div className="mt-12 space-y-10">
            {featureItems.map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.title} className="flex max-w-lg gap-6">
                  <div className="flex size-16 shrink-0 items-center justify-center rounded-full border border-violet-400/20 bg-violet-800/45 text-[#8C5CFF] shadow-lg shadow-violet-950/40">
                    <Icon className="size-8" />
                  </div>
                  <div>
                    <h2 className="text-lg font-black">{item.title}</h2>
                    <p className="mt-2 text-base font-medium leading-7 text-white/86">
                      {item.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          <p className="relative z-10 mt-auto border-t border-white/15 pt-12 text-sm font-medium text-white/90">
            &copy; 2025 BYTECH Solutions. All rights reserved.
          </p>
        </div>
      </section>

      <section className="relative flex min-h-screen flex-col bg-[#FBFCFF] px-5 py-6 sm:px-8 lg:px-12">
        <div className="absolute right-6 top-6 flex items-center gap-4">
          <button
            type="button"
            className="hidden h-12 w-20 items-center justify-center rounded-xl border border-[#CBD4EA] bg-white text-[#3312FF] shadow-sm transition hover:bg-indigo-50 sm:flex"
            aria-label="Theme"
          >
            <Moon className="size-5" />
          </button>
          <button
            type="button"
            className="hidden h-12 items-center gap-3 rounded-xl border border-[#CBD4EA] bg-white px-5 text-base font-bold text-[#10163A] shadow-sm sm:flex"
            aria-label="Language"
          >
            <Globe2 className="size-5" />
            English
            <span className="text-slate-500">⌄</span>
          </button>
        </div>

        <div className="flex flex-1 items-center justify-center py-16">
          <LoginForm />
        </div>

        <div className="space-y-12 pb-4 text-center">
          <p className="flex items-center justify-center gap-3 text-sm font-medium text-[#4A5480]">
            <LockKeyhole className="size-4" />
            Protected by industry-standard security
          </p>

          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-3 text-sm font-medium text-[#4A5480]">
            <a href="mailto:support@bytech.com" className="hover:text-[#4F46E5]">
              Privacy Policy
            </a>
            <span>•</span>
            <a href="mailto:support@bytech.com" className="hover:text-[#4F46E5]">
              Terms of Service
            </a>
            <span>•</span>
            <a href="mailto:support@bytech.com" className="hover:text-[#4F46E5]">
              Support
            </a>
            <span className="ml-auto hidden lg:inline">v2.0.0</span>
          </div>
        </div>
      </section>
    </main>
  );
}
