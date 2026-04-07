import { useMemo, useState } from "react";
import { ListTodo } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { DailyProcessItem } from "@/pages/project/hooks/useDailyProcesses";

interface DailyCardProps {
  items: DailyProcessItem[];
  onItemClick?: (item: DailyProcessItem) => void;
}

export function DailyCard({ items, onItemClick }: DailyCardProps) {
  const [tab, setTab] = useState<"plan" | "actual">("plan");
  const [keyword, setKeyword] = useState("");

  const filteredItems = useMemo(() => {
    const visibleItems = tab === "plan" ? items : [];
    const normalized = keyword.trim();
    if (!normalized) return visibleItems;
    return visibleItems.filter((item) => item.name.includes(normalized));
  }, [items, keyword, tab]);

  return (
    <Card className="col-span-3 flex h-full min-h-0 min-w-0 flex-col overflow-hidden rounded-none border-cyan-400/15 bg-[rgba(4,18,37,0.82)] shadow-[0_0_0_1px_rgba(10,35,64,0.15)]">
      <CardHeader className="border-b border-cyan-400/12 bg-[rgba(2,12,27,0.74)] px-3 py-2">
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-cyan-200">
            <ListTodo className="h-3.5 w-3.5 text-cyan-300" />
            当日工序
          </CardTitle>
          <div className="inline-flex rounded-none border border-cyan-400/15 bg-[rgba(4,18,37,0.82)] p-0.5">
            <button
              type="button"
              onClick={() => setTab("plan")}
              className={`h-6 rounded-none px-2 text-[11px] transition ${
                tab === "plan"
                  ? "border-cyan-300/30 bg-cyan-400/12 text-cyan-50"
                  : "text-cyan-300/70 hover:text-cyan-200"
              }`}
            >
              计划
            </button>
            <button
              type="button"
              onClick={() => setTab("actual")}
              className={`h-6 rounded-none px-2 text-[11px] transition ${
                tab === "actual"
                  ? "border-cyan-300/30 bg-cyan-400/12 text-cyan-50"
                  : "text-cyan-300/70 hover:text-cyan-200"
              }`}
            >
              实际
            </button>
          </div>
        </div>
        <input
          type="text"
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          placeholder="搜索工序..."
          className="mt-2 h-8 w-full rounded-none border border-cyan-400/15 bg-[rgba(3,17,42,0.92)] px-2.5 text-xs text-cyan-100 placeholder:text-cyan-300/40 outline-none transition focus:border-cyan-300/35"
        />
      </CardHeader>
      <CardContent className="flex-1 min-h-0 p-3">
        <ScrollArea className="h-full">
          <div className="space-y-2">
            {filteredItems.length === 0 ? (
              <div className="border border-dashed border-cyan-400/15 bg-[rgba(2,12,27,0.46)] p-3 text-xs text-cyan-300/70">
                {keyword.trim()
                  ? "未匹配到工序"
                  : tab === "plan"
                    ? "暂无当日工序"
                    : "暂无当日实际工序"}
              </div>
            ) : (
              filteredItems.map((item) => (
                <div
                  key={item.id}
                  className={`border border-cyan-400/10 bg-[rgba(2,12,27,0.7)] p-2.5 transition ${
                    onItemClick ? "cursor-pointer hover:border-cyan-300/25 hover:bg-[rgba(8,34,67,0.92)]" : ""
                  }`}
                  onClick={() => onItemClick?.(item)}
                >
                  <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-cyan-300/55">
                    工序 {item.seqNo ?? "-"}
                  </div>
                  <div className="mt-1 text-xs leading-5 text-cyan-100">{item.name}</div>
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
