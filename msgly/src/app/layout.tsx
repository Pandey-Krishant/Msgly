import type { Metadata } from "next";

import "./globals.css";
import SessionWrapper from "@/components/SessionWrapper";


export const metadata: Metadata = {
  title: "Msgly",
  description: "Secure, end-to-end encrypted private messaging.",
  manifest: "/manifest.json",
  themeColor: "#2563eb",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
       
      >
        <SessionWrapper>
          {children}
        </SessionWrapper>
      </body>
    </html>
  );
}
