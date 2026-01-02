-- Insert temporary password email template
INSERT INTO email_templates (template_name, category, template_id, subject, html_content, use_master_template, is_active, description)
VALUES (
  'Temporary Password',
  'Security',
  'temporary_password',
  'Your Temporary Password',
  '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
    <h1 style="color: #333; margin-bottom: 20px;">Temporary Password</h1>
    <p style="margin-bottom: 15px;">Hello {{firstName}} {{lastName}},</p>
    <p style="margin-bottom: 15px;">A temporary password has been created for your account. Please use the following credentials to log in:</p>
    <div style="background-color: #f5f5f5; padding: 20px; border-radius: 8px; margin: 25px 0;">
      <p style="margin: 0 0 15px 0;"><strong>Temporary Password:</strong></p>
      <p style="margin: 0; font-family: monospace; font-size: 18px; background-color: #fff; padding: 12px; border-radius: 4px; border: 1px solid #ddd;">{{temporaryPassword}}</p>
    </div>
    <p style="margin-bottom: 15px;"><strong>Important:</strong> For security reasons, you must change this password when you first log in.</p>
    <p style="margin: 30px 0;">
      <a href="{{resetUrl}}" style="background-color: #007bff; color: white; padding: 14px 28px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: 600;">Reset Your Password</a>
    </p>
    <p style="margin-top: 30px; padding-top: 30px; border-top: 1px solid #eee; color: #666; font-size: 14px;">If you did not request this password reset, please contact support immediately at support@theonglobal.com</p>
  </div>',
  true,
  true,
  'Email template sent when admin creates a temporary password for a user'
) ON CONFLICT (template_id) DO UPDATE SET
  html_content = EXCLUDED.html_content,
  subject = EXCLUDED.subject,
  use_master_template = EXCLUDED.use_master_template,
  description = EXCLUDED.description;
