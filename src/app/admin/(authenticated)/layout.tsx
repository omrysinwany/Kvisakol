
import { AdminHeader } from '@/components/admin/admin-header';
import { AdminSidebarNav } from '@/components/admin/admin-sidebar-nav';
import { AppLogo } from '@/components/shared/app-logo';

export default function AdminAuthenticatedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // In a real app, add authentication check here and redirect if not authenticated.
  // For now, we assume the user is authenticated.

  return (
    <div className="grid min-h-screen w-full md:grid-cols-[220px_1fr] lg:grid-cols-[280px_1fr]">
      <aside className="hidden border-r bg-muted/40 md:block">
        <div className="flex h-full max-h-screen flex-col gap-2">
          <div className="flex h-16 items-center border-b px-4 lg:px-6">
            <AppLogo />
          </div>
          <div className="flex-1">
            <AdminSidebarNav />
          </div>
          {/* Optional: Sidebar footer content */}
          {/* <div className="mt-auto p-4">
            <p className="text-xs text-muted-foreground">&copy; K'Viskal Admin</p>
          </div> */}
        </div>
      </aside>
      <div className="flex flex-col overflow-x-hidden"> {/* Added overflow-x-hidden here */}
        <AdminHeader />
        <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6 bg-muted/20">
          {children}
        </main>
      </div>
    </div>
  );
}
