import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase URL or Service Role Key in env");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  console.log("Connecting to Supabase:", supabaseUrl);

  const { data: workspaces, error: wsError } = await supabase.from("workspaces").select("*");
  console.log("\n=== WORKSPACES ===");
  if (wsError) console.error(wsError.message);
  else console.log(JSON.stringify(workspaces, null, 2));

  // Grant VSL subscription to all workspaces if they don't have one
  if (workspaces && workspaces.length > 0) {
    for (const ws of workspaces) {
      const { data: existingSub } = await supabase
        .from("module_subscriptions")
        .select("id")
        .eq("workspace_id", ws.id)
        .eq("module_slug", "vsl")
        .maybeSingle();

      if (!existingSub) {
        console.log(`Granting missing VSL subscription to workspace: ${ws.name} (${ws.id})`);
        await supabase.from("module_subscriptions").insert({
          workspace_id: ws.id,
          module_slug: "vsl",
          status: "active"
        });
      }
    }
  }

  const { data: members, error: memError } = await supabase.from("workspace_members").select("*");
  console.log("\n=== WORKSPACE MEMBERS ===");
  if (memError) console.error(memError.message);
  else console.log(JSON.stringify(members, null, 2));

  const { data: subs, error: subError } = await supabase.from("module_subscriptions").select("*");
  console.log("\n=== MODULE SUBSCRIPTIONS ===");
  if (subError) console.error(subError.message);
  else console.log(JSON.stringify(subs, null, 2));

  const { data: funnels, error: funError } = await supabase.from("vsl_funnels").select("*");
  console.log("\n=== VSL FUNNELS ===");
  if (funError) console.error(funError.message);
  else console.log(JSON.stringify(funnels, null, 2));
}

run().catch(console.error);
