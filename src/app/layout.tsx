import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as SonnerToaster } from "@/components/ui/sonner";
import { Providers } from "@/components/providers/providers";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Kinemetrix — Evaluación Antropométrica e IMC",
  description:
    "Plataforma profesional para evaluación antropométrica, cálculo del Índice de Masa Corporal (IMC) según criterios OMS, historial longitudinal y generación de informes técnicos en PDF.",
  keywords: [
    "IMC",
    "Índice de Masa Corporal",
    "Antropometría",
    "Composición Corporal",
    "Evaluación Física",
    "Ciencias del Movimiento Humano",
    "OMS",
    "Quetelet",
  ],
  authors: [{ name: "Kinemetrix" }],
  icons: {
    icon: "/logo.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        <Providers>
          {children}
          <Toaster />
          <SonnerToaster position="top-right" richColors closeButton />
        </Providers>
      </body>
    </html>
  );
}
