import "./globals.css";
import { Inter } from "next/font/google";

import CustomToaster from "@/components/ui/Toast";
import AuthListener from "@/components/shared/AuthListener";

const inter = Inter({ subsets: ["latin"] });

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id">
      <body className={`${inter.className} bg-slate-50 min-h-screen text-slate-900`}>
        <AuthListener />
        {children}
        <CustomToaster />
      </body>
    </html>
  );
}
