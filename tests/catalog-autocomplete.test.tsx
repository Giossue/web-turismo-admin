import { describe, expect, mock, test } from "bun:test";
import { renderToString } from "react-dom/server";
import { useForm } from "react-hook-form";

import {
  CatalogAutocomplete,
  filterCatalogOptions,
} from "@/components/ui/catalog-autocomplete";
import { EditableContext } from "@/components/ui/form/editable-context";
import { RhfCatalogSelect } from "@/components/ui/form/rhf-select";

const options = [
  { id: 1, name: "Guaranda", displayName: "Guaranda — Guaranda, Bolívar" },
  { id: 2, name: "San José", displayName: "San José — Quito, Pichincha" },
  { id: 3, name: "San José", displayName: "San José — Tulcán, Carchi" },
  { id: 4, name: "Localidad retirada", disabled: true },
];

function LocalityField({ editable = true, disabled = false, value = "3" }) {
  const { control } = useForm({ defaultValues: { localityId: value } });
  return (
    <EditableContext value={editable}>
      <RhfCatalogSelect
        control={control}
        id="locality"
        name="localityId"
        label="Localidad"
        options={options}
        searchable
        required
        disabled={disabled}
      />
    </EditableContext>
  );
}

describe("buscador de catálogo", () => {
  test("busca nombres, cantones y provincias sin tildes ni distinción de mayúsculas", () => {
    for (const [query, ids] of [
      ["  BOLIVAR  ", [1]],
      ["san jose", [2, 3]],
      ["tulcan", [3]],
      ["pichincha", [2]],
      ["localidad inexistente", []],
    ] as const) {
      expect(
        filterCatalogOptions(options, {
          inputValue: query,
          getOptionLabel: (option) => option.name,
        }).map((option) => option.id),
      ).toEqual([...ids]);
    }
  });

  test("seleccionar nombres duplicados entrega el id como texto y limpiar entrega vacío", () => {
    const onChange = mock(() => {});
    const control = CatalogAutocomplete({
      id: "locality",
      label: "Localidad",
      value: "2",
      options,
      onChange,
    });
    control.props.onChange(null, options[2]);
    expect(onChange).toHaveBeenLastCalledWith("3");
    control.props.onChange(null, null);
    expect(onChange).toHaveBeenLastCalledWith("");
    control.props.onChange(null, options[3]);
    expect(onChange).toHaveBeenCalledTimes(2);
  });

  test("RHF muestra la localidad correcta por id y asocia la etiqueta flotante", () => {
    const html = renderToString(<LocalityField />);
    expect(html).toContain('role="combobox"');
    expect(html).toContain('value="San José — Tulcán, Carchi"');
    expect(html).toContain('for="locality"');
    expect(html).toContain('name="localityId"');
    expect(html).toContain('required=""');
    expect(html).toContain('data-shrink="true"');
  });

  test("un id ajeno al catálogo se muestra vacío y un formulario bloqueado no permite editar", () => {
    expect(renderToString(<LocalityField value="999" />)).toContain('value=""');
    expect(renderToString(<LocalityField editable={false} />)).toContain('disabled=""');
    expect(renderToString(<LocalityField disabled />)).toContain('disabled=""');
  });

  test("conserva los errores y la asociación accesible de ayuda con el campo", () => {
    const html = renderToString(
      <CatalogAutocomplete
        id="locality-error"
        label="Localidad"
        value=""
        options={options}
        onChange={() => {}}
        helperText="Selecciona una localidad."
      />,
    );
    expect(html).toContain('aria-invalid="true"');
    expect(html).toContain('aria-describedby="locality-error-helper-text"');
    expect(html).toContain("Selecciona una localidad.");
  });
});
