import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "GMAT Focus Command Center",
  description: "Adaptive learning platform targeting 705+ (98.6th percentile)",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-gray-950 text-gray-100 antialiased">
        {children}
      </body>
    </html>
  );
}
