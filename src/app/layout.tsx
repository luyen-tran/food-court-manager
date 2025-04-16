import type { Metadata } from "next";
import "./globals.css";
import { Inter } from "next/font/google";
import { cn } from "@/lib/utils";

const inter = Inter({
  subsets: ["latin", "vietnamese", "latin-ext"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "Food Court Manager",
  description: "A food court management system with QR-based food ordering, vendor and staff management, order tracking, and real-time operational monitoring.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={cn(
          "min-h-screen bg-background font-inter antialiased",
          inter.variable
        )}
      >
        {children}
      </body>
    </html>
  );
}
