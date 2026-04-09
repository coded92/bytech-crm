"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth/require-admin";
import { createDeploymentSchema } from "@/lib/validations/deployment";
import type { Database } from "@/types/database";

type AdminProfile = {
  id: string;
  role: "admin" | "staff";
  full_name: string;
};

type BranchInsert = Database["public"]["Tables"]["customer_branches"]["Insert"];
type DeploymentInsert = Database["public"]["Tables"]["pos_deployments"]["Insert"];
type ActivityLogInsert = Database["public"]["Tables"]["activity_logs"]["Insert"];

type BranchInsertResult = {
  id: string;
};

type DeploymentInsertResult = {
  id: string;
};

export async function createDeploymentAction(formData: FormData) {
  const profile = (await requireAdmin()) as AdminProfile;
  const supabase = await createClient();

  const parsed = createDeploymentSchema.safeParse({
    customer_id: formData.get("customer_id"),
    branch_name: formData.get("branch_name"),
    contact_person: formData.get("contact_person") || undefined,
    phone: formData.get("phone") || undefined,
    address: formData.get("address") || undefined,
    city: formData.get("city") || undefined,
    state: formData.get("state") || undefined,
    deployment_type: formData.get("deployment_type"),
    terminal_count: formData.get("terminal_count"),
    deployment_status: formData.get("deployment_status"),
    deployed_by: formData.get("deployed_by") || undefined,
    install_date: formData.get("install_date") || undefined,
    go_live_date: formData.get("go_live_date") || undefined,
    notes: formData.get("notes") || undefined,
  });

  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? "Invalid deployment data",
    };
  }

  const values = parsed.data;

  const branchPayload: BranchInsert = {
    customer_id: values.customer_id,
    branch_name: values.branch_name,
    contact_person: values.contact_person || null,
    phone: values.phone || null,
    address: values.address || null,
    city: values.city || null,
    state: values.state || null,
    is_active: true,
  };

  const { data: branchData, error: branchError } = await supabase
    .from("customer_branches")
    .insert(branchPayload as never)
    .select("id")
    .single();

  if (branchError || !branchData) {
    return { error: branchError?.message ?? "Failed to create branch" };
  }

  const branch = branchData as BranchInsertResult;

  const deploymentPayload: DeploymentInsert = {
    customer_id: values.customer_id,
    branch_id: branch.id,
    deployment_type: values.deployment_type,
    terminal_count: values.terminal_count,
    deployment_status: values.deployment_status,
    deployed_by: values.deployed_by || null,
    install_date: values.install_date || null,
    go_live_date: values.go_live_date || null,
    notes: values.notes || null,
    created_by: profile.id,
  };

  const { data: deploymentData, error: deploymentError } = await supabase
    .from("pos_deployments")
    .insert(deploymentPayload as never)
    .select("id")
    .single();

  if (deploymentError || !deploymentData) {
    return {
      error: deploymentError?.message ?? "Failed to create deployment",
    };
  }

  const deployment = deploymentData as DeploymentInsertResult;

  const activityPayload: ActivityLogInsert = {
    actor_id: profile.id,
    entity_type: "deployment",
    entity_id: deployment.id,
    action: "created",
    description: "Created POS deployment record",
  };

  await supabase.from("activity_logs").insert(activityPayload as never);

  revalidatePath("/deployments");
  redirect(`/deployments/${deployment.id}`);
}