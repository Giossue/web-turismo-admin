import { describe, expect, test } from "bun:test";
import { renderToString } from "react-dom/server";

import { RecordActionsMenu } from "@/components/admin/record-actions-menu";
import { AdminDataGrid } from "@/components/ui/admin-data-grid";

function render(updating: boolean, actionsDisabled: boolean) {
  return renderToString(
    <AdminDataGrid
      ariaLabel="Registros"
      rows={[{ id: 1, name: "Registro anterior" }]}
      columns={[{ field: "name", headerName: "Nombre" }]}
      error={null}
      emptyMessage="Sin registros"
      pagination={{ page: 0, total: 40, onPageChange: () => {} }}
      updating={updating}
      actionsDisabled={actionsDisabled}
      onRefresh={() => {}}
      mobileCard={(row) => ({
        title: row.name,
        primaryAction: { label: "Editar registro", onClick: () => {} },
        actions: (
          <RecordActionsMenu
            subject={row.name}
            actions={[{ label: "Editar", icon: <span />, onClick: () => {} }]}
          />
        ),
      })}
    />,
  );
}

describe("estado de actualización del listado", () => {
  test("conserva las tarjetas anteriores e indica actualización accesible", () => {
    const html = render(true, true);
    expect(html).toContain("Registro anterior");
    expect(html).toContain("Actualizando datos");
    expect(html).toContain('aria-busy="true"');
    expect(html).toContain('role="status"');
    expect(html).toContain("de 40");
  });

  test("bloquea el menú y la acción primaria de las tarjetas anteriores", () => {
    const html = render(true, true);
    expect(html).toMatch(/<button[^>]*disabled[^>]*>Editar registro<\/button>/);
    expect(html).toMatch(
      /<button(?=[^>]*aria-label="Acciones de Registro anterior")[^>]*disabled[^>]*>/,
    );
  });

  test("una recarga del mismo filtro conserva las acciones de sus filas", () => {
    const html = render(true, false);
    expect(html).toMatch(/<button(?![^>]*disabled)[^>]*>Editar registro<\/button>/);
    expect(html).toMatch(
      /<button(?=[^>]*aria-label="Acciones de Registro anterior")(?![^>]*disabled)[^>]*>/,
    );
  });
});
