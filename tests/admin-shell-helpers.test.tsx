import { describe, expect, test } from "bun:test";
import { renderToString } from "react-dom/server";

import { clampRating } from "@/components/admin/opinion-management";
import { DetailList } from "@/components/ui/detail-list";
import { canOperatePanel, isAdministrator, type AdminUser } from "@/lib/auth";

function user(roles: AdminUser["roles"]): AdminUser {
  return { id: 1, name: "Ana", email: "ana@ejemplo.ec", roles };
}

describe("roles del panel", () => {
  test("administradores y agentes turísticos pueden operar el panel", () => {
    expect(canOperatePanel(user(["ADMINISTRADOR"]))).toBe(true);
    expect(canOperatePanel(user(["AGENTE_TURISTICO"]))).toBe(true);
    expect(canOperatePanel(user(["TURISTA"]))).toBe(false);
    expect(canOperatePanel(null)).toBe(false);
  });

  test("solo el rol ADMINISTRADOR administra", () => {
    expect(isAdministrator(user(["AGENTE_TURISTICO", "ADMINISTRADOR"]))).toBe(true);
    expect(isAdministrator(user(["AGENTE_TURISTICO"]))).toBe(false);
    expect(isAdministrator(null)).toBe(false);
  });
});

describe("clampRating", () => {
  test("acota la calificación a un entero entre 0 y 5", () => {
    expect(clampRating(4)).toBe(4);
    expect(clampRating(7)).toBe(5);
    expect(clampRating(-1)).toBe(0);
    expect(clampRating(3.6)).toBe(4);
    expect(clampRating(Number.NaN)).toBe(0);
  });
});

describe("DetailList", () => {
  test("renderiza pares etiqueta/valor como lista de definiciones", () => {
    const html = renderToString(
      <DetailList
        items={[
          { label: "Nombre", value: "Ana" },
          { label: "Correo", value: "ana@ejemplo.ec" },
        ]}
      />,
    );
    expect(html).toContain("<dl");
    expect(html).toMatch(/<dt[^>]*>Nombre<!-- -->:<\/dt>/);
    expect(html).toMatch(/<dd[^>]*>Ana<\/dd>/);
    expect(html.match(/<dt/g)).toHaveLength(2);
  });
});
