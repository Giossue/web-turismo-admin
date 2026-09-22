import { describe, expect, test } from "bun:test";
import { renderToString } from "react-dom/server";
import { useForm } from "react-hook-form";

import { EditableContext } from "@/components/ui/form/editable-context";
import {
  RhfCatalogSelect,
  RhfResponseSelect,
  RhfSelect,
} from "@/components/ui/form/rhf-select";
import { RhfNumberField, RhfTextField } from "@/components/ui/form/rhf-text-field";

type Values = {
  response: string;
  kind: string;
  catalogId: string;
  name: string;
  year: string;
};

function Fields({ editable = true }: { editable?: boolean }) {
  const { control } = useForm<Values>({
    defaultValues: {
      response: "NO",
      kind: "B",
      catalogId: "2",
      name: "Hola",
      year: "2020",
    },
  });
  return (
    <EditableContext value={editable}>
      <RhfResponseSelect control={control} name="response" id="response" />
      <RhfSelect
        control={control}
        name="kind"
        label="Tipo"
        options={[
          { value: "A", label: "Alfa" },
          { value: "B", label: "Beta" },
        ]}
      />
      <RhfCatalogSelect
        control={control}
        name="catalogId"
        label="Catálogo"
        options={[
          { id: 1, name: "Uno" },
          { id: 2, name: "Dos" },
        ]}
      />
      <RhfTextField control={control} name="name" label="Nombre" />
      <RhfNumberField
        control={control}
        name="year"
        label="Año"
        integer
        min={1900}
        max={2200}
      />
    </EditableContext>
  );
}

describe("campos conectados a react-hook-form", () => {
  test("los selectores muestran el valor del formulario", () => {
    const html = renderToString(<Fields />);
    expect(html).toContain(">No<");
    expect(html).toContain(">Beta<");
    expect(html).toContain(">Dos<");
    expect(html).toContain('value="Hola"');
  });

  test("la etiqueta queda asociada al selector", () => {
    const html = renderToString(<Fields />);
    expect(html).toContain('id="response-label"');
    expect(html).toContain('aria-labelledby="response-label');
  });

  test("el campo numérico genera los atributos HTML desde sus límites", () => {
    const html = renderToString(<Fields />);
    expect(html).toContain('min="1900"');
    expect(html).toContain('max="2200"');
    expect(html).toContain('step="1"');
  });

  test("EditableContext deshabilita los campos", () => {
    const editable = renderToString(<Fields />);
    const readOnly = renderToString(<Fields editable={false} />);
    expect(editable).not.toContain('disabled=""');
    expect(readOnly).toContain('disabled=""');
  });
});
