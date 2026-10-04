import { describe, expect, test } from "bun:test";

import {
  adminNavReducer,
  CENTER_STATUS_FILTER_OPTIONS,
  effectiveCenterQuery,
  parseAdminNavState,
  serializeAdminNavState,
  type AdminNavState,
} from "@/components/admin/shell/admin-nav-state";
import { pageAfterRemoval } from "@/components/admin/shell/pagination";
import {
  isAdminSection,
  navigationItems,
  resolveSection,
} from "@/components/admin/shell/sections";

function parse(search: string): AdminNavState {
  return parseAdminNavState(new URLSearchParams(search));
}

describe("parseAdminNavState", () => {
  test("usa el resumen y valores vacíos sin parámetros", () => {
    expect(parse("")).toEqual({
      section: "summary",
      editorCode: null,
      editorSession: 0,
      centerStatus: "ALL",
      queryDraft: "",
      centersPage: 0,
      usersQueryDraft: "",
      usersPage: 0,
      reviewCentersPage: 0,
      reviewEstablishmentsPage: 0,
    });
  });

  test("lee filtros y página del listado de fichas", () => {
    const state = parse("section=centers&status=PUBLICADO&q=%20Cascada%20&page=3");
    expect(state.section).toBe("centers");
    expect(state.centerStatus).toBe("PUBLICADO");
    expect(state.queryDraft).toBe("Cascada");
    expect(state.centersPage).toBe(2);
    expect(state.reviewCentersPage).toBe(0);
  });

  test("ofrece tres estados e ignora el antiguo filtro de activación de la URL", () => {
    expect(CENTER_STATUS_FILTER_OPTIONS.map(({ value }) => value)).toEqual([
      "ALL",
      "BORRADOR",
      "EN_REVISION",
      "PUBLICADO",
    ]);
    const state = parse("section=centers&status=PUBLICADO&active=false&page=2");
    expect(state.centerStatus).toBe("PUBLICADO");
    expect(serializeAdminNavState(state, "centers", "")).toBe(
      "?section=centers&status=PUBLICADO&page=2",
    );
    expect(parse("section=centers&active=true")).toEqual(parse("section=centers"));
    expect(parse("section=centers&active=otra")).toEqual(parse("section=centers"));
    expect(serializeAdminNavState(state, "review", "")).toBe("?section=review");
  });

  test("descarta sección, estado, búsqueda corta y páginas no válidas", () => {
    const state = parse("section=otra&status=DESCONOCIDO&q=a&page=-2");
    expect(state.section).toBe("summary");
    expect(state.centerStatus).toBe("ALL");
    expect(state.queryDraft).toBe("");
    expect(state.centersPage).toBe(0);
    expect(parse("section=centers&page=1.5").centersPage).toBe(0);
  });

  test("separa las páginas de las dos colas de revisión", () => {
    const state = parse("section=review&page=2&establishmentsPage=4");
    expect(state.reviewCentersPage).toBe(1);
    expect(state.reviewEstablishmentsPage).toBe(3);
    expect(state.centersPage).toBe(0);
  });

  test("solo lee el código de ficha en el editor", () => {
    expect(parse("section=editor&code=CT-1").editorCode).toBe("CT-1");
    expect(parse("section=centers&code=CT-1").editorCode).toBeNull();
    expect(parse("section=editor&code=").editorCode).toBeNull();
  });
});

describe("serializeAdminNavState", () => {
  test("incluye solo los parámetros del apartado visible", () => {
    const state: AdminNavState = {
      ...parse(""),
      centerStatus: "EN_REVISION",
      centersPage: 1,
      editorCode: "CT-9",
      reviewCentersPage: 2,
      reviewEstablishmentsPage: 1,
    };
    expect(serializeAdminNavState(state, "centers", "rio")).toBe(
      "?section=centers&status=EN_REVISION&q=rio&page=2",
    );
    expect(serializeAdminNavState(state, "editor", "rio")).toBe(
      "?section=editor&code=CT-9&page=2",
    );
    expect(serializeAdminNavState(state, "review", "rio")).toBe(
      "?section=review&page=3&establishmentsPage=2",
    );
    expect(serializeAdminNavState(state, "settings", "rio")).toBe("?section=settings");
  });

  test("ida y vuelta con la URL", () => {
    const search = "?section=review&page=2&establishmentsPage=5";
    const state = parse(search);
    expect(serializeAdminNavState(state, state.section, "")).toBe(search);
  });
});

describe("adminNavReducer", () => {
  const base = parse("section=centers&status=PUBLICADO&q=rio&page=3");

  test("abrir el editor inicia una sesión nueva sin perder el listado", () => {
    const opened = adminNavReducer(base, { type: "openEditor", code: null });
    expect(opened.section).toBe("editor");
    expect(opened.editorSession).toBe(1);
    expect(opened.centersPage).toBe(2);
    const reopened = adminNavReducer(opened, { type: "openEditor", code: "CT-2" });
    expect(reopened.editorSession).toBe(2);
    expect(reopened.editorCode).toBe("CT-2");
  });

  test("el primer guardado de una ficha nueva conserva la sesión del editor", () => {
    const opened = adminNavReducer(base, { type: "openEditor", code: null });
    const saved = adminNavReducer(opened, {
      type: "editorSaved",
      code: "CT-NEW",
      session: opened.editorSession,
    });
    expect(saved.editorCode).toBe("CT-NEW");
    expect(saved.editorSession).toBe(opened.editorSession);
  });

  test("ignora guardados de otra sesión o fuera del editor", () => {
    const first = adminNavReducer(base, { type: "openEditor", code: "CT-1" });
    const second = adminNavReducer(first, { type: "openEditor", code: "CT-2" });
    const late = adminNavReducer(second, {
      type: "editorSaved",
      code: "CT-1",
      session: first.editorSession,
    });
    expect(late).toBe(second);
    const closed = adminNavReducer(second, { type: "navigate", section: "centers" });
    expect(
      adminNavReducer(closed, {
        type: "editorSaved",
        code: "CT-2",
        session: second.editorSession,
      }),
    ).toBe(closed);
  });

  test("volver a centros conserva la búsqueda; otro apartado la reinicia", () => {
    const editor = adminNavReducer(base, { type: "openEditor", code: "CT-1" });
    const back = adminNavReducer(editor, { type: "navigate", section: "centers" });
    expect(back.queryDraft).toBe("rio");
    expect(back.centersPage).toBe(2);
    expect(back.editorCode).toBeNull();

    const summary = adminNavReducer(base, { type: "navigate", section: "summary" });
    expect(summary.queryDraft).toBe("");
    expect(summary.centersPage).toBe(0);
    expect(summary.centerStatus).toBe("PUBLICADO");
  });

  test("filtrar reinicia la página y las colas de revisión paginan por separado", () => {
    expect(
      adminNavReducer(base, { type: "setCenterStatus", status: "BORRADOR" }).centersPage,
    ).toBe(0);
    expect(
      adminNavReducer(base, { type: "setQueryDraft", query: "lago" }).centersPage,
    ).toBe(0);
    const review = adminNavReducer(base, { type: "navigate", section: "review" });
    const paged = adminNavReducer(review, { type: "setReviewCentersPage", page: 2 });
    expect(paged.reviewCentersPage).toBe(2);
    expect(paged.reviewEstablishmentsPage).toBe(0);
    const both = adminNavReducer(paged, {
      type: "setReviewEstablishmentsPage",
      page: 1,
    });
    expect(both.reviewCentersPage).toBe(2);
    expect(both.reviewEstablishmentsPage).toBe(1);
  });
});

describe("effectiveCenterQuery", () => {
  test("aplica la búsqueda con retardo solo con dos caracteres o más", () => {
    expect(effectiveCenterQuery("rio", "rio")).toBe("rio");
    expect(effectiveCenterQuery("rio", "r")).toBe("");
    expect(effectiveCenterQuery("r", "rio")).toBe("");
    expect(effectiveCenterQuery("", "rio")).toBe("");
  });
});

describe("sections", () => {
  test("isAdminSection valida los apartados conocidos", () => {
    expect(isAdminSection("review")).toBe(true);
    expect(isAdminSection("editor")).toBe(true);
    expect(isAdminSection("otra")).toBe(false);
    expect(isAdminSection(null)).toBe(false);
  });

  test("los agentes turísticos no ven apartados de administración", () => {
    expect(resolveSection("review", false)).toBe("centers");
    expect(resolveSection("catalogs", false)).toBe("centers");
    expect(resolveSection("establishments", false)).toBe("establishments");
    expect(resolveSection("review", true)).toBe("review");
  });

  test("menú por rol", () => {
    expect(navigationItems(true).map((item) => item.key)).toEqual([
      "summary",
      "review",
      "opinions",
      "centers",
      "establishments",
      "catalogs",
      "settings",
    ]);
    expect(navigationItems(false).map((item) => item.label)).toEqual([
      "Mis centros turísticos",
      "Mi catastro",
      "Configuración",
    ]);
  });
});

describe("pageAfterRemoval", () => {
  test("retrocede solo si se quitó el último elemento de una página posterior", () => {
    expect(pageAfterRemoval(2, 1)).toBe(1);
    expect(pageAfterRemoval(2, 5)).toBe(2);
    expect(pageAfterRemoval(0, 1)).toBe(0);
  });
});
