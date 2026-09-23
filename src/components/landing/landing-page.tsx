import ArrowForwardRounded from "@mui/icons-material/ArrowForwardRounded";
import ExploreRounded from "@mui/icons-material/ExploreRounded";
import FactCheckRounded from "@mui/icons-material/FactCheckRounded";
import MapRounded from "@mui/icons-material/MapRounded";
import VerifiedRounded from "@mui/icons-material/VerifiedRounded";
import type { SvgIconComponent } from "@mui/icons-material";
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Container,
  Grid,
  Stack,
  Typography,
} from "@mui/material";

import type { PublishedCenter } from "@/lib/api";
import { webTokens } from "@/theme/tokens";

type Feature = { Icon: SvgIconComponent; title: string; description: string };

const FEATURES: readonly Feature[] = [
  {
    Icon: FactCheckRounded,
    title: "Registro y revisión",
    description: "Cada ficha sigue un flujo auditable antes de publicarse.",
  },
  {
    Icon: MapRounded,
    title: "Mapa y rutas",
    description: "La información validada alimenta mapas, búsqueda y navegación.",
  },
  {
    Icon: VerifiedRounded,
    title: "Datos confiables",
    description: "El contenido publicado conserva responsables y trazabilidad.",
  },
];

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
          py: webTokens.spacing.surface,
        }}
      >
        <Container maxWidth="lg">
          <Stack direction="row" alignItems="center" justifyContent="space-between">
            <Stack direction="row" spacing={webTokens.spacing.brand} alignItems="center">
              <ExploreRounded />
              <Typography variant="h6" fontWeight={700}>
                Turismo Vinculación
              </Typography>
            </Stack>
            <Chip
              label="Información institucional"
              size="small"
              sx={{ color: "primary.contrastText", bgcolor: "primary.main" }}
            />
          </Stack>
        </Container>
      </Box>

      <Container maxWidth="lg" sx={{ py: webTokens.spacing.hero }}>
        <Grid container spacing={webTokens.spacing.publicHeroGrid} alignItems="center">
          <Grid size={{ xs: 12, md: 7 }}>
            <Stack spacing={webTokens.spacing.section}>
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
              <Stack
                direction={{ xs: "column", sm: "row" }}
                spacing={webTokens.spacing.actionGroup}
              >
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
              <CardContent sx={{ p: webTokens.spacing.publicHeroCard }}>
                <MapRounded sx={{ fontSize: 52, mb: 3 }} />
                <Typography variant="h4" gutterBottom>
                  Una fuente institucional.
                </Typography>
                <Typography
                  sx={{ color: "primary.contrastText", opacity: 0.86, lineHeight: 1.6 }}
                >
                  Guías y equipos turísticos registran la información. Los revisores la
                  validan antes de que llegue a la experiencia móvil del visitante.
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        <Stack
          id="como-funciona"
          spacing={webTokens.spacing.control}
          sx={{ mb: webTokens.spacing.publicHeading }}
        >
          <Typography component="h2" variant="h2" sx={{ fontSize: { xs: 30, md: 42 } }}>
            Diseñado para mantener la información al día
          </Typography>
          <Typography color="text.secondary" sx={{ maxWidth: 700 }}>
            La aplicación móvil es el producto para turistas. Este portal público explica
            el proyecto y el panel privado permitirá operar fichas, revisión y catálogos.
          </Typography>
        </Stack>

        <Grid container spacing={webTokens.spacing.publicGrid}>
          {FEATURES.map(({ Icon, title, description }) => (
            <Grid key={title} size={{ xs: 12, md: 4 }}>
              <Card sx={{ height: "100%" }}>
                <CardContent sx={{ p: webTokens.spacing.publicCard }}>
                  <Box sx={{ color: "primary.main", mb: 2 }}>
                    <Icon />
                  </Box>
                  <Typography variant="h6" gutterBottom>
                    {title}
                  </Typography>
                  <Typography color="text.secondary">{description}</Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>

        <Stack
          id="lugares"
          spacing={webTokens.spacing.control}
          sx={{ mt: webTokens.spacing.publicSection, mb: 3 }}
        >
          <Stack
            direction={{ xs: "column", sm: "row" }}
            spacing={webTokens.spacing.inline}
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
          <Grid container spacing={webTokens.spacing.control}>
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

      <Box
        component="footer"
        sx={{ bgcolor: "background.subtle", py: webTokens.spacing.footer }}
      >
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
