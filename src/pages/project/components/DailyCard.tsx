import { useMemo, useState } from "react";
import { ListTodo } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { DailyProcessItem } from "@/pages/project/hooks/useDailyProcesses";

interface DailyCardProps {
  items: DailyProcessItem[];
}

export function DailyCard({ items }: DailyCardProps) {
  const [tab, setTab] = useState<"plan" | "actual">("plan");
  const [keyword, setKeyword] = useState("");

  const visibleItems = tab === "plan" ? items : [];

  const filteredItems = useMemo(() => {
    const normalized = keyword.trim();
    if (!normalized) return visibleItems;
    return visibleItems.filter((item) => item.name.includes(normalized));
  }, [keyword, visibleItems]);

  return (
    <Card className="col-span-3 min-w-0 flex h-full min-h-0 flex-col overflow-hidden border-cyan-900/40 bg-[#071a39]/75">
      <CardHeader className="p-2 pb-1 bg-[#04142d]/80">
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="text-xs font-medium text-cyan-200 flex items-center gap-1.5">
            <ListTodo className="h-3.5 w-3.5 text-cyan-300" />
            当日工序
          </CardTitle>
          <div className="inline-flex rounded-md border border-cyan-800/50 bg-[#03112a] p-0.5">
            <button
              type="button"
              onClick={() => setTab("plan")}
              className={`h-5 rounded px-2 text-[11px] transition ${
                tab === "plan"
                  ? "bg-cyan-500/20 text-cyan-100"
                  : "text-cyan-300/70 hover:text-cyan-200"
              }`}
            >
              计划
            </button>
            <button
              type="button"
              onClick={() => setTab("actual")}
              className={`h-5 rounded px-2 text-[11px] transition ${
                tab === "actual"
                  ? "bg-cyan-500/20 text-cyan-100"
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
          className="mt-1 h-7 w-full rounded-md border border-cyan-800/50 bg-[#03112a] px-2 text-xs text-cyan-100 placeholder:text-cyan-300/50 outline-none focus:border-cyan-500/70"
        />
      </CardHeader>
      <CardContent className="flex-1 min-h-0 p-2">
        <ScrollArea className="h-full">
          <div className="space-y-2">
            {filteredItems.length === 0 ? (
              <div className="rounded-md border border-dashed border-cyan-900/50 p-3 text-xs text-cyan-300/70">
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
                  className="rounded-md border border-cyan-900/40 bg-[#03112a] p-2"
                >
                  <div className="text-[11px] text-cyan-300/70">工序 {item.seqNo ?? "-"}</div>
                  <div className="text-xs leading-5 text-cyan-100">{item.name}</div>
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
