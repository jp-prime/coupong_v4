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
  title: "디시베트남 | 베트남 업소 디시 할인쿠폰 & 업소 무료 홍보 플랫폼",
  description: "베트남 호치민, 하노이의 맛집, 마사지, 가라오케 등 다양한 베트남 업소 정보와 할인 쿠폰, 그리고 업주를 위한 무료 홍보 혜택을 제공합니다.",
  verification: {
    google: [
      "bYbSYKYBfDFbFydBYz31LI-Rt27jt-KgUIPlFHvHCvE",
      "StORgx1HoF-EJ_mlvFmry94i4NmMrgbQSVn1DZeMsmo",
      "zPp0TS-92cooJWfCGnDEy2TOlK_gOqp2ka28r4-DxpE"
    ],
  },
};

import { AuthProvider } from '../context/AuthContext';
import BottomNav from '../components/layout/BottomNav';
import { Analytics } from '@vercel/analytics/next';
import { SpeedInsights } from '@vercel/speed-insights/next';

export default function RootLayout({ children }) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col pb-[70px]" suppressHydrationWarning>
        <AuthProvider>
          {children}
          <BottomNav />
        </AuthProvider>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
