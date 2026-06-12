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
  title: "디시베트남 | 베트남 할인 쿠폰 혜택",
  description: "마사지, 이발소, 가라오케, 로컬 맛집 정보와 최신 할인 쿠폰 제공! 베트남 여행을 더 완벽하고 저렴하게 즐기는 방법. 지금 방문하고 무료 혜택을 누리세요.",
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
