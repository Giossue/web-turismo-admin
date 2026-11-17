type DeletableEstablishment = {
  editable?: boolean;
  reviewStatus: string;
};

/**
 * El administrador borra cualquier catastro. Un agente solo los suyos (la API
 * marca `editable`) y nunca mientras están en revisión. La API vuelve a comprobarlo.
 */
export function canDeleteEstablishment(
  item: DeletableEstablishment,
  isAdministrator: boolean,
): boolean {
  return (
    isAdministrator || (item.editable !== false && item.reviewStatus !== "EN_REVISION")
  );
}

/**
 * Acción para sacar un catastro de borrador o rechazado. Lo que envía el
 * administrador queda publicado (él es quien aprueba), igual que lo de un
 * agente cuando el paso libre está activo; si no, pasa a revisión.
 */
export function establishmentPublishLabel(
  item: Pick<DeletableEstablishment, "reviewStatus">,
  isAdministrator: boolean,
  publishesDirectly: boolean,
): "Publicar" | "Enviar a revisión" | null {
  if (!["BORRADOR", "RECHAZADO"].includes(item.reviewStatus)) return null;
  return isAdministrator || publishesDirectly ? "Publicar" : "Enviar a revisión";
}
