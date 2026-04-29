import { AdminAuthGuard } from "@/components/admin/admin-auth-guard";
import { AdminShell } from "@/components/admin/admin-shell";

export default function ProtectedAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AdminAuthGuard>
      <AdminShell>{children}</AdminShell>
    </AdminAuthGuard>
  );
}
