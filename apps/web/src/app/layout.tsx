import type { Metadata } from "next";
import { Nunito, Fredoka } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

const nunito = Nunito({
  variable: "--font-nunito",
  subsets: ["latin"],
});

const fredoka = Fredoka({
  variable: "--font-fredoka",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "My Pokémon",
  description: "Keep your Pokémon happy and earn badges",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${nunito.variable} ${fredoka.variable}`}>
      <body className="antialiased">
        {children}
        <Toaster richColors />
      </body>
    </html>
  );
}
