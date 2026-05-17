import { IsIn, IsInt, IsOptional, IsString, MaxLength, Min } from "class-validator";
import type { ProjectFileCategory } from "@tenio/shared";

const PROJECT_FILE_CATEGORIES: ProjectFileCategory[] = [
  "model",
  "drawing",
  "schedule",
  "cost",
  "contract",
  "other",
];

export class UploadInitDto {
  @IsString()
  @MaxLength(255)
  original_file_name!: string;

  @IsInt()
  @Min(1)
  file_size!: number;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  mime_type?: string;

  @IsString()
  @IsIn(PROJECT_FILE_CATEGORIES)
  category!: ProjectFileCategory;
}
