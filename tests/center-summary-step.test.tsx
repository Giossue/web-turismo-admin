import { describe, expect, it } from "bun:test";
import { renderToString } from "react-dom/server";

import { CenterSummaryStep } from "@/components/admin/center-editor/center-summary-step";
import type { AdminCenterDetail } from "@/lib/admin-api";

function detail(status: string, sections: string[]): AdminCenterDetail {
  return {
    code: "020101MC010400012",
    status: { code: status, name: status },
    draft: {
      name: "Plaza 15 de Mayo",
      sections: Object.fromEntries(sections.map((code) => [code, { schemaVersion: 1 }])),
    },
    published: null,
    review: null,
  } as unknown as AdminCenterDetail;
}

/** React separa los textos interpolados con comentarios; se quitan para comparar. */
const text = (html: string) => html.replace(/<!-- -->/g, "");

describe("CenterSummaryStep", () => {
  it("marca con visto lo completo y con alto lo que falta", () => {
    const html = renderToString(
      <CenterSummaryStep
        detail={detail("BORRADOR", ["caracteristicas"])}
        catalogs={null}
      />,
    );

    expect(html).toContain("<title>Completo</title>");
    expect(html).toContain("<title>Falta completar</title>");
    expect(text(html)).toContain("1 de 14 apartados");
  });

  it("cuenta como completos los apartados importados que aún se guardan", () => {
    const html = renderToString(
      <CenterSummaryStep
        detail={detail("BORRADOR", [])}
        catalogs={null}
        importingSections={["caracteristicas", "planta"]}
      />,
    );

    expect(text(html)).toContain("2 de 14 apartados");
    expect(html).not.toContain("Revisión por diferencias");
  });
});
