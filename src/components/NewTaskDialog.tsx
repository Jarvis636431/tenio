import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { X } from "lucide-react";
import { Command, CommandInput } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { addProcess } from "@/services/project-service";

interface TaskItem {
  id: number;
  task: string;
  specialty: string;
  component: string;
  workerCount: number;
  jobType: string;
  totalCost: number;
  startTime: string;
  endTime: string;
  constructionSituation: string;
  prerequisiteProcess: string;
  prerequisiteTasks?: number[];
  quantity: number;
  quantityUnit: string;
  overtime: string;
  duration: string;
  actualWorkDays: number;
  constructionMethod: string;
  directDependency: string;
  dependentTasks?: number[];
  remarks: string;
  selectedConstructionMethod: string;
  materialCost: number;
  laborCost: number;
  floor: number;
}

interface NewTaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAdd: (task: Partial<TaskItem>) => void;
  existingTasks: TaskItem[];
  projectId: string;
}

export function NewTaskDialog({ open, onOpenChange, onAdd, existingTasks, projectId }: NewTaskDialogProps) {
  const { toast } = useToast();
  const { token } = useAuth();
  const [formData, setFormData] = useState({
    task: '',
    startTime: '',
    endTime: '',
    workerCount: 0,
    jobType: '',
    team: '',
    totalCost: '' as number | '',
    prerequisiteTasks: [] as number[],
    dependentTasks: [] as number[],
    remarks: '',
    duration: '',
    constructionMethod: '',
  });

  const [prerequisiteOpen, setPrerequisiteOpen] = useState(false);
  const [dependentOpen, setDependentOpen] = useState(false);
  const [prerequisiteSearch, setPrerequisiteSearch] = useState('');
  const [dependentSearch, setDependentSearch] = useState('');
  // 分批加载可见数量（每次增加100条）
  const [prerequisiteVisible, setPrerequisiteVisible] = useState(100);
  const [dependentVisible, setDependentVisible] = useState(100);

  // 二次确认弹窗
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingTask, setPendingTask] = useState<Partial<TaskItem> | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 工种选项
  const jobTypes = [
    "钢筋工", "混凝土工", "木工", "测量员", "土方工", 
    "砌筑工", "抹灰工", "防水工", "水电工", "油漆工", 
    "油工", "瓦工", "不限"
  ];

  // 班组选项（可根据需要扩充或改为从外部传入）
  const teams = [
    "未指定", "一班组", "二班组", "三班组", "钢筋班组", "木工班组", "水电班组"
  ];

  // 过滤前置任务选项
  const filteredPrerequisiteTasks = existingTasks.filter(task => 
    task.task.toLowerCase().includes(prerequisiteSearch.toLowerCase()) &&
    !formData.prerequisiteTasks.includes(task.id)
  );
  const displayPrerequisiteTasks = filteredPrerequisiteTasks.slice(0, prerequisiteVisible);

  // 过滤后置任务选项
  const filteredDependentTasks = existingTasks.filter(task => 
    task.task.toLowerCase().includes(dependentSearch.toLowerCase()) &&
    !formData.dependentTasks.includes(task.id)
  );
  const displayDependentTasks = filteredDependentTasks.slice(0, dependentVisible);

  // 当搜索或面板重新打开时，重置可见数量
  useEffect(() => { setPrerequisiteVisible(100); }, [prerequisiteSearch, prerequisiteOpen]);
  useEffect(() => { setDependentVisible(100); }, [dependentSearch, dependentOpen]);

  const handlePrerequisiteScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const target = e.currentTarget;
    if (target.scrollTop + target.clientHeight >= target.scrollHeight - 8) {
      setPrerequisiteVisible(v => v + 100);
    }
  };

  const handleDependentScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const target = e.currentTarget;
    if (target.scrollTop + target.clientHeight >= target.scrollHeight - 8) {
      setDependentVisible(v => v + 100);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.task) return;

    const durationValue = Number(formData.duration);
    if (!durationValue || durationValue <= 0) {
      toast({
        title: "请输入有效工期",
        description: "工期需要大于 0",
        variant: "destructive",
      });
      return;
    }

    const newTask: Partial<TaskItem> = {
      task: formData.task,
      startTime: formData.startTime,
      endTime: formData.endTime,
      workerCount: formData.workerCount,
      jobType: formData.jobType,
      prerequisiteTasks: [...formData.prerequisiteTasks],
      dependentTasks: [...formData.dependentTasks],
      prerequisiteProcess: formData.prerequisiteTasks.join(', '),
      directDependency: formData.dependentTasks.join(', '),
      remarks: `${formData.team && formData.team !== '未指定' ? `指定班组: ${formData.team}。` : ''}${formData.remarks}`,
      specialty: "结构",
      component: "自定义",
      totalCost: Number(formData.totalCost) || 0,
      constructionSituation: "标准层施工",
      quantity: 0,
      quantityUnit: "个",
      overtime: "否",
      duration: `${durationValue}天`,
      actualWorkDays: 1,
      constructionMethod: formData.constructionMethod || "人工",
      selectedConstructionMethod: formData.constructionMethod || "人工",
      materialCost: 0,
      laborCost: 0,
      floor: 1
    };
    // 打开二次确认弹窗，展示影响摘要
    setPendingTask(newTask);
    setConfirmOpen(true);
  };

  const resetForm = () => {
    setFormData({
      task: '',
      startTime: '',
      endTime: '',
      workerCount: 0,
      jobType: '',
      team: '',
      totalCost: '',
      prerequisiteTasks: [],
      dependentTasks: [],
      remarks: '',
      duration: '',
      constructionMethod: '',
    });
    setPrerequisiteSearch('');
    setDependentSearch('');
  };

  const doCreate = async (updatePlan: boolean) => {
    if (!pendingTask) return;

    if (!projectId) {
      toast({
        title: "缺少项目",
        description: "请先选择项目后再新增工序",
        variant: "destructive",
      });
      return;
    }

    if (!token) {
      toast({
        title: "登录已失效",
        description: "请重新登录后再尝试",
        variant: "destructive",
      });
      return;
    }

    const durationValue = Number(formData.duration) || 1;

    setIsSubmitting(true);
    try {
      await addProcess(
        {
          project_id: projectId,
          construction_process: pendingTask.task ?? formData.task,
          duration: durationValue,
          construction_method: formData.constructionMethod || undefined,
          workers_count: pendingTask.workerCount,
          work_type: formData.jobType || undefined,
          predecessor_processes: pendingTask.prerequisiteProcess?.replace(/\s+/g, '') || undefined,
          successor_processes: pendingTask.directDependency?.replace(/\s+/g, '') || undefined,
          description: formData.remarks || undefined,
        },
        token
      );

      onAdd(pendingTask);
      toast({
        title: "已新增工序",
        description: updatePlan ? "已创建并更新施工计划" : "工序已成功创建",
      });

      setConfirmOpen(false);
      setPendingTask(null);
      resetForm();
      onOpenChange(false);

      if (updatePlan) {
        console.info('Create task and update plan impact');
      }
    } catch (error) {
      toast({
        title: "新增工序失败",
        description: error instanceof Error ? error.message : "请稍后再试",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const addPrerequisiteTask = (taskId: number) => {
    setFormData(prev => ({
      ...prev,
      prerequisiteTasks: [...prev.prerequisiteTasks, taskId]
    }));
    setPrerequisiteSearch('');
  };

  const removePrerequisiteTask = (taskId: number) => {
    setFormData(prev => ({
      ...prev,
      prerequisiteTasks: prev.prerequisiteTasks.filter(id => id !== taskId)
    }));
  };

  const addDependentTask = (taskId: number) => {
    setFormData(prev => ({
      ...prev,
      dependentTasks: [...prev.dependentTasks, taskId]
    }));
    setDependentSearch('');
  };

  const removeDependentTask = (taskId: number) => {
    setFormData(prev => ({
      ...prev,
      dependentTasks: prev.dependentTasks.filter(id => id !== taskId)
    }));
  };

  const getSelectedTaskNames = (taskIds: number[]) => {
    return taskIds.map(id => existingTasks.find(task => task.id === id)?.task).filter(Boolean);
  };

  return (
    <>
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>新增任务</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* 任务名称 */}
          <div className="space-y-2">
            <Label htmlFor="task">任务名称 *</Label>
            <Input
              id="task"
              placeholder="请输入任务名称"
              value={formData.task}
              onChange={(e) => setFormData({ ...formData, task: e.target.value })}
              required
            />
          </div>

          {/* 时间范围 */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startTime">开始时间</Label>
              <Input
                id="startTime"
                type="date"
                value={formData.startTime}
                onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="endTime">结束时间</Label>
              <Input
                id="endTime"
                type="date"
                value={formData.endTime}
                onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
              />
            </div>
          </div>

          {/* 施工人数和工种 */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="workerCount">施工人数</Label>
              <Input
                id="workerCount"
                type="number"
                min="0"
                value={formData.workerCount}
                onChange={(e) => setFormData({ ...formData, workerCount: parseInt(e.target.value) || 0 })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="jobType">工种</Label>
              <Select
                value={formData.jobType}
                onValueChange={(value) => setFormData({ ...formData, jobType: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="选择工种" />
                </SelectTrigger>
                <SelectContent>
                  {jobTypes.map(jobType => (
                    <SelectItem key={jobType} value={jobType}>{jobType}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* 工期与施工方式 */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="duration">工期（天） *</Label>
              <Input
                id="duration"
                type="number"
                min="0.1"
                step="0.1"
                value={formData.duration}
                onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="constructionMethod">施工方式</Label>
              <Input
                id="constructionMethod"
                placeholder="如：人工绑扎"
                value={formData.constructionMethod}
                onChange={(e) => setFormData({ ...formData, constructionMethod: e.target.value })}
              />
            </div>
          </div>

          {/* 指定班组 与 总成本 */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="team">指定班组</Label>
              <Select
                value={formData.team}
                onValueChange={(value) => setFormData({ ...formData, team: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="选择班组" />
                </SelectTrigger>
                <SelectContent>
                  {teams.map(team => (
                    <SelectItem key={team} value={team}>{team}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="totalCost">总成本</Label>
              <Input
                id="totalCost"
                type="number"
                min="0"
                value={formData.totalCost}
                onChange={(e) => setFormData({ ...formData, totalCost: e.target.value === '' ? '' : Number(e.target.value) })}
              />
            </div>
          </div>

          {/* 前置/后置任务 同行显示 */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>前置任务</Label>
              <div className="space-y-2">
                {/* 前置任务选择器 */}
                <Popover open={prerequisiteOpen} onOpenChange={setPrerequisiteOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={prerequisiteOpen}
                      className="w-full justify-between h-auto min-h-10 items-start hover:bg-transparent focus:bg-transparent"
                    >
                      <div className="flex flex-wrap gap-2 text-left">
                        {formData.prerequisiteTasks.length === 0 ? (
                          <span className="text-muted-foreground">搜索并选择前置任务...</span>
                        ) : (
                          getSelectedTaskNames(formData.prerequisiteTasks).map((taskName, index) => (
                            <Badge key={index} variant="secondary" className="flex items-center gap-1 bg-category-blue-100 text-category-blue-800 border-category-blue-200 hover:bg-category-blue-200 transition-colors">
                              {taskName}
                              <button
                                type="button"
                                className="h-3 w-3 cursor-pointer hover:text-category-blue-600 rounded-sm transition-colors flex items-center justify-center ml-1"
                                onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); }}
                                onClick={(e) => { 
                                  e.preventDefault(); 
                                  e.stopPropagation(); 
                                  removePrerequisiteTask(formData.prerequisiteTasks[index]); 
                                }}
                              >
                                <X className="h-2.5 w-2.5" />
                              </button>
                            </Badge>
                          ))
                        )}
                      </div>
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                    <Command>
                      <CommandInput 
                        placeholder="搜索任务..." 
                        value={prerequisiteSearch}
                        onValueChange={setPrerequisiteSearch}
                      />
                      <div className="max-h-72 overflow-auto" onScroll={handlePrerequisiteScroll}>
                        <div className="p-1">
                          {displayPrerequisiteTasks.length === 0 ? (
                            <div className="py-6 text-center text-sm text-muted-foreground">未找到任务</div>
                          ) : (
                            displayPrerequisiteTasks.map((task) => (
                              <div
                                key={task.id}
                                className="flex items-center px-2 py-1.5 text-sm rounded-sm hover:bg-accent hover:text-accent-foreground cursor-pointer"
                                onClick={() => addPrerequisiteTask(task.id)}
                              >
                                <Check className={cn("mr-2 h-4 w-4", formData.prerequisiteTasks.includes(task.id) ? "opacity-100" : "opacity-0")} />
                                {task.task}
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            <div className="space-y-2">
              <Label>后置任务</Label>
              <div className="space-y-2">
                {/* 后置任务选择器 */}
                <Popover open={dependentOpen} onOpenChange={setDependentOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={dependentOpen}
                      className="w-full justify-between h-auto min-h-10 items-start hover:bg-transparent focus:bg-transparent"
                    >
                      <div className="flex flex-wrap gap-2 text-left">
                        {formData.dependentTasks.length === 0 ? (
                          <span className="text-muted-foreground">搜索并选择后置任务...</span>
                        ) : (
                          getSelectedTaskNames(formData.dependentTasks).map((taskName, index) => (
                            <Badge key={index} variant="secondary" className="flex items-center gap-1 bg-category-green-100 text-category-green-800 border-category-green-200 hover:bg-category-green-200 transition-colors">
                              {taskName}
                              <button
                                type="button"
                                className="h-3 w-3 cursor-pointer hover:text-category-green-600 rounded-sm transition-colors flex items-center justify-center ml-1"
                                onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); }}
                                onClick={(e) => { 
                                  e.preventDefault(); 
                                  e.stopPropagation(); 
                                  removeDependentTask(formData.dependentTasks[index]); 
                                }}
                              >
                                <X className="h-2.5 w-2.5" />
                              </button>
                            </Badge>
                          ))
                        )}
                      </div>
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                    <Command>
                      <CommandInput 
                        placeholder="搜索任务..." 
                        value={dependentSearch}
                        onValueChange={setDependentSearch}
                      />
                      <div className="max-h-72 overflow-auto" onScroll={handleDependentScroll}>
                        <div className="p-1">
                          {displayDependentTasks.length === 0 ? (
                            <div className="py-6 text-center text-sm text-muted-foreground">未找到任务</div>
                          ) : (
                            displayDependentTasks.map((task) => (
                              <div
                                key={task.id}
                                className="flex items-center px-2 py-1.5 text-sm rounded-sm hover:bg-accent hover:text-accent-foreground cursor-pointer"
                                onClick={() => addDependentTask(task.id)}
                              >
                                <Check className={cn("mr-2 h-4 w-4", formData.dependentTasks.includes(task.id) ? "opacity-100" : "opacity-0")} />
                                {task.task}
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          </div>

          {/* 补充说明 */}
          <div className="space-y-2">
            <Label htmlFor="remarks">补充说明</Label>
            <Textarea
              id="remarks"
              placeholder="请输入任务的补充说明..."
              value={formData.remarks}
              onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
              rows={3}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              取消
            </Button>
            <Button type="submit">
              创建任务
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>

    {/* 二次确认：展示影响摘要 */}
    <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
      <DialogContent className="sm:max-w-[560px]">
        <DialogHeader>
          <DialogTitle>是否根据新增任务更新整体计划？</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 text-sm">
          <div className="text-muted-foreground">以下为本次新增任务的预估影响（模拟数据）：</div>
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 rounded-md bg-muted/40">
              <div className="text-xs text-muted-foreground">影响后续工序</div>
              <div className="text-base font-medium">{(formData.dependentTasks?.length || 0) + 2} 道</div>
            </div>
            <div className="p-3 rounded-md bg-muted/40">
              <div className="text-xs text-muted-foreground">整体资金变化</div>
              <div className="text-base font-medium">¥{Number(formData.totalCost || 0).toLocaleString()}</div>
            </div>
            <div className="p-3 rounded-md bg-muted/40">
              <div className="text-xs text-muted-foreground">工期变化</div>
              <div className="text-base font-medium">+{Number(formData.duration) || 1} 天</div>
            </div>
            <div className="p-3 rounded-md bg-muted/40">
              <div className="text-xs text-muted-foreground">资源占用（人数）</div>
              <div className="text-base font-medium">{formData.workerCount || 0} 人</div>
            </div>
          </div>
          <div className="text-xs text-muted-foreground">最终以调度计算为准，本摘要为参考估算。</div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => doCreate(false)} disabled={isSubmitting}>
            {isSubmitting ? "处理中..." : "仅创建任务"}
          </Button>
          <Button onClick={() => doCreate(true)} disabled={isSubmitting}>
            {isSubmitting ? "处理中..." : "创建并更新计划"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
    </>
  );
}
