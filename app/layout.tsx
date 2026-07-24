import type { Metadata, Viewport } from "next";
import "./globals.css";
import { ProgressProvider } from "@/lib/client/useProgress";
import TabBar from "@/components/TabBar";

export const metadata: Metadata = {
  title: "VaatChat — Learn Gujarati",
  description:
    "A fun, research-backed, gamified way to learn Gujarati — conversation-first, for beginners starting from zero.",
};

export const viewport: Viewport = {
  themeColor: "#fbf6ec",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <ProgressProvider>
          {children}
          <TabBar />
        </ProgressProvider>
      </body>
    </html>
  );
}
