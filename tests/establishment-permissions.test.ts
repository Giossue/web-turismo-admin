import { describe, expect, it } from "bun:test";

import { canDeleteEstablishment } from "../src/lib/establishment-permissions";

describe("canDeleteEstablishment", () => {
  it("lets the administrator delete any catastro in any state", () => {
    expect(
      canDeleteEstablishment({ editable: false, reviewStatus: "EN_REVISION" }, true),
    ).toBe(true);
  });

  it.each(["BORRADOR", "RECHAZADO", "PUBLICADO"])(
    "lets an agent delete their own %s catastro",
    (reviewStatus) => {
      expect(canDeleteEstablishment({ editable: true, reviewStatus }, false)).toBe(true);
    },
  );

  it("treats a catastro without the editable flag as the agent's own", () => {
    expect(canDeleteEstablishment({ reviewStatus: "BORRADOR" }, false)).toBe(true);
  });

  it("does not let an agent delete someone else's catastro", () => {
    expect(
      canDeleteEstablishment({ editable: false, reviewStatus: "PUBLICADO" }, false),
    ).toBe(false);
  });

  it("does not let an agent delete a catastro under review", () => {
    expect(
      canDeleteEstablishment({ editable: true, reviewStatus: "EN_REVISION" }, false),
    ).toBe(false);
  });
});
