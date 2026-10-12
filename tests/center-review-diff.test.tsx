import { describe, expect, test } from "bun:test";
import { renderToString } from "react-dom/server";

import { CenterReviewDiff } from "@/components/admin/center-review-diff";
import type { AdminCenterDetail } from "@/lib/admin-api";

function renderDiff(publishedSections: unknown, draftSections: unknown) {
  const base = { name: "Plaza 15 de Mayo" };
  const detail = {
    published: { ...base, sections: publishedSections },
    draft: { ...base, sections: draftSections },
  } as unknown as AdminCenterDetail;
  return renderToString(<CenterReviewDiff detail={detail} catalogs={null} />);
}

describe("CenterReviewDiff", () => {
  test("lista un apartado nuevo con etiquetas en español y sin vacíos", () => {
    const html = renderDiff(
      {},
      {
        conservacion: {
          conservation: {
            attraction: { state: "ALTERADO", observation: "" },
            environment: { state: null, observation: "" },
          },
          factors: [{ component: "ATRACTIVO" }],
        },
      },
    );

    expect(html).toContain("Agregado");
    expect(html).toContain("no existía en la versión publicada");
    expect(html).toContain("Estado de conservación · Atractivo · Estado");
    expect(html).toContain("Alterado");
    expect(html).toContain("Factor 1 · Componente");
    expect(html).not.toContain("Conservation");
    expect(html).not.toContain("Texto vacío");
    expect(html).not.toContain("Sin dato en esta versión");
    expect(html).not.toContain("Environment");
  });

  test("no marca como cambio pasar de sin dato a texto vacío", () => {
    const html = renderDiff(
      { conservacion: { conservation: { attraction: { observation: null } } } },
      { conservacion: { conservation: { attraction: { observation: "" } } } },
    );

    expect(html).toContain("no tiene diferencias");
  });
});
