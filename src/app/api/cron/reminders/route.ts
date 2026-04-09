import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  const expected = `Bearer ${process.env.CRON_SECRET}`;

  if (!process.env.CRON_SECRET) {
    return NextResponse.json(
      { error: "CRON_SECRET is not configured" },
      { status: 500 }
    );
  }

  if (authHeader !== expected) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = await createClient();

  const { error: overdueError } = await supabase.rpc("mark_overdue_invoices");

  if (overdueError) {
    return NextResponse.json(
      {
        error: "Failed to mark overdue invoices",
        details: overdueError.message,
      },
      { status: 500 }
    );
  }

  const { data, error } = await supabase.rpc("generate_system_reminders");

  if (error) {
    return NextResponse.json(
      {
        error: "Failed to generate reminders",
        details: error.message,
      },
      { status: 500 }
    );
  }

  return NextResponse.json({
    success: true,
    result: data,
  });
}