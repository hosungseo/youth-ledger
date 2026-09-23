/** 재정 기준은 어두운 판이다. 이유는 notice/layout.tsx에 적었다. */
export default function FiscalLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return <div data-basis="fiscal">{children}</div>;
}
