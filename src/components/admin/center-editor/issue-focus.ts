import type { IssueTarget } from "@/lib/ficha/ubicar-aviso";

/** Petición de llevar a la persona a un campo y señalarlo con su mensaje. */
export type IssueFocus = IssueTarget & {
  message: string;
  /** Distingue dos peticiones seguidas al mismo campo. */
  nonce: number;
};

/** Centra en pantalla el campo enfocado; si no hay uno, el apartado completo. */
export function scrollToFocusedField(sectionCode: string): void {
  const active = document.activeElement;
  const target =
    active instanceof HTMLElement && active !== document.body
      ? active
      : document.getElementById(`center-detail-section-${sectionCode}`);
  target?.scrollIntoView({ block: "center", behavior: "smooth" });
}
