"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import {
  Eye,
  EyeOff,
  LockKeyhole,
  Mail,
  ShieldCheck,
} from "lucide-react";
import { signInAction } from "@/lib/actions/auth";

type LoginState = {
  error?: string;
};

const initialState: LoginState = {};

export function LoginForm() {
  const [state, formAction] = useActionState(signInAction, initialState);
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(true);

  return (
    <div className="w-full max-w-[760px] rounded-[1.5rem] border border-slate-200/80 bg-white/95 px-8 py-10 shadow-2xl shadow-slate-200/80 backdrop-blur sm:px-12 lg:px-14">
      <div className="text-center">
        <div className="mx-auto flex size-20 items-center justify-center rounded-[1.35rem] bg-gradient-to-br from-indigo-200 via-indigo-500 to-violet-700 text-4xl font-black text-white shadow-xl shadow-indigo-200">
          B
        </div>
        <h1 className="mt-7 text-3xl font-black tracking-tight text-[#070A2A]">
          Welcome back!
        </h1>
        <p className="mt-3 text-base font-medium text-[#4A5480]">
          Sign in to access your BYTECH CRM account
        </p>
      </div>

      <form action={formAction} className="mt-10 space-y-6">
        <div className="space-y-2">
          <label
            htmlFor="email"
            className="text-sm font-extrabold text-[#080B2F]"
          >
            Email address
          </label>
          <div className="flex h-14 items-center gap-3 rounded-xl border border-[#CAD3EA] bg-white px-4 shadow-sm transition focus-within:border-[#4F46E5] focus-within:ring-4 focus-within:ring-indigo-100">
            <Mail className="size-5 shrink-0 text-[#59658D]" />
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              placeholder="Enter your email address"
              className="h-full min-w-0 flex-1 bg-transparent text-base font-medium text-[#111827] outline-none placeholder:text-[#69749E]"
              required
            />
          </div>
        </div>

        <div className="space-y-2">
          <label
            htmlFor="password"
            className="text-sm font-extrabold text-[#080B2F]"
          >
            Password
          </label>
          <div className="flex h-14 items-center gap-3 rounded-xl border border-[#CAD3EA] bg-white px-4 shadow-sm transition focus-within:border-[#4F46E5] focus-within:ring-4 focus-within:ring-indigo-100">
            <LockKeyhole className="size-5 shrink-0 text-[#59658D]" />
            <input
              id="password"
              name="password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              placeholder="Enter your password"
              className="h-full min-w-0 flex-1 bg-transparent text-base font-medium text-[#111827] outline-none placeholder:text-[#69749E]"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword((value) => !value)}
              className="flex size-9 shrink-0 items-center justify-center rounded-lg text-[#59658D] transition hover:bg-slate-50 hover:text-[#4F46E5]"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? (
                <EyeOff className="size-5" />
              ) : (
                <Eye className="size-5" />
              )}
            </button>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <label className="flex items-center gap-3 text-sm font-medium text-[#252B55]">
            <button
              type="button"
              onClick={() => setRemember((value) => !value)}
              className="flex size-6 items-center justify-center rounded-md border border-[#4F46E5] bg-[#4F46E5] text-white shadow-sm shadow-indigo-200 data-[checked=false]:bg-white data-[checked=false]:text-transparent"
              data-checked={remember}
              aria-pressed={remember}
            >
              <span className="text-base leading-none">✓</span>
            </button>
            Remember me
          </label>

          <a
            href="mailto:support@bytech.com?subject=Password%20reset%20request"
            className="text-sm font-semibold text-[#3B13FF] hover:underline"
          >
            Forgot password?
          </a>
        </div>

        {state?.error ? (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
            {state.error}
          </div>
        ) : null}

        <SubmitButton />

        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-6 text-sm font-medium text-[#4A5480]">
          <span className="h-px bg-slate-200" />
          <span>or</span>
          <span className="h-px bg-slate-200" />
        </div>

        <div className="rounded-xl border border-[#D7DDF0] bg-gradient-to-r from-white to-indigo-50/50 p-5">
          <div className="flex items-center gap-4">
            <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-indigo-100 text-[#4F46E5]">
              <ShieldCheck className="size-6" />
            </span>
            <div>
              <p className="text-base font-black text-[#080B2F]">
                Secure Access
              </p>
              <p className="mt-1 text-sm font-medium text-[#4A5480]">
                All connections are encrypted and your data is safe with us.
              </p>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="flex h-14 w-full items-center justify-center gap-3 rounded-xl bg-gradient-to-r from-[#4F00FF] to-[#3B13FF] text-base font-extrabold text-white shadow-xl shadow-indigo-200 transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-70"
    >
      <LockKeyhole className="size-5" />
      {pending ? "Signing in..." : "Sign In"}
    </button>
  );
}
