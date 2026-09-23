"use client";

import ArrowBackRounded from "@mui/icons-material/ArrowBackRounded";
import CloudUploadRounded from "@mui/icons-material/CloudUploadRounded";
import PublishRounded from "@mui/icons-material/PublishRounded";
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
const EDITABLE_STATES = new Set(["BORRADOR", "RECHAZADO", "PUBLICADO"]);
const REQUIRED_FIELDS_MESSAGE = "Completa los campos obligatorios para continuar.";

const alwaysReady = () => true;

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
  const catalogs = catalogsQuery.data ?? null;
  const detail = useMemo(
    () => (centerQuery.data ? withEditorDraft(centerQuery.data) : null),
    [centerQuery.data],
  );
  // La ficha vive solo en la caché de TanStack; el formulario se sincroniza con
  // ella y conserva los cambios que la persona aún no guardó.
  const serverValues = useMemo(
    () => (detail && catalogs ? toFormValues(editorDraftOf(detail), catalogs) : undefined),
    [catalogs, detail],
  );
  const form = useForm<CenterFormValues>({
    mode: "onChange",
    defaultValues: emptyCenterFormValues,
    values: serverValues,
    resetOptions: { keepDirtyValues: true },
  });
  const [activeStep, setActiveStep] = useState(0);
  const importInputRef = useRef<HTMLInputElement | null>(null);

  const isNew = code === null;
  const state = detail?.status.code ?? "BORRADOR";
  const canEdit = isNew || EDITABLE_STATES.has(state);
  const canReview = !isNew && (state === "BORRADOR" || state === "RECHAZADO");
  const canPublish = state === "APROBADO";
  const activeSectionCode =
    activeStep < SUMMARY_STEP ? centerSectionDefinitions[activeStep].code : null;

  const centerSave = useCenterSave({ token, code, catalogs, onSaved, onNotice, onError });
  const autosave = useCenterAutosave(form, {
    enabled: canEdit,
    canSave: isNew ? isReadyToCreate : alwaysReady,
    save: (values) => centerSave.save(values, { silent: true }),
  });
  const fichaImport = useFichaImport({
    token,
    catalogs,
    form,
    onImported: autosave.markChanged,
    onNotice,
    onError,
  });

  const handleDetailChanged = useCallback(
    (saved: AdminCenterDetail) => {
      queryClient.setQueryData(adminKeys.center(saved.code), saved);
      onSaved(saved);
    },
    [onSaved, queryClient],
  );
  const notifyCoordinatesPicked = useCallback(
    () => onNotice("Coordenadas seleccionadas en el mapa."),
    [onNotice],
  );

  const queryError = catalogsQuery.error ?? centerQuery.error;
  useEffect(() => {
    if (queryError) onError(errorMessage(queryError, "No se pudo cargar la ficha."));
  }, [onError, queryError]);

  async function goNext() {
    if (activeSectionCode === null) return;
    const fields = isNew ? CENTER_CREATE_FIELDS : CENTER_STEP_FIELDS[activeSectionCode];
    if (fields && !(await form.trigger([...fields], { shouldFocus: true }))) {
      onError(REQUIRED_FIELDS_MESSAGE);
      return;
    }
    if (isNew) {
      // La API asigna el código al crear; sin código no hay más pasos.
      if (!(await autosave.flush({ force: true }))) return;
    } else {
      void autosave.flush();
    }
    setActiveStep(activeStep + 1);
  }

  async function submitForReview() {
    if (!(await form.trigger(undefined, { shouldFocus: true }))) {
      onError(REQUIRED_FIELDS_MESSAGE);
      return;
    }
    autosave.discard();
    await centerSave.save(form.getValues(), { submitForReview: true });
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
          canEdit ? (
            <Button
              key="import"
              type="button"
              variant="outlined"
              startIcon={<CloudUploadRounded />}
              onClick={() => importInputRef.current?.click()}
              disabled={fichaImport.importing}
            >
              {fichaImport.importing ? "Importando…" : "Importar ficha (.xlsx / .xlsm)"}
            </Button>
          ) : null,
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
          canPublish ? (
            <Button
              key="publish"
              type="button"
              variant="contained"
              startIcon={<PublishRounded />}
              onClick={() => void centerSave.publish()}
              disabled={centerSave.working}
            >
              {centerSave.publishing ? "Publicando…" : "Publicar"}
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
      {detail?.review?.observation ? (
        <Alert severity={state === "RECHAZADO" ? "warning" : "info"}>
          Observación: {detail.review.observation}
        </Alert>
      ) : null}
      {!canEdit && state !== "APROBADO" ? (
        <Alert severity="info">
          La ficha está en revisión. Puedes consultar la propuesta, pero no modificarla.
        </Alert>
      ) : null}

      <CenterWizardStepper
        steps={centerWizardSteps}
        activeStep={activeStep}
        canNavigate={!isNew}
        onSelect={(step) => {
          if (step === 0 || !isNew) setActiveStep(step);
        }}
      />

      {activeSectionCode === "anexos" ? (
        <MediaManager
          token={token}
          code={code}
          canEdit={canEdit || state === "APROBADO"}
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
      />
    </Stack>
  );
}
