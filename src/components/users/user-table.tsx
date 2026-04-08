import Link from "next/link";

type UserRow = {
  id: string;
  full_name: string;
  email: string | null;
  role: "admin" | "staff";
  job_title: string | null;
  phone: string | null;
  is_active: boolean;
  created_at: string;
};

export function UserTable({ users }: { users: UserRow[] }) {
  if (users.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-slate-200 bg-white p-10 text-center text-sm text-slate-500">
        No users found.
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-500">
                Name
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-500">
                Email
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-500">
                Role
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-500">
                Job Title
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-500">
                Status
              </th>
              <th className="px-4 py-3 text-right text-xs font-semibold uppercase text-slate-500">
                Action
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100">
            {users.map((user) => (
              <tr key={user.id}>
                <td className="px-4 py-4 text-sm font-medium text-slate-900">
                  {user.full_name}
                </td>
                <td className="px-4 py-4 text-sm text-slate-600">
                  {user.email ?? "-"}
                </td>
                <td className="px-4 py-4 text-sm capitalize text-slate-600">
                  {user.role}
                </td>
                <td className="px-4 py-4 text-sm text-slate-600">
                  {user.job_title ?? "-"}
                </td>
                <td className="px-4 py-4 text-sm">
                  {user.is_active ? (
                    <span className="rounded-full bg-green-100 px-2 py-1 text-green-700">
                      Active
                    </span>
                  ) : (
                    <span className="rounded-full bg-red-100 px-2 py-1 text-red-700">
                      Inactive
                    </span>
                  )}
                </td>
                <td className="px-4 py-4 text-right">
                  <Link
                    href={`/users/${user.id}`}
                    className="text-sm font-medium text-slate-900 underline underline-offset-4"
                  >
                    View
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}