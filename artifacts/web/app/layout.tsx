import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AppHeader } from "@/components/app-header";
import { AppFooter } from "@/components/app-footer";

const inter = Inter({
  subsets: ["latin", "cyrillic"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Электричка — расписание и билеты",
  description:
    "Расписание пригородных поездов в реальном времени и покупка билетов с QR-кодом",
  applicationName: "Электричка",
};

export const viewport: Viewport = {
  themeColor: "#c4152c",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ru" className={`${inter.variable} bg-background`}>
      <body className="min-h-screen flex flex-col antialiased">
        <AppHeader />
        <main className="flex-1 flex flex-col">{children}</main>
        <AppFooter />
      </body>
    </html>
  );
}
