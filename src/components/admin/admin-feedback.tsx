"use client";

import { Alert, Snackbar } from "@mui/material";
import { createContext, useContext, useMemo, useState } from "react";

type AdminFeedback = {
  /** Mensaje de éxito; `null` lo oculta. */
  showNotice: (message: string | null) => void;
  /** Mensaje de error (tiene prioridad sobre el de éxito); `null` lo oculta. */
  showError: (message: string | null) => void;
  clear: () => void;
};

const AdminFeedbackContext = createContext<AdminFeedback | null>(null);

/**
 * Avisos transitorios del panel (éxito y error) en un único `Snackbar`. Las
 * funciones expuestas son estables, así que pueden pasarse como `onNotice` /
 * `onError` a componentes que las usan en dependencias de efectos.
 */
export function AdminFeedbackProvider({ children }: { children: React.ReactNode }) {
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const feedback = useMemo<AdminFeedback>(
    () => ({
      showNotice: setNotice,
      showError: setError,
      clear: () => {
        setError(null);
        setNotice(null);
      },
    }),
    [],
  );
  const message = error ?? notice;

  return (
    <AdminFeedbackContext.Provider value={feedback}>
      {children}
      <Snackbar
        key={`${error ? "error" : "success"}:${message}`}
        open={Boolean(message)}
        autoHideDuration={3_000}
        onClose={(_, reason) => {
          if (reason === "clickaway") return;
          feedback.clear();
        }}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
        sx={{ top: { xs: 72, sm: 80 } }}
      >
        <Alert
          severity={error ? "error" : "success"}
          variant="filled"
          sx={{ width: "100%", alignItems: "center", border: 0 }}
        >
          {message}
        </Alert>
      </Snackbar>
    </AdminFeedbackContext.Provider>
  );
}

export function useAdminFeedback(): AdminFeedback {
  const value = useContext(AdminFeedbackContext);
  if (!value) {
    throw new Error("useAdminFeedback debe usarse dentro de AdminFeedbackProvider.");
  }
  return value;
}
