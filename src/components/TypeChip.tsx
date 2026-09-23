import { typeStyle } from "@/lib/design";

export default function TypeChip({
  type,
  size = "sm",
}: {
  type: string;
  size?: "sm" | "md";
}) {
  const s = typeStyle(type);
  return (
    <span
      className={`inline-flex shrink-0 items-center gap-1.5 rounded-full font-semibold ${
        size === "md" ? "px-3 py-1.5 text-[13px]" : "px-2.5 py-1 text-[11.5px]"
      }`}
      style={{ backgroundColor: s.tile, color: s.fg }}
    >
      <span
        className="h-1.5 w-1.5 rounded-full"
        style={{ backgroundColor: s.fill }}
        aria-hidden
      />
      {size === "md" ? s.label : s.short}
    </span>
  );
}
