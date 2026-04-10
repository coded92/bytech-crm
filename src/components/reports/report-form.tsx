"use client";

import { useState, useTransition } from "react";
import { createDailyReportAction } from "@/lib/actions/reports";
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
import { Textarea } from "@/components/ui/textarea";

type ReportFormProps = {
  defaultDate: string;
};

export function ReportForm({ defaultDate }: ReportFormProps) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");

  return (
    <Card>
      <CardHeader>
        <CardTitle>Submit Daily Report</CardTitle>
        <CardDescription>
          Record your work done, blockers, and plan for the next day.
        </CardDescription>
      </CardHeader>

      <CardContent>
        <form
          action={(formData) => {
            setError("");

            startTransition(async () => {
              const result = await createDailyReportAction(formData);

              if ("error" in result) {
                setError(result.error);
              }
            });
          }}
          className="space-y-6"
        >
          <fieldset disabled={isPending} className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="report_date">Report Date</Label>
                <Input
                  id="report_date"
                  name="report_date"
                  type="date"
                  defaultValue={defaultDate}
                  required
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="tasks_completed_count">Tasks</Label>
                  <Input
                    id="tasks_completed_count"
                    name="tasks_completed_count"
                    type="number"
                    min="0"
                    defaultValue="0"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="leads_contacted_count">Leads</Label>
                  <Input
                    id="leads_contacted_count"
                    name="leads_contacted_count"
                    type="number"
                    min="0"
                    defaultValue="0"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="customers_supported_count">Support</Label>
                  <Input
                    id="customers_supported_count"
                    name="customers_supported_count"
                    type="number"
                    min="0"
                    defaultValue="0"
                  />
                </div>
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="summary">Summary of Work Done</Label>
                <Textarea
                  id="summary"
                  name="summary"
                  rows={5}
                  placeholder="Summarize the tasks completed, meetings held, follow-ups, support work, and key updates."
                  required
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="blockers">Blockers / Challenges</Label>
                <Textarea
                  id="blockers"
                  name="blockers"
                  rows={4}
                  placeholder="List any blockers, delays, or support needed."
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="next_day_plan">Next Day Plan</Label>
                <Textarea
                  id="next_day_plan"
                  name="next_day_plan"
                  rows={4}
                  placeholder="What will you work on next?"
                />
              </div>
            </div>

            {error ? (
              <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">
                {error}
              </div>
            ) : null}

            <Button type="submit" disabled={isPending}>
              {isPending ? "Submitting..." : "Submit Report"}
            </Button>
          </fieldset>
        </form>
      </CardContent>
    </Card>
  );
}