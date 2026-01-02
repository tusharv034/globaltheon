import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useUserRole } from "@/hooks/use-user-role";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Pencil, Trash2, Loader2, Eye, EyeOff, DeleteIcon } from "lucide-react";
import { useModulePermissions } from "@/hooks/use-module-permissions";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createCompanyUser, readAllowedRoles, readCompanyUsers, updateCompanyUser, deleteCompanyUser } from "@/api/auth";

interface User {
  _id: string;
  email: string;
  firstName: string;
  lastName: string;
  password?: string;
  role?: string;
  permissions: { [key: string]: string };
}

type PermissionLevel = "none" | "view" | "edit";

const MODULES = [
  "Affiliates",
  "Customers",
  "Orders",
  "Commissions",
  "Communications",
  "Genealogy",
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

const DASHBOARD_MODULES = [
  { key: "impersonate_top_company", label: "Impersonate Top of Company" },
  { key: "view_analytics_overview", label: "Company Analytics Overview" },
  { key: "view_affiliate_analytics", label: "Affiliate Program Analytics" },
  { key: "view_affiliate_leaderboard", label: "Affiliate Leaderboard" },
  { key: "view_customer_insights", label: "Customer Insights" },
];

const PERMISSION_LEVELS = ["none", "view", "edit"];

export function UsersTab() {

  // check for isSuperAdmin
  const { isSuperAdmin } = useUserRole();
  // function to check for module permission
  const { hasPermission } = useModulePermissions();
  // Check if users can be created and updated and deleted
  const canEditUsers = hasPermission("company_settings_permissions", "users", "edit");
  // Check if users can be viewed
  const canViewUsers = hasPermission("company_settings_permissions", "users", "view");
  // state to store all the users
  // const [users, setUsers] = useState<User[]>([]);
  const [users, setUsers] = useState<any>([]);
  // state for loading
  const [loading, setLoading] = useState(true);
  // state to trigger opening and closing of dialog
  const [dialogOpen, setDialogOpen] = useState(false);
  // state to trigger opening and closing of dialog open and close
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  // state to store selected user
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  // state to store newEmail of selected user
  const [newUserEmail, setNewUserEmail] = useState("");
  // state to store new password of selected user
  const [newUserPassword, setNewUserPassword] = useState("");
  // state to store new FName of selected selected user
  const [newUserFirstName, setNewUserFirstName] = useState("");
  // state to store new LName of seleted selected user
  const [newUserLastName, setNewUserLastName] = useState("");
  // state to store new role of selected selected user
  const [newUserRole, setNewUserRole] = useState("user");
  // state to store module_permissions of selected user
  // const [modulePermissions, setModulePermissions] = useState<Record<string, PermissionLevel>>(
  const [modulePermissions, setModulePermissions] = useState<any>(
    MODULES.reduce((acc, module) => ({ ...acc, [module]: "none" }), {})
  );
  // state to store company_settting_permissions of selected user
  const [companySettingsPermissions, setCompanySettingsPermissions] = useState<{ [key: string]: string }>(
    COMPANY_SETTINGS_MODULES.reduce((acc, module) => ({ ...acc, [module.key]: "none" }), {})
  );
  // state to store dashboard permissions of new user
  const [dashboardPermissions, setDashboardPermissions] = useState<{ [key: string]: string }>(
    DASHBOARD_MODULES.reduce((acc, module) => ({ ...acc, [module.key]: "none" as const }), {} as Record<string, PermissionLevel>)
  );
  // state to store the show password of user
  const [showPassword, setShowPassword] = useState(false);
  // toast for notification
  const { toast } = useToast();

  const { data: companyUsers, isLoading, isError, error } = useQuery({
    queryKey: ["read-users"],
    queryFn: async () => {
      try {
        const response = await readCompanyUsers();
        
        if (!response.data.success) throw new Error("Failed to load users");
        return response.data.data; // this matches your backend response
      } catch (error) {
        // console.log("error is ", error);
        toast({
          title: "Error",
          description: "Failed to load users. Make sure you have admin privileges.",
          variant: "destructive",
        });
      }
    }
  });

  const { data: allowedRolesData, isLoading: isAllowedRolesLoading, isError: isAllowedRolesError, error: allowedRolesError } = useQuery({
    queryKey: ["allowed-roles"],
    queryFn: async () => {
      try {
        const response = await readAllowedRoles();
       
        if (!response.data.success) throw new Error("Failed to load user roles");
        return response.data.data;
      } catch (error) {
        console.error("error is ", error);
        toast({
          title: "Error",
          description: "Failed to load users. Make sure you have admin privileges.",
          variant: "destructive",
        });
      }
    }
  });

  const [allowedRoles, setAllowedRoles] = useState<any>();

  useEffect(() => {
    if (allowedRolesData) {
    
      setAllowedRoles(allowedRolesData);
    }
    setLoading(isAllowedRolesLoading);
  }, [allowedRolesData, isAllowedRolesLoading]);

  // Now just use these instead of your old state
  useEffect(() => {
    if (companyUsers) {
      setUsers(companyUsers.companyUsers);
    }
    setLoading(isLoading);
  }, [companyUsers, isLoading]);


  // function to toggle editing the user with new information
  const handleEditUser = (user: any) => {
    setSelectedUser(user);
    setNewUserEmail(user.email);
    setNewUserPassword("");
    setNewUserFirstName(user.firstName || "");
    setNewUserLastName(user.lastName || "");
    setNewUserRole(user.role || "user");

    // === THIS IS THE FIX === //
    const permissionsArray = user.permissions || [];

    // Build lookup: { "affiliates.module_permissions": "edit", ... }
    const permMap = permissionsArray.reduce((acc: any, p: any) => {
      if (p.module && p.section) {
        // Case 1: Main modules → use capitalized module name
        if (p.section === "module_permissions") {
          const moduleKey = p.module.charAt(0).toUpperCase() + p.module.slice(1); // "affiliates" → "Affiliates"
          acc[moduleKey] = p.permission;
        }
        // Case 2: Company settings → map module name to key
        else if (p.section === "company_settings_permissions") {
          const mapping: Record<string, string> = {
            company: "company_settings_company",
            users: "company_settings_users",
            compensation: "company_settings_compensation",
            integrations: "company_settings_integrations",
            social_media: "company_settings_social_media",
            announcements: "company_settings_announcements",
            deleted_folder: "company_settings_deleted_folder",
          };
          const key = mapping[p.module];
          if (key) acc[key] = p.permission;
        }
        else if (p.section === "dashboard_module_permissions") {
          // Direct mapping — module name matches key exactly
          acc[p.module] = p.permission;
        }
      }
      return acc;
    }, {});

    // Now set the states correctly
    setModulePermissions(
      MODULES.reduce((acc, module) => ({
        ...acc,
        [module]: permMap[module] || "none",
      }), {})
    );

    setCompanySettingsPermissions(
      COMPANY_SETTINGS_MODULES.reduce((acc, module) => ({
        ...acc,
        [module.key]: permMap[module.key] || "none",
      }), {})
    );

    setDashboardPermissions(
      DASHBOARD_MODULES.reduce((acc, module) => ({
        ...acc,
        [module.key]: permMap[module.key] || "none",
      }), {})
    );

    setDialogOpen(true);
  };

  // function to delete the user
  const handleDeleteUser = (user: User) => {
    setSelectedUser(user);
    setDeleteDialogOpen(true);
  };

  const deleteMutation = useMutation({
    mutationFn: deleteCompanyUser,

    onSuccess: () => {
      toast({ title: "Success", description: "User deleted successfully" });
      queryClient.invalidateQueries({ queryKey: ["read-users"] });
      closeDialogAndReset();
    },

    onError: (error: any) => {
      toast({ title: "Error", description: error?.message || "Failed to create user", variant: "destructive" });
    },
  })

  // function to confirm the deletion of user
  const confirmDeleteUser = async () => {
    if (!selectedUser) return;

    try {
      const payload = {
        _id: selectedUser._id
      };

      await deleteMutation.mutateAsync(payload)

    } catch (error: any) {
      console.error("Error deleting user:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to delete user",
        variant: "destructive",
      });
      setDeleteDialogOpen(false);
      setSelectedUser(null);
    }
  };

  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: (payload: any) => createCompanyUser(payload),
    onSuccess: () => {
      toast({ title: "Success", description: "User created successfully" });
      queryClient.invalidateQueries({ queryKey: ["read-users"] });
      closeDialogAndReset();
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error?.message || "Failed to create user", variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: (payload: any) => updateCompanyUser(payload),
    onSuccess: () => {

      toast({ title: "Success", description: "User updated successfully" });
      queryClient.invalidateQueries({ queryKey: ["read-users"] });
      closeDialogAndReset();
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error?.message || "Failed to update user", variant: "destructive" });
    },
  });

  // Helper to reset form & close dialog
  const closeDialogAndReset = () => {
    setDialogOpen(false);
    setSelectedUser(null);
    setNewUserEmail("");
    setNewUserPassword("");
    setNewUserFirstName("");
    setNewUserLastName("");
    setNewUserRole("user");
    setModulePermissions(MODULES.reduce((acc, m) => ({ ...acc, [m]: "none" }), {}));
    setCompanySettingsPermissions(COMPANY_SETTINGS_MODULES.reduce((acc, m) => ({ ...acc, [m.key]: "none" }), {}));
    setDashboardPermissions(DASHBOARD_MODULES.reduce((acc, m) => ({ ...acc, [m.key]: "none" }), {}));
  };

  // ADD THIS FUNCTION (before handleSaveUser)
  const transformPermissionsToArray = () => {
    const perms: any[] = [];

    // Main modules: Affiliates, Customers, etc.
    Object.entries(modulePermissions).forEach(([module, level]) => {
      if (level !== "none") {
        perms.push({
          module: module.toLowerCase(), // "Affiliates" → "affiliates"
          section: "module_permissions",
          permission: level,
        });
      }
    });

    // Company Settings: company_settings_company → company
    const companyMap: Record<string, string> = {
      company_settings_company: "company",
      company_settings_users: "users",
      company_settings_compensation: "compensation",
      company_settings_integrations: "integrations",
      company_settings_social_media: "social_media",
      company_settings_announcements: "announcements",
      company_settings_deleted_folder: "deleted_folder",
    };

    Object.entries(companySettingsPermissions).forEach(([key, level]) => {
      if (level !== "none") {
        const module = companyMap[key];
        if (module) {
          perms.push({
            module,
            section: "company_settings_permissions",
            permission: level,
          });
        }
      }
    });

    // Dashboard permissions (if you save them — optional)
    // Add similar logic if needed

    return perms;
  };

  const transformPermissionsToArray2 = (): Array<{
    module: string;
    section: string;
    permission: "none" | "view" | "edit";
  }> => {
    const perms: any = [];
    // const perms: Array<{
    //   module: string;
    //   section: string;
    //   permission: "none" | "view" | "edit";
    // }> = [];

    // ──────────────────────────────────────────────
    // 1. Main Modules (Affiliates, Customers, etc.)
    // ──────────────────────────────────────────────
    const mainModules = Object.keys(modulePermissions); // e.g. ["Affiliates", "Customers", ...]

    mainModules.forEach((module) => {
      const level = modulePermissions[module as keyof typeof modulePermissions];
      perms.push({
        module: module.toLowerCase(),               // "Affiliates" → "affiliates"
        section: "module_permissions",
        permission: level,                          // will be "none" | "view" | "edit"
      });
    });

    // console.log("perms are ", perms);

    // ──────────────────────────────────────────────
    // 2. Company Settings Permissions
    // ──────────────────────────────────────────────
    const companyMap: Record<string, string> = {
      company_settings_company: "company",
      company_settings_users: "users",
      company_settings_compensation: "compensation",
      company_settings_integrations: "integrations",
      company_settings_social_media: "social_media",
      company_settings_announcements: "announcements",
      company_settings_deleted_folder: "deleted_folder",
    };

    Object.entries(companySettingsPermissions).forEach(([key, level]) => {
      const module = companyMap[key];
      if (module) {
        perms.push({
          module,
          section: "company_settings_permissions",
          permission: level,                        // will be "none" | "view" | "edit"
        });
      }
    });

    // console.log("perms 2 are ", perms);

    // If you have more sections (e.g. dashboard permissions), add them here the same way
    // ──────────────────────────────────────────────
    // 3. Dashboard Module Permissions
    // ──────────────────────────────────────────────

    const dashboardMap: Record<string, string> = {
      impersonate_top_company: "impersonate_top_company",
      view_analytics_overview: "view_analytics_overview",
      view_affiliate_analytics: "view_affiliate_analytics",
      view_affiliate_leaderboard: "view_affiliate_leaderboard",
      view_customer_insights: "view_customer_insights"
    }

    Object.entries(dashboardPermissions).forEach(([key, level]) => {
      const module = dashboardMap[key];
      if (module) {
        perms.push({
          module,
          section: "dashboard_module_permissions",
          permission: level,                        // will be "none" | "view" | "edit"
        });
      }
    });

    // console.log("perms 3 are ", perms);

    return perms;
  };

  // function to confirm the creation/updation of new user
  // REPLACE YOUR WHOLE handleSaveUser FUNCTION WITH THIS
  const handleSaveUser = async () => {
    if (!newUserEmail.trim()) {
      toast({ title: "Error", description: "Email is required", variant: "destructive" });
      return;
    }

    const permissionsArray = transformPermissionsToArray2();

    const roleObj = allowedRolesData.find(item => item.role === newUserRole);
    const correspondingRoleId = roleObj?._id || "";

    const payload: any = {
      email: newUserEmail.trim(),
      firstName: newUserFirstName.trim(),
      lastName: newUserLastName.trim(),
      roleId: correspondingRoleId, // your backend expects roleId as string
      permissions: permissionsArray,
    };

    if(selectedUser && selectedUser.email === payload.email) delete payload.email;

    // CREATE NEW USER
    if (!selectedUser) {
      if (!newUserPassword || newUserPassword.length < 6) {
        toast({ title: "Error", description: "Password must be at least 6 characters", variant: "destructive" });
        return;
      }

      payload.password = newUserPassword;

      // console.log("create payload is ", payload);

      await createMutation.mutateAsync(payload);
      return;
    }

    // UPDATE EXISTING USER
    const updatePayload: any = {
      _id: selectedUser._id,
      ...payload,
    };

    if (newUserPassword && newUserPassword.length >= 6) {
      updatePayload.password = newUserPassword;
    }

    // console.log("update payload is ", updatePayload);

    await updateMutation.mutateAsync(updatePayload);

  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">User Management</h3>

        {/* Create and Update Users */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          {canEditUsers && (
            <DialogTrigger asChild>
              <Button onClick={() => {
                setSelectedUser(null);
                setNewUserEmail("");
                setNewUserPassword("");
                setNewUserFirstName("");
                setNewUserLastName("");
                setNewUserRole("user");
                setShowPassword(false);
                setModulePermissions(
                  MODULES.reduce((acc, module) => ({ ...acc, [module]: "none" }), {})
                );
                setCompanySettingsPermissions(
                  COMPANY_SETTINGS_MODULES.reduce((acc, module) => ({ ...acc, [module.key]: "none" }), {})
                );
                setDashboardPermissions(
                  DASHBOARD_MODULES.reduce((acc, module) => ({ ...acc, [module.key]: "none" }), {})
                );
              }}>
                <Plus className="mr-2 h-4 w-4" />
                Add User
              </Button>
            </DialogTrigger>
          )}
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {selectedUser
                  ? (canEditUsers ? "Edit User" : "View User")
                  : "Invite User"}
              </DialogTitle>
              <DialogDescription>
                {selectedUser
                  ? (canEditUsers
                    ? "Update user role and module permissions"
                    : "View user role and module permissions")
                  : "Send an invitation to a new user"}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6 py-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>First Name</Label>
                  <Input
                    type="text"
                    value={newUserFirstName}
                    onChange={(e) => setNewUserFirstName(e.target.value)}
                    placeholder="First name"
                    disabled={!canEditUsers}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Last Name</Label>
                  <Input
                    type="text"
                    value={newUserLastName}
                    onChange={(e) => setNewUserLastName(e.target.value)}
                    placeholder="Last name"
                    disabled={!canEditUsers}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input
                    type="email"
                    value={newUserEmail}
                    onChange={(e) => setNewUserEmail(e.target.value)}
                    placeholder="user@example.com"
                    disabled={!canEditUsers}
                  />
                </div>
                {canEditUsers && (
                  <div className="space-y-2">
                    <Label>{selectedUser ? "New Password (optional)" : "Temporary Password"}</Label>
                    <Input
                      type="password"
                      value={newUserPassword}
                      onChange={(e) => setNewUserPassword(e.target.value)}
                      placeholder={selectedUser ? "Leave blank to keep current password" : "Minimum 6 characters"}
                      minLength={6}
                    />
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label>Role</Label>
                <Select value={newUserRole} onValueChange={setNewUserRole} disabled={!canEditUsers}>
                  <SelectTrigger disabled={!canEditUsers}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {allowedRoles && Array.isArray(allowedRoles) && allowedRoles.map((item) => (
                      <SelectItem key={item._id} value={item.role} disabled={item.role === "super_admin" && !isSuperAdmin}>
                        {item.roleLabel}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-3 pt-2">
                <Label className="text-base font-semibold">Module Permissions</Label>
                {MODULES.map((module) => (
                  <div key={module} className="flex items-center justify-between">
                    <span className="text-sm">{module}</span>
                    <Select
                      value={modulePermissions[module]}
                      onValueChange={(value) => setModulePermissions({ ...modulePermissions, [module]: value })}
                      disabled={!canEditUsers}
                    >
                      <SelectTrigger className="w-32" disabled={!canEditUsers}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {PERMISSION_LEVELS.map((level) => (
                          <SelectItem key={level} value={level}>
                            {level.charAt(0).toUpperCase() + level.slice(1)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                ))}
              </div>

              <div className="space-y-3 pt-4 border-t">
                <Label className="text-base font-semibold">Company Settings Permissions</Label>
                {COMPANY_SETTINGS_MODULES.map((module) => (
                  <div key={module.key} className="flex items-center justify-between">
                    <span className="text-sm">{module.label}</span>
                    <Select
                      value={companySettingsPermissions[module.key]}
                      onValueChange={(value) => setCompanySettingsPermissions({ ...companySettingsPermissions, [module.key]: value })}
                      disabled={!canEditUsers}
                    >
                      <SelectTrigger className="w-32" disabled={!canEditUsers}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {PERMISSION_LEVELS.map((level) => (
                          <SelectItem key={level} value={level}>
                            {level.charAt(0).toUpperCase() + level.slice(1)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                ))}
              </div>

              {(newUserRole === "super_admin" || newUserRole === "admin") && (
                <div className="space-y-3 pt-4 border-t">
                  <Label className="text-base font-semibold">Dashboard Module Permissions</Label>
                  {DASHBOARD_MODULES.map((module) => (
                    <div key={module.key} className="flex items-center justify-between">
                      <span className="text-sm">{module.label}</span>
                      <Select
                        value={dashboardPermissions[module.key]}
                        onValueChange={(value) => setDashboardPermissions({ ...dashboardPermissions, [module.key]: value })}
                        disabled={!canEditUsers}
                      >
                        <SelectTrigger className="w-32" disabled={!canEditUsers}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {/* <SelectItem value="none">None</SelectItem>
                          <SelectItem value="view">View</SelectItem>
                          <SelectItem value="edit">Edit</SelectItem> */}
                          {PERMISSION_LEVELS.map((level) => (
                            <SelectItem key={level} value={level}>
                              {level.charAt(0).toUpperCase() + level.slice(1)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={() => setDialogOpen(false)}>
                  {canEditUsers ? "Cancel" : "Close"}
                </Button>
                {canEditUsers && (
                  <Button
                    onClick={handleSaveUser}
                    disabled={createMutation.isPending || updateMutation.isPending}
                  >
                    {createMutation.isPending || updateMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : selectedUser ? (
                      "Save Changes"
                    ) : (
                      "Save"
                      // "Send Invite"
                    )}
                  </Button>
                )}
              </div>
            </div>
          </DialogContent>
        </Dialog>

      </div>

      {/* Desktop Table View */}
      <div className="hidden md:block border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((user) => (
              <TableRow key={user._id}>
                <TableCell>
                  {user.firstName} {user.lastName}
                </TableCell>
                <TableCell>{user.email}</TableCell>
                {/* <TableCell className="capitalize">{user.role || "user"}</TableCell> */}
                <TableCell className="capitalize">{user.role.includes("_") ? user.role.split("_").map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join(" ") : user.role || "user"}</TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEditUser(user)}
                      title={canEditUsers ? "Edit user" : "View user"}
                    >
                      {canEditUsers ? <Pencil className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                    {canEditUsers && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteUser(user)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Mobile Card View */}
      <div className="md:hidden space-y-4">
        {users.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No users found
          </div>
        ) : (
          users.map((user) => (
            <div key={user._id} className="border rounded-lg p-4 space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium">
                    {user.firstName} {user.lastName}
                  </h4>
                  <p className="text-sm text-muted-foreground truncate mt-1">
                    {user.email}
                  </p>
                  <p className="text-sm text-muted-foreground capitalize mt-1">
                    Role: {user.role || "user"}
                  </p>
                </div>
              </div>
              <div className="flex gap-2 pt-2 border-t">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleEditUser(user)}
                  className="flex-1"
                >
                  {canEditUsers ? (
                    <>
                      <Pencil className="h-4 w-4 mr-2" />
                      Edit
                    </>
                  ) : (
                    <>
                      <Eye className="h-4 w-4 mr-2" />
                      View
                    </>
                  )}
                </Button>
                {canEditUsers && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDeleteUser(user)}
                    className="flex-1"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </Button>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove the user's role and permissions. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeleteUser}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
