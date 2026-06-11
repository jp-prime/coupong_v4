import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "쿠퐁온라인 | 스마트한 베트남 생활의 시작",
  description: "베트남 호치민의 모든 혜택. 맛집, 마사지, 가라오케 등 엄선된 업체들의 할인 쿠폰을 확인하세요.",
  verification: {
    google: "bYbSYKYBfDFbFydBYz31LI-Rt27jt-KgUIPlFHvHCvE",
  },
};

import { AuthProvider } from '../context/AuthContext';

export default function RootLayout({ children }) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col" suppressHydrationWarning>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
