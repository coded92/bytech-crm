import { createClient } from "@/lib/supabase/server";
import type { ActivityEntityType } from "@/lib/logs/entity-types";

type WriteActivityLogInput = {
  actorId?: string | null;
  entityType: ActivityEntityType;
  entityId?: string | null;
  action: string;
  description?: string | null;
};

export async function writeActivityLog({
  actorId,
  entityType,
  entityId,
  action,
  description,
}: WriteActivityLogInput) {
  try {
    const supabase = await createClient();

    const { error } = await (supabase as any).from("activity_logs").insert({
      actor_id: actorId ?? null,
      entity_type: entityType,
      entity_id: entityId ?? null,
      action,
      description: description ?? null,
    });

    if (error) {
      console.error("Failed to write activity log:", error.message);
      return { success: false as const, error: error.message };
    }

    return { success: true as const };
  } catch (error) {
    console.error("Unexpected activity log error:", error);
    return { success: false as const, error: "Unexpected logging error" };
  }
}