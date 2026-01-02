import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, UserPlus } from "lucide-react";

interface AdminToCreate {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
}

const defaultAdmins: AdminToCreate[] = [
  {
    firstName: "Ashley",
    lastName: "Lewis",
    email: "Ashley@theonglobal.com",
    password: "Change2025$"
  },
  {
    firstName: "Brittney",
    lastName: "Hamblin",
    email: "support@theonglobal.com",
    password: "Change2025$"
  }
];

export default function AddAdmins() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [admins, setAdmins] = useState<AdminToCreate[]>(defaultAdmins);

  const updateAdmin = (index: number, field: keyof AdminToCreate, value: string) => {
    const updated = [...admins];
    updated[index] = { ...updated[index], [field]: value };
    setAdmins(updated);
  };

  const createAdmins = async () => {
    try {
      setLoading(true);
      
      for (const admin of admins) {
        if (!admin.email || !admin.password || !admin.firstName || !admin.lastName) {
          toast.error(`Please fill in all fields for ${admin.firstName || 'admin'}`);
          continue;
        }

        const { data, error } = await supabase.functions.invoke('admin-user-management', {
          body: {
            email: admin.email,
            password: admin.password,
            firstName: admin.firstName,
            lastName: admin.lastName,
            role: 'admin'
          }
        });

        if (error) {
          console.error('Error creating admin:', error);
          toast.error(`Failed to create admin: ${admin.email}`);
        } else {
          toast.success(`Successfully created admin: ${admin.email}`);
        }
      }

      toast.success("All admins have been processed. Redirecting to dashboard...");
      setTimeout(() => {
        navigate("/");
      }, 2000);
      
    } catch (error: any) {
      console.error('Error in admin creation:', error);
      toast.error(error.message || "Failed to create admins");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserPlus className="h-6 w-6" />
            Add Admin Users
          </CardTitle>
          <CardDescription>
            Create new administrator accounts for the system
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {admins.map((admin, index) => (
            <div key={index} className="border rounded-lg p-4 space-y-4">
              <h3 className="font-semibold text-lg">Admin {index + 1}</h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor={`firstName-${index}`}>First Name</Label>
                  <Input
                    id={`firstName-${index}`}
                    value={admin.firstName}
                    onChange={(e) => updateAdmin(index, 'firstName', e.target.value)}
                    placeholder="First name"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor={`lastName-${index}`}>Last Name</Label>
                  <Input
                    id={`lastName-${index}`}
                    value={admin.lastName}
                    onChange={(e) => updateAdmin(index, 'lastName', e.target.value)}
                    placeholder="Last name"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor={`email-${index}`}>Email Address</Label>
                <Input
                  id={`email-${index}`}
                  type="email"
                  value={admin.email}
                  onChange={(e) => updateAdmin(index, 'email', e.target.value)}
                  placeholder="email@example.com"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor={`password-${index}`}>Temporary Password</Label>
                <Input
                  id={`password-${index}`}
                  type="password"
                  value={admin.password}
                  onChange={(e) => updateAdmin(index, 'password', e.target.value)}
                  placeholder="Temporary password"
                />
                <p className="text-xs text-muted-foreground">
                  Users should change this password after first login
                </p>
              </div>
            </div>
          ))}

          <div className="flex gap-3">
            <Button 
              onClick={createAdmins} 
              disabled={loading}
              className="flex-1"
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create Admin Accounts
            </Button>
            <Button 
              variant="outline" 
              onClick={() => navigate("/")}
              disabled={loading}
            >
              Cancel
            </Button>
          </div>

          <div className="bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
            <p className="text-sm text-yellow-800 dark:text-yellow-200">
              <strong>Important:</strong> These accounts will be created with the temporary password shown above. 
              Make sure to securely share these credentials with the new admins and instruct them to change 
              their passwords immediately after first login.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
