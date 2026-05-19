import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth/require-admin";

export default async function UsersIndexRedirectPage() {
  await requireAdmin();
  redirect("/team-management?tab=members");
}
