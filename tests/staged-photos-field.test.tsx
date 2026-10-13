import { describe, expect, it } from "bun:test";
import { renderToString } from "react-dom/server";

import {
  emptyStagedPhotos,
  StagedPhotosField,
} from "@/components/admin/staged-photos-field";

describe("StagedPhotosField", () => {
  it("ofrece elegir fotos al crear y no pide descripción hasta que haya fotos", () => {
    const html = renderToString(
      <StagedPhotosField value={emptyStagedPhotos} onChange={() => undefined} />,
    );

    expect(html).toContain("Fotografías del establecimiento");
    expect(html).toContain("Elegir fotografías");
    expect(html).toContain("Se suben al guardar");
    expect(html).not.toContain("Autor o fuente");
  });

  it("bloquea el botón mientras se guarda", () => {
    const html = renderToString(
      <StagedPhotosField value={emptyStagedPhotos} onChange={() => undefined} disabled />,
    );

    expect(html).toMatch(/<button[^>]*disabled[^>]*>.*Elegir fotografías/s);
  });
});
