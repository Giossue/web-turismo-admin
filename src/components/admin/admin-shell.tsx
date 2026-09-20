"use client";

import AssessmentRounded from "@mui/icons-material/AssessmentRounded";
import AccountCircleRounded from "@mui/icons-material/AccountCircleRounded";
import AddRounded from "@mui/icons-material/AddRounded";
import CheckCircleRounded from "@mui/icons-material/CheckCircleRounded";
import CategoryRounded from "@mui/icons-material/CategoryRounded";
import ChevronLeftRounded from "@mui/icons-material/ChevronLeftRounded";
import ChevronRightRounded from "@mui/icons-material/ChevronRightRounded";
import DarkModeRounded from "@mui/icons-material/DarkModeRounded";
import EditRounded from "@mui/icons-material/EditRounded";
import FactCheckRounded from "@mui/icons-material/FactCheckRounded";
import LightModeRounded from "@mui/icons-material/LightModeRounded";
import LogoutRounded from "@mui/icons-material/LogoutRounded";
import MenuRounded from "@mui/icons-material/MenuRounded";
import PlaceRounded from "@mui/icons-material/PlaceRounded";
import SettingsRounded from "@mui/icons-material/SettingsRounded";
import StorefrontRounded from "@mui/icons-material/StorefrontRounded";
import {
  Alert,
  AppBar,
  Box,
  Button,
  Chip,
  CircularProgress,
  CssBaseline,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Drawer,
  FormControl,
  IconButton,
  InputLabel,
  LinearProgress,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  MenuItem,
  Select,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Toolbar,
  Typography,
} from "@mui/material";
import { useColorScheme } from "@mui/material/styles";
import { useCallback, useEffect, useState } from "react";

import { FlatSurface } from "@/components/ui/flat-surface";
import { ContentState } from "@/components/ui/content-state";
import { MetricCard } from "@/components/ui/metric-card";
import { PageHeader } from "@/components/ui/page-header";
import { SearchField } from "@/components/ui/search-field";
import { SectionHeader } from "@/components/ui/section-header";
import { StatusBadge } from "@/components/ui/status-badge";
import { CenterEditor } from "@/components/admin/center-editor";
import { CatalogManagement } from "@/components/admin/catalog-management";
import { EstablishmentManagement } from "@/components/admin/establishment-management";
import {
  getAdminCenters,
  getAdminSummary,
  reviewAdminCenter,
  type AdminCenter,
  type AdminSummary,
} from "@/lib/admin-api";
import { AdminLogin, useAdminAuth } from "@/lib/auth";
import { webTokens } from "@/theme/tokens";

const drawerWidth = webTokens.layout.drawerWidth;
const pageSize = 20;

type AdminSection =
  | "summary"
  | "review"
  | "centers"
  | "establishments"
  | "catalogs"
  | "editor"
  | "settings";
type ReviewIntent = { center: AdminCenter; action: "APPROVE" | "REJECT" };

const sectionMeta: Record<AdminSection, { title: string; description: string }> = {
  summary: {
    title: "Resumen",
    description: "Una vista rápida del inventario y su estado de publicación.",
  },
  review: {
    title: "Revisión de fichas",
    description:
      "Revisa la información propuesta antes de habilitarla para la aplicación móvil.",
  },
  centers: {
    title: "Centros turísticos",
    description: "Consulta el inventario institucional por estado y búsqueda.",
  },
  establishments: {
    title: "Catastro por localidad",
    description:
      "Administra establecimientos que el turista puede encontrar cerca de una localidad.",
  },
  settings: {
    title: "Configuración",
    description: "Administra tu sesión y las preferencias de este panel.",
  },
  catalogs: {
    title: "Catálogos",
    description: "Administra las opciones técnicas disponibles para nuevas fichas.",
  },
  editor: {
    title: "Ficha turística",
    description: "Captura y publica información institucional validada.",
  },
};

function isAdminSection(value: string | null): value is AdminSection {
  return (
    value === "summary" ||
    value === "review" ||
    value === "centers" ||
    value === "establishments" ||
    value === "catalogs" ||
    value === "editor" ||
    value === "settings"
  );
}

export function AdminShell() {
  const { accessToken, ready, user, logout } = useAdminAuth();
  const [open, setOpen] = useState(false);
  const [section, setSection] = useState<AdminSection>(() => {
    if (typeof window === "undefined") return "summary";
    const fromUrl = new URLSearchParams(window.location.search).get("section");
    return isAdminSection(fromUrl) ? fromUrl : "summary";
  });
  const [editorCode, setEditorCode] = useState<string | null>(() => {
    if (typeof window === "undefined") return null;
    return new URLSearchParams(window.location.search).get("code");
  });
  const [summary, setSummary] = useState<AdminSummary | null>(null);
  const [centers, setCenters] = useState<AdminCenter[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(() => {
    if (typeof window === "undefined") return 0;
    const value = Number(new URLSearchParams(window.location.search).get("page"));
    return Number.isInteger(value) && value > 0 ? value - 1 : 0;
  });
  const [centerStatus, setCenterStatus] = useState(() => {
    if (typeof window === "undefined") return "ALL";
    const value = new URLSearchParams(window.location.search).get("status");
    return value ?? "ALL";
  });
  const [centerQuery, setCenterQuery] = useState(() => {
    if (typeof window === "undefined") return "";
    const value = new URLSearchParams(window.location.search).get("q") ?? "";
    return value.length >= 2 ? value : "";
  });
  const [queryDraft, setQueryDraft] = useState(() => {
    if (typeof window === "undefined") return "";
    const value = new URLSearchParams(window.location.search).get("q") ?? "";
    return value.length >= 2 ? value : "";
  });
  const [loadingSummary, setLoadingSummary] = useState(false);
  const [loadingCenters, setLoadingCenters] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [workingCode, setWorkingCode] = useState<string | null>(null);
  const [reviewIntent, setReviewIntent] = useState<ReviewIntent | null>(null);
  const [observation, setObservation] = useState("");

  const loadSummary = useCallback(async (token: string) => {
    setLoadingSummary(true);
    setError(null);
    try {
      setSummary(await getAdminSummary(token));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "No se pudo cargar el resumen.");
    } finally {
      setLoadingSummary(false);
    }
  }, []);

  const loadCenters = useCallback(
    async (token: string, status: string, q: string, offset: number) => {
      setLoadingCenters(true);
      setError(null);
      try {
        const result = await getAdminCenters(token, {
          status,
          q,
          limit: pageSize,
          offset,
        });
        setCenters(result.items);
        setTotal(result.total);
      } catch (cause) {
        setError(
          cause instanceof Error ? cause.message : "No se pudieron cargar las fichas.",
        );
      } finally {
        setLoadingCenters(false);
      }
    },
    [],
  );

  useEffect(() => {
    if (!accessToken || !user?.roles.includes("ADMINISTRADOR")) return;
    void Promise.resolve().then(() => loadSummary(accessToken));
  }, [accessToken, loadSummary, user]);

  useEffect(() => {
    if (
      !accessToken ||
      !user?.roles.includes("ADMINISTRADOR") ||
      (section !== "review" && section !== "centers")
    )
      return;
    const status = section === "review" ? "EN_REVISION" : centerStatus;
    void Promise.resolve().then(() =>
      loadCenters(accessToken, status, centerQuery, page * pageSize),
    );
  }, [accessToken, centerQuery, centerStatus, loadCenters, page, section, user]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    params.set("section", section);
    if (section === "centers" && centerStatus !== "ALL")
      params.set("status", centerStatus);
    else params.delete("status");
    if (section === "centers" && centerQuery) params.set("q", centerQuery);
    else params.delete("q");
    if (section === "editor" && editorCode) params.set("code", editorCode);
    else params.delete("code");
    if (page > 0 && section !== "settings") params.set("page", String(page + 1));
    else params.delete("page");
    window.history.replaceState(
      null,
      "",
      `${window.location.pathname}?${params.toString()}`,
    );
  }, [centerQuery, centerStatus, editorCode, page, section]);

  function navigate(next: AdminSection) {
    setSection(next);
    setOpen(false);
    setError(null);
    setNotice(null);
    if (next !== "editor") setEditorCode(null);
    if (next !== "centers") {
      setPage(0);
      setCenterQuery("");
      setQueryDraft("");
    }
  }

  function openEditor(code?: string) {
    setEditorCode(code ?? null);
    setSection("editor");
    setOpen(false);
    setError(null);
    setNotice(null);
  }

  function submitSearch(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPage(0);
    const query = queryDraft.trim();
    setCenterQuery(query.length >= 2 ? query : "");
  }

  function refreshCurrent() {
    if (!accessToken) return;
    void loadSummary(accessToken);
    if (section === "review" || section === "centers") {
      const status = section === "review" ? "EN_REVISION" : centerStatus;
      void loadCenters(accessToken, status, centerQuery, page * pageSize);
    }
  }

  async function submitReview() {
    if (!accessToken || !reviewIntent) return;
    setWorkingCode(reviewIntent.center.code);
    setError(null);
    try {
      await reviewAdminCenter(
        accessToken,
        reviewIntent.center.code,
        reviewIntent.action,
        observation.trim() || undefined,
      );
      setReviewIntent(null);
      setObservation("");
      setNotice(
        reviewIntent.action === "APPROVE"
          ? "La ficha fue aprobada correctamente."
          : "La ficha fue rechazada y la observación quedó registrada.",
      );
      await Promise.all([
        loadSummary(accessToken),
        loadCenters(accessToken, "EN_REVISION", "", 0),
      ]);
      setPage(0);
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "No se pudo actualizar la ficha.",
      );
    } finally {
      setWorkingCode(null);
    }
  }

  if (!ready) {
    return (
      <Box sx={{ minHeight: "100vh", display: "grid", placeItems: "center" }}>
        <CircularProgress aria-label="Cargando sesión" />
      </Box>
    );
  }
  if (!user) return <AdminLogin />;
  if (!user.roles.includes("ADMINISTRADOR")) {
    return <AdminAccessDenied onLogout={() => void logout()} />;
  }

  const navItems: Array<{ key: AdminSection; label: string; icon: React.ReactNode }> = [
    { key: "summary", label: "Resumen", icon: <AssessmentRounded /> },
    { key: "review", label: "Revisión de fichas", icon: <FactCheckRounded /> },
    { key: "centers", label: "Centros turísticos", icon: <PlaceRounded /> },
    { key: "establishments", label: "Catastro", icon: <StorefrontRounded /> },
    { key: "catalogs", label: "Catálogos", icon: <CategoryRounded /> },
    { key: "settings", label: "Configuración", icon: <SettingsRounded /> },
  ];
  const meta = sectionMeta[section];
  const editorMode = section === "editor";

  const drawer = (
    <Box
      sx={{
        width: drawerWidth,
        minHeight: "100%",
        display: "flex",
        flexDirection: "column",
        overflowX: "hidden",
      }}
      role="presentation"
    >
      <Stack spacing={webTokens.spacing.navBrand} sx={{ p: webTokens.spacing.surface }}>
        <Typography variant="h6" fontWeight={700}>
          Turismo Vinculación
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Panel institucional
        </Typography>
      </Stack>
      <List>
        {navItems.map((item) => (
          <ListItemButton
            key={item.key}
            selected={section === item.key}
            onClick={() => navigate(item.key)}
            aria-current={section === item.key ? "page" : undefined}
          >
            <ListItemIcon>{item.icon}</ListItemIcon>
            <ListItemText primary={item.label} />
          </ListItemButton>
        ))}
      </List>
      <Box sx={{ flex: 1 }} />
      <Divider sx={{ mx: webTokens.spacing.surface, my: webTokens.spacing.control }} />
      <List>
        <ListItemButton onClick={() => void logout()}>
          <ListItemIcon>
            <LogoutRounded />
          </ListItemIcon>
          <ListItemText primary="Salir" />
        </ListItemButton>
      </List>
    </Box>
  );

  return (
    <Box sx={{ display: "flex", minHeight: "100vh" }}>
      <CssBaseline />
      <AppBar
        component="header"
        position="fixed"
        color="inherit"
        sx={{
          bgcolor: "background.default",
          width: editorMode
            ? "100%"
            : { xs: "100%", md: `calc(100% - ${drawerWidth}px)` },
          ml: editorMode ? 0 : { md: `${drawerWidth}px` },
          borderRadius: webTokens.shape.navigation,
          borderBottom: 0,
        }}
      >
        <Toolbar sx={{ gap: webTokens.spacing.inline }}>
          <Tooltip title="Abrir menú">
            <IconButton
              edge="start"
              onClick={() => setOpen(true)}
              aria-label="Abrir menú"
              sx={{
                display: editorMode ? "none" : { xs: "inline-flex", md: "none" },
              }}
            >
              <MenuRounded />
            </IconButton>
          </Tooltip>
          <Box sx={{ flexGrow: 1 }} />
          <ColorModeButton />
        </Toolbar>
      </AppBar>

      {!editorMode ? (
        <Box component="nav" aria-label="Navegación administrativa">
          <Drawer
            variant="temporary"
            open={open}
            onClose={() => setOpen(false)}
            ModalProps={{ keepMounted: true }}
            sx={{
              display: { xs: "block", md: "none" },
              "& .MuiDrawer-paper": {
                width: drawerWidth,
                boxSizing: "border-box",
                overflowX: "hidden",
                borderRadius: 0,
                bgcolor: "background.default",
                borderRight: 0,
              },
            }}
          >
            {drawer}
          </Drawer>
          <Drawer
            variant="permanent"
            open
            sx={{
              display: { xs: "none", md: "block" },
              "& .MuiDrawer-paper": {
                width: drawerWidth,
                boxSizing: "border-box",
                overflowX: "hidden",
                borderRadius: 0,
                bgcolor: "background.default",
                borderRight: 0,
              },
            }}
          >
            {drawer}
          </Drawer>
        </Box>
      ) : null}

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: webTokens.spacing.page,
          mt: webTokens.layout.headerOffset,
          ml: editorMode ? 0 : { md: `${drawerWidth}px` },
          minWidth: 0,
        }}
      >
        <Stack spacing={webTokens.spacing.section}>
          {section !== "editor" ? (
            <PageHeader
              title={meta.title}
              description={meta.description}
              actions={
                section === "centers" ? (
                  <Button
                    variant="contained"
                    startIcon={<AddRounded />}
                    onClick={() => openEditor()}
                  >
                    Nueva ficha
                  </Button>
                ) : undefined
              }
            />
          ) : null}
          {notice ? (
            <Alert severity="success" onClose={() => setNotice(null)}>
              {notice}
            </Alert>
          ) : null}
          {error ? (
            <Alert
              severity="error"
              onClose={() => setError(null)}
              action={
                <Button color="inherit" size="small" onClick={refreshCurrent}>
                  Reintentar
                </Button>
              }
            >
              {error}
            </Alert>
          ) : null}

          {section === "summary" ? (
            <SummarySection summary={summary} loading={loadingSummary} />
          ) : null}
          {section === "review" ? (
            <ReviewSection
              centers={centers}
              total={total}
              loading={loadingCenters}
              page={page}
              onPageChange={setPage}
              workingCode={workingCode}
              canReview={user.roles.includes("ADMINISTRADOR")}
              onReview={(center, action) => {
                setObservation("");
                setReviewIntent({ center, action });
              }}
            />
          ) : null}
          {section === "centers" ? (
            <CentersSection
              centers={centers}
              total={total}
              loading={loadingCenters}
              page={page}
              status={centerStatus}
              query={queryDraft}
              onQueryChange={setQueryDraft}
              onSearch={submitSearch}
              onStatusChange={(value) => {
                setCenterStatus(value);
                setPage(0);
              }}
              onPageChange={setPage}
              onOpen={openEditor}
            />
          ) : null}
          {section === "establishments" ? (
            <EstablishmentManagement token={accessToken ?? ""} onNotice={setNotice} />
          ) : null}
          {section === "editor" ? (
            <CenterEditor
              key={editorCode ?? "new"}
              token={accessToken ?? ""}
              code={editorCode}
              onClose={() => navigate("centers")}
              onSaved={(saved) => {
                setEditorCode(saved.code);
                setSection("editor");
              }}
              onNotice={setNotice}
            />
          ) : null}
          {section === "settings" ? (
            <SettingsSection user={user} onLogout={() => void logout()} />
          ) : null}
          {section === "catalogs" ? (
            <CatalogManagement token={accessToken ?? ""} onNotice={setNotice} />
          ) : null}
        </Stack>
      </Box>

      <Dialog
        open={reviewIntent !== null}
        onClose={() => workingCode === null && setReviewIntent(null)}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>
          {reviewIntent?.action === "APPROVE" ? "Aprobar ficha" : "Rechazar ficha"}
        </DialogTitle>
        <DialogContent>
          <Stack spacing={webTokens.spacing.control} sx={{ pt: 1 }}>
            <Typography>
              {reviewIntent?.center.name ?? "Esta ficha"} ({reviewIntent?.center.code})
            </Typography>
            <TextField
              label="Observación"
              value={observation}
              onChange={(event) => setObservation(event.target.value)}
              multiline
              minRows={3}
              helperText={
                reviewIntent?.action === "REJECT"
                  ? "Explica qué debe corregirse antes de volver a solicitar revisión."
                  : "Opcional. Puedes dejar una nota para la auditoría."
              }
              autoFocus
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setReviewIntent(null)} disabled={workingCode !== null}>
            Cancelar
          </Button>
          <Button
            onClick={() => void submitReview()}
            variant="contained"
            color={reviewIntent?.action === "REJECT" ? "error" : "primary"}
            disabled={workingCode !== null}
            startIcon={
              workingCode ? <CircularProgress size={16} /> : <CheckCircleRounded />
            }
          >
            {workingCode
              ? "Guardando…"
              : reviewIntent?.action === "APPROVE"
                ? "Aprobar"
                : "Rechazar"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

function SummarySection({
  summary,
  loading,
}: {
  summary: AdminSummary | null;
  loading: boolean;
}) {
  return (
    <Stack spacing={webTokens.spacing.section}>
      {loading && !summary ? <LinearProgress aria-label="Cargando resumen" /> : null}
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)", lg: "repeat(4, 1fr)" },
          gap: webTokens.spacing.control,
        }}
      >
        <MetricCard
          value={summary ? String(summary.total) : "—"}
          label="Centros registrados"
        />
        <MetricCard
          value={summary ? String(summary.published) : "—"}
          label="Publicados"
          color="success.main"
        />
        <MetricCard
          value={summary ? String(summary.pendingReview) : "—"}
          label="En revisión"
          color="warning.main"
        />
        <MetricCard
          value={summary ? String(summary.inactive) : "—"}
          label="Inactivos"
          color="text.secondary"
        />
      </Box>
    </Stack>
  );
}

function ReviewSection({
  centers,
  total,
  loading,
  page,
  onPageChange,
  workingCode,
  canReview,
  onReview,
}: {
  centers: AdminCenter[];
  total: number;
  loading: boolean;
  page: number;
  onPageChange: (page: number) => void;
  workingCode: string | null;
  canReview: boolean;
  onReview: (center: AdminCenter, action: "APPROVE" | "REJECT") => void;
}) {
  return (
    <FlatSurface sx={{ overflow: "hidden" }}>
      {!canReview ? (
        <Alert
          severity="info"
          sx={{ mx: webTokens.spacing.surface, mb: webTokens.spacing.control }}
        >
          Tu rol puede consultar la cola, pero no aprobar ni rechazar fichas.
        </Alert>
      ) : null}
      <CenterTable
        centers={centers}
        loading={loading}
        reviewable={canReview}
        workingCode={workingCode}
        onReview={onReview}
      />
      <PaginationFooter total={total} page={page} onPageChange={onPageChange} />
    </FlatSurface>
  );
}

function CentersSection({
  centers,
  total,
  loading,
  page,
  status,
  query,
  onQueryChange,
  onSearch,
  onStatusChange,
  onPageChange,
  onOpen,
}: {
  centers: AdminCenter[];
  total: number;
  loading: boolean;
  page: number;
  status: string;
  query: string;
  onQueryChange: (value: string) => void;
  onSearch: (event: React.FormEvent<HTMLFormElement>) => void;
  onStatusChange: (value: string) => void;
  onPageChange: (page: number) => void;
  onOpen: (code: string) => void;
}) {
  return (
    <Stack spacing={webTokens.spacing.control}>
      <Box component="form" onSubmit={onSearch}>
        <Stack
          direction={{ xs: "column", sm: "row" }}
          spacing={webTokens.spacing.control}
        >
          <SearchField
            label="Buscar por nombre o código"
            value={query}
            onChange={(event) => onQueryChange(event.target.value)}
          />
          <FormControl sx={{ minWidth: { sm: 220 } }}>
            <InputLabel id="center-status-label">Estado</InputLabel>
            <Select
              labelId="center-status-label"
              label="Estado"
              value={status}
              onChange={(event) => onStatusChange(event.target.value)}
            >
              <MenuItem value="ALL">Todos</MenuItem>
              <MenuItem value="BORRADOR">Borrador</MenuItem>
              <MenuItem value="EN_REVISION">En revisión</MenuItem>
              <MenuItem value="APROBADO">Aprobado</MenuItem>
              <MenuItem value="PUBLICADO">Publicado</MenuItem>
              <MenuItem value="RECHAZADO">Rechazado</MenuItem>
              <MenuItem value="INACTIVO">Inactivo</MenuItem>
            </Select>
          </FormControl>
        </Stack>
      </Box>
      <FlatSurface sx={{ overflow: "hidden" }}>
        <CenterTable centers={centers} loading={loading} onOpen={onOpen} />
        <PaginationFooter total={total} page={page} onPageChange={onPageChange} />
      </FlatSurface>
    </Stack>
  );
}

function SettingsSection({
  user,
  onLogout,
}: {
  user: { name: string; email: string; roles: string[] };
  onLogout: () => void;
}) {
  return (
    <Stack spacing={webTokens.spacing.control}>
      <FlatSurface padding="default">
        <Stack spacing={webTokens.spacing.control}>
          <SectionHeader
            icon={<AccountCircleRounded />}
            title="Cuenta institucional"
            description="La sesión usa una cookie de renovación protegida y un token de acceso en memoria."
          />
          <Box sx={{ display: "grid", gap: webTokens.spacing.inline }}>
            <Typography>
              <strong>Nombre:</strong> {user.name || "Sin nombre"}
            </Typography>
            <Typography>
              <strong>Correo:</strong> {user.email}
            </Typography>
            <Stack
              direction="row"
              spacing={webTokens.spacing.inline}
              flexWrap="wrap"
              useFlexGap
            >
              <Typography component="span">
                <strong>Roles:</strong>
              </Typography>
              {user.roles.map((role) => (
                <Chip key={role} label={role} size="small" />
              ))}
            </Stack>
          </Box>
          <Button
            variant="outlined"
            color="error"
            startIcon={<LogoutRounded />}
            onClick={onLogout}
            sx={{ alignSelf: "flex-start" }}
          >
            Cerrar sesión
          </Button>
        </Stack>
      </FlatSurface>
      <FlatSurface padding="default">
        <Stack spacing={webTokens.spacing.inline}>
          <SectionHeader
            icon={<SettingsRounded />}
            title="Preferencias"
            description="Elige el tema con el botón de la barra superior. MUI conserva esta preferencia localmente sin guardar credenciales."
          />
          <Box>
            <ColorModeButton />
          </Box>
        </Stack>
      </FlatSurface>
    </Stack>
  );
}

function CenterTable({
  centers,
  loading,
  reviewable = false,
  workingCode,
  onReview,
  onOpen,
}: {
  centers: AdminCenter[];
  loading: boolean;
  reviewable?: boolean;
  workingCode?: string | null;
  onReview?: (center: AdminCenter, action: "APPROVE" | "REJECT") => void;
  onOpen?: (code: string) => void;
}) {
  if (loading && centers.length === 0)
    return <ContentState status="loading" label="Cargando fichas" />;
  return (
    <TableContainer>
      <Table aria-label="Centros turísticos">
        <TableHead>
          <TableRow>
            <TableCell>Ficha</TableCell>
            <TableCell>Estado</TableCell>
            <TableCell>Actividad</TableCell>
            <TableCell>Solicitó</TableCell>
            <TableCell>Actualizada</TableCell>
            {reviewable || onOpen ? <TableCell align="right">Acciones</TableCell> : null}
          </TableRow>
        </TableHead>
        <TableBody>
          {centers.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={reviewable || onOpen ? 6 : 5}
                align="center"
                sx={{ py: webTokens.spacing.section }}
              >
                <Typography color="text.secondary">
                  No hay fichas para mostrar.
                </Typography>
              </TableCell>
            </TableRow>
          ) : (
            centers.map((center) => (
              <TableRow key={center.code} hover>
                <TableCell>
                  <Typography fontWeight={700}>{center.name}</Typography>
                  <Typography variant="caption" color="text.secondary">
                    {center.code}
                  </Typography>
                </TableCell>
                <TableCell>
                  <StatusBadge code={center.status.code} label={center.status.name} />
                </TableCell>
                <TableCell>{center.active ? "Activa" : "Inactiva"}</TableCell>
                <TableCell>{center.requestedBy ?? "—"}</TableCell>
                <TableCell>{formatDate(center.updatedAt)}</TableCell>
                {reviewable && onReview ? (
                  <TableCell align="right">
                    <Stack
                      direction={{ xs: "column", sm: "row" }}
                      spacing={webTokens.spacing.inline}
                      justifyContent="flex-end"
                    >
                      {onOpen ? (
                        <Button
                          size="small"
                          variant="text"
                          onClick={() => onOpen(center.code)}
                        >
                          Ver ficha
                        </Button>
                      ) : null}
                      <Button
                        size="small"
                        variant="contained"
                        disabled={workingCode !== null}
                        onClick={() => onReview(center, "APPROVE")}
                      >
                        Aprobar
                      </Button>
                      <Button
                        size="small"
                        color="error"
                        variant="text"
                        disabled={workingCode !== null}
                        onClick={() => onReview(center, "REJECT")}
                      >
                        Rechazar
                      </Button>
                    </Stack>
                  </TableCell>
                ) : onOpen ? (
                  <TableCell align="right">
                    <Tooltip title="Editar">
                      <IconButton
                        aria-label={`Editar ${center.name}`}
                        onClick={() => onOpen(center.code)}
                      >
                        <EditRounded fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                ) : null}
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </TableContainer>
  );
}

function PaginationFooter({
  total,
  page,
  onPageChange,
}: {
  total: number;
  page: number;
  onPageChange: (page: number) => void;
}) {
  const lastPage = Math.max(Math.ceil(total / pageSize) - 1, 0);
  return (
    <Stack
      direction="row"
      alignItems="center"
      justifyContent="space-between"
      sx={{
        p: webTokens.spacing.tableFooter,
        borderTop: "1px solid var(--mui-palette-divider)",
      }}
    >
      <Typography variant="body2" color="text.secondary">
        {total === 0
          ? "0 resultados"
          : `${page * pageSize + 1}–${Math.min((page + 1) * pageSize, total)} de ${total}`}
      </Typography>
      <Stack direction="row">
        <Tooltip title="Página anterior">
          <span>
            <IconButton
              aria-label="Página anterior"
              onClick={() => onPageChange(page - 1)}
              disabled={page <= 0}
            >
              <ChevronLeftRounded />
            </IconButton>
          </span>
        </Tooltip>
        <Tooltip title="Página siguiente">
          <span>
            <IconButton
              aria-label="Página siguiente"
              onClick={() => onPageChange(page + 1)}
              disabled={page >= lastPage}
            >
              <ChevronRightRounded />
            </IconButton>
          </span>
        </Tooltip>
      </Stack>
    </Stack>
  );
}

function ColorModeButton() {
  const { mode, setMode } = useColorScheme();
  const dark = mode === "dark";
  return (
    <Tooltip title={dark ? "Tema claro" : "Tema oscuro"}>
      <span>
        <IconButton
          onClick={() => setMode(dark ? "light" : "dark")}
          disabled={mode === undefined}
          aria-label={dark ? "Cambiar a tema claro" : "Cambiar a tema oscuro"}
        >
          {dark ? <LightModeRounded /> : <DarkModeRounded />}
        </IconButton>
      </span>
    </Tooltip>
  );
}

function formatDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "—" : date.toLocaleDateString("es-EC");
}

function AdminAccessDenied({ onLogout }: { onLogout: () => void }) {
  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        p: webTokens.spacing.surface,
      }}
    >
      <FlatSurface sx={{ width: "100%", maxWidth: 520 }} padding="default">
        <Stack spacing={webTokens.spacing.control}>
          <Typography variant="h5" component="h1">
            Acceso no autorizado
          </Typography>
          <Alert severity="warning">
            Esta cuenta es de turista. El panel institucional está reservado para
            administradores.
          </Alert>
          <Button variant="outlined" onClick={onLogout} sx={{ alignSelf: "flex-start" }}>
            Cerrar sesión
          </Button>
        </Stack>
      </FlatSurface>
    </Box>
  );
}
