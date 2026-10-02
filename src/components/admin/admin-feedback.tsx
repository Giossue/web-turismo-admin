"use client";

import { Alert, Slide, Snackbar, useMediaQuery } from "@mui/material";
import { createContext, useContext, useMemo, useReducer } from "react";

type AdminFeedback = {
  /** Mensaje de éxito; `null` lo oculta. */
  showNotice: (message: string | null) => void;
  /** Mensaje de error (tiene prioridad sobre el de éxito); `null` lo oculta. */
  showError: (message: string | null) => void;
  clear: () => void;
};

const AdminFeedbackContext = createContext<AdminFeedback | null>(null);

type FeedbackState = {
  error: string | null;
  notice: string | null;
  displayed: { message: string; severity: "error" | "success" } | null;
};

type FeedbackAction =
  { type: "error" | "notice"; message: string | null } | { type: "clear" };

function feedbackReducer(state: FeedbackState, action: FeedbackAction): FeedbackState {
  const next =
    action.type === "clear"
      ? { ...state, error: null, notice: null }
      : { ...state, [action.type]: action.message };
  const message = next.error ?? next.notice;

  // Conservar el contenido y su key hasta terminar la animación de salida.
  if (message) {
    next.displayed = { message, severity: next.error ? "error" : "success" };
  }
  return next;
}

/**
 * Avisos transitorios del panel (éxito y error) en un único `Snackbar`. Las
 * funciones expuestas son estables, así que pueden pasarse como `onNotice` /
 * `onError` a componentes que las usan en dependencias de efectos.
 */
export function AdminFeedbackProvider({ children }: { children: React.ReactNode }) {
  const [{ error, notice, displayed }, dispatch] = useReducer(feedbackReducer, {
    error: null,
    notice: null,
    displayed: null,
  });
  const reducedMotion = useMediaQuery("(prefers-reduced-motion: reduce)");
  const feedback = useMemo<AdminFeedback>(
    () => ({
      showNotice: (message) => dispatch({ type: "notice", message }),
      showError: (message) => dispatch({ type: "error", message }),
      clear: () => dispatch({ type: "clear" }),
    }),
    [],
  );
  const message = error ?? notice;

  return (
    <AdminFeedbackContext.Provider value={feedback}>
      {children}
      <Snackbar
        key={displayed ? `${displayed.severity}:${displayed.message}` : "feedback"}
        open={Boolean(message)}
        autoHideDuration={3_000}
        slots={{ transition: Slide }}
        slotProps={{
          transition: {
            direction: "down",
            easing: "cubic-bezier(0.4, 0, 0.2, 1)",
          },
        }}
        transitionDuration={reducedMotion ? 0 : 300}
        onClose={(_, reason) => {
          if (reason === "clickaway") return;
          feedback.clear();
        }}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
        sx={{ top: { xs: 72, sm: 80 } }}
      >
        <Alert
          severity={displayed?.severity ?? "success"}
          variant="filled"
          sx={{ width: "100%", alignItems: "center", border: 0 }}
        >
          {displayed?.message}
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
