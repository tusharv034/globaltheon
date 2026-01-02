import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface SuperAdminPermissionsProps {
  permissions: { [key: string]: string };
  onPermissionChange: (module: string, level: string) => void;
  disabled?: boolean;
}

const DASHBOARD_MODULES = [
  { key: "impersonate_top_company", label: "Impersonate Top of Company" },
  { key: "view_analytics_overview", label: "View Company Analytics Overview" },
  { key: "view_affiliate_analytics", label: "View Affiliate Program Analytics" },
  { key: "view_affiliate_leaderboard", label: "View Affiliate Leaderboard" },
  { key: "view_customer_insights", label: "View Customer Insights" },
];

const COMPANY_SETTINGS_MODULES = [
  { key: "company_settings_company", label: "Company" },
  { key: "company_settings_users", label: "Users" },
  { key: "company_settings_compensation", label: "Compensation" },
  { key: "company_settings_integrations", label: "Integrations" },
  { key: "company_settings_social_media", label: "Social Media" },
  { key: "company_settings_announcements", label: "Announcements" },
  { key: "company_settings_deleted_folder", label: "Deleted Folder" },
];

const PERMISSION_LEVELS = [
  { value: "none", label: "None" },
  { value: "view", label: "View" },
  { value: "edit", label: "Edit" },
];

const BOOLEAN_LEVELS = [
  { value: "none", label: "No" },
  { value: "view", label: "Yes" },
];

export function SuperAdminPermissions({ permissions, onPermissionChange, disabled }: SuperAdminPermissionsProps) {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Dashboard Permissions</CardTitle>
          <CardDescription>
            Control access to dashboard features (Super Admin only)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {DASHBOARD_MODULES.map((module) => (
            <div key={module.key} className="flex items-center justify-between">
              <Label htmlFor={`permission-${module.key}`}>{module.label}</Label>
              <Select
                value={permissions[module.key] || "none"}
                onValueChange={(value) => onPermissionChange(module.key, value)}
                disabled={disabled}
              >
                <SelectTrigger id={`permission-${module.key}`} className="w-[180px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {BOOLEAN_LEVELS.map((level) => (
                    <SelectItem key={level.value} value={level.value}>
                      {level.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Company Settings Permissions</CardTitle>
          <CardDescription>
            Control access to company settings tabs (Super Admin only)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {COMPANY_SETTINGS_MODULES.map((module) => (
            <div key={module.key} className="flex items-center justify-between">
              <Label htmlFor={`permission-${module.key}`}>{module.label}</Label>
              <Select
                value={permissions[module.key] || "none"}
                onValueChange={(value) => onPermissionChange(module.key, value)}
                disabled={disabled}
              >
                <SelectTrigger id={`permission-${module.key}`} className="w-[180px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PERMISSION_LEVELS.map((level) => (
                    <SelectItem key={level.value} value={level.value}>
                      {level.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
