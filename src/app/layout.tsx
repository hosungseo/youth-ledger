import type { Metadata } from "next";
import "./globals.css";
import { SITE_URL } from "@/lib/site";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "청년대장 — 범정부 청년정책 인벤토리 시제품",
    template: "%s · 청년대장",
  },
  description:
    "온통청년 청년정책, 보조금24 서비스, 예산서의 청년 세부사업을 번호로 이어 본 범정부 청년정책 목록의 시제품입니다.",
  openGraph: {
    title: "청년대장 — 청년정책을 한 목록으로",
    description: "온통청년 · 보조금24 · 예산서를 번호로 이어 본 범정부 청년정책 인벤토리 시제품.",
    type: "website",
    locale: "ko_KR",
    images: [{ url: `${SITE_URL}/og.png`, width: 1200, height: 630, alt: "청년대장 — 청년정책을 한 목록으로" }],
  },
  twitter: {
    card: "summary_large_image",
    images: [`${SITE_URL}/og.png`],
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
