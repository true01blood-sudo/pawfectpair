import AppSidebar from "@/components/AppSidebar";

export default function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="h-full flex overflow-hidden">
      <AppSidebar />
      <div className="flex-1 overflow-y-auto min-h-0 flex flex-col">
        {children}
      </div>
    </div>
  );
}
