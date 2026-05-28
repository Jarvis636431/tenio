import { IsOptional, IsString, MaxLength } from "class-validator";

export class StartGenerationDto {
  @IsOptional()
  @IsString()
  @MaxLength(64)
  trigger_source?: string;
}
