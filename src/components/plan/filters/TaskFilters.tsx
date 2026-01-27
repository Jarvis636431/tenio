import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface TaskFiltersProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  jobFilter: string;
  onJobFilterChange: (value: string) => void;
  floorFilter: string;
  onFloorFilterChange: (value: string) => void;
  jobTypes: string[];
  floorTypes: string[];
}

export function TaskFilters({
  searchTerm,
  onSearchChange,
  jobFilter,
  onJobFilterChange,
  floorFilter,
  onFloorFilterChange,
  jobTypes,
  floorTypes
}: TaskFiltersProps) {
  return (
    <div className="flex items-center space-x-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
        <Input
          placeholder="搜索任务..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-10 w-64"
        />
      </div>
      <Select value={jobFilter} onValueChange={onJobFilterChange}>
        <SelectTrigger className="w-40">
          <SelectValue placeholder="选择工种" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">全部工种</SelectItem>
          {jobTypes.map(jobType => (
            <SelectItem key={jobType} value={jobType}>{jobType}</SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Select value={floorFilter} onValueChange={onFloorFilterChange}>
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="选择楼层" />
        </SelectTrigger>
        <SelectContent className="max-h-[300px]">
          <SelectItem value="all">全部楼层</SelectItem>
          {floorTypes.map(floor => (
            <SelectItem key={floor} value={floor}>
              {floor}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}