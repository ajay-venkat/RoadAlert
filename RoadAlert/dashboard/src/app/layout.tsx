import type { Metadata } from "next";
import "./globals.css";
import { Inter, Barlow_Condensed, JetBrains_Mono } from "next/font/google";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const barlowCondensed = Barlow_Condensed({ weight: ["600", "700"], subsets: ["latin"], variable: "--font-barlow-condensed" });
const jetbrainsMono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-jetbrains-mono" });

export const metadata: Metadata = {
  title: "RoadAlert — MLA Dashboard",
  description: "Road issue tracking and constituency management platform.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${inter.variable} ${barlowCondensed.variable} ${jetbrainsMono.variable} font-sans bg-background text-foreground`} suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
