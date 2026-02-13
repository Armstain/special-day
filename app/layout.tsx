import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "আমাদের বিশেষ দিন 💕",
  description: "ভালবাসায় সাজানো একটি রোম্যান্টিক বিশেষ দিনের অভিজ্ঞতা",
  other: {
    "google": "notranslate",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="bn" translate="no" className="notranslate">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
