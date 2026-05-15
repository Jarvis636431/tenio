import { IsIn, IsOptional, IsString } from "class-validator";
import { PaginationQueryDto } from "../../../common/dto/pagination-query.dto.js";
import type { ProjectStatus } from "@tenio/shared";

const PROJECT_STATUSES: ProjectStatus[] = ["draft", "active", "archived"];

export class ListProjectsDto extends PaginationQueryDto {
  @IsOptional()
  @IsString()
  q?: string;

  @IsOptional()
  @IsString()
  @IsIn(PROJECT_STATUSES)
  status?: ProjectStatus;
}
