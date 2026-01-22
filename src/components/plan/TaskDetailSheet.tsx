import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import type { PlanTask } from "@/types/domain/plan";

interface TaskDetailSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedItem: PlanTask | null;
  isEditMode: boolean;
  editedItem: PlanTask | null;
  onEditClick: (item: PlanTask) => void;
  onSaveEdit: () => void;
  onCancelEdit: () => void;
  onEditedItemChange: (item: PlanTask | null) => void;
}

export function TaskDetailSheet({
  open,
  onOpenChange,
  selectedItem,
  isEditMode,
  editedItem,
  onEditClick,
  onSaveEdit,
  onCancelEdit,
  onEditedItemChange,
}: TaskDetailSheetProps) {
  // 检测内容是否有变化
  const hasChanges = useMemo(() => {
    if (!isEditMode || !selectedItem || !editedItem) return false;

    // 比较所有字段是否有变化
    const fieldsToCompare: (keyof PlanTask)[] = [
      "task",
      "specialty",
      "component",
      "workerCount",
      "jobType",
      "totalCost",
      "startTime",
      "endTime",
      "constructionSituation",
      "prerequisiteProcess",
      "quantity",
      "quantityUnit",
      "overtime",
      "duration",
      "actualWorkDays",
      "constructionMethod",
      "directDependency",
      "remarks",
      "selectedConstructionMethod",
      "materialCost",
      "laborCost",
      "floor",
    ];

    return fieldsToCompare.some((field) => {
      const originalValue = selectedItem[field];
      const editedValue = editedItem[field];

      // 处理数字类型的比较
      if (
        typeof originalValue === "number" &&
        typeof editedValue === "number"
      ) {
        return originalValue !== editedValue;
      }

      // 处理字符串类型的比较
      return String(originalValue || "") !== String(editedValue || "");
    });
  }, [isEditMode, selectedItem, editedItem]);

  // 渲染字段的辅助函数
  const renderField = (label: string, value: string, field: keyof PlanTask) => {
    if (isEditMode && editedItem) {
      return (
        <div>
          <label className="text-sm font-medium text-muted-foreground">
            {label}
          </label>
          <Input
            value={String(editedItem[field] || "")}
            onChange={(e) =>
              onEditedItemChange(
                editedItem ? { ...editedItem, [field]: e.target.value } : null,
              )
            }
            className="mt-1"
          />
        </div>
      );
    }
    return (
      <div>
        <label className="text-sm font-medium text-muted-foreground">
          {label}
        </label>
        <p className="text-sm">{value}</p>
      </div>
    );
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-[600px] sm:max-w-[600px] flex flex-col"
        showOverlay={false}
      >
        <SheetHeader className="flex-shrink-0">
          <SheetTitle>
            {isEditMode ? "编辑任务" : "任务详情"} - {selectedItem?.task}
          </SheetTitle>
        </SheetHeader>
        <div className="mt-6 overflow-y-auto flex-1 min-h-0">
          {selectedItem && (
            <div className="space-y-6 pb-20">
              {/* 施工时间 */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">施工时间</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    {renderField(
                      "开始时间",
                      selectedItem.startTime,
                      "startTime",
                    )}
                    {renderField("结束时间", selectedItem.endTime, "endTime")}
                    {renderField(
                      "持续时长",
                      selectedItem.duration || "",
                      "duration",
                    )}
                    {renderField(
                      "是否加班",
                      selectedItem.overtime || "",
                      "overtime",
                    )}
                    {renderField(
                      "施工情况",
                      selectedItem.constructionSituation || "",
                      "constructionSituation",
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* 基础信息 */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">基础信息</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    {renderField("任务名称", selectedItem.task, "task")}
                    {renderField(
                      "施工方式",
                      selectedItem.constructionMethod || "",
                      "constructionMethod",
                    )}
                    {renderField(
                      "工种",
                      selectedItem.jobType || "无",
                      "jobType",
                    )}
                    {renderField(
                      "施工人数",
                      String(selectedItem.workerCount),
                      "workerCount",
                    )}
                    {renderField(
                      "层数",
                      `${selectedItem.floor || 0}层`,
                      "floor",
                    )}
                    {renderField(
                      "选定施工方式",
                      selectedItem.selectedConstructionMethod || "",
                      "selectedConstructionMethod",
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* 更多信息 */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">更多信息</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    {renderField(
                      "前置工序",
                      selectedItem.prerequisiteProcess || "无",
                      "prerequisiteProcess",
                    )}
                    {renderField(
                      "直接依赖任务",
                      selectedItem.directDependency || "",
                      "directDependency",
                    )}
                    <div className="col-span-2">
                      {renderField(
                        "备注",
                        selectedItem.remarks || "无",
                        "remarks",
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>

        {/* 固定在底部的操作按钮 */}
        {selectedItem && (
          <div className="absolute bottom-0 left-0 right-0 bg-white border-t p-4 flex justify-end gap-2">
            {isEditMode ? (
              <>
                <Button
                  variant="ghost"
                  className="text-primary hover:text-primary hover:bg-primary/10"
                  onClick={onCancelEdit}
                >
                  取消
                </Button>
                <Button
                  variant="ghost"
                  className="text-primary hover:text-primary hover:bg-primary/10"
                  onClick={onSaveEdit}
                  disabled={!hasChanges}
                >
                  保存
                </Button>
              </>
            ) : (
              <Button
                variant="ghost"
                className="text-primary hover:text-primary hover:bg-primary/10"
                onClick={() => onEditClick(selectedItem)}
              >
                编辑
              </Button>
            )}
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
