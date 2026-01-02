import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface TemporaryPasswordRequest {
  entityId: string;
  entityType: "affiliate" | "customer";
  email: string;
  firstName: string;
  lastName: string;
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

    // Get the authorization header from the request
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("No authorization header");
    }

    // Verify the user is authenticated and is an admin
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token);
    
    if (userError || !user) {
      throw new Error("Unauthorized");
    }

    // Check if user is admin
    const { data: roleData, error: roleError } = await supabaseClient
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .single();

    if (roleError || roleData?.role !== "admin") {
      throw new Error("User must be an admin to perform this action");
    }

    const { entityId, entityType, email, firstName, lastName }: TemporaryPasswordRequest = await req.json();

    console.log(`Processing temporary password request for ${entityType}: ${email}`);

    // Generate temporary password
    const temporaryPassword = generateTemporaryPassword();

    // Find the auth user by email
    const { data: usersData, error: getUsersError } = await supabaseClient.auth.admin.listUsers();
    
    if (getUsersError) {
      console.error("Failed to list users:", getUsersError);
      throw new Error("Failed to find user account");
    }

    let authUser = usersData?.users?.find((u: any) => u.email === email);
    
    // If auth user doesn't exist, create one
    if (!authUser) {
      console.log("Auth user not found, creating new user:", email);
      const { data: newUser, error: createError } = await supabaseClient.auth.admin.createUser({
        email: email,
        password: temporaryPassword,
        email_confirm: true,
        user_metadata: {
          first_name: firstName,
          last_name: lastName
        }
      });

      if (createError) {
        console.error("Failed to create user:", createError);
        throw new Error("Failed to create user account");
      }

      authUser = newUser.user;
      console.log("New auth user created successfully");
    } else {
      // Update the password for existing user
      const { error: passwordError } = await supabaseClient.auth.admin.updateUserById(
        authUser.id,
        { password: temporaryPassword }
      );

      if (passwordError) {
        console.error("Failed to update password:", passwordError);
        throw new Error("Failed to update password");
      }

      console.log("Password updated successfully in Supabase");
    }

    // Get admin profile for the note
    const { data: adminProfile } = await supabaseClient
      .from("profiles")
      .select("first_name, last_name")
      .eq("id", user.id)
      .single();

    const adminName = adminProfile 
      ? `${adminProfile.first_name} ${adminProfile.last_name}`.trim() || "Admin"
      : "Admin";

    // Create a note in the appropriate table
    const noteText = `Temporary password sent by ${adminName} on ${new Date().toLocaleString("en-US", { 
      month: "short", 
      day: "numeric", 
      year: "numeric", 
      hour: "numeric", 
      minute: "2-digit", 
      hour12: true 
    })}`;

    const notesTable = entityType === "affiliate" ? "affiliate_notes" : "customer_notes";
    const foreignKey = entityType === "affiliate" ? "affiliate_id" : "customer_id";

    const { error: noteError } = await supabaseClient
      .from(notesTable)
      .insert({
        [foreignKey]: entityId,
        note_text: noteText,
        note_type: "note",
        created_by: user.id,
      });

    if (noteError) {
      console.error("Failed to create note:", noteError);
    } else {
      console.log("Note created successfully");
    }

    // TODO: Update Shopify customer password
    // This would require Shopify API integration
    console.log("Shopify password update would be triggered here");

    // Get the email template
    const { data: template } = await supabaseClient
      .from("email_templates")
      .select("*")
      .eq("template_id", "temporary_password")
      .eq("is_active", true)
      .single();

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
          .single();

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

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Temporary password sent successfully",
        emailId: emailResponse.id
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error in send-temporary-password function:", error);
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
