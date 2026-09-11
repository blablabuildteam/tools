import type { Metadata } from "next";
import { Syne, Manrope } from "next/font/google";
import "./globals.css";

const body = Manrope({
  subsets: ["latin"],
  variable: "--font-host",
  weight: ["400", "500", "600", "700", "800"],
});

const display = Syne({
  subsets: ["latin"],
  variable: "--font-display",
  weight: ["500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: {
    default: "BlaBlaBuild Tools",
    template: "%s — BlaBlaBuild Tools",
  },
  description: "Interne workshop- en presentatietools van BlaBlaBuild.",
  robots: "noindex, nofollow",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="nl">
      <body className={`${body.variable} ${display.variable} font-host antialiased`}>
        {children}
      </body>
    </html>
  );
}
