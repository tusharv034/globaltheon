import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ForgotPasswordRequest {
  email: string;
}

const generateTemporaryPassword = (): string => {
  const length = 12;
  const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*";
  let password = "";
  for (let i = 0; i < length; i++) {
    password += charset.charAt(Math.floor(Math.random() * charset.length));
  }
  return password;
};

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Create Supabase client with service role key
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    const { email }: ForgotPasswordRequest = await req.json();

    console.log(`Processing forgot password request for: ${email}`);

    // Generate temporary password
    const temporaryPassword = generateTemporaryPassword();

    // Find the auth user by email
    const { data: usersData, error: getUsersError } = await supabaseClient.auth.admin.listUsers();
    
    if (getUsersError) {
      console.error("Failed to list users:", getUsersError);
      throw new Error("Failed to find user account");
    }

    let authUser = usersData?.users?.find((u: any) => u.email === email);
    
    if (!authUser) {
      // If no auth user exists, check if this email belongs to an affiliate we allow to log in
      const blockedStatuses = ["inactive", "rejected", "cancelled", "terminated"];      
      const { data: affiliate } = await supabaseClient
        .from("affiliates")
        .select("id, first_name, last_name, status, kyc_pass, kyc_rejection_reason")
        .eq("email", email)
        .is("deleted_at", null)
        .maybeSingle();

      const statusLower = affiliate?.status?.toLowerCase?.();
      const isBlocked = statusLower ? blockedStatuses.includes(statusLower) : false;
      const failedKYC = affiliate && affiliate.kyc_rejection_reason && affiliate.kyc_pass === false;

      if (affiliate && !isBlocked && !failedKYC) {
        // Create auth user for affiliate
        const { data: newUser, error: createError } = await supabaseClient.auth.admin.createUser({
          email,
          password: temporaryPassword,
          email_confirm: true,
          user_metadata: {
            first_name: affiliate.first_name,
            last_name: affiliate.last_name,
          },
        });

        if (createError || !newUser?.user) {
          console.error("Failed to create user:", createError);
          throw new Error("Failed to create user account");
        }

        authUser = newUser.user as any;
        console.log("New auth user created successfully for affiliate", email);

        // Ensure role is set to affiliate
        const { error: roleError } = await supabaseClient
          .from("user_roles")
          .insert({ user_id: authUser.id, role: "affiliate" });
        if (roleError) {
          console.error("Failed to set user role:", roleError);
        }

        // Link affiliate to auth user
        const { error: linkError } = await supabaseClient
          .from("affiliates")
          .update({ auth_user_id: authUser.id })
          .eq("id", affiliate.id);
        if (linkError) {
          console.error("Failed to link affiliate to auth user:", linkError);
        }
      } else {
        // For security, we still return success even if user/affiliate doesn't exist or isn't eligible
        console.log("User not found or not eligible, but returning success for security");
        return new Response(
          JSON.stringify({ 
            success: true, 
            message: "If an account exists with this email, a temporary password has been sent."
          }),
          {
            status: 200,
            headers: { "Content-Type": "application/json", ...corsHeaders },
          }
        );
      }
    }

    // Defer password update until after email is sent successfully

    // Get user's name from metadata or profiles
    let firstName = authUser.user_metadata?.first_name || "";
    let lastName = authUser.user_metadata?.last_name || "";

    if (!firstName && !lastName) {
      // Try to get from profiles table
      const { data: profile } = await supabaseClient
        .from("profiles")
        .select("first_name, last_name")
        .eq("id", authUser.id)
        .maybeSingle();

      if (profile) {
        firstName = profile.first_name || "";
        lastName = profile.last_name || "";
      }
    }

    // Get the email template
    const { data: template } = await supabaseClient
      .from("email_templates")
      .select("*")
      .eq("template_id", "temporary_password")
      .eq("is_active", true)
      .maybeSingle();

    let emailHtml = "";
    const resetUrl = `https://theon.global/reset-password?token=${temporaryPassword}&email=${encodeURIComponent(email)}`;

    if (template) {
      // Use template and replace placeholders
      emailHtml = template.html_content
        .replace("{{firstName}}", firstName)
        .replace("{{lastName}}", lastName)
        .replace("{{temporaryPassword}}", temporaryPassword)
        .replace("{{resetUrl}}", resetUrl);

      // If master template is enabled, wrap the content
      if (template.use_master_template) {
        const { data: masterTemplate } = await supabaseClient
          .from("email_master_template")
          .select("*")
          .eq("is_enabled", true)
          .maybeSingle();

        if (masterTemplate) {
          emailHtml = `${masterTemplate.header_html || ""}${emailHtml}${masterTemplate.footer_html || ""}`;
        }
      }
    } else {
      // Fallback email template
      emailHtml = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #333; font-size: 28px; margin-bottom: 20px;">Temporary Password</h1>
          <p style="color: #333; font-size: 16px; line-height: 1.5;">Hello ${firstName} ${lastName},</p>
          <p style="color: #333; font-size: 16px; line-height: 1.5;">A temporary password has been created for your account. Please use the following credentials to log in:</p>
          <div style="background-color: #f5f5f5; padding: 20px; border-radius: 5px; margin: 20px 0;">
            <p style="margin: 0; color: #333; font-weight: bold;">Temporary Password:</p>
            <div style="background-color: #fff; padding: 12px; border-radius: 3px; margin-top: 10px; border: 1px solid #ddd;">
              <code style="font-size: 16px; color: #333; letter-spacing: 1px;">${temporaryPassword}</code>
            </div>
          </div>
          <p style="color: #333; font-size: 16px; line-height: 1.5;"><strong>Important:</strong> For security reasons, you must change this password when you first log in.</p>
          <p style="margin-top: 30px;">
            <a href="${resetUrl}" style="background-color: #4285f4; color: white; padding: 12px 30px; text-decoration: none; border-radius: 4px; display: inline-block; font-size: 16px;">Reset Your Password</a>
          </p>
          <p style="margin-top: 40px; color: #666; font-size: 14px; line-height: 1.5;">If you did not request this password reset, please contact support immediately at support@theonglobal.com</p>
        </div>
      `;
    }

    // Send email via Resend
    const emailResponse = await resend.emails.send({
      from: "Theon Global <no-reply@theon.global>",
      to: [email],
      subject: template?.subject || "Your Temporary Password",
      html: emailHtml,
    });

    console.log("Email sent successfully:", emailResponse);

    // Now that email has been sent, update the user's password
    const { error: finalPasswordError } = await supabaseClient.auth.admin.updateUserById(
      authUser.id,
      { password: temporaryPassword }
    );

    if (finalPasswordError) {
      console.error("Failed to update password after email send:", finalPasswordError);
      return new Response(
        JSON.stringify({ error: "Failed to update password after email send" }),
        {
          status: 500,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    console.log("Password updated successfully in Supabase");

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "If an account exists with this email, a temporary password has been sent.",
        emailId: emailResponse.id
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error in forgot-password function:", error);
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
