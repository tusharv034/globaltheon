import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    const blockedStatuses = ["inactive", "rejected", "cancelled", "terminated"];
    
    const { data: affiliates, error: affiliatesError } = await supabase
      .from("affiliates")
      .select("id, email, first_name, last_name, status, auth_user_id")
      .is("deleted_at", null)
      .not("status", "in", `(${blockedStatuses.join(",")})`)
      .is("auth_user_id", null);

    if (affiliatesError) throw new Error(`Failed to fetch affiliates: ${affiliatesError.message}`);

    console.log(`Found ${affiliates?.length || 0} affiliates needing auth setup`);

    const results = { created: [], updated: [], failed: [] };

    for (const affiliate of affiliates || []) {
      try {
        const { data: existingUsers } = await supabase.auth.admin.listUsers();
        let authUser = existingUsers?.users?.find((u: any) => u.email === affiliate.email);

        if (!authUser) {
          const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
            email: affiliate.email,
            password: "Test2025$",
            email_confirm: true,
            user_metadata: { first_name: affiliate.first_name, last_name: affiliate.last_name },
          });

          if (createError || !newUser?.user) throw new Error(`Create user failed: ${createError?.message}`);
          authUser = newUser.user as any;
          results.created.push(affiliate.email);
        } else {
          await supabase.auth.admin.updateUserById(authUser.id, { password: "Test2025$" });
          results.updated.push(affiliate.email);
        }

        await supabase.from("affiliates").update({ auth_user_id: authUser.id }).eq("id", affiliate.id);
        
        const { data: existingRole } = await supabase
          .from("user_roles")
          .select("*")
          .eq("user_id", authUser.id)
          .eq("role", "affiliate")
          .maybeSingle();

        if (!existingRole) {
          await supabase.from("user_roles").insert({ user_id: authUser.id, role: "affiliate" });
        }
      } catch (error: any) {
        results.failed.push({ email: affiliate.email, error: error.message });
      }
    }

    return new Response(
      JSON.stringify({ success: true, results, total: affiliates?.length || 0, password: "Test2025$" }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: any) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
