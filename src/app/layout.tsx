import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { headers } from "next/headers";
import { AppRouterCacheProvider } from "@mui/material-nextjs/v16-appRouter";
import { CssBaseline, ThemeProvider } from "@mui/material";
import InitColorSchemeScript from "@mui/material/InitColorSchemeScript";

import theme from "@/theme";
import { CspNonceProvider } from "@/lib/csp-nonce";
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

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const nonce = (await headers()).get("x-nonce") ?? undefined;
  return (
    <html lang="es" suppressHydrationWarning>
      <body className={inter.variable}>
        <InitColorSchemeScript defaultMode="light" attribute="data" nonce={nonce} />
        <CspNonceProvider nonce={nonce}>
          <AppRouterCacheProvider options={{ enableCssLayer: true, nonce }}>
            <ThemeProvider theme={theme} defaultMode="light">
              <CssBaseline />
              {children}
            </ThemeProvider>
          </AppRouterCacheProvider>
        </CspNonceProvider>
      </body>
    </html>
  );
}
