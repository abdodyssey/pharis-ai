import { ThemeProvider } from "@/components/shared/ThemeProvider";
import "./globals.css";
import { Plus_Jakarta_Sans } from "next/font/google";

import CustomToaster from "@/components/ui/Toast";
import AuthListener from "@/components/shared/AuthListener";

const jakarta = Plus_Jakarta_Sans({ 
  subsets: ["latin"], 
  variable: "--font-jakarta",
});

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id" className={jakarta.variable} suppressHydrationWarning>
      <body
        className="font-sans bg-white dark:bg-obsidian-0 min-h-screen text-slate-900 dark:text-slate-100 antialiased selection:bg-accent-lime/20 selection:text-accent-lime"
        style={{ lineHeight: "1.6" }}
        suppressHydrationWarning
      >
        <ThemeProvider>
          {children}
        </ThemeProvider>
        <AuthListener />
        <CustomToaster />
      </body>
    </html>
  );
}
