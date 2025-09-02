// scripts/clear-supabase.mjs
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
dotenv.config();

const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!url || !serviceKey) {
  console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY env vars.");
  console.error(
    "Make sure you have SUPABASE_SERVICE_ROLE_KEY set in your .env file for admin operations."
  );
  process.exit(1);
}

if (!process.argv.includes("--yes")) {
  console.error("Refusing to run. Pass --yes to confirm destructive wipe.");
  console.error(
    "This will DELETE ALL data, users, and storage from your Supabase project!"
  );
  console.error("Usage: node scripts/clear-supabase.mjs --yes");
  process.exit(1);
}

const supabase = createClient(url, serviceKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

async function deleteAll(table) {
  const { error } = await supabase.from(table).delete().not("id", "is", null);
  if (error && error.code !== "PGRST116")
    throw new Error(`${table}: ${error.message}`);
  console.log(`Cleared table: ${table}`);
}

async function clearAllStorageBuckets() {
  console.log("Clearing all storage buckets...");

  // Get list of all buckets
  const { data: buckets, error: bucketsError } =
    await supabase.storage.listBuckets();
  if (bucketsError) {
    throw new Error(`Failed to list storage buckets: ${bucketsError.message}`);
  }

  if (!buckets || buckets.length === 0) {
    console.log("No storage buckets found.");
    return;
  }

  for (const bucket of buckets) {
    try {
      console.log(`Processing bucket: ${bucket.name}`);

      // List all files in the bucket (recursively)
      const { data: files, error: listError } = await supabase.storage
        .from(bucket.name)
        .list("", { limit: 1000, sortBy: { column: "name", order: "asc" } });

      if (listError) {
        console.warn(
          `Failed to list files in bucket '${bucket.name}': ${listError.message}`
        );
        continue;
      }

      if (!files || files.length === 0) {
        console.log(`Bucket '${bucket.name}' is already empty.`);
        continue;
      }

      // Recursively collect all file paths
      const allFiles = await getAllFilesInBucket(bucket.name, "");

      if (allFiles.length === 0) {
        console.log(`No files found in bucket '${bucket.name}'.`);
        continue;
      }

      // Delete files in batches to avoid hitting limits
      const batchSize = 100;
      for (let i = 0; i < allFiles.length; i += batchSize) {
        const batch = allFiles.slice(i, i + batchSize);
        const { error: removeError } = await supabase.storage
          .from(bucket.name)
          .remove(batch);

        if (removeError) {
          console.warn(
            `Failed to remove some files from bucket '${bucket.name}': ${removeError.message}`
          );
        } else {
          console.log(
            `Removed ${batch.length} files from bucket '${bucket.name}'`
          );
        }
      }

      console.log(
        `Cleared bucket '${bucket.name}' (${allFiles.length} files total)`
      );
    } catch (error) {
      console.warn(
        `Error processing bucket '${bucket.name}': ${error.message}`
      );
    }
  }
}

async function getAllFilesInBucket(bucketName, path = "") {
  const allFiles = [];

  const { data: items, error } = await supabase.storage
    .from(bucketName)
    .list(path, { limit: 1000, sortBy: { column: "name", order: "asc" } });

  if (error) {
    throw new Error(`Failed to list files in path '${path}': ${error.message}`);
  }

  for (const item of items || []) {
    const fullPath = path ? `${path}/${item.name}` : item.name;

    if (item.metadata && item.metadata.size !== undefined) {
      // This is a file
      allFiles.push(fullPath);
    } else {
      // This might be a folder, recurse into it
      try {
        const subFiles = await getAllFilesInBucket(bucketName, fullPath);
        allFiles.push(...subFiles);
      } catch (subError) {
        // If recursion fails, treat as a file
        allFiles.push(fullPath);
      }
    }
  }

  return allFiles;
}

async function clearAllAuthUsers() {
  console.log("Clearing all authentication users...");

  try {
    // Get all users using the admin API
    const {
      data: { users },
      error: listError,
    } = await supabase.auth.admin.listUsers();

    if (listError) {
      throw new Error(`Failed to list users: ${listError.message}`);
    }

    if (!users || users.length === 0) {
      console.log("No users found.");
      return;
    }

    console.log(`Found ${users.length} users to delete.`);

    // Delete users in batches
    let deletedCount = 0;
    for (const user of users) {
      try {
        const { error: deleteError } = await supabase.auth.admin.deleteUser(
          user.id
        );
        if (deleteError) {
          console.warn(
            `Failed to delete user ${user.id} (${user.email}): ${deleteError.message}`
          );
        } else {
          deletedCount++;
        }
      } catch (error) {
        console.warn(`Error deleting user ${user.id}: ${error.message}`);
      }
    }

    console.log(`Deleted ${deletedCount} out of ${users.length} users.`);
  } catch (error) {
    console.warn(`⚠️  Failed to clear auth users: ${error.message}`);
    console.warn("Continuing with storage and database clearing...");
  }
}

async function main() {
  try {
    console.log("🚨 DESTRUCTIVE OPERATION: Wiping entire Supabase project");
    console.log("This will delete ALL data, users, and storage files!");
    console.log("─".repeat(60));
    console.time("clear-supabase");

    // 1) Clear all authentication users first (optional - requires service role key)
    console.log("\n📋 Step 1: Clearing authentication users...");
    await clearAllAuthUsers();

    // 2) Clear all storage buckets and files
    console.log("\n📋 Step 2: Clearing all storage buckets...");
    await clearAllStorageBuckets();

    // 3) Delete database rows in FK-safe order (children → parents)
    console.log("\n📋 Step 3: Clearing database tables...");
    await deleteAll("event_poll_responses");
    await deleteAll("event_poll_options");
    await deleteAll("event_polls");

    await deleteAll("event_qna_questions");
    await deleteAll("event_session_photos");
    await deleteAll("event_session_data");
    await deleteAll("event_schedule_items");
    await deleteAll("page_members");

    await deleteAll("events");
    await deleteAll("pages");

    console.log("\n─".repeat(60));
    console.timeEnd("clear-supabase");
    console.log("✅ Complete Supabase wipe finished successfully!");
    console.log("   • All authentication users deleted");
    console.log("   • All storage buckets cleared");
    console.log("   • All database tables cleared");
  } catch (e) {
    console.error("\n❌ Error during Supabase wipe:", e.message);
    console.error(e);
    process.exit(1);
  }
}

main();
