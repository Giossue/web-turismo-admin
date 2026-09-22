"use client";

import { createContext, useContext } from "react";

/**
 * Indica si los campos del formulario pueden editarse. Los componentes `Rhf*`
 * se deshabilitan cuando el contexto es `false`, además de su prop `disabled`.
 * Uso: `<EditableContext value={canEdit}>…</EditableContext>`.
 */
export const EditableContext = createContext(true);

export function useEditable(): boolean {
  return useContext(EditableContext);
}
