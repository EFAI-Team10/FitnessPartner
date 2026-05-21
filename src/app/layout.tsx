import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import BottomNav from "@/components/BottomNav";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Fitness Partner - AI Trainer",
  description: "Perfect your form with real-time AI posture correction.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased bg-slate-900`}
    >
      <body className="min-h-screen flex items-center justify-center bg-slate-900 text-slate-50">
        <div className="w-full max-w-md min-h-screen bg-slate-950 flex flex-col shadow-2xl relative overflow-hidden border-x border-white/5">
          <div className="flex-1 overflow-y-auto">
            {children}
          </div>
          <BottomNav />
        </div>
      </body>
    </html>
  );
}

