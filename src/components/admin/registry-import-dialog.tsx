"use client";

import CheckCircleRounded from "@mui/icons-material/CheckCircleRounded";
import ErrorRounded from "@mui/icons-material/ErrorRounded";
import {
  Alert,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  LinearProgress,
  Stack,
  Typography,
} from "@mui/material";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { forwardRef, useImperativeHandle, useRef, useState } from "react";

import { errorMessage } from "@/lib/errors";
import {
  getMinturRegistryImport,
  importMinturRegistry,
  type MinturImportJob,
} from "@/lib/admin-api";
import { adminKeys } from "@/lib/admin-queries";
import { webTokens } from "@/theme/tokens";

export type RegistryImportDialogRef = { choose: () => void };

const POLL_MS = 1500;
const numberFormat = new Intl.NumberFormat("es-EC");

function running(job: MinturImportJob | undefined) {
  return job?.phase === "LEYENDO" || job?.phase === "GUARDANDO";
}

/**
 * Importa el consolidado nacional del MINTUR. La API lo procesa en segundo
 * plano; este diálogo consulta el avance y resume el resultado.
 */
export const RegistryImportDialog = forwardRef<
  RegistryImportDialogRef,
  { token: string }
>(function RegistryImportDialog({ token }, ref) {
  const inputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();
  const [jobId, setJobId] = useState<string | null>(null);
  const [open, setOpen] = useState(false);

  useImperativeHandle(ref, () => ({ choose: () => inputRef.current?.click() }), []);

  const upload = useMutation({
    mutationFn: (file: File) => importMinturRegistry(token, file),
    onSuccess: (job) => setJobId(job.id),
  });

  const jobQuery = useQuery({
    queryKey: [...adminKeys.allEstablishments(), "registry-import", jobId],
    queryFn: async ({ signal }) => {
      const job = await getMinturRegistryImport(token, jobId ?? "", signal);
      if (job.phase === "TERMINADO") {
        void queryClient.invalidateQueries({
          queryKey: adminKeys.allEstablishments(),
          predicate: (query) => query.queryKey.at(-2) !== "registry-import",
        });
      }
      return job;
    },
    enabled: Boolean(jobId && token),
    refetchInterval: (query) => (running(query.state.data) ? POLL_MS : false),
  });

  const job = jobQuery.data;
  const busy = upload.isPending || !job || running(job);
  const failure =
    (upload.error && errorMessage(upload.error, "No se pudo subir el archivo.")) ||
    (jobQuery.error && errorMessage(jobQuery.error, "No se pudo consultar el avance.")) ||
    (job?.phase === "ERROR" ? job.error : null);

  const close = () => {
    setOpen(false);
    setJobId(null);
    upload.reset();
  };

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept=".xlsx,.xlsm"
        hidden
        onChange={(event) => {
          const file = event.target.files?.[0];
          event.target.value = "";
          if (!file) return;
          setJobId(null);
          setOpen(true);
          upload.mutate(file);
        }}
      />
      <Dialog
        open={open}
        onClose={() => (!busy || failure) && close()}
        fullWidth
        maxWidth="sm"
        aria-busy={busy && !failure}
      >
        <DialogTitle>
          {failure
            ? "No se pudo importar el catastro"
            : busy
              ? "Importando catastro MINTUR"
              : "Catastro importado"}
        </DialogTitle>
        <DialogContent>
          {failure ? (
            <Alert severity="error" icon={<ErrorRounded />}>
              {failure}
            </Alert>
          ) : busy ? (
            <ImportProgress job={job} uploading={upload.isPending} />
          ) : job ? (
            <ImportSummary job={job} />
          ) : null}
        </DialogContent>
        {busy && !failure ? null : (
          <DialogActions>
            <Button variant="contained" onClick={close} autoFocus>
              Cerrar
            </Button>
          </DialogActions>
        )}
      </Dialog>
    </>
  );
});

function ImportProgress({
  job,
  uploading,
}: {
  job: MinturImportJob | undefined;
  uploading: boolean;
}) {
  const saving = job?.phase === "GUARDANDO" && job.totalRows > 0;
  const percent = saving ? Math.round((job.processedRows / job.totalRows) * 100) : 0;
  const label = uploading
    ? "Subiendo el archivo…"
    : saving
      ? `Guardando ${numberFormat.format(job.processedRows)} de ${numberFormat.format(job.totalRows)} registros…`
      : "Leyendo el Excel…";
  return (
    <Stack spacing={webTokens.spacing.control} sx={{ py: 2 }} role="status">
      <LinearProgress
        variant={saving ? "determinate" : "indeterminate"}
        value={percent}
        aria-label="Avance de la importación"
      />
      <Typography align="center">{label}</Typography>
      <Typography variant="body2" color="text.secondary" align="center">
        El consolidado nacional tiene miles de registros y puede tardar uno o dos minutos.
        Puedes esperar aquí; no subas el archivo otra vez.
      </Typography>
    </Stack>
  );
}

function ImportSummary({ job }: { job: MinturImportJob }) {
  const reasons = Object.entries(job.skippedByReason).sort((a, b) => b[1] - a[1]);
  return (
    <Stack spacing={webTokens.spacing.control} sx={{ pt: 1 }}>
      <Stack direction="row" spacing={1} alignItems="center">
        <CheckCircleRounded color="success" />
        <Typography>
          Se leyeron {numberFormat.format(job.totalRows)} registros de{" "}
          {job.sheets.join(", ")}.
        </Typography>
      </Stack>
      <Stack component="ul" spacing={0.5} sx={{ m: 0, pl: 3 }}>
        <Typography component="li" variant="body2">
          {numberFormat.format(job.created)} establecimientos nuevos
        </Typography>
        <Typography component="li" variant="body2">
          {numberFormat.format(job.updated)} actualizados
        </Typography>
        {job.approximateCoordinates > 0 ? (
          <Typography component="li" variant="body2">
            {numberFormat.format(job.approximateCoordinates)} sin coordenadas en el Excel:
            se ubicaron en el centro de su parroquia o cantón y la app los marca como
            ubicación aproximada
          </Typography>
        ) : null}
        {job.skipped > 0 ? (
          <Typography component="li" variant="body2" color="warning.main">
            {numberFormat.format(job.skipped)} omitidos
          </Typography>
        ) : null}
      </Stack>
      {reasons.length ? (
        <Alert severity="warning">
          <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>
            Filas omitidas
          </Typography>
          <Stack component="ul" spacing={0.25} sx={{ m: 0, pl: 2.5 }}>
            {reasons.map(([reason, count]) => (
              <Typography component="li" variant="body2" key={reason}>
                {reason} ({numberFormat.format(count)})
              </Typography>
            ))}
          </Stack>
          {job.skippedSamples.length ? (
            <Typography variant="body2" sx={{ mt: 1 }}>
              Ejemplos:{" "}
              {job.skippedSamples
                .slice(0, 5)
                .map((sample) =>
                  sample.rowNumber
                    ? `${sample.sheet} fila ${sample.rowNumber}`
                    : (sample.numeroRegistro ?? ""),
                )
                .join("; ")}
            </Typography>
          ) : null}
        </Alert>
      ) : null}
      <Typography variant="body2" color="text.secondary">
        Los registros suspendidos o inactivos quedan guardados pero no se muestran en la
        app.
      </Typography>
    </Stack>
  );
}
