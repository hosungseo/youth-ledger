import SiteNav from "@/components/SiteNav";
import SiteFooter from "@/components/SiteFooter";
import { meta } from "@/lib/data";

/** The shared chrome. Design variants under /v render bare, without it. */
export default function SiteLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <>
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:top-3 focus:left-3 focus:z-[100] focus:rounded-lg focus:bg-ink focus:px-4 focus:py-2 focus:text-[13px] focus:font-semibold focus:text-onink"
      >
        본문 바로가기
      </a>
      <SiteNav />
      <main id="main">{children}</main>
      <SiteFooter source={meta.source} />
    </>
  );
}
