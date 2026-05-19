import { redirect } from "next/navigation";
import { requireProfile } from "@/lib/auth/require-profile";

export default async function SettingsProfilePage() {
  const profile = await requireProfile();
  redirect(`/users/${profile.id}`);
}
