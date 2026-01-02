import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.75.0";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface TestEmailRequest {
  subject: string;
  html_content: string;
  use_master_template: boolean;
  test_email?: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Get authenticated user
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("No authorization header");
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);

    if (userError || !user) {
      throw new Error("Unauthorized");
    }

    // Verify user is admin
    const { data: roles } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id);

    const isAdmin = roles?.some((r) => r.role === "admin");
    if (!isAdmin) {
      throw new Error("Only admins can send test emails");
    }

    const { subject, html_content, use_master_template, test_email }: TestEmailRequest = await req.json();

    // Get company settings for sample data
    const { data: companySettings } = await supabase
      .from("company_settings")
      .select("*")
      .maybeSingle();

    // Get master template if needed
    let finalContent = html_content;
    if (use_master_template) {
      const { data: masterTemplate } = await supabase
        .from("email_master_template")
        .select("header_html, footer_html, is_enabled")
        .maybeSingle();

      if (masterTemplate?.is_enabled) {
        const header = masterTemplate.header_html || "";
        const footer = masterTemplate.footer_html || "";
        finalContent = header + html_content + footer;
      }
    }

    // Sample data for merge fields
    const sampleData: Record<string, string> = {
      "{{company_name}}": companySettings?.company_name || "Your Company",
      "{{owner_first_name}}": companySettings?.owner_first_name || "Jane",
      "{{owner_last_name}}": companySettings?.owner_last_name || "Smith",
      "{{support_email}}": companySettings?.support_email || "support@example.com",
      "{{company_email}}": companySettings?.company_email || "info@example.com",
      "{{company_phone}}": companySettings?.company_phone || "(555) 123-4567",
      "{{hours_of_operation}}": companySettings?.hours_of_operation || "Mon-Fri 9am-5pm EST",
      "{{address_line1}}": companySettings?.address_line1 || "123 Main Street",
      "{{address_line2}}": companySettings?.address_line2 || "Suite 100",
      "{{city}}": companySettings?.city || "New York",
      "{{state_province}}": companySettings?.state_province || "NY",
      "{{postal_code}}": companySettings?.postal_code || "10001",
      "{{first_name}}": "John",
      "{{last_name}}": "Doe",
      "{{email}}": "john.doe@example.com",
      "{{affiliate_name}}": "Jane Smith",
      "{{customer_name}}": "Robert Johnson",
      "{{order_number}}": "#12345",
      "{{order_total}}": "$99.99",
      "{{order_date}}": new Date().toLocaleDateString(),
      "{{join_date}}": new Date().toLocaleDateString(),
      "{{$Commissions}}": "$1,234.56",
      "{{TEMPORARY_PASSWORD}}": "TempPass123!",
      "{{RESET_PASSWORD_LINK}}": "https://example.com/reset-password",
    };

    // Replace merge fields with sample data
    let processedContent = finalContent;
    let processedSubject = subject;
    
    Object.entries(sampleData).forEach(([key, value]) => {
      processedContent = processedContent.replace(new RegExp(key, "g"), value);
      processedSubject = processedSubject.replace(new RegExp(key, "g"), value);
    });

    // Validate Resend API key before sending
    const key = Deno.env.get("RESEND_API_KEY") || "";
    const hasKey = !!key;
    const looksValid = key.startsWith("re_");
    console.log("send-test-email: RESEND_API_KEY present:", hasKey, "format_ok:", looksValid);
    if (!hasKey) {
      return new Response(
        JSON.stringify({ error: "RESEND_API_KEY is not set" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }
    if (!looksValid) {
      return new Response(
        JSON.stringify({ error: "RESEND_API_KEY format invalid. Use your Secret API Key from Resend (starts with 're_')." }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Send test email to specified address or admin's email
    const recipientEmail = test_email || user.email!;
    const emailResponse = await resend.emails.send({
      from: `${companySettings?.company_name || "Test"} <onboarding@resend.dev>`,
      to: [recipientEmail],
      subject: `[TEST] ${processedSubject}`,
      html: processedContent,
    });

    if ((emailResponse as any)?.error) {
      console.error("Resend send-test-email error:", (emailResponse as any).error);
      return new Response(
        JSON.stringify({ error: (emailResponse as any).error.message || "Failed to send test email" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    console.log("Test email sent successfully:", emailResponse);

    return new Response(
      JSON.stringify({ success: true, message: "Test email sent successfully" }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders,
        },
      }
    );
  } catch (error: any) {
    console.error("Error in send-test-email function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
