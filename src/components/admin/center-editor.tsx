"use client";

import ArrowBackRounded from "@mui/icons-material/ArrowBackRounded";
import CloudUploadRounded from "@mui/icons-material/CloudUploadRounded";
import DownloadRounded from "@mui/icons-material/DownloadRounded";
import { Alert, Button, Stack, Typography } from "@mui/material";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { FormProvider, useForm } from "react-hook-form";

import { CenterFormPanel } from "@/components/admin/center-editor/center-form-panels";
import { CenterSummaryStep } from "@/components/admin/center-editor/center-summary-step";
import {
  CenterWizardNavigation,
  CenterWizardStepper,
} from "@/components/admin/center-editor/center-wizard-stepper";
import { useCenterAutosave } from "@/components/admin/center-editor/use-center-autosave";
import { useCenterSave } from "@/components/admin/center-editor/use-center-save";
import { useFichaImport } from "@/components/admin/center-editor/use-ficha-import";
import { ContinuousCenterSectionWorkflow } from "@/components/admin/center-section-workflow";
import { MediaManager } from "@/components/admin/media-manager";
import { ContentState } from "@/components/ui/content-state";
import { EditableContext } from "@/components/ui/form/editable-context";
import { PageHeader } from "@/components/ui/page-header";
import { getAdminCenter, type AdminCenterDetail } from "@/lib/admin-api";
import { adminKeys, catalogsQueryOptions } from "@/lib/admin-queries";
import { centerEditorCatalogs } from "@/lib/center-editor-catalogs";
import {
  CENTER_CREATE_FIELDS,
  CENTER_STEP_FIELDS,
  emptyCenterFormValues,
  isReadyToCreate,
  type CenterFormValues,
} from "@/lib/center-form";
import { editorDraftOf, toFormValues, withEditorDraft } from "@/lib/center-form-mappers";
import { centerSectionDefinitions } from "@/lib/center-sections/definitions";
import { errorMessage } from "@/lib/errors";
import { webTokens } from "@/theme/tokens";

const centerWizardSteps = centerSectionDefinitions.map((section) => ({
  key: section.code,
  title: section.title,
}));
const SUMMARY_STEP = centerSectionDefinitions.length;
const EDITABLE_STATES = new Set(["BORRADOR", "PUBLICADO"]);
const REQUIRED_FIELDS_MESSAGE =
  "Faltan campos obligatorios: complétalos (están marcados en rojo) para continuar.";

export function CenterEditor({
  token,
  code,
  onClose,
  onSaved,
  onNotice,
  onError,
}: {
  token: string;
  code: string | null;
  onClose: () => void;
  onSaved: (detail: AdminCenterDetail) => void;
  onNotice: (message: string) => void;
  onError: (message: string | null) => void;
}) {
  const queryClient = useQueryClient();
  const catalogsQuery = useQuery(catalogsQueryOptions(token));
  const centerQuery = useQuery({
    queryKey: adminKeys.center(code),
    queryFn: () => getAdminCenter(token, code as string),
    enabled: token.length > 0 && code !== null,
  });
  const detail = useMemo(
    () => (centerQuery.data ? withEditorDraft(centerQuery.data) : null),
    [centerQuery.data],
  );
  const catalogs = useMemo(
    () =>
      centerEditorCatalogs(catalogsQuery.data ?? null, detail?.retainedCatalogOptions),
    [catalogsQuery.data, detail?.retainedCatalogOptions],
  );
  // La ficha vive solo en la caché de TanStack; el formulario se sincroniza con
  // ella y conserva los cambios que la persona aún no guardó.
  const serverValues = useMemo(
    () =>
      detail && catalogs ? toFormValues(editorDraftOf(detail), catalogs) : undefined,
    [catalogs, detail],
  );
  const form = useForm<CenterFormValues>({
    mode: "onChange",
    defaultValues: emptyCenterFormValues,
    values: serverValues,
    resetOptions: { keepDirtyValues: true },
  });
  const [activeStep, setActiveStep] = useState(0);
  const focusMissingRef = useRef(false);
  const importInputRef = useRef<HTMLInputElement | null>(null);
  const submittingReviewRef = useRef(false);

  const isNew = code === null;
  const state = detail?.status.code ?? "BORRADOR";
  const canEdit = isNew || EDITABLE_STATES.has(state);
  const canReview = !isNew && state === "BORRADOR";
  const activeSectionCode =
    activeStep < SUMMARY_STEP ? centerSectionDefinitions[activeStep].code : null;

  /** Reemplaza el formulario por la ficha del servidor (sin cambios locales). */
  const adoptServerDetail = (saved: AdminCenterDetail) => {
    const savedCatalogs = centerEditorCatalogs(
      catalogsQuery.data ?? null,
      saved.retainedCatalogOptions,
    );
    if (savedCatalogs)
      form.reset(toFormValues(editorDraftOf(withEditorDraft(saved)), savedCatalogs));
  };
  const centerSave = useCenterSave({
    token,
    code,
    catalogs,
    onSaved,
    onNotice,
    onError,
    onConflictReload: adoptServerDetail,
  });
  const autosave = useCenterAutosave(form, {
    enabled: canEdit,
    // Solo se valida el panel montado; esta comprobación cubre los campos
    // obligatorios de todos los pasos para no guardar una ficha incompleta.
    canSave: isReadyToCreate,
    save: async (values) => {
      const submitted = JSON.stringify(values);
      const saved = await centerSave.save(values, { silent: true });
      // Sin ediciones durante el guardado, el formulario vuelve a reflejar lo
      // que quedó en el servidor (por ejemplo, un campo vaciado que la API conserva).
      if (saved && JSON.stringify(form.getValues()) === submitted)
        adoptServerDetail(saved);
      return saved !== null;
    },
  });
  const fichaImport = useFichaImport({
    token,
    catalogs,
    form,
    onNotice,
    onError,
  });
  const uploadImportedPhotos = fichaImport.uploadImportedPhotos;

  const handleDetailChanged = useCallback(
    (saved: AdminCenterDetail) => {
      queryClient.setQueryData(adminKeys.center(saved.code), saved);
      onSaved(saved);
      void uploadImportedPhotos(saved.code);
    },
    [onSaved, queryClient, uploadImportedPhotos],
  );
  const notifyCoordinatesPicked = useCallback(
    () => onNotice("Coordenadas seleccionadas en el mapa."),
    [onNotice],
  );

  const queryError = catalogsQuery.error ?? centerQuery.error;
  useEffect(() => {
    if (queryError) onError(errorMessage(queryError, "No se pudo cargar la ficha."));
  }, [onError, queryError]);

  useEffect(() => {
    if (!focusMissingRef.current || activeStep !== 0) return;
    focusMissingRef.current = false;
    void form.trigger([...CENTER_CREATE_FIELDS], { shouldFocus: true });
  }, [activeStep, form]);

  async function goNext() {
    if (activeSectionCode === null) return;
    // En una ficha nueva, «Siguiente» desde el primer paso la crea; en los demás
    // pasos el autoguardado la crea en cuanto estén los datos obligatorios.
    const creating = isNew && activeStep === 0;
    const fields = creating
      ? CENTER_CREATE_FIELDS
      : CENTER_STEP_FIELDS[activeSectionCode];
    if (fields && !(await form.trigger([...fields], { shouldFocus: true }))) {
      onError(REQUIRED_FIELDS_MESSAGE);
      return;
    }
    if (creating) {
      if (
        !isReadyToCreate(form.getValues()) ||
        !(await form.trigger(undefined, { shouldFocus: true }))
      ) {
        showMissingFields();
        return;
      }
      if (!(await autosave.flush({ force: true }))) return;
    } else if (!isNew) {
      // Incluye valores importados que aún no se guardaron.
      void autosave.flush({ force: form.formState.isDirty });
    }
    setActiveStep(activeStep + 1);
  }

  /** Crea la ficha nueva con lo cargado; al crearse se suben las fotos importadas. */
  async function createNow() {
    if (!isReadyToCreate(form.getValues())) {
      showMissingFields();
      return;
    }
    await autosave.flush({ force: true });
  }

  /**
   * Lleva al primer paso (donde viven los datos obligatorios para crear o
   * enviar la ficha) y, ya montado, marca en rojo y enfoca lo que falta.
   */
  function showMissingFields() {
    onError(REQUIRED_FIELDS_MESSAGE);
    if (activeStep === 0) {
      void form.trigger([...CENTER_CREATE_FIELDS], { shouldFocus: true });
      return;
    }
    focusMissingRef.current = true;
    setActiveStep(0);
  }

  async function submitForReview() {
    if (submittingReviewRef.current || centerSave.working || !canReview) return;
    submittingReviewRef.current = true;
    try {
      if (!isReadyToCreate(form.getValues())) {
        showMissingFields();
        return;
      }
      if (!(await form.trigger(undefined, { shouldFocus: true }))) {
        onError(REQUIRED_FIELDS_MESSAGE);
        return;
      }
      autosave.discard();
      await centerSave.save(form.getValues(), { submitForReview: true });
    } finally {
      submittingReviewRef.current = false;
    }
  }

  if (catalogsQuery.isLoading || centerQuery.isLoading) {
    return <ContentState status="loading" label="Cargando ficha" />;
  }

  return (
    <Stack spacing={webTokens.spacing.control}>
      <PageHeader
        title={isNew ? "Nueva ficha turística" : `Editar ficha ${code}`}
        description="Completa la información institucional y adjunta fotos verificadas antes de publicar."
        titleVariant="h5"
        headingComponent="h2"
        backAction={
          <Button startIcon={<ArrowBackRounded />} onClick={onClose} sx={{ mb: 1 }}>
            Volver al inventario
          </Button>
        }
        actions={[
          <Stack
            key="ficha-import-actions"
            direction="row"
            spacing={webTokens.spacing.inline}
            useFlexGap
            flexWrap="wrap"
          >
            {canEdit ? (
              <Button
                type="button"
                variant="outlined"
                startIcon={<CloudUploadRounded />}
                onClick={() => importInputRef.current?.click()}
                disabled={fichaImport.importing || fichaImport.uploadingPhotos}
              >
                {fichaImport.importing ? "Importando…" : "Importar ficha (.xlsx / .xlsm)"}
              </Button>
            ) : null}
            <Button
              component="a"
              href="/templates/ficha-mintur-vacia.xlsm"
              download="Ficha_MINTUR_vacia.xlsm"
              variant="outlined"
              startIcon={<DownloadRounded />}
            >
              Descargar plantilla vacía
            </Button>
          </Stack>,
          canReview ? (
            <Button
              key="review"
              type="button"
              variant="contained"
              startIcon={<CloudUploadRounded />}
              onClick={() => void submitForReview()}
              disabled={centerSave.working}
            >
              {centerSave.reviewing ? "Enviando…" : "Enviar a revisión"}
            </Button>
          ) : null,
        ]}
      />
      <input
        ref={importInputRef}
        type="file"
        accept=".xlsx,.xlsm"
        style={{ display: "none" }}
        onChange={(event) => {
          const file = event.target.files?.[0];
          event.target.value = "";
          if (file) fichaImport.importFile(file);
        }}
      />
      {fichaImport.warnings.length > 0 ? (
        <Alert severity="warning" onClose={fichaImport.dismissWarnings}>
          <Typography variant="subtitle2" component="p" sx={{ mb: 0.5 }}>
            La ficha se precargó con advertencias — revísalas antes de guardar:
          </Typography>
          <Stack component="ul" sx={{ m: 0, pl: 2.5 }}>
            {fichaImport.warnings.map((warning) => (
              <Typography key={warning} component="li" variant="body2">
                {warning}
              </Typography>
            ))}
          </Stack>
        </Alert>
      ) : null}
      {fichaImport.pendingPhotoCount > 0 ? (
        <Alert
          severity={fichaImport.photoUploadError ? "warning" : "info"}
          action={
            code ? (
              <Button
                color="inherit"
                size="small"
                disabled={fichaImport.uploadingPhotos}
                onClick={() => void fichaImport.uploadImportedPhotos(code)}
              >
                {fichaImport.uploadingPhotos ? "Subiendo…" : "Reintentar"}
              </Button>
            ) : (
              <Button
                color="inherit"
                size="small"
                disabled={centerSave.working}
                onClick={() => void createNow()}
              >
                {centerSave.working ? "Guardando…" : "Guardar ficha"}
              </Button>
            )
          }
        >
          {fichaImport.photoUploadError ??
            (code
              ? fichaImport.uploadingPhotos
                ? `Subiendo ${fichaImport.pendingPhotoCount} foto(s) importada(s)…`
                : `${fichaImport.pendingPhotoCount} foto(s) importada(s) pendientes de carga.`
              : `${fichaImport.pendingPhotoCount} foto(s) detectada(s); se adjuntarán al guardar la ficha.`)}
        </Alert>
      ) : null}
      {detail?.review?.observation ? (
        <Alert severity={state === "BORRADOR" ? "warning" : "info"}>
          Observación: {detail.review.observation}
        </Alert>
      ) : null}
      {!canEdit ? (
        <Alert severity="info">
          {state === "EN_REVISION"
            ? "La ficha está en revisión. Puedes consultar la propuesta, pero no modificarla."
            : "Puedes consultar la ficha, pero su estado no permite modificarla."}
        </Alert>
      ) : null}

      <CenterWizardStepper
        steps={centerWizardSteps}
        activeStep={activeStep}
        onSelect={setActiveStep}
      />

      {activeSectionCode === "anexos" ? (
        <MediaManager
          token={token}
          target={{ kind: "center", code }}
          canEdit={canEdit}
          pendingImports={fichaImport.uploadingPhotos ? [] : fichaImport.pendingPhotos}
          onNotice={onNotice}
          onError={onError}
        />
      ) : null}

      <ContinuousCenterSectionWorkflow
        token={token}
        code={code}
        detail={detail}
        catalogs={catalogs}
        canEdit={canEdit}
        activeSectionCode={activeSectionCode}
        visible={activeSectionCode !== null}
        onDetailChanged={handleDetailChanged}
        onError={onError}
        sugerenciasImportadas={fichaImport.sugerencias}
      />

      {activeSectionCode ? (
        <FormProvider {...form}>
          <EditableContext value={canEdit}>
            <CenterFormPanel
              sectionCode={activeSectionCode}
              catalogs={catalogs}
              isNew={isNew}
              code={code}
              token={token}
              onCoordinatesPicked={notifyCoordinatesPicked}
            />
          </EditableContext>
        </FormProvider>
      ) : (
        <CenterSummaryStep detail={detail} catalogs={catalogs} />
      )}

      <CenterWizardNavigation
        activeStep={activeStep}
        lastStep={SUMMARY_STEP}
        working={centerSave.working}
        onPrevious={() => setActiveStep((current) => Math.max(0, current - 1))}
        onNext={() => void goNext()}
        finalAction={
          isNew ? (
            <Button
              type="button"
              variant="contained"
              onClick={() => void createNow()}
              disabled={centerSave.working}
            >
              {centerSave.working ? "Guardando…" : "Guardar ficha"}
            </Button>
          ) : canReview ? (
            <Button
              type="button"
              variant="contained"
              startIcon={<CloudUploadRounded />}
              onClick={() => void submitForReview()}
              disabled={centerSave.working}
            >
              {centerSave.reviewing ? "Enviando…" : "Enviar a revisión"}
            </Button>
          ) : undefined
        }
      />
    </Stack>
  );
}
