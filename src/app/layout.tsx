import type { Metadata, Viewport } from "next";
import { Oswald, Source_Sans_3 } from "next/font/google";
import { Header } from "@/components/Header";
import "./globals.css";

const display = Oswald({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
});

const body = Source_Sans_3({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Pacelli Cardinal Cash Bank",
  description:
    "Student Cardinal Cash balances for Pacelli Catholic Schools — view balances, scan QR codes, and manage the school store.",
  applicationName: "Cardinal Cash Bank",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: [{ url: "/icon-192.png", sizes: "192x192", type: "image/png" }],
    apple: [{ url: "/icon-192.png", sizes: "180x180", type: "image/png" }],
  },
  appleWebApp: {
    capable: true,
    title: "Cardinal Cash",
    statusBarStyle: "default",
  },
};

export const viewport: Viewport = {
  themeColor: "#001F3F",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${display.variable} ${body.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <Header />
        <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">{children}</main>
        <footer className="border-t border-[var(--navy)]/10 py-6 text-center text-sm text-[var(--ink-muted)]">
          Pacelli Catholic Schools · Cardinal Cash Bank
        </footer>
      </body>
    </html>
  );
}
