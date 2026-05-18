import { IsNotEmpty, IsOptional, IsString } from "class-validator";

export class ListAgentSessionsDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  session_status?: string;
}
