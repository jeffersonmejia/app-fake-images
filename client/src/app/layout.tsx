import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Pulso — Periodismo para mirar más de cerca",
  description: "Historias, contexto y nuevas miradas desde Ecuador y el mundo.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="es" data-scroll-behavior="smooth">
      <body>{children}</body>
    </html>
  );
}
