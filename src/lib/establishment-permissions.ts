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
