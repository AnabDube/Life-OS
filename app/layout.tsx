import type { Metadata, Viewport } from "next";
import { Lora, DM_Sans } from "next/font/google";
import "./globals.css";

const lora = Lora({
  variable: "--font-lora",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  display: "swap",
});

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
  weight: ["300", "400", "500"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Life OS",
  description: "A personal life operating system — faith, work, trading, goals, and finances in one place.",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Life OS",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#0f1a14",
};

// Pre-paint script: read the saved theme from localStorage and stamp the
// `data-theme` attribute on <html> BEFORE any CSS is applied. Without this
// the page paints in dark mode for one frame and then snaps to light.
const themeInitScript = `try {
  var t = localStorage.getItem('life-os-theme');
  if (t === 'light') document.documentElement.setAttribute('data-theme', 'light');
} catch (e) {}`;

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${lora.variable} ${dmSans.variable}`}>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className="min-h-screen" suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
