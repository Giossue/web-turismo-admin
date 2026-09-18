"use client";

import AssessmentRounded from "@mui/icons-material/AssessmentRounded";
import FactCheckRounded from "@mui/icons-material/FactCheckRounded";
import MenuRounded from "@mui/icons-material/MenuRounded";
import PlaceRounded from "@mui/icons-material/PlaceRounded";
import SettingsRounded from "@mui/icons-material/SettingsRounded";
import {
  AppBar,
  Box,
  Card,
  CardContent,
  Chip,
  CssBaseline,
  Drawer,
  IconButton,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Stack,
  Toolbar,
  Typography,
} from "@mui/material";
import { useState } from "react";

const drawerWidth = 272;

export function AdminShell() {
  const [open, setOpen] = useState(false);

  const navItems = [
    [<AssessmentRounded key="dashboard" />, "Resumen"],
    [<FactCheckRounded key="review" />, "Revisión de fichas"],
    [<PlaceRounded key="centers" />, "Centros turísticos"],
    [<SettingsRounded key="settings" />, "Configuración"],
  ] as const;

  const drawer = (
    <Box sx={{ width: drawerWidth }} role="presentation" onClick={() => setOpen(false)}>
      <Stack spacing={0.5} sx={{ px: 3, py: 3 }}>
        <Typography variant="h6" fontWeight={700}>
          Turismo Vinculación
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Panel institucional
        </Typography>
      </Stack>
      <List>
        {navItems.map(([icon, label], index) => (
          <ListItemButton key={label} selected={index === 0}>
            <ListItemIcon>{icon}</ListItemIcon>
            <ListItemText primary={label} />
          </ListItemButton>
        ))}
      </List>
    </Box>
  );

  return (
    <Box sx={{ display: "flex", minHeight: "100vh" }}>
      <CssBaseline />
      <AppBar
        position="fixed"
        color="inherit"
        elevation={0}
        sx={{ borderBottom: 1, borderColor: "divider" }}
      >
        <Toolbar sx={{ gap: 1 }}>
          <IconButton edge="start" onClick={() => setOpen(true)} aria-label="Abrir menú">
            <MenuRounded />
          </IconButton>
          <Typography variant="h6" color="text.primary" sx={{ flexGrow: 1 }}>
            Resumen operativo
          </Typography>
          <Chip
            label="Sesión institucional"
            size="small"
            color="primary"
            variant="outlined"
          />
        </Toolbar>
      </AppBar>

      <Box component="nav" aria-label="Navegación administrativa">
        <Drawer
          variant="temporary"
          open={open}
          onClose={() => setOpen(false)}
          ModalProps={{ keepMounted: true }}
          sx={{
            display: { xs: "block", md: "none" },
            "& .MuiDrawer-paper": { width: drawerWidth },
          }}
        >
          {drawer}
        </Drawer>
        <Drawer
          variant="permanent"
          open
          sx={{
            display: { xs: "none", md: "block" },
            "& .MuiDrawer-paper": { width: drawerWidth, boxSizing: "border-box" },
          }}
        >
          {drawer}
        </Drawer>
      </Box>

      <Box
        component="main"
        sx={{ flexGrow: 1, p: { xs: 2, md: 4 }, mt: 8, ml: { md: `${drawerWidth}px` } }}
      >
        <Stack spacing={3}>
          <Box>
            <Typography variant="h4" gutterBottom>
              Bienvenido al panel
            </Typography>
            <Typography color="text.secondary">
              Aquí se centralizarán captura, revisión y publicación de fichas turísticas.
            </Typography>
          </Box>
          <Card sx={{ borderColor: "secondary.main", bgcolor: "#fffaf4" }}>
            <CardContent>
              <Typography variant="subtitle1" fontWeight={700} gutterBottom>
                Autenticación institucional pendiente
              </Typography>
              <Typography color="text.secondary">
                Esta interfaz es el esqueleto operativo. La autorización real debe
                resolverse en la API NestJS con sesión, rol, permisos y auditoría; ocultar
                esta ruta no es una medida de seguridad.
              </Typography>
            </CardContent>
          </Card>
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", sm: "repeat(3, 1fr)" },
              gap: 2,
            }}
          >
            {[
              ["Borradores", "Pendientes de captura"],
              ["En revisión", "Esperando validación"],
              ["Publicados", "Disponibles en la app"],
            ].map(([value, label]) => (
              <Card key={value}>
                <CardContent>
                  <Typography variant="h4" color="primary.main">
                    —
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {value}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {label}
                  </Typography>
                </CardContent>
              </Card>
            ))}
          </Box>
        </Stack>
      </Box>
    </Box>
  );
}
