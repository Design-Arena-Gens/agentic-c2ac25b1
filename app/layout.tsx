export const metadata = {
  title: "Noir City ? 4K 24fps",
  description: "Cinematic noir scene renderer with capture"
};

import "./globals.css";
import React from "react";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

