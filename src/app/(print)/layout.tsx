import { Sidebar } from "@/components/shared/sidebar";
import { Header } from "@/components/shared/header";
import { requireProfile } from "@/lib/auth/require-profile";

export default async function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const profile = await requireProfile();

  return (
    <div className="min-h-screen bg-slate-50 sm:flex">
      <Sidebar role={profile.role} />

      <div className="flex min-h-screen flex-1 flex-col">
        <Header fullName={profile.full_name} role={profile.role} />
        <main className="flex-1 bg-gradient-to-br from-slate-50 to-slate-100/40 p-3 sm:p-4 md:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}