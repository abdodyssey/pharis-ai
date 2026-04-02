import "./globals.css";
import { Inter } from "next/font/google";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "PharisAI - Research Structure Builder",
  description: "Asisten cerdas untuk membangun struktur riset akademik.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id">
      <body className={`${inter.className} bg-gray-50 min-h-screen`}>
        <nav className="bg-white border-b p-4 mb-6">
          <div className="max-w-7xl mx-auto flex justify-between items-center">
            <h1 className="text-xl font-bold text-blue-600">PharisAI</h1>
            <div className="text-sm text-gray-500 font-mono">
              devtective_mode: active
            </div>
          </div>
        </nav>
        {children}
      </body>
    </html>
  );
}
