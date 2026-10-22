import type { Metadata } from "next";
import Script from "next/script";
import { ThemeProvider } from "@/components/theme-provider";
import "./globals.css";

export const metadata: Metadata = {
  title: "Synapse AI Study — Your study space, in sync",
  description:
    "Your notes, AI study tools, and daily plan — finally working together. A free study workspace made for students.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className="h-full antialiased scroll-smooth" data-theme="light" suppressHydrationWarning>
      <body className="min-h-full flex flex-col">
        <Script
          id="theme-init"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{
            __html: `try{var t=localStorage.getItem("synapse-theme");document.documentElement.dataset.theme=t==="dark"?"dark":"light"}catch{document.documentElement.dataset.theme="light"}`,
          }}
        />
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
