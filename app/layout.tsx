import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Web3Provider } from '@/components/Web3Provider'
import { Footer } from '@/components/footer'

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "BlockSentinel - Smart Contract Security Scanner",
  description: "AI-powered smart contract vulnerability scanner using Slither, Mythril, and Llama 3.2 for comprehensive security analysis",
  icons: {
    icon: '/icon.svg',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased flex flex-col min-h-screen`}
      >
        <Web3Provider>
          <div className="flex-1">
            {children}
          </div>
          <Footer />
        </Web3Provider>
      </body>
    </html>
  );
}
