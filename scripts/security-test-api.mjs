// API simulada, exclusiva de Playwright. Escucha solo en loopback y no persiste datos.
import { createServer } from "node:http";

const keys =
  "establishmentActivities establishmentClassifications establishmentCategories categories types subtypes provinces cantons parishes localities zones lines scenarios hierarchies climates incomeTypes attentionModes accessibilityTypes accessibilityCriteria conditionStates roadTypes roadMaterials aquaticAccessModes aerialAccessCoverages transportTypes serviceFrequencies serviceScopes conservationStates conservationFactors basicServiceCategories basicServiceTypes signageTypes signageMaterials healthServiceTypes securityServiceTypes communicationTypes threatTypes policyQuestions promotionMediaTypes trainingTypes responsibilityTypes months plantTypes complementaryServiceTypes activityGroups activities facilityCategories facilities".split(
    " ",
  );
const catalogs = Object.fromEntries(keys.map((key) => [key, []]));
const server = createServer((request, response) => {
  const token = request.headers.authorization;
  let status = 200,
    body;
  if (request.url === "/health") body = { ok: true };
  else if (
    token !== "Bearer security-test-token" &&
    token !== "Bearer tourist-test-token"
  ) {
    status = 401;
    body = { error: { message: "Sesión de prueba inválida." } };
  } else if (request.url === "/api/v1/auth/me")
    body = {
      data: {
        user: {
          id: 123,
          roles: [token === "Bearer tourist-test-token" ? "TURISTA" : "ADMINISTRADOR"],
        },
      },
    };
  else if (request.url === "/api/v1/admin/catalogs") body = { data: catalogs };
  else {
    status = 404;
    body = { error: { message: "Ruta de prueba inexistente." } };
  }
  response.writeHead(status, {
    "Content-Type": "application/json",
    "Cache-Control": "no-store",
  });
  response.end(JSON.stringify(body));
});
server.listen(4318, "127.0.0.1");
