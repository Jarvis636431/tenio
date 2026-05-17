import { IsNotEmpty, IsOptional, IsString } from "class-validator";

export class AgentInitDto {
  @IsString()
  @IsNotEmpty()
  product_code!: string;

  @IsString()
  @IsNotEmpty()
  project_id!: string;

  @IsString()
  @IsNotEmpty()
  agent_ticket!: string;
}
