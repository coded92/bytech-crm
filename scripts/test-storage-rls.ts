import { createClient } from "@supabase/supabase-js";

type UploadExpectation = {
  label: string;
  bucket: string;
  path: string;
  shouldPass: boolean;
};

type TestResult = {
  label: string;
  passed: boolean;
  expected: string;
  actual: string;
};

type StorageTestClient = {
  storage: ReturnType<typeof createClient>["storage"];
};

const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL;
const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? process.env.SUPABASE_ANON_KEY;
const testEmail = process.env.BYTECH_STORAGE_TEST_EMAIL;
const testPassword = process.env.BYTECH_STORAGE_TEST_PASSWORD;

const deniedReadBucket =
  process.env.BYTECH_STORAGE_DENIED_READ_BUCKET ?? "payment-proofs";
const deniedReadPath =
  process.env.BYTECH_STORAGE_DENIED_READ_PATH ??
  "receipts/00000000-0000-0000-0000-000000000000/denied-test.png";

const allowedModule = process.env.BYTECH_STORAGE_ALLOWED_MODULE ?? "field_jobs";
const allowedUploadBucket =
  process.env.BYTECH_STORAGE_ALLOWED_UPLOAD_BUCKET ?? "attachments";
const allowedUploadPrefix =
  process.env.BYTECH_STORAGE_ALLOWED_UPLOAD_PREFIX ?? "field-jobs";

const testRunId = `${Date.now()}-${Math.random().toString(36).slice(2)}`;

function requireEnv(name: string, value: string | undefined): string {
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

function tinyPng() {
  return new Blob(
    [
      Buffer.from(
        "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/p9sAAAAASUVORK5CYII=",
        "base64"
      ),
    ],
    { type: "image/png" }
  );
}

function hasModuleAccess(profile: unknown, moduleName: string) {
  const row = profile as
    | { role?: string | null; allowed_modules?: string[] | null }
    | null;

  if (!row) return false;
  if (row.role === "admin") return true;

  return Array.isArray(row.allowed_modules)
    ? row.allowed_modules.includes(moduleName)
    : false;
}

function printResult(result: TestResult) {
  const status = result.passed ? "PASS" : "FAIL";
  console.log(`${status} ${result.label}`);
  console.log(`  expected: ${result.expected}`);
  console.log(`  actual:   ${result.actual}`);
}

async function attemptUpload(
  supabase: StorageTestClient,
  test: UploadExpectation
): Promise<TestResult> {
  const { error } = await supabase.storage
    .from(test.bucket)
    .upload(test.path, tinyPng(), {
      contentType: "image/png",
      upsert: false,
    });

  const uploadPassed = !error;

  if (uploadPassed) {
    const { error: cleanupError } = await supabase.storage
      .from(test.bucket)
      .remove([test.path]);

    if (cleanupError) {
      console.warn(
        `WARN cleanup failed for ${test.bucket}/${test.path}: ${cleanupError.message}`
      );
    }
  }

  return {
    label: test.label,
    passed: uploadPassed === test.shouldPass,
    expected: test.shouldPass ? "upload allowed" : "upload denied",
    actual: uploadPassed ? "upload allowed" : `upload denied: ${error.message}`,
  };
}

async function attemptDeniedRead(
  supabase: StorageTestClient
): Promise<TestResult> {
  const { error } = await supabase.storage
    .from(deniedReadBucket)
    .download(deniedReadPath);

  return {
    label: `Read/download unauthorized object: ${deniedReadBucket}/${deniedReadPath}`,
    passed: Boolean(error),
    expected: "download denied",
    actual: error ? `download denied: ${error.message}` : "download allowed",
  };
}

async function main() {
  const url = requireEnv("NEXT_PUBLIC_SUPABASE_URL or SUPABASE_URL", supabaseUrl);
  const anonKey = requireEnv(
    "NEXT_PUBLIC_SUPABASE_ANON_KEY or SUPABASE_ANON_KEY",
    supabaseAnonKey
  );
  const email = requireEnv("BYTECH_STORAGE_TEST_EMAIL", testEmail);
  const password = requireEnv("BYTECH_STORAGE_TEST_PASSWORD", testPassword);

  const supabase = createClient(url, anonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });

  const { data: authData, error: authError } =
    await supabase.auth.signInWithPassword({
      email,
      password,
    });

  if (authError || !authData.user) {
    throw new Error(authError?.message ?? "Login failed");
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id, role, allowed_modules")
    .eq("id", authData.user.id)
    .maybeSingle();

  if (profileError) {
    throw new Error(`Could not read test profile: ${profileError.message}`);
  }

  const allowedPath = `${allowedUploadPrefix}/${testRunId}.png`;
  const shouldAllowedUploadPass = hasModuleAccess(profile, allowedModule);

  console.log("BYTECH CRM Storage RLS Test");
  console.log(`User: ${email}`);
  console.log(
    `Profile role/modules: ${JSON.stringify({
      role: (profile as { role?: string | null } | null)?.role ?? null,
      allowed_modules:
        (profile as { allowed_modules?: string[] | null } | null)
          ?.allowed_modules ?? [],
    })}`
  );
  console.log("");

  const uploadTests: UploadExpectation[] = [
    {
      label: "Upload to branding/company-logo/test.png",
      bucket: "branding",
      path: `company-logo/storage-rls-${testRunId}.png`,
      shouldPass: hasModuleAccess(profile, "settings"),
    },
    {
      label: "Upload to site/test.png",
      bucket: "site",
      path: `storage-rls-${testRunId}.png`,
      shouldPass: hasModuleAccess(profile, "settings"),
    },
    {
      label: "Upload to attachments/invalid/test.png",
      bucket: "attachments",
      path: `invalid/storage-rls-${testRunId}.png`,
      shouldPass: false,
    },
    {
      label: "Upload to payment-proofs/invalid/test.png",
      bucket: "payment-proofs",
      path: `invalid/storage-rls-${testRunId}.png`,
      shouldPass: false,
    },
    {
      label: `Upload to allowed module path: ${allowedUploadBucket}/${allowedPath}`,
      bucket: allowedUploadBucket,
      path: allowedPath,
      shouldPass: shouldAllowedUploadPass,
    },
  ];

  const results: TestResult[] = [];

  for (const test of uploadTests) {
    results.push(await attemptUpload(supabase, test));
  }

  results.push(await attemptDeniedRead(supabase));

  for (const result of results) {
    printResult(result);
  }

  const failures = results.filter((result) => !result.passed);

  console.log("");

  if (failures.length > 0) {
    console.error(`${failures.length} storage RLS check(s) failed.`);
    process.exitCode = 1;
    return;
  }

  console.log("All storage RLS checks passed.");
}

main().catch((error) => {
  console.error("Storage RLS test crashed.");
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
