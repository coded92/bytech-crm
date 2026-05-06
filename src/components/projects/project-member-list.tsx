"use client";

import { Badge } from "@/components/ui/badge";

type Member = {
  id: string;
  role: string | null;
  staff: {
    full_name: string | null;
  } | null;
};

type ProjectMemberListProps = {
  members: Member[];
};

export function ProjectMemberList({
  members,
}: ProjectMemberListProps) {
  if (members.length === 0) {
    return (
      <div className="text-sm text-slate-500">
        No team members added yet.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {members.map((member) => (
        <div
          key={member.id}
          className="flex items-center justify-between rounded-xl border border-slate-200 p-4"
        >
          <div>
            <p className="font-medium text-slate-900">
              {member.staff?.full_name || "-"}
            </p>

            <p className="mt-1 text-xs text-slate-500">
              Team member
            </p>
          </div>

          <Badge variant="outline" className="capitalize">
            {member.role || "Member"}
          </Badge>
        </div>
      ))}
    </div>
  );
}