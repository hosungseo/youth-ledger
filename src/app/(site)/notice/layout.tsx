/**
 * 기준을 마크업에 새겨 둔다. globals.css의 :root:has([data-basis])가 이걸 보고
 * 바탕색 한 벌을 통째로 갈아 끼운다. 서버에서 렌더된 속성이라 첫 프레임부터
 * 제 색이다.
 */
export default function NoticeLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return <div data-basis="notice">{children}</div>;
}
