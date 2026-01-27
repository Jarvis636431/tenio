import type { PlanTask } from "@/types/domain/plan";

export function usePlanExport(tasks: PlanTask[]) {
  const handleExportCSV = () => {
    if (tasks.length === 0) {
      console.warn("没有可导出的任务数据");
      return;
    }

    const csvData = tasks.map((item) => ({
      任务名称: item.task,
      施工方式: item.constructionMethod,
      工种: item.jobType || "",
      施工人数: item.workerCount,
      开始时间: item.startTime,
      结束时间: item.endTime,
      持续时长: item.duration,
      实际工作天数: item.actualWorkDays,
      是否加班: item.overtime,
      施工情况: item.constructionSituation,
      选定施工方式: item.selectedConstructionMethod,
      前置工序: item.prerequisiteProcess || "",
      直接依赖任务: item.directDependency,
      层数: item.floor,
      工程量: item.quantity,
      工程量单位: item.quantityUnit,
      材料价格: item.materialCost,
      劳动力成本: item.laborCost,
      总成本: item.totalCost,
      备注: item.remarks || "",
    }));

    const headers = Object.keys(csvData[0]);
    const csvContent = [
      headers.join(","),
      ...csvData.map((row) =>
        headers
          .map((header) => {
            const value = row[header as keyof typeof row];
            if (
              typeof value === "string" &&
              (value.includes(",") ||
                value.includes('"') ||
                value.includes("\n"))
            ) {
              return `"${value.replace(/"/g, '""')}"`;
            }
            return value;
          })
          .join(","),
      ),
    ].join("\n");

    const blob = new Blob(["\ufeff" + csvContent], {
      type: "text/csv;charset=utf-8;",
    });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `施工任务清单_${new Date().toISOString().split("T")[0]}.csv`,
    );
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return { handleExportCSV };
}
