import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ChargebackNotificationRequest {
  orderNumber: string;
  orderAmount: number;
  orderDate: string;
  customerName: string;
  customerEmail: string;
  level1AffiliateName: string;
  level1AffiliateEmail: string;
  level1CommissionAmount: number;
  level1CommissionPeriod: string;
  level2AffiliateName?: string;
  level2AffiliateEmail?: string;
  level2CommissionAmount?: number;
  level2CommissionPeriod?: string;
  level1ChargebackPrevented: boolean;
  level2ChargebackPrevented: boolean;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const data: ChargebackNotificationRequest = await req.json();

    const level2Section = data.level2AffiliateName 
      ? `
        <h3>Level 2 Commission Details:</h3>
        <ul>
          <li><strong>Affiliate:</strong> ${data.level2AffiliateName} (${data.level2AffiliateEmail})</li>
          <li><strong>Commission Amount:</strong> $${data.level2CommissionAmount?.toFixed(2)}</li>
          <li><strong>Commission Period:</strong> ${data.level2CommissionPeriod}</li>
          <li><strong>Chargeback Status:</strong> ${data.level2ChargebackPrevented ? '<span style="color: red;">NOT CHARGED BACK (Flag Enabled)</span>' : '<span style="color: green;">CHARGED BACK</span>'}</li>
        </ul>
      `
      : '<p><strong>Level 2 Commission:</strong> None (no upline affiliate)</p>';

    const manualActionRequired = data.level1ChargebackPrevented || data.level2ChargebackPrevented;

    const emailHtml = `
      <h1>Chargeback Notification</h1>
      <p>A chargeback has occurred for an order that was paid in a previous closed commission period.</p>
      
      <h2>Order Details:</h2>
      <ul>
        <li><strong>Order Number:</strong> ${data.orderNumber}</li>
        <li><strong>Order Amount:</strong> $${data.orderAmount.toFixed(2)}</li>
        <li><strong>Order Date:</strong> ${data.orderDate}</li>
      </ul>

      <h2>Customer/Affiliate Details:</h2>
      <ul>
        <li><strong>Name:</strong> ${data.customerName}</li>
        <li><strong>Email:</strong> ${data.customerEmail}</li>
      </ul>

      <h2>Commission Information:</h2>
      
      <h3>Level 1 Commission Details:</h3>
      <ul>
        <li><strong>Affiliate:</strong> ${data.level1AffiliateName} (${data.level1AffiliateEmail})</li>
        <li><strong>Commission Amount:</strong> $${data.level1CommissionAmount.toFixed(2)}</li>
        <li><strong>Commission Period:</strong> ${data.level1CommissionPeriod}</li>
        <li><strong>Chargeback Status:</strong> ${data.level1ChargebackPrevented ? '<span style="color: red;">NOT CHARGED BACK (Flag Enabled)</span>' : '<span style="color: green;">CHARGED BACK</span>'}</li>
      </ul>

      ${level2Section}

      ${manualActionRequired ? `
        <div style="background-color: #fff3cd; border: 2px solid #ffc107; padding: 15px; margin: 20px 0; border-radius: 5px;">
          <h2 style="color: #856404; margin-top: 0;">⚠️ Manual Action Required</h2>
          <p style="color: #856404; margin: 10px 0;">
            One or more affiliates have the "Allow Automatic Chargebacks" flag disabled. 
            The commissions were NOT automatically charged back.
          </p>
          <p style="color: #856404; margin: 10px 0;">
            <strong>Affiliates NOT charged back:</strong>
          </p>
          <ul style="color: #856404;">
            ${data.level1ChargebackPrevented ? `<li>${data.level1AffiliateName} (Level 1): $${data.level1CommissionAmount.toFixed(2)}</li>` : ''}
            ${data.level2ChargebackPrevented && data.level2AffiliateName ? `<li>${data.level2AffiliateName} (Level 2): $${data.level2CommissionAmount?.toFixed(2)}</li>` : ''}
          </ul>
          <p style="color: #856404; margin: 10px 0;">
            <strong>If you wish to charge back these commissions, you must do so manually through the commission adjustments interface.</strong>
          </p>
        </div>
      ` : `
        <div style="background-color: #d4edda; border: 2px solid #28a745; padding: 15px; margin: 20px 0; border-radius: 5px;">
          <p style="color: #155724; margin: 0;">
            ✓ All eligible commissions have been automatically charged back.
          </p>
        </div>
      `}

      <hr style="margin: 20px 0;">
      <p style="font-size: 12px; color: #666;">
        This is an automated notification from your commission management system.
      </p>
    `;

    const { error } = await resend.emails.send({
      from: "Commission System <onboarding@resend.dev>",
      to: ["support@theonglobal.com"],
      subject: `⚠️ Chargeback Alert: Order ${data.orderNumber} - ${manualActionRequired ? 'MANUAL ACTION REQUIRED' : 'Processed'}`,
      html: emailHtml,
    });

    if (error) {
      console.error("Failed to send chargeback notification:", error);
      throw error;
    }

    console.log("Chargeback notification sent successfully for order:", data.orderNumber);

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error in chargeback-notification function:", error);
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
