import "./globals.css";
import type { Metadata } from "next";
import Nav from "@/components/Nav";

export const metadata: Metadata = { title: "Story Studio", description: "Paste a story, get an animated video." };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link href="https://fonts.googleapis.com/css2?family=Atkinson+Hyperlegible:wght@400;700&family=Fredoka:wght@500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body>
        <div className="wrap"><Nav /></div>
        <main className="wrap">{children}</main>
      </body>
    </html>
  );
}
