"use client";

import AddRounded from "@mui/icons-material/AddRounded";
import DownloadRounded from "@mui/icons-material/DownloadRounded";
import MenuRounded from "@mui/icons-material/MenuRounded";
import { Box, Button, IconButton, Stack, Tooltip } from "@mui/material";
import { useQueryClient } from "@tanstack/react-query";
import { useCallback, useRef, useState } from "react";

import {
  AdminFeedbackProvider,
  useAdminFeedback,
} from "@/components/admin/admin-feedback";
import { AdminLogin } from "@/components/admin/admin-login";
import { CatalogManagement } from "@/components/admin/catalog-management";
import { CenterEditor } from "@/components/admin/center-editor";
import {
  EstablishmentManagement,
  type EstablishmentManagementRef,
} from "@/components/admin/establishment-management";
import { OpinionManagement } from "@/components/admin/opinion-management";
import { LoadingState } from "@/components/ui/loading-state";
import { PageHeader } from "@/components/ui/page-header";
import type { AdminCenterDetail } from "@/lib/admin-api";
import { adminKeys } from "@/lib/admin-queries";
import {
  canOperatePanel,
  isAdministrator,
  useAdminAuth,
  type AdminUser,
} from "@/lib/auth";
import { webTokens } from "@/theme/tokens";
import { AdminAccessDenied } from "./shell/admin-access-denied";
import { AdminNavigation, drawerWidth } from "./shell/admin-navigation";
import { CentersSection } from "./shell/centers-section";
import { ActivitySection } from "./shell/activity-section";
import { ReviewSection } from "./shell/review-section";
import { UsersSection } from "./shell/users-section";
import { adminSectionConfig, navigationItems, type AdminSection } from "./shell/sections";
import { SettingsSection } from "./shell/settings-section";
import { SummarySection } from "./shell/summary-section";
import { useAdminUrlState } from "./shell/use-admin-url-state";
import { useAdminNotifications } from "./shell/use-admin-notifications";

export function AdminShell() {
  const { ready, user, logout } = useAdminAuth();

  if (!ready) return <AdminSessionLoading />;
  if (!user) return <AdminLogin />;
  if (!canOperatePanel(user)) {
    return <AdminAccessDenied onLogout={() => void logout()} />;
  }
  // La key reinicia el estado local (filtros, diálogos, avisos) al cambiar de cuenta.
  return (
    <AdminFeedbackProvider key={user.id}>
      <AdminWorkspace user={user} />
    </AdminFeedbackProvider>
  );
}

export function AdminSessionLoading() {
  return (
    <Box sx={{ minHeight: "100vh", display: "grid", placeItems: "center" }}>
      <LoadingState label="Cargando sesión" />
    </Box>
  );
}

function AdminWorkspace({ user }: { user: AdminUser }) {
  const { accessToken, logout } = useAdminAuth();
  const token = accessToken ?? "";
  const isAdmin = isAdministrator(user);
  const feedback = useAdminFeedback();
  const queryClient = useQueryClient();
  const nav = useAdminUrlState(isAdmin);
  const { section, state } = nav;
  const notifications = useAdminNotifications(token, user.id, section);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const establishmentRef = useRef<EstablishmentManagementRef>(null);
  const editorMode = section === "editor";
  const meta = adminSectionConfig[section];

  const { navigate: navigateTo, openEditor: openEditorWith, editorSaved } = nav;
  const navigate = useCallback(
    (next: AdminSection) => {
      navigateTo(next);
      setDrawerOpen(false);
      feedback.clear();
    },
    [feedback, navigateTo],
  );
  const openEditor = useCallback(
    (code?: string) => {
      openEditorWith(code);
      setDrawerOpen(false);
      feedback.clear();
    },
    [feedback, openEditorWith],
  );
  const closeEditor = useCallback(() => navigate("centers"), [navigate]);
  const goToReview = useCallback(() => navigate("review"), [navigate]);
  // Estable durante una sesión del editor: el primer guardado de una ficha nueva
  // solo actualiza el código, sin remontar el editor (su key es la sesión).
  const editorSession = state.editorSession;
  const handleEditorSaved = useCallback(
    (saved: AdminCenterDetail) => {
      editorSaved(saved.code, editorSession);
      // Los listados y el resumen se recargan cuando vuelvan a mostrarse.
      for (const queryKey of [adminKeys.allCenters(), adminKeys.summary()]) {
        void queryClient.invalidateQueries({ queryKey, refetchType: "none" });
      }
      void queryClient.invalidateQueries({
        queryKey: adminKeys.allNavigationSummaries(),
      });
    },
    [editorSaved, editorSession, queryClient],
  );
  const handleLogout = useCallback(() => void logout(), [logout]);

  const headerAction =
    section === "centers" ? (
      <>
        <Button
          component="a"
          href="/templates/ficha-mintur-vacia.xlsm"
          download="Ficha_MINTUR_vacia.xlsm"
          variant="outlined"
          startIcon={<DownloadRounded />}
        >
          Descargar plantilla
        </Button>
        <Button
          variant="contained"
          startIcon={<AddRounded />}
          onClick={() => openEditor()}
        >
          Nueva ficha
        </Button>
      </>
    ) : section === "establishments" ? (
      <Button
        variant="contained"
        startIcon={<AddRounded />}
        onClick={() => establishmentRef.current?.openCreate()}
      >
        Nuevo establecimiento
      </Button>
    ) : undefined;

  return (
    <Box sx={{ display: "flex", minHeight: "100vh", bgcolor: "background.default" }}>
      {!editorMode ? (
        <AdminNavigation
          user={user}
          items={navigationItems(isAdmin)}
          selected={section}
          notifications={notifications}
          onSelect={navigate}
          onLogout={handleLogout}
          mobileOpen={drawerOpen}
          onMobileClose={() => setDrawerOpen(false)}
        />
      ) : null}

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: webTokens.spacing.page,
          pb: 5,
          bgcolor: "background.default",
          ml: editorMode ? 0 : { md: `${drawerWidth}px` },
          minWidth: 0,
        }}
      >
        <Stack spacing={webTokens.spacing.section}>
          {!editorMode ? (
            <Stack
              direction="row"
              alignItems="flex-start"
              spacing={webTokens.spacing.control}
              useFlexGap
            >
              <Tooltip title="Abrir menú">
                <IconButton
                  onClick={() => setDrawerOpen(true)}
                  aria-label="Abrir menú"
                  sx={{ display: { xs: "inline-flex", md: "none" }, flexShrink: 0 }}
                >
                  <MenuRounded />
                </IconButton>
              </Tooltip>
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <PageHeader
                  title={meta.title}
                  description={meta.description}
                  actions={headerAction}
                />
              </Box>
            </Stack>
          ) : null}
          {section === "summary" ? <SummarySection token={token} /> : null}
          {section === "review" ? (
            <ReviewSection
              token={token}
              centersPage={state.reviewCentersPage}
              establishmentsPage={state.reviewEstablishmentsPage}
              onCentersPageChange={nav.setReviewCentersPage}
              onEstablishmentsPageChange={nav.setReviewEstablishmentsPage}
              onOpen={openEditor}
            />
          ) : null}
          {section === "opinions" ? <OpinionManagement token={token} /> : null}
          {section === "activity" ? (
            <ActivitySection
              token={token}
              query={state.activityQueryDraft}
              appliedQuery={nav.activityQuery}
              type={state.activityType}
              from={state.activityFrom}
              to={state.activityTo}
              page={state.activityPage}
              onQueryChange={nav.setActivityQueryDraft}
              onTypeChange={nav.setActivityType}
              onFromChange={nav.setActivityFrom}
              onToChange={nav.setActivityTo}
              onPageChange={nav.setActivityPage}
            />
          ) : null}
          {section === "centers" ? (
            <CentersSection
              token={token}
              canDelete={isAdmin}
              status={state.centerStatus}
              query={state.queryDraft}
              appliedQuery={nav.centerQuery}
              page={state.centersPage}
              onQueryChange={nav.setQueryDraft}
              onStatusChange={nav.setCenterStatus}
              onPageChange={nav.setCentersPage}
              onOpen={openEditor}
              onGoToReview={isAdmin ? goToReview : undefined}
            />
          ) : null}
          {section === "establishments" ? (
            <EstablishmentManagement
              ref={establishmentRef}
              token={token}
              onNotice={feedback.showNotice}
              onError={feedback.showError}
              canManageStatus={isAdmin}
            />
          ) : null}
          {section === "editor" ? (
            <CenterEditor
              key={editorSession}
              token={token}
              code={state.editorCode}
              onClose={closeEditor}
              onSaved={handleEditorSaved}
              onNotice={feedback.showNotice}
              onError={feedback.showError}
            />
          ) : null}
          {section === "settings" ? <SettingsSection user={user} /> : null}
          {section === "catalogs" ? (
            <CatalogManagement
              token={token}
              onNotice={feedback.showNotice}
              onError={feedback.showError}
            />
          ) : null}
          {section === "users" ? (
            <UsersSection
              token={token}
              query={state.usersQueryDraft}
              appliedQuery={nav.usersQuery}
              page={state.usersPage}
              onQueryChange={nav.setUsersQueryDraft}
              onPageChange={nav.setUsersPage}
            />
          ) : null}
        </Stack>
      </Box>
    </Box>
  );
}
