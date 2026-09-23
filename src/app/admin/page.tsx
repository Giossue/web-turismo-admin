import { Suspense } from "react";

import { AdminSessionLoading, AdminShell } from "@/components/admin/admin-shell";
import { AdminProviders } from "@/components/admin/admin-providers";
import { AdminAuthProvider } from "@/lib/auth";

export const metadata = {
  title: "Panel institucional | Turismo Vinculación",
  robots: { index: false, follow: false },
};

// `AdminAuthProvider` va dentro de `AdminProviders`: vacía la caché de consultas al
// cerrar sesión o cambiar de cuenta.
export default function AdminPage() {
  return (
    <AdminProviders>
      <AdminAuthProvider>
        {/* El panel lee su estado de la URL con `useSearchParams`, que en una
            página prerenderizada requiere un límite de Suspense. */}
        <Suspense fallback={<AdminSessionLoading />}>
          <AdminShell />
        </Suspense>
      </AdminAuthProvider>
    </AdminProviders>
  );
}
