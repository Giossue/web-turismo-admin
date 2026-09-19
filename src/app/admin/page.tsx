import { AdminShell } from "@/components/admin/admin-shell";
import { AdminProviders } from "@/components/admin/admin-providers";
import { AdminAuthProvider } from "@/lib/auth";

export const metadata = {
  title: "Panel institucional | Turismo Vinculación",
  robots: { index: false, follow: false },
};

export default function AdminPage() {
  return (
    <AdminProviders>
      <AdminAuthProvider>
        <AdminShell />
      </AdminAuthProvider>
    </AdminProviders>
  );
}
