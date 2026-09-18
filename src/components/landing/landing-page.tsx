import ArrowForwardRounded from "@mui/icons-material/ArrowForwardRounded";
import ExploreRounded from "@mui/icons-material/ExploreRounded";
import FactCheckRounded from "@mui/icons-material/FactCheckRounded";
import MapRounded from "@mui/icons-material/MapRounded";
import VerifiedRounded from "@mui/icons-material/VerifiedRounded";
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Container,
  Divider,
  Grid,
  Stack,
  Typography,
} from "@mui/material";

import type { PublishedCenter } from "@/lib/api";

type LandingPageProps = {
  centers: PublishedCenter[];
  apiOnline: boolean;
};

export function LandingPage({ centers, apiOnline }: LandingPageProps) {
  return (
    <Box component="main">
      <Box
        component="header"
        sx={{
          bgcolor: "primary.dark",
          color: "common.white",
          py: { xs: 2, md: 3 },
        }}
      >
        <Container maxWidth="lg">
          <Stack direction="row" alignItems="center" justifyContent="space-between">
            <Stack direction="row" spacing={1.25} alignItems="center">
              <ExploreRounded />
              <Typography variant="h6" fontWeight={700}>
                Turismo Vinculación
              </Typography>
            </Stack>
            <Chip
              label="Información institucional"
              size="small"
              sx={{ color: "common.white", borderColor: "rgba(255,255,255,.4)" }}
              variant="outlined"
            />
          </Stack>
        </Container>
      </Box>

      <Container maxWidth="lg" sx={{ py: { xs: 7, md: 11 } }}>
        <Grid container spacing={{ xs: 5, md: 9 }} alignItems="center">
          <Grid size={{ xs: 12, md: 7 }}>
            <Stack spacing={3}>
              <Chip
                icon={<VerifiedRounded />}
                label="Información turística validada"
                color="primary"
                sx={{ alignSelf: "flex-start", fontWeight: 700 }}
              />
              <Typography
                component="h1"
                variant="h1"
                sx={{ fontSize: { xs: 42, md: 64 } }}
              >
                Ecuador se descubre mejor con información confiable.
              </Typography>
              <Typography
                variant="h6"
                color="text.secondary"
                sx={{ maxWidth: 640, lineHeight: 1.55 }}
              >
                Turismo Vinculación conecta a turistas con atractivos, rutas y
                experiencias verificadas. Este portal acompaña la operación institucional
                que alimenta la aplicación móvil.
              </Typography>
              <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
                <Button
                  href="#como-funciona"
                  variant="contained"
                  endIcon={<ArrowForwardRounded />}
                >
                  Conocer el proyecto
                </Button>
                <Button href="#lugares" variant="outlined">
                  Ver lugares publicados
                </Button>
              </Stack>
            </Stack>
          </Grid>
          <Grid size={{ xs: 12, md: 5 }}>
            <Card
              sx={{ bgcolor: "primary.main", color: "common.white", overflow: "hidden" }}
            >
              <CardContent sx={{ p: { xs: 3, md: 4 } }}>
                <MapRounded sx={{ fontSize: 52, mb: 3 }} />
                <Typography variant="h4" gutterBottom>
                  Una fuente institucional.
                </Typography>
                <Typography sx={{ color: "rgba(255,255,255,.86)", lineHeight: 1.6 }}>
                  Guías y equipos turísticos registran la información. Los revisores la
                  validan antes de que llegue a la experiencia móvil del visitante.
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        <Divider sx={{ my: { xs: 7, md: 10 } }} />

        <Stack id="como-funciona" spacing={2} sx={{ mb: 5 }}>
          <Typography component="h2" variant="h2" sx={{ fontSize: { xs: 30, md: 42 } }}>
            Diseñado para mantener la información al día
          </Typography>
          <Typography color="text.secondary" sx={{ maxWidth: 700 }}>
            La aplicación móvil es el producto para turistas. Este portal público explica
            el proyecto y el panel privado permitirá operar fichas, revisión y catálogos.
          </Typography>
        </Stack>

        <Grid container spacing={2.5}>
          {[
            [
              <FactCheckRounded key="fact" />,
              "Registro y revisión",
              "Cada ficha sigue un flujo auditable antes de publicarse.",
            ],
            [
              <MapRounded key="map" />,
              "Mapa y rutas",
              "La información validada alimenta mapas, búsqueda y navegación.",
            ],
            [
              <VerifiedRounded key="verified" />,
              "Datos confiables",
              "El contenido publicado conserva responsables y trazabilidad.",
            ],
          ].map(([icon, title, description]) => (
            <Grid key={title as string} size={{ xs: 12, md: 4 }}>
              <Card sx={{ height: "100%" }}>
                <CardContent sx={{ p: 3 }}>
                  <Box sx={{ color: "primary.main", mb: 2 }}>{icon}</Box>
                  <Typography variant="h6" gutterBottom>
                    {title}
                  </Typography>
                  <Typography color="text.secondary">{description}</Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>

        <Stack id="lugares" spacing={2} sx={{ mt: { xs: 8, md: 11 }, mb: 3 }}>
          <Stack
            direction={{ xs: "column", sm: "row" }}
            spacing={1}
            alignItems={{ sm: "center" }}
          >
            <Typography component="h2" variant="h2" sx={{ fontSize: { xs: 30, md: 42 } }}>
              Lugares publicados
            </Typography>
            <Chip
              label={apiOnline ? "API disponible" : "API sin conexión"}
              color={apiOnline ? "success" : "default"}
              size="small"
            />
          </Stack>
          <Typography color="text.secondary">
            Una muestra de la información pública que consume la aplicación móvil.
          </Typography>
        </Stack>

        {centers.length > 0 ? (
          <Grid container spacing={2}>
            {centers.map((center) => (
              <Grid key={center.code} size={{ xs: 12, sm: 6, md: 4 }}>
                <Card sx={{ height: "100%" }}>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      {center.name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {[center.category, center.province].filter(Boolean).join(" · ") ||
                        "Atractivo turístico"}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        ) : (
          <Card>
            <CardContent>
              <Typography color="text.secondary">
                Todavía no hay fichas publicadas para mostrar en esta vista.
              </Typography>
            </CardContent>
          </Card>
        )}
      </Container>

      <Box component="footer" sx={{ bgcolor: "#e8f0ee", py: 4 }}>
        <Container maxWidth="lg">
          <Typography variant="body2" color="text.secondary">
            Turismo Vinculación · Plataforma institucional para promover el turismo en
            Ecuador
          </Typography>
        </Container>
      </Box>
    </Box>
  );
}
