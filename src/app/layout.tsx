import type { Metadata } from "next";
import { Mukta } from "next/font/google";
import "./globals.css";

const mukta = Mukta({
  subsets: ["latin-ext"],
  weight: ["200", "300", "400", "500", "600", "700", "800"],
  variable: "--font-mukta"
});

export const metadata: Metadata = {
  title: "Factly",
  description: "Fact-checking tool powered by AI",
  authors: [
    {
      name: "josecortezz25",
      url: "https://github.com/josecortezz25"
    }
  ]
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={mukta.className}>{children}</body>
    </html>
  );
}
