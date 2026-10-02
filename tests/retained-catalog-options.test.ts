import { describe, expect, it } from "bun:test";

import { withRetainedCatalogOption } from "../src/lib/retained-catalog-options";

describe("referencias anteriores de catálogo", () => {
  it("conserva el ID y nombre enviados a la API y distingue la opción retirada", () => {
    const options = withRetainedCatalogOption([{ id: 1, name: "Vigente" }], {
      id: 2,
      name: "1 estrella",
      displayName: "Una estrella",
      classificationId: 3,
    });

    expect(options[1]).toEqual({
      id: 2,
      name: "1 estrella",
      displayName: "Una estrella (ya no disponible)",
      classificationId: 3,
      active: false,
      disabled: true,
    });
    expect(options.filter((option) => option.classificationId === 4)).toEqual([]);
  });

  it("no añade referencias históricas al crear ni duplica opciones vigentes", () => {
    const available = [{ id: 1, name: "Vigente" }];
    expect(withRetainedCatalogOption(available, null)).toEqual(available);
    expect(withRetainedCatalogOption(available, { id: 1, name: "Anterior" })).toEqual(
      available,
    );
    expect(available).toEqual([{ id: 1, name: "Vigente" }]);
  });
});
