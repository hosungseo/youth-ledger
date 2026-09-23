import type { Metadata } from "next";
import "./globals.css";
import { SITE_URL } from "@/lib/site";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "청년대장 — 2026 중앙·지방 청년정책",
    template: "%s · 청년대장",
  },
  description:
    "온통청년 청년정책 2,914건과 예산서의 청년 세부사업 6,143건을 지역·분야·시기로 한자리에서 견주어 봅니다.",
  openGraph: {
    title: "청년대장 — 2026 중앙·지방 청년정책",
    description: "온통청년 2,914건 × 예산서 6,143건, 온통청년에 없는 청년사업까지.",
    type: "website",
    locale: "ko_KR",
  },
  twitter: {
    card: "summary_large_image",
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ko">
      <body className="antialiased">{children}</body>
    </html>
  );
}
