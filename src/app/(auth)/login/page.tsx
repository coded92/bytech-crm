import { redirect } from "next/navigation";
import { LoginForm } from "@/components/forms/login-form";
import { getUser } from "@/lib/auth/get-user";

export default async function LoginPage() {
  const user = await getUser();

  if (user) {
    redirect("/dashboard");
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <div className="grid w-full max-w-6xl gap-8 lg:grid-cols-2">
        <div className="hidden rounded-3xl bg-slate-900 p-10 text-white lg:block">
          <div className="max-w-md">
            <p className="text-sm uppercase tracking-[0.2em] text-slate-300">
              BYTECH Digital Innovation
            </p>
            <h1 className="mt-6 text-4xl font-bold leading-tight">
              Internal CRM for sales, operations, and finance
            </h1>
            <p className="mt-4 text-slate-300">
              Manage leads, customers, quotations, invoices, receipts, tasks,
              payments, and daily reports in one place.
            </p>
          </div>
        </div>

        <div className="flex items-center justify-center">
          <LoginForm />
        </div>
      </div>
    </main>
  );
}