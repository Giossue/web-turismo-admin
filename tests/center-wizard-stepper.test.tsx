import { describe, expect, it } from "bun:test";
import { renderToString } from "react-dom/server";

import { CenterWizardStepper } from "@/components/admin/center-editor/center-wizard-stepper";

const steps = [
  { key: "a", title: "Primero" },
  { key: "b", title: "Segundo" },
  { key: "verificacion", title: "Verificación" },
];

const text = (html: string) => html.replace(/<!-- -->/g, "");

describe("CenterWizardStepper", () => {
  it("muestra la verificación como último paso numerado", () => {
    const html = text(
      renderToString(
        <CenterWizardStepper
          steps={steps}
          activeStep={0}
          completedKeys={new Set(["a"])}
          onSelect={() => undefined}
        />,
      ),
    );

    expect(html).toContain("Sección 3: Verificación (pendiente)");
    expect(html).toContain("Paso 1 de 3");
  });

  it("marca la verificación como actual al llegar al resumen", () => {
    const html = text(
      renderToString(
        <CenterWizardStepper
          steps={steps}
          activeStep={2}
          completedKeys={new Set(["a", "b"])}
          onSelect={() => undefined}
        />,
      ),
    );

    expect(html).toContain("Sección 3: Verificación (actual)");
    expect(html).toContain("Paso 3 de 3");
  });
});
