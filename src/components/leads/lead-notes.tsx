"use client";

import { useState, useTransition } from "react";
import { addLeadNoteAction } from "@/lib/actions/leads";
import { formatDateTime } from "@/lib/utils/format-date";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

type LeadNote = {
  id: string;
  note: string;
  note_type: "call" | "meeting" | "whatsapp" | "email" | "general";
  follow_up_date: string | null;
  created_at: string;
  created_by_profile?: {
    full_name: string | null;
  } | null;
};

type LeadNotesProps = {
  leadId: string;
  notes: LeadNote[];
};

export function LeadNotes({ leadId, notes }: LeadNotesProps) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  return (
    <Card>
      <CardHeader>
        <CardTitle>Notes & Follow-ups</CardTitle>
      </CardHeader>

      <CardContent className="space-y-6">
        <form
          action={(formData) => {
            setError("");
            setSuccess("");

            startTransition(async () => {
              const result = await addLeadNoteAction(leadId, formData);

              const errorMessage = "error" in result ? result.error : null;

              if (errorMessage) {
                setError(errorMessage);
                return;
              }

              setSuccess("Note added successfully.");
            });
          }}
          className="space-y-4"
        >
          <div className="space-y-2">
            <Label htmlFor="note">Note</Label>
            <Textarea id="note" name="note" required />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="note_type">Note Type</Label>
              <select
                id="note_type"
                name="note_type"
                defaultValue="general"
                className="flex h-10 w-full rounded-md border border-slate-200 bg-background px-3 py-2 text-sm"
              >
                <option value="general">General</option>
                <option value="call">Call</option>
                <option value="meeting">Meeting</option>
                <option value="whatsapp">WhatsApp</option>
                <option value="email">Email</option>
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="follow_up_date">Follow-up Date</Label>
              <input
                id="follow_up_date"
                name="follow_up_date"
                type="datetime-local"
                className="flex h-10 w-full rounded-md border border-slate-200 bg-background px-3 py-2 text-sm"
              />
            </div>
          </div>

          {error ? (
            <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">
              {error}
            </div>
          ) : null}

          {success ? (
            <div className="rounded-md border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-600">
              {success}
            </div>
          ) : null}

          <Button type="submit" disabled={isPending}>
            {isPending ? "Saving..." : "Add Note"}
          </Button>
        </form>

        <div className="space-y-4">
          {notes.length === 0 ? (
            <div className="rounded-lg border border-dashed border-slate-200 p-6 text-sm text-slate-500">
              No notes yet.
            </div>
          ) : (
            notes.map((note) => (
              <div key={note.id} className="rounded-xl border border-slate-200 p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm font-medium capitalize text-slate-900">
                    {note.note_type}
                  </p>
                  <p className="text-xs text-slate-500">
                    {formatDateTime(note.created_at)}
                  </p>
                </div>

                <p className="mt-2 whitespace-pre-wrap text-sm text-slate-700">
                  {note.note}
                </p>

                <div className="mt-3 flex flex-wrap gap-4 text-xs text-slate-500">
                  <span>
                    By: {note.created_by_profile?.full_name || "Unknown user"}
                  </span>
                  <span>
                    Follow-up: {note.follow_up_date ? formatDateTime(note.follow_up_date) : "-"}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}