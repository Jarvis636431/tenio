import { IsNotEmpty, IsOptional, IsString } from "class-validator";

export class ListAgentSessionsDto {
  @IsOptional()
  @IsString()
  product_code?: string;

  @IsString()
  @IsNotEmpty()
  project_id!: string;
}
