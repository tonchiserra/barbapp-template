import { ToastProvider } from "@/components/ui";
import { requireAuth } from "@/lib/auth";
import { AdminShell } from "./admin-shell";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requireAuth();

  return (
    <ToastProvider>
      <AdminShell session={session}>{children}</AdminShell>
    </ToastProvider>
  );
}
