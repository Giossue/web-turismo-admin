"use client";

import ArrowBackRounded from "@mui/icons-material/ArrowBackRounded";
import CloudUploadRounded from "@mui/icons-material/CloudUploadRounded";
import { Alert, Button, Stack, Typography } from "@mui/material";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { FormProvider, useForm, useWatch } from "react-hook-form";

import {
  scrollToFocusedField,
  type IssueFocus,
} from "@/components/admin/center-editor/issue-focus";
import { CenterFormPanel } from "@/components/admin/center-editor/center-form-panels";
import {
  CenterSummaryStep,
  sectionsFilledInForm,
} from "@/components/admin/center-editor/center-summary-step";
import { FichaImportDialog } from "@/components/admin/center-editor/ficha-import-dialog";
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
import type { AdminCenterDetail } from "@/lib/admin-api";
import { adminKeys, catalogsQueryOptions, centerQueryOptions } from "@/lib/admin-queries";
import { centerEditorCatalogs } from "@/lib/center-editor-catalogs";
import { ubicarAviso, type IssueTarget } from "@/lib/ficha/ubicar-aviso";
import {
  CENTER_CREATE_FIELDS,
  type CenterFormField,
  CENTER_STEP_FIELDS,
  emptyCenterFormValues,
  isReadyToCreate,
  type CenterFormValues,
} from "@/lib/center-form";
import { editorDraftOf, toFormValues, withEditorDraft } from "@/lib/center-form-mappers";
import { centerSectionDefinitions } from "@/lib/center-sections/definitions";
import { isAdministrator, useAdminAuth } from "@/lib/auth";
import { usePlatformSettings } from "@/lib/use-platform-settings";
import { errorMessage } from "@/lib/errors";
import { webTokens } from "@/theme/tokens";

const centerWizardSteps = centerSectionDefinitions.map((section) => ({
  key: section.code,
  title: section.title,
}));
// La verificación (resumen final) es el paso 15 del asistente.
const VERIFICATION_KEY = "verificacion";
const wizardSteps = [
  ...centerWizardSteps,
  { key: VERIFICATION_KEY, title: "Verificación" },
];
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
  initialImport = null,
  onInitialImportStarted,
}: {
  token: string;
  code: string | null;
  onClose: () => void;
  onSaved: (detail: AdminCenterDetail) => void;
  onNotice: (message: string) => void;
  onError: (message: string | null) => void;
  /** Excel elegido desde la lista; se importa en cuanto la ficha está cargada. */
  initialImport?: File | null;
  onInitialImportStarted?: () => void;
}) {
  const queryClient = useQueryClient();
  const catalogsQuery = useQuery(catalogsQueryOptions(token));
  const centerQuery = useQuery(centerQueryOptions(token, code));
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
  // Petición de enfoque ya atendida: volver al paso no la repite.
  const handledIssueRef = useRef(0);
  // Campo al que llevar a la persona y error de la API que se puede ubicar.
  const [issueFocus, setIssueFocus] = useState<IssueFocus | null>(null);
  const [errorIssue, setErrorIssue] = useState<{
    message: string;
    target: IssueTarget;
  } | null>(null);
  const submittingReviewRef = useRef(false);
  // El administrador no revisa su propia propuesta: la API la publica directo.
  // Los agentes también publican directo si el administrador dejó el paso libre.
  const directPublishFichas = usePlatformSettings(token).directPublishFichas;
  const publishesDirectly = isAdministrator(useAdminAuth().user) || directPublishFichas;

  const isNew = code === null;
  const state = detail?.status.code ?? "BORRADOR";
  // Las fichas publicadas de otro agente se consultan sin poder modificarlas.
  const ownsCenter = detail?.editable !== false;
  const canEdit = isNew || (ownsCenter && EDITABLE_STATES.has(state));
  const canReview = !isNew && ownsCenter && state === "BORRADOR";
  // Misma fuente que el resumen final (`CenterSummaryStep`).
  const savedSections = (detail?.draft ?? detail?.published)?.sections;
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
  /** Abre el paso del campo y lo señala con el mensaje. */
  const goToIssue = useCallback((target: IssueTarget, message: string) => {
    const step = centerSectionDefinitions.findIndex(
      (section) => section.code === target.sectionCode,
    );
    if (step < 0) return;
    setActiveStep(step);
    setIssueFocus({ ...target, message, nonce: Date.now() });
  }, []);
  // Un error de la API que apunta a un campo ofrece ir a él; al publicar, va solo.
  const reportError = useCallback(
    (message: string | null) => {
      onError(message);
      const target = message ? ubicarAviso(message) : null;
      setErrorIssue(message && target ? { message, target } : null);
      if (message && target && submittingReviewRef.current) goToIssue(target, message);
    },
    [goToIssue, onError],
  );
  const centerSave = useCenterSave({
    token,
    code,
    catalogs,
    onSaved,
    onNotice,
    onError: reportError,
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
    code,
    catalogs,
    form,
    onNotice,
    onError,
  });
  // Lo escrito o importado en el formulario aún sin guardar, para el resumen.
  const liveValues = useWatch({ control: form.control }) as CenterFormValues;

  // Los apartados importados que aún se guardan ya cuentan como completos.
  const importingSections = fichaImport.pendingSectionCodes;
  const completedSectionCodes = useMemo(() => {
    const keys = new Set<string>(Object.keys(savedSections ?? {}));
    for (const sectionCode of importingSections) keys.add(sectionCode);
    for (const sectionCode of sectionsFilledInForm(liveValues)) keys.add(sectionCode);
    // La verificación se completa cuando todos los apartados lo están.
    if (centerSectionDefinitions.every((section) => keys.has(section.code))) {
      keys.add(VERIFICATION_KEY);
    }
    return keys;
  }, [savedSections, importingSections, liveValues]);
  const uploadImportedPhotos = fichaImport.uploadImportedPhotos;
  const saveImportedSections = fichaImport.saveImportedSections;

  const handleDetailChanged = useCallback(
    (saved: AdminCenterDetail) => {
      queryClient.setQueryData(adminKeys.center(saved.code), saved);
      onSaved(saved);
    },
    [onSaved, queryClient],
  );

  // En cuanto la ficha tiene código (al crearla o al importar sobre una
  // existente) se suben las fotos y se guardan los apartados importados.
  const { pendingPhotoCount, pendingSectionCount } = fichaImport;
  useEffect(() => {
    if (!code) return;
    if (pendingPhotoCount > 0) void uploadImportedPhotos(code);
    if (pendingSectionCount > 0) void saveImportedSections(code);
  }, [
    code,
    pendingPhotoCount,
    pendingSectionCount,
    saveImportedSections,
    uploadImportedPhotos,
  ]);
  const importFile = fichaImport.importFile;
  const formReady = Boolean(catalogsQuery.data) && (code === null || Boolean(detail));
  // Una sola vez por archivo, aunque el editor se vuelva a renderizar.
  const startedImportRef = useRef<File | null>(null);
  useEffect(() => {
    if (!initialImport || !formReady || startedImportRef.current === initialImport)
      return;
    startedImportRef.current = initialImport;
    onInitialImportStarted?.();
    if (canEdit) importFile(initialImport);
    else onError("La ficha está en revisión; no se puede actualizar desde Excel.");
  }, [canEdit, formReady, importFile, initialImport, onError, onInitialImportStarted]);
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

  // Campo del formulario principal: se señala y enfoca cuando su paso está activo.
  useEffect(() => {
    if (!issueFocus || issueFocus.form !== "main") return;
    if (activeSectionCode !== issueFocus.sectionCode) return;
    if (handledIssueRef.current === issueFocus.nonce) return;
    handledIssueRef.current = issueFocus.nonce;
    const timer = setTimeout(() => {
      const field = issueFocus.field as CenterFormField;
      form.setError(field, { type: "manual", message: issueFocus.message });
      form.setFocus(field);
      scrollToFocusedField(issueFocus.sectionCode);
    }, 80);
    return () => clearTimeout(timer);
  }, [activeSectionCode, form, issueFocus]);

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
      const saved = await centerSave.save(form.getValues(), { submitForReview: true });
      // Publicada o enviada a revisión, la ficha ya no se edita: vuelve al inventario.
      if (saved) onClose();
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
          canReview ? (
            <Button
              key="review"
              type="button"
              variant="contained"
              startIcon={<CloudUploadRounded />}
              onClick={() => void submitForReview()}
              disabled={centerSave.working}
            >
              {submitLabel(publishesDirectly, centerSave.reviewing)}
            </Button>
          ) : null,
        ]}
      />
      <FichaImportDialog
        importing={fichaImport.importing}
        result={fichaImport.importResult}
        onClose={fichaImport.dismissImportResult}
      />
      {fichaImport.warnings.length > 0 ? (
        <Alert severity="warning" onClose={fichaImport.dismissWarnings}>
          <Typography variant="subtitle2" component="p" sx={{ mb: 0.5 }}>
            La ficha se precargó con advertencias — revísalas antes de guardar:
          </Typography>
          <Stack component="ul" sx={{ m: 0, pl: 2.5 }}>
            {fichaImport.warnings.map((warning) => {
              const target = ubicarAviso(warning);
              return (
                <Typography key={warning} component="li" variant="body2">
                  {warning}
                  {target ? (
                    <Button
                      type="button"
                      size="small"
                      color="inherit"
                      sx={{ ml: 1, textDecoration: "underline" }}
                      onClick={() => goToIssue(target, warning)}
                    >
                      Ir al campo
                    </Button>
                  ) : null}
                </Typography>
              );
            })}
          </Stack>
        </Alert>
      ) : null}
      {errorIssue ? (
        <Alert
          severity="error"
          action={
            <Button
              type="button"
              color="inherit"
              size="small"
              onClick={() => goToIssue(errorIssue.target, errorIssue.message)}
            >
              Ir al campo
            </Button>
          }
        >
          {errorIssue.message}
        </Alert>
      ) : null}
      {fichaImport.photoUploadError && fichaImport.pendingPhotoCount > 0 ? (
        <Alert
          severity="warning"
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
            ) : null
          }
        >
          {fichaImport.photoUploadError}
        </Alert>
      ) : null}
      {detail?.review?.observation ? (
        <Alert severity={state === "BORRADOR" ? "warning" : "info"}>
          Observación: {detail.review.observation}
        </Alert>
      ) : null}
      {!canEdit ? (
        <Alert severity="info">
          {!ownsCenter
            ? "Esta ficha la registró otra persona. Puedes consultar la versión publicada, pero no modificarla."
            : state === "EN_REVISION"
              ? "La ficha está en revisión. Puedes consultar la propuesta, pero no modificarla."
              : "Puedes consultar la ficha, pero su estado no permite modificarla."}
        </Alert>
      ) : null}

      <CenterWizardStepper
        steps={wizardSteps}
        activeStep={activeStep}
        completedKeys={completedSectionCodes}
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
        onError={reportError}
        sugerenciasImportadas={fichaImport.sugerencias}
        focusRequest={issueFocus}
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
        <CenterSummaryStep
          detail={detail}
          catalogs={catalogs}
          publishesDirectly={publishesDirectly}
          importingSections={fichaImport.pendingSectionCodes}
          formValues={liveValues}
        />
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
              {submitLabel(publishesDirectly, centerSave.reviewing)}
            </Button>
          ) : undefined
        }
      />
    </Stack>
  );
}

function submitLabel(publishesDirectly: boolean, working: boolean) {
  if (publishesDirectly) return working ? "Publicando…" : "Publicar";
  return working ? "Enviando…" : "Enviar a revisión";
}
