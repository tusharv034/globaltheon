import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { UserMenu } from "@/components/user-menu";
import { SocialMediaLinks } from "@/components/social-media-links";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FileDown } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import logoImage from "@/assets/theon-logo.avif";
import { useState } from "react";

const SOW = () => {
  const lastUpdated = new Date(); // This would come from your data source in production
  
  const [includeClient, setIncludeClient] = useState(true);
  const [includeScopeBy, setIncludeScopeBy] = useState(true);
  const [includeDevPartner, setIncludeDevPartner] = useState(true);

  const handleDownloadPDF = async () => {
    const element = document.getElementById('sow-content');
    if (!element) {
      toast.error('Content not found');
      return;
    }

    toast.loading('Generating PDF...');

    try {
      const [{ default: jsPDF }, { default: html2canvas }] = await Promise.all([
        import('jspdf'),
        import('html2canvas')
      ]);
      
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
        windowWidth: element.scrollWidth,
        windowHeight: element.scrollHeight
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4' });
      
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = pdfWidth - 20;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      let heightLeft = imgHeight;
      let position = 10;

      pdf.addImage(imgData, 'PNG', 10, position, imgWidth, imgHeight);
      heightLeft -= pdfHeight;

      while (heightLeft > 0) {
        position = heightLeft - imgHeight + 10;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 10, position, imgWidth, imgHeight);
        heightLeft -= pdfHeight;
      }

      // Add signature page
      pdf.addPage();
      pdf.setFontSize(16);
      pdf.text('Signatures', 105, 20, { align: 'center' });
      
      let yPosition = 60;
      
      if (includeClient) {
        pdf.setFontSize(12);
        pdf.text('Client Signature:', 20, yPosition);
        pdf.line(20, yPosition + 20, 100, yPosition + 20);
        pdf.setFontSize(10);
        pdf.text('Signature', 20, yPosition + 25);
        
        pdf.setFontSize(12);
        pdf.text('Date:', 120, yPosition);
        pdf.line(120, yPosition + 20, 180, yPosition + 20);
        pdf.setFontSize(10);
        pdf.text('Date', 120, yPosition + 25);
        
        pdf.setFontSize(12);
        pdf.text('Theon Global LLC', 20, yPosition + 40);
        pdf.text('Larry Puckett, CEO', 20, yPosition + 47);
        
        yPosition += 80;
      }
      
      if (includeDevPartner) {
        pdf.setFontSize(12);
        pdf.text('Development Partner Signature:', 20, yPosition);
        pdf.line(20, yPosition + 20, 100, yPosition + 20);
        pdf.setFontSize(10);
        pdf.text('Signature', 20, yPosition + 25);
        
        pdf.setFontSize(12);
        pdf.text('Date:', 120, yPosition);
        pdf.line(120, yPosition + 20, 180, yPosition + 20);
        pdf.setFontSize(10);
        pdf.text('Date', 120, yPosition + 25);
        
        pdf.setFontSize(12);
        pdf.text('E2logy Solutions Pvt. Ltd.', 20, yPosition + 40);
        pdf.text('Authorized Representative', 20, yPosition + 47);
      }

      pdf.save('Theon_Global_SOW.pdf');
      
      toast.success('PDF downloaded successfully!');
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast.error('Error generating PDF');
    }
  };

  const handleDownloadWord = () => {
    const element = document.getElementById('sow-content');
    if (!element) {
      toast.error('Content not found');
      return;
    }

    toast.loading('Generating Word document...');

    try {
      let signatureContent = '';
      
      if (includeClient) {
        signatureContent += `
          <p><strong>Client Signature:</strong></p>
          <div class="signature-line"></div>
          <p>Signature</p>
          <p><strong>Date:</strong> _______________________________</p>
          <br>
          <p><strong>Theon Global LLC</strong><br>Larry Puckett, CEO</p>
          <br><br><br>
        `;
      }
      
      if (includeDevPartner) {
        signatureContent += `
          <p><strong>Development Partner Signature:</strong></p>
          <div class="signature-line"></div>
          <p>Signature</p>
          <p><strong>Date:</strong> _______________________________</p>
          <br>
          <p><strong>E2logy Solutions Pvt. Ltd.</strong><br>Authorized Representative</p>
        `;
      }
      
      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>Theon Global SOW</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            h1 { font-size: 24pt; color: #333; }
            h2 { font-size: 18pt; color: #555; margin-top: 20px; }
            h3 { font-size: 14pt; color: #666; }
            p { font-size: 11pt; line-height: 1.6; }
            ul, ol { margin-left: 20px; }
            .signature-page { page-break-before: always; margin-top: 50px; }
            .signature-line { border-bottom: 1px solid #000; width: 300px; margin: 20px 0; }
          </style>
        </head>
        <body>
          ${element.innerHTML}
          <div class="signature-page">
            <h2 style="text-align: center;">Signatures</h2>
            <br><br>
            ${signatureContent}
          </div>
        </body>
        </html>
      `;

      const blob = new Blob([htmlContent], { type: 'application/msword' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'Theon_Global_SOW.doc';
      link.click();
      URL.revokeObjectURL(url);
      
      toast.success('Word document downloaded successfully!');
    } catch (error) {
      console.error('Error generating Word document:', error);
      toast.error('Error generating Word document');
    }
  };

  return (
    <SidebarProvider defaultOpen={true}>
      <div className="min-h-screen flex w-full bg-dashboard-bg">
        <AppSidebar />
        
        <div className="flex-1 flex flex-col w-full overflow-x-hidden">
          {/* Mobile Header */}
          <header className="md:hidden h-14 flex items-center justify-between gap-3 px-4 border-b border-white/10 sticky top-0 z-10 print:hidden" style={{ backgroundColor: "#1a1f2e" }}>
            <div className="flex items-center gap-3">
              <SidebarTrigger className="text-white hover:bg-white/10" />
              <img src={logoImage} alt="Theon Global" className="h-8 w-auto" />
            </div>
            <UserMenu />
          </header>
          
          {/* Desktop Header */}
          <header className="hidden md:flex h-auto min-h-16 bg-white border-b border-border items-center justify-between px-6 py-4 shadow-sm sticky top-0 z-10 print:hidden">
            <div>
              <h1 className="text-xl font-semibold text-foreground mb-3">Statement of Work</h1>
              <div className="flex flex-wrap gap-4">
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="include-client" 
                    checked={includeClient}
                    onCheckedChange={(checked) => setIncludeClient(checked as boolean)}
                  />
                  <Label htmlFor="include-client" className="text-sm cursor-pointer">
                    Include Client
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="include-scope" 
                    checked={includeScopeBy}
                    onCheckedChange={(checked) => setIncludeScopeBy(checked as boolean)}
                  />
                  <Label htmlFor="include-scope" className="text-sm cursor-pointer">
                    Include Scope Developed By
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="include-dev-partner" 
                    checked={includeDevPartner}
                    onCheckedChange={(checked) => setIncludeDevPartner(checked as boolean)}
                  />
                  <Label htmlFor="include-dev-partner" className="text-sm cursor-pointer">
                    Include Development Partner
                  </Label>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-2">
                    <FileDown className="h-4 w-4" />
                    Download SOW
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={handleDownloadPDF} className="gap-2">
                    <FileDown className="h-4 w-4" />
                    Download as PDF
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleDownloadWord} className="gap-2">
                    <FileDown className="h-4 w-4" />
                    Download as Word
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <UserMenu />
            </div>
          </header>
          
          <main className="flex-1 p-4 md:p-6 overflow-x-auto">
            <div id="sow-content" className="max-w-6xl mx-auto space-y-6">
              {/* Header */}
              <Card className="p-4 sm:p-6">
                <h1 className="text-2xl sm:text-3xl font-bold mb-4">Theon Global Affiliate Management System</h1>
                <h2 className="text-lg sm:text-xl text-muted-foreground mb-4">Statement of Work - Development Handoff Document</h2>
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-4">
                  <p className="text-sm text-muted-foreground">Version 1.2</p>
                  <p className="text-sm text-muted-foreground">
                    <strong>Last Updated:</strong> November 15, 2025
                  </p>
                </div>
                
                {includeClient && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                    <h3 className="font-semibold mb-2 text-green-900">Client</h3>
                    <p className="text-sm text-green-800 mb-2">
                      <strong>Theon Global LLC</strong>
                    </p>
                    <div className="text-sm text-green-800">
                      <p className="font-semibold">Larry Puckett, CEO</p>
                      <p className="mt-1">25135 FM 2978 Suite A</p>
                      <p>Tomball, TX 77375</p>
                      <p>United States</p>
                      <p className="mt-1">Email: <a href="mailto:support@theonglobal.com" className="underline">support@theonglobal.com</a></p>
                      <p>Phone: 346-808-2171</p>
                      <p>Website: <a href="https://www.theonglobal.com" target="_blank" rel="noopener noreferrer" className="underline">www.theonglobal.com</a></p>
                    </div>
                  </div>
                )}
                
                {includeScopeBy && (
                  <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 mb-4">
                    <h3 className="font-semibold mb-2 text-purple-900">Scope of Work Developed By</h3>
                    <p className="text-sm text-purple-800 mb-2">
                      <strong>Robert Proctor Consulting, LLC</strong>
                    </p>
                    <div className="text-sm text-purple-800">
                      <p className="font-semibold">Robert Proctor - Theon Global CTO</p>
                      <p className="mt-1">1012 Cayes Circle</p>
                      <p>Cape Coral, FL 33991</p>
                      <p className="mt-1">Email: <a href="mailto:rp@robert-proctor.com" className="underline">rp@robert-proctor.com</a></p>
                      <p>Phone: 239-839-4904</p>
                      <p>Website: <a href="https://www.realrobertproctor.com" target="_blank" rel="noopener noreferrer" className="underline">www.realrobertproctor.com</a></p>
                    </div>
                  </div>
                )}
                
                {includeDevPartner && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h3 className="font-semibold mb-2 text-blue-900">Development Partner</h3>
                    <p className="text-sm text-blue-800 mb-2">
                      Development and programming will be completed by <strong>E2logy Solutions Pvt. Ltd.</strong>
                    </p>
                    <div className="text-sm text-blue-800">
                      <p className="font-semibold">Ahmedabad, India (HQ)</p>
                      <p>309-310, Iscon Mall, Jodhpur Char Rasta</p>
                      <p>Satellite Road, Ahmedabad, Gujarat, India</p>
                      <p className="mt-1">Phone: +91 79 26762385</p>
                      <p>Website: <a href="https://www.e2logy.com" target="_blank" rel="noopener noreferrer" className="underline">www.e2logy.com</a></p>
                    </div>
                  </div>
                )}
              </Card>

              {/* Executive Summary */}
              <Card className="p-4 sm:p-6">
                <h2 className="text-2xl font-bold mb-4">Executive Summary</h2>
                <p className="mb-4">
                  This Statement of Work outlines the requirements for developing a comprehensive affiliate management system for Theon Global. 
                  The system is a prototype currently built in React/TypeScript/Vite with AWS Lambda backend, designed to be rebuilt using React and Node.js 
                  with full Shopify and Tipalti integrations.
                </p>
                <p className="mb-4">
                  The platform manages a two-level unilevel compensation plan, customer and affiliate relationships, order processing, 
                  commission calculations, and provides administrative tools for managing the entire affiliate network.
                </p>
                <div className="flex gap-2 flex-wrap">
                  <Badge>React</Badge>
                  <Badge>Node.js</Badge>
                  <Badge>Shopify Integration</Badge>
                  <Badge>Tipalti Integration</Badge>
                  <Badge>MongoDB</Badge>
                </div>
              </Card>

              {/* Technology Stack */}
              <Card className="p-4 sm:p-6">
                <h2 className="text-2xl font-bold mb-4">Technology Stack</h2>
                
                <h3 className="text-xl font-semibold mb-3">Current Prototype Stack</h3>
                <ul className="list-disc pl-6 mb-4 space-y-2">
                  <li><strong>Frontend:</strong> React 18.3.1 with TypeScript</li>
                  <li><strong>Build Tool:</strong> Vite</li>
                  <li><strong>Styling:</strong> Tailwind CSS</li>
                  <li><strong>State Management:</strong> React Query (TanStack Query)</li>
                  <li><strong>Form Management:</strong> React Hook Form</li>
                  <li><strong>Backend:</strong> Node JS Mongo DB</li>
                  <li><strong>UI Components:</strong> Material UI</li>
                  <li><strong>Rich Text:</strong> React Quill</li>
                  <li><strong>Charts:</strong> Chart JS</li>
                  <li><strong>Icons:</strong> Lucide React</li>
                </ul>

                <h3 className="text-xl font-semibold mb-3">Target Production Stack</h3>
                <ul className="list-disc pl-6 space-y-2">
                  <li><strong>Frontend:</strong> React with TypeScript</li>
                  <li><strong>Backend:</strong> Node.js</li>
                  <li><strong>Database:</strong> Mongo DB</li>
                  <li><strong>Integrations:</strong> Shopify API, Tipalti API</li>
                  <li><strong>Authentication:</strong> JWT-based or session-based</li>
                </ul>
              </Card>

              {/* Database Schema Overview */}
              <Card className="p-4 sm:p-6">
                <h2 className="text-2xl font-bold mb-4">Database Schema Overview</h2>
                <p className="mb-4">The current database includes the following core collections:</p>
                
                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-semibold mb-2">Core Entities</h3>
                    <ul className="list-disc pl-6 space-y-2">
                      <li><strong>profiles:</strong> User profile information (linked to auth.users)</li>
                      <li><strong>user_roles:</strong> Role-based access control (admin, user)</li>
                      <li><strong>module_permissions:</strong> Granular module-level permissions</li>
                      <li><strong>affiliates:</strong> Affiliate records with genealogy tracking</li>
                      <li><strong>customers:</strong> Customer records (separate from affiliates)</li>
                      <li><strong>orders:</strong> Order transactions from Shopify</li>
                      <li><strong>order_items:</strong> Line items for each order</li>
                      <li><strong>order_commissions:</strong> Commission records per order per level</li>
                    </ul>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold mb-2">Supporting Tables</h3>
                    <ul className="list-disc pl-6 space-y-2">
                      <li><strong>affiliate_notes, customer_notes, order_notes:</strong> Note tracking with metadata</li>
                      <li><strong>company_settings:</strong> Global company configuration</li>
                      <li><strong>compensation_plans:</strong> Commission structure configuration</li>
                      <li><strong>email_templates, email_master_template:</strong> Communication templates</li>
                      <li><strong>announcements, user_announcements:</strong> System announcements</li>
                      <li><strong>social_media_links:</strong> Footer social media links</li>
                      <li><strong>integrations (NEW - November 9, 2025):</strong> Third-party service integration configurations (SendGrid, Twilio, Resend)</li>
                    </ul>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold mb-2">Key Database Features</h3>
                    <ul className="list-disc pl-6 space-y-2">
                      <li>Row Level Security (RLS) policies on all tables</li>
                      <li>Admin-only access to most operations</li>
                      <li>User profile self-service capabilities</li>
                      <li>JSONB fields for flexible metadata (phone_numbers, level_percentages)</li>
                      <li>Foreign key relationships with enrolled_by for genealogy</li>
                      <li>Automatic timestamp management via triggers</li>
                    </ul>
                  </div>
                </div>
              </Card>

              {/* AWS Lambda Functions */}
              <Card className="p-4 sm:p-6">
                <h2 className="text-2xl font-bold mb-4">AWS Lambda Functions</h2>
                <p className="mb-4">The system uses AWS Lambda (serverless functions) for server-side operations:</p>
                
                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-semibold mb-2">Production Edge Functions</h3>
                    <ul className="list-disc pl-6 space-y-2">
                      <li><strong>admin-user-management:</strong> Create, list, and manage admin users</li>
                      <li><strong>impersonate-affiliate:</strong> Admin ability to impersonate affiliate accounts</li>
                      <li><strong>create-admin:</strong> Create new admin users with role assignment</li>
                      <li><strong>calculate-commissions:</strong> Automated commission calculation for orders</li>
                      <li><strong>forgot-password:</strong> Password reset email generation and sending</li>
                      <li><strong>send-test-email:</strong> Email template testing functionality</li>
                      <li><strong>send-temporary-password:</strong> Generate and send temporary passwords to affiliates</li>
                      <li><strong>detect-customer:</strong> Detect if email belongs to customer or affiliate on login</li>
                      <li><strong>process-kyc:</strong> KYC verification and duplicate detection processing</li>
                      <li><strong>chargeback-notification:</strong> Handle chargeback notifications and adjustments</li>
                    </ul>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold mb-2">New Edge Functions (November 9, 2025)</h3>
                    <ul className="list-disc pl-6 space-y-2">
                      <li><strong>bulk-setup-affiliates:</strong>
                        <ul className="list-disc pl-6 mt-1">
                          <li>Purpose: One-time bulk authentication setup for existing affiliates</li>
                          <li>Functionality: Creates auth users and role assignments for eligible affiliates</li>
                          <li>Eligibility: Affiliates with status NOT in (inactive, rejected, cancelled, terminated) and no existing auth_user_id</li>
                          <li>Security: verify_jwt = true (requires admin authentication)</li>
                          <li>Returns: Detailed results of created, updated, and failed affiliates</li>
                          <li>Error handling: Individual failures don't block batch process</li>
                        </ul>
                      </li>
                      <li><strong>admin-set-password:</strong>
                        <ul className="list-disc pl-6 mt-1">
                          <li>Purpose: Emergency admin password reset function</li>
                          <li>Functionality: Updates password for specific admin email (rp@robert-proctor.com)</li>
                          <li>Security: Hardcoded email restriction, verify_jwt = true after use</li>
                          <li>Use case: Restore admin access when email delivery fails</li>
                          <li>Process: Lists users, finds match, updates password via Admin API</li>
                          <li>Note: Should be disabled after emergency use</li>
                        </ul>
                      </li>
                      <li><strong>save-integration-secret:</strong>
                        <ul className="list-disc pl-6 mt-1">
                          <li>Purpose: Securely save integration API keys and credentials</li>
                          <li>Functionality: Stores SendGrid, Twilio, and Resend API keys as environment variables</li>
                          <li>Security: Requires admin authentication, stores secrets separately from database</li>
                          <li>Integration support: Handles multiple secrets per integration</li>
                          <li>Configuration: Works with integrations table for non-sensitive config</li>
                        </ul>
                      </li>
                    </ul>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold mb-2">Lambda Function Configuration</h3>
                    <p className="text-sm mb-2">All Lambda functions configured with:</p>
                    <ul className="list-disc pl-6 space-y-1 text-sm">
                      <li>Most functions require JWT verification</li>
                      <li>Public endpoints like forgot-password have open access</li>
                      <li>Functions use service role key for admin operations</li>
                      <li>CORS headers configured for all functions</li>
                      <li>Error handling and logging implemented throughout</li>
                    </ul>
                  </div>
                </div>
              </Card>

              {/* Current Implementation Status */}
              <Card className="p-4 sm:p-6">
                <h2 className="text-2xl font-bold mb-4">Current Implementation Status</h2>
                
                <div className="space-y-6">
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <h3 className="text-xl font-semibold">✅ Completed Features</h3>
                      <Badge variant="outline" className="bg-green-50">Prototype</Badge>
                    </div>
                    
                    <div className="space-y-4">
                      <div>
                        <h4 className="font-semibold mb-2">Dashboard</h4>
                        <ul className="list-disc pl-6 space-y-1 text-sm">
                          <li>Overview cards (customers, affiliates, sales, commissions)</li>
                          <li>Sales metrics with trend indicators</li>
                          <li>Affiliate analytics charts</li>
                          <li>Customer insights visualization</li>
                          <li>Responsive design with mobile support</li>
                        </ul>
                      </div>

                      <div>
                        <h4 className="font-semibold mb-2">Affiliates Management</h4>
                        <ul className="list-disc pl-6 space-y-1 text-sm">
                          <li>Complete CRUD operations for affiliates</li>
                          <li>Multi-field search (name, email, phone, affiliate ID, site name)</li>
                          <li>Genealogy tree visualization</li>
                          <li>Downline listing with hierarchy display</li>
                          <li>Commission history per affiliate</li>
                          <li>Customer list per affiliate</li>
                          <li>Order history per affiliate</li>
                          <li>Notes system with metadata tracking</li>
                          <li>Duplicate detection (email, phone, tax ID) with merge functionality:
                            <ul className="list-disc pl-6 mt-1">
                              <li>Displays subscription status (Yes in red / No in black) for each duplicate record</li>
                              <li>Subscription detected from orders with subscription=true within last 90 days</li>
                              <li>Merge process consolidates all data into selected primary record</li>
                              <li>When subscriptions are merged, the primary account must be updated in Shopify</li>
                            </ul>
                          </li>
                          <li>Phone number management (multiple numbers per affiliate):
                            <ul className="list-disc pl-6 mt-1">
                              <li>Support for multiple phone numbers per affiliate (Home, Work, Mobile, Other)</li>
                              <li>Primary phone number designation</li>
                              <li>RingCentral click-to-call integration with dedicated logo button:
                                <ul className="list-disc pl-6 mt-1">
                                  <li>Single phone: Displays phone number as clickable tel: link with RingCentral button</li>
                                  <li>Multiple phones: Dropdown selector to choose phone type, then RingCentral button to dial</li>
                                  <li>Uses rcmobile:// deep link protocol with cache-busting timestamp for reliable repeated calls</li>
                                  <li>Opens helper window to maintain user-gesture context for protocol handlers</li>
                                  <li>Falls back through multiple URI schemes (rcmobile, tel) for compatibility</li>
                                  <li>Popup blocking detection with user-friendly error messages</li>
                                  <li>Phone number formatted in E.164 format (prepends "1" for US 10-digit numbers)</li>
                                </ul>
                              </li>
                              <li>Fallback to native device calling via tel: link (mobile, WhatsApp, etc.)</li>
                              <li>Visual distinction: RingCentral logo for RC calls, phone icon for number selection</li>
                            </ul>
                          </li>
                          <li>Enrolling affiliate change with commission adjustment prompts:
                            <ul className="list-disc pl-6 mt-1">
                              <li>Displays correct "from" (current enroller) and "to" (new enroller) in confirmation dialog</li>
                              <li>Selected affiliate name remains visible in search field after selection</li>
                              <li>Analyzes commission impact for all affected orders across commission periods</li>
                              <li>Creates detailed notes on ALL affected affiliates:
                                <ul className="list-disc pl-6 mt-1">
                                  <li>Previous Level 1 Affiliate (with transfer out details and order breakdown)</li>
                                  <li>Previous Level 2 Affiliate (with transfer out details and order breakdown)</li>
                                  <li>New Level 1 Affiliate (with transfer in details and order breakdown)</li>
                                  <li>New Level 2 Affiliate (with transfer in details and order breakdown)</li>
                                  <li>The affiliate/customer being changed (with comprehensive summary)</li>
                                </ul>
                              </li>
                              <li>For open or closed unpaid periods: Updates commission records to new affiliates</li>
                              <li>For closed paid periods (commission clawback):
                                <ul className="list-disc pl-6 mt-1">
                                  <li>Creates negative adjustment in current open period for previous affiliate</li>
                                  <li>Creates positive adjustment in current open period for new affiliate</li>
                                  <li>Adjustments appear in commission_period_adjustments table</li>
                                  <li>Detailed notes include order numbers, amounts, and reasons</li>
                                </ul>
                              </li>
                            </ul>
                          </li>
                          <li>Shopify metadata sync dialog</li>
                          <li>Email opt-out tracking</li>
                          <li>Password management:
                            <ul className="list-disc pl-6 mt-1">
                              <li>Admins can update affiliate passwords through edit dialog</li>
                              <li>Password visibility toggle (eye icon) for viewing entered passwords</li>
                              <li>Mandatory note requirement when changing passwords manually</li>
                              <li>Automatic logging in Notes & History with date, admin name, and reason</li>
                              <li>Send Temporary Password button (on same line as password input):
                                <ul className="list-disc pl-6 mt-1">
                                  <li>Generates random 12-character password</li>
                                  <li>Logs password change to affiliate_notes with admin metadata</li>
                                  <li>Sends email via Resend using 'temporary_password' template</li>
                                  <li>Email includes temporary password and reset link (https://theon.global/reset-password)</li>
                                  <li>Syncs with Shopify customer account</li>
                                  <li>Uses same email template and flow as login page "Forgot Password" feature</li>
                                  <li>Implemented via send-temporary-password edge function</li>
                                </ul>
                              </li>
                              <li>Password reset flow directs users to /reset-password page</li>
                            </ul>
                          </li>
                        </ul>
                      </div>

                      <div>
                        <h4 className="font-semibold mb-2">Customers Management</h4>
                        <ul className="list-disc pl-6 space-y-1 text-sm">
                          <li>Complete CRUD operations for customers</li>
                          <li>Multi-field search (name, email, phone, customer ID)</li>
                          <li>Order history per customer</li>
                          <li>Notes system with metadata tracking</li>
                          <li>Duplicate detection (email, phone) with merge functionality:
                            <ul className="list-disc pl-6 mt-1">
                              <li>Displays subscription status (Yes in red / No in black) for each duplicate record</li>
                              <li>Subscription detected from orders with subscription=true within last 90 days</li>
                              <li>Merge process consolidates all data into selected primary record</li>
                              <li>When subscriptions are merged, the primary account must be updated in Shopify</li>
                            </ul>
                          </li>
                          <li>Phone number management (multiple numbers per customer):
                            <ul className="list-disc pl-6 mt-1">
                              <li>Support for multiple phone numbers per customer (Home, Work, Mobile, Other)</li>
                              <li>Primary phone number designation</li>
                              <li>RingCentral click-to-call integration with dedicated logo button:
                                <ul className="list-disc pl-6 mt-1">
                                  <li>Single phone: Displays phone number as clickable tel: link with RingCentral button</li>
                                  <li>Multiple phones: Dropdown selector to choose phone type, then RingCentral button to dial</li>
                                  <li>Uses rcmobile:// deep link protocol with cache-busting timestamp for reliable repeated calls</li>
                                  <li>Opens helper window to maintain user-gesture context for protocol handlers</li>
                                  <li>Falls back through multiple URI schemes (rcmobile, tel) for compatibility</li>
                                  <li>Popup blocking detection with user-friendly error messages</li>
                                  <li>Phone number formatted in E.164 format (prepends "1" for US 10-digit numbers)</li>
                                </ul>
                              </li>
                              <li>Fallback to native device calling via tel: link (mobile, WhatsApp, etc.)</li>
                              <li>Visual distinction: RingCentral logo for RC calls, phone icon for number selection</li>
                            </ul>
                          </li>
                          <li>Promote to affiliate functionality</li>
                          <li>Enrolling affiliate change with commission adjustment prompts:
                            <ul className="list-disc pl-6 mt-1">
                              <li>Displays correct "from" (current enroller) and "to" (new enroller) in confirmation dialog</li>
                              <li>Selected affiliate name remains visible in search field after selection</li>
                              <li>Analyzes commission impact for all affected orders across commission periods</li>
                              <li>Creates detailed notes on ALL affected affiliates:
                                <ul className="list-disc pl-6 mt-1">
                                  <li>Previous Level 1 Affiliate (with transfer out details and order breakdown)</li>
                                  <li>Previous Level 2 Affiliate (with transfer out details and order breakdown)</li>
                                  <li>New Level 1 Affiliate (with transfer in details and order breakdown)</li>
                                  <li>New Level 2 Affiliate (with transfer in details and order breakdown)</li>
                                  <li>The customer being changed (with comprehensive summary)</li>
                                </ul>
                              </li>
                              <li>For open or closed unpaid periods: Updates commission records to new affiliates</li>
                              <li>For closed paid periods (commission clawback):
                                <ul className="list-disc pl-6 mt-1">
                                  <li>Creates negative adjustment in current open period for previous affiliate</li>
                                  <li>Creates positive adjustment in current open period for new affiliate</li>
                                  <li>Adjustments appear in commission_period_adjustments table</li>
                                  <li>Detailed notes include order numbers, amounts, and reasons</li>
                                </ul>
                              </li>
                            </ul>
                          </li>
                          <li>Shopify update dialog for contact changes</li>
                          <li>Email opt-out tracking</li>
                          <li>Password management:
                            <ul className="list-disc pl-6 mt-1">
                              <li>Password visibility toggle (eye icon) for viewing entered passwords</li>
                              <li>Automatic note tracking when passwords are changed via customer_notes</li>
                              <li>Send Temporary Password button (on same line as password input):
                                <ul className="list-disc pl-6 mt-1">
                                  <li>Generates random 12-character password</li>
                                  <li>Logs password change to customer_notes with admin metadata</li>
                                  <li>Sends email via Resend using 'temporary_password' template</li>
                                  <li>Email includes temporary password and reset link</li>
                                  <li>Syncs with Shopify customer account</li>
                                  <li>Uses same email template and edge function as affiliate password reset</li>
                                </ul>
                              </li>
                            </ul>
                          </li>
                        </ul>
                      </div>

                      <div>
                        <h4 className="font-semibold mb-2">Orders Management</h4>
                        <ul className="list-disc pl-6 space-y-1 text-sm">
                          <li>Order listing with search and filters</li>
                          <li>Order detail view with line items</li>
                          <li>Order notes system</li>
                          <li>Status management (Accepted, Paid, Shipped, Cancelled, Refunded)</li>
                          <li>Subscription order identification</li>
                          <li>Commission tracking per order</li>
                          <li>Comprehensive address management:
                            <ul className="list-disc pl-6 mt-1">
                              <li>Separate shipping and billing address fields in database</li>
                              <li>Shipping address display: Street, City/State/Zip, Country (multi-line format)</li>
                              <li>Billing address display: Street, City/State/Zip, Country (multi-line format)</li>
                              <li>"Same as Shipping Address" functionality for billing (50% of orders)</li>
                              <li>Side-by-side address display in order detail dialog</li>
                              <li>Address validation: No duplicate city/state/zip information</li>
                              <li>Clean address formatting (removes comma-separated full addresses)</li>
                            </ul>
                          </li>
                          <li>Order financial validation:
                            <ul className="list-disc pl-6 mt-1">
                              <li>Automatic calculation: Total = Subtotal + Shipping + Tax</li>
                              <li>Amount Paid = Total for active orders (Accepted, Paid, Shipped)</li>
                              <li>Amount Paid = $0 for Cancelled or Refunded orders</li>
                              <li>All 243 orders validated for mathematical accuracy</li>
                            </ul>
                          </li>
                        </ul>
                      </div>

                      <div>
                        <h4 className="font-semibold mb-2">Genealogy</h4>
                        <ul className="list-disc pl-6 space-y-1 text-sm">
                          <li>Dedicated Genealogy page (/genealogy) with full-page tree visualization</li>
                          <li>Interactive genealogy tree component (AffiliateGenealogyTree)</li>
                          <li>Visual hierarchy display of entire affiliate network</li>
                          <li>Enrolled_by relationship tracking across all affiliate levels</li>
                          <li>Accessible from main navigation sidebar</li>
                          <li>Real-time data updates from affiliate table</li>
                          <li>Integrated with downline listing and affiliate search</li>
                        </ul>
                      </div>

                      <div>
                        <h4 className="font-semibold mb-2">Account Profile</h4>
                        <ul className="list-disc pl-6 space-y-1 text-sm">
                          <li>Personal information management</li>
                          <li>Avatar customization with image cropping</li>
                          <li>Initials-based avatars with color selection</li>
                          <li>Security settings (password change)</li>
                          <li>Profile header with avatar display</li>
                        </ul>
                      </div>

                      <div>
                        <h4 className="font-semibold mb-2">Company Settings</h4>
                        <ul className="list-disc pl-6 space-y-1 text-sm">
                          <li>Company information management</li>
                          <li>Compensation plan configuration (2-level unilevel)</li>
                          <li>User management with role assignment</li>
                          <li>Social media links configuration</li>
                          <li>Announcements system with targeting (general, dashboard, commissions, genealogy)</li>
                          <li>Announcement scheduling (start/end dates)</li>
                          <li>Show once or persistent announcements</li>
                          <li>Required completion tracking</li>
                          <li><strong>Integrations Management (NEW - November 9, 2025):</strong>
                            <ul className="list-disc pl-6 mt-1">
                              <li>Dedicated Integrations tab for third-party service configuration</li>
                              <li><strong>SendGrid Integration:</strong>
                                <ul className="list-disc pl-6 mt-1">
                                  <li>Email delivery service configuration</li>
                                  <li>API key management (stored securely as environment variable)</li>
                                  <li>From email and from name configuration</li>
                                  <li>Enable/disable toggle for activation</li>
                                </ul>
                              </li>
                              <li><strong>Twilio Integration:</strong>
                                <ul className="list-disc pl-6 mt-1">
                                  <li>SMS and voice service configuration</li>
                                  <li>Account SID and Auth Token management (stored securely)</li>
                                  <li>Twilio phone number configuration</li>
                                  <li>Enable/disable toggle for activation</li>
                                </ul>
                              </li>
                              <li><strong>Resend Integration:</strong>
                                <ul className="list-disc pl-6 mt-1">
                                  <li>Modern email API service configuration</li>
                                  <li>API key management (stored securely as environment variable)</li>
                                  <li>From email and from name configuration</li>
                                  <li>Enable/disable toggle for activation</li>
                                  <li>Currently active for password reset emails</li>
                                </ul>
                              </li>
                              <li><strong>Database Schema:</strong>
                                <ul className="list-disc pl-6 mt-1">
                                  <li>New <code className="bg-gray-100 px-1 py-0.5 rounded">integrations</code> table for storing integration configurations</li>
                                  <li>Fields: integration_name, is_enabled, config (JSONB), timestamps</li>
                                  <li>RLS policies restrict access to admins only</li>
                                  <li>Secure storage of non-sensitive config (from emails, phone numbers)</li>
                                  <li>API keys stored as environment variables via save-integration-secret edge function</li>
                                </ul>
                              </li>
                              <li><strong>UI Features:</strong>
                                <ul className="list-disc pl-6 mt-1">
                                  <li>Card-based layout for each integration service</li>
                                  <li>Service logos and descriptions for easy identification</li>
                                  <li>Password-masked fields for API keys and tokens</li>
                                  <li>Individual save buttons per integration</li>
                                  <li>Form validation with error messaging</li>
                                </ul>
                              </li>
                            </ul>
                          </li>
                          <li>Soft-Delete & Deleted Folder System:
                            <ul className="list-disc pl-6 mt-1">
                              <li><strong>Soft-Delete Functionality:</strong>
                                <ul className="list-disc pl-6 mt-1">
                                  <li>Soft-delete system for customers, affiliates, and orders</li>
                                  <li>Records marked as deleted with deleted_at timestamp and deleted_by admin ID</li>
                                  <li>Deleted records excluded from normal views via RLS policies</li>
                                  <li>Automatic tracking of which admin performed the deletion</li>
                                  <li>All soft-deleted records retain full data and relationships</li>
                                </ul>
                              </li>
                              <li><strong>Deleted Folder Interface:</strong>
                                <ul className="list-disc pl-6 mt-1">
                                  <li>Three separate tabs: Deleted Customers, Deleted Affiliates, Deleted Orders</li>
                                  <li>View all soft-deleted records with deletion timestamp</li>
                                  <li>Deleted By column displays full name of admin who performed deletion</li>
                                  <li>Record count badge shows number of deleted records in each category</li>
                                  <li>Admin-only access to deleted records management</li>
                                </ul>
                              </li>
                              <li><strong>Restore Functionality:</strong>
                                <ul className="list-disc pl-6 mt-1">
                                  <li>Single-click restore button for each deleted record</li>
                                  <li>Moves records back to active state by clearing deleted_at and deleted_by</li>
                                  <li>Restores full record with all relationships intact</li>
                                  <li>Immediate removal from Deleted Folder after restore</li>
                                  <li>No data loss during soft-delete or restore operations</li>
                                </ul>
                              </li>
                              <li><strong>Permanent Delete with Audit Logging:</strong>
                                <ul className="list-disc pl-6 mt-1">
                                  <li>Permanent delete button for irreversible deletion from database</li>
                                  <li>Creates deletion_logs entry for each permanently deleted record</li>
                                  <li>Deletion logs include: entity type, ID, identifier, name, admin, timestamp</li>
                                  <li>Logs stored permanently in deletion_logs table for compliance</li>
                                  <li>Cannot be undone - requires confirmation dialog</li>
                                </ul>
                              </li>
                              <li><strong>Empty Folder (Bulk Permanent Delete):</strong>
                                <ul className="list-disc pl-6 mt-1">
                                  <li>Appears when 2 or more records exist in a deleted folder tab</li>
                                  <li>Bulk permanently deletes all records in folder with single action</li>
                                  <li>Creates individual deletion log for each deleted record</li>
                                  <li>Marks bulk deletions with deletion_type="bulk_empty_folder"</li>
                                  <li>Confirmation dialog shows exact count of records to be deleted</li>
                                  <li>Bulk count stored in deletion log additional_info JSONB field</li>
                                  <li>All individual deletions tracked separately for audit trail</li>
                                </ul>
                              </li>
                              <li><strong>Deletion Audit Logs (View Deletion Logs button):</strong>
                                <ul className="list-disc pl-6 mt-1">
                                  <li>Comprehensive audit log viewer dialog displaying permanent deletions</li>
                                  <li>Shows last 100 permanent deletions with full details by default</li>
                                  <li>Advanced filtering capabilities:
                                    <ul className="list-disc pl-6 mt-1">
                                      <li><strong>Record Type Filter:</strong> Checkboxes for Customers, Affiliates, Orders (multi-select)</li>
                                      <li><strong>Date Range Filters:</strong> Start Date and End Date pickers for custom time ranges</li>
                                      <li><strong>Deleted By Filter:</strong> Dropdown of all admins (populated from Company Settings → Users)</li>
                                      <li>Dynamically queries user_roles table for admin users</li>
                                      <li>Joins with profiles table to display admin first and last names</li>
                                      <li>"All Admins" option to view deletions by any administrator</li>
                                      <li>Clear Filters button to reset all filters to default state</li>
                                    </ul>
                                  </li>
                                  <li>Table displays: Type badge, Identifier, Name, Deletion Type, Deleted By, Deletion Date</li>
                                  <li>Deletion Type shows "Single" or "Bulk (X)" with record count for bulk operations</li>
                                  <li>Bulk deletions color-coded with destructive variant badge</li>
                                  <li>Full name resolution for deleted_by admin from profiles table</li>
                                  <li>Formatted timestamps (e.g., "Jan 15, 2025 3:45 PM")</li>
                                  <li>Filters apply real-time to query results for performance</li>
                                  <li>Scrollable table view for large result sets</li>
                                </ul>
                              </li>
                            </ul>
                          </li>
                        </ul>
                      </div>

                      <div>
                        <h4 className="font-semibold mb-2">Communications</h4>
                        <ul className="list-disc pl-6 space-y-1 text-sm">
                          <li>Email template management with categories</li>
                          <li>Rich text editor for email content</li>
                          <li>Master template system (header/footer wrapping)</li>
                          <li>SMS tab (placeholder for future implementation)</li>
                          <li>Template activation/deactivation</li>
                        </ul>
                      </div>

                      <div>
                        <h4 className="font-semibold mb-2">Commissions Management - Fully Automated</h4>
                        <ul className="list-disc pl-6 space-y-1 text-sm">
                          <li>Automatic commission period creation (weekly 7-day cycles starting Monday 12:00 AM CST, ending Sunday 11:59 PM CST)</li>
                          <li>Automatic commission calculation when orders arrive from Shopify API</li>
                          <li>Automatic updates for cancelled orders</li>
                          <li>Automatic updates for refunded orders with negative adjustments</li>
                          <li>Automatic updates for charged back orders with negative adjustments</li>
                          <li>Period actions: View, Close, Fund, Re-Open, Add Adjustments</li>
                          <li>Negative commission rollover to subsequent periods</li>
                          <li>Tipalti account verification with commission rollover</li>
                          <li>Commission period breakdown by affiliate with Level 1 and Level 2 tracking</li>
                          <li>Manual adjustment capability for open periods only</li>
                          <li>Export commission periods to Excel</li>
                          <li>Commission period status management (Open, Closed Not Paid, Closed Paid)</li>
                          <li>Display in Back Office toggle for period visibility</li>
                          <li>Comprehensive Adjustment History page with advanced filtering:
                            <ul className="list-disc pl-6 mt-1">
                              <li>Search by affiliate name, affiliate ID, or commission period</li>
                              <li>Date range filters: This Week, Last Week, This Month, Last Month, This Year, Last Year, Custom Range with custom date pickers</li>
                              <li>Filter by admin who made the adjustment:
                                <ul className="list-disc pl-6 mt-1">
                                  <li>Dynamically queries user_roles table for all users with role='admin'</li>
                                  <li>Joins with profiles table to retrieve first_name and last_name</li>
                                  <li>Dropdown displays actual admin names (e.g., Ashley Lewis, Brittney Hamblin, Larry Puckett)</li>
                                  <li>Updates automatically when admins are added/removed from the system</li>
                                  <li>Includes "All Admins" option to view adjustments from all administrators</li>
                                  <li>Error handling displays appropriate message if admin data cannot be loaded</li>
                                </ul>
                              </li>
                              <li>View full adjustment notes in modal dialog (for notes longer than display limit)</li>
                              <li>Edit adjustments directly from history (opens adjustment dialog for specific affiliate/period combination)</li>
                              <li>Delete adjustments with confirmation dialog:
                                <ul className="list-disc pl-6 mt-1">
                                  <li>Delete button visible for each adjustment row</li>
                                  <li>Requires confirmation before deletion</li>
                                  <li>Shows adjustment details in confirmation dialog (amount, reason)</li>
                                  <li>Recalculates period totals automatically after deletion</li>
                                  <li>Available in both Adjustment History page and period detail views</li>
                                </ul>
                              </li>
                              <li>Display actual admin name who created each adjustment (from profiles table via foreign key)</li>
                              <li>Shows comprehensive period details:
                                <ul className="list-disc pl-6 mt-1">
                                  <li>Period number (e.g., #123)</li>
                                  <li>Period start and end dates (MM/DD/YY format)</li>
                                  <li>Affiliate name (first and last)</li>
                                  <li>Affiliate ID</li>
                                  <li>Adjustment amount (right-aligned, formatted with $ and 2 decimals)</li>
                                  <li>Admin who created the adjustment</li>
                                  <li>Date and time of adjustment creation (MMM d, yyyy, hh:mm a format)</li>
                                  <li>Adjustment reason/notes with full text wrapping</li>
                                </ul>
                              </li>
                              <li>Visual color coding:
                                <ul className="list-disc pl-6 mt-1">
                                  <li>Positive adjustments display in green with + prefix</li>
                                  <li>Negative adjustments display in red</li>
                                </ul>
                              </li>
                              <li>Real-time result count display showing filtered adjustment count</li>
                              <li>Database foreign key relationships:
                                <ul className="list-disc pl-6 mt-1">
                                  <li>user_roles.user_id → profiles.id (enables admin name lookup)</li>
                                  <li>commission_period_adjustments.created_by → profiles.id (enables creator name display)</li>
                                </ul>
                              </li>
                            </ul>
                          </li>
                        </ul>
                      </div>

                      <div>
                        <h4 className="font-semibold mb-2">Authentication & Authorization</h4>
                        <ul className="list-disc pl-6 space-y-1 text-sm">
                          <li>Email/password authentication</li>
                          <li>Protected routes</li>
                          <li>Role-based access control (admin/user)</li>
                          <li>Profile auto-creation on signup</li>
                          <li><strong>Bulk Affiliate Authentication Setup (NEW - November 9, 2025):</strong>
                            <ul className="list-disc pl-6 mt-1">
                              <li>One-time bulk affiliate authentication setup via bulk-setup-affiliates edge function</li>
                              <li>Automatically creates auth.users accounts for all eligible affiliates without existing authentication</li>
                              <li>Eligibility criteria: Status NOT in (inactive, rejected, cancelled, terminated) AND auth_user_id is NULL</li>
                              <li>Process per affiliate:
                                <ul className="list-disc pl-6 mt-1">
                                  <li>Creates Auth user with affiliate's email</li>
                                  <li>Sets default password: "Test2025$" for testing purposes</li>
                                  <li>Confirms email automatically (no email verification required)</li>
                                  <li>Links auth_user_id in affiliates table</li>
                                  <li>Creates 'affiliate' role entry in user_roles table</li>
                                  <li>Syncs user_metadata with affiliate first/last name</li>
                                </ul>
                              </li>
                              <li>Batch processing: Processed 23 affiliates successfully in production</li>
                              <li>Error handling: Individual affiliate failures don't block batch process</li>
                              <li>Returns detailed results: created, updated, and failed counts per affiliate</li>
                              <li>Security: Function configured with verify_jwt = true after one-time execution</li>
                            </ul>
                          </li>
                          <li><strong>Admin Password Reset (NEW - November 9, 2025):</strong>
                            <ul className="list-disc pl-6 mt-1">
                              <li>Emergency admin password reset via admin-set-password edge function</li>
                              <li>One-time use function for restoring admin access</li>
                              <li>Security restrictions:
                                <ul className="list-disc pl-6 mt-1">
                                  <li>Hardcoded to only work for specific admin email (rp@robert-proctor.com)</li>
                                  <li>Requires both email and newPassword in request body</li>
                                  <li>Returns 403 Forbidden for any other email addresses</li>
                                  <li>Function locked with verify_jwt = true after use</li>
                                </ul>
                              </li>
                              <li>Process flow:
                                <ul className="list-disc pl-6 mt-1">
                                  <li>Lists all users to find matching email</li>
                                  <li>Updates password using Admin API</li>
                                  <li>Returns 404 if user not found</li>
                                  <li>Returns success confirmation on completion</li>
                                </ul>
                              </li>
                              <li>Use case: Restore admin access when password is lost and email delivery fails</li>
                              <li>Implementation note: Created as emergency tool, should be disabled after use</li>
                            </ul>
                          </li>
                          <li>Forgot Password functionality:
                            <ul className="list-disc pl-6 mt-1">
                              <li>Accessible from login page (/auth)</li>
                              <li>Generates temporary random 12-character password</li>
                              <li>Updates user password in Auth using admin API</li>
                              <li>Retrieves user's first/last name from profiles table or user metadata</li>
                              <li>Sends email via Resend using 'temporary_password' template from email_templates table</li>
                              <li>Email includes temporary password and direct link to password reset page</li>
                              <li>Reset link format: https://theon.global/reset-password?token=[temp_password]&email=[user_email]</li>
                              <li>Uses same email template and flow as admin-initiated "Send Temporary Password"</li>
                              <li>Fallback HTML template if database template not available</li>
                              <li>Security: Returns success message even if user doesn't exist (prevents user enumeration)</li>
                            </ul>
                          </li>
                          <li>Password Reset Page (/reset-password):
                            <ul className="list-disc pl-6 mt-1">
                              <li>Accepts temporary password and new password input</li>
                              <li>Validates password confirmation match</li>
                              <li>Signs in with temporary password via Auth system</li>
                              <li>Updates to new password if temporary password is valid</li>
                              <li>Password visibility toggle for all password fields</li>
                              <li>Automatically redirects to dashboard after successful password reset</li>
                              <li>Displays appropriate error messages for invalid temporary passwords</li>
                            </ul>
                          </li>
                        </ul>
                      </div>

                      <div>
                        <h4 className="font-semibold mb-2">KYC (Know Your Customer) Process</h4>
                        <ul className="list-disc pl-6 space-y-1 text-sm">
                          <li><strong>KYC Completion Flow:</strong>
                            <ul className="list-disc pl-6 mt-1">
                              <li>New affiliates complete KYC verification after signup</li>
                              <li>KYC Completion page (/kyc-completion) collects required information</li>
                              <li>Form fields: Phone, Address Line 1, Address Line 2, City, State/Province, Postal Code, Tax ID</li>
                              <li>All fields required except Address Line 2</li>
                              <li>Form validation ensures complete data before submission</li>
                            </ul>
                          </li>
                          <li><strong>Duplicate Detection System:</strong>
                            <ul className="list-disc pl-6 mt-1">
                              <li>Automated checks for existing records with same email, phone, address, or tax ID</li>
                              <li>Checks both affiliates and customers tables</li>
                              <li>Duplicate found triggers automatic rejection</li>
                              <li>Returns specific rejection reasons (e.g., "Duplicate email found in affiliates", "Duplicate address found in customers")</li>
                            </ul>
                          </li>
                          <li><strong>Affiliate Approval/Rejection Process:</strong>
                            <ul className="list-disc pl-6 mt-1">
                              <li>process-kyc edge function handles verification logic</li>
                              <li>If NO duplicates found:
                                <ul className="list-disc pl-6 mt-1">
                                  <li>Updates affiliate record with submitted KYC data</li>
                                  <li>Sets kyc_pass = true</li>
                                  <li>Sets status to "active"</li>
                                  <li>Redirects to affiliate dashboard</li>
                                </ul>
                              </li>
                              <li>If duplicates found:
                                <ul className="list-disc pl-6 mt-1">
                                  <li>Creates customer record with affiliate data</li>
                                  <li>Adds note to customer: "KYC Failed - [rejection reasons]"</li>
                                  <li>Updates affiliate status to "inactive"</li>
                                  <li>Stores rejection reason in kyc_rejection_reason field</li>
                                  <li>Sends email notification to enrolling affiliate</li>
                                  <li>Shows rejection message to applicant with specific reasons</li>
                                </ul>
                              </li>
                            </ul>
                          </li>
                          <li><strong>Admin KYC Review Page:</strong>
                            <ul className="list-disc pl-6 mt-1">
                              <li>Admin-only KYC Review page (/kyc-review) for manual oversight</li>
                              <li>Displays all affiliates pending KYC approval</li>
                              <li>Shows submitted KYC data for review</li>
                              <li>Manual approve/reject capability</li>
                              <li>Can manually convert rejected customers to affiliates later</li>
                            </ul>
                          </li>
                          <li><strong>Email Notifications:</strong>
                            <ul className="list-disc pl-6 mt-1">
                              <li>Enrolling affiliate notified when their referral fails KYC</li>
                              <li>Email includes rejection details and customer information</li>
                              <li>Sent via Resend email service</li>
                            </ul>
                          </li>
                        </ul>
                      </div>

                      <div>
                        <h4 className="font-semibold mb-2">UI/UX Features</h4>
                        <ul className="list-disc pl-6 space-y-1 text-sm">
                          <li>Responsive sidebar navigation</li>
                          <li>Mobile-optimized layouts</li>
                          <li>Toast notifications</li>
                          <li>Loading states</li>
                          <li>Error handling</li>
                          <li>Confirmation dialogs</li>
                          <li>Consistent design system with Tailwind semantic tokens</li>
                        </ul>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <h3 className="text-xl font-semibold">🚧 Partially Implemented / Needs Enhancement</h3>
                      <Badge variant="outline" className="bg-yellow-50">In Progress</Badge>
                    </div>
                    
                    <ul className="list-disc pl-6 space-y-2 text-sm">
                      <li><strong>Shopify Integration:</strong> Dialogs for sync exist but actual API integration not implemented</li>
                    </ul>
                  </div>

                  <Separator />

                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <h3 className="text-xl font-semibold">❌ Not in Current Prototype - Required for Production</h3>
                      <Badge variant="outline" className="bg-red-50">Requirements Documented Below</Badge>
                    </div>
                    
                    <ul className="list-disc pl-6 space-y-2 text-sm">
                      <li><strong>Replicated Site System:</strong> Automated creation and management of affiliate replicated sites (will be completed by E2 development team)</li>
                      <li><strong>Tipalti API Integration:</strong> Commission payment processing, payee management, and iFrame integration (see Tipalti Integration Requirements section)</li>
                      <li><strong>RingCentral REST API:</strong> Phase 2 enhancement for call logging, SMS, and webhooks - Phase 1 deep linking already implemented (see RingCentral Integration Requirements section)</li>
                      <li>Link generator for affiliates (optional suggestion, not included in Phase I)</li>
                      <li>Marketing tools and assets (optional suggestion, not included in Phase I)</li>
                      <li>SMS sending functionality (optional suggestion, not included in Phase I)</li>
                    </ul>
                  </div>
                </div>
              </Card>

              {/* Awtomic Subscription Integration */}
              <Card className="p-4 sm:p-6">
                <h2 className="text-2xl font-bold mb-4">Awtomic Subscription Integration Requirements</h2>
                <Badge variant="default" className="mb-4">Production Ready</Badge>
                
                <div className="space-y-4">
                  <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-4">
                    <h3 className="font-semibold mb-2 text-orange-900">Integration Overview</h3>
                    <p className="text-sm text-orange-800 mb-2">
                      Awtomic is a Shopify subscription management app already integrated with the TheonGlobal.com Shopify store. 
                      When customers or affiliates with active subscriptions update their default shipping address in either the back office 
                      or Shopify, the system must synchronize this change to Awtomic to ensure subscription orders ship to the correct address.
                    </p>
                    <p className="text-sm text-orange-800 font-semibold">
                      Critical: The back office system must maintain control of Awtomic updates. Do NOT rely on Shopify's native integration 
                      to update Awtomic directly.
                    </p>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold mb-2">Address Update Workflows</h3>
                    
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                      <h4 className="font-semibold mb-2 text-blue-900">Workflow 1: Back Office → Shopify → Awtomic</h4>
                      <p className="text-sm text-blue-800 mb-2">When a customer/affiliate with a subscription updates their default address in the back office:</p>
                      <ol className="list-decimal pl-6 space-y-2 text-sm text-blue-800">
                        <li>User updates address in back office customer/affiliate management interface</li>
                        <li>Back office validates address data</li>
                        <li>System checks if customer/affiliate has active subscriptions (query Awtomic API)</li>
                        <li>Update Shopify customer default address via Shopify Customer Address API:
                          <ul className="list-disc pl-6 mt-1">
                            <li>PUT /admin/api/2025-04/customers/&#123;customer_id&#125;/addresses/&#123;address_id&#125;.json</li>
                            <li>PUT /admin/api/2025-04/customers/&#123;customer_id&#125;/addresses/&#123;address_id&#125;/default.json</li>
                          </ul>
                        </li>
                        <li>If active subscriptions exist, update Awtomic subscription shipping address</li>
                        <li>Log all updates with timestamps and success/failure status</li>
                        <li>Display confirmation or error messages to admin user</li>
                      </ol>
                    </div>

                    <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 mb-4">
                      <h4 className="font-semibold mb-2 text-purple-900">Workflow 2: Shopify → Back Office → Awtomic</h4>
                      <p className="text-sm text-purple-800 mb-2">When a customer/affiliate updates their default address directly in Shopify:</p>
                      <ol className="list-decimal pl-6 space-y-2 text-sm text-purple-800">
                        <li>Shopify address change occurs (via storefront, customer portal, or Shopify admin)</li>
                        <li>Back office detects change via webhook (preferred) or scheduled polling:
                          <ul className="list-disc pl-6 mt-1">
                            <li><strong>Webhook Option:</strong> Subscribe to customers/update webhook from Shopify</li>
                            <li><strong>Polling Option:</strong> Periodic check of customer address updates (less optimal)</li>
                          </ul>
                        </li>
                        <li>Back office updates local customer/affiliate address records</li>
                        <li>System checks if customer/affiliate has active subscriptions (query Awtomic API)</li>
                        <li>If active subscriptions exist, back office updates Awtomic subscription shipping address</li>
                        <li>Log all updates with source (Shopify), timestamps, and sync status</li>
                        <li><strong>Critical:</strong> Back office maintains full control - do NOT rely on Shopify → Awtomic sync</li>
                      </ol>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold mb-2">Awtomic API Integration Details</h3>
                    
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                      <h4 className="font-semibold mb-2 text-green-900">Authentication</h4>
                      <ul className="list-disc pl-6 space-y-2 text-sm text-green-800">
                        <li><strong>API Key Location:</strong> Generated in Awtomic admin dashboard (requires Standard plan or higher)</li>
                        <li><strong>Authorization Header:</strong> Include API key in Authorization header for all requests</li>
                        <li><strong>Base URL:</strong> https://api.awtomic.com</li>
                        <li><strong>Format:</strong> RESTful API with JSON request/response bodies</li>
                      </ul>
                    </div>

                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                      <h4 className="font-semibold mb-2 text-yellow-900">Required API Endpoints</h4>
                      <ul className="list-disc pl-6 space-y-2 text-sm text-yellow-800">
                        <li><strong>GET</strong> /customers/&#123;customerId&#125;/subscriptions
                          <ul className="list-disc pl-6 mt-1">
                            <li>Retrieve all subscriptions for a customer</li>
                            <li>Check subscription status before updating addresses</li>
                            <li>Parameters: customerId (Shopify customer ID), limit, expandLines</li>
                            <li>Returns: Array of subscription objects with SubscriptionId, SubscriptionStatus, NextBillingDate</li>
                          </ul>
                        </li>
                        <li><strong>PUT/PATCH</strong> /customers/&#123;customerId&#125;/subscriptions/&#123;subscriptionId&#125;
                          <ul className="list-disc pl-6 mt-1">
                            <li>Update subscription details including shipping address</li>
                            <li>Only update active subscriptions (SubscriptionStatus = "active")</li>
                            <li>Address fields: address_1, address_2, city, province (state), postal_code, country, phone</li>
                            <li>Map back office address format to Awtomic's expected format</li>
                          </ul>
                        </li>
                      </ul>
                      <p className="text-sm text-yellow-800 mt-2 font-semibold">
                        Note: Awtomic's documentation may have limited public endpoint details. Work with Awtomic support 
                        (support@awtomic.com) to confirm exact subscription update endpoint path and payload structure.
                      </p>
                    </div>

                    <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                      <h4 className="font-semibold mb-2 text-red-900">Rate Limiting & Error Handling</h4>
                      <ul className="list-disc pl-6 space-y-2 text-sm text-red-800">
                        <li><strong>Standard Rate Limits:</strong> 100 requests per second, 10,000 requests per day</li>
                        <li><strong>Enterprise Options:</strong> Higher limits available for Enterprise customers</li>
                        <li><strong>Retry Logic:</strong> Implement exponential backoff for rate limit errors (HTTP 429)</li>
                        <li><strong>Error Logging:</strong> Log all failed Awtomic API calls with error details</li>
                        <li><strong>Fallback Behavior:</strong> If Awtomic update fails, log error but don't block Shopify update</li>
                        <li><strong>Admin Notifications:</strong> Alert admins of repeated Awtomic sync failures</li>
                      </ul>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold mb-2">Data Mapping & Validation</h3>
                    <ul className="list-disc pl-6 space-y-2">
                      <li><strong>Customer ID Matching:</strong> Use Shopify customer ID as customerId in Awtomic API calls</li>
                      <li><strong>Address Field Mapping:</strong>
                        <ul className="list-disc pl-6 mt-1">
                          <li>back_office.address → awtomic.address_1</li>
                          <li>back_office.address2 → awtomic.address_2</li>
                          <li>back_office.city → awtomic.city</li>
                          <li>back_office.state_province → awtomic.province</li>
                          <li>back_office.postal_code → awtomic.postal_code</li>
                          <li>back_office.country → awtomic.country</li>
                          <li>back_office.phone → awtomic.phone</li>
                        </ul>
                      </li>
                      <li><strong>Validation Rules:</strong>
                        <ul className="list-disc pl-6 mt-1">
                          <li>Verify address format before sending to Awtomic</li>
                          <li>Validate postal code format for country</li>
                          <li>Ensure required fields (address_1, city, postal_code, country) are present</li>
                          <li>Phone number format validation</li>
                        </ul>
                      </li>
                      <li><strong>Subscription Status Check:</strong> Only update subscriptions with status = "active" (skip paused, cancelled)</li>
                    </ul>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold mb-2">Implementation Considerations</h3>
                    <ul className="list-disc pl-6 space-y-2">
                      <li><strong>Batch Updates:</strong> If customer has multiple active subscriptions, update all in a single operation if API supports batch</li>
                      <li><strong>Testing:</strong> Test with Awtomic sandbox/development environment before production</li>
                      <li><strong>Audit Trail:</strong> Log all address changes with:
                        <ul className="list-disc pl-6 mt-1">
                          <li>Timestamp of change</li>
                          <li>Source system (back office or Shopify)</li>
                          <li>Admin user who made the change (if from back office)</li>
                          <li>Old address and new address values</li>
                          <li>Shopify update status (success/failure)</li>
                          <li>Awtomic update status (success/failure/skipped)</li>
                          <li>Subscription IDs affected</li>
                        </ul>
                      </li>
                      <li><strong>Admin Interface:</strong> Provide visibility into sync status in customer/affiliate detail views:
                        <ul className="list-disc pl-6 mt-1">
                          <li>Display subscription count</li>
                          <li>Show last address sync timestamp</li>
                          <li>Indicate any sync failures with retry option</li>
                        </ul>
                      </li>
                      <li><strong>Performance:</strong> Address updates should be asynchronous to avoid blocking UI operations</li>
                      <li><strong>Security:</strong> Store Awtomic API key securely (environment variables, encrypted storage)</li>
                    </ul>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold mb-2">Recommended Development Approach</h3>
                    <ol className="list-decimal pl-6 space-y-2">
                      <li><strong>Phase 1:</strong> Implement back office → Shopify address sync (without Awtomic)</li>
                      <li><strong>Phase 2:</strong> Add Awtomic API integration for subscription queries</li>
                      <li><strong>Phase 3:</strong> Implement back office → Awtomic subscription address updates</li>
                      <li><strong>Phase 4:</strong> Add Shopify → back office webhook listener</li>
                      <li><strong>Phase 5:</strong> Complete Shopify → back office → Awtomic workflow</li>
                      <li><strong>Phase 6:</strong> Add comprehensive logging, error handling, and admin UI enhancements</li>
                    </ol>
                  </div>
                </div>
              </Card>

              {/* Shopify Integration Requirements */}
              <Card className="p-4 sm:p-6">
                <h2 className="text-2xl font-bold mb-4">Shopify Integration Requirements</h2>
                <Badge variant="default" className="mb-4">Production Ready</Badge>
                
                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-semibold mb-2">Core Integration Points</h3>
                    <ul className="list-disc pl-6 space-y-2">
                      <li><strong>Store URL:</strong> TheonGlobal.com Shopify system</li>
                      <li><strong>Replicated Sites:</strong> Create replicated sites maintaining format like https://theonglobal.com/?ref=laire</li>
                      <li><strong>Bi-Directional Sync:</strong> Orders, customers, and affiliates must sync both ways</li>
                    </ul>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold mb-2">Order Synchronization</h3>
                    <ul className="list-disc pl-6 space-y-2">
                      <li><strong>Order Number Matching:</strong> Order numbers in back office should match Shopify order numbers (no separate ID generation)</li>
                      <li><strong>Historical Order Import:</strong> Import historical orders from Exigo system
                        <ul className="list-disc pl-6 mt-1">
                          <li>Shopify Order # is currently stored in notes field at order level</li>
                          <li>Parse this information and store in dedicated order history field</li>
                          <li>Make Shopify order number searchable in back office</li>
                        </ul>
                      </li>
                      <li>Real-time or scheduled pull of new orders from Shopify</li>
                      <li>Push order updates back to Shopify when modified in back office</li>
                      <li>Handle cancelled orders:
                        <ul className="list-disc pl-6 mt-1">
                          <li>If cancelled in current commission period: mark cancelled, no commissions paid</li>
                          <li>If cancelled after commission period closed: create negative adjustment tracked to specific order number</li>
                        </ul>
                      </li>
                      <li>Handle refunded orders:
                        <ul className="list-disc pl-6 mt-1">
                          <li>If refunded in current commission period: mark refunded, no commissions paid</li>
                          <li>If refunded after commission period closed: create negative adjustment tracked to specific order number</li>
                        </ul>
                      </li>
                      <li>Handle charged back orders:
                        <ul className="list-disc pl-6 mt-1">
                          <li>If charged back in current commission period: mark charged back, no commissions paid</li>
                          <li>If charged back after commission period closed: create negative adjustment (clawback) tracked to specific order number for both Level 1 and Level 2 affiliates</li>
                        </ul>
                      </li>
                    </ul>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold mb-2">Customer/Affiliate Synchronization</h3>
                    <ul className="list-disc pl-6 space-y-2">
                      <li><strong>ID Matching:</strong> Customer IDs and Affiliate IDs in back office should match Shopify customer IDs (no separate ID generation moving forward)</li>
                      <li>Import all customers from current Exigo system into separated tables (currently customers and affiliates are combined in same table)</li>
                      <li><strong>Address Update Flow - Back Office to Shopify & Awtomic:</strong> When address/phone/email updated in back office:
                        <ul className="list-disc pl-6 mt-1">
                          <li>Update Shopify customer default address via Shopify Customer Address API</li>
                          <li>Update Awtomic subscription shipping address for customers/affiliates with active subscriptions</li>
                          <li>See Awtomic Integration Requirements section for detailed workflow</li>
                        </ul>
                      </li>
                      <li><strong>Address Update Flow - Shopify to Back Office & Awtomic:</strong> When address/phone/email updated in Shopify:
                        <ul className="list-disc pl-6 mt-1">
                          <li>Pull/push updated address to back office (developer's discretion on webhook vs polling)</li>
                          <li>Back office system then updates Awtomic subscription shipping address</li>
                          <li>Do NOT rely on Shopify app to update Awtomic directly - back office maintains control</li>
                          <li>See Awtomic Integration Requirements section for detailed workflow</li>
                        </ul>
                      </li>
                    </ul>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold mb-2">Shopify API Endpoints Required</h3>
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                      <h4 className="font-semibold mb-2 text-blue-900">Customer Address Management</h4>
                      <ul className="list-disc pl-6 space-y-2 text-sm text-blue-800">
                        <li><strong>GET</strong> /admin/api/2025-04/customers/&#123;customer_id&#125;/addresses.json
                          <ul className="list-disc pl-6 mt-1">
                            <li>Retrieve all addresses for a customer</li>
                            <li>Required to identify default address and validate address IDs</li>
                          </ul>
                        </li>
                        <li><strong>PUT</strong> /admin/api/2025-04/customers/&#123;customer_id&#125;/addresses/&#123;address_id&#125;.json
                          <ul className="list-disc pl-6 mt-1">
                            <li>Update an existing customer address</li>
                            <li>Use when modifying default address from back office</li>
                          </ul>
                        </li>
                        <li><strong>PUT</strong> /admin/api/2025-04/customers/&#123;customer_id&#125;/addresses/&#123;address_id&#125;/default.json
                          <ul className="list-disc pl-6 mt-1">
                            <li>Set the default address for a customer</li>
                            <li>Required after creating or updating addresses</li>
                          </ul>
                        </li>
                      </ul>
                    </div>

                    <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 mb-4">
                      <h4 className="font-semibold mb-2 text-purple-900">API Requirements</h4>
                      <ul className="list-disc pl-6 space-y-2 text-sm text-purple-800">
                        <li><strong>Access Scope:</strong> `customers` scope required</li>
                        <li><strong>Protected Customer Data:</strong> Must request access to protected customer data</li>
                        <li><strong>API Version:</strong> Use 2025-04 or later (REST Admin API is legacy as of Oct 2024)</li>
                        <li><strong>Migration Note:</strong> Consider migrating to GraphQL Admin API for future-proofing</li>
                        <li><strong>Authentication:</strong> Use Shopify Admin API access token with proper scopes</li>
                      </ul>
                    </div>

                    <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                      <h4 className="font-semibold mb-2 text-green-900">Alternative: GraphQL Admin API (Recommended)</h4>
                      <p className="text-sm text-green-800 mb-2">Starting April 1, 2025, all new public apps must use GraphQL Admin API exclusively.</p>
                      <ul className="list-disc pl-6 space-y-2 text-sm text-green-800">
                        <li><strong>Mutation:</strong> customerUpdate - Updates customer information including addresses</li>
                        <li><strong>Mutation:</strong> customerUpdateDefaultAddress - Sets default address for a customer</li>
                        <li><strong>Query:</strong> customer - Retrieves customer details including address list</li>
                        <li><strong>Benefits:</strong> More efficient, better performance, future-proof, single endpoint</li>
                      </ul>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold mb-2">Shopify Metafields</h3>
                    <p className="mb-2">The following metafields exist in Shopify Customers module:</p>
                    <ul className="list-disc pl-6 space-y-2">
                      <li><strong>Exigo Webalias:</strong> URL of affiliate's replicated site (if customer is also affiliate)</li>
                      <li><strong>Exigo Referral:</strong> URL of enrolling affiliate's replicated website (e.g., laire, lawrencepuckett)</li>
                      <li><strong>Exigo Customer ID:</strong> ID for both customers and affiliates in Exigo system</li>
                      <li><strong>Exigo CustomerType:</strong> 1 = Customer, 3 = Affiliate</li>
                    </ul>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold mb-2">Replicated Site Rules</h3>
                    <ul className="list-disc pl-6 space-y-2">
                      <li>When visitor orders from inactive/terminated affiliate site: accept order, roll commissions up to active enroller</li>
                      <li>When visitor signs up as affiliate from inactive/terminated site: enroll directly to company</li>
                      <li>Affiliate enrollment validation:
                        <ul className="list-disc pl-6 mt-1">
                          <li>Only allow alpha-numerical characters for site name (no special characters)</li>
                          <li><strong>Critical:</strong> Do NOT allow affiliates to enter their email address as their replicated site name</li>
                          <li>Validation should reject any input that resembles an email format</li>
                        </ul>
                      </li>
                    </ul>
                  </div>
                </div>
              </Card>

              {/* KYC Process */}
              <Card className="p-4 sm:p-6">
                <h2 className="text-2xl font-bold mb-4">KYC (Know Your Customer) - Affiliate Approval Process</h2>
                
                <div className="space-y-4">
                  <p className="mb-4">
                    <strong>Core Rule:</strong> Affiliates are not permitted to have more than one account (position) within the system.
                  </p>

                  <div>
                    <h3 className="text-lg font-semibold mb-2">Process Flow</h3>
                    <ol className="list-decimal pl-6 space-y-2">
                      <li>New affiliates enroll through Shopify</li>
                      <li>System presents KYC verification screen</li>
                      <li>System checks for duplicates:
                        <ul className="list-disc pl-6 mt-1">
                          <li>Duplicate Address</li>
                          <li>Duplicate Email</li>
                          <li>Duplicate Phone</li>
                          <li>Duplicate Tax ID</li>
                        </ul>
                      </li>
                      <li><strong>If Approved:</strong> Create affiliate account and replicated site</li>
                      <li><strong>If Not Approved:</strong>
                        <ul className="list-disc pl-6 mt-1">
                          <li>Create customer account instead (not affiliate)</li>
                          <li>Set status to inactive automatically</li>
                          <li>Add note: "Did not pass KYC - [reasons]" (e.g., Duplicate Address, Duplicate Email)</li>
                          <li>Customer account can be manually converted to affiliate later if approved</li>
                        </ul>
                      </li>
                    </ol>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold mb-2">Implementation Notes</h3>
                    <ul className="list-disc pl-6 space-y-2">
                      <li>Duplicate detection must run before account creation</li>
                      <li>All duplicate reasons must be stored in customer notes</li>
                      <li>System should support manual override by admin</li>
                      <li>Conversion from customer to affiliate should trigger KYC re-check</li>
                    </ul>
                  </div>
                </div>
              </Card>

              {/* Commission Calculation Rules */}
              <Card className="p-4 sm:p-6">
                <h2 className="text-2xl font-bold mb-4">Commission Calculation Rules</h2>
                
                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-semibold mb-2">Compensation Plan Structure</h3>
                    <ul className="list-disc pl-6 space-y-2">
                      <li><strong>Plan Type:</strong> 2-Level Unilevel</li>
                      <li><strong>Level 1:</strong> 25% from personal customers' purchases</li>
                      <li><strong>Level 2:</strong> 12% from personally enrolled affiliates' customers' purchases</li>
                      <li><strong>Commissionable Volume:</strong> Sales price of order (excluding shipping, handling, taxes)</li>
                      <li><strong>No CV System:</strong> Commissions calculated directly on sales amount</li>
                    </ul>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold mb-2">Commission Periods - Automated System</h3>
                    <ul className="list-disc pl-6 space-y-2">
                      <li><strong>Cycle:</strong> Weekly (7-day periods)</li>
                      <li><strong>Start Time:</strong> Monday at 12:00 AM CST</li>
                      <li><strong>End Time:</strong> Sunday at 11:59 PM CST</li>
                      <li><strong>Auto-Creation:</strong> Commission periods are automatically created when the last commission period ends. For example, if the last period ended on 10/26/25, a new period of 10/27/25 - 11/2/25 is automatically created.</li>
                      <li><strong>Default Settings:</strong> When automatically created, new periods are set to "Display in Back Office = No" by default</li>
                      <li><strong>States:</strong> Open, Closed (Not Paid), Closed (Paid)</li>
                      <li><strong>No Manual Creation Required:</strong> System automatically generates new weekly periods without manual intervention</li>
                    </ul>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold mb-2">Automated Commission Calculation</h3>
                    <ul className="list-disc pl-6 space-y-2">
                      <li><strong>Automatic Calculation:</strong> Commissions are automatically calculated when orders are brought in via the API from Shopify</li>
                      <li><strong>Real-Time Processing:</strong> No manual "Calculate Commissions" button needed - calculations happen automatically on order import</li>
                      <li><strong>Cancelled Orders:</strong> Commissions are automatically updated when orders are cancelled</li>
                      <li><strong>Refunded Orders:</strong> Commissions are automatically updated when orders are refunded</li>
                    </ul>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold mb-2">Commission Period Actions</h3>
                    <p className="mb-2">Available actions in the Commissions module:</p>
                    <ul className="list-disc pl-6 space-y-2">
                      <li><strong>View Period:</strong> Available for any period (Open, Closed, or Paid)
                        <ul className="list-disc pl-6 mt-1">
                          <li>Displays comprehensive period summary:
                            <ul className="list-disc pl-6 mt-1">
                              <li>Total commissions, adjustments, and net commissions</li>
                              <li>Period dates, status badge, and affiliate count</li>
                              <li>Level 1 and Level 2 commission breakdown with percentages</li>
                            </ul>
                          </li>
                          <li>Shows all adjustments for the period with delete capability:
                            <ul className="list-disc pl-6 mt-1">
                              <li>Date, affiliate ID and name, amount, reason, and action buttons</li>
                              <li>Delete adjustments with confirmation dialog (same as Adjustment History)</li>
                              <li>Recalculates period totals in real-time after deletion</li>
                            </ul>
                          </li>
                          <li>Displays period notes if available</li>
                        </ul>
                      </li>
                      <li><strong>Close Period:</strong> Available for any Open period - transitions period to Closed (Not Paid) state</li>
                      <li><strong>Fund Period:</strong> Available for any Closed (Not Paid) period - sends commissions to Tipalti and marks period as Paid</li>
                      <li><strong>Re-Open Period:</strong> Available for any Closed (Not Paid) period - allows reopening to make changes before payment</li>
                      <li><strong>Add +/- Adjustments:</strong> Available for any Open period only
                        <ul className="list-disc pl-6 mt-1">
                          <li>Adjustments cannot be made for Closed (Paid) periods</li>
                          <li>To make an adjustment to a Closed (Not Paid) period, the period must first be Re-Opened</li>
                          <li>Adjustment panel interface features:
                            <ul className="list-disc pl-6 mt-1">
                              <li>Search for affiliates by name, affiliate ID, or enrolling affiliate</li>
                              <li>Display affiliate period-specific balance (commissions + adjustments)</li>
                              <li>Add positive or negative adjustment amounts</li>
                              <li>Optional order ID field for linking adjustments to specific orders</li>
                              <li>Required reason/note field for audit trail</li>
                              <li>Edit existing adjustments (modifies amount and reason)</li>
                              <li>Delete adjustments with confirmation dialog</li>
                              <li>Adjustment History display in two-line format:
                                <ul className="list-disc pl-6 mt-1">
                                  <li>Line 1: Date • Affiliate ID and name • Amount (color-coded) • Edit and Delete icons</li>
                                  <li>Line 2: Full reason/description text with proper wrapping</li>
                                  <li>Vertical scroll for multiple adjustments</li>
                                  <li>All action buttons clearly visible without horizontal scroll</li>
                                </ul>
                              </li>
                              <li>Real-time period total recalculation after changes</li>
                            </ul>
                          </li>
                        </ul>
                      </li>
                    </ul>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold mb-2">Commission Adjustments - Advanced Rules</h3>
                    <ul className="list-disc pl-6 space-y-2">
                      <li><strong>Manual Adjustments:</strong> Admin can create positive/negative adjustments with notes (only in Open periods)
                        <ul className="list-disc pl-6 mt-1">
                          <li>All adjustments should include reason/note explaining the adjustment</li>
                          <li>Where applicable, link adjustments to specific order numbers for audit trail</li>
                        </ul>
                      </li>
                      <li><strong>Refund Handling - After Period Closure:</strong>
                        <ul className="list-disc pl-6 mt-1">
                          <li>If commissions are refunded after the commission period closes, a negative commission adjustment is created for both the Level 1 affiliate and Level 2 affiliate</li>
                          <li>Adjustments are placed in the latest open period (not the paid period)</li>
                          <li>Each adjustment must be tracked to the specific order number that was refunded</li>
                        </ul>
                      </li>
                      <li><strong>Chargeback Handling - After Period Closure:</strong>
                        <ul className="list-disc pl-6 mt-1">
                          <li>If an order is charged back after commissions were paid, create negative adjustments (clawbacks) for both Level 1 and Level 2 affiliates</li>
                          <li>Adjustments are placed in the current open period</li>
                          <li>Each adjustment must be tracked to the specific order number that was charged back</li>
                          <li>Allow negative balance even if affiliate doesn't have sufficient commissions in open period</li>
                        </ul>
                      </li>
                      <li><strong>Automatic Chargeback Protection Flag:</strong>
                        <ul className="list-disc pl-6 mt-1">
                          <li><strong>Flag Location:</strong> Each affiliate has an "Allow Automatic Chargebacks" flag in their profile (defaults to enabled)</li>
                          <li><strong>Purpose:</strong> When disabled, prevents automatic commission clawbacks for orders in closed/paid periods</li>
                          <li><strong>Behavior When Flag is Disabled:</strong>
                            <ul className="list-disc pl-6 mt-1">
                              <li>When a chargeback would normally create negative adjustments in a closed/paid period, the system checks the affiliate's flag</li>
                              <li>If "Allow Automatic Chargebacks" is disabled, NO automatic clawback adjustment is created</li>
                              <li>Instead, a system note is created on the affiliate's record indicating the chargeback was prevented</li>
                              <li>An email notification is automatically sent to support@theonglobal.com</li>
                            </ul>
                          </li>
                          <li><strong>Email Notification Contents:</strong>
                            <ul className="list-disc pl-6 mt-1">
                              <li>Order number, amount, and date</li>
                              <li>Customer/affiliate details (name and email) who placed the order</li>
                              <li>Level 1 affiliate details: name, email, commission amount, and commission period</li>
                              <li>Level 2 affiliate details (if applicable): name, email, commission amount, and commission period</li>
                              <li>Clear indication of which affiliate(s) were NOT charged back due to flag being disabled</li>
                              <li>Notice that manual chargeback adjustments must be created if desired</li>
                            </ul>
                          </li>
                          <li><strong>Manual Override Required:</strong> If admin wants to charge back commissions when flag is disabled, they must manually create negative adjustments through the commission adjustment interface</li>
                          <li><strong>Use Cases:</strong>
                            <ul className="list-disc pl-6 mt-1">
                              <li>Protect high-performing affiliates from automatic chargebacks</li>
                              <li>Allow management review before applying chargebacks to specific affiliates</li>
                              <li>Handle special circumstances where chargebacks should not be automatically applied</li>
                            </ul>
                          </li>
                        </ul>
                      </li>
                      <li><strong>Negative Commission Rollover:</strong>
                        <ul className="list-disc pl-6 mt-1">
                          <li>If an affiliate has negative commissions in a period and the period is closed and paid, the negative commissions automatically roll forward as an adjustment in the next open commission period</li>
                          <li>Negative adjustments continue to roll forward to subsequent periods until the affiliate earns sufficient new commissions to cover the negative balance</li>
                        </ul>
                      </li>
                      <li><strong>Tipalti Account Requirement Rollover:</strong>
                        <ul className="list-disc pl-6 mt-1">
                          <li>If an affiliate is owed commissions and has not created their Tipalti commission payment account, their commissions automatically roll forward as an adjustment in the next open commission period</li>
                          <li>Commissions continue to roll forward to subsequent periods until the affiliate's Tipalti account status changes from "No" to "Yes"</li>
                          <li>Currently several hundred affiliates in TheonGlobal have multiple commission periods owed but have not setup their Tipalti account</li>
                        </ul>
                      </li>
                      <li><strong>Enrolling Affiliate Changes - Detailed Process:</strong>
                        <ul className="list-disc pl-6 mt-1">
                          <li><strong>Trigger:</strong> When admin changes enrolling affiliate via Search button in Affiliates or Customers module</li>
                          <li><strong>Step 1 - Check for Open/Unpaid Period Commissions:</strong>
                            <ul className="list-disc pl-6 mt-1">
                              <li>Determine if previous enrolling affiliate has commissions due in current open commission period</li>
                              <li>Determine if new enrolling affiliate has commissions due in current open period that have not been paid</li>
                            </ul>
                          </li>
                          <li><strong>Step 2 - Level 1 Commission Prompt:</strong>
                            <ul className="list-disc pl-6 mt-1">
                              <li>If Level 1 commissions exist in open or unpaid periods, prompt admin:
                                <ul className="list-disc pl-6 mt-1">
                                  <li>"[FirstName] [LastName] has X orders with Level 1 commissions in open or open and unpaid commission periods, would you like to update the commissions to the new enrolling affiliate?"</li>
                                  <li>If Yes: Reassign Level 1 commissions from original enrolling affiliate to new enrolling affiliate</li>
                                </ul>
                              </li>
                            </ul>
                          </li>
                          <li><strong>Step 3 - Level 2 Commission Prompt:</strong>
                            <ul className="list-disc pl-6 mt-1">
                              <li>Determine if there is an enroller of the original affiliate earning Level 2 commissions</li>
                              <li>If Level 2 commissions exist in open or unpaid periods, prompt admin:
                                <ul className="list-disc pl-6 mt-1">
                                  <li>"[FirstName] [LastName] has X orders with Level 2 commissions in open or open and unpaid commission periods, would you like to update the commissions to the new 2nd level upline affiliate?"</li>
                                  <li>If Yes: Reassign Level 2 commissions from original 2nd level upline affiliate to new 2nd level upline affiliate</li>
                                </ul>
                              </li>
                            </ul>
                          </li>
                          <li><strong>Step 4 - Closed/Paid Period Clawback Prompt:</strong>
                            <ul className="list-disc pl-6 mt-1">
                              <li>Determine if there are commission periods that are closed and paid where the original affiliate and original 2nd upline affiliate (if exists) received commissions</li>
                              <li>Prompt admin with similar message as above, but clarify this is for closed/paid periods</li>
                              <li>If Yes: Create negative adjustments (clawback) for original affiliates in current open period</li>
                              <li>Create positive adjustments for new enrolling affiliate and new 2nd level upline affiliate (if exists) in current open period</li>
                              <li>All adjustments must be tracked to specific order numbers</li>
                            </ul>
                          </li>
                          <li><strong>Step 5 - Notes Documentation (Critical):</strong>
                            <ul className="list-disc pl-6 mt-1">
                              <li>Save detailed notes in original enrolling affiliate's notes including:
                                <ul className="list-disc pl-6 mt-1">
                                  <li>All order numbers affected</li>
                                  <li>Commission amounts clawed back</li>
                                  <li>Reason for change</li>
                                  <li>Date of change</li>
                                </ul>
                              </li>
                              <li>Save detailed notes in original 2nd upline affiliate's notes (if applicable) with same details</li>
                              <li>Save detailed notes in new enrolling affiliate's notes including:
                                <ul className="list-disc pl-6 mt-1">
                                  <li>All order numbers gained</li>
                                  <li>Commission amounts gained</li>
                                  <li>Reason for change</li>
                                  <li>Date of change</li>
                                </ul>
                              </li>
                              <li>Save detailed notes in new 2nd level upline affiliate's notes (if applicable) with same details</li>
                              <li>Save order notes on EACH affected order documenting:
                                <ul className="list-disc pl-6 mt-1">
                                  <li><strong>For Open/Unpaid Periods:</strong> "Commission transfer: Level X commission ($X.XX) transferred from [Old Affiliate Name] to [New Affiliate Name] due to enrolling affiliate change. Reason: [if provided]"</li>
                                  <li><strong>For Closed/Paid Periods:</strong> "Commission adjustment (CLAWBACK/CREDIT): Level X commission ($X.XX) was previously paid to [Old Affiliate Name]. Due to enrolling affiliate change, a clawback adjustment was added to [Old Affiliate Name]'s account and a credit adjustment was added to [New Affiliate Name]'s account in the current open commission period. Reason: [if provided]"</li>
                                  <li>Order notes visible in Order detail dialog Notes & History tab</li>
                                  <li>Provides complete audit trail at order level</li>
                                </ul>
                              </li>
                            </ul>
                          </li>
                        </ul>
                      </li>
                      <li><strong>Order-Level Commission Editing (NEW - November 10, 2025):</strong>
                        <ul className="list-disc pl-6 mt-1">
                          <li><strong>Access Point:</strong> Edit icon displayed next to Level 1 commission in Order Detail dialog</li>
                          <li><strong>Functionality:</strong> Allows admin to change the enrolling affiliate for individual orders, triggering complete commission recalculation</li>
                          <li><strong>Affiliate Selection:</strong>
                            <ul className="list-disc pl-6 mt-1">
                              <li>Only affiliates with "Active" status are selectable</li>
                              <li>Excludes affiliates with statuses: Pending KYC, Inactive, Rejected, Terminated</li>
                              <li>Searchable dropdown interface with affiliate name and affiliate ID</li>
                            </ul>
                          </li>
                          <li><strong>Commission Adjustment Workflow:</strong>
                            <ul className="list-disc pl-6 mt-1">
                              <li><strong>Step 1 - Impact Analysis:</strong> System analyzes commission impact similar to affiliate/customer-level changes
                                <ul className="list-disc pl-6 mt-1">
                                  <li>Checks order commission period status (Open, Closed Not Paid, Closed Paid)</li>
                                  <li>Identifies Level 1 and Level 2 affiliates affected by the change</li>
                                  <li>Calculates commission amounts that will be transferred or adjusted</li>
                                </ul>
                              </li>
                              <li><strong>Step 2 - Commission Adjustment Dialog:</strong> Admin reviews and approves proposed changes
                                <ul className="list-disc pl-6 mt-1">
                                  <li>Displays affected orders grouped by period status (Open/Unpaid vs Closed/Paid)</li>
                                  <li>Shows old and new Level 1 and Level 2 affiliate details</li>
                                  <li>Lists commission amounts to be transferred or clawed back</li>
                                  <li>Allows selective approval of individual orders within the impact</li>
                                  <li>Optional notes field for documenting reason for change</li>
                                </ul>
                              </li>
                              <li><strong>Step 3 - Database Updates:</strong> Upon admin approval, system executes the following:
                                <ul className="list-disc pl-6 mt-1">
                                  <li>Updates customer's enrolled_by field to new enrolling affiliate</li>
                                  <li>Deletes all existing order_commissions records for the specific order</li>
                                  <li>Recalculates and inserts new order_commissions for Level 1 (25%) to new enrolling affiliate</li>
                                  <li>If new Level 1 affiliate has an upline, creates Level 2 commission (12%) for that upline</li>
                                  <li>Commission hierarchy automatically traverses to determine correct Level 2 recipient</li>
                                </ul>
                              </li>
                              <li><strong>Step 4 - Adjustment Processing for Open/Unpaid Periods:</strong>
                                <ul className="list-disc pl-6 mt-1">
                                  <li>Commissions transferred directly within the same period</li>
                                  <li>No adjustments created - commissions simply reassigned to new affiliates</li>
                                  <li>Creates system notes documenting the transfer</li>
                                </ul>
                              </li>
                              <li><strong>Step 5 - Adjustment Processing for Closed/Paid Periods:</strong>
                                <ul className="list-disc pl-6 mt-1">
                                  <li>Creates negative adjustment (clawback) for old Level 1 affiliate in current open period</li>
                                  <li>Creates positive adjustment (credit) for new Level 1 affiliate in current open period</li>
                                  <li>Creates negative adjustment (clawback) for old Level 2 affiliate (if exists) in current open period</li>
                                  <li>Creates positive adjustment (credit) for new Level 2 affiliate (if exists) in current open period</li>
                                  <li>Respects "Allow Automatic Chargebacks" flag on affiliate profiles</li>
                                  <li>If flag is disabled, skips automatic clawback and sends notification to support@theonglobal.com</li>
                                  <li>All adjustments linked to specific order number for audit trail</li>
                                </ul>
                              </li>
                              <li><strong>Step 6 - Comprehensive Notes Documentation:</strong>
                                <ul className="list-disc pl-6 mt-1">
                                  <li><strong>Order Notes:</strong> Creates detailed note in order's Notes & History tab:
                                    <ul className="list-disc pl-6 mt-1">
                                      <li>For Open/Unpaid: "Commission transfer: Level X commission ($X.XX) transferred from [Old Affiliate] to [New Affiliate] due to enrolling affiliate change at order level."</li>
                                      <li>For Closed/Paid: "Commission adjustment (CLAWBACK/CREDIT): Level X commission ($X.XX) was previously paid to [Old Affiliate]. Due to enrolling affiliate change at order level, a clawback adjustment was added to [Old Affiliate]'s account and a credit adjustment was added to [New Affiliate]'s account in the current open commission period."</li>
                                    </ul>
                                  </li>
                                  <li><strong>Affiliate Notes:</strong> Creates system notes in Notes & History for all affected affiliates:
                                    <ul className="list-disc pl-6 mt-1">
                                      <li>Old Level 1 affiliate: Documents commission loss, order numbers, amounts, and reason</li>
                                      <li>New Level 1 affiliate: Documents commission gain, order numbers, amounts, and reason</li>
                                      <li>Old Level 2 affiliate (if exists): Documents Level 2 commission loss</li>
                                      <li>New Level 2 affiliate (if exists): Documents Level 2 commission gain</li>
                                    </ul>
                                  </li>
                                  <li><strong>Customer Notes:</strong> Summary note added to customer's Notes & History documenting the enrolling affiliate change</li>
                                </ul>
                              </li>
                            </ul>
                          </li>
                          <li><strong>UI Refresh:</strong>
                            <ul className="list-disc pl-6 mt-1">
                              <li>Order Detail view immediately reflects new Level 1 and Level 2 commission structure</li>
                              <li>Order grid updates to show new commission affiliates</li>
                              <li>All affected affiliate commission totals recalculate automatically</li>
                              <li>Notes & History tab displays complete audit trail of changes</li>
                            </ul>
                          </li>
                          <li><strong>Use Cases:</strong>
                            <ul className="list-disc pl-6 mt-1">
                              <li>Correct mistaken enrolling affiliate assignments at order level</li>
                              <li>Resolve customer disputes about commission attribution</li>
                              <li>Handle special circumstances requiring commission reassignment for specific orders</li>
                              <li>Provide granular control beyond bulk affiliate/customer-level changes</li>
                            </ul>
                          </li>
                          <li><strong>Security & Validation:</strong>
                            <ul className="list-disc pl-6 mt-1">
                              <li>Admin-only functionality (requires admin role)</li>
                              <li>Validates new enrolling affiliate is Active status</li>
                              <li>Prevents circular enrollment relationships</li>
                              <li>Ensures KYC-verified affiliates only (kyc_pass = true)</li>
                              <li>Maintains referential integrity across all database tables</li>
                            </ul>
                          </li>
                        </ul>
                      </li>
                    </ul>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold mb-2">Cancellations, Refunds, and Chargebacks - Automated Processing</h3>
                    <ul className="list-disc pl-6 space-y-2">
                      <li><strong>During Open Period - Cancelled Orders:</strong>
                        <ul className="list-disc pl-6 mt-1">
                          <li>Order cancelled in Shopify: automatically set order to cancelled, no commissions paid</li>
                        </ul>
                      </li>
                      <li><strong>During Open Period - Refunded Orders:</strong>
                        <ul className="list-disc pl-6 mt-1">
                          <li>Order refunded in Shopify: automatically set order to refunded, no commissions paid</li>
                        </ul>
                      </li>
                      <li><strong>During Open Period - Charged Back Orders:</strong>
                        <ul className="list-disc pl-6 mt-1">
                          <li>Order charged back in Shopify: automatically set order to "charged back", no commissions paid</li>
                        </ul>
                      </li>
                      <li><strong>After Period Closed/Paid - Refunded Orders:</strong>
                        <ul className="list-disc pl-6 mt-1">
                          <li>Automatically create negative adjustments in current open period for both Level 1 and Level 2 affiliates</li>
                          <li>Track adjustments to specific order number</li>
                          <li>Allow negative balances to automatically roll forward to next period(s) if insufficient commissions in current period</li>
                        </ul>
                      </li>
                      <li><strong>After Period Closed/Paid - Charged Back Orders:</strong>
                        <ul className="list-disc pl-6 mt-1">
                          <li>Automatically set order to "charged back"</li>
                          <li>Automatically create negative adjustments (clawbacks) in current open period for any commissions paid on that order</li>
                          <li>Apply clawback to both Level 1 and Level 2 affiliates</li>
                          <li>Track adjustments to specific order number</li>
                          <li>Allow negative balances to automatically roll forward to next period(s) even if affiliate doesn't have enough commissions in open period to cover the chargeback</li>
                        </ul>
                      </li>
                    </ul>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold mb-2">Calculation Process - Automated</h3>
                    <ol className="list-decimal pl-6 space-y-2">
                      <li>Order automatically imported from Shopify via API with customer and enrolling affiliate</li>
                      <li>System automatically calculates commissionable amount (subtotal minus shipping, taxes)</li>
                      <li>System automatically creates Level 1 commission record:
                        <ul className="list-disc pl-6 mt-1">
                          <li>Affiliate: Personally enrolled affiliates and their purchases</li>
                          <li>Affiliate: Personally enrolled customers and their purchases</li>
                          <li>Rate: 25%</li>
                          <li>Amount: commissionable_amount × 0.25</li>
                        </ul>
                      </li>
                      <li>If Level 1 affiliate has an enrolling affiliate, system automatically creates Level 2 commission record:
                        <ul className="list-disc pl-6 mt-1">
                          <li>Affiliate: Level 1 affiliate's Personally enrolled affiliates' affiliates and their purchases</li>
                          <li>Affiliate: Level 1 affiliate's Personally enrolled affiliates' customers and their purchases</li>
                          <li>Rate: 12%</li>
                          <li>Amount: commissionable_amount × 0.12</li>
                        </ul>
                      </li>
                      <li>System automatically stores commission records linked to order and commission period</li>
                      <li>All calculations, updates for cancellations, and refunds happen automatically without manual intervention</li>
                    </ol>
                  </div>
                </div>
              </Card>

              {/* Tipalti Integration */}
              <Card className="p-4 sm:p-6">
                <h2 className="text-2xl font-bold mb-4">Tipalti Integration Requirements</h2>
                
                <div className="space-y-4">
                  <p className="mb-4">
                    Integration with existing TheonGlobal account at Tipalti.com using iFrame for commission payments to affiliates.
                  </p>

                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                    <h4 className="font-semibold mb-2 text-blue-900">Account Information</h4>
                    <ul className="list-disc pl-6 text-sm text-blue-800 space-y-1">
                      <li><strong>Payer Account:</strong> TheonGlobal (existing account)</li>
                      <li><strong>Integration Method:</strong> iFrame embedded in affiliate portal</li>
                      <li><strong>API Documentation:</strong> <a href="https://documentation.tipalti.com/docs/payees-1" target="_blank" rel="noopener noreferrer" className="underline">Tipalti Payees API</a></li>
                    </ul>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold mb-2">Required API Integrations</h3>
                    
                    <div className="space-y-4">
                      <div>
                        <h4 className="font-semibold mb-2">1. Affiliate/Payee Management</h4>
                        <p className="text-sm mb-2">When a new affiliate is created in the back office:</p>
                        <ul className="list-disc pl-6 space-y-2 text-sm">
                          <li>
                            <strong>Create Payee API</strong>
                            <ul className="list-disc pl-6 mt-1">
                              <li>Endpoint: <code className="bg-gray-100 px-1 py-0.5 rounded">POST /api/v1/payees</code></li>
                              <li>Documentation: <a href="https://documentation.tipalti.com/reference/post_api-v1-payees" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">Create Payee</a></li>
                              <li>Purpose: Create new payee record in Tipalti with affiliate details</li>
                              <li>Action: Automatically triggered when new affiliate is approved through KYC process</li>
                              <li>Store returned Tipalti Payee ID in affiliate record</li>
                            </ul>
                          </li>
                          <li>
                            <strong>Get Payee by ID API</strong>
                            <ul className="list-disc pl-6 mt-1">
                              <li>Endpoint: <code className="bg-gray-100 px-1 py-0.5 rounded">GET /api/v1/payees/&#123;id&#125;</code></li>
                              <li>Documentation: <a href="https://documentation.tipalti.com/reference/get_api-v1-payees-id" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">Get Payee by ID</a></li>
                              <li>Purpose: Retrieve payee information and verify account setup status</li>
                              <li>Action: Check if affiliate has completed Tipalti account setup before commission payment</li>
                              <li>Used to verify Tipalti account status for commission rollover logic</li>
                            </ul>
                          </li>
                          <li>
                            <strong>Create Invitation to Payee API</strong>
                            <ul className="list-disc pl-6 mt-1">
                              <li>Endpoint: <code className="bg-gray-100 px-1 py-0.5 rounded">POST /api/v1/payees/&#123;id&#125;/invitation</code></li>
                              <li>Documentation: <a href="https://documentation.tipalti.com/reference/post_api-v1-payees-id-invitation" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">Create Invitation</a></li>
                              <li>Purpose: Send invitation email to affiliate for Tipalti Supplier Hub onboarding</li>
                              <li>Action: Triggered after payee creation to invite affiliate to complete account setup</li>
                              <li>Affiliate receives up to 5 reminders within first 30 days</li>
                            </ul>
                          </li>
                        </ul>
                      </div>

                      <div>
                        <h4 className="font-semibold mb-2">2. Commission Payment Processing</h4>
                        <p className="text-sm mb-2">When a commission period is marked as "Funded" (only for affiliates with Tipalti payee ID):</p>
                        <ul className="list-disc pl-6 space-y-2 text-sm">
                          <li>
                            <strong>Create Payment Batch API</strong>
                            <ul className="list-disc pl-6 mt-1">
                              <li>Endpoint: <code className="bg-gray-100 px-1 py-0.5 rounded">POST /api/v1/payment-batches</code></li>
                              <li>Documentation: <a href="https://documentation.tipalti.com/reference/post_api-v1-payment-batches" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">Create Payment Batch</a></li>
                              <li>Purpose: Submit commission payments to Tipalti for processing</li>
                              <li>Action: Triggered when admin clicks "Fund" on a closed commission period</li>
                              <li>Batch contains payment instructions for all affiliates in the period with Tipalti accounts</li>
                              <li>Returns batch ID for tracking payment status</li>
                            </ul>
                          </li>
                          <li>
                            <strong>Get Payment Batch Summary API</strong>
                            <ul className="list-disc pl-6 mt-1">
                              <li>Endpoint: <code className="bg-gray-100 px-1 py-0.5 rounded">GET /api/v1/payment-batches/&#123;id&#125;</code></li>
                              <li>Documentation: <a href="https://documentation.tipalti.com/reference/get_api-v1-payment-batches-id" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">Get Payment Batch</a></li>
                              <li>Purpose: Retrieve payment batch status and confirmation</li>
                              <li>Action: Poll to confirm commission payments have been processed successfully</li>
                              <li>Check batch status: QUEUED, ANALYZING, AWAITING_USER_SUBMISSION, SUBMITTING, SUBMITTED, CANCELED, FAILURE</li>
                              <li>Update commission period status to "Closed (Paid)" when batch is SUBMITTED</li>
                            </ul>
                          </li>
                        </ul>
                      </div>

                      <div>
                        <h4 className="font-semibold mb-2">3. iFrame Integration for Affiliate Portal</h4>
                        <ul className="list-disc pl-6 space-y-2 text-sm">
                          <li>
                            <strong>Payee Dashboard iFrame</strong>
                            <ul className="list-disc pl-6 mt-1">
                              <li>URL Format: <code className="bg-gray-100 px-1 py-0.5 rounded text-xs">https://ui2.tipalti.com/payeedashboard/home?payer=TheonGlobal&idap=&#123;payeeId&#125;&ts=&#123;timestamp&#125;&hashkey=&#123;hash&#125;</code></li>
                              <li>Purpose: Embed Tipalti dashboard in affiliate back office for payment method setup and history</li>
                              <li>Security: Generate secure hash using Tipalti API credentials</li>
                              <li>Display: Show in dedicated "Commission Payments" section of affiliate portal</li>
                            </ul>
                          </li>
                        </ul>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold mb-2">Integration Workflow</h3>
                    <ol className="list-decimal pl-6 space-y-2">
                      <li><strong>Affiliate Approval:</strong>
                        <ul className="list-disc pl-6 mt-1 text-sm">
                          <li>New affiliate approved through KYC process in back office</li>
                          <li>System calls Create Payee API to create Tipalti payee record</li>
                          <li>Store returned Tipalti payee ID in affiliate record (tipalti_payee_id field)</li>
                          <li>System calls Create Invitation API to send setup email to affiliate</li>
                        </ul>
                      </li>
                      <li><strong>Account Setup:</strong>
                        <ul className="list-disc pl-6 mt-1 text-sm">
                          <li>Affiliate receives email invitation to complete Tipalti account setup</li>
                          <li>Affiliate completes payment method setup via Tipalti Supplier Hub</li>
                          <li>System periodically calls Get Payee by ID API to check account status</li>
                          <li>Update affiliate record tipalti_enabled field when setup is complete</li>
                        </ul>
                      </li>
                      <li><strong>Commission Period Close:</strong>
                        <ul className="list-disc pl-6 mt-1 text-sm">
                          <li>Admin closes commission period in back office</li>
                          <li>System calculates total commissions per affiliate</li>
                          <li>System checks tipalti_enabled status for each affiliate</li>
                        </ul>
                      </li>
                      <li><strong>Commission Payment:</strong>
                        <ul className="list-disc pl-6 mt-1 text-sm">
                          <li>Admin clicks "Fund" to process payments for closed period</li>
                          <li>System creates payment batch with all affiliates who have tipalti_enabled = true</li>
                          <li>System calls Create Payment Batch API with commission amounts</li>
                          <li>Store returned batch ID in commission period record</li>
                          <li>System polls Get Payment Batch Summary API for status updates</li>
                          <li>Update period status to "Closed (Paid)" when batch is SUBMITTED</li>
                        </ul>
                      </li>
                      <li><strong>Commission Rollover:</strong>
                        <ul className="list-disc pl-6 mt-1 text-sm">
                          <li>For affiliates with tipalti_enabled = false, commissions automatically roll forward to next open period as adjustment</li>
                          <li>Repeat weekly until affiliate completes Tipalti account setup</li>
                        </ul>
                      </li>
                    </ol>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold mb-2">Data Storage Requirements</h3>
                    <ul className="list-disc pl-6 space-y-2">
                      <li><strong>Affiliate Table Fields:</strong>
                        <ul className="list-disc pl-6 mt-1 text-sm">
                          <li><code className="bg-gray-100 px-1 py-0.5 rounded">tipalti_payee_id</code>: Store Tipalti payee ID returned from Create Payee API</li>
                          <li><code className="bg-gray-100 px-1 py-0.5 rounded">tipalti_enabled</code>: Boolean flag indicating if affiliate has completed Tipalti account setup</li>
                          <li><code className="bg-gray-100 px-1 py-0.5 rounded">tipalti_invitation_sent_at</code>: Timestamp when invitation was sent</li>
                          <li><code className="bg-gray-100 px-1 py-0.5 rounded">tipalti_account_completed_at</code>: Timestamp when account setup was completed</li>
                        </ul>
                      </li>
                      <li><strong>Commission Period Table Fields:</strong>
                        <ul className="list-disc pl-6 mt-1 text-sm">
                          <li><code className="bg-gray-100 px-1 py-0.5 rounded">tipalti_batch_id</code>: Store batch ID returned from Create Payment Batch API</li>
                          <li><code className="bg-gray-100 px-1 py-0.5 rounded">tipalti_batch_status</code>: Current status of payment batch</li>
                          <li><code className="bg-gray-100 px-1 py-0.5 rounded">tipalti_submitted_at</code>: Timestamp when payment batch was submitted</li>
                          <li><code className="bg-gray-100 px-1 py-0.5 rounded">tipalti_confirmed_at</code>: Timestamp when payment was confirmed</li>
                        </ul>
                      </li>
                    </ul>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold mb-2">Error Handling & Edge Cases</h3>
                    <ul className="list-disc pl-6 space-y-2">
                      <li><strong>API Failures:</strong> Implement retry logic with exponential backoff for transient failures</li>
                      <li><strong>Payment Batch Failures:</strong> Log failed batches and alert admin for manual review</li>
                      <li><strong>Account Setup Delays:</strong> Automatically roll commissions forward if account not setup by payment date</li>
                      <li><strong>Duplicate Payee Prevention:</strong> Check if payee already exists before calling Create Payee API</li>
                      <li><strong>Payment Amount Changes:</strong> If commission period is reopened after batch submission, cancel batch and create new one</li>
                      <li><strong>Status Sync:</strong> Implement webhook handler to receive real-time status updates from Tipalti (if available)</li>
                    </ul>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold mb-2">Security Considerations</h3>
                    <ul className="list-disc pl-6 space-y-2">
                      <li><strong>API Credentials:</strong> Store Tipalti API key securely in environment variables</li>
                      <li><strong>Hash Generation:</strong> Implement secure hash generation for iFrame URLs using Tipalti secret key</li>
                      <li><strong>HTTPS Only:</strong> All API calls must use HTTPS</li>
                      <li><strong>Rate Limiting:</strong> Respect Tipalti API rate limits to avoid throttling</li>
                      <li><strong>Audit Logging:</strong> Log all Tipalti API calls with request/response for audit trail</li>
                    </ul>
                  </div>
                </div>
              </Card>

              {/* RingCentral Integration */}
              <Card className="p-4 sm:p-6">
                <h2 className="text-2xl font-bold mb-4">RingCentral Integration Requirements</h2>
                
                <div className="space-y-4">
                  <p className="mb-4">
                    Two-tiered integration approach: (1) Client-side deep linking for immediate click-to-call functionality, and (2) Optional REST API integration for advanced features like call logging, SMS, and call history.
                  </p>

                  <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 mb-4">
                    <h4 className="font-semibold mb-2 text-purple-900">Implementation Status</h4>
                    <ul className="list-disc pl-6 text-sm text-purple-800 space-y-1">
                      <li><strong>Current (Phase 1):</strong> Deep linking implementation using rcmobile:// protocol (✅ Completed)</li>
                      <li><strong>Future (Phase 2):</strong> REST API integration for advanced features (Optional Enhancement)</li>
                    </ul>
                  </div>

                  <div>
                    <h3 className="text-xl font-semibold mb-3">Phase 1: Deep Linking Implementation (Current)</h3>
                    
                    <div className="space-y-4">
                      <div>
                        <h4 className="font-semibold mb-2">Overview</h4>
                        <p className="text-sm mb-2">
                          Client-side click-to-call integration that launches the RingCentral desktop application directly from the browser without requiring API credentials or server-side code.
                        </p>
                      </div>

                      <div>
                        <h4 className="font-semibold mb-2">Technical Implementation</h4>
                        <ul className="list-disc pl-6 space-y-2 text-sm">
                          <li>
                            <strong>Protocol Handler:</strong> Uses <code className="bg-gray-100 px-1 py-0.5 rounded">rcmobile://call?number=&#123;number&#125;</code> deep link scheme
                          </li>
                          <li>
                            <strong>Phone Number Format:</strong> E.164 format without plus sign (e.g., "12345678901" for US numbers)
                            <ul className="list-disc pl-6 mt-1">
                              <li>Automatically prepends "1" for US 10-digit numbers</li>
                              <li>Removes all non-digit characters before formatting</li>
                            </ul>
                          </li>
                          <li>
                            <strong>Cache-Busting:</strong> Appends unique timestamp parameter <code className="bg-gray-100 px-1 py-0.5 rounded">&t=&#123;timestamp&#125;</code> to ensure reliable repeated calls to the same number
                          </li>
                          <li>
                            <strong>User-Gesture Context:</strong> Opens helper window to maintain browser security context for protocol handler invocation
                            <ul className="list-disc pl-6 mt-1">
                              <li>Prevents popup blocking issues</li>
                              <li>Provides user feedback during launch process</li>
                              <li>Auto-closes helper window after 3.5 seconds</li>
                            </ul>
                          </li>
                          <li>
                            <strong>Fallback Chain:</strong> Attempts multiple URI schemes in sequence
                            <ul className="list-disc pl-6 mt-1">
                              <li>Primary: <code className="bg-gray-100 px-1 py-0.5 rounded">rcmobile://call?number=&#123;number&#125;&t=&#123;timestamp&#125;</code></li>
                              <li>Fallback: <code className="bg-gray-100 px-1 py-0.5 rounded">tel:&#123;number&#125;</code> (for mobile devices, WhatsApp, etc.)</li>
                            </ul>
                          </li>
                          <li>
                            <strong>Error Handling:</strong>
                            <ul className="list-disc pl-6 mt-1">
                              <li>Popup blocking detection with user-friendly error messages</li>
                              <li>Console logging for debugging (<code className="bg-gray-100 px-1 py-0.5 rounded">🔵 Trying URI (helper): rcmobile://...</code>)</li>
                              <li>Toast notifications for blocked popups or launch failures</li>
                            </ul>
                          </li>
                        </ul>
                      </div>

                      <div>
                        <h4 className="font-semibold mb-2">User Interface Features</h4>
                        <ul className="list-disc pl-6 space-y-2 text-sm">
                          <li>
                            <strong>Single Phone Number:</strong>
                            <ul className="list-disc pl-6 mt-1">
                              <li>Phone number displayed as clickable <code className="bg-gray-100 px-1 py-0.5 rounded">tel:</code> link</li>
                              <li>Dedicated RingCentral logo button for RC calling</li>
                              <li>Tooltip: "Call with RingCentral"</li>
                            </ul>
                          </li>
                          <li>
                            <strong>Multiple Phone Numbers:</strong>
                            <ul className="list-disc pl-6 mt-1">
                              <li>Primary phone number displayed by default</li>
                              <li>Dropdown menu with phone icon to select number type (Home, Work, Mobile, Other)</li>
                              <li>Selection updates displayed number without auto-dialing</li>
                              <li>Dedicated RingCentral logo button to initiate call on selected number</li>
                              <li>Phone number link uses <code className="bg-gray-100 px-1 py-0.5 rounded">tel:</code> scheme for native device calling</li>
                            </ul>
                          </li>
                          <li>
                            <strong>Visual Distinction:</strong>
                            <ul className="list-disc pl-6 mt-1">
                              <li>RingCentral logo icon: Launches RingCentral desktop app with auto-dial</li>
                              <li>Phone icon: Opens dropdown to select different phone numbers</li>
                              <li>No confusion between action buttons</li>
                            </ul>
                          </li>
                        </ul>
                      </div>

                      <div>
                        <h4 className="font-semibold mb-2">Requirements</h4>
                        <ul className="list-disc pl-6 space-y-2 text-sm">
                          <li><strong>Desktop App:</strong> RingCentral desktop application must be installed on user's computer</li>
                          <li><strong>Browser Support:</strong> Modern browsers (Chrome, Edge, Firefox, Safari)</li>
                          <li><strong>Popup Permissions:</strong> User must allow popups for the application domain</li>
                          <li><strong>No API Credentials:</strong> No RingCentral API keys or developer account required</li>
                          <li><strong>Zero Server-Side Code:</strong> Entirely client-side implementation</li>
                        </ul>
                      </div>

                      <div>
                        <h4 className="font-semibold mb-2">Limitations of Deep Linking Approach</h4>
                        <ul className="list-disc pl-6 space-y-2 text-sm">
                          <li>Cannot retrieve call history or logs programmatically</li>
                          <li>No server-side call tracking or analytics</li>
                          <li>Cannot send SMS messages via the application</li>
                          <li>No webhook notifications for call events</li>
                          <li>Requires RingCentral desktop app to be installed</li>
                          <li>Cannot verify if call was successfully connected</li>
                        </ul>
                      </div>
                    </div>
                  </div>

                  <Separator className="my-6" />

                  <div>
                    <h3 className="text-xl font-semibold mb-3">Phase 2: REST API Integration (Optional Future Enhancement)</h3>
                    
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                      <h4 className="font-semibold mb-2 text-blue-900">API Resources</h4>
                      <ul className="list-disc pl-6 text-sm text-blue-800 space-y-1">
                        <li><strong>Developer Portal:</strong> <a href="https://developers.ringcentral.com" target="_blank" rel="noopener noreferrer" className="underline">https://developers.ringcentral.com</a></li>
                        <li><strong>API Reference:</strong> <a href="https://developers.ringcentral.com/api-reference" target="_blank" rel="noopener noreferrer" className="underline">API Documentation</a></li>
                        <li><strong>Getting Started:</strong> <a href="https://developers.ringcentral.com/guide/getting-started" target="_blank" rel="noopener noreferrer" className="underline">Quick Start Guide</a></li>
                      </ul>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <h4 className="font-semibold mb-2">1. Authentication & Authorization</h4>
                        <ul className="list-disc pl-6 space-y-2 text-sm">
                          <li>
                            <strong>OAuth 2.0 Flow:</strong>
                            <ul className="list-disc pl-6 mt-1">
                              <li>Authorization Code Grant for user-level access</li>
                              <li>JWT (JSON Web Token) authentication for server-to-server</li>
                              <li>Token endpoint: <code className="bg-gray-100 px-1 py-0.5 rounded">POST /restapi/oauth/token</code></li>
                            </ul>
                          </li>
                          <li>
                            <strong>Required Credentials:</strong>
                            <ul className="list-disc pl-6 mt-1">
                              <li>Client ID (from RingCentral Developer Console)</li>
                              <li>Client Secret (stored securely in environment variables)</li>
                              <li>App Redirect URI for OAuth callback</li>
                            </ul>
                          </li>
                          <li>
                            <strong>Scopes Required:</strong>
                            <ul className="list-disc pl-6 mt-1">
                              <li><code className="bg-gray-100 px-1 py-0.5 rounded">CallControl</code> - Initiate and control calls</li>
                              <li><code className="bg-gray-100 px-1 py-0.5 rounded">ReadCallLog</code> - Read call history</li>
                              <li><code className="bg-gray-100 px-1 py-0.5 rounded">SMS</code> - Send SMS messages</li>
                              <li><code className="bg-gray-100 px-1 py-0.5 rounded">ReadAccounts</code> - Read account information</li>
                            </ul>
                          </li>
                        </ul>
                      </div>

                      <div>
                        <h4 className="font-semibold mb-2">2. Click-to-Call API (RingOut)</h4>
                        <ul className="list-disc pl-6 space-y-2 text-sm">
                          <li>
                            <strong>RingOut API</strong>
                            <ul className="list-disc pl-6 mt-1">
                              <li>Endpoint: <code className="bg-gray-100 px-1 py-0.5 rounded">POST /restapi/v1.0/account/~/extension/~/ring-out</code></li>
                              <li>Documentation: <a href="https://developers.ringcentral.com/api-reference/RingOut/createRingOutCall" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">RingOut API Reference</a></li>
                              <li>Purpose: Initiate two-legged calls where RingCentral calls the admin's phone first, then connects to the customer/affiliate</li>
                              <li>Payload includes: from (admin's phone), to (customer/affiliate phone), callerId</li>
                              <li>Returns call session ID for tracking</li>
                            </ul>
                          </li>
                          <li>
                            <strong>Call Control API (Advanced)</strong>
                            <ul className="list-disc pl-6 mt-1">
                              <li>Endpoint: <code className="bg-gray-100 px-1 py-0.5 rounded">POST /restapi/v1.0/account/~/telephony/sessions</code></li>
                              <li>Purpose: Real-time call control (transfer, hold, record, etc.)</li>
                              <li>Requires WebRTC or SIP integration for more advanced scenarios</li>
                            </ul>
                          </li>
                        </ul>
                      </div>

                      <div>
                        <h4 className="font-semibold mb-2">3. Call History & Logging</h4>
                        <ul className="list-disc pl-6 space-y-2 text-sm">
                          <li>
                            <strong>Call Log API</strong>
                            <ul className="list-disc pl-6 mt-1">
                              <li>Endpoint: <code className="bg-gray-100 px-1 py-0.5 rounded">GET /restapi/v1.0/account/~/extension/~/call-log</code></li>
                              <li>Documentation: <a href="https://developers.ringcentral.com/api-reference/Call-Log/readUserCallLog" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">Call Log API Reference</a></li>
                              <li>Purpose: Retrieve call history for reporting and CRM integration</li>
                              <li>Supports filtering by date range, direction (Inbound/Outbound), and phone number</li>
                              <li>Returns: call duration, timestamp, participants, recording URLs (if enabled)</li>
                            </ul>
                          </li>
                          <li>
                            <strong>Integration with CRM:</strong>
                            <ul className="list-disc pl-6 mt-1">
                              <li>Automatically log calls to affiliate_notes or customer_notes tables</li>
                              <li>Include call duration, timestamp, and outcome</li>
                              <li>Link call records to specific affiliate or customer profiles</li>
                            </ul>
                          </li>
                        </ul>
                      </div>

                      <div>
                        <h4 className="font-semibold mb-2">4. SMS Integration</h4>
                        <ul className="list-disc pl-6 space-y-2 text-sm">
                          <li>
                            <strong>Send SMS API</strong>
                            <ul className="list-disc pl-6 mt-1">
                              <li>Endpoint: <code className="bg-gray-100 px-1 py-0.5 rounded">POST /restapi/v1.0/account/~/extension/~/sms</code></li>
                              <li>Documentation: <a href="https://developers.ringcentral.com/api-reference/SMS/createSMSMessage" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">SMS API Reference</a></li>
                              <li>Purpose: Send SMS messages to affiliates and customers directly from the back office</li>
                              <li>Supports: single recipient, multiple recipients, message text, attachments</li>
                              <li>Returns: message ID, delivery status, timestamp</li>
                            </ul>
                          </li>
                          <li>
                            <strong>SMS Implementation in Communications Module:</strong>
                            <ul className="list-disc pl-6 mt-1">
                              <li>Add SMS sending capability to Communications tab (currently placeholder)</li>
                              <li>Template system for common SMS messages (welcome, commission notification, etc.)</li>
                              <li>Bulk SMS sending to affiliate/customer segments</li>
                              <li>Opt-out management for SMS preferences</li>
                            </ul>
                          </li>
                        </ul>
                      </div>

                      <div>
                        <h4 className="font-semibold mb-2">5. Webhooks & Event Notifications</h4>
                        <ul className="list-disc pl-6 space-y-2 text-sm">
                          <li>
                            <strong>Webhook Subscriptions:</strong>
                            <ul className="list-disc pl-6 mt-1">
                              <li>Endpoint: <code className="bg-gray-100 px-1 py-0.5 rounded">POST /restapi/v1.0/subscription</code></li>
                              <li>Documentation: <a href="https://developers.ringcentral.com/api-reference/Subscriptions/createSubscription" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">Webhooks Documentation</a></li>
                              <li>Purpose: Receive real-time notifications for call events</li>
                              <li>Event types: Incoming Call, Outgoing Call, Call Connected, Call Ended, SMS Received, SMS Sent</li>
                            </ul>
                          </li>
                          <li>
                            <strong>Webhook Handler Implementation:</strong>
                            <ul className="list-disc pl-6 mt-1">
                              <li>Create webhook receiver endpoint in Node.js backend</li>
                              <li>Validate webhook signature for security</li>
                              <li>Auto-log calls to affiliate/customer notes when call ends</li>
                              <li>Update UI in real-time using WebSocket or polling</li>
                            </ul>
                          </li>
                        </ul>
                      </div>

                      <div>
                        <h4 className="font-semibold mb-2">Data Storage Requirements (API Integration)</h4>
                        <ul className="list-disc pl-6 space-y-2 text-sm">
                          <li><strong>Environment Variables:</strong>
                            <ul className="list-disc pl-6 mt-1">
                              <li><code className="bg-gray-100 px-1 py-0.5 rounded">RINGCENTRAL_CLIENT_ID</code></li>
                              <li><code className="bg-gray-100 px-1 py-0.5 rounded">RINGCENTRAL_CLIENT_SECRET</code></li>
                              <li><code className="bg-gray-100 px-1 py-0.5 rounded">RINGCENTRAL_SERVER_URL</code> (sandbox or production)</li>
                              <li><code className="bg-gray-100 px-1 py-0.5 rounded">RINGCENTRAL_JWT_TOKEN</code> (for server-to-server auth)</li>
                            </ul>
                          </li>
                          <li><strong>Database Tables (Optional):</strong>
                            <ul className="list-disc pl-6 mt-1">
                              <li><code className="bg-gray-100 px-1 py-0.5 rounded">ringcentral_calls</code>: Store call history records
                                <ul className="list-disc pl-6 mt-1">
                                  <li>call_session_id, from_number, to_number, duration, timestamp, direction, outcome</li>
                                  <li>Foreign keys: affiliate_id or customer_id</li>
                                </ul>
                              </li>
                              <li><code className="bg-gray-100 px-1 py-0.5 rounded">ringcentral_sms</code>: Store SMS message history
                                <ul className="list-disc pl-6 mt-1">
                                  <li>message_id, from_number, to_number, message_text, timestamp, delivery_status</li>
                                  <li>Foreign keys: affiliate_id or customer_id</li>
                                </ul>
                              </li>
                            </ul>
                          </li>
                        </ul>
                      </div>

                      <div>
                        <h4 className="font-semibold mb-2">Security & Compliance</h4>
                        <ul className="list-disc pl-6 space-y-2 text-sm">
                          <li><strong>API Credentials:</strong> Store securely in environment variables, never expose in client-side code</li>
                          <li><strong>OAuth Tokens:</strong> Implement secure token storage with encryption</li>
                          <li><strong>Token Refresh:</strong> Automatically refresh access tokens before expiration</li>
                          <li><strong>Rate Limiting:</strong> Respect RingCentral API rate limits (varies by endpoint, typically 10-40 requests per minute)</li>
                          <li><strong>HTTPS Only:</strong> All API calls must use HTTPS</li>
                          <li><strong>Call Recording Compliance:</strong> If enabling call recording, ensure compliance with two-party consent laws</li>
                          <li><strong>Data Privacy:</strong> Handle phone numbers and call data according to GDPR/CCPA requirements</li>
                          <li><strong>Audit Logging:</strong> Log all RingCentral API calls with timestamps and user context</li>
                        </ul>
                      </div>

                      <div>
                        <h4 className="font-semibold mb-2">Implementation Considerations</h4>
                        <ul className="list-disc pl-6 space-y-2 text-sm">
                          <li><strong>Phased Rollout:</strong> Start with deep linking (Phase 1), add API features as needed (Phase 2)</li>
                          <li><strong>Admin Training:</strong> Provide documentation on RingCentral desktop app installation and setup</li>
                          <li><strong>Error Handling:</strong> Implement retry logic with exponential backoff for API failures</li>
                          <li><strong>Monitoring:</strong> Set up alerting for API errors, rate limit warnings, and webhook failures</li>
                          <li><strong>Testing:</strong> Use RingCentral sandbox environment for development and testing</li>
                          <li><strong>Cost Analysis:</strong> RingCentral API usage may incur additional costs beyond standard phone service</li>
                        </ul>
                      </div>

                      <div>
                        <h4 className="font-semibold mb-2">Recommended Phase 2 Features</h4>
                        <ul className="list-disc pl-6 space-y-2 text-sm">
                          <li><strong>Priority 1 (High Value):</strong>
                            <ul className="list-disc pl-6 mt-1">
                              <li>Call logging to affiliate/customer notes (automatic via webhooks)</li>
                              <li>Call history display in admin dashboard</li>
                            </ul>
                          </li>
                          <li><strong>Priority 2 (Medium Value):</strong>
                            <ul className="list-disc pl-6 mt-1">
                              <li>SMS sending from Communications module</li>
                              <li>SMS template system</li>
                            </ul>
                          </li>
                          <li><strong>Priority 3 (Nice to Have):</strong>
                            <ul className="list-disc pl-6 mt-1">
                              <li>Click-to-call via RingOut API (alternative to deep linking)</li>
                              <li>Call recording retrieval and storage</li>
                              <li>Real-time call status updates in UI</li>
                            </ul>
                          </li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>

              {/* Data Migration Requirements */}
              <Card className="p-4 sm:p-6">
                <h2 className="text-2xl font-bold mb-4">Data Migration from Exigo System</h2>
                
                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-semibold mb-2">Migration Tasks</h3>
                    <ul className="list-disc pl-6 space-y-2">
                      <li><strong>Customer Import:</strong> Import all customers from TheonGlobal Exigo system</li>
                      <li><strong>Table Separation:</strong> Currently customers and affiliates in same table - separate into distinct tables</li>
                      <li><strong>Transaction Import:</strong> Import all historical transactions</li>
                      <li><strong>Commission Import:</strong> Determine feasibility and import existing commission records if possible</li>
                      <li><strong>Shopify Order Number Parsing:</strong> Parse Shopify order numbers from Exigo notes and store in dedicated field</li>
                    </ul>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold mb-2">Data Mapping</h3>
                    <ul className="list-disc pl-6 space-y-2">
                      <li>Exigo Customer ID → Back office customer_id/affiliate_id</li>
                      <li>Exigo Webalias → affiliate site_name</li>
                      <li>Exigo Referral → affiliate enrolled_by relationship</li>
                      <li>Exigo CustomerType: 1 → customers table, 3 → affiliates table</li>
                    </ul>
                  </div>
                </div>
              </Card>

              {/* Affiliate Back Office */}
              <Card className="p-4 sm:p-6">
                <h2 className="text-2xl font-bold mb-4">Affiliate Back Office (Customer-Facing Portal)</h2>
                <Badge variant="outline" className="bg-green-50 mb-4">Prototype</Badge>
                
                <div className="space-y-4">
                  <p className="mb-4">
                    Separate portal for affiliates to manage their business. The prototype includes role-based authentication with dedicated affiliate dashboard and data access controls.
                  </p>

                  <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                    <h4 className="font-semibold mb-2 text-green-900">✅ Implemented Features</h4>
                    <ul className="list-disc pl-6 space-y-2 text-sm text-green-800">
                      <li><strong>Role-Based Authentication:</strong> Added 'affiliate' role to user_roles system with secure server-side validation</li>
                      <li><strong>Separate Dashboard:</strong> Dedicated /affiliate-dashboard route with personalized metrics (total commissions, customers, team members, orders)</li>
                      <li><strong>Conditional Navigation:</strong> Sidebar automatically hides admin-only features (Company Settings, Communications, SOW, Add Admins)</li>
                      <li><strong>Announcement Popups:</strong> Fully implemented announcement system displays targeted announcements to affiliates on login with role-based targeting, scheduling, and tracking</li>
                      <li><strong>Payment Method Setup:</strong> Demo page available at /payment-method with 4-step wizard (Address, Payment Method, Tax Forms, Done) for Tipalti integration preview</li>
                      <li><strong>Data Security:</strong> Row-Level Security (RLS) policies ensure affiliates only access their own data:
                        <ul className="list-disc pl-6 mt-1">
                          <li>Affiliates table: View and edit own profile only</li>
                          <li>Customers table: View only customers enrolled by them</li>
                          <li>Orders table: View only orders from their customers</li>
                          <li>Commissions table: View only their own commission records</li>
                          <li>Notes tables: View/edit notes only for their own records</li>
                        </ul>
                      </li>
                      <li><strong>Database Schema:</strong> auth_user_id column added to affiliates table linking to auth.users</li>
                      <li><strong>Automatic Routing:</strong> Login redirects to appropriate dashboard based on user role</li>
                    </ul>
                  </div>

                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                    <h4 className="font-semibold mb-2 text-blue-900">System Architecture Note</h4>
                    <p className="text-sm text-blue-800">
                      The Affiliate Back Office mirrors the admin system, however only for that affiliate's dashboard for their organization, their affiliates, their customers, their orders, their commissions, and their genealogy. Each affiliate can only see data related to their own downline organization and has no visibility into other affiliate organizations or system-wide data.
                    </p>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold mb-2">Dashboard</h3>
                    <ul className="list-disc pl-6 space-y-2">
                      <li><strong>Customers:</strong> Count (active/inactive)</li>
                      <li><strong>Affiliates:</strong> Count (active/inactive)</li>
                      <li><strong>Sales:</strong> Current week, last week, this month, last month, this year, last year, lifetime (with trend indicators)</li>
                      <li><strong>Commissions Paid:</strong> Current week, last week, this month, last month, this year, last year, lifetime (with trend indicators)</li>
                      <li><strong>Announcements:</strong> Pop-up system for specials, promotions, announcements</li>
                    </ul>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold mb-2">Core Modules</h3>
                    <ul className="list-disc pl-6 space-y-2">
                      <li><strong>Affiliates:</strong> View downline with search by name, phone, email, replicated site</li>
                      <li><strong>Customers:</strong> View personal customers</li>
                      <li><strong>Orders:</strong> View customer orders</li>
                      <li><strong>Commissions:</strong> View commission history by period (Level 1, Level 2)</li>
                      <li><strong>Link Generator:</strong> <Badge variant="outline" className="ml-2 bg-blue-50">Optional</Badge>
                        <ul className="list-disc pl-6 mt-1">
                          <li>Full URL</li>
                          <li>Shortened URL</li>
                          <li>QR Code generation</li>
                          <li>Social media sharing</li>
                          <li>Product-specific links</li>
                        </ul>
                        <p className="text-sm text-muted-foreground mt-2 italic">
                          This is an optional consideration by Theon Global management, not included in the initial SOW, however for future development consideration if desired.
                        </p>
                      </li>
                      <li><strong>Marketing Tools:</strong> <Badge variant="outline" className="ml-2 bg-blue-50">Optional</Badge> Images with embedded links for Facebook, Instagram, TikTok
                        <p className="text-sm text-muted-foreground mt-2 italic">
                          This is an optional consideration by Theon Global management, not included in the initial SOW, however for future development consideration if desired.
                        </p>
                      </li>
                      <li><strong>Shop:</strong> Link to replicated Shopify site</li>
                    </ul>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold mb-2">Affiliate Permission Restrictions (NEW - November 10, 2025)</h3>
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                      <h4 className="font-semibold mb-2 text-red-900">🔒 Security: Hidden Features for Affiliates</h4>
                      <p className="text-sm text-red-800 mb-2">
                        When logged in as an affiliate or when an admin is impersonating an affiliate, the following features must be completely hidden and inaccessible:
                      </p>
                      <ul className="list-disc pl-6 space-y-2 text-sm text-red-800">
                        <li><strong>Find Duplicates:</strong> Hidden in both Affiliates and Customers modules - affiliate users cannot access duplicate detection functionality</li>
                        <li><strong>Promote Customers to Affiliates:</strong> Hidden in Customers module - only admins can promote customers to affiliate status</li>
                        <li><strong>Delete Customers:</strong> Delete icon completely hidden in Customers module for affiliate users</li>
                        <li><strong>Delete Affiliates:</strong> Delete icon completely hidden in Affiliates module for affiliate users</li>
                        <li><strong>Edit Customer Details:</strong> Customer name links are not clickable and "Edit Customer" option is hidden from dropdown menus - affiliates have read-only access to customer data</li>
                        <li><strong>Edit Affiliate Details:</strong> Affiliate name links are not clickable and "View Affiliate" option is hidden from dropdown menus - affiliates have read-only access to downline affiliate data</li>
                        <li><strong>View in Shopify:</strong> All "View in Shopify" links are hidden from:
                          <ul className="list-disc pl-6 mt-1">
                            <li>Orders table main view</li>
                            <li>Customer orders dialog</li>
                            <li>Affiliate orders dialog</li>
                            <li>Order detail dialog</li>
                          </ul>
                        </li>
                      </ul>
                      <p className="text-sm text-red-800 mt-3">
                        <strong>Implementation Note:</strong> These restrictions apply to both affiliate users logging in directly AND admin users impersonating affiliates. The system uses the useUserRole() hook to check for affiliate status and conditionally renders UI elements based on the isAdmin flag.
                      </p>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold mb-2">My Team Module (NEW - November 14-15, 2025)</h3>
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                      <h4 className="font-semibold mb-2 text-green-900">👥 Affiliates: My Team Feature</h4>
                      <p className="text-sm text-green-800 mb-2">
                        A new dedicated page for affiliates to view and manage their team (downline organization) with comprehensive analytics and visual organization:
                      </p>
                      <ul className="list-disc pl-6 space-y-2 text-sm text-green-800">
                        <li><strong>Team Overview Cards:</strong>
                          <ul className="list-disc pl-6 mt-1">
                            <li>Total Team Size - Count of all downline affiliates (Level 1 + Level 2)</li>
                            <li>Level 1 Affiliates - Direct enrollments count</li>
                            <li>Level 2 Affiliates - Second-level downline count</li>
                            <li>Active Enrollers - Affiliates who have enrolled at least one person</li>
                          </ul>
                        </li>
                        <li><strong>Recent Activity Feed:</strong> Shows latest downline enrollments with affiliate names, enrollment dates, and levels</li>
                        <li><strong>Top Performers Section:</strong> Leaderboard showing top 5 affiliates by total sales with names and sales amounts</li>
                        <li><strong>Team Structure Visualization:</strong> Interactive genealogy tree showing organizational hierarchy with:
                          <ul className="list-disc pl-6 mt-1">
                            <li>Visual tree structure with connecting lines</li>
                            <li>Affiliate cards showing: name, ID, join date, status (active/inactive)</li>
                            <li>Level 1 and Level 2 downline display</li>
                            <li>Click to expand/collapse branches</li>
                          </ul>
                        </li>
                        <li><strong>Detailed Team List:</strong> Searchable, sortable table with:
                          <ul className="list-disc pl-6 mt-1">
                            <li>Affiliate name, ID, email, phone</li>
                            <li>Level (1 or 2), status, join date</li>
                            <li>Personal sales and team size metrics</li>
                            <li>Search by name, email, or ID</li>
                            <li>Sort by any column</li>
                          </ul>
                        </li>
                        <li><strong>Access Control:</strong> Only available to affiliate users, displays their own downline organization only</li>
                      </ul>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold mb-2">Affiliate Dashboard Enhancements (NEW - November 14-15, 2025)</h3>
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                      <h4 className="font-semibold mb-2 text-blue-900">📊 Enhanced Affiliate Dashboard Analytics</h4>
                      <p className="text-sm text-blue-800 mb-2">
                        Comprehensive dashboard providing affiliates with detailed business metrics and performance insights:
                      </p>
                      <ul className="list-disc pl-6 space-y-2 text-sm text-blue-800">
                        <li><strong>KPI Overview Cards:</strong>
                          <ul className="list-disc pl-6 mt-1">
                            <li>Total Customers - Count of personal customers with trend indicator</li>
                            <li>Team Size - Total downline affiliates (Level 1 + Level 2) with growth percentage</li>
                            <li>Total Sales - Lifetime sales volume with comparison to previous period</li>
                            <li>Commissions Earned - Lifetime commission earnings with recent trend</li>
                          </ul>
                        </li>
                        <li><strong>Team Performance Metrics:</strong>
                          <ul className="list-disc pl-6 mt-1">
                            <li>Level 1 Team Size - Direct enrollments count and percentage of total team</li>
                            <li>Level 2 Team Size - Second-level downline count and percentage</li>
                            <li>Active Team Members - Affiliates with recent activity</li>
                            <li>Team Growth Rate - Month-over-month team expansion percentage</li>
                          </ul>
                        </li>
                        <li><strong>Sales Performance Charts:</strong>
                          <ul className="list-disc pl-6 mt-1">
                            <li>Monthly Sales Trend - Line chart showing sales over last 6-12 months</li>
                            <li>Commission Breakdown - Pie chart showing Level 1 vs Level 2 commissions</li>
                            <li>Team Activity Heatmap - Visual representation of team member activity</li>
                          </ul>
                        </li>
                        <li><strong>Leaderboards:</strong>
                          <ul className="list-disc pl-6 mt-1">
                            <li>Top Performers - Top 5 downline affiliates by sales</li>
                            <li>Recent Enrollers - Newest team members with join dates</li>
                            <li>Most Active - Affiliates with highest customer acquisition</li>
                          </ul>
                        </li>
                        <li><strong>Quick Actions:</strong> Fast access to frequently used features like My Team, Customers, Orders, Commissions</li>
                      </ul>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold mb-2">Super Admin Role & Enhanced User Management (NEW - November 15, 2025)</h3>
                    <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 mb-4">
                      <h4 className="font-semibold mb-2 text-purple-900">👑 Super Admin Role & Granular Permissions System</h4>
                      <p className="text-sm text-purple-800 mb-2">
                        Enhanced role-based access control with Super Admin role and module-level permissions for precise security management:
                      </p>
                      
                      <div className="mt-3">
                        <h5 className="font-semibold text-purple-900 mb-1">Role Hierarchy</h5>
                        <ul className="list-disc pl-6 space-y-1 text-sm text-purple-800">
                          <li><strong>Super Admin:</strong> Highest privilege level with full system access including:
                            <ul className="list-disc pl-6 mt-1">
                              <li>Can invite and manage other Super Admin users</li>
                              <li>Can invite and manage Admin, Manager, and User roles</li>
                              <li>Full access to all modules and company settings</li>
                              <li>Can delete any users including other admins</li>
                              <li>Access to all dashboard analytics and impersonation features</li>
                            </ul>
                          </li>
                          <li><strong>Admin:</strong> Full system access except:
                            <ul className="list-disc pl-6 mt-1">
                              <li>Cannot invite or create Super Admin users</li>
                              <li>Cannot modify or delete Super Admin users</li>
                              <li>Can manage Admin, Manager, and User roles</li>
                              <li>Module permissions subject to assigned access levels</li>
                            </ul>
                          </li>
                          <li><strong>Manager:</strong> Limited administrative access based on assigned module permissions</li>
                          <li><strong>User:</strong> Basic access with read-only permissions as assigned</li>
                          <li><strong>Affiliate:</strong> Customer-facing portal access only (separate hierarchy)</li>
                        </ul>
                      </div>

                      <div className="mt-3">
                        <h5 className="font-semibold text-purple-900 mb-1">Module-Level Permissions</h5>
                        <p className="text-sm text-purple-800 mb-1">Each user can be assigned granular permissions for individual modules:</p>
                        <ul className="list-disc pl-6 space-y-1 text-sm text-purple-800">
                          <li><strong>Core Modules:</strong> Affiliates, Customers, Orders, Commissions, Communications</li>
                          <li><strong>Company Settings Modules:</strong> Company Info, Users, Compensation, Integrations, Social Media, Announcements, Deleted Folder</li>
                          <li><strong>Dashboard Modules:</strong> Impersonate Top of Company, Company Analytics Overview, Affiliate Program Analytics, Affiliate Leaderboard, Customer Insights</li>
                          <li><strong>Permission Levels:</strong>
                            <ul className="list-disc pl-6 mt-1">
                              <li><strong>None:</strong> No access to module</li>
                              <li><strong>View:</strong> Read-only access - can view data but cannot edit, create, or delete</li>
                              <li><strong>Edit:</strong> Full access - can view, create, edit, and delete (where applicable)</li>
                            </ul>
                          </li>
                        </ul>
                      </div>

                      <div className="mt-3">
                        <h5 className="font-semibold text-purple-900 mb-1">User Management Security Features</h5>
                        <ul className="list-disc pl-6 space-y-1 text-sm text-purple-800">
                          <li><strong>View-Only Mode:</strong> Users with "View" permission see eye icon instead of edit icon, all fields disabled, cannot save changes</li>
                          <li><strong>Role Restrictions:</strong> Super Admin role option disabled for non-Super Admin users in invite dialog</li>
                          <li><strong>Invite User Button:</strong> Only visible to users with "Edit" permission for Company Settings - Users module</li>
                          <li><strong>User Menu Display:</strong> Shows first name and role (e.g., "Robert | Super Admin") with user circle icon</li>
                          <li><strong>Cache Management:</strong> All user role and profile queries cleared on login/logout to prevent stale data display</li>
                          <li><strong>Role Format Display:</strong> Proper formatting of roles (e.g., "super_admin" displayed as "Super Admin")</li>
                        </ul>
                      </div>

                      <div className="mt-3">
                        <h5 className="font-semibold text-purple-900 mb-1">Company Settings Permission Enforcement</h5>
                        <p className="text-sm text-purple-800 mb-1">Each Company Settings tab enforces permissions at the UI level:</p>
                        <ul className="list-disc pl-6 space-y-1 text-sm text-purple-800">
                          <li><strong>Company Tab:</strong> All input fields and "Save Company Settings" button disabled for View-only users; toast notification on unauthorized save attempt</li>
                          <li><strong>Compensation Tab:</strong> Number of levels, percentage inputs, and save button disabled for View-only users; toast notification on unauthorized save attempt</li>
                          <li><strong>Integrations Tab:</strong> All integration switches (SendGrid, Twilio, Resend, Shopify, Awtomic, Tipalti), configuration fields, and individual save buttons disabled for View-only users; toast notification on unauthorized save attempt</li>
                          <li><strong>Social Media Tab:</strong> All social media URL inputs and save button disabled for View-only users; toast notification on unauthorized save attempt</li>
                          <li><strong>Announcements Tab:</strong> Create, edit, and delete actions hidden/blocked for View-only users; announcement editor dialog prevented from opening; toast notification on unauthorized actions</li>
                          <li><strong>Deleted Folder Tab:</strong> Restore, permanent delete, and empty folder actions blocked for View-only users; toast notification on unauthorized actions</li>
                        </ul>
                        <p className="text-sm text-purple-800 mt-2 italic">
                          <strong>Implementation:</strong> All tabs use useModulePermissions() hook with specific module keys (e.g., "company_settings_company", "company_settings_compensation") to check permission levels and conditionally disable UI elements and block mutations.
                        </p>
                      </div>

                      <div className="mt-3">
                        <h5 className="font-semibold text-purple-900 mb-1">Security Implementation</h5>
                        <ul className="list-disc pl-6 space-y-1 text-sm text-purple-800">
                          <li><strong>Backend Validation:</strong> All role checks performed server-side using database functions (is_super_admin, is_admin)</li>
                          <li><strong>Row-Level Security:</strong> RLS policies enforce role-based data access at database level</li>
                          <li><strong>UI Enforcement:</strong> Frontend uses useUserRole() and useModulePermissions() hooks for conditional rendering</li>
                          <li><strong>Edge Function Security:</strong> Admin management operations require authentication tokens and role verification</li>
                          <li><strong>Module Permissions Table:</strong> Stores granular permissions per user per module with none/view/edit levels</li>
                        </ul>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold mb-2">Conditional Delete Restrictions (NEW - November 10, 2025)</h3>
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                      <h4 className="font-semibold mb-2 text-yellow-900">⚠️ Data Integrity: Smart Delete Protection</h4>
                      <p className="text-sm text-yellow-800 mb-2">
                        Delete icons are conditionally hidden based on data relationships to prevent accidental deletion of records with important business data and maintain referential integrity:
                      </p>
                      
                      <div className="mt-3">
                        <h5 className="font-semibold text-yellow-900 mb-1">Affiliate Delete Restrictions</h5>
                        <p className="text-sm text-yellow-800 mb-1">The Delete icon is hidden in the Affiliates module Actions column if ANY of the following conditions are true:</p>
                        <ul className="list-disc pl-6 space-y-1 text-sm text-yellow-800">
                          <li><strong>Has Earned Commissions:</strong> last_commission_date field is not null (affiliate has earned commissions at any point)</li>
                          <li><strong>Has Enrolled Affiliates:</strong> affiliate_count is greater than 0 (has downline affiliates)</li>
                          <li><strong>Has Enrolled Customers:</strong> customer_count is greater than 0 (has made purchases or enrolled customers)</li>
                        </ul>
                        <p className="text-sm text-yellow-800 mt-2 italic">
                          Rationale: Prevents deletion of affiliates with active business relationships, commission history, or genealogy connections.
                        </p>
                      </div>

                      <div className="mt-3">
                        <h5 className="font-semibold text-yellow-900 mb-1">Customer Delete Restrictions</h5>
                        <p className="text-sm text-yellow-800 mb-1">The Delete icon is hidden in the Customers module Actions column if:</p>
                        <ul className="list-disc pl-6 space-y-1 text-sm text-yellow-800">
                          <li><strong>Has Orders:</strong> order_count is greater than 0 (customer has placed at least one order)</li>
                        </ul>
                        <p className="text-sm text-yellow-800 mt-2 italic">
                          Rationale: Prevents deletion of customers with order history and commission associations.
                        </p>
                      </div>

                      <p className="text-sm text-yellow-800 mt-3">
                        <strong>Implementation Note:</strong> These restrictions apply to BOTH desktop and mobile views. The conditional logic checks the affiliate/customer record data before rendering the Delete icon or menu item. This ensures admins can only delete "clean" records without business data dependencies.
                      </p>
                    </div>
                  </div>
                </div>
              </Card>

              {/* Development Priorities */}
              <Card className="p-4 sm:p-6">
                <h2 className="text-2xl font-bold mb-4">Recommended Development Phases</h2>
                
                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-semibold mb-2">Phase 1: Foundation & Data Migration</h3>
                    <ul className="list-disc pl-6 space-y-2">
                      <li>Set up Node.js backend with MongoDB</li>
                      <li>Implement authentication system</li>
                      <li>Migrate database schema from prototype to production database</li>
                      <li>Import Exigo data (customers, affiliates, orders)</li>
                      <li>Parse and migrate Shopify order numbers from notes</li>
                      <li>Implement role-based access control</li>
                    </ul>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold mb-2">Phase 2: Shopify Integration</h3>
                    <ul className="list-disc pl-6 space-y-2">
                      <li>Implement Shopify API authentication</li>
                      <li>Build order synchronization (bi-directional)</li>
                      <li>Build customer/affiliate synchronization (bi-directional)</li>
                      <li>Implement metafield management</li>
                      <li>Create replicated site generation logic</li>
                      <li>Handle cancellations and refunds</li>
                      <li>Integrate with Awtomic app</li>
                    </ul>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold mb-2">Phase 3: Commission Engine</h3>
                    <ul className="list-disc pl-6 space-y-2">
                      <li>Implement automatic commission calculation on order import</li>
                      <li>Build commission period management (weekly cycles)</li>
                      <li>Create commission adjustment system</li>
                      <li>Implement roll-forward logic for unpaid commissions</li>
                      <li>Build enrolling affiliate change handling with commission reassignment</li>
                      <li>Implement cancellation/refund clawback logic</li>
                    </ul>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold mb-2">Phase 4: KYC & Tipalti Integration</h3>
                    <ul className="list-disc pl-6 space-y-2">
                      <li>Implement KYC verification process</li>
                      <li>Build duplicate detection system</li>
                      <li>Create affiliate approval workflow</li>
                      <li>Integrate Tipalti API for affiliate management</li>
                      <li>Implement commission payment processing</li>
                      <li>Build Tipalti account status checking</li>
                    </ul>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold mb-2">Phase 5: Admin Portal Completion</h3>
                    <ul className="list-disc pl-6 space-y-2">
                      <li>Complete Commissions module UI and functionality</li>
                      <li>Complete Genealogy module with dedicated page</li>
                      <li>Implement SMS sending functionality</li>
                      <li>Enhance dashboard with real-time data</li>
                      <li>Add reporting and analytics features</li>
                    </ul>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold mb-2">Phase 6: Affiliate Portal</h3>
                    <ul className="list-disc pl-6 space-y-2">
                      <li>Build affiliate-facing dashboard</li>
                      <li>Implement link generator with QR codes</li>
                      <li>Create marketing tools section</li>
                      <li>Build downline and customer views</li>
                      <li>Implement commission history views</li>
                      <li>Add shop integration to replicated site</li>
                    </ul>
                  </div>
                </div>
              </Card>

              {/* Project Timeline */}
              <Card className="p-4 sm:p-6">
                <h2 className="text-2xl font-bold mb-4">Project Timeline</h2>
                
                <div className="space-y-4">
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h3 className="text-lg font-semibold mb-2 text-blue-900">Completion Date</h3>
                    <p className="text-sm text-blue-800">
                      <strong>Target Completion Date (including testing):</strong> April 15th
                    </p>
                  </div>

                  <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                    <h3 className="text-lg font-semibold mb-2 text-purple-900">Historical Data Migration</h3>
                    <p className="text-sm text-purple-800">
                      <strong>Final import of historical data from Exigo platform:</strong> April 22nd
                    </p>
                  </div>
                </div>
              </Card>

              {/* API Requirements */}
              <Card className="p-4 sm:p-6">
                <h2 className="text-2xl font-bold mb-4">API Requirements</h2>
                
                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-semibold mb-2">External APIs to Integrate</h3>
                    <ul className="list-disc pl-6 space-y-2">
                      <li><strong>Shopify Admin API:</strong> Orders, customers, metafields, products</li>
                      <li><strong>Shopify Storefront API:</strong> Replicated site content delivery</li>
                      <li><strong>Tipalti API:</strong> Payee management, payment processing</li>
                      <li><strong>Awtomic API:</strong> Subscription management (if available)</li>
                    </ul>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold mb-2">Internal REST API Endpoints (Examples)</h3>
                    <div className="space-y-3">
                      <div>
                        <h4 className="font-semibold">Authentication</h4>
                        <ul className="list-disc pl-6 text-sm">
                          <li>POST /api/auth/login</li>
                          <li>POST /api/auth/signup</li>
                          <li>POST /api/auth/logout</li>
                          <li>GET /api/auth/me</li>
                        </ul>
                      </div>

                      <div>
                        <h4 className="font-semibold">Affiliates</h4>
                        <ul className="list-disc pl-6 text-sm">
                          <li>GET /api/affiliates</li>
                          <li>GET /api/affiliates/:id</li>
                          <li>POST /api/affiliates</li>
                          <li>PUT /api/affiliates/:id</li>
                          <li>DELETE /api/affiliates/:id</li>
                          <li>GET /api/affiliates/:id/downline</li>
                          <li>GET /api/affiliates/:id/customers</li>
                          <li>GET /api/affiliates/:id/commissions</li>
                          <li>POST /api/affiliates/:id/change-enrolling</li>
                        </ul>
                      </div>

                      <div>
                        <h4 className="font-semibold">Customers</h4>
                        <ul className="list-disc pl-6 text-sm">
                          <li>GET /api/customers</li>
                          <li>GET /api/customers/:id</li>
                          <li>POST /api/customers</li>
                          <li>PUT /api/customers/:id</li>
                          <li>DELETE /api/customers/:id</li>
                          <li>POST /api/customers/:id/promote-to-affiliate</li>
                        </ul>
                      </div>

                      <div>
                        <h4 className="font-semibold">Orders</h4>
                        <ul className="list-disc pl-6 text-sm">
                          <li>GET /api/orders</li>
                          <li>GET /api/orders/:id</li>
                          <li>POST /api/orders (manual creation)</li>
                          <li>PUT /api/orders/:id</li>
                          <li>POST /api/orders/sync-from-shopify (webhook or scheduled)</li>
                        </ul>
                      </div>

                      <div>
                        <h4 className="font-semibold">Commissions</h4>
                        <ul className="list-disc pl-6 text-sm">
                          <li>GET /api/commissions/periods</li>
                          <li>GET /api/commissions/periods/:id</li>
                          <li>POST /api/commissions/calculate (trigger calculation)</li>
                          <li>POST /api/commissions/adjustments</li>
                          <li>POST /api/commissions/close-period/:id</li>
                          <li>POST /api/commissions/pay-period/:id (trigger Tipalti payment)</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>

              {/* Security & Compliance */}
              <Card className="p-4 sm:p-6">
                <h2 className="text-2xl font-bold mb-4">Security & Compliance Considerations</h2>
                
                <ul className="list-disc pl-6 space-y-2">
                  <li><strong>Data Protection:</strong> Encrypt sensitive data (Tax IDs, payment info)</li>
                  <li><strong>PCI Compliance:</strong> Never store full credit card numbers (handled by Shopify)</li>
                  <li><strong>Access Control:</strong> Implement granular role-based permissions</li>
                  <li><strong>Audit Logging:</strong> Track all admin actions, especially commission adjustments and affiliate changes</li>
                  <li><strong>API Security:</strong> Use API keys, rate limiting, request validation</li>
                  <li><strong>GDPR/CCPA:</strong> Implement data export, deletion, and consent management</li>
                  <li><strong>Financial Accuracy:</strong> Ensure commission calculations are auditable and reversible</li>
                  <li><strong>Testing:</strong> Extensive testing of commission calculations and payment flows</li>
                </ul>
              </Card>

              {/* Testing Requirements */}
              <Card className="p-4 sm:p-6">
                <h2 className="text-2xl font-bold mb-4">Testing Requirements</h2>
                
                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-semibold mb-2">Critical Test Scenarios</h3>
                    <ul className="list-disc pl-6 space-y-2">
                      <li><strong>Commission Accuracy:</strong> Test all commission calculation scenarios with various order amounts</li>
                      <li><strong>Genealogy Changes:</strong> Test commission reassignment when enrolling affiliate changes</li>
                      <li><strong>Cancellations/Refunds:</strong> Test clawback logic in various time scenarios</li>
                      <li><strong>Roll-Forward Logic:</strong> Test commission rolling forward for affiliates without Tipalti accounts</li>
                      <li><strong>Shopify Sync:</strong> Test bi-directional sync with edge cases (duplicate orders, timing issues)</li>
                      <li><strong>KYC Process:</strong> Test duplicate detection and customer/affiliate conversion flows</li>
                      <li><strong>Negative Balances:</strong> Test handling of negative commission balances</li>
                      <li><strong>Period Transitions:</strong> Test automatic period creation and closure</li>
                    </ul>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold mb-2">Performance Testing</h3>
                    <ul className="list-disc pl-6 space-y-2">
                      <li>Test with large datasets (thousands of affiliates, orders)</li>
                      <li>Test genealogy tree rendering with deep hierarchies</li>
                      <li>Test commission calculation speed for weekly processing</li>
                      <li>Test API response times under load</li>
                    </ul>
                  </div>
                </div>
              </Card>

              {/* Documentation Requirements */}
              <Card className="p-4 sm:p-6">
                <h2 className="text-2xl font-bold mb-4">Documentation Requirements</h2>
                
                <ul className="list-disc pl-6 space-y-2">
                  <li><strong>API Documentation:</strong> Complete REST API documentation with examples</li>
                  <li><strong>Database Schema:</strong> Entity-relationship diagrams and field definitions</li>
                  <li><strong>Integration Guides:</strong> Shopify and Tipalti integration setup instructions</li>
                  <li><strong>Deployment Guide:</strong> Server setup, environment variables, deployment procedures</li>
                  <li><strong>Admin User Guide:</strong> How to use all admin features</li>
                  <li><strong>Affiliate User Guide:</strong> How affiliates use their portal</li>
                  <li><strong>Commission Calculation Logic:</strong> Detailed documentation of all calculation rules</li>
                  <li><strong>Troubleshooting Guide:</strong> Common issues and solutions</li>
                </ul>
              </Card>

              {/* Technical Constraints */}
              <Card className="p-4 sm:p-6">
                <h2 className="text-2xl font-bold mb-4">Technical Constraints & Considerations</h2>
                
                <ul className="list-disc pl-6 space-y-2">
                  <li><strong>Timezone Handling:</strong> Commission periods use CST/EST - ensure proper timezone management</li>
                  <li><strong>Decimal Precision:</strong> Use appropriate decimal types for currency (avoid floating point errors)</li>
                  <li><strong>Race Conditions:</strong> Handle concurrent commission calculations and order updates</li>
                  <li><strong>Idempotency:</strong> Ensure API calls can be safely retried (especially Shopify webhooks)</li>
                  <li><strong>Error Recovery:</strong> Implement robust error handling and retry logic for external APIs</li>
                  <li><strong>Data Consistency:</strong> Use database transactions for multi-step operations</li>
                  <li><strong>Scalability:</strong> Design for growth (current: hundreds of affiliates, future: potentially thousands)</li>
                  <li><strong>Backup & Recovery:</strong> Implement regular database backups and recovery procedures</li>
                </ul>
              </Card>

              {/* Contact & Questions */}
              <Card className="p-4 sm:p-6">
                <h2 className="text-2xl font-bold mb-4">Outstanding Questions & Clarifications</h2>
                
                <ul className="list-disc pl-6 space-y-2">
                  <li>Confirm Tipalti email automation for new affiliates (ask Larry, Ashley, Brittney)</li>
                  <li>Determine feasibility of importing historical commission data from Exigo</li>
                  <li>Clarify Awtomic API availability and integration requirements</li>
                  <li>Define error notification procedures (email alerts, admin dashboard notifications)</li>
                  <li>Establish maintenance window policies for system updates</li>
                  <li>Define backup retention policies</li>
                  <li>Clarify reporting requirements (what reports need to be generated)</li>
                  <li>Determine if there are tax reporting requirements (1099 generation, etc.)</li>
                </ul>
              </Card>

              {/* Appendix */}
              <Card className="p-4 sm:p-6">
                <h2 className="text-2xl font-bold mb-4">Appendix: Key Files in Prototype</h2>
                
                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-semibold mb-2">Core Components</h3>
                    <ul className="list-disc pl-6 space-y-1 text-sm">
                      <li><code>/src/pages/Index.tsx</code> - Dashboard page (Admin)</li>
                      <li><code>/src/pages/AffiliateIndex.tsx</code> - Affiliate Dashboard page (NEW - November 14-15, 2025)</li>
                      <li><code>/src/pages/Affiliates.tsx</code> - Affiliates management page</li>
                      <li><code>/src/pages/MyTeam.tsx</code> - My Team page for affiliates (NEW - November 14-15, 2025)</li>
                      <li><code>/src/pages/Customers.tsx</code> - Customers management page</li>
                      <li><code>/src/pages/Orders.tsx</code> - Orders management page</li>
                      <li><code>/src/pages/AccountProfile.tsx</code> - User profile page</li>
                      <li><code>/src/pages/CompanySettings.tsx</code> - Company settings page</li>
                      <li><code>/src/pages/Communications.tsx</code> - Email/SMS templates page</li>
                      <li><code>/src/pages/Commissions.tsx</code> - Commissions page (needs enhancement)</li>
                      <li><code>/src/pages/Genealogy.tsx</code> - Genealogy page (needs enhancement)</li>
                    </ul>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold mb-2">Key Component Files</h3>
                    <ul className="list-disc pl-6 space-y-1 text-sm">
                      <li><code>/src/components/affiliates/affiliate-table.tsx</code></li>
                      <li><code>/src/components/affiliates/affiliate-edit-dialog.tsx</code></li>
                      <li><code>/src/components/affiliates/affiliate-genealogy-tree.tsx</code></li>
                      <li><code>/src/components/my-team/team-overview.tsx</code> - My Team dashboard cards (NEW - November 14-15, 2025)</li>
                      <li><code>/src/components/affiliate-dashboard/affiliate-kpi-cards.tsx</code> - Dashboard KPI metrics (NEW - November 14-15, 2025)</li>
                      <li><code>/src/components/affiliate-dashboard/affiliate-team-stats.tsx</code> - Team performance stats (NEW - November 14-15, 2025)</li>
                      <li><code>/src/components/affiliate-dashboard/affiliate-revenue-metrics.tsx</code> - Revenue charts (NEW - November 14-15, 2025)</li>
                      <li><code>/src/components/affiliate-dashboard/affiliate-leaderboards.tsx</code> - Top performers leaderboard (NEW - November 14-15, 2025)</li>
                      <li><code>/src/components/customers/customer-table.tsx</code></li>
                      <li><code>/src/components/customers/customer-edit-dialog.tsx</code></li>
                      <li><code>/src/components/settings/users-tab.tsx</code> - Enhanced user management with permissions (UPDATED - November 15, 2025)</li>
                      <li><code>/src/components/user-menu.tsx</code> - User menu with role display (UPDATED - November 15, 2025)</li>
                      <li><code>/src/components/shared/commission-adjustment-dialog.tsx</code></li>
                      <li><code>/src/components/shared/enrolling-affiliate-change-dialog.tsx</code></li>
                      <li><code>/src/components/shared/shopify-update-dialog.tsx</code></li>
                      <li><code>/src/components/shared/shopify-metadata-update-dialog.tsx</code></li>
                    </ul>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold mb-2">Database Utilities</h3>
                    <ul className="list-disc pl-6 space-y-1 text-sm">
                      <li><code>/src/lib/commission-utils.ts</code> - Commission calculation helpers</li>
                      <li><code>/src/lib/badge-variants.ts</code> - Status badge styling</li>
                      <li><code>/src/hooks/use-user-role.tsx</code> - User role management hook (UPDATED - November 15, 2025)</li>
                      <li><code>/src/hooks/use-module-permissions.tsx</code> - Module permission checking hook</li>
                    </ul>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold mb-2">Design System</h3>
                    <ul className="list-disc pl-6 space-y-1 text-sm">
                      <li><code>/src/index.css</code> - Global styles and CSS variables</li>
                      <li><code>/tailwind.config.ts</code> - Tailwind configuration</li>
                      <li><code>/src/components/ui/*</code> - shadcn/ui component library</li>
                    </ul>
                  </div>
                </div>
              </Card>

              {/* Footer */}
              <Card className="p-6 bg-muted/50">
                <p className="text-sm text-muted-foreground text-center">
                  This Statement of Work is a living document and should be updated as requirements evolve and questions are answered.
                  For questions or clarifications, please contact the project stakeholders.
                </p>
              </Card>
            </div>
          </main>
          
          <footer className="px-4 md:px-6 py-4 border-t border-border flex flex-col sm:flex-row items-center justify-center sm:justify-between gap-3 print:hidden">
            <p className="text-sm text-muted-foreground">© {new Date().getFullYear()}, Theon Global</p>
            <SocialMediaLinks />
          </footer>
        </div>
      </div>
      
      <style>{`
        @media print {
          @page {
            margin: 0.75in;
            size: letter;
          }
          
          body {
            print-color-adjust: exact;
            -webkit-print-color-adjust: exact;
          }
          
          .print\\:hidden {
            display: none !important;
          }
          
          .max-w-6xl {
            max-width: 100%;
          }
          
          .space-y-6 > * + * {
            margin-top: 1rem;
            page-break-inside: avoid;
          }
          
          h1, h2, h3, h4 {
            page-break-after: avoid;
            page-break-inside: avoid;
          }
          
          .border {
            border: 1px solid #e5e7eb !important;
          }
          
          ul, ol {
            page-break-inside: avoid;
          }
        }
      `}</style>
    </SidebarProvider>
  );
};

export default SOW;
