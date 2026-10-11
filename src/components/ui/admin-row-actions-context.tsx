"use client";

import { createContext } from "react";

/** Las acciones de filas anteriores no se pueden iniciar durante una transición. */
export const AdminRowActionsDisabledContext = createContext(false);
