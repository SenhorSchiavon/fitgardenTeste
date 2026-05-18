import { Sidebar } from "@/components/sidebar";
import { AuthGuard } from "@/components/auth-guard";

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthGuard>
      <div className="flex h-screen overflow-hidden bg-background" suppressHydrationWarning> 
        <Sidebar className="w-64 flex-col h-full shrink-0" />
        <div className="relative flex-1 flex flex-col overflow-hidden">
          <div className="pointer-events-none absolute right-8 top-6 hidden h-20 w-80 opacity-[0.045] lg:block">
            <img src="/brand/fitgarden-horizontal.png" alt="" className="h-full w-full object-contain object-right" />
          </div>
          <main className="relative flex-1 overflow-y-auto p-6">{children}</main>
        </div>
      </div>
    </AuthGuard>
  );
}
