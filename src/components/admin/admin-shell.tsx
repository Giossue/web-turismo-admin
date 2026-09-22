"use client";

import AssessmentRounded from "@mui/icons-material/AssessmentRounded";
import AccountCircleRounded from "@mui/icons-material/AccountCircleRounded";
import AddRounded from "@mui/icons-material/AddRounded";
import CheckCircleRounded from "@mui/icons-material/CheckCircleRounded";
import CategoryRounded from "@mui/icons-material/CategoryRounded";
import DarkModeRounded from "@mui/icons-material/DarkModeRounded";
import EditRounded from "@mui/icons-material/EditRounded";
import FactCheckRounded from "@mui/icons-material/FactCheckRounded";
import LightModeRounded from "@mui/icons-material/LightModeRounded";
import LogoutRounded from "@mui/icons-material/LogoutRounded";
import MenuRounded from "@mui/icons-material/MenuRounded";
import PlaceRounded from "@mui/icons-material/PlaceRounded";
import RateReviewRounded from "@mui/icons-material/RateReviewRounded";
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
  Snackbar,
  Stack,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Toolbar,
  Typography,
} from "@mui/material";
import { useColorScheme } from "@mui/material/styles";
import { useCallback, useEffect, useRef, useState } from "react";

import { FlatSurface } from "@/components/ui/flat-surface";
import {
  AdminTable,
  AdminTableFooter,
  AdminTableToolbar,
  ADMIN_TABLE_PAGE_SIZE,
} from "@/components/ui/admin-table";
import { MetricCard } from "@/components/ui/metric-card";
import { PageHeader } from "@/components/ui/page-header";
import { SearchField } from "@/components/ui/search-field";
import { SectionHeader } from "@/components/ui/section-header";
import { StatusBadge } from "@/components/ui/status-badge";
import { CenterEditor } from "@/components/admin/center-editor";
import { CatalogManagement } from "@/components/admin/catalog-management";
import {
  EstablishmentManagement,
  type EstablishmentManagementRef,
} from "@/components/admin/establishment-management";
import { OpinionManagement } from "@/components/admin/opinion-management";
import {
  getAdminCenters,
  getAdminEstablishments,
  getAdminSummary,
  reviewAdminCenter,
  reviewAdminEstablishment,
  type AdminCenter,
  type AdminEstablishment,
  type AdminSummary,
} from "@/lib/admin-api";
import { AdminLogin, useAdminAuth } from "@/lib/auth";
import { webTokens } from "@/theme/tokens";
import { ADMIN_SEARCH_DEBOUNCE_MS, useDebouncedValue } from "@/lib/use-debounced-value";

const drawerWidth = webTokens.layout.drawerWidth;
const pageSize = ADMIN_TABLE_PAGE_SIZE;

type AdminSection =
  | "summary"
  | "review"
  | "opinions"
  | "centers"
  | "establishments"
  | "catalogs"
  | "editor"
  | "settings";
type ReviewIntent = { center: AdminCenter; action: "APPROVE" | "REJECT" };
type EstablishmentReviewIntent = {
  establishment: AdminEstablishment;
  action: "APPROVE" | "REJECT";
};

const sectionMeta: Record<AdminSection, { title: string; description: string }> = {
  summary: {
    title: "Resumen",
    description: "Una vista rápida del inventario y su estado de publicación.",
  },
  review: {
    title: "Revisión de fichas",
    description:
      "Revisa propuestas y conserva visibles las fichas que ya fueron aprobadas.",
  },
  opinions: {
    title: "Opiniones",
    description:
      "Modera las opiniones de visitantes y conserva la versión publicada mientras una edición está pendiente.",
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
    value === "opinions" ||
    value === "centers" ||
    value === "establishments" ||
    value === "catalogs" ||
    value === "editor" ||
    value === "settings"
  );
}

export function AdminShell() {
  const { accessToken, ready, user, logout } = useAdminAuth();
  const isAdmin = Boolean(user?.roles.includes("ADMINISTRADOR"));
  const canOperate = Boolean(
    user?.roles.some((role) => role === "ADMINISTRADOR" || role === "AGENTE_TURISTICO"),
  );
  const [open, setOpen] = useState(false);
  const establishmentRef = useRef<EstablishmentManagementRef>(null);
  const [section, setSection] = useState<AdminSection>(() => {
    if (typeof window === "undefined") return "summary";
    const fromUrl = new URLSearchParams(window.location.search).get("section");
    return isAdminSection(fromUrl) ? fromUrl : "summary";
  });
  const effectiveSection =
    !isAdmin && ["summary", "review", "opinions", "catalogs"].includes(section)
      ? "centers"
      : section;
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
  const [queryDraft, setQueryDraft] = useState(() => {
    if (typeof window === "undefined") return "";
    const value = new URLSearchParams(window.location.search).get("q") ?? "";
    return value.length >= 2 ? value : "";
  });
  const debouncedCenterQuery = useDebouncedValue(
    queryDraft.trim(),
    ADMIN_SEARCH_DEBOUNCE_MS,
  );
  const centerQuery =
    queryDraft.trim().length < 2 || debouncedCenterQuery.length < 2
      ? ""
      : debouncedCenterQuery;
  const [loadingSummary, setLoadingSummary] = useState(false);
  const [loadingCenters, setLoadingCenters] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [workingCode, setWorkingCode] = useState<string | null>(null);
  const [reviewIntent, setReviewIntent] = useState<ReviewIntent | null>(null);
  const [establishmentReviewIntent, setEstablishmentReviewIntent] =
    useState<EstablishmentReviewIntent | null>(null);
  const [reviewEstablishments, setReviewEstablishments] = useState<AdminEstablishment[]>(
    [],
  );
  const [reviewEstablishmentsTotal, setReviewEstablishmentsTotal] = useState(0);
  const [loadingReviewEstablishments, setLoadingReviewEstablishments] = useState(false);
  const [workingEstablishmentId, setWorkingEstablishmentId] = useState<number | null>(
    null,
  );
  const [observation, setObservation] = useState("");
  const centersRequestId = useRef(0);

  const loadReviewEstablishments = useCallback(async (token: string, offset: number) => {
    setLoadingReviewEstablishments(true);
    try {
      const result = await getAdminEstablishments(token, {
        reviewStatus: "EN_REVISION",
        limit: pageSize,
        offset,
      });
      setReviewEstablishments(result.items);
      setReviewEstablishmentsTotal(result.total);
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "No se pudieron cargar los catastros en revisión.",
      );
    } finally {
      setLoadingReviewEstablishments(false);
    }
  }, []);

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
      const requestId = ++centersRequestId.current;
      setLoadingCenters(true);
      setError(null);
      try {
        const result = await getAdminCenters(token, {
          status,
          q,
          limit: pageSize,
          offset,
        });
        if (requestId !== centersRequestId.current) return;
        setCenters(result.items);
        setTotal(result.total);
      } catch (cause) {
        if (requestId !== centersRequestId.current) return;
        setError(
          cause instanceof Error ? cause.message : "No se pudieron cargar las fichas.",
        );
      } finally {
        if (requestId === centersRequestId.current) setLoadingCenters(false);
      }
    },
    [],
  );

  useEffect(() => {
    if (!accessToken || !isAdmin) return;
    void Promise.resolve().then(() => loadSummary(accessToken));
  }, [accessToken, isAdmin, loadSummary]);

  useEffect(() => {
    if (
      !accessToken ||
      !canOperate ||
      (effectiveSection !== "review" && effectiveSection !== "centers")
    )
      return;
    const status = effectiveSection === "review" ? "REVIEW_QUEUE" : centerStatus;
    void Promise.resolve().then(() =>
      loadCenters(accessToken, status, centerQuery, page * pageSize),
    );
  }, [
    accessToken,
    canOperate,
    centerQuery,
    centerStatus,
    effectiveSection,
    loadCenters,
    page,
  ]);

  useEffect(() => {
    if (!accessToken || !isAdmin || effectiveSection !== "review") return;
    void Promise.resolve().then(() =>
      loadReviewEstablishments(accessToken, page * pageSize),
    );
  }, [accessToken, effectiveSection, isAdmin, loadReviewEstablishments, page]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    params.set("section", effectiveSection);
    if (effectiveSection === "centers" && centerStatus !== "ALL")
      params.set("status", centerStatus);
    else params.delete("status");
    if (effectiveSection === "centers" && centerQuery) params.set("q", centerQuery);
    else params.delete("q");
    if (effectiveSection === "editor" && editorCode) params.set("code", editorCode);
    else params.delete("code");
    if (page > 0 && effectiveSection !== "settings") params.set("page", String(page + 1));
    else params.delete("page");
    window.history.replaceState(
      null,
      "",
      `${window.location.pathname}?${params.toString()}`,
    );
  }, [centerQuery, centerStatus, editorCode, effectiveSection, page]);

  function navigate(next: AdminSection) {
    setSection(next);
    setOpen(false);
    setError(null);
    setNotice(null);
    if (next !== "editor") setEditorCode(null);
    if (next !== "centers") {
      setPage(0);
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
        loadCenters(accessToken, "REVIEW_QUEUE", "", 0),
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

  async function submitEstablishmentReview() {
    if (!accessToken || !establishmentReviewIntent) return;
    setWorkingEstablishmentId(establishmentReviewIntent.establishment.id);
    setError(null);
    try {
      await reviewAdminEstablishment(
        accessToken,
        establishmentReviewIntent.establishment.id,
        establishmentReviewIntent.action,
        observation.trim() || undefined,
      );
      setEstablishmentReviewIntent(null);
      setObservation("");
      setNotice(
        establishmentReviewIntent.action === "APPROVE"
          ? "El catastro fue aprobado y publicado."
          : "El catastro fue rechazado y la observación quedó registrada.",
      );
      await loadReviewEstablishments(accessToken, page * pageSize);
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "No se pudo actualizar el catastro.",
      );
    } finally {
      setWorkingEstablishmentId(null);
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
  if (!canOperate) {
    return <AdminAccessDenied onLogout={() => void logout()} />;
  }

  const navItems: Array<{ key: AdminSection; label: string; icon: React.ReactNode }> =
    isAdmin
      ? [
          { key: "summary", label: "Resumen", icon: <AssessmentRounded /> },
          { key: "review", label: "Revisión de fichas", icon: <FactCheckRounded /> },
          { key: "opinions", label: "Opiniones", icon: <RateReviewRounded /> },
          { key: "centers", label: "Centros turísticos", icon: <PlaceRounded /> },
          { key: "establishments", label: "Catastro", icon: <StorefrontRounded /> },
          { key: "catalogs", label: "Catálogos", icon: <CategoryRounded /> },
          { key: "settings", label: "Configuración", icon: <SettingsRounded /> },
        ]
      : [
          { key: "centers", label: "Mis centros turísticos", icon: <PlaceRounded /> },
          { key: "establishments", label: "Mi catastro", icon: <StorefrontRounded /> },
          { key: "settings", label: "Configuración", icon: <SettingsRounded /> },
        ];
  const meta = sectionMeta[effectiveSection];
  const editorMode = effectiveSection === "editor";

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
            selected={effectiveSection === item.key}
            onClick={() => navigate(item.key)}
            aria-current={effectiveSection === item.key ? "page" : undefined}
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
          {effectiveSection !== "editor" ? (
            <PageHeader
              title={meta.title}
              description={meta.description}
              actions={
                effectiveSection === "centers" ? (
                  <Button
                    variant="contained"
                    startIcon={<AddRounded />}
                    onClick={() => openEditor()}
                  >
                    Nueva ficha
                  </Button>
                ) : effectiveSection === "establishments" ? (
                  <Button
                    variant="contained"
                    startIcon={<AddRounded />}
                    onClick={() => establishmentRef.current?.openCreate()}
                  >
                    Nuevo establecimiento
                  </Button>
                ) : undefined
              }
            />
          ) : null}
          {effectiveSection === "summary" ? (
            <SummarySection summary={summary} loading={loadingSummary} />
          ) : null}
          {effectiveSection === "review" ? (
            <ReviewSection
              centers={centers}
              total={total}
              loading={loadingCenters}
              page={page}
              onPageChange={setPage}
              workingCode={workingCode}
              canReview={isAdmin}
              onOpen={openEditor}
              establishments={reviewEstablishments}
              establishmentsTotal={reviewEstablishmentsTotal}
              loadingEstablishments={loadingReviewEstablishments}
              workingEstablishmentId={workingEstablishmentId}
              onReviewEstablishment={(establishment, action) => {
                setObservation("");
                setEstablishmentReviewIntent({ establishment, action });
              }}
              onReview={(center, action) => {
                setObservation("");
                setReviewIntent({ center, action });
              }}
            />
          ) : null}
          {effectiveSection === "opinions" ? (
            <OpinionManagement
              token={accessToken ?? ""}
              onNotice={setNotice}
              onError={setError}
            />
          ) : null}
          {effectiveSection === "centers" ? (
            <CentersSection
              centers={centers}
              total={total}
              loading={loadingCenters}
              page={page}
              status={centerStatus}
              query={queryDraft}
              onQueryChange={(value) => {
                setQueryDraft(value);
                setPage(0);
              }}
              onStatusChange={(value) => {
                setCenterStatus(value);
                setPage(0);
              }}
              onPageChange={setPage}
              onOpen={openEditor}
            />
          ) : null}
          {effectiveSection === "establishments" ? (
            <EstablishmentManagement
              ref={establishmentRef}
              token={accessToken ?? ""}
              onNotice={setNotice}
              onError={setError}
              canManageStatus={isAdmin}
            />
          ) : null}
          {effectiveSection === "editor" ? (
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
              onError={setError}
            />
          ) : null}
          {effectiveSection === "settings" ? (
            <SettingsSection user={user} onLogout={() => void logout()} />
          ) : null}
          {effectiveSection === "catalogs" ? (
            <CatalogManagement
              token={accessToken ?? ""}
              onNotice={setNotice}
              onError={setError}
            />
          ) : null}
        </Stack>
      </Box>

      <Snackbar
        key={`${error ? "error" : "success"}:${error ?? notice}`}
        open={Boolean(error || notice)}
        autoHideDuration={3_000}
        onClose={(_, reason) => {
          if (reason === "clickaway") return;
          setError(null);
          setNotice(null);
        }}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
        sx={{ top: { xs: 72, sm: 80 } }}
      >
        <Alert
          severity={error ? "error" : "success"}
          variant="filled"
          sx={{ width: "100%", alignItems: "center", border: 0 }}
        >
          {error ?? notice}
        </Alert>
      </Snackbar>

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

      <Dialog
        open={establishmentReviewIntent !== null}
        onClose={() =>
          workingEstablishmentId === null && setEstablishmentReviewIntent(null)
        }
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>
          {establishmentReviewIntent?.action === "APPROVE"
            ? "Aprobar catastro"
            : "Rechazar catastro"}
        </DialogTitle>
        <DialogContent>
          <Stack spacing={webTokens.spacing.control} sx={{ pt: 1 }}>
            <Typography>
              {establishmentReviewIntent?.establishment.nombreComercial ??
                "Este catastro"}
            </Typography>
            <TextField
              label="Observación"
              value={observation}
              onChange={(event) => setObservation(event.target.value)}
              multiline
              minRows={3}
              helperText={
                establishmentReviewIntent?.action === "REJECT"
                  ? "Explica qué debe corregirse antes de volver a solicitar revisión."
                  : "Opcional. Puedes dejar una nota para la auditoría."
              }
              autoFocus
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setEstablishmentReviewIntent(null)}
            disabled={workingEstablishmentId !== null}
          >
            Cancelar
          </Button>
          <Button
            onClick={() => void submitEstablishmentReview()}
            variant="contained"
            color={establishmentReviewIntent?.action === "REJECT" ? "error" : "primary"}
            disabled={workingEstablishmentId !== null}
            startIcon={
              workingEstablishmentId ? (
                <CircularProgress size={16} />
              ) : (
                <CheckCircleRounded />
              )
            }
          >
            {workingEstablishmentId
              ? "Guardando…"
              : establishmentReviewIntent?.action === "APPROVE"
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
  establishments,
  establishmentsTotal,
  total,
  loading,
  loadingEstablishments,
  page,
  onPageChange,
  workingCode,
  workingEstablishmentId,
  canReview,
  onOpen,
  onReview,
  onReviewEstablishment,
}: {
  centers: AdminCenter[];
  establishments: AdminEstablishment[];
  establishmentsTotal: number;
  total: number;
  loading: boolean;
  loadingEstablishments: boolean;
  page: number;
  onPageChange: (page: number) => void;
  workingCode: string | null;
  workingEstablishmentId: number | null;
  canReview: boolean;
  onOpen: (code: string) => void;
  onReview: (center: AdminCenter, action: "APPROVE" | "REJECT") => void;
  onReviewEstablishment: (
    establishment: AdminEstablishment,
    action: "APPROVE" | "REJECT",
  ) => void;
}) {
  return (
    <Stack spacing={webTokens.spacing.control}>
      {!canReview ? (
        <Alert severity="info">
          Tu rol puede consultar la cola, pero no aprobar ni rechazar fichas.
        </Alert>
      ) : null}
      <CenterTable
        centers={centers}
        loading={loading}
        reviewable={canReview}
        workingCode={workingCode}
        onOpen={onOpen}
        onReview={onReview}
        footer={
          <AdminTableFooter
            total={total}
            page={page}
            pageSize={pageSize}
            onPageChange={onPageChange}
          />
        }
      />
      <Typography variant="h6" sx={{ mt: 2 }}>
        Catastros en revisión
      </Typography>
      <EstablishmentReviewTable
        establishments={establishments}
        total={establishmentsTotal}
        loading={loadingEstablishments}
        page={page}
        onPageChange={onPageChange}
        reviewable={canReview}
        workingId={workingEstablishmentId}
        onReview={onReviewEstablishment}
      />
    </Stack>
  );
}

function EstablishmentReviewTable({
  establishments,
  total,
  loading,
  page,
  onPageChange,
  reviewable,
  workingId,
  onReview,
}: {
  establishments: AdminEstablishment[];
  total: number;
  loading: boolean;
  page: number;
  onPageChange: (page: number) => void;
  reviewable: boolean;
  workingId: number | null;
  onReview: (establishment: AdminEstablishment, action: "APPROVE" | "REJECT") => void;
}) {
  const [detail, setDetail] = useState<AdminEstablishment | null>(null);

  return (
    <>
      <AdminTable
        ariaLabel="Catastros en revisión"
        minWidth={900}
        loading={loading}
        empty={!loading && establishments.length === 0}
        emptyMessage="No hay catastros pendientes de revisión."
        footer={
          <AdminTableFooter
            total={total}
            page={page}
            pageSize={pageSize}
            onPageChange={onPageChange}
          />
        }
      >
        <TableHead>
          <TableRow>
            <TableCell>Establecimiento</TableCell>
            <TableCell>Ubicación</TableCell>
            <TableCell>Actividad / clasificación</TableCell>
            <TableCell>Registro y RUC</TableCell>
            <TableCell>Enviado por</TableCell>
            <TableCell align="right">Acciones</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {establishments.map((item) => (
            <TableRow key={item.id} hover>
              <TableCell>
                <Typography fontWeight={600}>{item.nombreComercial}</Typography>
                <Typography variant="caption" color="text.secondary">
                  {item.categoriaEtiqueta ?? item.categoria ?? "Sin categoría"}
                </Typography>
              </TableCell>
              <TableCell>
                {item.localityName}, {item.cantonName}
              </TableCell>
              <TableCell>
                {item.actividad}
                <Typography variant="caption" display="block" color="text.secondary">
                  {item.clasificacion ?? "Sin clasificación"}
                </Typography>
              </TableCell>
              <TableCell>
                {item.numeroRegistro ?? "Sin registro"}
                <Typography variant="caption" display="block" color="text.secondary">
                  RUC: {item.ruc ?? "—"}
                </Typography>
              </TableCell>
              <TableCell>{item.requestedBy ?? "—"}</TableCell>
              <TableCell align="right">
                <Button size="small" onClick={() => setDetail(item)}>
                  Ver detalle
                </Button>
                {reviewable ? (
                  <Stack direction="row" justifyContent="flex-end" spacing={0.5}>
                    <Button
                      size="small"
                      color="error"
                      onClick={() => onReview(item, "REJECT")}
                      disabled={workingId === item.id}
                    >
                      Rechazar
                    </Button>
                    <Button
                      size="small"
                      variant="contained"
                      onClick={() => onReview(item, "APPROVE")}
                      disabled={workingId === item.id}
                    >
                      Aprobar
                    </Button>
                  </Stack>
                ) : null}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </AdminTable>
      <Dialog
        open={detail !== null}
        onClose={() => setDetail(null)}
        fullWidth
        maxWidth="md"
      >
        <DialogTitle>Detalle completo del catastro</DialogTitle>
        <DialogContent>
          {detail ? (
            <Stack spacing={1.25} sx={{ pt: 1 }}>
              <Typography variant="h6">{detail.nombreComercial}</Typography>
              <Typography>
                <strong>Razón social:</strong> {detail.razonSocial ?? "—"}
              </Typography>
              <Typography>
                <strong>Actividad:</strong> {detail.actividad}
              </Typography>
              <Typography>
                <strong>Clasificación:</strong> {detail.clasificacion ?? "—"}
              </Typography>
              <Typography>
                <strong>Categoría:</strong>{" "}
                {detail.categoriaEtiqueta ?? detail.categoria ?? "—"}
              </Typography>
              <Typography>
                <strong>Semántica:</strong> {detail.esquemaCategoria ?? "—"}
                {detail.valorCategoria !== null && detail.valorCategoria !== undefined
                  ? ` · valor ${detail.valorCategoria}`
                  : ""}
              </Typography>
              <Typography>
                <strong>Localidad:</strong> {detail.localityName} · {detail.localityType}
              </Typography>
              <Typography>
                <strong>Cantón / provincia:</strong> {detail.cantonName} ·{" "}
                {detail.provinceName}
              </Typography>
              <Typography>
                <strong>Registro:</strong> {detail.numeroRegistro ?? "—"} ·{" "}
                <strong>RUC:</strong> {detail.ruc ?? "—"}
              </Typography>
              <Typography>
                <strong>Dirección:</strong> {detail.direccion ?? "—"}
              </Typography>
              <Typography>
                <strong>Teléfono:</strong> {detail.telefono ?? "—"}
              </Typography>
              <Typography>
                <strong>Coordenadas:</strong> {detail.latitude}, {detail.longitude}
              </Typography>
              <Typography>
                <strong>Enviado por:</strong> {detail.requestedBy ?? "—"}
              </Typography>
              <Typography>
                <strong>Estado:</strong> {reviewEstablishmentLabel(detail.reviewStatus)}
              </Typography>
              <Typography>
                <strong>Fecha de envío:</strong> {formatDate(detail.requestedAt ?? "")}
              </Typography>
              <Typography>
                <strong>Fecha de revisión:</strong> {formatDate(detail.reviewedAt ?? "")}
              </Typography>
              <Typography>
                <strong>Observación:</strong> {detail.reviewObservation ?? "—"}
              </Typography>
            </Stack>
          ) : null}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDetail(null)}>Cerrar</Button>
        </DialogActions>
      </Dialog>
    </>
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
  onStatusChange: (value: string) => void;
  onPageChange: (page: number) => void;
  onOpen: (code: string) => void;
}) {
  return (
    <Stack spacing={webTokens.spacing.control}>
      <AdminTableToolbar>
        <Stack
          direction={{ xs: "column", sm: "row" }}
          spacing={webTokens.spacing.control}
        >
          <SearchField
            label="Buscar por nombre o código"
            value={query}
            onChange={(event) => {
              onQueryChange(event.target.value);
            }}
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
      </AdminTableToolbar>
      <CenterTable
        centers={centers}
        loading={loading}
        onOpen={onOpen}
        footer={
          <AdminTableFooter
            total={total}
            page={page}
            pageSize={pageSize}
            onPageChange={onPageChange}
          />
        }
      />
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
  footer,
}: {
  centers: AdminCenter[];
  loading: boolean;
  reviewable?: boolean;
  workingCode?: string | null;
  onReview?: (center: AdminCenter, action: "APPROVE" | "REJECT") => void;
  onOpen?: (code: string) => void;
  footer?: React.ReactNode;
}) {
  return (
    <AdminTable
      ariaLabel="Centros turísticos"
      minWidth={reviewable ? 860 : 760}
      loading={loading && centers.length === 0}
      empty={!loading && centers.length === 0}
      emptyMessage="No hay fichas para mostrar."
      footer={footer}
    >
      <TableHead>
        <TableRow>
          <TableCell>Ficha</TableCell>
          <TableCell>Estado</TableCell>
          <TableCell>Estado operativo</TableCell>
          <TableCell>Solicitó</TableCell>
          <TableCell>Actualizada</TableCell>
          {reviewable || onOpen ? <TableCell align="right">Acciones</TableCell> : null}
        </TableRow>
      </TableHead>
      <TableBody>
        {centers.map((center) => (
          <TableRow key={center.code} hover>
            <TableCell component="th" scope="row">
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
                {center.status.code === "EN_REVISION" ? (
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
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    Aprobada
                  </Typography>
                )}
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
        ))}
      </TableBody>
    </AdminTable>
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

function reviewEstablishmentLabel(status: AdminEstablishment["reviewStatus"]) {
  return {
    BORRADOR: "Borrador",
    EN_REVISION: "En revisión",
    PUBLICADO: "Publicado",
    RECHAZADO: "Rechazado",
  }[status];
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
