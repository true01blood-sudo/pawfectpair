import { createClient } from "@/lib/supabase/server";
import AppSidebar from "@/components/AppSidebar";
import AppHeader from "@/components/AppHeader";

type Props = {
  children: React.ReactNode;
  mainClassName?: string;
};

export default async function AppShell({ children, mainClassName }: Props) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const userName = (user?.user_metadata?.full_name as string | undefined) ?? user?.email ?? "";
  const avatarUrl = (user?.user_metadata?.avatar_url as string | undefined) ?? null;

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <AppHeader userName={userName} avatarUrl={avatarUrl} />
      <div className="flex-1 flex overflow-hidden min-h-0">
        <AppSidebar />
        <div className={`flex-1 min-h-0 flex flex-col ${mainClassName ?? "overflow-y-auto"}`}>
          {children}
        </div>
      </div>
    </div>
  );
}
