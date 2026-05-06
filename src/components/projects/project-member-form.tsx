"use client";

import { useFormStatus } from "react-dom";
import { addProjectMemberAction } from "@/lib/actions/projects";
import { Button } from "@/components/ui/button";

type StaffUser = {
  id: string;
  full_name: string;
};

type ProjectMemberFormProps = {
  projectId: string;
  staffUsers: StaffUser[];
};

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Adding..." : "Add Member"}
    </Button>
  );
}

export function ProjectMemberForm({
  projectId,
  staffUsers,
}: ProjectMemberFormProps) {
  const action = addProjectMemberAction.bind(null, projectId);

  return (
    <form
    action={async (formData) => {
        await action(formData);
    }}
    className="space-y-4"
    >
      <div>
        <label className="mb-2 block text-sm font-medium text-slate-700">
          Staff Member
        </label>

        <select
          name="user_id"
          required
          className="w-full rounded-xl border border-slate-300 px-3 py-2 outline-none focus:border-indigo-500"
          defaultValue=""
        >
          <option value="" disabled>
            Select staff
          </option>

          {staffUsers.map((user) => (
            <option key={user.id} value={user.id}>
              {user.full_name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium text-slate-700">
          Role
        </label>

        <input
          name="role"
          placeholder="Developer / Designer / Engineer / PM"
          className="w-full rounded-xl border border-slate-300 px-3 py-2 outline-none focus:border-indigo-500"
        />
      </div>

      <SubmitButton />
    </form>
  );
}