import { IsNotEmpty, IsOptional, IsString } from "class-validator";

export class IssueAgentTicketDto {
  @IsString()
  @IsNotEmpty()
  project_id!: string;

  @IsOptional()
  @IsString()
  product_code?: string;

  @IsOptional()
  @IsString()
  grant_type?: string;
}
