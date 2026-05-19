import { redirect } from "next/navigation";

type PageProps = {
  searchParams?: Promise<{
    tab?: string;
    invite?: string;
  }>;
};

export default async function TeamPage({ searchParams }: PageProps) {
  const params = (await searchParams) || {};
  const query = new URLSearchParams();

  if (params.tab) query.set("tab", params.tab);
  if (params.invite) query.set("invite", params.invite);

  redirect(`/team-management${query.size > 0 ? `?${query.toString()}` : ""}`);
}
