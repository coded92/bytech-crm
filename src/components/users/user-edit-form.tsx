"use client";

import { useState, useTransition } from "react";
import { sendPasswordResetAction, updateUserAction } from "@/lib/actions/users";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type UserEditFormProps = {
  user: {
    id: string;
    full_name: string;
    email: string | null;
    role: "admin" | "staff";
    job_title: string | null;
    phone: string | null;
    is_active: boolean;
  };
};

export function UserEditForm({ user }: UserEditFormProps) {
  const [isPending, startTransition] = useTransition();
  const [isResetPending, startResetTransition] = useTransition();
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  return (
    <Card>
      <CardHeader>
        <CardTitle>Edit User</CardTitle>
        <CardDescription>
          Update role, contact details, and account status.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        <form
          action={(formData) => {
            setError("");
            setMessage("");

            startTransition(async () => {
              const result = await updateUserAction(user.id, formData);

              if ("error" in result) {
                setError(result.error);
                return;
              }

              setMessage("User updated successfully.");
            });
          }}
          className="space-y-6"
        >
          <fieldset disabled={isPending} className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="full_name">Full Name</Label>
                <Input
                  id="full_name"
                  name="full_name"
                  defaultValue={user.full_name}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  defaultValue={user.email ?? ""}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="role">Role</Label>
                <select
                  id="role"
                  name="role"
                  defaultValue={user.role}
                  className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm"
                >
                  <option value="staff">Staff</option>
                  <option value="admin">Admin</option>
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="is_active">Account Status</Label>
                <select
                  id="is_active"
                  name="is_active"
                  defaultValue={user.is_active ? "true" : "false"}
                  className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm"
                >
                  <option value="true">Active</option>
                  <option value="false">Inactive</option>
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="job_title">Job Title</Label>
                <Input
                  id="job_title"
                  name="job_title"
                  defaultValue={user.job_title ?? ""}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  name="phone"
                  defaultValue={user.phone ?? ""}
                />
              </div>
            </div>

            {error ? (
              <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">
                {error}
              </div>
            ) : null}

            {message ? (
              <div className="rounded-md border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-600">
                {message}
              </div>
            ) : null}

            <Button type="submit" disabled={isPending}>
              {isPending ? "Saving..." : "Save Changes"}
            </Button>
          </fieldset>
        </form>

        <div className="border-t border-slate-200 pt-6">
          <h3 className="text-sm font-semibold text-slate-900">Password Reset</h3>
          <p className="mt-1 text-sm text-slate-500">
            Send a password reset email to this user.
          </p>

          <div className="mt-4">
            <Button
              type="button"
              variant="outline"
              disabled={isResetPending || !user.email}
              onClick={() => {
                const email = user.email;
                if (!email) return;

                setError("");
                setMessage("");

                startResetTransition(async () => {
                  const result = await sendPasswordResetAction(email);

                  if ("error" in result) {
                    setError(result.error);
                    return;
                  }

                  setMessage("Password reset email sent successfully.");
                });
              }}
            >
              {isResetPending ? "Sending..." : "Send Password Reset Email"}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}