import { Construction } from "lucide-react";

export function SmsTab() {
  return (
    <div className="flex items-center justify-center p-12">
      <div className="text-center space-y-4">
        <Construction className="h-24 w-24 text-muted-foreground mx-auto" />
        <h3 className="text-2xl font-bold text-foreground">Coming Soon</h3>
        <p className="text-muted-foreground max-w-md">
          SMS template management is currently under development. Check back soon for updates.
        </p>
      </div>
    </div>
  );
}
