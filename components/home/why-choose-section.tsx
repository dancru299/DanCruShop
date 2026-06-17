import { BadgeCheckIcon, HeadphonesIcon, RefreshCwIcon } from "lucide-react";

// Static trust bar shown right below the hero. UI-first: the items are
// hardcoded for now; promote to a configurable home-layout section later.
const WHY_CHOOSE_ITEMS = [
  { icon: BadgeCheckIcon, label: "100% mã nguồn đã kiểm tra" },
  { icon: RefreshCwIcon, label: "Cập nhật miễn phí trọn đời" },
  { icon: HeadphonesIcon, label: "Hỗ trợ kỹ thuật 24/7" },
];

export function WhyChooseSection() {
  return (
    <section className="border-b border-border/80 bg-muted/30">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-3 px-4 py-4 md:flex-row md:items-center md:gap-6">
        <p className="text-sm font-semibold whitespace-nowrap">
          Tại sao chọn DanCruShop
        </p>
        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:gap-x-6 sm:gap-y-2 md:ml-auto">
          {WHY_CHOOSE_ITEMS.map((item) => (
            <div
              key={item.label}
              className="inline-flex items-center gap-2 text-sm text-muted-foreground"
            >
              <item.icon aria-hidden="true" className="size-4 text-primary" />
              {item.label}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
