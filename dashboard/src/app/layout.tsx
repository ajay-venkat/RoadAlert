import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "RoadWatch AI — Pothole Detection Dashboard",
  description:
    "AI-powered road pothole detection and civic reporting platform. Monitor, track, and manage road damage detections in real-time.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
