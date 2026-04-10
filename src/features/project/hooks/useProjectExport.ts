import type { CoreGraphResponse } from "@/types/domain/schedulepro";

export function useProjectExport(_coreGraph?: CoreGraphResponse) {
  const handleExport = () => {
    // TODO: 实现导出功能
    console.log("导出功能待实现");
  };

  return { handleExport };
}
