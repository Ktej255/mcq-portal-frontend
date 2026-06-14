import fs from "fs";
import path from "path";
import { createClient } from "@supabase/supabase-js";

// 1. Parse .env.local
const envPath = path.resolve(".env.local");
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, "utf8");
  envContent.split("\n").forEach((line) => {
    const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
    if (match) {
      const key = match[1];
      let value = match[2] || "";
      if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1);
      if (value.startsWith("'") && value.endsWith("'")) value = value.slice(1, -1);
      process.env[key] = value.trim();
    }
  });
}

async function testConnection() {
  const url = "https://ekandbsgwhtfufwvvgjr.supabase.co";
  const secretKey = "sb_publishable_9zfjgi46-5_eitv54QtoyQ_wPaiYbQm";

  console.log("Supabase URL:", url);
  console.log("Secret Key Present:", !!secretKey);

  if (!url || !secretKey) {
    console.error("Missing Supabase credentials in .env.local");
    return;
  }

  const client = createClient(url, secretKey, {
    auth: {
      autoRefreshToken: false,
      detectSessionInUrl: false,
      persistSession: false,
    },
  });

  console.log("Testing connection...");
  
  // Query 1: funnel_templates
  const { data: templates, error: tempError } = await client
    .from("funnel_templates")
    .select("id, name");

  if (tempError) {
    console.error("Error querying funnel_templates:", tempError);
  } else {
    console.log("Successfully queried funnel_templates. Rows count:", templates.length);
    console.log("First template:", templates[0]);
  }

  // Query 2: check tables existence
  const { data: tablesCheck, error: tablesError } = await client
    .rpc("get_schema_tables"); // Check if RPC helper exists or just do a select limit 1

  // Testing VSL table
  console.log("Checking VSL table:");
  const { data: vslData, error: vslError } = await client.from("vsl_funnels").select("*").limit(1);
  if (vslError) {
    console.error("Error querying vsl_funnels:", vslError.message);
  } else {
    console.log("vsl_funnels exists and is accessible. Rows limit 1:", vslData);
  }

  console.log("Testing table access directly:");
  const testTables = ["funnel_projects", "funnel_steps", "funnel_submissions", "funnel_analytics"];
  for (const table of testTables) {
    const { data, error } = await client.from(table).select("*").limit(1);
    if (error) {
      console.error(`Error querying table '${table}':`, error.message);
    } else {
      console.log(`Table '${table}' exists and is accessible. Rows limit 1:`, data);
    }
  }
}

testConnection().catch(console.error);
