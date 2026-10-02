import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { AppRouterCacheProvider } from "@mui/material-nextjs/v16-appRouter";
import { CssBaseline, ThemeProvider } from "@mui/material";
import InitColorSchemeScript from "@mui/material/InitColorSchemeScript";

import theme from "@/theme";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Turismo Vinculación | Gestión turística",
  description:
    "Portal institucional para gestionar información turística publicada de Ecuador.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body className={inter.variable}>
        <InitColorSchemeScript defaultMode="light" attribute="data" />
        <AppRouterCacheProvider options={{ enableCssLayer: true }}>
          <ThemeProvider theme={theme} defaultMode="light">
            <CssBaseline />
            {children}
          </ThemeProvider>
        </AppRouterCacheProvider>
      </body>
    </html>
  );
}
