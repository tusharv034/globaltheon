-- Create email_templates table
CREATE TABLE public.email_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  category TEXT NOT NULL,
  template_name TEXT NOT NULL,
  description TEXT,
  subject TEXT NOT NULL,
  html_content TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(template_name)
);

-- Enable Row Level Security
ALTER TABLE public.email_templates ENABLE ROW LEVEL SECURITY;

-- Allow admins to view all email templates
CREATE POLICY "Admins can view all email templates"
ON public.email_templates
FOR SELECT
USING (public.is_admin(auth.uid()));

-- Allow admins to insert email templates
CREATE POLICY "Admins can insert email templates"
ON public.email_templates
FOR INSERT
WITH CHECK (public.is_admin(auth.uid()));

-- Allow admins to update email templates
CREATE POLICY "Admins can update email templates"
ON public.email_templates
FOR UPDATE
USING (public.is_admin(auth.uid()));

-- Allow admins to delete email templates
CREATE POLICY "Admins can delete email templates"
ON public.email_templates
FOR DELETE
USING (public.is_admin(auth.uid()));

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_email_templates_updated_at
BEFORE UPDATE ON public.email_templates
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default email templates
INSERT INTO public.email_templates (category, template_name, description, subject, html_content, is_active) VALUES
('Affiliate', 'Congratulations! You have a new Affiliate', 'Sent when a new affiliate joins the network', 'Congratulations! You have a new Affiliate', '<h1>Congratulations!</h1><p>You have a new affiliate in your network.</p><p><strong>Affiliate Details:</strong></p><p>Name: {{affiliate_name}}<br>Email: {{affiliate_email}}<br>Join Date: {{join_date}}</p><p>Welcome them to your team and help them get started!</p><p>Best regards,<br>{{company_name}}</p>', true),
('Customer', 'Congratulations! You have a new Customer', 'Sent when a new customer makes a purchase', 'Congratulations! You have a new Customer', '<h1>Great News!</h1><p>You have a new customer purchase.</p><p><strong>Customer Details:</strong></p><p>Name: {{customer_name}}<br>Email: {{customer_email}}<br>Order Date: {{order_date}}</p><p>Thank you for your continued success!</p><p>Best regards,<br>{{company_name}}</p>', true),
('Welcome', 'Welcome to Theon Global!', 'Welcome email for new members', 'Welcome to Theon Global!', '<h1>Welcome to {{company_name}}!</h1><p>Dear {{first_name}},</p><p>We are thrilled to have you join our global network. You are now part of a community dedicated to building and growing together.</p><p><strong>Getting Started:</strong></p><ul><li>Complete your profile</li><li>Explore your dashboard</li><li>Connect with your team</li></ul><p>If you have any questions, our support team is here to help at {{support_email}}.</p><p>Best regards,<br>The {{company_name}} Team</p>', true),
('Order', 'Your Enrollee Has Ordered!', 'Notification when an enrollee places an order', 'Your Enrollee Has Ordered!', '<h1>Exciting News!</h1><p>One of your enrollees has just placed an order.</p><p><strong>Order Details:</strong></p><p>Customer: {{customer_name}}<br>Order Number: {{order_number}}<br>Order Total: {{order_total}}<br>Order Date: {{order_date}}</p><p>This order qualifies for commission based on your compensation plan.</p><p>Keep up the great work!</p><p>Best regards,<br>{{company_name}}</p>', true);