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
  title: "비나통 | 베트남 할인 쿠폰 혜택",
  description: "호치민 로컬 맛집 정보, 마사지, 이발소, 가라오케, 할인 쿠폰 제공! 베트남 여행은 비나통으로 통한다.",
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon.ico",
    apple: "/VinaTong.png",
  },
  manifest: "/manifest.json",
  openGraph: {
    type: "website",
    url: "https://www.vinatong.store",
    title: "비나통 | 베트남 할인 쿠폰 혜택",
    description: "호치민 로컬 맛집 정보, 마사지, 이발소, 가라오케, 할인 쿠폰 제공! 베트남 여행은 비나통으로 통한다.",
    siteName: "비나통 (VinaTong)",
    images: [
      {
        url: "https://www.vinatong.store/VinaTong.png",
        width: 800,
        height: 800,
        alt: "비나통 로고"
      }
    ]
  },
  verification: {
    google: [
      "bYbSYKYBfDFbFydBYz31LI-Rt27jt-KgUIPlFHvHCvE",
      "StORgx1HoF-EJ_mlvFmry94i4NmMrgbQSVn1DZeMsmo",
      "zPp0TS-92cooJWfCGnDEy2TOlK_gOqp2ka28r4-DxpE",
      "8psJa4fIznSgnvvLemUthaB77DWWYUifJJh4M93e5dg"
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
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Gowun+Batang:wght@700&family=Nanum+Myeongjo:wght@700;800&family=Noto+Serif+KR:wght@700;900&display=swap" rel="stylesheet" />
      </head>
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
