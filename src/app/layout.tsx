import type { Metadata } from "next";
import { Mukta } from "next/font/google";
import "./globals.css";
import { Footer } from "@/components/footer";
import { cn } from "@/lib/utils";

const mukta = Mukta({
  subsets: ["latin-ext"],
  weight: ["200", "300", "400", "500", "600", "700", "800"],
  variable: "--font-mukta"
});

export const metadata: Metadata = {
  title: "Factly: AI Fact Checker",
  description: "Fact-checking tool powered by AI. Our AI Fact Checker uses the latest AI Tech to help you verify information quickly and easily.",
  authors: [
    {
      name: "josecortezz25",
      url: "https://github.com/josecortezz25"
    }
  ],
  metadataBase: new URL("https://factcheckerai.vercel.app/")
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={cn(mukta.className, "bg-[#212121] text-[#ececec]")}>
        {children}
        <Footer />
      </body>
    </html>
  );
}
