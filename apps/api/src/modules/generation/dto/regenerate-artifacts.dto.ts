import { IsArray, IsOptional, IsString, MaxLength } from "class-validator";

export class RegenerateArtifactsDto {
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  artifact_types?: string[] | null;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  reason?: string | null;
}
