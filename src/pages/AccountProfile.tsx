import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ProfileHeader } from "@/components/profile/profile-header";
import { PersonalInfoForm } from "@/components/profile/personal-info-form";
import { SecurityForm } from "@/components/profile/security-form";
import { ProfilePageHeader } from "@/components/profile/profile-page-header";
import { SocialMediaLinks } from "@/components/social-media-links";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import logoImage from "@/assets/theon-logo.avif";
import { UserMenu } from "@/components/user-menu";
import { useAuthStore } from "@/store/useAuthStore";
import config from "@/config/env";

import type { User } from "@/types/index"

const AccountProfile = () => {

  const { toast } = useToast();

  const { token, user } = useAuthStore();

  const [profile, setProfile] = useState<User | null>(user);

  if (!profile) {
    return (
      <SidebarProvider defaultOpen={true}>
        <div className="min-h-screen flex w-full bg-dashboard-bg">
          <AppSidebar />

          <div className="flex-1 flex flex-col w-full">
            {/* Mobile Header */}
            <header className="md:hidden h-14 flex items-center justify-between gap-3 px-4 border-b border-white/10 sticky top-0 z-10" style={{ backgroundColor: "#1a1f2e" }}>
              <div className="flex items-center gap-3">
                <SidebarTrigger className="text-white hover:bg-white/10" />
                <img src={logoImage} alt="Theon Global" className="h-8 w-auto" />
              </div>
              <UserMenu />
            </header>

            {/* Desktop Header */}
            <div className="hidden md:block">
              <ProfilePageHeader title="Account Profile" />
            </div>

            <main className="flex-1 flex items-center justify-center p-6">
              <div className="text-center">
                <p className="text-muted-foreground">Please log in to view your profile</p>
              </div>
            </main>

            <footer className="px-4 md:px-6 py-4 border-t border-border flex flex-col sm:flex-row items-center justify-center sm:justify-between gap-3">
              <p className="text-sm text-muted-foreground">© {new Date().getFullYear()}, Theon Global</p>
              <SocialMediaLinks />
            </footer>
          </div>
        </div>
      </SidebarProvider>
    );
  }

  return (
    <SidebarProvider defaultOpen={true}>
      <div className="min-h-screen flex w-full bg-dashboard-bg">
        <AppSidebar />

        <div className="flex-1 flex flex-col w-full">
          {/* Mobile Header */}
          <header className="md:hidden h-14 flex items-center justify-between gap-3 px-4 border-b border-white/10 sticky top-0 z-10" style={{ backgroundColor: "#1a1f2e" }}>
            <div className="flex items-center gap-3">
              <SidebarTrigger className="text-white hover:bg-white/10" />
              <img src={logoImage} alt="Theon Global" className="h-8 w-auto" />
            </div>
            <UserMenu />
          </header>

          {/* Desktop Header */}
          <div className="hidden md:block">
            <ProfilePageHeader title="Account Profile" />
          </div>

          <main className="flex-1 p-6 space-y-6">
            <ProfileHeader
              profile={profile}
              onAvatarUpdate={(url) => {
                setProfile((prev) => ({
                  ...prev,
                  profilePictureUrl: !!(url) ? `${config.cloudFrontUrl}profile-pictures${url.split("/profile-pictures")[1]}` : null,
                }));
              }}
            />

            <Tabs defaultValue="personal" className="w-full">
              <TabsList className="grid w-full grid-cols-2 max-w-[400px]">
                <TabsTrigger value="personal">Personal Info</TabsTrigger>
                <TabsTrigger value="security">Security</TabsTrigger>
              </TabsList>

              <TabsContent value="personal" className="mt-6">
                <div className="bg-card border border-border rounded-lg p-6">
                  <PersonalInfoForm
                    profile={profile}
                    onUpdate={(newData) => {
                      setProfile(prev => ({ ...prev!, ...newData }));
                    }}
                  />
                </div>
              </TabsContent>

              <TabsContent value="security" className="mt-6">
                <div className="bg-card border border-border rounded-lg p-6">
                  <SecurityForm />
                </div>
              </TabsContent>
            </Tabs>
          </main>

          <footer className="px-4 md:px-6 py-4 border-t border-border flex flex-col sm:flex-row items-center justify-center sm:justify-between gap-3">
            <p className="text-sm text-muted-foreground">© {new Date().getFullYear()}, Theon Global</p>
            <SocialMediaLinks />
          </footer>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default AccountProfile;
