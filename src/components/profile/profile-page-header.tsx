import { UserMenu } from "@/components/user-menu";

interface ProfilePageHeaderProps {
  title: string;
}

export const ProfilePageHeader = ({ title }: ProfilePageHeaderProps) => {
  return (
    <header className="hidden md:flex h-16 bg-white border-b border-border items-center justify-between px-6 shadow-sm sticky top-0 z-10">
      <h1 className="text-2xl font-bold">{title}</h1>
      <UserMenu />
    </header>
  );
};
