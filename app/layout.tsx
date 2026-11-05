import type { Metadata } from "next";
import { Inter, Geist, Geist_Mono, Unbounded } from "next/font/google";
import "./globals.css";
import { UserProvider } from "@/contexts/user-context";
import { Toaster } from "sonner";

// Inter now only draws the YOMI wordmark and the collectible cards, so both keep their original letterforms
const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const geist = Geist({
  variable: "--font-geist",
  subsets: ["latin"],
});

// Display face for page titles and hero numbers only
const unbounded = Unbounded({
  variable: "--font-unbounded",
  subsets: ["latin"],
  weight: ["500", "700"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "YOMI.fun - Prediction Market",
  description: "Le marché de prédiction gamifié pour la Gen Z",
  icons: {
    icon: [
      { url: '/icon.svg', type: 'image/svg+xml' },
    ],
    apple: [
      { url: '/images/LOGO.png', sizes: '180x180', type: 'image/png' },
    ],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr">
      <body
        className={`${inter.variable} ${geist.variable} ${unbounded.variable} ${geistMono.variable} antialiased`}
      >
        <UserProvider>
          {children}
        </UserProvider>
        <Toaster position="top-center" richColors theme="dark" />
      </body>
    </html>
  );
}
