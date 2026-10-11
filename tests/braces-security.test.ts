import { describe, expect, test } from "bun:test";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const braces = require("braces");
describe("parche GHSA-vfj7-8cjw-p6xm", () => {
  test("conserva la expansión y compilación de patrones habituales", () => {
    expect(braces.expand("src/{app,lib}/**/*.{ts,tsx}")).toEqual([
      "src/app/**/*.ts",
      "src/app/**/*.tsx",
      "src/lib/**/*.ts",
      "src/lib/**/*.tsx",
    ]);
    expect(braces.compile("{a,b}")).toBe("(a|b)");
    expect(braces.stringify("{a,b}")).toBe("{a,b}");
  });
  for (const method of ["parse", "compile", "expand", "stringify"])
    test(`${method} limita patrones profundamente anidados`, () => {
      expect(() => braces[method]("{".repeat(4000) + "a,b" + "}".repeat(4000))).toThrow(
        "safe limit",
      );
      expect(() => braces[method]("(".repeat(4000) + "a" + ")".repeat(4000))).toThrow(
        "safe limit",
      );
      expect(() => braces[method]("{".repeat(4000) + "a")).toThrow("safe limit");
    });
  for (const method of ["compile", "expand", "stringify"])
    test(`${method} también valida un AST proporcionado directamente`, () => {
      let ast: { type: string; nodes: unknown[] } = { type: "root", nodes: [] };
      for (let i = 0; i < 4000; i++) ast = { type: "root", nodes: [ast] };
      expect(() => braces[method](ast)).toThrow("safe limit");
    });
});
